// Fichier : lib/building3d.ts
// Maquette 3D du bâtiment réel à partir des données publiques :
// contour et hauteurs (BD TOPO de l'IGN), matériaux (BDNB), parcelle (cadastre, API Carto de l'IGN).

export type RoofType = 'gable' | 'hip' | 'mansard' | 'flat';

/** Point en mètres dans un repère local centré sur l'adresse : x vers l'est, y vers le nord. */
export type XY = [number, number];

export interface Footprint {
    /** Contour extérieur (sans fermeture répétée), en mètres locaux. */
    ring: XY[];
    /** Hauteur des murs (égout du toit), en mètres. */
    wallHeight: number;
    /** Hauteur du toit au-dessus des murs, en mètres. */
    roofRise: number;
}

export interface BuildingModel {
    main: Footprint;
    roof: RoofType;
    wallColor: string;
    roofColor: string;
    levels: number;
    neighbors: Footprint[];
    parcel?: XY[];
    /** « ign » si le contour vient de la BD TOPO, « approx » si c'est un volume estimé. */
    shapeSource: 'ign' | 'approx';
    sources: string[];
}

export interface BuildingHints {
    hauteur?: number;
    nb_niveaux?: number;
    surface_sol?: number;
    materiaux_murs?: string;
    materiaux_toiture?: string;
}

const WFS = 'https://data.geopf.fr/wfs/ows';
const API_CARTO = 'https://apicarto.ign.fr/api/cadastre/parcelle';

// --- Couleurs selon les matériaux déclarés -------------------------------------------------

export function wallColorFor(mat?: string): string {
    const m = (mat || '').toLowerCase();
    if (m.includes('brique')) return '#A9533B';
    if (m.includes('pierre') || m.includes('meulière')) return '#D8CBB0';
    if (m.includes('bois')) return '#9C7A54';
    if (m.includes('béton') || m.includes('beton') || m.includes('parpaing')) return '#C9C6C0';
    if (m.includes('enduit') || m.includes('torchis') || m.includes('plâtre')) return '#E3D3B5';
    if (m.includes('verre') || m.includes('métal') || m.includes('metal')) return '#AEB9BF';
    return '#DCD3C3';
}

export function roofColorFor(mat?: string): string {
    const m = (mat || '').toLowerCase();
    if (m.includes('ardoise')) return '#4E5960';
    if (m.includes('zinc') || m.includes('alu') || m.includes('métal') || m.includes('metal') || m.includes('tôle')) return '#7C878D';
    if (m.includes('tuile')) return '#A8472F';
    if (m.includes('béton') || m.includes('beton') || m.includes('terrasse')) return '#8D8A84';
    if (m.includes('chaume') || m.includes('végétal')) return '#7F8C5A';
    return '#8A3A2B';
}

/** Forme du toit déduite des matériaux (le relevé LiDAR HD viendra préciser plus tard). */
export function roofTypeFor(matToit?: string, levels?: number, hasRise?: boolean): RoofType {
    const m = (matToit || '').toLowerCase();
    if (m.includes('terrasse') || (m.includes('béton') && !hasRise) || (m.includes('beton') && !hasRise)) return 'flat';
    if (m.includes('zinc') && (levels ?? 0) >= 5) return 'mansard';
    if (m.includes('tuile') && (levels ?? 0) <= 2) return 'hip';
    if (m.includes('tuile') || m.includes('ardoise')) return 'gable';
    return hasRise ? 'gable' : 'flat';
}

// --- Géométrie -------------------------------------------------------------------------------

export function toLocal(lon: number, lat: number, lon0: number, lat0: number): XY {
    return [(lon - lon0) * Math.cos((lat0 * Math.PI) / 180) * 111320, (lat - lat0) * 110540];
}

export function polygonArea(ring: XY[]): number {
    let a = 0;
    for (let i = 0; i < ring.length; i++) {
        const [x1, y1] = ring[i];
        const [x2, y2] = ring[(i + 1) % ring.length];
        a += x1 * y2 - x2 * y1;
    }
    return Math.abs(a) / 2;
}

export function pointInRing(p: XY, ring: XY[]): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}

export interface OrientedBox {
    cx: number;
    cy: number;
    /** Grand côté, petit côté (m) et angle du grand côté (rad). */
    length: number;
    width: number;
    angle: number;
}

/** Rectangle englobant de surface minimale (parcours des orientations des arêtes). */
export function orientedBox(ring: XY[]): OrientedBox {
    let best: OrientedBox | null = null;
    let bestArea = Infinity;
    for (let i = 0; i < ring.length; i++) {
        const [x1, y1] = ring[i];
        const [x2, y2] = ring[(i + 1) % ring.length];
        const a = Math.atan2(y2 - y1, x2 - x1);
        const c = Math.cos(-a);
        const s = Math.sin(-a);
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const [x, y] of ring) {
            const rx = x * c - y * s;
            const ry = x * s + y * c;
            minX = Math.min(minX, rx); maxX = Math.max(maxX, rx);
            minY = Math.min(minY, ry); maxY = Math.max(maxY, ry);
        }
        const w = maxX - minX;
        const h = maxY - minY;
        const area = w * h;
        if (area < bestArea) {
            bestArea = area;
            const mx = (minX + maxX) / 2;
            const my = (minY + maxY) / 2;
            const cb = Math.cos(a);
            const sb = Math.sin(a);
            const cx = mx * cb - my * sb;
            const cy = mx * sb + my * cb;
            best = w >= h
                ? { cx, cy, length: w, width: h, angle: a }
                : { cx, cy, length: h, width: w, angle: a + Math.PI / 2 };
        }
    }
    return best ?? { cx: 0, cy: 0, length: 10, width: 10, angle: 0 };
}

