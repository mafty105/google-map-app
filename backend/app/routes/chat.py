"""Chat API endpoints."""

import logging
import re

from fastapi import APIRouter, HTTPException, status

from app.models.api import (
    ChatMessageRequest,
    ChatMessageResponse,
    CreateSessionResponse,
    ErrorResponse,
    SessionHistoryResponse,
)
from app.models.conversation import ConversationState, Location, TravelTime
from app.services.conversation_manager import conversation_manager
from app.services.vertex_ai import vertex_ai_service
from app.services.prompts import build_plan_generation_prompt
from app.services.google_maps import google_maps_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _convert_location_to_dict(location) -> dict:
    """Convert Location object or dict to dict format."""
    if not location:
        return {
            "address": "東京駅",
            "lat": 35.6812,
            "lng": 139.7671,
        }

    if isinstance(location, dict):
        return {
            "address": location.get("address", "東京駅"),
            "lat": location.get("lat", 35.6812),
            "lng": location.get("lng", 139.7671),
        }
    else:
        return {
            "address": location.address or "東京駅",
            "lat": location.lat or 35.6812,
            "lng": location.lng or 139.7671,
        }


def _extract_place_descriptions(plan_text: str) -> dict[str, str]:
    """
    Extract place descriptions from plan text.

    Args:
        plan_text: Generated plan text from Vertex AI with markdown format

    Returns:
        Dict mapping place names to their descriptions
    """
    descriptions = {}

    # Split by ### headers to get each place section
    sections = re.split(r'(###\s*\d+\.\s*\*?\*?[^\n*]+\*?\*?)', plan_text)

    # Process sections in pairs (header, content)
    for i in range(1, len(sections), 2):
        if i + 1 < len(sections):
            header = sections[i]
            content = sections[i + 1]

            # Extract place name from header
            name_match = re.search(r'###\s*\d+\.\s*\*?\*?([^\n*]+)\*?\*?', header)
            if name_match:
                place_name = name_match.group(1).strip()
                # Store the full description (header + content)
                descriptions[place_name] = (header + content).strip()

    logger.info(f"Extracted descriptions for {len(descriptions)} places")
    return descriptions


def _extract_and_enrich_places(plan_text: str, location_bias: tuple[float, float] | None = None) -> list[dict]:
    """
    Extract facility names from plan text and enrich with Google Places data.

    Args:
        plan_text: Generated plan text from Vertex AI
        location_bias: Optional (lat, lng) to bias search results

    Returns:
        List of enriched place dicts with photos, ratings, etc.
    """
    # Extract place descriptions first
    place_descriptions = _extract_place_descriptions(plan_text)

    # Extract facility names using regex pattern: ### 1. [施設名]
    pattern = r'###\s*\d+\.\s*\*?\*?([^\n*]+)\*?\*?'
    matches = re.findall(pattern, plan_text)

    enriched_places = []

    for facility_name in matches:
        facility_name = facility_name.strip()
        if not facility_name:
            continue

        try:
            logger.info(f"Looking up place: {facility_name}")

            # Find place by name
            place = google_maps_service.find_place_by_text(
                query=facility_name,
                location_bias=location_bias,
            )

            if not place:
                logger.warning(f"Place not found: {facility_name}")
                continue

            place_id = place["place_id"]

            # Get detailed information including photos and reviews
            details = google_maps_service.get_place_details(
                place_id=place_id,
                fields=[
                    "name",
                    "formatted_address",
                    "geometry",
                    "rating",
                    "user_ratings_total",
                    "photo",
                    "opening_hours",
                    "website",
                    "formatted_phone_number",
                    "type",
                    "review",
                ],
            )

            # Extract photo URL if available
            photo_url = None
            if details.get("photos"):
                # Use the first photo
                photo_reference = details["photos"][0].get("photo_reference")
                if photo_reference:
                    # Build photo URL (400px width)
                    photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference={photo_reference}&key={google_maps_service.client.key}"

            # Extract top reviews (max 5)
            reviews = []
            if details.get("reviews"):
                for review in details["reviews"][:5]:
                    reviews.append({
                        "author_name": review.get("author_name"),
                        "rating": review.get("rating"),
                        "text": review.get("text"),
                        "time": review.get("time"),
                        "relative_time_description": review.get("relative_time_description"),
                    })

            # Get LLM description for this place
            llm_description = place_descriptions.get(facility_name)

            enriched_place = {
                "id": place_id,
                "place_id": place_id,
                "name": details.get("name", facility_name),
                "formatted_address": details.get("formatted_address"),
                "location": details.get("geometry", {}).get("location"),
                "rating": details.get("rating"),
                "user_ratings_total": details.get("user_ratings_total"),
                "photo_url": photo_url,
                "opening_hours": details.get("opening_hours"),
                "website": details.get("website"),
                "phone": details.get("formatted_phone_number"),
                "types": details.get("types", []),
                "reviews": reviews if reviews else None,
                "llm_description": llm_description,
            }

            enriched_places.append(enriched_place)
            logger.info(f"Enriched place: {enriched_place['name']} with photo: {photo_url is not None}, description: {llm_description is not None}")

        except Exception as e:
            logger.error(f"Failed to enrich place '{facility_name}': {e}", exc_info=True)
            # Continue with next place instead of failing entirely
            continue

    return enriched_places


