"use client";

import { useRef, useState } from "react";
import Map, { Source, Layer } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import type { LineLayerSpecification } from "mapbox-gl";
import mapboxgl from "mapbox-gl";

import CountryRouteSelector from "./CountryRouteSelector";
import { PORTS } from "./ports";

/* =========================
   Types
========================= */
export type Port = {
    city: string;
    state: string;
    country: string;
    lat: number;
    lng: number;
};

type Route = {
    id: string;
    coordinates: [number, number][];
};

/* =========================
   Constants
========================= */
const TOKEN ="";

const initialViewState = {
    latitude: 30,
    longitude: 5,
    zoom: 1.3,
};

/* =========================
   Routing helpers
========================= */
function distance(a: Port, b: Port) {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;

    const sa =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;

    return 2 * R * Math.asin(Math.sqrt(sa));
}

function findBestPorts(from: string, to: string, ports: Port[]) {
    const fromPorts = ports.filter(p => p.country === from);
    const toPorts = ports.filter(p => p.country === to);

    if (!fromPorts.length || !toPorts.length) return null;

    let best = null;
    let min = Infinity;

    for (const f of fromPorts) {
        for (const t of toPorts) {
            const d = distance(f, t);
            if (d < min) {
                min = d;
                best = { from: f, to: t };
            }
        }
    }
    return best;
}

/* =========================
   Dash animation sequence
========================= */
const dashArraySequence: number[][] = [
    [0, 4, 3],
    [0.5, 4, 2.5],
    [1, 4, 2],
    [1.5, 4, 1.5],
    [2, 4, 1],
    [2.5, 4, 0.5],
    [3, 4, 0],
    [0, 1, 3, 3],
];

/* =========================
   Component
========================= */
export default function ShippingMap() {
    const mapRef = useRef<MapRef>(null);
    const mapboxRef = useRef<mapboxgl.Map | null>(null);

    const styleReadyRef = useRef(false);
    const mapIdleRef = useRef(false);
    const animationRef = useRef<number | null>(null);

    const [routes, setRoutes] = useState<Route[]>([]);

    /* =========================
       Layers
    ========================= */
    const backgroundLayer = (id: string): LineLayerSpecification => ({
        id: `${id}-bg`,
        type: "line",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
            "line-color": "yellow",
            "line-width": 6,
            "line-opacity": 0.25,
        },
        source: "",
    });

    const dashedLayer = (id: string): LineLayerSpecification => ({
        id: `${id}-dash`,
        type: "line",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
            "line-color": "yellow",
            "line-width": 6,
            "line-dasharray": dashArraySequence[0],
            "line-emissive-strength": 1,
        },
        source: "",
    });

    /* =========================
       Animation control
    ========================= */
    function stopAnimation() {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
    }

    function animateRoute(id: string) {
        const map = mapboxRef.current;
        if (!map) return;

        let last = -1;

        const tick = (ts: number) => {
            // ✅ HARD guards (Mapbox GL v3 safe)
            if (
                !styleReadyRef.current ||
                !mapIdleRef.current ||
                !map.isStyleLoaded()
            ) {
                animationRef.current = requestAnimationFrame(tick);
                return;
            }

            const step = Math.floor((ts / 60) % dashArraySequence.length);

            if (step !== last) {
                try {
                    map.setPaintProperty(
                        `${id}-dash`,
                        "line-dasharray",
                        dashArraySequence[step]
                    );
                    last = step;
                } catch {
                    // Expected until layer is committed — ignore silently
                }
            }

            animationRef.current = requestAnimationFrame(tick);
        };

        animationRef.current = requestAnimationFrame(tick);
    }

    /* =========================
       Camera fit
    ========================= */
    function fitRoute(coords: [number, number][]) {
        if (!mapboxRef.current) return;

        const bounds = coords.reduce(
            (b, c) => b.extend(c),
            new mapboxgl.LngLatBounds(coords[0], coords[0])
        );

        mapboxRef.current.fitBounds(bounds, {
            padding: 80,
            duration: 1200,
            essential: true,
        });
    }

    /* =========================
       Actions
    ========================= */
    function handleFindRoutes(from: string, to: string) {
        stopAnimation();

        const pair = findBestPorts(from, to, PORTS);
        if (!pair) return;

        const coords: [number, number][] = [
            [pair.from.lng, pair.from.lat],
            [pair.to.lng, pair.to.lat],
        ];

        const id = `${from}-${to}`;

        setRoutes([{ id, coordinates: coords }]);
        fitRoute(coords);

        requestAnimationFrame(() => animateRoute(id));
    }

    function handleClear() {
        stopAnimation();
        setRoutes([]);
    }

    /* =========================
       Render
    ========================= */
    return (
        <div className="w-full space-y-6">
            <CountryRouteSelector
                countries={[...new Set(PORTS.map(p => p.country))].sort()}
                onFind={handleFindRoutes}
                onClear={handleClear}
            />

            <div className="h-[calc(100vh-220px)] rounded-lg overflow-hidden">
                <Map
                    ref={mapRef}
                    mapboxAccessToken={TOKEN}
                    initialViewState={initialViewState}
                    mapStyle="mapbox://styles/mapbox/streets-v12"
                    onLoad={e => {
                        mapboxRef.current = e.target;
                    }}
                    onStyleData={() => {
                        styleReadyRef.current = true;
                    }}
                    onIdle={() => {
                        mapIdleRef.current = true;
                    }}
                >
                    {routes.map(route => (
                        <Source
                            key={route.id}
                            type="geojson"
                            data={{
                                type: "Feature",
                                geometry: {
                                    type: "LineString",
                                    coordinates: route.coordinates,
                                },
                                properties: {},
                            }}
                        >
                            <Layer {...backgroundLayer(route.id)} />
                            <Layer {...dashedLayer(route.id)} />
                        </Source>
                    ))}
                </Map>
            </div>
        </div>
    );
}
