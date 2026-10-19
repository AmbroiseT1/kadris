"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { loadBuildingModel, orientedBox, SAMPLE_MODEL, type BuildingHints, type BuildingModel, type Footprint, type XY } from "@/app/lib/building3d";
import type { Status } from "@/components/ui/StatusChip";
import PlanTrace from "@/components/motion/PlanTrace";

/** Couleurs de l'état d'entretien (alignées sur les jetons du système, éclaircies pour la 3D). */
const STATE_COLORS: Record<Status, string> = {
    ok: "#7FB394",
    vigil: "#D9A65A",
    alerte: "#D97A72",
    inconnu: "#C3CBD0",
};
const INK = "#16232C";

export interface ZoneStates {
    murs?: Status;
    toit?: Status;
}

function shapeFrom(ring: XY[]): THREE.Shape {
    const s = new THREE.Shape();
    ring.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
    s.closePath();
    return s;
}

/** Volume tronqué posé sur un rectangle orienté : toit à deux pans, à quatre pans ou mansarde. */
function frustumGeometry(length: number, width: number, topLength: number, topWidth: number, h: number): THREE.BufferGeometry {
    const b = [[-length / 2, 0, -width / 2], [length / 2, 0, -width / 2], [length / 2, 0, width / 2], [-length / 2, 0, width / 2]];
    const t = [[-topLength / 2, h, -topWidth / 2], [topLength / 2, h, -topWidth / 2], [topLength / 2, h, topWidth / 2], [-topLength / 2, h, topWidth / 2]];
    const v: number[] = [];
    const tri = (a: number[], c: number[], d: number[]) => v.push(...a, ...c, ...d);
    for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4;
        tri(b[i], b[j], t[j]);
        tri(b[i], t[j], t[i]);
    }
    if (topLength > 0.01 && topWidth > 0.01) { tri(t[0], t[1], t[2]); tri(t[0], t[2], t[3]); }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
    g.computeVertexNormals();
    return g;
}

function Edges({ geometry, opacity = 0.5 }: { geometry: THREE.BufferGeometry; opacity?: number }) {
    const edges = useMemo(() => new THREE.EdgesGeometry(geometry, 25), [geometry]);
    return (
        <lineSegments geometry={edges}>
            <lineBasicMaterial color={INK} transparent opacity={opacity} />
        </lineSegments>
    );
}

/** Murs extrudés depuis le contour (repère : y vers le haut, nord vers -z). */
function Walls({ fp, color }: { fp: Footprint; color: string }) {
    const geometry = useMemo(() => {
        const g = new THREE.ExtrudeGeometry(shapeFrom(fp.ring), { depth: fp.wallHeight, bevelEnabled: false });
        g.rotateX(-Math.PI / 2);
        return g;
    }, [fp]);
    return (
        <group>
            <mesh geometry={geometry} castShadow receiveShadow>
                <meshLambertMaterial color={color} />
            </mesh>
            <Edges geometry={geometry} opacity={0.55} />
        </group>
    );
}

