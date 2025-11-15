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
        logger.info("State is INITIAL - processing location")
        # Parse location from user message
        import re

        # Check if message contains coordinates
        coord_match = re.search(r'緯度:\s*(-?\d+\.\d+).*経度:\s*(-?\d+\.\d+)', user_message)

        if coord_match:
            lat = float(coord_match.group(1))
            lng = float(coord_match.group(2))

            # Update location
            conversation_manager.update_preferences(
                session.session_id,
                location=Location(address="現在地", lat=lat, lng=lng)
            )
        else:
            # Assume it's an address
            conversation_manager.update_preferences(
                session.session_id,
                location=Location(address=user_message, lat=None, lng=None)
            )

        # Move to gathering preferences
        conversation_manager.transition_state(
            session.session_id,
            ConversationState.GATHERING_PREFERENCES
        )
        return (
            "出発地を設定しました。\n\nアクティブな場所をお探しですか、それともインドアの施設がよいですか?",
            ["アクティブ", "インドア"],
            None
        )

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
        # Handle request for more spot options
        if "別のプラン" in user_message or "他の提案" in user_message or "他の候補" in user_message:
            prefs = session.user_preferences

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
