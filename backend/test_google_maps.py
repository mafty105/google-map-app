"""Test script for Google Maps Platform APIs integration.

This script tests the main functionality of the Google Maps service:
- Geocoding (address to coordinates)
- Reverse geocoding (coordinates to address)
- Place details lookup
- Nearby places search
- Directions calculation
- Distance matrix filtering
"""

import logging
import sys

# Add app to path
sys.path.insert(0, ".")

from app.services.google_maps import google_maps_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


def test_geocoding():
    """Test address to coordinates conversion (Japanese address)."""
    logger.info("\nTesting geocoding with Japanese address...")

    try:
        result = google_maps_service.geocode_address("東京駅")

        if result:
            logger.info(f"✓ Geocoding successful")
            logger.info(f"  Address: {result['formatted_address']}")
            logger.info(f"  Coordinates: ({result['lat']}, {result['lng']})")
            logger.info(f"  Place ID: {result['place_id']}")

            # Basic validation
            assert result["lat"] is not None
            assert result["lng"] is not None
            assert "東京" in result["formatted_address"]

            return True
        else:
            logger.error("✗ No geocoding result returned")
            return False

    except Exception as e:
        logger.error(f"✗ Geocoding test failed: {e}")
        return False


def test_reverse_geocoding():
    """Test coordinates to address conversion."""
    logger.info("\nTesting reverse geocoding...")

    try:
        # Tokyo Station coordinates
        lat, lng = 35.6812, 139.7671
        result = google_maps_service.reverse_geocode(lat, lng)

        if result:
            logger.info(f"✓ Reverse geocoding successful")
            logger.info(f"  Address: {result['formatted_address']}")
            logger.info(f"  Place ID: {result.get('place_id')}")

            assert result["formatted_address"] is not None
            return True
        else:
            logger.error("✗ No reverse geocoding result returned")
            return False

    except Exception as e:
        logger.error(f"✗ Reverse geocoding test failed: {e}")
        return False


def test_nearby_places_search():
    """Test searching for nearby parks around Tokyo Station."""
    logger.info("\nTesting nearby places search...")

    try:
        # Tokyo Station coordinates
        lat, lng = 35.6812, 139.7671

        results = google_maps_service.search_nearby_places(
            lat=lat, lng=lng, radius=3000, place_type="park", language="ja"
        )

        if results:
            logger.info(f"✓ Found {len(results)} nearby parks")
            for i, place in enumerate(results[:3], 1):
                logger.info(f"  {i}. {place['name']}")
                logger.info(f"     Rating: {place.get('rating', 'N/A')}")
                logger.info(f"     Location: {place.get('vicinity', 'N/A')}")

            assert len(results) > 0
            assert results[0]["name"] is not None
            return True
        else:
            logger.warning("✗ No nearby places found (unexpected)")
            return False

    except Exception as e:
        logger.error(f"✗ Nearby places search test failed: {e}")
        return False


def test_directions():
    """Test getting directions between two locations."""
    logger.info("\nTesting directions calculation...")

    try:
        # Tokyo Station to Shinjuku Station
        origin = "東京駅"
        destination = "新宿駅"

        # Try with driving mode first (transit may require departure_time)
        routes = google_maps_service.get_directions(
            origin=origin, destination=destination, mode="driving", language="ja"
        )

        if routes:
            route = routes[0]
            logger.info(f"✓ Directions calculated successfully")
            logger.info(f"  From: {route['start_address']}")
            logger.info(f"  To: {route['end_address']}")
            logger.info(f"  Distance: {route['distance']['text']}")
            logger.info(f"  Duration: {route['duration']['text']}")
            logger.info(f"  Steps: {len(route['steps'])} steps")

            assert route["duration"]["value"] > 0
            assert route["distance"]["value"] > 0
            return True
        else:
            logger.error("✗ No directions found")
            return False

    except Exception as e:
        logger.error(f"✗ Directions test failed: {e}")
        return False


def test_distance_matrix():
    """Test calculating distances to multiple destinations."""
    logger.info("\nTesting distance matrix...")

    try:
        origin = "東京駅"
        destinations = ["新宿駅", "渋谷駅", "池袋駅"]

        result = google_maps_service.calculate_distance_matrix(
            origins=[origin], destinations=destinations, mode="driving", language="ja"
        )

        if result and result["rows"]:
            logger.info(f"✓ Distance matrix calculated")
            logger.info(f"  Origin: {result['origin_addresses'][0]}")

            elements = result["rows"][0]["elements"]
            for i, dest_addr in enumerate(result["destination_addresses"]):
                element = elements[i]
                if element["status"] == "OK":
                    logger.info(f"  → {dest_addr}")
                    logger.info(f"    Distance: {element['distance']['text']}")
                    logger.info(f"    Duration: {element['duration']['text']}")

            assert len(result["rows"]) > 0
            return True
        else:
            logger.error("✗ No distance matrix results")
            return False

    except Exception as e:
        logger.error(f"✗ Distance matrix test failed: {e}")
        return False


def test_filter_by_travel_time():
    """Test filtering destinations by maximum travel time."""
    logger.info("\nTesting travel time filtering...")

    try:
        origin = "東京駅"

        # Sample destinations with coordinates
        destinations = [
            {"name": "葛西臨海公園", "lat": 35.6436, "lng": 139.8590},
            {"name": "お台場海浜公園", "lat": 35.6299, "lng": 139.7742},
            {"name": "昭和記念公園", "lat": 35.6978, "lng": 139.4074},  # Farther away
        ]

        # Filter to 60 minutes max (using driving mode for consistency)
        filtered = google_maps_service.filter_destinations_by_travel_time(
            origin=origin, destinations=destinations, max_travel_time_minutes=60, mode="driving"
        )

        if filtered:
            logger.info(f"✓ Filtered to {len(filtered)} destinations within 60 minutes")
            for dest in filtered:
                logger.info(f"  {dest['name']}")
                logger.info(f"    Travel time: {dest['travel_time']['duration_text']}")
                logger.info(f"    Distance: {dest['travel_time']['distance_text']}")

            # All filtered results should be within 60 minutes
            for dest in filtered:
                assert dest["travel_time"]["duration_minutes"] <= 60

            return True
        else:
            logger.warning("✗ No destinations within travel time (might be too restrictive)")
            return True  # Not necessarily a failure

    except Exception as e:
        logger.error(f"✗ Travel time filtering test failed: {e}")
        return False


def main():
    """Run all Google Maps API tests."""
    logger.info("=" * 60)
    logger.info("Starting Google Maps Platform API Tests")
    logger.info("=" * 60)

    results = {
        "Geocoding": test_geocoding(),
        "Reverse Geocoding": test_reverse_geocoding(),
        "Nearby Places Search": test_nearby_places_search(),
        "Directions": test_directions(),
        "Distance Matrix": test_distance_matrix(),
        "Travel Time Filtering": test_filter_by_travel_time(),
    }

    logger.info("\n" + "=" * 60)
    logger.info("Test Results:")
    logger.info("=" * 60)
    for test_name, passed in results.items():
        status = "✓ PASSED" if passed else "✗ FAILED"
        logger.info(f"  {test_name}: {status}")

    all_passed = all(results.values())
    logger.info("=" * 60)

    if all_passed:
        logger.info("\n✓ All tests passed! Google Maps APIs are working correctly.")
        sys.exit(0)
    else:
        logger.error("\n✗ Some tests failed. Review the output above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
