/**
 * Type definitions for travel plan data
 */

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface Place {
  id: string;
  name: string;
  location: Location;
  placeId?: string;
  photoUrl?: string;
  rating?: number;
  address?: string;
  openingHours?: string;
  description?: string;
  category?: string;
  kidFriendly?: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  location: Location;
  placeId?: string;
  photoUrl?: string;
  rating?: number;
  address?: string;
  cuisine?: string;
  priceRange?: '¥' | '¥¥' | '¥¥¥' | '¥¥¥¥';
  kidFriendly?: boolean;
  kidsMenu?: boolean;
  openingHours?: string;
}

export interface Activity {
  id: string;
  type: 'departure' | 'travel' | 'destination' | 'meal' | 'return';
  time: string; // HH:MM format
  duration?: number; // minutes
  place?: Place;
  restaurant?: Restaurant;
  travelMode?: 'driving' | 'walking' | 'transit';
  travelTime?: number; // minutes
  description?: string;
}

export interface TravelPlan {
  id: string;
  title: string;
  date?: string;
  activities: Activity[];
  totalDuration: number; // minutes
  totalTravelTime: number; // minutes
  estimatedCost?: {
    total: number;
    transportation?: number;
    meals?: number;
    activities?: number;
  };
  route?: Location[];
  summary?: string;
}