@router.post("/session", response_model=CreateSessionResponse)
async def create_session() -> CreateSessionResponse:
    """Create a new conversation session."""
    session = conversation_manager.create_session()

    # Don't add greeting here - let frontend handle it
    # This avoids duplicate messages

    logger.info(f"Created new session: {session.session_id}")

    return CreateSessionResponse(
        session_id=session.session_id,
        message="Session created successfully"
    )


@router.post("", response_model=ChatMessageResponse, responses={404: {"model": ErrorResponse}})
async def send_message(request: ChatMessageRequest) -> ChatMessageResponse:
    """Send a message in the conversation."""
    session = conversation_manager.get_session(request.session_id)

    if not session:
        logger.warning(f"Session not found: {request.session_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    # Add user message
    conversation_manager.add_user_message(request.session_id, request.message)

    # Determine response based on current state
    response_message, quick_replies, enriched_places = _generate_response(session, request.message)

    # Add assistant response
    conversation_manager.add_assistant_message(request.session_id, response_message)

    logger.info(f"Session {request.session_id}: Processed message in state {session.state}")

    return ChatMessageResponse(
        session_id=request.session_id,
        response=response_message,
        enriched_places=enriched_places,
        state=session.state.value,
        quick_replies=quick_replies
    )


@router.get("/session/{session_id}", response_model=SessionHistoryResponse)
async def get_session_history(session_id: str) -> SessionHistoryResponse:
    """Get conversation history for a session."""
    session = conversation_manager.get_session(session_id)

    if not session:
        logger.warning(f"Session not found: {session_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    # Format messages
    messages = [
        {
            "role": msg.role,
            "content": msg.content,
            "timestamp": msg.timestamp.isoformat()
        }
        for msg in session.conversation_history
    ]

    return SessionHistoryResponse(
        session_id=session.session_id,
        state=session.state.value,
        messages=messages,
        created_at=session.created_at,
        last_updated=session.last_updated
    )


def _generate_response(session, user_message: str) -> tuple[str, list[str] | None, list[dict] | None]:
    """Generate response based on conversation state and user input.

    Returns:
        Tuple of (response_message, quick_replies, enriched_places)
    """

    logger.info(f"_generate_response called: state={session.state}, message='{user_message[:50]}'")

    # For now, just handle the gathering preferences state
    # This will be enhanced with Vertex AI in Issue #4

    if session.state == ConversationState.INITIAL:
        logger.info("State is INITIAL - extracting preferences from free-form input")
        import re

        # Check if message contains coordinates (from "Use Current Location" button)
        coord_match = re.search(r'緯度:\s*(-?\d+\.\d+).*経度:\s*(-?\d+\.\d+)', user_message)

        if coord_match:
            # Handle current location button
            lat = float(coord_match.group(1))
            lng = float(coord_match.group(2))

            conversation_manager.update_preferences(
                session.session_id,
                location=Location(address="現在地", lat=lat, lng=lng)
            )
            logger.info(f"Set current location: ({lat}, {lng})")

        # Extract preferences from free-form input using AI
        # (even if coordinates were detected, the message might contain more info)
        try:
            extracted = vertex_ai_service.extract_preferences_from_freeform(user_message)
            logger.info(f"Extracted from free-form: {extracted}")

            # Update preferences with extracted data
            # Only update location if we didn't already set it from coordinates
            if extracted.get("location", {}).get("address") and not coord_match:
                conversation_manager.update_preferences(
                    session.session_id,
                    location=Location(address=extracted["location"]["address"], lat=None, lng=None)
                )

            if extracted.get("travel_time", {}).get("value"):
                travel_time_data = extracted["travel_time"]
                conversation_manager.update_preferences(
                    session.session_id,
                    travel_time=TravelTime(
                        value=travel_time_data["value"],
                        unit=travel_time_data.get("unit", "minutes"),
                        direction=travel_time_data.get("direction", "one-way")
                    )
                )

            if extracted.get("activity_type"):
                conversation_manager.update_preferences(
                    session.session_id,
                    activity_type=extracted["activity_type"]
                )

            if extracted.get("child_age"):
                conversation_manager.update_preferences(
                    session.session_id,
                    child_age=extracted["child_age"]
                )

            if extracted.get("transportation"):
                conversation_manager.update_preferences(
                    session.session_id,
                    transportation=extracted["transportation"]
                )

            if extracted.get("meals"):
                conversation_manager.update_preferences(
                    session.session_id,
                    meals=extracted["meals"]
                )

            # Transition to FREE_INPUT or directly to plan generation
            session = conversation_manager.get_session(session.session_id)

            # Check if we can generate plan now
            if extracted.get("enough_to_generate") and conversation_manager.has_sufficient_preferences(session):
                # Try to generate plan directly
                conversation_manager.transition_state(
                    session.session_id,
                    ConversationState.GENERATING_PLAN
                )
                # Re-call _generate_response to handle plan generation
                return _generate_response(session, user_message)
            else:
                # Need more info - transition to FREE_INPUT
                conversation_manager.transition_state(
                    session.session_id,
                    ConversationState.FREE_INPUT
                )

                # Get critical missing info
                missing_info = conversation_manager.get_critical_missing_info(session)
                if missing_info:
                    # Generate a clarifying question
                    from app.services.prompts import PromptTemplates
                    prefs_dict = {
                        "location": {"address": session.user_preferences.location.address},
                        "travel_time": session.user_preferences.travel_time.value if session.user_preferences.travel_time else None,
                        "activity_type": session.user_preferences.activity_type,
                        "child_age": session.user_preferences.child_age,
                    }

                    # For now, use a simple question based on first missing item
                    priority_item = missing_info[0]
                    quick_replies = []

                    if priority_item == "location":
                        question = "どちらから出発されますか？"
                        quick_replies = []
                    elif priority_item == "child_age":
                        question = "お子様は何歳ですか？"
                        quick_replies = ["0-2歳", "3-5歳", "6-8歳", "9-12歳", "その他"]
                    elif priority_item == "transportation":
                        question = "移動手段は車と公共交通機関、どちらをご利用予定ですか？"
                        quick_replies = ["車", "電車・バス"]
                    elif priority_item == "travel_time":
                        question = "移動時間はどのくらいまで大丈夫ですか？（片道）"
                        quick_replies = ["30分以内", "1時間以内", "2時間以内"]
                    else:
                        question = "他に希望はありますか？"
                        quick_replies = []

                    return (question, quick_replies, None)
                else:
                    # Shouldn't reach here, but just in case
                    return ("ありがとうございます。プランを作成しますね。", [], None)

        except Exception as e:
            logger.error(f"Failed to extract preferences: {e}")
            # Fall back to asking for location
            conversation_manager.transition_state(
                session.session_id,
                ConversationState.FREE_INPUT
            )
            return (
                "どこへ行きたいか、もう少し詳しく教えていただけますか？\n例：「新宿から1時間くらいで行ける子供向けの場所」",
                [],
                None
            )

    elif session.state == ConversationState.FREE_INPUT:
        logger.info("State is FREE_INPUT - processing additional user input")
        import re

        # First, try simple keyword matching for quick replies
        prefs = session.user_preferences
        keyword_matched = False

        # Handle transportation keywords
        if "車" in user_message or "car" in user_message.lower():
            if "ある" in user_message or "あり" in user_message or "使える" in user_message or user_message.strip() == "車":
                conversation_manager.update_preferences(
                    session.session_id,
                    transportation="car"
                )
                keyword_matched = True
                logger.info("Matched transportation keyword: car")
        elif "電車" in user_message or "公共交通" in user_message or "バス" in user_message or "電車・バス" in user_message:
            conversation_manager.update_preferences(
                session.session_id,
                transportation="public"
            )
            keyword_matched = True
            logger.info("Matched transportation keyword: public")

        # Handle child age patterns
        if "歳" in user_message or "才" in user_message:
            age_match = re.search(r'(\d+(?:-\d+)?)[歳才]', user_message)
            if age_match:
                conversation_manager.update_preferences(
                    session.session_id,
                    child_age=age_match.group(1)
                )
                keyword_matched = True
                logger.info(f"Matched child age: {age_match.group(1)}")

        # Handle travel time patterns
        if "分" in user_message and any(char.isdigit() for char in user_message):
            time_match = re.search(r'(\d+)\s*分', user_message)
            if time_match:
                conversation_manager.update_preferences(
                    session.session_id,
                    travel_time=TravelTime(value=int(time_match.group(1)), unit="minutes", direction="one-way")
                )
                keyword_matched = True
                logger.info(f"Matched travel time: {time_match.group(1)} minutes")
        elif "時間" in user_message and any(char.isdigit() for char in user_message):
            time_match = re.search(r'(\d+)\s*時間', user_message)
            if time_match:
                conversation_manager.update_preferences(
                    session.session_id,
                    travel_time=TravelTime(value=int(time_match.group(1)) * 60, unit="minutes", direction="one-way")
                )
                keyword_matched = True
                logger.info(f"Matched travel time: {time_match.group(1)} hours")

        # Refresh session after keyword matching
        session = conversation_manager.get_session(session.session_id)
        if not session:
            logger.error("Session not found after keyword matching")
            return ("セッションが見つかりません。もう一度お試しください。", [], None)

        # Check if we have enough to generate after keyword matching
        if conversation_manager.has_sufficient_preferences(session):
            # We have location + (activity_type OR travel_time), which is enough
            # Only check if there are truly critical missing pieces
            missing_info = conversation_manager.get_critical_missing_info(session)

            if missing_info and len(missing_info) > 0:
                # Only ask for truly critical info (location or child_age if children mentioned)
                priority_item = missing_info[0]

                if priority_item == "child_age":
                    question = "お子様は何歳ですか？"
                    quick_replies = ["0-2歳", "3-5歳", "6-8歳", "9-12歳", "その他"]
                    logger.info(f"Asking for critical item: {priority_item}")
                    return (question, quick_replies, None)
                elif priority_item == "location":
                    question = "どこから出発されますか？"
                    quick_replies = []
                    logger.info(f"Asking for critical item: {priority_item}")
                    return (question, quick_replies, None)
                else:
                    # For any other items, just generate (shouldn't happen with new logic)
                    logger.info(f"Unexpected missing item {priority_item}, generating anyway")

            # Ready to generate!
            logger.info("Sufficient preferences collected, transitioning to GENERATING_PLAN")
            conversation_manager.transition_state(
                session.session_id,
                ConversationState.GENERATING_PLAN
            )
            return _generate_response(session, user_message)

        # If keyword matching didn't provide enough info, try AI extraction
        # This handles complex natural language inputs
        if not keyword_matched:
            try:
                logger.info("Using AI extraction for complex input")
                extracted = vertex_ai_service.extract_preferences_from_freeform(user_message)
                logger.info(f"Extracted additional info: {extracted}")

                # Update preferences with new data (merge with existing)
                prefs = session.user_preferences  # Refresh prefs

                if extracted.get("location", {}).get("address") and extracted["location"].get("explicit"):
                    # Only override location if explicitly mentioned
                    conversation_manager.update_preferences(
                        session.session_id,
                        location=Location(address=extracted["location"]["address"], lat=None, lng=None)
                    )

                if extracted.get("travel_time", {}).get("value") and not prefs.travel_time:
                    # Only use AI extraction if we don't already have travel_time from keyword matching
                    travel_time_data = extracted["travel_time"]
                    conversation_manager.update_preferences(
                        session.session_id,
                        travel_time=TravelTime(
                            value=travel_time_data["value"],
                            unit=travel_time_data.get("unit", "minutes"),
                            direction=travel_time_data.get("direction", "one-way")
                        )
                    )

                if extracted.get("activity_type"):
                    conversation_manager.update_preferences(
                        session.session_id,
                        activity_type=extracted["activity_type"]
                    )

                if extracted.get("child_age") and not prefs.child_age:
                    # Only use AI extraction if we don't already have child_age from keyword matching
                    conversation_manager.update_preferences(
                        session.session_id,
                        child_age=extracted["child_age"]
                    )

                if extracted.get("transportation") and not prefs.transportation:
                    # Only use AI extraction if we don't already have transportation from keyword matching
                    conversation_manager.update_preferences(
                        session.session_id,
                        transportation=extracted["transportation"]
                    )

                if extracted.get("meals") and len(extracted["meals"]) > 0:
                    conversation_manager.update_preferences(
                        session.session_id,
                        meals=extracted["meals"]
                    )

                # Refresh session after AI extraction
                session = conversation_manager.get_session(session.session_id)
                if not session:
                    logger.error("Session not found after AI extraction")
                    return ("セッションが見つかりません。もう一度お試しください。", [], None)

                # Check if we have enough to generate
                if conversation_manager.has_sufficient_preferences(session):
                    # Check for critical missing info
                    missing_info = conversation_manager.get_critical_missing_info(session)

                    if missing_info and len(missing_info) > 0:
                        # Only ask for truly critical info (location or child_age if children mentioned)
                        priority_item = missing_info[0]

                        if priority_item == "child_age":
                            question = "お子様は何歳ですか？"
                            quick_replies = ["0-2歳", "3-5歳", "6-8歳", "9-12歳", "その他"]
                            logger.info(f"Asking for critical item after AI extraction: {priority_item}")
                            return (question, quick_replies, None)
                        elif priority_item == "location":
                            question = "どこから出発されますか？"
                            quick_replies = []
                            logger.info(f"Asking for critical item after AI extraction: {priority_item}")
                            return (question, quick_replies, None)
                        else:
                            # For any other items, just generate (shouldn't happen)
                            logger.info(f"Unexpected missing item {priority_item}, generating anyway")

                    # Ready to generate!
                    logger.info("Sufficient preferences collected after AI extraction, transitioning to GENERATING_PLAN")
                    conversation_manager.transition_state(
                        session.session_id,
                        ConversationState.GENERATING_PLAN
                    )
                    return _generate_response(session, user_message)
                else:
                    # Still missing basic info
                    logger.warning("Still missing basic info after AI extraction")
                    return (
                        "もう少し詳しく教えていただけますか？\n例：「新宿から1時間くらいで行ける子供向けの場所」",
                        [],
                        None
                    )

            except Exception as e:
                logger.error(f"Failed to process FREE_INPUT with AI extraction: {e}", exc_info=True)
                return (
                    "すみません、もう一度教えていただけますか？",
                    [],
                    None
                )
        else:
            # Keyword matching provided enough info and we already returned above
            # This should not be reached
            logger.warning("Unexpected code path in FREE_INPUT handler")
            return ("もう少し詳しく教えていただけますか？", [], None)

    elif session.state == ConversationState.GENERATING_PLAN:
        """Generate travel plan with current preferences."""
        logger.info("State is GENERATING_PLAN - generating plan with Vertex AI")

        prefs = session.user_preferences

        # Validate we have minimum required preferences
        if not prefs.location.address:
            logger.error("GENERATING_PLAN state but no location")
            conversation_manager.transition_state(
                session.session_id,
                ConversationState.FREE_INPUT
            )
            return ("出発地を教えてください。", [], None)

        # Set default activity_type if not specified
        if not prefs.activity_type:
            logger.info("No activity_type specified, using default '家族向け'")
            conversation_manager.update_preferences(
                session.session_id,
                activity_type="家族向け"
            )
            prefs = conversation_manager.get_session(session.session_id).user_preferences

        try:
            # Convert preferences to dict for prompt template
            prefs_dict = {
                "location": _convert_location_to_dict(prefs.location),
                "travel_time": prefs.travel_time.model_dump() if prefs.travel_time else {"value": 60},
                "activity_type": prefs.activity_type or "家族向け",
                "meals": prefs.meals or [],
                "child_age": prefs.child_age,
                "transportation": prefs.transportation,
            }

            # Generate optimized prompt
            prompt = build_plan_generation_prompt(prefs_dict)

            # Generate plan with Google Maps grounding
            result = vertex_ai_service.generate_content(
                prompt,
                use_grounding=True,
                latitude=prefs_dict["location"]["lat"],
                longitude=prefs_dict["location"]["lng"],
            )

            # Extract text and grounding metadata
            plan_description = result["text"]
            grounding_metadata = result["grounding_metadata"]

            logger.info(f"Generated plan with grounding metadata: {grounding_metadata is not None}")

            # Extract and enrich places with photos from plan text
            enriched_places = _extract_and_enrich_places(
                plan_text=plan_description,
                location_bias=(prefs_dict["location"]["lat"], prefs_dict["location"]["lng"])
            )

            logger.info(f"Enriched {len(enriched_places)} places with photos")

            # Store shown place IDs
            place_ids = [place["place_id"] for place in enriched_places]
            conversation_manager.update_preferences(
                session.session_id,
                shown_place_ids=place_ids
            )

            conversation_manager.transition_state(
                session.session_id,
                ConversationState.PRESENTING_PLAN
            )

            # Add Quick Reply to show more spots (max 2 additional requests)
            prefs = conversation_manager.get_session(session.session_id).user_preferences
            quick_replies = ["他の候補を見る"] if prefs.spots_request_count < 2 else None

            return (plan_description, quick_replies, enriched_places)

        except Exception as e:
            logger.error(f"Failed to generate plan: {e}", exc_info=True)

            # Provide user-friendly error message based on error type
            error_msg = "申し訳ございませんが、プランの作成中に問題が発生しました。"

            error_str = str(e).lower()
            if "timeout" in error_str or "timed out" in error_str:
                error_msg += "処理に時間がかかりすぎています。もう一度お試しください。"
            elif "quota" in error_str or "rate limit" in error_str:
                error_msg += "一時的にアクセスが集中しています。しばらく待ってからお試しください。"
            elif "network" in error_str or "connection" in error_str:
                error_msg += "ネットワーク接続に問題があります。インターネット接続を確認してください。"
            elif "authentication" in error_str or "credentials" in error_str:
                error_msg += "サービスの設定に問題があります。管理者にお問い合わせください。"
            else:
                error_msg += "もう一度お試しいただくか、条件を変更してみてください。"

            return (error_msg, None, None)

    elif session.state == ConversationState.GATHERING_PREFERENCES:
        # Check what preference to ask for next
        prefs = session.user_preferences

        # Store activity type if provided
        if "アクティブ" in user_message or "active" in user_message.lower():
            conversation_manager.update_preferences(
                session.session_id,
                activity_type="active/outdoor"
            )
        elif "インドア" in user_message or "indoor" in user_message.lower():
            conversation_manager.update_preferences(
                session.session_id,
                activity_type="indoor"
            )

        # Store meal preference if user answered
        if "とる" in user_message or "yes" in user_message.lower():
            conversation_manager.update_preferences(
                session.session_id,
                meals=["lunch"]
            )
        elif "とらない" in user_message or "no" in user_message.lower():
            conversation_manager.update_preferences(
                session.session_id,
                meals=[]
            )

        # Refresh prefs after any update
        prefs = conversation_manager.get_session(session.session_id).user_preferences

        # Store child age if provided
        if "歳" in user_message or "才" in user_message:
            # Extract age from message (supports both "3歳" and "0-3歳" formats)
            import re
            age_match = re.search(r'(\d+(?:-\d+)?)[歳才]', user_message)
            if age_match:
                conversation_manager.update_preferences(
                    session.session_id,
                    child_age=age_match.group(1)
                )
                prefs = conversation_manager.get_session(session.session_id).user_preferences

        # Store travel time if provided
        if "分" in user_message and any(char.isdigit() for char in user_message):
            import re
            time_match = re.search(r'(\d+)\s*分', user_message)
            if time_match:
                conversation_manager.update_preferences(
                    session.session_id,
                    travel_time=TravelTime(value=int(time_match.group(1)), unit="minutes", direction="one-way")
                )
                prefs = conversation_manager.get_session(session.session_id).user_preferences

        # Store transportation if provided
        if "車" in user_message or "car" in user_message.lower():
            if "ある" in user_message or "あり" in user_message or "使える" in user_message:
                conversation_manager.update_preferences(
                    session.session_id,
                    transportation="car"
                )
            elif "ない" in user_message or "なし" in user_message:
                conversation_manager.update_preferences(
                    session.session_id,
                    transportation="public"
                )
            prefs = conversation_manager.get_session(session.session_id).user_preferences
        elif "電車" in user_message or "公共交通" in user_message or "バス" in user_message:
            conversation_manager.update_preferences(
                session.session_id,
                transportation="public"
            )
            prefs = conversation_manager.get_session(session.session_id).user_preferences

        # Check if we have enough info to generate plan
        if prefs.activity_type and prefs.meals is not None and prefs.child_age and prefs.travel_time and prefs.transportation:
            # Generate travel plan with Vertex AI + Google Maps grounding
            conversation_manager.transition_state(
                session.session_id,
                ConversationState.GENERATING_PLAN
            )

            try:
                # Convert preferences to dict for prompt template
                prefs_dict = {
                    "location": _convert_location_to_dict(prefs.location),
                    "travel_time": prefs.travel_time.model_dump() if prefs.travel_time else {"value": 60},
                    "activity_type": prefs.activity_type or "アクティブ",
                    "meals": prefs.meals or [],
                    "child_age": prefs.child_age,
                    "transportation": prefs.transportation,
                }

                # Generate optimized prompt
                prompt = build_plan_generation_prompt(prefs_dict)

                # Generate plan with Google Maps grounding
                result = vertex_ai_service.generate_content(
                    prompt,
                    use_grounding=True,
                    latitude=prefs_dict["location"]["lat"],
                    longitude=prefs_dict["location"]["lng"],
                )

                # Extract text and grounding metadata
                plan_description = result["text"]
                grounding_metadata = result["grounding_metadata"]

                logger.info(f"Generated plan with grounding metadata: {grounding_metadata is not None}")

                # Extract and enrich places with photos from plan text
                enriched_places = _extract_and_enrich_places(
                    plan_text=plan_description,
                    location_bias=(prefs_dict["location"]["lat"], prefs_dict["location"]["lng"])
                )

                logger.info(f"Enriched {len(enriched_places)} places with photos")

                # Store shown place IDs
                place_ids = [place["place_id"] for place in enriched_places]
                conversation_manager.update_preferences(
                    session.session_id,
                    shown_place_ids=place_ids
                )

                conversation_manager.transition_state(
                    session.session_id,
                    ConversationState.PRESENTING_PLAN
                )

                # Add Quick Reply to show more spots (max 2 additional requests)
                prefs = conversation_manager.get_session(session.session_id).user_preferences
                quick_replies = ["他の候補を見る"] if prefs.spots_request_count < 2 else None

                return (plan_description, quick_replies, enriched_places)

            except Exception as e:
                logger.error(f"Failed to generate plan: {e}", exc_info=True)

                # Provide user-friendly error message based on error type
                error_msg = "申し訳ございませんが、プランの作成中に問題が発生しました。"

                error_str = str(e).lower()
                if "timeout" in error_str or "timed out" in error_str:
                    error_msg += "処理に時間がかかりすぎています。もう一度お試しください。"
                elif "quota" in error_str or "rate limit" in error_str:
                    error_msg += "一時的にアクセスが集中しています。しばらく待ってからお試しください。"
                elif "network" in error_str or "connection" in error_str:
                    error_msg += "ネットワーク接続に問題があります。インターネット接続を確認してください。"
                elif "authentication" in error_str or "credentials" in error_str:
                    error_msg += "サービスの設定に問題があります。管理者にお問い合わせください。"
                else:
                    error_msg += "もう一度お試しいただくか、条件を変更してみてください。"

                return (error_msg, None, None)

        # Ask questions in order based on what's missing
        if prefs.activity_type and prefs.meals is None:
            return (
                "昼食や夕食はお取りになりますか?",
                ["とる", "とらない"],
                None
            )

        if prefs.activity_type and prefs.meals is not None and not prefs.child_age:
            return (
                "お子様の年齢を教えてください。",
                ["0-2歳", "3-5歳", "6-8歳", "9-12歳", "その他"],
                None
            )

        if prefs.activity_type and prefs.meals is not None and prefs.child_age and not prefs.travel_time:
            return (
                "移動時間はどのくらいを想定していますか？（例: 30分、60分）",
                ["30分", "60分", "90分"],
                None
            )

        if prefs.activity_type and prefs.meals is not None and prefs.child_age and prefs.travel_time and not prefs.transportation:
            return (
                "車はお持ちですか？",
                ["車あり", "車なし（公共交通機関）"],
                None
            )

        return ("ご質問に答えていただきありがとうございます。", None, None)

    elif session.state == ConversationState.PRESENTING_PLAN:
        prefs = session.user_preferences

        # Debug logging to diagnose state issues
        logger.info(f"PRESENTING_PLAN state - message: '{user_message[:50]}'")
        logger.info(f"Preferences: activity={prefs.activity_type}, meals={prefs.meals}, age={prefs.child_age}, time={prefs.travel_time}, transport={prefs.transportation}")

        # Validate that we actually have all required preferences
        # If not, we're in wrong state - transition back to GATHERING_PREFERENCES
        if not prefs.activity_type or prefs.meals is None or not prefs.child_age or not prefs.travel_time or not prefs.transportation:
            logger.warning(f"In PRESENTING_PLAN but missing preferences - transitioning back to GATHERING_PREFERENCES")
            conversation_manager.transition_state(
                session.session_id,
                ConversationState.GATHERING_PREFERENCES
            )
            # Re-process the message in the correct state
            return _generate_response(session, user_message)

        # Handle request for more spot options
        if "別のプラン" in user_message or "他の提案" in user_message or "他の候補" in user_message:
            # Check if we've reached the limit (2 additional requests = 9 total spots)
            if prefs.spots_request_count >= 2:
                return ("申し訳ございませんが、これ以上の候補はご用意できません。表示されているスポットからお選びください。", None, None)

            try:
                # Convert preferences to dict for prompt template
                prefs_dict = {
                    "location": _convert_location_to_dict(prefs.location),
                    "travel_time": prefs.travel_time.model_dump() if prefs.travel_time else {"value": 60},
                    "activity_type": prefs.activity_type or "アクティブ",
                    "meals": prefs.meals or [],
                    "child_age": prefs.child_age,
                    "transportation": prefs.transportation,
                }

                # Generate prompt with exclusion of already-shown places
                prompt = build_plan_generation_prompt(
                    prefs_dict,
                    exclude_place_ids=prefs.shown_place_ids
                )

                # Generate plan with higher temperature (0.85) for more diversity
                result = vertex_ai_service.generate_content(
                    prompt,
                    use_grounding=True,
                    latitude=prefs_dict["location"]["lat"],
                    longitude=prefs_dict["location"]["lng"],
                    temperature=0.85,  # Higher temperature for more diverse results
                )

                # Extract text and grounding metadata
                plan_description = result["text"]
                grounding_metadata = result["grounding_metadata"]

                logger.info(f"Generated additional spots with grounding metadata: {grounding_metadata is not None}")

                # Extract and enrich places with photos from plan text
                enriched_places = _extract_and_enrich_places(
                    plan_text=plan_description,
                    location_bias=(prefs_dict["location"]["lat"], prefs_dict["location"]["lng"])
                )

                logger.info(f"Enriched {len(enriched_places)} additional places")

                # Add new place IDs to shown list
                new_place_ids = [place["place_id"] for place in enriched_places]
                updated_place_ids = prefs.shown_place_ids + new_place_ids

                # Increment request count and update shown places
                conversation_manager.update_preferences(
                    session.session_id,
                    shown_place_ids=updated_place_ids,
                    spots_request_count=prefs.spots_request_count + 1
                )

                # Refresh prefs after update
                prefs = conversation_manager.get_session(session.session_id).user_preferences

                # Add Quick Reply if we haven't reached the limit
                quick_replies = ["他の候補を見る"] if prefs.spots_request_count < 2 else None

                return (plan_description, quick_replies, enriched_places)

            except Exception as e:
                logger.error(f"Failed to generate additional spots: {e}", exc_info=True)
                return ("申し訳ございません。追加のスポット生成中に問題が発生しました。もう一度お試しください。", None, None)

        # Default response for other messages in PRESENTING_PLAN state
        return ("プランについてのご質問やご要望があればお聞かせください。", None, None)

    else:
        # Default response for other states
        return ("ご質問ありがとうございます。", None, None)
