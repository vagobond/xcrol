import { useEffect, useRef, useCallback, MutableRefObject } from "react";
import mapboxgl from "mapbox-gl";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { escapeHtml } from "@/lib/sanitize";
import type { ProfileData, HometownGroup, Meetup } from "./types";

interface UseMapSetupOptions {
  mapboxToken: string | null;
  user: { id: string } | null;
  userHometown: any;
  allHometowns: ProfileData[];
  groupedHometowns: Record<string, HometownGroup>;
  meetups: Meetup[];
  locationHasMeetups: (lat: number, lng: number) => boolean;
  setSelectedLocation: (loc: { lng: number; lat: number; city: string; country: string } | null) => void;
  setShowClaimForm: (val: boolean) => void;
  setSelectedHometown: (group: HometownGroup | null) => void;
}

export function useMapSetup({
  mapboxToken,
  user,
  userHometown,
  allHometowns,
  groupedHometowns,
  meetups,
  locationHasMeetups,
  setSelectedLocation,
  setShowClaimForm,
  setSelectedHometown,
}: UseMapSetupOptions) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const meetupMarkersRef = useRef<mapboxgl.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [0, 20],
      zoom: 2,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("click", async (e) => {
      if (!map.current) return;
      const features = map.current.queryRenderedFeatures(e.point, {
        layers: ["clusters", "unclustered-point"],
      });
      if (features.length > 0) return;

      if (!user) {
        toast.error("Please sign in to claim a hometown");
        return;
      }

      if (userHometown?.hometown_city) {
        if (userHometown.last_hometown_change) {
          const lastChange = new Date(userHometown.last_hometown_change);
          const daysSinceChange = Math.floor((Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
          if (daysSinceChange < 90) {
            const daysRemaining = 90 - daysSinceChange;
            toast.info(`You can change your hometown in ${daysRemaining} days`);
            return;
          }
        }
      }

      const { lng, lat } = e.lngLat;

      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=place,locality,region&access_token=${mapboxToken}`
        );
        const data = await response.json();

        let city = "Unknown";
        let country = "Unknown";

        if (data.features && data.features.length > 0) {
          const cityFeature = data.features.find((f: any) => f.place_type.includes("place")) ||
                              data.features.find((f: any) => f.place_type.includes("locality")) ||
                              data.features.find((f: any) => f.place_type.includes("region"));

          if (cityFeature) {
            city = cityFeature.text;
            const countryContext = cityFeature.context?.find((ctx: any) => ctx.id?.startsWith("country"));
            if (countryContext) {
              country = countryContext.text;
            }
          }
        }

        setSelectedLocation({ lng, lat, city, country });
        setShowClaimForm(true);
      } catch (error) {
        console.error("Error reverse geocoding:", error);
        toast.error("Could not identify location");
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, user, userHometown]);

  // Add clustered GeoJSON source and layers for hometowns
  useEffect(() => {
    if (!map.current || allHometowns.length === 0) return;

    const mapInstance = map.current;
    let isSetup = false;

    const handleClusterClick = (e: mapboxgl.MapLayerMouseEvent) => {
      if (!mapInstance || !e.features?.[0]) return;
      e.preventDefault();
      const clusterId = e.features[0].properties?.cluster_id;
      const source = mapInstance.getSource("hometowns") as mapboxgl.GeoJSONSource;
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || !mapInstance) return;
        const geometry = e.features![0].geometry as GeoJSON.Point;
        mapInstance.easeTo({
          center: geometry.coordinates as [number, number],
          zoom: (zoom ?? mapInstance.getZoom()) + 2,
        });
      });
    };

    const handlePointClick = (e: mapboxgl.MapLayerMouseEvent) => {
      if (!e.features?.[0]) return;
      e.preventDefault();
      const props = e.features[0].properties;
      const profiles = JSON.parse(props?.profiles || "[]") as ProfileData[];
      const geometry = e.features[0].geometry as GeoJSON.Point;

      setSelectedHometown({
        city: props?.city,
        country: props?.country,
        lat: geometry.coordinates[1],
        lng: geometry.coordinates[0],
        profiles,
      });
    };

    const handleMouseEnter = () => {
      if (mapInstance) mapInstance.getCanvas().style.cursor = "pointer";
    };
    const handleMouseLeave = () => {
      if (mapInstance) mapInstance.getCanvas().style.cursor = "";
    };

    const setupClusters = () => {
      if (!mapInstance || isSetup) return;
      isSetup = true;

      if (mapInstance.getLayer("clusters")) mapInstance.removeLayer("clusters");
      if (mapInstance.getLayer("cluster-count")) mapInstance.removeLayer("cluster-count");
      if (mapInstance.getLayer("unclustered-point")) mapInstance.removeLayer("unclustered-point");
      if (mapInstance.getLayer("unclustered-count")) mapInstance.removeLayer("unclustered-count");
      if (mapInstance.getSource("hometowns")) mapInstance.removeSource("hometowns");

      const geojsonData: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: Object.values(groupedHometowns).map((group) => ({
          type: "Feature",
          properties: {
            city: group.city,
            country: group.country,
            count: group.profiles.length,
            profiles: JSON.stringify(group.profiles),
            hasMeetups: locationHasMeetups(group.lat, group.lng),
          },
          geometry: {
            type: "Point",
            coordinates: [group.lng, group.lat],
          },
        })),
      };

      mapInstance.addSource("hometowns", {
        type: "geojson",
        data: geojsonData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 60,
        clusterProperties: {
          sum: ["+", ["get", "count"]],
          hasMeetups: ["any", ["get", "hasMeetups"]],
        },
      });

      mapInstance.addLayer({
        id: "clusters",
        type: "circle",
        source: "hometowns",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": ["case", ["get", "hasMeetups"], "#EAB308", "#8B5CF6"],
          "circle-radius": ["step", ["get", "sum"], 20, 5, 25, 10, 30, 25, 40],
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
        },
      });

      mapInstance.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "hometowns",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "sum"],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 14,
        },
        paint: { "text-color": "#ffffff" },
      });

      mapInstance.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "hometowns",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["case", ["get", "hasMeetups"], "#EAB308", "#8B5CF6"],
          "circle-radius": ["interpolate", ["linear"], ["get", "count"], 1, 18, 5, 22, 10, 28],
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
        },
      });

      mapInstance.addLayer({
        id: "unclustered-count",
        type: "symbol",
        source: "hometowns",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "text-field": ["get", "count"],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 14,
        },
        paint: { "text-color": "#ffffff" },
      });

      mapInstance.on("click", "clusters", handleClusterClick);
      mapInstance.on("click", "unclustered-point", handlePointClick);
      mapInstance.on("mouseenter", "clusters", handleMouseEnter);
      mapInstance.on("mouseleave", "clusters", handleMouseLeave);
      mapInstance.on("mouseenter", "unclustered-point", handleMouseEnter);
      mapInstance.on("mouseleave", "unclustered-point", handleMouseLeave);
    };

    if (mapInstance.isStyleLoaded()) {
      setupClusters();
    } else {
      mapInstance.on("load", setupClusters);
    }

    return () => {
      try {
        if (mapInstance && mapInstance.getStyle()) {
          mapInstance.off("click", "clusters", handleClusterClick);
          mapInstance.off("mouseenter", "clusters", handleMouseEnter);
          mapInstance.off("mouseleave", "clusters", handleMouseLeave);
          mapInstance.off("click", "unclustered-point", handlePointClick);
          mapInstance.off("mouseenter", "unclustered-point", handleMouseEnter);
          mapInstance.off("mouseleave", "unclustered-point", handleMouseLeave);
        }
      } catch {
        // Map was already destroyed
      }
    };
  }, [allHometowns, groupedHometowns, meetups, locationHasMeetups]);

  // Add meetup markers
  useEffect(() => {
    if (!map.current) return;
    const mapInstance = map.current;

    const addMeetupMarkers = () => {
      meetupMarkersRef.current.forEach(marker => marker.remove());
      meetupMarkersRef.current = [];

      meetups.forEach(meetup => {
        if (!meetup.latitude || !meetup.longitude) return;

        const el = document.createElement("div");
        el.className = "meetup-marker";
        el.style.width = "32px";
        el.style.height = "32px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = "#EAB308";
        el.style.border = "3px solid white";
        el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
        el.style.cursor = "pointer";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;

        const safeTitle = escapeHtml(meetup.title);
        const safeLocationName = escapeHtml(meetup.location_name);
        const safeDescription = meetup.description ? escapeHtml(meetup.description) : null;

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${safeTitle}</h3>
            <p style="font-size: 12px; color: #666;">${safeLocationName}</p>
            ${safeDescription ? `<p style="font-size: 12px; margin-top: 4px;">${safeDescription}</p>` : ""}
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([meetup.longitude, meetup.latitude])
          .setPopup(popup)
          .addTo(mapInstance);

        meetupMarkersRef.current.push(marker);
      });
    };

    if (mapInstance.isStyleLoaded()) {
      addMeetupMarkers();
    } else {
      const onLoad = () => addMeetupMarkers();
      mapInstance.on("load", onLoad);
      return () => {
        mapInstance.off("load", onLoad);
        meetupMarkersRef.current.forEach(marker => marker.remove());
        meetupMarkersRef.current = [];
      };
    }

    return () => {
      meetupMarkersRef.current.forEach(marker => marker.remove());
      meetupMarkersRef.current = [];
    };
  }, [meetups]);

  return { mapContainer, map };
}
