"""Places API routes for nearby search and place details."""

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Query, status

from app.services.google_maps import google_maps_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/places", tags=["places"])


@router.get("/nearby-restaurants")
async def get_nearby_restaurants(
    place_id: str = Query(..., description="Place ID to search around"),
    radius: int = Query(default=1000, le=2000, description="Search radius in meters (max 2000m)"),
    max_results: int = Query(default=3, le=5, description="Maximum number of results (max 5)"),
    child_age: int | None = Query(default=None, ge=0, le=18, description="Child age in years"),
) -> dict[str, Any]:
    """Get nearby child-friendly restaurants around a specific place.

    Filters for family-friendly restaurants based on:
    - Price level (affordable for families)
    - Restaurant type (casual, not bars/nightclubs/izakayas)
    - Ratings (3.5+)
    - Child age (younger children favor family restaurants)

    Args:
        place_id: Google Place ID of the location to search around
        radius: Search radius in meters (default 1000m, max 2000m)
        max_results: Maximum number of results to return (default 3, max 5)
        child_age: Age of child in years (affects restaurant scoring)

    Returns:
        Dictionary with list of child-friendly restaurants including reviews

    Raises:
        HTTPException: If place not found or API error
    """
    try:
        # Get place details to get the location
        place_details = google_maps_service.get_place_details(
            place_id=place_id,
            fields=["geometry"],
        )

        if not place_details:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Place not found: {place_id}"
            )

        location = place_details.get("geometry", {}).get("location")
        if not location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Place location not available"
            )

        # Search for child-friendly restaurants
        restaurants = google_maps_service.search_child_friendly_restaurants(
            lat=location["lat"],
            lng=location["lng"],
            radius=radius,
            max_results=max_results,
            child_age=child_age,
            language="ja",
        )

        logger.info(f"Found {len(restaurants)} child-friendly restaurants near {place_id}")

        return {
            "restaurants": restaurants,
            "count": len(restaurants),
            "search_location": location,
            "radius_meters": radius,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching nearby restaurants for {place_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch nearby restaurants: {str(e)}"
        )
