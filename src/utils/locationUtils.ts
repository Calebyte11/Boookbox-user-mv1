import {
  getDistance,
  isPointWithinRadius,
  getCompassDirection,
  convertDistance,
} from "geolib";

// Location utility functions using geolib
export const calculateDistance = (
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number },
  unit: "m" | "km" | "mi" = "km"
): number => {
  const distanceInMeters = getDistance(
    { latitude: point1.lat, longitude: point1.lng },
    { latitude: point2.lat, longitude: point2.lng }
  );

  switch (unit) {
    case "km":
      return convertDistance(distanceInMeters, "km");
    case "mi":
      return convertDistance(distanceInMeters, "mi");
    default:
      return distanceInMeters;
  }
};

export const isWithinRadius = (
  userLocation: { lat: number; lng: number },
  targetLocation: { lat: number; lng: number },
  radius: number // in meters
): boolean => {
  return isPointWithinRadius(
    { latitude: userLocation.lat, longitude: userLocation.lng },
    { latitude: targetLocation.lat, longitude: targetLocation.lng },
    radius
  );
};

export const getDirection = (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): string => {
  return getCompassDirection(
    { latitude: from.lat, longitude: from.lng },
    { latitude: to.lat, longitude: to.lng }
  );
};

export const formatDistance = (
  distance: number,
  unit: "m" | "km" | "mi" = "km"
): string => {
  if (unit === "km") {
    return distance < 1
      ? `${Math.round(distance * 1000)}m`
      : `${distance.toFixed(1)}km`;
  } else if (unit === "mi") {
    return `${distance.toFixed(1)}mi`;
  }
  return `${Math.round(distance)}m`;
};

// Helper to get multiple distances
export const getDistances = (
  userLocation: { lat: number; lng: number },
  locations: Array<{ id: string; lat: number; lng: number }>,
  unit: "m" | "km" | "mi" = "km"
) => {
  return locations.map((loc) => ({
    id: loc.id,
    distance: calculateDistance(
      userLocation,
      { lat: loc.lat, lng: loc.lng },
      unit
    ),
    direction: getDirection(userLocation, { lat: loc.lat, lng: loc.lng }),
    formatted: formatDistance(
      calculateDistance(userLocation, { lat: loc.lat, lng: loc.lng }, unit),
      unit
    ),
  }));
};

// Helper to sort locations by distance
export const sortByDistance = (
  userLocation: { lat: number; lng: number },
  locations: Array<{
    id: string;
    lat: number;
    lng: number;
    [key: string]: unknown;
  }>,
  unit: "m" | "km" | "mi" = "km"
) => {
  return locations
    .map((loc) => ({
      ...loc,
      distance: calculateDistance(
        userLocation,
        { lat: loc.lat, lng: loc.lng },
        unit
      ),
    }))
    .sort((a, b) => a.distance - b.distance);
};
