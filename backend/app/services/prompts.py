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
    def extract_preferences_from_freeform(user_message: str) -> str:
        """
        Create prompt to extract all possible preferences from free-form user input.
        This uses structured JSON output for reliable parsing.

        Args:
            user_message: The user's free-form message

        Returns:
            Formatted prompt for comprehensive preference extraction
        """
        return f"""{PromptTemplates.SYSTEM_INSTRUCTION}

ユーザーの自由な入力から、お出かけプランに必要な情報を抽出してJSON形式で返してください。

ユーザーメッセージ: "{user_message}"

以下の項目について、**明示的に言及されている情報のみ**抽出してください。
推測や補完はせず、言及されていない項目はnullにしてください。

JSON形式で返答してください:
{{
  "location": {{
    "address": "出発地の名称（駅名、住所、ランドマーク）または null",
    "explicit": true/false  // ユーザーが明示的に出発地を指定したか
  }},
  "travel_time": {{
    "value": 移動時間の数値（分単位）または null,
    "direction": "one-way" または "round-trip" または null,
    "unit": "minutes" または null
  }},
  "activity_type": "具体的な活動内容（例: 動物園、博物館、公園、アクティブ、インドア）または null",
  "meals": ["lunch" または "dinner" のリスト、言及がなければ空配列],
  "child_age": "子供の年齢（例: 3, 0-3, 5-10）または null",
  "transportation": "car" または "public" または null,
  "destination": "目的地の名称（もし言及があれば）または null",
  "special_requirements": ["特別な要望のリスト（例: 雨でもOK、ベビーカーOK）"],
  "enough_to_generate": true/false  // この情報だけでプラン生成可能か
}}

抽出ルール:
1. 出発地: 「〜から」「〜駅」「〜周辺」などの表現を探す
2. 移動時間: 「30分」「1時間」「片道」「往復」などの表現
3. アクティビティ: 具体的な施設名や活動内容
4. 子供の年齢: 「3歳」「小学生」などの表現
5. 交通手段: 「車で」「電車で」などの表現
6. enough_to_generate: 最低限「出発地または目的地」と「大まかな希望」があればtrue

例:
入力: "3歳の子供と横浜駅から車で30分くらいで行ける動物園を探しています"
{{
  "location": {{"address": "横浜駅", "explicit": true}},
  "travel_time": {{"value": 30, "direction": "one-way", "unit": "minutes"}},
  "activity_type": "動物園",
  "meals": [],
  "child_age": "3",
  "transportation": "car",
  "destination": null,
  "special_requirements": [],
  "enough_to_generate": true
}}

入力: "週末に子供とどこか遊びに行きたい"
{{
  "location": {{"address": null, "explicit": false}},
  "travel_time": {{"value": null, "direction": null, "unit": null}},
  "activity_type": null,
  "meals": [],
  "child_age": null,
  "transportation": null,
  "destination": null,
  "special_requirements": [],
  "enough_to_generate": false
}}

**JSONのみ**を返してください。他の説明は不要です。
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
        priority_order: list[str] = ["child_age", "transportation", "travel_time", "location"],
    ) -> str:
        """
        Create prompt to generate a natural clarifying question.
        Only asks for critical missing information in priority order.

        Args:
            current_prefs: Current user preferences
            missing_info: List of missing information
            priority_order: Order of importance for missing info

        Returns:
            Formatted prompt for question generation
        """
        prefs_summary = []
        if current_prefs.get("location", {}).get("address"):
            prefs_summary.append(f"出発地: {current_prefs['location']['address']}")
        if current_prefs.get("travel_time"):
            travel_time = current_prefs['travel_time']
            if isinstance(travel_time, dict):
                prefs_summary.append(f"移動時間: {travel_time.get('value', '')}分")
            else:
                prefs_summary.append(f"移動時間: {travel_time}")
        if current_prefs.get("activity_type"):
            prefs_summary.append(f"アクティビティ: {current_prefs['activity_type']}")
        if current_prefs.get("child_age"):
            prefs_summary.append(f"子供の年齢: {current_prefs['child_age']}歳")

        current_info = "\n".join(prefs_summary) if prefs_summary else "まだ情報がありません"

        # Find the highest priority missing item
        priority_missing = None
        for item in priority_order:
            if item in missing_info:
                priority_missing = item
                break

        return f"""{PromptTemplates.SYSTEM_INSTRUCTION}

現在わかっている情報:
{current_info}

次に確認が必要な項目: {priority_missing if priority_missing else missing_info[0]}

この項目について、ユーザーに質問を1つだけ自然な日本語で作成してください。

