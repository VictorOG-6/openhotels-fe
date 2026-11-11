"use client";

import { useEffect, useRef, useState } from "react";
import type { LatLngBoundsExpression, Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

export type MapHotel = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  priceLabel: string;
};

type LatLng = { lat: number; lng: number };

type MapHandle = {
  setPlaces: (hotels: MapHotel[], center?: LatLng) => void;
  setActive: (id?: string | null) => void;
  remove: () => void;
};

type HotelMapProps = {
  hotels: MapHotel[];
  center?: LatLng;
  activeId?: string | null;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
};

export default function HotelMap({
  hotels,
  center,
  activeId,
  onHover,
  onSelect,
}: HotelMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<MapHandle | null>(null);
  const hotelsRef = useRef(hotels);
  const centerRef = useRef(center);
  const activeRef = useRef(activeId);
  const onHoverRef = useRef(onHover);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState("");

  const markerKey = hotels
    .map((hotel) => `${hotel.id}:${hotel.latitude}:${hotel.longitude}:${hotel.priceLabel}`)
    .join("|");
  const centerKey = center ? `${center.lat},${center.lng}` : "";
  const plotted = hotels.filter(hasCoordinates);
  const view = center ?? (plotted[0] ? { lat: plotted[0].latitude, lng: plotted[0].longitude } : null);
  const viewKey = view ? `${view.lat.toFixed(4)},${view.lng.toFixed(4)}` : "";

  useEffect(() => {
    hotelsRef.current = hotels;
    centerRef.current = center;
    activeRef.current = activeId;
    onHoverRef.current = onHover;
    onSelectRef.current = onSelect;
  }, [activeId, center, hotels, onHover, onSelect]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || !viewKey) return;
    let cancelled = false;
    let handle: MapHandle | null = null;

    (async () => {
      const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (key) {
        try {
          const google = await loadGoogleMaps(key);
          if (cancelled) return;
          handle = mountGoogle(element, google, {
            onHover: (id) => onHoverRef.current?.(id),
            onSelect: (id) => onSelectRef.current?.(id),
          });
          if (cancelled) {
            handle.remove();
            return;
          }
          handle.setPlaces(hotelsRef.current, centerRef.current);
          handle.setActive(activeRef.current);
          handleRef.current = handle;
          setReady(true);
          return;
        } catch {
          // OpenStreetMap remains available when Google Maps cannot start.
        }
      }

      try {
        const leaflet = await loadLeaflet();
        if (cancelled) return;
        ensureLeafletCss();
        handle = mountLeaflet(element, leaflet, {
          onHover: (id) => onHoverRef.current?.(id),
          onSelect: (id) => onSelectRef.current?.(id),
        });
        if (cancelled) {
          handle.remove();
          return;
        }
        handle.setPlaces(hotelsRef.current, centerRef.current);
        handle.setActive(activeRef.current);
        handleRef.current = handle;
        setReady(true);
      } catch {
        if (!cancelled) setMapError("The map could not be loaded.");
      }
    })();

    return () => {
      cancelled = true;
      handle?.remove();
      handleRef.current = null;
      setReady(false);
    };
  }, [viewKey]);

  useEffect(() => {
    handleRef.current?.setPlaces(hotelsRef.current, centerRef.current);
  }, [ready, markerKey, centerKey]);

  useEffect(() => {
    handleRef.current?.setActive(activeId);
  }, [ready, activeId]);

  if (!view) {
    return (
      <div className="grid h-full min-h-80 place-items-center rounded-3xl bg-sand p-6 text-center text-sm text-muted">
        The map appears when this search has coordinates.
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-80 overflow-hidden rounded-3xl ring-1 ring-ink/10">
      <div ref={containerRef} className="h-full w-full" />
      {!ready && !mapError ? (
        <div className="absolute inset-0 grid place-items-center bg-sand text-sm text-muted">
          Loading map
        </div>
      ) : null}
      {mapError ? (
        <div className="absolute inset-0 grid place-items-center bg-sand p-6 text-center text-sm text-muted">
          {mapError}
        </div>
      ) : null}
    </div>
  );
}

