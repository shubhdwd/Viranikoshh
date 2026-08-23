import { useEffect, useMemo } from 'react';
import { Circle, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { CulturalCategory, CulturalRecord } from '../types/culture';
import { cn } from '../utils/cn';

const CATEGORY_COLOR: Record<CulturalCategory, string> = {
  'folk-song': '#9c3b1b',
  'folk-story': '#c86a3f',
  'oral-tradition': '#7a5230',
  artwork: '#5b4a8a',
  craft: '#2f6b4f',
  festival: '#b8860b',
  'local-history': '#26221f',
  'traditional-practice': '#8a4f6d'
};

function markerIcon(category: CulturalCategory, active: boolean): L.DivIcon {
  const color = CATEGORY_COLOR[category];
  const size = active ? 22 : 16;
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:2.5px solid #fffdf9;box-shadow:0 1px 4px rgba(38,34,31,.35)"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}

function Recenter({ center, zoom }: {center: [number, number];zoom: number;}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

/** Keeps the Leaflet canvas correctly sized when its container reflows. */
function ResizeObserverBridge() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

interface RegionTint {
  key: string;
  center: [number, number];
  count: number;
}

/** Groups records by state and returns a weighted centroid per cultural region. */
function regionTints(records: CulturalRecord[]): RegionTint[] {
  const groups = new Map<string, {lat: number;lng: number;count: number;}>();
  records.forEach((record) => {
    const existing = groups.get(record.state) ?? { lat: 0, lng: 0, count: 0 };
    groups.set(record.state, {
      lat: existing.lat + record.coordinates[0],
      lng: existing.lng + record.coordinates[1],
      count: existing.count + 1
    });
  });
  return Array.from(groups.entries()).map(([key, value]) => ({
    key,
    center: [value.lat / value.count, value.lng / value.count],
    count: value.count
  }));
}

interface CulturalMapProps {
  records: CulturalRecord[];
  selectedId?: string | null;
  onSelect?: (record: CulturalRecord) => void;
  interactive?: boolean;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

export function CulturalMap({
  records,
  selectedId,
  onSelect,
  interactive = true,
  center = [22.6, 79.5],
  zoom = 4.4,
  className
}: CulturalMapProps) {
  const view = useMemo(() => {
    const selected = records.find((r) => r.id === selectedId);
    return selected ? selected.coordinates as [number, number] : center;
  }, [records, selectedId, center]);

  const tints = useMemo(() => regionTints(records), [records]);
  const maxCount = useMemo(() => Math.max(1, ...tints.map((t) => t.count)), [tints]);

  return (
    <div className={cn('vk-texture relative overflow-hidden rounded-card border border-sand-light bg-[#e6ded1]', className)}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        zoomControl={interactive}
        attributionControl={false}
        className="h-full w-full"
        style={{ height: '100%', width: '100%' }}>
        
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        <ResizeObserverBridge />
        <Recenter center={view} zoom={selectedId ? Math.max(zoom, 6) : zoom} />

        {/* Cultural regions, weighted by how many records sit there */}
        {tints.map((tint) => {
          const weight = tint.count / maxCount;
          return (
            <Circle
              key={tint.key}
              center={tint.center}
              radius={95000 + weight * 145000}
              interactive={false}
              pathOptions={{
                color: weight > 0.6 ? '#9c3b1b' : '#c86a3f',
                weight: 1,
                opacity: 0.35,
                fillColor: weight > 0.6 ? '#9c3b1b' : '#c86a3f',
                fillOpacity: 0.08 + weight * 0.14
              }} />);


        })}

        {records.map((record) =>
        <Marker
          key={record.id}
          position={record.coordinates}
          icon={markerIcon(record.category, record.id === selectedId)}
          eventHandlers={{ click: () => onSelect?.(record) }}
          title={record.title} />

        )}
      </MapContainer>
    </div>);

}

export { CATEGORY_COLOR };