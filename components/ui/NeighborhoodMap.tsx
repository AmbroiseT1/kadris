"use client";

import React, { useEffect, useSyncExternalStore } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { AmenityItem } from '@/app/lib/quartier';
import { Building, ShoppingCart, GraduationCap, Stethoscope, Bus, TreePine, Shield, Utensils } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

interface NeighborhoodMapProps {
    center: { lat: number; lon: number };
    pois: AmenityItem[];
}

// Component to update map center when props change
function MapUpdater({ center }: { center: { lat: number; lon: number } }) {
    const map = useMap();
    useEffect(() => {
        if (center && !isNaN(center.lat) && !isNaN(center.lon)) {
            map.setView([center.lat, center.lon], 15);
        }
    }, [center, map]);
    return null;
}

// Helper to create custom DivIcons from Lucide icons
const createCustomIcon = (icon: React.ReactNode, color: string) => {
    const iconMarkup = renderToStaticMarkup(
        <div style={{
            backgroundColor: color,
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
            {icon}
        </div>
    );

    return L.divIcon({
        html: iconMarkup,
        className: 'custom-marker-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

export default function NeighborhoodMap({ center, pois }: NeighborhoodMapProps) {
    // false pendant le rendu serveur/hydratation, true côté client ensuite
    const isMounted = useSyncExternalStore(() => () => {}, () => true, () => false);

    useEffect(() => {
        // Fix for default Leaflet icons in Next.js
        // This must run on client side
        const DefaultIcon = L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
        });
        L.Marker.prototype.options.icon = DefaultIcon;

    }, []);

    if (!isMounted) return <div className="h-full w-full bg-papier animate-pulse rounded-xl" />;

    // Validate center
    if (!center || isNaN(center.lat) || isNaN(center.lon)) {
        return (
            <div className="h-full w-full bg-papier flex items-center justify-center text-texte-2 rounded-xl">
                Coordonnées invalides
            </div>
        );
    }

    // Icons
    const homeIcon = createCustomIcon(<Building size={18} color="white" />, '#e76e50'); // bricq Terracotta

    // Filter POIs to avoid overcrowding - prioritize supermarkets and key amenities
    const displayPois = pois.filter((p): p is AmenityItem & { lat: number; lon: number } =>
        p.lat != null && p.lon != null && (
        p.type.includes('supermarket') ||
        p.type.includes('convenience') ||
        p.type.includes('restaurant') ||
        p.type.includes('cafe') ||
        p.type.includes('school') ||
        p.type.includes('park') ||
        p.type.includes('station'))
    ).slice(0, 50); // Limit total markers

    const getPoiIcon = (type: string) => {
        if (type.includes('supermarket') || type.includes('convenience') || type.includes('bakery') || type.includes('butcher') || type.includes('greengrocer'))
            return createCustomIcon(<ShoppingCart size={16} color="white" />, '#2a9d8f');
        if (type.includes('restaurant') || type.includes('cafe') || type.includes('bar') || type.includes('fast_food') || type.includes('pub'))
            return createCustomIcon(<Utensils size={16} color="white" />, '#f4a261');
        if (type.includes('school') || type.includes('college'))
            return createCustomIcon(<GraduationCap size={16} color="white" />, '#e9c46a');
        if (type.includes('doctor') || type.includes('pharmacy'))
            return createCustomIcon(<Stethoscope size={16} color="white" />, '#e63946');
        if (type.includes('bus') || type.includes('station'))
            return createCustomIcon(<Bus size={16} color="white" />, '#457b9d');
        if (type.includes('park') || type.includes('garden'))
            return createCustomIcon(<TreePine size={16} color="white" />, '#264653');

        return createCustomIcon(<Shield size={16} color="white" />, '#8d99ae');
    };

    return (
        <MapContainer
            center={[center.lat, center.lon]}
            zoom={15}
            style={{ height: '100%', width: '100%', borderRadius: '0.75rem', zIndex: 0 }}
            scrollWheelZoom={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <MapUpdater center={center} />

            {/* Property Marker */}
            <Marker position={[center.lat, center.lon]} icon={homeIcon}>
                <Popup>
                    <div className="font-bold text-brique">Votre Bien</div>
                </Popup>
            </Marker>

            {/* POI Markers */}
            {displayPois.map((poi, idx) => (
                <Marker
                    key={idx}
                    position={[poi.lat, poi.lon]}
                    icon={getPoiIcon(poi.type)}
                >
                    <Popup>
                        <div className="font-bold">{poi.name}</div>
                        <div className="text-xs capitalize text-texte-2">{poi.type.replace(/_/g, ' ')}</div>
                        <div className="text-xs font-bold mt-1">{poi.distance}m</div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
