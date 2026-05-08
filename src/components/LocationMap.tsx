import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface LocationSelectorProps {
  onLocationSelect: (location: string, lat: number, lng: number) => void;
  initialLocation?: string;
}

async function geocodeLocation(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await response.json();
    return data.display_name || "Selected location";
  } catch {
    return "Selected location";
  }
}

async function searchAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
}

function LocationSelectorInner({
  onLocationSelect,
  initialLocation,
}: LocationSelectorProps) {
  const [manualInput, setManualInput] = useState(initialLocation || "");
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [searchCenter, setSearchCenter] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [Leaflet, setLeaflet] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    async function loadLeaflet() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      
      const defaultIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      L.Marker.prototype.options.icon = defaultIcon;
      
      setLeaflet(L);
    }
    loadLeaflet();
  }, []);

  useEffect(() => {
    if (!Leaflet || !mapRef.current || mapInstanceRef.current) return;

    const map = Leaflet.map(mapRef.current).setView(
      [40.7128, -74.0060],
      12
    );

    mapInstanceRef.current = map;

    Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    map.on("click", async (e: any) => {
      const { lat, lng } = e.latlng;

      if (markerRef.current) {
        markerRef.current.remove();
      }

      const marker = Leaflet.marker([lat, lng]).addTo(map);
      markerRef.current = marker;

      setPosition([lat, lng]);
      map.setView([lat, lng], 15);

      setLoading(true);
      const address = await geocodeLocation(lat, lng);
      setManualInput(address);
      onLocationSelect(address, lat, lng);
      setLoading(false);
    });

    if (initialLocation) {
      searchAddress(initialLocation).then((coords) => {
        if (coords) {
          setPosition([coords.lat, coords.lng]);
          map.setView([coords.lat, coords.lng], 15);
          const marker = Leaflet.marker([coords.lat, coords.lng]).addTo(map);
          markerRef.current = marker;
        }
      });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [Leaflet, initialLocation, onLocationSelect]);

  const handleSearch = async () => {
    if (!manualInput.trim() || !Leaflet || !mapInstanceRef.current) return;

    setLoading(true);
    const coords = await searchAddress(manualInput.trim());
    
    if (coords) {
      if (markerRef.current) {
        markerRef.current.remove();
      }

      setPosition([coords.lat, coords.lng]);

      const map = mapInstanceRef.current;
      map.setView([coords.lat, coords.lng], 15);
      const marker = Leaflet.marker([coords.lat, coords.lng]).addTo(map);
      markerRef.current = marker;

      const address = await geocodeLocation(coords.lat, coords.lng);
      onLocationSelect(address, coords.lat, coords.lng);
      setManualInput(address);
    } else {
      toast.error("Location not found. Please try a different address.");
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-3">
      <Input
        placeholder="Enter address (press Enter to search)"
        value={manualInput}
        onChange={(e) => setManualInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
      />
      <div className="relative rounded-xl overflow-hidden border border-border h-64">
        <div ref={mapRef} className="h-full w-full" />
        {loading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-[1000]">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Click on the map to select your location or enter address above
      </p>
    </div>
  );
}

export function LocationSelector(props: LocationSelectorProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="space-y-3">
        <Input placeholder="Loading map..." disabled />
        <div className="h-64 rounded-xl border border-border bg-muted flex items-center justify-center">
          <div className="text-muted-foreground">Loading map...</div>
        </div>
      </div>
    );
  }

  return <LocationSelectorInner {...props} />;
}

export function LocationMap({ location }: { location: string }) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [Leaflet, setLeaflet] = useState<any>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !location) return;

    async function loadLeaflet() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      setLeaflet(L);
    }
    loadLeaflet();
  }, [isMounted, location]);

  useEffect(() => {
    if (!Leaflet || !location || mapRef.current?._leaflet_map) return;

    searchAddress(location).then((coords) => {
      if (coords) {
        setPosition([coords.lat, coords.lng]);
        
        const map = Leaflet.map(mapRef.current).setView([coords.lat, coords.lng], 15);
        
        Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        Leaflet.marker([coords.lat, coords.lng]).addTo(map);

        return () => {
          map.remove();
        };
      }
    });
  }, [Leaflet, location]);

  if (!location) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border h-56">
      {isMounted ? (
        <div ref={mapRef} className="h-full w-full" />
      ) : (
        <div className="h-full bg-muted flex items-center justify-center">
          <div className="text-muted-foreground">Loading map...</div>
        </div>
      )}
    </div>
  );
}