"""Prompt templates for Vertex AI conversations.

This module contains carefully engineered prompts for different conversation stages.
Prompts are optimized for:
- Google Maps grounding
- Japanese locations and culture
- Family-friendly recommendations
- Token efficiency
"""

from typing import Any


class PromptTemplates:
    """Collection of prompt templates for different conversation stages."""

    # System instruction for all interactions
    SYSTEM_INSTRUCTION = """あなたは日本の家族向け週末お出かけプランを提案するアシスタントです。

重要な役割：
- 実在する場所のみを提案する（Google Mapsのデータを使用）
- 家族で楽しめる安全な場所を優先
- 移動時間と交通手段を考慮
- 子供の年齢に適した提案をする
- 具体的で実用的な情報を提供

回答のスタイル：
- 親しみやすく、わかりやすい日本語
- 具体的な施設名、住所、アクセス方法を記載
- 簡潔だが必要な情報は漏らさない
"""

    @staticmethod
    def extract_preferences(user_message: str, current_prefs: dict[str, Any]) -> str:
        """
        Create prompt to extract user preferences from their message.

        Args:
            user_message: The user's message
            current_prefs: Currently known preferences

        Returns:
            Formatted prompt for preference extraction
        """
        return f"""{PromptTemplates.SYSTEM_INSTRUCTION}

ユーザーのメッセージから以下の情報を抽出してください：

ユーザーメッセージ: "{user_message}"

現在の情報:
- 出発地: {current_prefs.get('location', {}).get('address', '未設定')}
- 移動時間: {current_prefs.get('travel_time', '未設定')}
- アクティビティタイプ: {current_prefs.get('activity_type', '未設定')}
- 食事: {current_prefs.get('meals', '未設定')}

抽出してください：
1. 出発地（駅名、住所、ランドマーク）
2. 移動時間の希望（片道/往復、分/時間）
3. アクティビティの種類（アクティブ/インドア/観光など）
4. 食事の希望（昼食/夕食/なし）
5. 子供の年齢（もし言及があれば）

明確に言及されている情報のみを簡潔に回答してください。
"""

    @staticmethod
    def generate_clarifying_question(
        current_prefs: dict[str, Any],
        missing_info: list[str],
    ) -> str:
        """
        Create prompt to generate a natural clarifying question.

        Args:
            current_prefs: Current user preferences
            missing_info: List of missing information

        Returns:
            Formatted prompt for question generation
        """
        prefs_summary = []
        if current_prefs.get("location", {}).get("address"):
            prefs_summary.append(f"出発地: {current_prefs['location']['address']}")
        if current_prefs.get("travel_time"):
            prefs_summary.append(f"移動時間: {current_prefs['travel_time']}")
        if current_prefs.get("activity_type"):
            prefs_summary.append(f"アクティビティ: {current_prefs['activity_type']}")

        current_info = "\n".join(prefs_summary) if prefs_summary else "まだ情報がありません"
        missing_list = "、".join(missing_info)

        return f"""{PromptTemplates.SYSTEM_INSTRUCTION}

現在の情報:
{current_info}

不足している情報: {missing_list}

次に聞くべき質問を1つだけ、自然な日本語で作成してください。
選択肢を2-3個提示すると答えやすくなります。

簡潔で親しみやすい質問を返してください。
"""

    @staticmethod
    def generate_travel_plan(
        location: str,
        travel_time: int,
        activity_type: str,
        meals: list[str],
        child_age: str | None = None,
        transportation: str | None = None,
        latitude: float | None = None,
        longitude: float | None = None,
    ) -> str:
        """
        Create optimized prompt for travel plan generation with Maps grounding.

        Args:
            location: Starting location
            travel_time: Maximum travel time in minutes (one-way)
            activity_type: Type of activities (active/indoor/sightseeing)
            meals: List of meals (lunch/dinner)
            child_age: Age of children if provided
            transportation: Preferred transportation method
            latitude: Starting latitude for better grounding
            longitude: Starting longitude for better grounding

        Returns:
            Formatted prompt for plan generation
        """
        # Format meals
        meal_text = "、".join(meals) if meals else "なし"

        # Format optional info
        optional_info = []
        if child_age:
            optional_info.append(f"- 子供の年齢: {child_age}")
        if transportation:
            optional_info.append(f"- 希望の移動手段: {transportation}")

        optional_section = (
            "\n" + "\n".join(optional_info) if optional_info else ""
        )

        # Coords info for context
        coords_info = ""
        if latitude and longitude:
            coords_info = f"\n（座標: {latitude}, {longitude}）"

        return f"""{PromptTemplates.SYSTEM_INSTRUCTION}

週末の家族向けお出かけプランを作成してください。

## 条件
- 出発地: {location}{coords_info}
- 移動時間: 片道 {travel_time} 分以内
- アクティビティタイプ: {activity_type}
- 食事: {meal_text}{optional_section}

## 必須要件
1. **実在する場所のみ提案**（Google Mapsで確認可能な施設）
2. 家族で楽しめる安全な場所
3. {travel_time}分以内で到達可能な場所

## プラン内容
以下の形式で**3つの場所**を提案してください：

### 1. [施設名]
- **場所**: [住所または最寄り駅]
- **アクセス**: {location}から電車/車で約○○分
- **おすすめポイント**: [具体的な魅力を2-3行]
- **所要時間**: 約○時間
{"- **子供向け設備**: [あれば記載]" if child_age else ""}

### 2. [施設名]
（同様の形式）

### 3. [施設名]
（同様の形式）

{f"## 食事の提案\n各場所の近くで{meal_text}ができるお店も簡潔に紹介してください。" if meals else ""}

## 注意事項
- 実際の施設名、住所、アクセス情報を正確に記載
- 移動時間は現実的な時間を
- 簡潔かつ具体的に（各施設200文字程度）
"""

    @staticmethod
    def refine_plan(
        current_plan: str,
        user_feedback: str,
        preferences: dict[str, Any],
    ) -> str:
        """
        Create prompt for refining an existing plan based on user feedback.

        Args:
            current_plan: The current travel plan
            user_feedback: User's feedback or modification request
            preferences: User preferences for context

        Returns:
            Formatted prompt for plan refinement
        """
        return f"""{PromptTemplates.SYSTEM_INSTRUCTION}

現在のプラン:
{current_plan}

ユーザーからのフィードバック:
"{user_feedback}"

このフィードバックに基づいてプランを修正してください。

## 修正のポイント
1. ユーザーの要望を優先
2. 実在する場所のみ提案
3. 移動時間や条件は守る
4. 全体の整合性を保つ

修正したプランを同じ形式で提示してください。
変更した部分を明確にしてください。
"""

    @staticmethod
    def handle_no_results(
        location: str,
        travel_time: int,
        activity_type: str,
    ) -> str:
        """
        Create prompt to handle cases where no suitable locations are found.

        Args:
            location: Starting location
            travel_time: Travel time constraint
            activity_type: Activity type

        Returns:
            Formatted prompt for suggesting alternatives
        """
        return f"""{PromptTemplates.SYSTEM_INSTRUCTION}

{location}から片道{travel_time}分で{activity_type}の場所を探しましたが、
適切な場所が見つかりませんでした。

以下のいずれかを提案してください：

1. 移動時間を少し延ばす（+15-30分）
2. アクティビティタイプを広げる
3. 近隣の別の出発地から探す

ユーザーに親切に代替案を提示してください。
簡潔に2-3行で回答してください。
"""


# Convenience functions for common use cases
def build_plan_generation_prompt(preferences: dict[str, Any]) -> str:
    """
    Build a travel plan generation prompt from user preferences dict.

    Args:
        preferences: Dictionary containing user preferences

    Returns:
        Formatted prompt string
    """
    location_data = preferences.get("location", {})
    travel_time_data = preferences.get("travel_time")

    return PromptTemplates.generate_travel_plan(
        location=location_data.get("address", "東京駅"),
        travel_time=travel_time_data.get("value", 60) if travel_time_data else 60,
        activity_type=preferences.get("activity_type", "アクティブ"),
        meals=preferences.get("meals", []),
        child_age=preferences.get("child_age"),
        transportation=preferences.get("transportation"),
        latitude=location_data.get("lat"),
        longitude=location_data.get("lng"),
    )
