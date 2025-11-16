"""Vertex AI service with Google Maps grounding integration."""

import logging
from typing import Any

from google import genai
from google.genai import types
from google.genai.types import (
    GenerateContentConfig,
    GoogleMaps,
    HttpOptions,
    Tool,
)

from app.config import settings

logger = logging.getLogger(__name__)


class VertexAIService:
    """Service for interacting with Vertex AI (Gemini) with Google Maps grounding."""

    def __init__(self) -> None:
        """Initialize Vertex AI client with new google-genai SDK."""
        try:
            # Initialize client with Vertex AI (v1 API required for Google Maps)
            self.client = genai.Client(
                vertexai=True,
                project=settings.google_cloud_project_id,
                location=settings.google_cloud_location,
                http_options=HttpOptions(api_version="v1"),
            )
            logger.info(
                f"Initialized Vertex AI client: project={settings.google_cloud_project_id}, "
                f"location={settings.google_cloud_location}, model={settings.vertex_ai_model}"
            )

        except Exception as e:
            logger.error(f"Failed to initialize Vertex AI: {e}")
            raise

    def generate_content_stream(
        self,
        prompt: str,
        use_grounding: bool = True,
        temperature: float | None = None,
        max_output_tokens: int | None = None,
        latitude: float | None = None,
        longitude: float | None = None,
    ):
        """
        Generate content using Vertex AI with streaming (yields chunks as they arrive).

        Args:
            prompt: The prompt to send to the model
            use_grounding: Whether to enable Google Maps grounding
            temperature: Generation temperature (default from settings)
            max_output_tokens: Max tokens to generate (default from settings)
            latitude: Optional latitude for location-based search
            longitude: Optional longitude for location-based search

        Yields:
            Dict with keys:
                - text: Generated text chunk
                - grounding_metadata: Grounding metadata (only in final chunk)
                - done: True for final chunk

        Raises:
            Exception: If the API call fails
        """
        try:
            # Configure generation settings
            config_params = {
                "temperature": temperature or settings.vertex_ai_temperature,
                "max_output_tokens": max_output_tokens or settings.vertex_ai_max_output_tokens,
            }

            # Configure Google Maps grounding if enabled
            if use_grounding:
                config_params["tools"] = [
                    Tool(google_maps=GoogleMaps(enable_widget=False))
                ]
                logger.debug("Google Maps grounding enabled")

                # Add location config if lat/lng provided
                if latitude is not None and longitude is not None:
                    config_params["tool_config"] = types.ToolConfig(
                        retrieval_config=types.RetrievalConfig(
                            lat_lng=types.LatLng(
                                latitude=latitude,
                                longitude=longitude,
                            ),
                            language_code="ja_JP",
                        ),
                    )
                    logger.debug(f"Location set to: ({latitude}, {longitude})")

            config = GenerateContentConfig(**config_params)

            # Generate content with streaming
            logger.debug(f"Generating streaming content with prompt length: {len(prompt)}")

            response_stream = self.client.models.generate_content_stream(
                model=settings.vertex_ai_model,
                contents=prompt,
                config=config,
            )

            full_text = ""
            grounding_metadata = None

            # Stream chunks
            for chunk in response_stream:
                if chunk.text:
                    full_text += chunk.text
                    yield {
                        "text": chunk.text,
                        "grounding_metadata": None,
                        "done": False,
                    }

            # Extract grounding metadata from final response
            if hasattr(response_stream, "grounding_metadata") and response_stream.grounding_metadata:
                grounding_metadata = {
                    "grounding_chunks": [],
                    "grounding_supports": [],
                }

                if hasattr(response_stream.grounding_metadata, "grounding_chunks"):
                    for chunk in response_stream.grounding_metadata.grounding_chunks:
                        chunk_dict = {}
                        if hasattr(chunk, "web") and chunk.web:
                            chunk_dict["web"] = {
                                "uri": chunk.web.uri if hasattr(chunk.web, "uri") else None,
                                "title": chunk.web.title if hasattr(chunk.web, "title") else None,
                            }
                        grounding_metadata["grounding_chunks"].append(chunk_dict)

                if hasattr(response_stream.grounding_metadata, "grounding_supports"):
                    for support in response_stream.grounding_metadata.grounding_supports:
                        support_dict = {}
                        if hasattr(support, "segment"):
                            support_dict["segment"] = {
                                "start_index": support.segment.start_index if hasattr(support.segment, "start_index") else None,
                                "end_index": support.segment.end_index if hasattr(support.segment, "end_index") else None,
                            }
                        if hasattr(support, "grounding_chunk_indices"):
                            support_dict["chunk_indices"] = list(support.grounding_chunk_indices)
                        grounding_metadata["grounding_supports"].append(support_dict)

                logger.info(f"Extracted grounding metadata: {len(grounding_metadata['grounding_chunks'])} chunks, {len(grounding_metadata['grounding_supports'])} supports")

            # Final chunk with metadata
            yield {
                "text": "",
                "grounding_metadata": grounding_metadata,
                "done": True,
            }

            logger.info(f"Streaming completed, total length: {len(full_text)}")

        except Exception as e:
            logger.error(f"Failed to generate streaming content: {e}")
            raise

    def generate_content(
        self,
        prompt: str,
        use_grounding: bool = True,
        temperature: float | None = None,
        max_output_tokens: int | None = None,
        latitude: float | None = None,
        longitude: float | None = None,
    ) -> dict[str, Any]:
        """
        Generate content using Vertex AI with optional Google Maps grounding.

        Args:
            prompt: The prompt to send to the model
            use_grounding: Whether to enable Google Maps grounding
            temperature: Generation temperature (default from settings)
            max_output_tokens: Max tokens to generate (default from settings)
            latitude: Optional latitude for location-based search
            longitude: Optional longitude for location-based search

        Returns:
            Dict with keys:
                - text: Generated text response
                - grounding_metadata: Grounding metadata dict or None

        Raises:
            Exception: If the API call fails
        """
        try:
            # Configure generation settings
            config_params = {
                "temperature": temperature or settings.vertex_ai_temperature,
                "max_output_tokens": max_output_tokens or settings.vertex_ai_max_output_tokens,
            }

            # Configure Google Maps grounding if enabled
            if use_grounding:
                config_params["tools"] = [
                    Tool(google_maps=GoogleMaps(enable_widget=False))
                ]
                logger.debug("Google Maps grounding enabled")

                # Add location config if lat/lng provided
                if latitude is not None and longitude is not None:
                    config_params["tool_config"] = types.ToolConfig(
                        retrieval_config=types.RetrievalConfig(
                            lat_lng=types.LatLng(
                                latitude=latitude,
                                longitude=longitude,
                            ),
                            language_code="ja_JP",
                        ),
                    )
                    logger.debug(f"Location set to: ({latitude}, {longitude})")

            config = GenerateContentConfig(**config_params)

            # Generate content
            logger.debug(f"Generating content with prompt length: {len(prompt)}")

            response = self.client.models.generate_content(
                model=settings.vertex_ai_model,
                contents=prompt,
                config=config,
            )

            # Extract text from response
            if not response.text:
                logger.warning("No text in response")
                return {"text": "", "grounding_metadata": None}

            result_text = response.text
            logger.info(f"Generated response length: {len(result_text)}")

            # Extract grounding metadata if available
            grounding_metadata = None
            if hasattr(response, "grounding_metadata") and response.grounding_metadata:
                # Convert to dict for easier handling
                grounding_metadata = {
                    "grounding_chunks": [],
                    "grounding_supports": [],
                }

                # Extract grounding chunks (search results)
                if hasattr(response.grounding_metadata, "grounding_chunks"):
                    for chunk in response.grounding_metadata.grounding_chunks:
                        chunk_dict = {}
                        if hasattr(chunk, "web") and chunk.web:
                            chunk_dict["web"] = {
                                "uri": chunk.web.uri if hasattr(chunk.web, "uri") else None,
                                "title": chunk.web.title if hasattr(chunk.web, "title") else None,
                            }
                        grounding_metadata["grounding_chunks"].append(chunk_dict)

                # Extract grounding supports (citations)
                if hasattr(response.grounding_metadata, "grounding_supports"):
                    for support in response.grounding_metadata.grounding_supports:
                        support_dict = {}
                        if hasattr(support, "segment"):
                            support_dict["segment"] = {
                                "start_index": support.segment.start_index if hasattr(support.segment, "start_index") else None,
                                "end_index": support.segment.end_index if hasattr(support.segment, "end_index") else None,
                            }
                        if hasattr(support, "grounding_chunk_indices"):
                            support_dict["chunk_indices"] = list(support.grounding_chunk_indices)
                        grounding_metadata["grounding_supports"].append(support_dict)

                logger.info(f"Extracted grounding metadata: {len(grounding_metadata['grounding_chunks'])} chunks, {len(grounding_metadata['grounding_supports'])} supports")

            return {
                "text": result_text,
                "grounding_metadata": grounding_metadata,
            }

        except Exception as e:
            logger.error(f"Failed to generate content: {e}")
            raise

    def generate_with_context(
        self,
        system_prompt: str,
        user_message: str,
        conversation_history: list[dict[str, str]] | None = None,
        use_grounding: bool = True,
    ) -> dict[str, Any]:
        """
        Generate content with conversation context.

        Args:
            system_prompt: System instructions
            user_message: Current user message
            conversation_history: Previous messages [{"role": "user"|"assistant", "content": "..."}]
            use_grounding: Whether to enable Google Maps grounding

        Returns:
            Dict with keys:
                - text: Generated text response
                - grounding_metadata: Grounding metadata dict or None
        """
        # Build prompt with context
        prompt_parts = [system_prompt, ""]

        # Add conversation history
        if conversation_history:
            prompt_parts.append("Previous conversation:")
            for msg in conversation_history:
                role = "User" if msg["role"] == "user" else "Assistant"
                prompt_parts.append(f"{role}: {msg['content']}")
            prompt_parts.append("")

        # Add current message
        prompt_parts.append(f"User: {user_message}")
        prompt_parts.append("Assistant:")

        full_prompt = "\n".join(prompt_parts)
        return self.generate_content(full_prompt, use_grounding=use_grounding)

    def extract_preferences_from_freeform(self, user_message: str) -> dict[str, Any]:
        """
        Extract user preferences from free-form message using AI with JSON parsing.

        Args:
            user_message: The user's free-form message

        Returns:
            Extracted preferences dictionary with keys:
                - location: dict with 'address' and 'explicit' keys
                - travel_time: dict with 'value', 'direction', 'unit' keys
                - activity_type: str or None
                - meals: list
                - child_age: str or None
                - transportation: str or None
                - destination: str or None
                - special_requirements: list
                - enough_to_generate: bool
        """
        from app.services.prompts import PromptTemplates
        import json
        import re

        prompt = PromptTemplates.extract_preferences_from_freeform(user_message)

        try:
            result = self.generate_content(
                prompt,
                use_grounding=False,  # No grounding needed for preference extraction
                temperature=0.1,  # Low temperature for consistent JSON output
            )

            response_text = result["text"].strip()
            logger.debug(f"Raw extraction response: {response_text[:200]}")

            # Extract JSON from response (sometimes wrapped in markdown)
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                json_str = json_match.group(0)
                extracted = json.loads(json_str)
                logger.info(f"Successfully extracted preferences: {extracted}")
                return extracted
            else:
                logger.warning("No JSON found in response")
                return self._empty_extraction()

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from extraction: {e}")
            return self._empty_extraction()
        except Exception as e:
            logger.error(f"Failed to extract preferences: {e}")
            return self._empty_extraction()

    def _empty_extraction(self) -> dict[str, Any]:
        """Return empty extraction result."""
        return {
            "location": {"address": None, "explicit": False},
            "travel_time": {"value": None, "direction": None, "unit": None},
            "activity_type": None,
            "meals": [],
            "child_age": None,
            "transportation": None,
            "destination": None,
            "special_requirements": [],
            "enough_to_generate": False,
        }

    def extract_preferences(self, user_message: str, current_preferences: dict[str, Any]) -> dict[str, Any]:
        """
        Extract user preferences from a message using AI.

        Args:
            user_message: The user's message
            current_preferences: Current known preferences

        Returns:
            Updated preferences dictionary
        """
        system_prompt = """あなたは週末のお出かけプランを立てるアシスタントです。
ユーザーのメッセージから以下の情報を抽出してください：

- location: 出発地（住所や駅名）
- travel_time: 移動時間（片道・往復を含む）
- activity_type: アクティビティの種類（アクティブ/アウトドア、インドア）
- meals: 食事の希望（昼食、夕食など）
- child_age: 子供の年齢
- transportation: 移動手段（車、公共交通機関、徒歩）

JSON形式で抽出した情報を返してください。情報がない項目はnullにしてください。
"""

        prompt = f"""現在の情報: {current_preferences}

ユーザーメッセージ: {user_message}

抽出した情報をJSON形式で返してください。"""

        try:
            result = self.generate_content(
                system_prompt + "\n" + prompt,
                use_grounding=False,  # No grounding needed for preference extraction
            )

            # TODO: Parse JSON response and merge with current preferences
            # For now, return current preferences
            logger.debug(f"Preference extraction response: {result['text']}")
            return current_preferences

        except Exception as e:
            logger.error(f"Failed to extract preferences: {e}")
            return current_preferences

    def generate_travel_plan(
        self,
        preferences: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Generate a complete travel plan with Google Maps grounding.

        Args:
            preferences: User preferences for the trip

        Returns:
            Travel plan with activities, locations, and routes
        """
        # Build detailed prompt for plan generation
        location = preferences.get("location", {}).get("address", "")
        travel_time = preferences.get("travel_time", {})
        activity_type = preferences.get("activity_type", "")
        meals = preferences.get("meals", [])

        prompt = f"""週末のお出かけプランを作成してください。

条件：
- 出発地: {location}
- 移動時間: 片道 {travel_time.get('value', 60)} 分
- アクティビティタイプ: {activity_type}
- 食事: {', '.join(meals) if meals else 'なし'}

以下の形式でプランを作成してください：
1. 訪問する場所（名前、住所、説明）
2. 各場所でのアクティビティ
3. 移動ルート
4. 時間配分

実際に存在する場所を提案してください。
"""

        try:
            result = self.generate_content(
                prompt,
                use_grounding=True,  # Use Maps grounding for real places
            )

            # TODO: Parse response and structure as travel plan
            # For now, return basic structure
            plan = {
                "description": result["text"],
                "activities": [],
                "route": [],
                "grounding_metadata": result["grounding_metadata"],
            }

            logger.info("Generated travel plan successfully")
            return plan

        except Exception as e:
            logger.error(f"Failed to generate travel plan: {e}")
            raise


# Global service instance
vertex_ai_service = VertexAIService()
