// Fichier : lib/georisques.ts
// Synthèse des risques via le backend (/public-data/risks), qui interroge l'API Géorisques v1
// et met en cache 24 h. Règle : une valeur `null` signifie « non disponible », JAMAIS « aucun risque ».

import { api } from './api';

export type RiskSectionStatus = 'ok' | 'empty' | 'error';
export type NiveauArgiles = 'Nul' | 'Faible' | 'Moyen' | 'Fort';

export interface CatnatEvent {
  libelle?: string;
  date_debut?: string;
  date_fin?: string;
  date_arrete?: string;
}

export interface RiskData {
  pdf_url: string;
  lat: number;
  lon: number;
  /** ok = toutes les rubriques ont répondu ; partial = certaines manquent ; unavailable = aucune. */
  status?: 'ok' | 'partial' | 'unavailable';
  fetched_at?: string;
  code_insee?: string;
  sections?: Record<'argiles' | 'inondation' | 'catnat' | 'cavites' | 'installations' | 'sismicite' | 'radon', RiskSectionStatus>;

  /** Exposition au retrait-gonflement des argiles. null = non disponible. */
  argiles?: NiveauArgiles | null;
  argiles_libelle?: string;
  /** Commune couverte par un AZI ou exposée au risque inondation (échelle communale). null = non disponible. */
  inondation?: boolean | null;
  inondation_detail?: { zones: string[]; risques_commune: string[] };
  /** Cavités souterraines recensées dans un rayon de 500 m. */
  cavites?: { count: number; rayon_m: number; items: { type?: string; nom?: string }[] } | null;
  /** ICPE dans un rayon de 1 km (20 premières). */
  installations?: { nom?: string; regime?: string; seveso?: string }[] | null;
  installations_count?: number;
  installations_rayon_m?: number;
  /** Arrêtés de catastrophe naturelle sur la commune. */
  catnat?: { count: number; evenements: CatnatEvent[] } | null;
  sismicite?: { zone: string; libelle?: string } | null;
  radon?: { classe: string } | null;
  _raw?: unknown;
}

export function georisquesPdfUrl(lat: number, lon: number): string {
  // Géorisques attend longitude,latitude
  return `https://www.georisques.gouv.fr/api/v1/rapport_pdf?latlon=${lon.toFixed(5)},${lat.toFixed(5)}`;
}

const SECTIONS = ['argiles', 'inondation', 'catnat', 'cavites', 'installations', 'sismicite', 'radon'] as const;

function unavailable(lat: number, lon: number): RiskData {
  return {
    pdf_url: georisquesPdfUrl(lat, lon),
    lat,
    lon,
    status: 'unavailable',
    sections: Object.fromEntries(SECTIONS.map((s) => [s, 'error'])) as RiskData['sections'],
    argiles: null,
    inondation: null,
    cavites: null,
    installations: null,
    catnat: null,
    sismicite: null,
    radon: null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ok = (s: any) => s?.status === 'ok';

/**
 * Récupère la synthèse Géorisques. Ne lève jamais : en cas d'échec, retourne un objet
 * `status: 'unavailable'` dont toutes les rubriques valent null (le lien PDF reste fourni).
 */
export async function fetchRisks(lat: number, lon: number, codeInsee?: string): Promise<RiskData> {
  try {
    const { data: r } = await api.get('/public-data/risks', {
      params: { lat, lon, ...(codeInsee ? { code_insee: codeInsee } : {}) },
      timeout: 30000,
    });
    const sections = Object.fromEntries(
      SECTIONS.map((s) => [s, (r?.[s]?.status as RiskSectionStatus) || 'error'])
    ) as RiskData['sections'];

    return {
      pdf_url: r.pdf_url || georisquesPdfUrl(lat, lon),
      lat,
      lon,
      status: r.status,
      fetched_at: r.fetched_at,
      code_insee: r.code_insee,
      sections,
      argiles: ok(r.argiles) ? r.argiles.niveau : null,
      argiles_libelle: r.argiles?.libelle,
      inondation: ok(r.inondation) ? Boolean(r.inondation.en_zone) : null,
      inondation_detail: ok(r.inondation)
        ? { zones: r.inondation.zones || [], risques_commune: r.inondation.risques_commune || [] }
        : undefined,
      cavites: ok(r.cavites) ? { count: r.cavites.count, rayon_m: r.cavites.rayon_m, items: r.cavites.items || [] } : null,
      installations: ok(r.installations) ? r.installations.items || [] : null,
      installations_count: ok(r.installations) ? r.installations.count : undefined,
      installations_rayon_m: ok(r.installations) ? r.installations.rayon_m : undefined,
      catnat: ok(r.catnat) ? { count: r.catnat.count, evenements: r.catnat.evenements || [] } : null,
      sismicite: ok(r.sismicite) ? { zone: r.sismicite.zone, libelle: r.sismicite.libelle } : null,
      radon: ok(r.radon) ? { classe: r.radon.classe } : null,
      _raw: r,
    };
  } catch (error) {
    console.error('Erreur Géorisques (backend):', error);
    return unavailable(lat, lon);
  }
}

/** Libellé d'une rubrique pour l'affichage : distingue « indisponible » de « non concerné ». */
export function riskLabel(status: RiskSectionStatus | undefined, value: string | null | undefined, emptyLabel = 'Non renseigné'): string {
  if (status === 'error' || status === undefined) return 'Données indisponibles';
  if (status === 'empty') return emptyLabel;
  return value ?? 'Données indisponibles';
}
