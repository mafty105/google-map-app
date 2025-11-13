import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

interface Location {
  lat: number;
  lng: number;
  name?: string;
}

interface MapDisplayProps {
  center?: Location;
  markers?: Location[];
  routes?: Location[][];
  zoom?: number;
}

/**
 * MapDisplay - Google Maps integration component
 * Displays map with markers and routes for travel planning
 */
export default function MapDisplay({
  center = { lat: 35.6812, lng: 139.7671, name: 'Tokyo Station' }, // Default: Tokyo Station
  markers = [],
  routes = [],
  zoom = 12,
}: MapDisplayProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapMarkers, setMapMarkers] = useState<google.maps.Marker[]>([]);
  const [directionsRenderer, setDirectionsRenderer] =
    useState<google.maps.DirectionsRenderer | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize Google Maps
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setError('Google Maps API key is not configured');
      return;
    }

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
            center: { lat: center.lat, lng: center.lng },
            zoom: zoom,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
          });

          setMap(newMap);

          // Initialize directions renderer
          const renderer = new google.maps.DirectionsRenderer({
            map: newMap,
            suppressMarkers: false,
            polylineOptions: {
              strokeColor: '#1a4473', // IKYU primary blue
              strokeWeight: 4,
              strokeOpacity: 0.8,
            },
          });
          setDirectionsRenderer(renderer);
        }
      })
      .catch((err) => {
        console.error('Failed to load Google Maps:', err);
        setError('Failed to load Google Maps. Please check your API key.');
      });
  }, []);

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
      const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: location.name || `Location ${index + 1}`,
        label: {
          text: `${index + 1}`,
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 20,
          fillColor: '#1a4473', // IKYU primary blue
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
        },
      });

      // Add info window on click
      if (location.name) {
        const infoWindow = new google.maps.InfoWindow({
          content: `<div style="padding: 8px; font-family: sans-serif;">
            <strong style="color: #1a4473;">${location.name}</strong>
          </div>`,
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      }

      return marker;
    });

    setMapMarkers(newMarkers);

    // Adjust map bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach((marker) => {
        const position = marker.getPosition();
        if (position) {
          bounds.extend(position);
        }
      });
      map.fitBounds(bounds);
    }
  }, [map, markers]);

  // Update routes when prop changes
  useEffect(() => {
    if (!map || !directionsRenderer || routes.length === 0) return;

    // For now, show only the first route
    // TODO: Support multiple routes with different colors
    const route = routes[0];
    if (!route || route.length < 2) return;

    const directionsService = new google.maps.DirectionsService();

    const waypoints = route.slice(1, -1).map((location) => ({
      location: { lat: location.lat, lng: location.lng },
      stopover: true,
    }));

    directionsService.route(
      {
        origin: { lat: route[0].lat, lng: route[0].lng },
        destination: { lat: route[route.length - 1].lat, lng: route[route.length - 1].lng },
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);
        } else {
          console.error('Directions request failed:', status);
        }
      }
    );
  }, [map, directionsRenderer, routes]);

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
            <div className="w-12 h-12 border-4 border-[--color-primary-blue] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">地図を読み込み中...</p>
          </div>
        </div>
      )}
    </div>
  );
}
