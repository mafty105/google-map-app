"""Test script for prompt templates."""

import logging
import sys

# Add app to path
sys.path.insert(0, ".")

from app.services.prompts import PromptTemplates, build_plan_generation_prompt
from app.services.vertex_ai import vertex_ai_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


def test_travel_plan_prompt():
    """Test the travel plan generation with improved prompt."""
    logger.info("Testing improved travel plan prompt...")

    try:
        # Sample preferences
        preferences = {
            "location": {
                "address": "東京駅",
                "lat": 35.6812,
                "lng": 139.7671,
            },
            "travel_time": {"value": 60, "unit": "minutes", "direction": "one-way"},
            "activity_type": "アクティブ/アウトドア",
            "meals": ["lunch"],
            "child_age": "5-10歳",
        }

        # Build prompt
        prompt = build_plan_generation_prompt(preferences)
        logger.info(f"\n{'='*60}\nGenerated Prompt:\n{'='*60}\n{prompt}\n{'='*60}\n")

        # Generate plan
        logger.info("Calling Vertex AI with improved prompt...")
        response = vertex_ai_service.generate_content(
            prompt,
            use_grounding=True,
            latitude=preferences["location"]["lat"],
            longitude=preferences["location"]["lng"],
        )

        logger.info(f"\n{'='*60}\nAI Response:\n{'='*60}\n{response}\n{'='*60}\n")

        # Validate response quality
        success = True

        # Check if response mentions actual places
        if "施設" in response or "場所" in response:
            logger.info("✓ Response includes place information")
        else:
            logger.warning("✗ Response may not include proper place information")
            success = False

        # Check if response includes access information
        if "アクセス" in response or "分" in response:
            logger.info("✓ Response includes access information")
        else:
            logger.warning("✗ Response may not include access information")
            success = False

        # Check response length (should be detailed)
        if len(response) > 500:
            logger.info(f"✓ Response is detailed ({len(response)} characters)")
        else:
            logger.warning(f"✗ Response may be too short ({len(response)} characters)")
            success = False

        return success

    except Exception as e:
        logger.error(f"Travel plan test failed: {e}")
        return False


def test_clarifying_question_prompt():
    """Test the clarifying question generation."""
    logger.info("\nTesting clarifying question prompt...")

    try:
        current_prefs = {
            "location": {"address": "渋谷駅"},
            "travel_time": "片道1時間",
        }
        missing_info = ["アクティビティタイプ", "食事の希望"]

        prompt = PromptTemplates.generate_clarifying_question(
            current_prefs, missing_info
        )

        logger.info(f"\n{'='*60}\nClarifying Question Prompt:\n{'='*60}\n{prompt}\n{'='*60}\n")

        # Generate question
        response = vertex_ai_service.generate_content(
            prompt,
            use_grounding=False,  # No grounding needed for questions
        )

        logger.info(f"\n{'='*60}\nGenerated Question:\n{'='*60}\n{response}\n{'='*60}\n")

        # Validate
        if "?" in response or "か" in response:
            logger.info("✓ Response is a proper question")
            return True
        else:
            logger.warning("✗ Response may not be a question")
            return False

    except Exception as e:
        logger.error(f"Clarifying question test failed: {e}")
        return False


def main():
    """Run all prompt tests."""
    logger.info("Starting prompt template tests...\n")

    results = {
        "Travel Plan Prompt": test_travel_plan_prompt(),
        "Clarifying Question": test_clarifying_question_prompt(),
    }

    logger.info("\n" + "=" * 60)
    logger.info("Test Results:")
    for test_name, passed in results.items():
        status = "✓ PASSED" if passed else "✗ FAILED"
        logger.info(f"  {test_name}: {status}")

    all_passed = all(results.values())
    logger.info("=" * 60)

    if all_passed:
        logger.info("\nAll tests passed! Prompts are working well.")
        sys.exit(0)
    else:
        logger.error("\nSome tests failed. Review the prompts.")
        sys.exit(1)


if __name__ == "__main__":
    main()
