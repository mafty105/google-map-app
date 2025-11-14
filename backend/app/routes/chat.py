"""Chat API endpoints."""

import logging

from fastapi import APIRouter, HTTPException, status

from app.models.api import (
    ChatMessageRequest,
    ChatMessageResponse,
    CreateSessionResponse,
    ErrorResponse,
    SessionHistoryResponse,
)
from app.models.conversation import ConversationState
from app.services.conversation_manager import conversation_manager
from app.services.vertex_ai import vertex_ai_service
from app.services.prompts import build_plan_generation_prompt

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/session", response_model=CreateSessionResponse)
async def create_session() -> CreateSessionResponse:
    """Create a new conversation session."""
    session = conversation_manager.create_session()

    # Add initial greeting
    greeting = "こんにちは！週末のお出かけプランをお手伝いします。どのようなプランをお探しですか？"
    conversation_manager.add_assistant_message(session.session_id, greeting)

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
    response_message, quick_replies = _generate_response(session, request.message)

    # Add assistant response
    conversation_manager.add_assistant_message(request.session_id, response_message)

    logger.info(f"Session {request.session_id}: Processed message in state {session.state}")

    return ChatMessageResponse(
        session_id=request.session_id,
        response=response_message,
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


def _generate_response(session, user_message: str) -> tuple[str, list[str] | None]:
    """Generate response based on conversation state and user input."""

    # For now, just handle the gathering preferences state
    # This will be enhanced with Vertex AI in Issue #4

    if session.state == ConversationState.INITIAL:
        # Move to gathering preferences
        conversation_manager.transition_state(
            session.session_id,
            ConversationState.GATHERING_PREFERENCES
        )
        return (
            "アクティブな場所をお探しですか、それともインドアの施設がよいですか?",
            ["アクティブ", "インドア"]
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
            # Refresh prefs after update
            prefs = conversation_manager.get_session(session.session_id).user_preferences

        # Check if we have enough info to generate plan
        if prefs.activity_type and prefs.meals:
            # Generate travel plan with Vertex AI + Google Maps grounding
            conversation_manager.transition_state(
                session.session_id,
                ConversationState.GENERATING_PLAN
            )

            try:
                # Convert preferences to dict for prompt template
                prefs_dict = {
                    "location": {
                        "address": prefs.location.address or "東京駅",
                        "lat": prefs.location.lat or 35.6812,
                        "lng": prefs.location.lng or 139.7671,
                    },
                    "travel_time": prefs.travel_time.model_dump() if prefs.travel_time else {"value": 60},
                    "activity_type": prefs.activity_type or "アクティブ",
                    "meals": prefs.meals or [],
                    "child_age": prefs.child_age,
                    "transportation": prefs.transportation,
                }

                # Generate optimized prompt
                prompt = build_plan_generation_prompt(prefs_dict)

                # Generate plan with Google Maps grounding
                plan_description = vertex_ai_service.generate_content(
                    prompt,
                    use_grounding=True,
                    latitude=prefs_dict["location"]["lat"],
                    longitude=prefs_dict["location"]["lng"],
                )

                conversation_manager.transition_state(
                    session.session_id,
                    ConversationState.PRESENTING_PLAN
                )

                return (plan_description, None)

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

                return (error_msg, None)

        # Ask about meals if not set yet
        if not prefs.meals and prefs.activity_type:
            return (
                "昼食や夕食はお取りになりますか?",
                ["とる", "とらない"]
            )

        return ("ご質問に答えていただきありがとうございます。", None)

    else:
        # Default response for other states
        return ("ご質問ありがとうございます。", None)
