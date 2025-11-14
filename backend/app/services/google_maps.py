"""Google Maps Platform APIs integration service.

This module provides a unified interface for Google Maps Platform APIs:
- Geocoding API: Address to coordinates conversion
- Places API: Place details, search, photos
- Directions API: Route calculation and navigation
- Distance Matrix API: Travel time/distance calculations

All methods handle Japanese addresses and include proper error handling.
"""

import logging
from typing import Any

import googlemaps
from googlemaps.exceptions import ApiError, HTTPError, Timeout, TransportError

from app.config import settings

logger = logging.getLogger(__name__)


class GoogleMapsError(Exception):
    """Base exception for Google Maps service errors."""

    pass


class GoogleMapsService:
    """Service for interacting with Google Maps Platform APIs."""

    def __init__(self, api_key: str) -> None:
        """Initialize Google Maps client.

        Args:
            api_key: Google Maps API key
        """
        self.client = googlemaps.Client(key=api_key)
        logger.info("Google Maps service initialized")

    # ========================================
    # Geocoding API Methods
    # ========================================

    def geocode_address(self, address: str, language: str = "ja") -> dict[str, Any] | None:
        """Convert an address to geographic coordinates.

        Args:
            address: The address to geocode (supports Japanese)
            language: Language for results (default: Japanese)

        Returns:
            Dictionary with lat, lng, formatted_address, place_id, or None if not found

        Raises:
            GoogleMapsError: If API call fails
        """
        try:
            results = self.client.geocode(address, language=language)

            if not results:
                logger.warning(f"No geocoding results found for address: {address}")
                return None

            # Return first (best) result
            location = results[0]["geometry"]["location"]
            return {
                "lat": location["lat"],
                "lng": location["lng"],
                "formatted_address": results[0]["formatted_address"],
                "place_id": results[0].get("place_id"),
                "address_components": results[0].get("address_components", []),
            }

        except (ApiError, HTTPError, Timeout, TransportError) as e:
            logger.error(f"Geocoding API error for address '{address}': {e}")
            raise GoogleMapsError(f"Failed to geocode address: {e}") from e

    def reverse_geocode(
        self, lat: float, lng: float, language: str = "ja"
    ) -> dict[str, Any] | None:
        """Convert coordinates to an address.

        Args:
            lat: Latitude
            lng: Longitude
            language: Language for results (default: Japanese)

        Returns:
            Dictionary with formatted_address and address_components, or None if not found

        Raises:
            GoogleMapsError: If API call fails
        """
        try:
            results = self.client.reverse_geocode((lat, lng), language=language)

            if not results:
                logger.warning(f"No reverse geocoding results found for ({lat}, {lng})")
                return None

            return {
                "formatted_address": results[0]["formatted_address"],
                "address_components": results[0].get("address_components", []),
                "place_id": results[0].get("place_id"),
            }

        except (ApiError, HTTPError, Timeout, TransportError) as e:
            logger.error(f"Reverse geocoding API error for ({lat}, {lng}): {e}")
            raise GoogleMapsError(f"Failed to reverse geocode: {e}") from e

    # ========================================
    # Places API Methods
    # ========================================

    def get_place_details(
        self, place_id: str, fields: list[str] | None = None, language: str = "ja"
    ) -> dict[str, Any] | None:
        """Get detailed information about a place.

        Args:
            place_id: The Google Place ID
            fields: List of fields to return (default: name, address, rating, photos)
            language: Language for results (default: Japanese)

        Returns:
            Dictionary with place details, or None if not found

        Raises:
            GoogleMapsError: If API call fails
        """
        if fields is None:
            fields = [
                "name",
                "formatted_address",
                "geometry",
                "rating",
                "user_ratings_total",
                "photos",
                "opening_hours",
                "types",
                "website",
                "formatted_phone_number",
            ]

        try:
            result = self.client.place(place_id=place_id, fields=fields, language=language)

            if result.get("status") == "OK":
                return result.get("result")
            else:
                logger.warning(f"Place details not found for place_id: {place_id}")
                return None

        except (ApiError, HTTPError, Timeout, TransportError) as e:
            logger.error(f"Place details API error for place_id '{place_id}': {e}")
            raise GoogleMapsError(f"Failed to get place details: {e}") from e

    def search_nearby_places(
        self,
        lat: float,
        lng: float,
        radius: int = 5000,
        place_type: str | None = None,
        keyword: str | None = None,
        language: str = "ja",
    ) -> list[dict[str, Any]]:
        """Search for places near a location.

        Args:
            lat: Latitude of search center
            lng: Longitude of search center
            radius: Search radius in meters (default: 5000)
            place_type: Type of place (e.g., 'park', 'museum', 'restaurant')
            keyword: Search keyword
            language: Language for results (default: Japanese)

        Returns:
            List of place dictionaries with name, location, rating, etc.

        Raises:
            GoogleMapsError: If API call fails
        """
        try:
            results = self.client.places_nearby(
                location=(lat, lng),
                radius=radius,
                type=place_type,
                keyword=keyword,
                language=language,
            )

            places = results.get("results", [])
            logger.info(f"Found {len(places)} nearby places")

            return [
                {
                    "place_id": place.get("place_id"),
                    "name": place.get("name"),
                    "location": place.get("geometry", {}).get("location"),
                    "rating": place.get("rating"),
                    "user_ratings_total": place.get("user_ratings_total"),
                    "types": place.get("types", []),
                    "vicinity": place.get("vicinity"),
                }
                for place in places
            ]

        except (ApiError, HTTPError, Timeout, TransportError) as e:
            logger.error(f"Places nearby API error for ({lat}, {lng}): {e}")
            raise GoogleMapsError(f"Failed to search nearby places: {e}") from e

    # ========================================
    # Directions API Methods
    # ========================================

    def get_directions(
        self,
        origin: str | tuple[float, float],
        destination: str | tuple[float, float],
        mode: str = "transit",
        language: str = "ja",
        alternatives: bool = False,
    ) -> list[dict[str, Any]]:
        """Get directions between two locations.

        Args:
            origin: Starting location (address or (lat, lng))
            destination: Ending location (address or (lat, lng))
            mode: Travel mode ('driving', 'walking', 'transit', 'bicycling')
            language: Language for results (default: Japanese)
            alternatives: Whether to return alternative routes

        Returns:
            List of route dictionaries with steps, distance, duration

        Raises:
            GoogleMapsError: If API call fails
        """
        try:
            results = self.client.directions(
                origin=origin,
                destination=destination,
                mode=mode,
                language=language,
                alternatives=alternatives,
            )

            if not results:
                logger.warning(f"No directions found from {origin} to {destination}")
                return []

            routes = []
            for route in results:
                leg = route["legs"][0]  # First leg (single destination)
                routes.append(
                    {
                        "summary": route.get("summary"),
                        "distance": leg["distance"],
                        "duration": leg["duration"],
                        "start_address": leg["start_address"],
                        "end_address": leg["end_address"],
                        "steps": leg["steps"],
                    }
                )

            logger.info(f"Found {len(routes)} route(s) from {origin} to {destination}")
            return routes

        except (ApiError, HTTPError, Timeout, TransportError) as e:
            logger.error(f"Directions API error from {origin} to {destination}: {e}")
            raise GoogleMapsError(f"Failed to get directions: {e}") from e

    # ========================================
    # Distance Matrix API Methods
    # ========================================

    def calculate_distance_matrix(
        self,
        origins: list[str | tuple[float, float]],
        destinations: list[str | tuple[float, float]],
        mode: str = "transit",
        language: str = "ja",
    ) -> dict[str, Any]:
        """Calculate distances and travel times between multiple origins and destinations.

        Args:
            origins: List of starting locations
            destinations: List of ending locations
            mode: Travel mode ('driving', 'walking', 'transit', 'bicycling')
            language: Language for results (default: Japanese)

        Returns:
            Dictionary with origin_addresses, destination_addresses, and rows of results

        Raises:
            GoogleMapsError: If API call fails
        """
        try:
            result = self.client.distance_matrix(
                origins=origins, destinations=destinations, mode=mode, language=language
            )

            return {
                "origin_addresses": result.get("origin_addresses", []),
                "destination_addresses": result.get("destination_addresses", []),
                "rows": result.get("rows", []),
            }

        except (ApiError, HTTPError, Timeout, TransportError) as e:
            logger.error(f"Distance Matrix API error: {e}")
            raise GoogleMapsError(f"Failed to calculate distance matrix: {e}") from e

    def filter_destinations_by_travel_time(
        self,
        origin: str | tuple[float, float],
        destinations: list[dict[str, Any]],
        max_travel_time_minutes: int,
        mode: str = "transit",
    ) -> list[dict[str, Any]]:
        """Filter destinations that are within a specified travel time.

        Args:
            origin: Starting location
            destinations: List of destination dicts with 'lat', 'lng', and optional 'name'
            max_travel_time_minutes: Maximum acceptable travel time in minutes
            mode: Travel mode

        Returns:
            List of destinations within travel time, sorted by duration (closest first)

        Raises:
            GoogleMapsError: If API call fails
        """
        if not destinations:
            return []

        # Convert destinations to coordinate tuples
        dest_coords = [(dest["lat"], dest["lng"]) for dest in destinations]

        try:
            result = self.calculate_distance_matrix(
                origins=[origin], destinations=dest_coords, mode=mode
            )

            rows = result.get("rows", [])
            if not rows or not rows[0].get("elements"):
                logger.warning("No distance matrix results returned")
                return []

            elements = rows[0]["elements"]
            filtered = []

            for i, element in enumerate(elements):
                if element.get("status") == "OK":
                    duration_seconds = element["duration"]["value"]
                    duration_minutes = duration_seconds / 60

                    if duration_minutes <= max_travel_time_minutes:
                        dest = destinations[i].copy()
                        dest["travel_time"] = {
                            "duration_text": element["duration"]["text"],
                            "duration_minutes": round(duration_minutes, 1),
                            "distance_text": element["distance"]["text"],
                            "distance_meters": element["distance"]["value"],
                        }
                        filtered.append(dest)

            # Sort by duration (closest first)
            filtered.sort(key=lambda x: x["travel_time"]["duration_minutes"])

            logger.info(
                f"Filtered {len(filtered)} destinations within {max_travel_time_minutes} minutes"
            )
            return filtered

        except (ApiError, HTTPError, Timeout, TransportError) as e:
            logger.error(f"Failed to filter destinations by travel time: {e}")
            raise GoogleMapsError(f"Failed to filter destinations: {e}") from e


# Global service instance
google_maps_service = GoogleMapsService(api_key=settings.google_maps_api_key)