function mountLeaflet(
  element: HTMLElement,
  L: LeafletNamespace,
  handlers: PinHandlers,
): MapHandle {
  const map = L.map(element, { scrollWheelZoom: true });
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  const markers = new Map<string, LeafletMarker>();

  const handle: MapHandle = {
    setPlaces(hotels, center) {
      markers.forEach((marker) => marker.remove());
      markers.clear();
      const plotted = hotels.filter(hasCoordinates);

      for (const hotel of plotted) {
        const marker = L.marker([hotel.latitude, hotel.longitude], {
          icon: L.divIcon({
            className: "map-pin-icon",
            html: `<div class="map-pin">${escapeHtml(hotel.priceLabel)}</div>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          }),
          keyboard: true,
          title: hotel.name,
          alt: hotel.name,
        }).addTo(map);
        marker.on("click", () => handlers.onSelect(hotel.id));
        marker.on("mouseover", () => handlers.onHover(hotel.id));
        marker.on("mouseout", () => handlers.onHover(null));
        const pin = marker.getElement();
        pin?.setAttribute("role", "button");
        pin?.setAttribute("aria-label", hotel.name);
        markers.set(hotel.id, marker);
      }

      if (plotted.length === 1) {
        map.setView([plotted[0].latitude, plotted[0].longitude], 14);
      } else if (plotted.length > 1) {
        const group = L.featureGroup([...markers.values()]);
        map.fitBounds(group.getBounds().pad(0.18) as LatLngBoundsExpression);
      } else if (center) {
        map.setView([center.lat, center.lng], 12);
      }
      window.setTimeout(() => map.invalidateSize(), 60);
    },
    setActive(id) {
      markers.forEach((marker, markerId) => {
        marker.getElement()?.querySelector(".map-pin")?.classList.toggle("is-active", markerId === id);
        marker.setZIndexOffset(markerId === id ? 1000 : 0);
      });
    },
    remove() {
      map.remove();
      element.replaceChildren();
    },
  };

  return handle;
}

function mountGoogle(
  element: HTMLElement,
  google: GoogleNamespace,
  handlers: PinHandlers,
): MapHandle {
  const map = new google.maps.Map(element, {
    center: { lat: 20, lng: 0 },
    zoom: 3,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    gestureHandling: "greedy",
  });
  const pills = new Map<string, { setActive: (active: boolean) => void; remove: () => void }>();

  return {
    setPlaces(hotels, center) {
      pills.forEach((pill) => pill.remove());
      pills.clear();
      const bounds = new google.maps.LatLngBounds();
      const plotted = hotels.filter(hasCoordinates);

      for (const hotel of plotted) {
        const position = new google.maps.LatLng(hotel.latitude, hotel.longitude);
        bounds.extend(position);
        pills.set(hotel.id, createPricePill(google, map, hotel, position, handlers));
      }

      if (plotted.length === 1) {
        map.setCenter({ lat: plotted[0].latitude, lng: plotted[0].longitude });
        map.setZoom(14);
      } else if (!bounds.isEmpty()) {
        map.fitBounds(bounds, 48);
      } else if (center) {
        map.setCenter(center);
        map.setZoom(12);
      }
    },
    setActive(id) {
      pills.forEach((pill, pillId) => pill.setActive(pillId === id));
    },
    remove() {
      pills.forEach((pill) => pill.remove());
      element.replaceChildren();
    },
  };
}

function createPricePill(
  google: GoogleNamespace,
  map: GoogleMap,
  hotel: MapHotel,
  position: object,
  handlers: PinHandlers,
) {
  const overlay = new google.maps.OverlayView();
  let pin: HTMLDivElement | null = null;

  overlay.onAdd = () => {
    pin = document.createElement("div");
    pin.className = "map-pin";
    pin.textContent = hotel.priceLabel;
    pin.tabIndex = 0;
    pin.setAttribute("role", "button");
    pin.setAttribute("aria-label", hotel.name);
    pin.addEventListener("click", () => handlers.onSelect(hotel.id));
    pin.addEventListener("mouseenter", () => handlers.onHover(hotel.id));
    pin.addEventListener("mouseleave", () => handlers.onHover(null));
    pin.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handlers.onSelect(hotel.id);
      }
    });
    overlay.getPanes()?.overlayMouseTarget.appendChild(pin);
  };
  overlay.draw = () => {
    const point = overlay.getProjection()?.fromLatLngToDivPixel(position);
    if (!pin || !point) return;
    pin.style.left = `${point.x}px`;
    pin.style.top = `${point.y}px`;
  };
  overlay.onRemove = () => {
    pin?.remove();
    pin = null;
  };
  overlay.setMap(map);

  return {
    setActive(active: boolean) {
      pin?.classList.toggle("is-active", active);
    },
    remove() {
      overlay.setMap(null);
    },
  };
}

function hasCoordinates(hotel: MapHotel) {
  return Number.isFinite(hotel.latitude) && Number.isFinite(hotel.longitude);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function ensureLeafletCss() {
  if (document.querySelector("link[data-leaflet]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/leaflet/leaflet.css";
  link.setAttribute("data-leaflet", "true");
  document.head.appendChild(link);
}

async function loadLeaflet(): Promise<LeafletNamespace> {
  const mod = await import("leaflet");
  const candidate = (mod as { default?: LeafletNamespace }).default ?? (mod as unknown as LeafletNamespace);
  return candidate;
}

function loadGoogleMaps(key: string) {
  const host = window as Window & {
    google?: GoogleNamespace;
    __openHotelsMaps?: Promise<GoogleNamespace>;
  };
  if (host.google?.maps) return Promise.resolve(host.google);
  host.__openHotelsMaps ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`;
    script.async = true;
    script.onload = () => {
      if (host.google?.maps) resolve(host.google);
      else reject(new Error("Google Maps did not load"));
    };
    script.onerror = () => reject(new Error("Google Maps did not load"));
    document.head.appendChild(script);
  });
  return host.__openHotelsMaps;
}

type PinHandlers = {
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

type LeafletNamespace = {
  map: (element: HTMLElement, options?: object) => LeafletMap;
  tileLayer: (url: string, options?: object) => { addTo: (map: LeafletMap) => void };
  marker: (
    latlng: [number, number],
    options?: object,
  ) => LeafletMarker;
  divIcon: (options: object) => object;
  featureGroup: (layers: LeafletMarker[]) => {
    getBounds: () => { pad: (ratio: number) => object };
  };
};

type GoogleMap = {
  setCenter: (center: LatLng) => void;
  setZoom: (zoom: number) => void;
  fitBounds: (bounds: object, padding?: number) => void;
};

type GoogleOverlay = {
  onAdd: () => void;
  draw: () => void;
  onRemove: () => void;
  setMap: (map: GoogleMap | null) => void;
  getPanes: () => { overlayMouseTarget: HTMLElement } | null;
  getProjection: () => {
    fromLatLngToDivPixel: (latlng: object) => { x: number; y: number } | null;
  } | null;
};

type GoogleNamespace = {
  maps: {
    Map: new (element: HTMLElement, options: object) => GoogleMap;
    OverlayView: new () => GoogleOverlay;
    LatLng: new (lat: number, lng: number) => object;
    LatLngBounds: new () => { extend: (position: object) => void; isEmpty: () => boolean };
  };
};
