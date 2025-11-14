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

        # Ask about meals if not set
        if not prefs.meals and prefs.activity_type:
            return (
                "昼食や夕食はお取りになりますか?",
                ["とる", "とらない"]
            )

        # Store meal preference
        if "とる" in user_message or "yes" in user_message.lower():
            conversation_manager.update_preferences(
                session.session_id,
                meals=["lunch"]
            )

            # Generate travel plan with Vertex AI + Google Maps grounding
            conversation_manager.transition_state(
                session.session_id,
                ConversationState.GENERATING_PLAN
            )

            try:
                # Build prompt from user preferences
                prefs = session.user_preferences
                location = prefs.location.address if prefs.location.address else "東京駅"
                activity = prefs.activity_type or "アクティブ"

                prompt = f"""週末のお出かけプランを作成してください。

条件：
- 出発地: {location}
- アクティビティタイプ: {activity}
- 昼食: あり

実際に存在する場所を3つ提案し、それぞれの名前、アクセス方法、おすすめポイントを簡潔に教えてください。"""

                # Generate plan with Google Maps grounding
                plan_description = vertex_ai_service.generate_content(
                    prompt,
                    use_grounding=True,
                    latitude=prefs.location.lat if prefs.location.lat else 35.6812,
                    longitude=prefs.location.lng if prefs.location.lng else 139.7671,
                )

                conversation_manager.transition_state(
                    session.session_id,
                    ConversationState.PRESENTING_PLAN
                )

                return (plan_description, None)

            except Exception as e:
                logger.error(f"Failed to generate plan: {e}")
                return (
                    "プランの作成中にエラーが発生しました。もう一度お試しください。",
                    None
                )

        return ("ご質問に答えていただきありがとうございます。", None)

    else:
        # Default response for other states
        return ("ご質問ありがとうございます。", None)
