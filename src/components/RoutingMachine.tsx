/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

interface RoutingMachineProps {
  waypoints: [L.LatLngExpression, L.LatLngExpression];
  color?: string;
  showPanel?: boolean;
}

const RoutingMachine: React.FC<RoutingMachineProps> = ({
  waypoints,
  color = "#f59e0b",
  showPanel = true,
}) => {
  const map = useMap();

  useEffect(() => {
    let routingControl: any;
    let cancelled = false;

    const load = async () => {
      if (!map) return;
      try {
  await import("leaflet-routing-machine"); // side-effect import
        const leafletRouting = (window as any).L?.Routing;
        if (!leafletRouting || cancelled) return;

        routingControl = leafletRouting
          .control({
            waypoints: waypoints.map((wp: any) => L.latLng(wp)),
            lineOptions: {
              styles: [{ color, weight: 4, opacity: 0.8 }],
            },
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            show: showPanel,
            routeWhileDragging: false,
            createMarker: () => null,
            collapsible: showPanel,
            collapsed: false,
          })
          .addTo(map);
      } catch (e) {
        console.error("Failed to load routing machine:", e);
      }
    };

    load();

    return () => {
      cancelled = true;
      if (routingControl) map.removeControl(routingControl);
    };
  }, [map, waypoints, color, showPanel]);

  return null;
};

export default RoutingMachine;