質問の作り方：
1. 親しみやすく簡潔に
2. 選択肢を2-4個提示すると答えやすい
3. 「その他」という選択肢も追加する

例:
- location: 「どちらから出発されますか？」
- child_age: 「お子様は何歳ですか？」（選択肢: 0-2歳、3-5歳、6-8歳、9-12歳、その他）
- transportation: 「移動手段は車と公共交通機関、どちらをご利用予定ですか？」（選択肢: 車、電車・バス）
- travel_time: 「移動時間はどのくらいまで大丈夫ですか？」（選択肢: 30分以内、1時間以内、2時間以内）

質問文のみを返してください。説明は不要です。
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
        exclude_place_ids: list[str] | None = None,
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
            transport_text = "車" if transportation == "car" else "公共交通機関（電車・バス）"
            optional_info.append(f"- 移動手段: {transport_text}")

        optional_section = (
            "\n" + "\n".join(optional_info) if optional_info else ""
        )

        # Coords info for context
        coords_info = ""
        if latitude and longitude:
            coords_info = f"\n（座標: {latitude}, {longitude}）"

        # Format activity type requirement based on weather consideration
        activity_requirement = ""
        if activity_type == "室内":
            activity_requirement = """
5. **室内施設を優先**：天候に左右されない室内施設のみを提案してください
   - 推奨：博物館、科学館、水族館、美術館、室内遊び場、ショッピングモール、図書館など
   - 避ける：公園、動物園、遊園地などの屋外施設"""
        elif activity_type == "屋外":
            activity_requirement = """
5. **屋外施設を優先**：晴れた日に楽しめる屋外施設のみを提案してください
   - 推奨：公園、遊び場、動物園、植物園、テーマパーク、自然公園など
   - 避ける：博物館、科学館などの純粋な室内施設"""
        elif activity_type == "どちらでもよい":
            activity_requirement = """
5. **室内・屋外をバランスよく**：天候に関わらず楽しめるよう、室内と屋外の施設を組み合わせて提案してください
   - 例：室内施設1つ + 屋外施設1つ + どちらでも楽しめる施設1つ"""
        else:
            # Legacy activity types (if any remain)
            activity_requirement = f"""
5. {activity_type}に適した施設を優先"""

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
{f"4. 車でアクセスしやすく、駐車場がある場所を優先" if transportation == "car" else "4. 駅から近く、公共交通機関でアクセスしやすい場所を優先"}{activity_requirement}

## プラン内容
以下の形式で**3つの場所**を提案してください：

**多様性の重視**:
- 観光名所だけでなく、地域の博物館、科学館、公園、図書館なども積極的に提案
- 子供が学べる施設や体験型の場所を優先
- 有名な場所と地元の人が利用する場所をバランスよく含める
- 市立・県立などの公共施設も検討対象に含める

### 1. [施設名]
- **場所**: [住所または最寄り駅]
- **アクセス**: {location}から{f"車で約○○分" if transportation == "car" else "電車・バスで約○○分"}
- **おすすめポイント**: [具体的な魅力を2-3行]
- **所要時間**: 約○時間
{"- **子供向け設備**: [あれば記載]" if child_age else ""}
{f"- **駐車場**: [駐車場の有無と料金]" if transportation == "car" else ""}

### 2. [施設名]
（同様の形式）

### 3. [施設名]
（同様の形式）

{f"## 食事の提案\n各場所の近くで{meal_text}ができるお店も簡潔に紹介してください。" if meals else ""}

## 注意事項
- 実際の施設名、住所、アクセス情報を正確に記載
- 移動時間は現実的な時間を
- 簡潔かつ具体的に（各施設200文字程度）
{_generate_exclusion_section(exclude_place_ids)}
"""


def _generate_exclusion_section(exclude_place_ids: list[str] | None) -> str:
    """Generate exclusion section for already-shown places."""
    if not exclude_place_ids or len(exclude_place_ids) == 0:
        return ""

    return f"""

## 除外する施設
以下のGoogle Place IDは既に提案済みです。**必ずこれらの施設を除外し、別の施設を提案してください**:
{chr(10).join(f"- {place_id}" for place_id in exclude_place_ids)}
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
def build_plan_generation_prompt(
    preferences: dict[str, Any],
    exclude_place_ids: list[str] | None = None
) -> str:
    """
    Build a travel plan generation prompt from user preferences dict.

    Args:
        preferences: Dictionary containing user preferences
        exclude_place_ids: Optional list of place IDs to exclude from suggestions

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
        exclude_place_ids=exclude_place_ids,
    )