function cleanRing(ring: XY[]): XY[] {
    const out = ring.slice();
    if (out.length > 1) {
        const [a, b] = [out[0], out[out.length - 1]];
        if (Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6) out.pop();
    }
    return out;
}

// --- Récupération des données -----------------------------------------------------------------

type Position = number[];
interface GeoFeature {
    geometry?: { type: string; coordinates: Position[][] | Position[][][] } | null;
    properties?: Record<string, unknown>;
}

function outerRing(geometry: GeoFeature['geometry']): Position[] | null {
    if (!geometry) return null;
    if (geometry.type === 'Polygon') return (geometry.coordinates as Position[][])[0] ?? null;
    if (geometry.type === 'MultiPolygon') {
        const polys = geometry.coordinates as Position[][][];
        // le plus grand polygone
        let best: Position[] | null = null;
        let bestLen = -1;
        for (const p of polys) if (p[0] && p[0].length > bestLen) { best = p[0]; bestLen = p[0].length; }
        return best;
    }
    return null;
}

function num(v: unknown): number | undefined {
    const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN;
    return Number.isFinite(n) ? n : undefined;
}

async function fetchJson(url: string, timeoutMs = 8000): Promise<unknown> {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/** Bâtiments BD TOPO dans un carré de ±`radius` m autour du point. */
async function fetchBdTopo(lat: number, lon: number, radius = 70): Promise<GeoFeature[]> {
    const dLat = radius / 110540;
    const dLon = radius / (111320 * Math.cos((lat * Math.PI) / 180));
    const params = new URLSearchParams({
        SERVICE: 'WFS',
        VERSION: '2.0.0',
        REQUEST: 'GetFeature',
        TYPENAMES: 'BDTOPO_V3:batiment',
        OUTPUTFORMAT: 'application/json',
        SRSNAME: 'EPSG:4326',
        COUNT: '80',
        BBOX: `${lat - dLat},${lon - dLon},${lat + dLat},${lon + dLon},urn:ogc:def:crs:EPSG::4326`,
    });
    const data = (await fetchJson(`${WFS}?${params.toString()}`)) as { features?: GeoFeature[] };
    return data.features ?? [];
}

async function fetchParcel(lat: number, lon: number): Promise<GeoFeature | null> {
    const geom = encodeURIComponent(JSON.stringify({ type: 'Point', coordinates: [lon, lat] }));
    const data = (await fetchJson(`${API_CARTO}?geom=${geom}`, 6000)) as { features?: GeoFeature[] };
    return data.features?.[0] ?? null;
}

/** Convertit une position (lon, lat), en corrigeant un éventuel ordre lat, lon. */
function positionToLocal(p: Position, lat0: number, lon0: number): XY {
    let [a, b] = p;
    // Si la première coordonnée ressemble à la latitude, l'ordre est inversé
    if (Math.abs(a - lat0) < Math.abs(a - lon0) && Math.abs(b - lon0) < Math.abs(b - lat0)) [a, b] = [b, a];
    return toLocal(a, b, lon0, lat0);
}

function footprintFrom(f: GeoFeature, lat0: number, lon0: number, fallbackHeight: number): Footprint | null {
    const ring = outerRing(f.geometry);
    if (!ring || ring.length < 3) return null;
    const local = cleanRing(ring.map((p) => positionToLocal(p, lat0, lon0)));
    const props = f.properties ?? {};
    const hauteur = num(props.hauteur);
    const sol = num(props.altitude_minimale_sol);
    const toitMin = num(props.altitude_minimale_toit);
    const toitMax = num(props.altitude_maximale_toit);
    let wall = sol !== undefined && toitMin !== undefined ? toitMin - sol : undefined;
    let rise = toitMin !== undefined && toitMax !== undefined ? toitMax - toitMin : 0;
    if (!wall || wall < 2) wall = hauteur ?? fallbackHeight;
    if (!Number.isFinite(rise) || rise < 0) rise = 0;
    return { ring: local, wallHeight: Math.max(2.5, wall), roofRise: Math.min(rise, 12) };
}

/** Volume estimé (carré de la surface au sol) quand le contour IGN est indisponible. */
function approxFootprint(hints: BuildingHints): Footprint {
    const side = Math.sqrt(Math.max(40, hints.surface_sol ?? 100));
    const w = side * 1.25;
    const d = (side * side) / w;
    const levels = hints.nb_niveaux ?? 2;
    const toit = (hints.materiaux_toiture || '').toLowerCase();
    // Petit bâtiment sans toit-terrasse déclaré : toit en pente, le cas le plus courant.
    const pitched = levels <= 4 && !toit.includes('terrasse') && !(toit.includes('béton') || toit.includes('beton'));
    const rise = pitched ? Math.min(4.5, Math.max(2, d * 0.35)) : 0;
    return {
        ring: [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]],
        wallHeight: Math.max(3, (hints.hauteur ?? levels * 3) - rise * 0.5),
        roofRise: rise,
    };
}

