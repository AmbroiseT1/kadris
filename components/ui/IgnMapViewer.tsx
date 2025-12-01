"use client";

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Layers, Map as MapIcon, Home, Mountain, FileText } from 'lucide-react';

// Fix for default Leaflet marker icons in Next.js
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const customIcon = L.icon({
    iconUrl: iconUrl,
    iconRetinaUrl: iconRetinaUrl,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface IgnMapViewerProps {
    lat: number;
    lon: number;
    zoom?: number;
    className?: string;
    showControls?: boolean;
    initialLayer?: string;
}

// Component to update map center when props change
function MapUpdater({ lat, lon, zoom }: { lat: number; lon: number; zoom: number }) {
    const map = useMap();

    useEffect(() => {
        if (!map || typeof lat !== 'number' || typeof lon !== 'number') return;

        // Use setTimeout to push update to end of event loop and ensure DOM is ready
        const timeoutId = setTimeout(() => {
            // Check if map and its container still exist
            if (!map || !map.getContainer()) return;

            try {
                // Disable animation to prevent '_leaflet_pos' errors during rapid updates or unmounts
                map.setView([lat, lon], zoom, { animate: false });
            } catch (error) {
                console.warn("Error updating map view:", error);
            }
        }, 50);

        return () => clearTimeout(timeoutId);
    }, [lat, lon, zoom, map]);

    return null;
}

export default function IgnMapViewer({ lat, lon, zoom = 18, className = "h-full w-full", showControls = true, initialLayer = "Plan IGN" }: IgnMapViewerProps) {
    const [activeLayer, setActiveLayer] = useState<string>(initialLayer);

    // IGN WMTS Configuration
    // API Key 'decouverte' is free/open but might have limits. 'pratique' or others might be needed for production.
    // Using standard open URL format for Geoplateforme
    const ignBaseUrl = "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}";

    const layers = {
        plan: {
            name: "Plan IGN",
            url: `${ignBaseUrl}&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&FORMAT=image/png`,
            attribution: '&copy; <a href="https://www.ign.fr/">IGN</a>'
        },
        ortho: {
            name: "Vue Aérienne",
            url: `${ignBaseUrl}&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&FORMAT=image/jpeg`,
            attribution: '&copy; <a href="https://www.ign.fr/">IGN</a>'
        },
        cadastre: {
            name: "Cadastre",
            url: `${ignBaseUrl}&LAYER=CADASTRALPARCELS.PARCELLAIRE_EXPRESS&STYLE=PCI vecteur&FORMAT=image/png`,
            attribution: '&copy; <a href="https://www.ign.fr/">IGN</a>'
        },
        batiments: {
            name: "Bâtiments",
            // Using BDTOPO or similar if available as tiles, otherwise overlaying on plan
            // Often 'BATIMENTS.BDTOPO' or similar. Let's try a standard one or keep it simple.
            // Actually, let's use the Cadastre layer as an overlay on Ortho for "Parcelle" view
            // and Plan for "Batiment" view.
            url: `${ignBaseUrl}&LAYER=CADASTRALPARCELS.PARCELLAIRE_EXPRESS&STYLE=PCI vecteur&FORMAT=image/png`,
            attribution: '&copy; <a href="https://www.ign.fr/">IGN</a>'
        }
    };

    return (
        <div className={`relative ${className} overflow-hidden rounded-sm`}>
            <MapContainer
                center={[lat, lon]}
                zoom={zoom}
                scrollWheelZoom={false}
                className="h-full w-full z-0"
                zoomControl={true}
            >
                <MapUpdater lat={lat} lon={lon} zoom={zoom} />

                {/* Layer Rendering Logic */}
                {activeLayer === "Plan IGN" && (
                    <TileLayer
                        url={layers.plan.url}
                        attribution={layers.plan.attribution}
                        maxZoom={19}
                    />
                )}

                {activeLayer === "Vue Aérienne" && (
                    <TileLayer
                        url={layers.ortho.url}
                        attribution={layers.ortho.attribution}
                        maxZoom={19}
                    />
                )}

                {activeLayer === "Cadastre" && (
                    <>
                        <TileLayer
                            url={layers.ortho.url}
                            attribution={layers.ortho.attribution}
                            maxZoom={19}
                        />
                        <TileLayer
                            url={layers.cadastre.url}
                            attribution={layers.cadastre.attribution}
                            maxZoom={19}
                            opacity={0.8}
                        />
                    </>
                )}

                {activeLayer === "Plan Cadastral" && (
                    <>
                        <TileLayer
                            url={layers.plan.url}
                            attribution={layers.plan.attribution}
                            maxZoom={19}
                        />
                        <TileLayer
                            url={layers.cadastre.url}
                            attribution={layers.cadastre.attribution}
                            maxZoom={19}
                            opacity={0.8}
                        />
                    </>
                )}

                <Marker position={[lat, lon]} icon={customIcon}>
                    <Popup>
                        Votre propriété
                    </Popup>
                </Marker>
            </MapContainer>

            {/* Custom Controls Overlay */}
            {showControls && (
                <div className="absolute bottom-4 right-4 z-[400] flex flex-col gap-2">
                    <button
                        onClick={() => setActiveLayer("Vue Aérienne")}
                        className={`px-3 py-2 text-xs font-bold rounded-sm shadow-lg flex items-center gap-2 transition-all ${activeLayer === "Vue Aérienne" ? "bg-bricq-slate text-white" : "bg-white text-bricq-slate hover:bg-gray-50"}`}
                    >
                        <Mountain size={14} /> Vue Aérienne
                    </button>
                    <button
                        onClick={() => setActiveLayer("Plan IGN")}
                        className={`px-3 py-2 text-xs font-bold rounded-sm shadow-lg flex items-center gap-2 transition-all ${activeLayer === "Plan IGN" ? "bg-bricq-slate text-white" : "bg-white text-bricq-slate hover:bg-gray-50"}`}
                    >
                        <MapIcon size={14} /> Plan IGN
                    </button>
                    <button
                        onClick={() => setActiveLayer("Cadastre")}
                        className={`px-3 py-2 text-xs font-bold rounded-sm shadow-lg flex items-center gap-2 transition-all ${activeLayer === "Cadastre" ? "bg-bricq-slate text-white" : "bg-white text-bricq-slate hover:bg-gray-50"}`}
                    >
                        <Layers size={14} /> Sat. + Cadastre
                    </button>
                    <button
                        onClick={() => setActiveLayer("Plan Cadastral")}
                        className={`px-3 py-2 text-xs font-bold rounded-sm shadow-lg flex items-center gap-2 transition-all ${activeLayer === "Plan Cadastral" ? "bg-bricq-slate text-white" : "bg-white text-bricq-slate hover:bg-gray-50"}`}
                    >
                        <FileText size={14} /> Plan Cadastral
                    </button>
                </div>
            )}

            {/* IGN Logo / Attribution Overlay */}
            <div className="absolute bottom-1 right-1 z-[400] text-[10px] bg-white/80 px-1 rounded text-slate-500 pointer-events-none">
                © IGN - Géoplateforme
            </div>
        </div>
    );
}
