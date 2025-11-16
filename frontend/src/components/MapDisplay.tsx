import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

interface Location {
  lat: number;
  lng: number;
  name?: string;
  index?: number; // Marker number for display
}

interface MapDisplayProps {
  center?: Location;
  markers?: Location[];
  routes?: Location[][];
  zoom?: number;
  onMarkerClick?: (index: number) => void; // Callback when marker is clicked
}

// Default location (Tokyo Station)
const DEFAULT_CENTER: Location = { lat: 35.6812, lng: 139.7671, name: 'Tokyo Station' };

/**
 * MapDisplay - Google Maps integration component
 * Displays map with markers and routes for travel planning
 */
export default function MapDisplay({
  center,
  markers = [],
  routes = [],
  zoom = 15,
  onMarkerClick,
}: MapDisplayProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapMarkers, setMapMarkers] = useState<google.maps.Marker[]>([]);
  const [polylines, setPolylines] = useState<google.maps.Polyline[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);

  // Get user's current location on mount
  useEffect(() => {
    // If center is provided explicitly, use it and don't get geolocation
    if (center) {
      setCurrentLocation(center);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Got current position:', position.coords);
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: 'Current Location',
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Fall back to default center
          setCurrentLocation(DEFAULT_CENTER);
        }
      );
    } else {
      console.warn('Geolocation not supported');
      // Fall back to default center
      setCurrentLocation(DEFAULT_CENTER);
    }
  }, []);

  // Initialize Google Maps
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setError('Google Maps API key is not configured');
      return;
    }

    if (!currentLocation) return;

    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['places', 'geometry'],
    });

    loader
      .load()
      .then(() => {
        if (mapRef.current) {
          const newMap = new google.maps.Map(mapRef.current, {
            center: { lat: currentLocation.lat, lng: currentLocation.lng },
            zoom: zoom,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
          });

          setMap(newMap);
        }
      })
      .catch((err) => {
        console.error('Failed to load Google Maps:', err);
        setError('Failed to load Google Maps. Please check your API key.');
      });
  }, [currentLocation]);

  // Update map center when prop changes
  useEffect(() => {
    if (map && center) {
      map.setCenter({ lat: center.lat, lng: center.lng });
    }
  }, [map, center]);

  // Update markers when prop changes
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    mapMarkers.forEach((marker) => marker.setMap(null));

    // Add new markers
    const newMarkers = markers.map((location, index) => {
      const markerNumber = location.index || index + 1;
      const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: location.name || `スポット ${markerNumber}`,
        label: {
          text: String(markerNumber),
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 20,
          fillColor: '#1d4ed8', // blue-700
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
        },
      });

      // Add info window on click
      if (location.name) {
        const infoWindow = new google.maps.InfoWindow({
          content: `<div style="padding: 8px; font-family: sans-serif;">
            <strong style="color: #1d4ed8;">${location.name}</strong>
          </div>`,
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);

          // Call the callback to open drawer
          if (onMarkerClick && location.index !== undefined) {
            onMarkerClick(location.index - 1); // Convert to 0-indexed
          }
        });
      }

      return marker;
    });

    setMapMarkers(newMarkers);

    // Adjust map bounds to show all markers with padding
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach((marker) => {
        const position = marker.getPosition();
        if (position) {
          bounds.extend(position);
        }
      });

      // Add padding to ensure markers aren't at the edge
      map.fitBounds(bounds, {
        top: 80,
        right: 80,
        bottom: 80,
        left: 80,
      });
    }
  }, [map, markers]);

  // Update routes when prop changes - draw polylines without DirectionsService
  useEffect(() => {
    if (!map) return;

    // Clear existing polylines
    polylines.forEach((polyline) => polyline.setMap(null));

    if (routes.length === 0) {
      setPolylines([]);
      return;
    }

    // Draw polylines for each route
    const newPolylines: google.maps.Polyline[] = [];

    routes.forEach((route) => {
      if (!route || route.length < 2) return;

      // Create path from route locations
      const path = route.map((location) => ({
        lat: location.lat,
        lng: location.lng,
      }));

      // Create polyline
      const polyline = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#1d4ed8', // blue-700
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: map,
      });

      newPolylines.push(polyline);
    });

    setPolylines(newPolylines);
  }, [map, routes]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-6">
          <p className="text-red-600 font-medium mb-2">地図の読み込みに失敗しました</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      {!map && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">地図を読み込み中...</p>
          </div>
        </div>
      )}
    </div>
  );
}
