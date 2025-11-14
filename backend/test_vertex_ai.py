"""Quick test script for Vertex AI integration."""

import logging
import sys

# Add app to path
sys.path.insert(0, ".")

from app.services.vertex_ai import vertex_ai_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


def test_basic_call():
    """Test basic Vertex AI call without grounding."""
    logger.info("Testing basic Vertex AI call...")
    try:
        response = vertex_ai_service.generate_content(
            "こんにちは！簡単な自己紹介をしてください。",
            use_grounding=False,
        )
        logger.info(f"Response: {response}")
        return True
    except Exception as e:
        logger.error(f"Basic call failed: {e}")
        return False


def test_maps_grounding():
    """Test Vertex AI with Google Maps grounding."""
    logger.info("Testing Vertex AI with Google Maps grounding...")
    try:
        # Tokyo Station coordinates
        response = vertex_ai_service.generate_content(
            "東京駅から片道1時間以内で行ける、家族で楽しめるアクティブな場所を3つ提案してください。",
            use_grounding=True,
            latitude=35.6812,
            longitude=139.7671,
        )
        logger.info(f"Response with grounding: {response}")
        return True
    except Exception as e:
        logger.error(f"Grounding call failed: {e}")
        return False


def test_travel_plan():
    """Test travel plan generation."""
    logger.info("Testing travel plan generation...")
    try:
        preferences = {
            "location": {"address": "東京駅"},
            "travel_time": {"value": 60, "unit": "minutes", "direction": "one-way"},
            "activity_type": "active/outdoor",
            "meals": ["lunch"],
        }
        plan = vertex_ai_service.generate_travel_plan(preferences)
        logger.info(f"Generated plan: {plan}")
        return True
    except Exception as e:
        logger.error(f"Travel plan generation failed: {e}")
        return False


if __name__ == "__main__":
    logger.info("Starting Vertex AI integration tests...")

    results = {
        "Basic Call": test_basic_call(),
        "Maps Grounding": test_maps_grounding(),
        "Travel Plan": test_travel_plan(),
    }

    logger.info("\n" + "=" * 50)
    logger.info("Test Results:")
    for test_name, passed in results.items():
        status = "✓ PASSED" if passed else "✗ FAILED"
        logger.info(f"  {test_name}: {status}")

    all_passed = all(results.values())
    logger.info("=" * 50)

    if all_passed:
        logger.info("All tests passed!")
        sys.exit(0)
    else:
        logger.error("Some tests failed!")
        sys.exit(1)