function LevelLines({ fp, levels }: { fp: Footprint; levels: number }) {
    const geometry = useMemo(() => {
        const pts: number[] = [];
        const step = fp.wallHeight / Math.max(1, levels);
        for (let k = 1; k < levels; k++) {
            const y = k * step;
            fp.ring.forEach(([x1, n1], i) => {
                const [x2, n2] = fp.ring[(i + 1) % fp.ring.length];
                pts.push(x1, y, -n1, x2, y, -n2);
            });
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
        return g;
    }, [fp, levels]);
    return (
        <lineSegments geometry={geometry}>
            <lineBasicMaterial color={INK} transparent opacity={0.2} />
        </lineSegments>
    );
}

function Roof({ model, color }: { model: BuildingModel; color: string }) {
    const { main, roof } = model;
    const data = useMemo(() => {
        if (roof === "flat") {
            const g = new THREE.ExtrudeGeometry(shapeFrom(main.ring), { depth: 0.4, bevelEnabled: false });
            g.rotateX(-Math.PI / 2);
            return { geometry: g, position: [0, main.wallHeight, 0] as [number, number, number], rotation: 0 };
        }
        const box = orientedBox(main.ring);
        const { length, width } = box;
        const rise = main.roofRise;
        const g = roof === "gable"
            ? frustumGeometry(length, width, length, 0, rise)
            : roof === "hip"
                ? frustumGeometry(length, width, Math.max(0.5, length - width), 0, rise)
                : frustumGeometry(length, width, Math.max(1, length - 4), Math.max(1, width - 4), rise);
        return { geometry: g, position: [box.cx, main.wallHeight, -box.cy] as [number, number, number], rotation: box.angle };
    }, [main, roof]);
    return (
        <group position={data.position} rotation={[0, data.rotation, 0]}>
            <mesh geometry={data.geometry} castShadow>
                <meshLambertMaterial color={color} side={THREE.DoubleSide} />
            </mesh>
            <Edges geometry={data.geometry} opacity={0.6} />
        </group>
    );
}

function Neighbor({ fp }: { fp: Footprint }) {
    const geometry = useMemo(() => {
        const g = new THREE.ExtrudeGeometry(shapeFrom(fp.ring), { depth: fp.wallHeight + fp.roofRise * 0.5, bevelEnabled: false });
        g.rotateX(-Math.PI / 2);
        return g;
    }, [fp]);
    return (
        <group>
            <mesh geometry={geometry} castShadow>
                <meshLambertMaterial color="#C9D2D5" transparent opacity={0.55} />
            </mesh>
            <Edges geometry={geometry} opacity={0.12} />
        </group>
    );
}

function Parcel({ ring }: { ring: XY[] }) {
    const ref = useRef<THREE.Line>(null);
    const geometry = useMemo(() => {
        const pts = ring.map(([x, n]) => new THREE.Vector3(x, 0.06, -n));
        pts.push(pts[0].clone());
        return new THREE.BufferGeometry().setFromPoints(pts);
    }, [ring]);
    useEffect(() => { ref.current?.computeLineDistances(); }, [geometry]);
    return (
        // @ts-expect-error -- l'élément <line> de three (et non le SVG) est fourni par react-three-fiber
        <line ref={ref} geometry={geometry}>
            <lineDashedMaterial color="#B4442C" dashSize={1.2} gapSize={0.8} />
        </line>
    );
}

/** Le bâtiment s'élève depuis son contour (900 ms), sauf si l'animation est réduite. */
function Rising({ children, playKey }: { children: React.ReactNode; playKey: string }) {
    const ref = useRef<THREE.Group>(null);
    const start = useRef<number | null>(null);
    const reduce = useMemo(() => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches, []);
    useEffect(() => { start.current = null; }, [playKey]);
    useFrame(({ clock, invalidate }) => {
        if (!ref.current) return;
        if (reduce) { ref.current.scale.y = 1; return; }
        if (start.current === null) start.current = clock.elapsedTime;
        const k = Math.min(1, (clock.elapsedTime - start.current) / 0.9);
        const c1 = 1.1;
        const q = k - 1;
        ref.current.scale.y = Math.max(0.02, k < 1 ? 1 + (c1 + 1) * q * q * q + c1 * q * q : 1);
        if (k < 1) invalidate();
    });
    return <group ref={ref}>{children}</group>;
}

function Scene({ model, mode, states }: { model: BuildingModel; mode: "materiaux" | "etat"; states: ZoneStates }) {
    const radius = useMemo(() => {
        const r = Math.max(...model.main.ring.map(([x, y]) => Math.hypot(x, y)), 8);
        return Math.max(r, model.main.wallHeight * 0.9);
    }, [model]);
    const wall = mode === "etat" ? STATE_COLORS[states.murs ?? "inconnu"] : model.wallColor;
    const roof = mode === "etat" ? STATE_COLORS[states.toit ?? "inconnu"] : model.roofColor;
    const key = `${model.main.ring.length}:${model.main.wallHeight}`;
    return (
        <>
            <hemisphereLight args={["#ffffff", "#8899a0", 0.9]} />
            <directionalLight
                position={[-radius * 2, radius * 3.5, radius * 1.5]}
                intensity={1.1}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-bias={-0.002}
                shadow-normalBias={0.05}
                shadow-camera-left={-radius * 3}
                shadow-camera-right={radius * 3}
                shadow-camera-top={radius * 3}
                shadow-camera-bottom={-radius * 3}
            />
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[radius * 20, radius * 20]} />
                <meshLambertMaterial color="#FFFFFF" />
            </mesh>
            {model.parcel && <Parcel ring={model.parcel} />}
            {model.neighbors.map((fp, i) => <Neighbor key={i} fp={fp} />)}
            <Rising playKey={key}>
                <Walls fp={model.main} color={wall} />
                <LevelLines fp={model.main} levels={model.levels} />
                <Roof model={model} color={roof} />
            </Rising>
            <OrbitControls
                enablePan={false}
                minDistance={radius * 1.6}
                maxDistance={radius * 6}
                maxPolarAngle={Math.PI / 2.15}
                target={[0, model.main.wallHeight * 0.45, 0]}
            />
        </>
    );
}