/**
 * Construit le modèle du bâtiment situé à (lat, lon). Ne lève pas d'erreur : en cas d'échec des
 * services IGN, renvoie un volume approximatif fidèle à la hauteur et à la surface de la BDNB.
 */
export async function loadBuildingModel(lat: number, lon: number, hints: BuildingHints = {}): Promise<BuildingModel> {
    const levels = hints.nb_niveaux ?? Math.max(1, Math.round((hints.hauteur ?? 6) / 3));
    const fallbackHeight = hints.hauteur ?? levels * 3;
    const sources = ['BDNB'];
    let main: Footprint | null = null;
    let neighbors: Footprint[] = [];
    let parcel: XY[] | undefined;
    let wallMat = hints.materiaux_murs;
    let roofMat = hints.materiaux_toiture;

    const [topo, parc] = await Promise.allSettled([fetchBdTopo(lat, lon), fetchParcel(lat, lon)]);

    if (topo.status === 'fulfilled' && topo.value.length) {
        const fps = topo.value
            .map((f) => ({ f, fp: footprintFrom(f, lat, lon, fallbackHeight) }))
            .filter((x): x is { f: GeoFeature; fp: Footprint } => x.fp !== null);
        // Le bâtiment de l'adresse : celui qui contient le point, sinon le plus proche
        let idx = fps.findIndex((x) => pointInRing([0, 0], x.fp.ring));
        if (idx < 0 && fps.length) {
            let bestD = Infinity;
            fps.forEach((x, i) => {
                const d = Math.min(...x.fp.ring.map(([px, py]) => px * px + py * py));
                if (d < bestD) { bestD = d; idx = i; }
            });
            if (bestD > 40 * 40) idx = -1;
        }
        if (idx >= 0) {
            main = fps[idx].fp;
            const props = fps[idx].f.properties ?? {};
            if (!wallMat && typeof props.materiaux_des_murs === 'string') wallMat = props.materiaux_des_murs;
            if (!roofMat && typeof props.materiaux_de_la_toiture === 'string') roofMat = props.materiaux_de_la_toiture;
            sources.push('BD TOPO IGN');
        }
        neighbors = fps.filter((_, i) => i !== idx).map((x) => x.fp)
            .filter((fp) => fp.ring.some(([x, y]) => Math.hypot(x, y) < 75));
    }

    if (parc.status === 'fulfilled' && parc.value) {
        const ring = outerRing(parc.value.geometry);
        if (ring && ring.length >= 3) {
            parcel = cleanRing(ring.map((p) => positionToLocal(p, lat, lon)));
            sources.push('Cadastre (API Carto)');
        }
    }

    const shapeSource: BuildingModel['shapeSource'] = main ? 'ign' : 'approx';
    if (!main) main = approxFootprint(hints);

    const roof = roofTypeFor(roofMat, levels, main.roofRise > 0.8);
    if (roof !== 'flat' && main.roofRise < 0.8) {
        const box = orientedBox(main.ring);
        main = { ...main, roofRise: roof === 'mansard' ? 3.5 : Math.min(7, Math.max(1.8, box.width * (roof === 'hip' ? 0.32 : 0.42))) };
    }

    return {
        main,
        roof,
        wallColor: wallColorFor(wallMat),
        roofColor: roofColorFor(roofMat),
        levels,
        neighbors,
        parcel,
        shapeSource,
        sources,
    };
}

/** Bâtiment d'exemple pour l'accueil (aucun appel réseau). */
export const SAMPLE_MODEL: BuildingModel = {
    main: { ring: [[-11, -5.5], [11, -5.5], [11, 5.5], [3, 5.5], [3, 12], [-5, 12], [-5, 5.5], [-11, 5.5]], wallHeight: 14, roofRise: 5 },
    roof: 'gable',
    wallColor: '#A9533B',
    roofColor: '#8A3A2B',
    levels: 5,
    neighbors: [
        { ring: [[-30, -6], [-12, -6], [-12, 6], [-30, 6]], wallHeight: 12, roofRise: 0 },
        { ring: [[12, -7], [30, -7], [30, 6], [12, 6]], wallHeight: 16, roofRise: 0 },
        { ring: [[-14, -30], [16, -30], [16, -18], [-14, -18]], wallHeight: 14, roofRise: 0 },
    ],
    parcel: [[-12, -6.5], [12, -6.5], [12, 15], [-12, 15]],
    shapeSource: 'approx',
    sources: ['Exemple'],
};
