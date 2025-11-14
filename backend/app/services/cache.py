"""Simple in-memory cache service for API responses.

This module provides a simple LRU cache implementation to reduce
redundant API calls for expensive operations like geocoding.
"""

import logging
import time
from collections import OrderedDict
from typing import Any, Optional

logger = logging.getLogger(__name__)


class SimpleCache:
    """Simple in-memory LRU cache with TTL support."""

    def __init__(self, max_size: int = 1000, ttl_seconds: int = 3600) -> None:
        """Initialize cache.

        Args:
            max_size: Maximum number of items to store
            ttl_seconds: Time-to-live for cache entries in seconds (default: 1 hour)
        """
        self._cache: OrderedDict[str, tuple[Any, float]] = OrderedDict()
        self._max_size = max_size
        self._ttl_seconds = ttl_seconds
        self._hits = 0
        self._misses = 0
        logger.info(f"Initialized cache with max_size={max_size}, ttl={ttl_seconds}s")

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if it exists and hasn't expired.

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found/expired
        """
        if key not in self._cache:
            self._misses += 1
            return None

        value, timestamp = self._cache[key]

        # Check if expired
        if time.time() - timestamp > self._ttl_seconds:
            logger.debug(f"Cache expired for key: {key}")
            del self._cache[key]
            self._misses += 1
            return None

        # Move to end (most recently used)
        self._cache.move_to_end(key)
        self._hits += 1
        logger.debug(f"Cache hit for key: {key}")
        return value

    def set(self, key: str, value: Any) -> None:
        """Store value in cache.

        Args:
            key: Cache key
            value: Value to cache
        """
        # If key exists, update it
        if key in self._cache:
            self._cache.move_to_end(key)

        # Add new entry
        self._cache[key] = (value, time.time())

        # Evict oldest if over max size
        if len(self._cache) > self._max_size:
            oldest_key = next(iter(self._cache))
            del self._cache[oldest_key]
            logger.debug(f"Evicted oldest cache entry: {oldest_key}")

        logger.debug(f"Cached value for key: {key}")

    def clear(self) -> None:
        """Clear all cache entries."""
        self._cache.clear()
        self._hits = 0
        self._misses = 0
        logger.info("Cache cleared")

    def get_stats(self) -> dict[str, int | float]:
        """Get cache statistics.

        Returns:
            Dictionary with hit rate, size, hits, and misses
        """
        total_requests = self._hits + self._misses
        hit_rate = self._hits / total_requests if total_requests > 0 else 0.0

        return {
            "size": len(self._cache),
            "max_size": self._max_size,
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": round(hit_rate * 100, 2),
        }


# Global cache instances for different use cases
geocoding_cache = SimpleCache(max_size=500, ttl_seconds=86400)  # 24 hours
place_details_cache = SimpleCache(max_size=500, ttl_seconds=3600)  # 1 hour