export interface Building3DProps {
    /** Coordonnées de l'adresse ; sans elles, le bâtiment d'exemple est affiché. */
    lat?: number;
    lon?: number;
    hints?: BuildingHints;
    mode?: "materiaux" | "etat";
    states?: ZoneStates;
    className?: string;
    /** Texte alternatif décrivant le bâtiment. */
    label?: string;
    /** Montre la légende des sources sous la maquette. */
    showCaption?: boolean;
    sample?: boolean;
}

/**
 * Maquette 3D du bâtiment réel (contour BD TOPO, hauteurs, matériaux BDNB, parcelle cadastrale).
 * Repli : volume approximatif à la bonne hauteur, signalé comme tel.
 */
export default function Building3D({ lat, lon, hints, mode = "materiaux", states = {}, className = "", label, showCaption = true, sample = false }: Building3DProps) {
    const [model, setModel] = useState<BuildingModel | null>(sample ? SAMPLE_MODEL : null);
    const hintsKey = JSON.stringify(hints ?? {});

    useEffect(() => {
        if (sample || lat == null || lon == null) return;
        let cancelled = false;
        loadBuildingModel(lat, lon, JSON.parse(hintsKey) as BuildingHints).then((m) => { if (!cancelled) setModel(m); });
        return () => { cancelled = true; };
    }, [lat, lon, hintsKey, sample]);

    const camDist = model ? Math.max(42, Math.max(...model.main.ring.map(([x, y]) => Math.hypot(x, y)), model.main.wallHeight + model.main.roofRise) * 4.4) : 60;

    return (
        <figure className={`relative grid grid-rows-[1fr_auto] bg-papier ${className}`}>
            <div className="relative min-h-0" role="img" aria-label={label ?? "Maquette 3D du bâtiment, à faire pivoter"}>
                {!model ? (
                    <PlanTrace />
                ) : (
                    <Canvas
                        shadows
                        dpr={[1, 2]}
                        frameloop="demand"
                        camera={{ position: [camDist * 0.7, camDist * 0.62, camDist * 0.75], fov: 32, near: 1, far: camDist * 20 }}
                        gl={{ antialias: true, preserveDrawingBuffer: false }}
                        style={{ touchAction: "none" }}
                    >
                        <color attach="background" args={["#F3F5F4"]} />
                        <Scene model={model} mode={mode} states={states} />
                    </Canvas>
                )}
            </div>
            {showCaption && model && (
                <figcaption className="flex flex-wrap justify-between gap-2 px-3 py-2 border-t border-trait bg-surface font-mono text-xs text-texte-2">
                    <span>
                        {sample ? "Bâtiment d'exemple" : model.shapeSource === "ign" ? "Contour réel du bâtiment" : "Forme approximative (contour IGN indisponible)"}
                        {" · "}Sources : {model.sources.join(", ")}
                    </span>
                    <span>Glisser pour tourner · pincer ou molette pour zoomer</span>
                </figcaption>
            )}
        </figure>
    );
}
