// Fichier : lib/bndb.ts
// Accès unique à la BDNB (Base de Données Nationale des Bâtiments, CSTB) — utilisé par le rapport
// et par l'ajout de bien. Toute règle métier sur les données BDNB doit vivre ici.

import proj4 from 'proj4';
import type { BuildingData } from './types';
import { SourceUnavailableError } from './sources';

const BDNB_URL = 'https://api.bdnb.io/v1/bdnb/donnees/batiment_groupe_complet/adresse';

const LAMBERT_93 = '+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
const WGS_84 = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';

/**
 * Clé d'interopérabilité BAN : `<code INSEE>_<code voie>_<numéro>[_<suffixe>]`,
 * ex. `75107_8909_00012` ou `13201_0360_00012_bis`. Le segment numéro est absent pour une voie.
 */
const CLE_INTEROP_RE = /^(\d{5}|2[AB]\d{3})_[0-9a-z]{4,6}(_\d{5}(_[0-9a-z]{1,10})?)?$/i;

export function isValidCleInterop(cle: string | null | undefined): cle is string {
  return typeof cle === 'string' && CLE_INTEROP_RE.test(cle);
}

/** Code commune (INSEE, ou arrondissement pour Paris/Lyon/Marseille) contenu dans la clé BAN. */
export function codeInseeFromCleInterop(cle: string): string | undefined {
  return isValidCleInterop(cle) ? cle.slice(0, 5).toUpperCase() : undefined;
}

// --- Règle unique : année de construction ---------------------------------
//
// Ordre de priorité (premier champ valide retenu) :
//   1. `annee_construction`        — année consolidée BDNB (fichiers fonciers / DGFiP) ;
//   2. `annee_construction_dpe`    — année déclarée dans le DPE (souvent estimée par tranche) ;
//   3. `periode_construction_max`  — période si aucune année n'est connue.
// Une année est valide si c'est un entier entre 1000 et l'année en cours.
// On ne prend PAS le minimum de plusieurs sources : mélanger fiscal et DPE produisait
// des années différentes selon l'écran.

export interface AnneeConstruction {
  /** Valeur affichable : « 1932 », « Période 1919-1945 » ou « Non daté ». */
  label: string;
  annee: number | null;
  source: 'fiscale' | 'dpe' | 'periode' | 'inconnue';
}

function validYear(v: unknown): number | null {
  const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10);
  return Number.isInteger(n) && n >= 1000 && n <= new Date().getFullYear() ? n : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveAnneeConstruction(bat: any): AnneeConstruction {
  const fiscale = validYear(bat?.annee_construction);
  if (fiscale) return { label: String(fiscale), annee: fiscale, source: 'fiscale' };
  const dpe = validYear(bat?.annee_construction_dpe);
  if (dpe) return { label: String(dpe), annee: dpe, source: 'dpe' };
  if (bat?.periode_construction_max) return { label: `Période ${bat.periode_construction_max}`, annee: null, source: 'periode' };
  return { label: 'Non daté', annee: null, source: 'inconnue' };
}

// --- Accès API --------------------------------------------------------------

/**
 * Ligne brute `batiment_groupe_complet` pour une adresse BAN.
 * Retourne null si l'adresse n'est rattachée à aucun bâtiment ; lève SourceUnavailableError si la BDNB ne répond pas.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchBdnbRaw(cleInterop: string): Promise<any | null> {
  if (!isValidCleInterop(cleInterop)) return null;
  const url = `${BDNB_URL}?limit=1&cle_interop_adr=eq.${encodeURIComponent(cleInterop)}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    throw new SourceUnavailableError('BDNB', String(e));
  }
  if (!res.ok) throw new SourceUnavailableError('BDNB', `HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function coordsFromGeom(bat: any): { lat: number; lon: number } | undefined {
  const point = bat?.geom_groupe?.coordinates?.[0]?.[0]?.[0];
  if (!Array.isArray(point)) return undefined;
  if (point[0] > 180) {
    const [lon, lat] = proj4(LAMBERT_93, WGS_84, point);
    return { lat, lon };
  }
  return { lon: point[0], lat: point[1] };
}

/** Projection d'une ligne BDNB vers le modèle du rapport. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapBdnbToBuilding(bat: any): BuildingData {
  const annee = resolveAnneeConstruction(bat);
  return {
    adresse_ban: bat.libelle_adr_principale_ban,
    annee_construction: annee.label,
    annee_construction_source: annee.source,
    dpe_lettre: bat.classe_bilan_dpe || bat.classe_bilan_dpe_moyen || 'Non noté',
    materiaux_murs: bat.mat_mur_txt || 'Non renseigné',
    materiaux_toiture: bat.mat_toit_txt || 'Non renseigné',
    hauteur: bat.hauteur_mean,
    nb_niveaux: bat.nb_niveau,
    surface_sol: bat.surface_emprise_sol,
    altitude: bat.altitude_sol_mean,
    nb_logements: bat.nb_log,
    usage: bat.usage_niveau_1_txt || 'Non déterminé',
    fiabilite: bat.fiabilite_cr_adr_niv_1?.includes('fiables') ? 'Haute' : 'Moyenne',
    coords: coordsFromGeom(bat),
    raw_bdnb: bat,
  };
}

/** Bâtiment complet pour une clé BAN (null si inconnu ; lève si la BDNB est injoignable). */
export async function fetchBuildingData(cleInterop: string): Promise<BuildingData | null> {
  const raw = await fetchBdnbRaw(cleInterop);
  return raw ? mapBdnbToBuilding(raw) : null;
}
