// Fichier : lib/sources.ts
// Traçabilité des blocs du rapport : chaque bloc affiche sa source, sa date et son état.

export type SourceStatus = 'loading' | 'ok' | 'partial' | 'empty' | 'error';

export interface SourceInfo {
  /** Nom lisible de la source (ex. « Géorisques »). */
  name: string;
  /** Page de référence de la source. */
  url?: string;
  status: SourceStatus;
  /** Date (ISO) de la récupération par Bricq. */
  fetchedAt?: string;
  /** Date ou période des données elles-mêmes (ex. « 2021–2025 », date du DPE). */
  dataDate?: string;
  /** Précision affichée à côté du badge (ex. « DPE d'un logement de l'immeuble »). */
  note?: string;
}

export type SourceKey =
  | 'bdnb'
  | 'risques'
  | 'urbanisme'
  | 'quartier'
  | 'dvf'
  | 'dpe'
  | 'eau'
  | 'connectivite';

export type ReportSources = Partial<Record<SourceKey, SourceInfo>>;

export const SOURCE_CATALOG: Record<SourceKey, Pick<SourceInfo, 'name' | 'url'>> = {
  bdnb: { name: 'BDNB (CSTB)', url: 'https://bdnb.io' },
  risques: { name: 'Géorisques (MTE / BRGM)', url: 'https://www.georisques.gouv.fr' },
  urbanisme: { name: "Géoportail de l'Urbanisme (IGN)", url: 'https://www.geoportail-urbanisme.gouv.fr' },
  quartier: { name: 'OpenStreetMap (Overpass)', url: 'https://www.openstreetmap.org' },
  dvf: { name: 'DVF géolocalisées (DGFiP / Etalab)', url: 'https://explore.data.gouv.fr/fr/immobilier' },
  dpe: { name: 'Observatoire DPE (ADEME)', url: 'https://observatoire-dpe-audit.ademe.fr' },
  eau: { name: "Hub'Eau – qualité de l'eau potable", url: 'https://hubeau.eaufrance.fr' },
  connectivite: { name: 'Arcep – Ma connexion internet', url: 'https://maconnexioninternet.arcep.fr' },
};

export function sourceInfo(key: SourceKey, status: SourceStatus, extra: Partial<SourceInfo> = {}): SourceInfo {
  return {
    ...SOURCE_CATALOG[key],
    status,
    fetchedAt: status === 'loading' ? undefined : new Date().toISOString(),
    ...extra,
  };
}

/** Erreur levée par les connecteurs quand la source est injoignable (≠ « aucune donnée »). */
export class SourceUnavailableError extends Error {
  constructor(source: string, detail?: string) {
    super(`${source} indisponible${detail ? ` : ${detail}` : ''}`);
    this.name = 'SourceUnavailableError';
  }
}

export function formatDateFr(iso?: string): string | undefined {
  if (!iso) return undefined;
  // Formats rencontrés : ISO (2024-03-01...), ou JJ/MM/AAAA (Géorisques)
  if (/^\d{2}\/\d{2}\/\d{4}/.test(iso)) return iso.slice(0, 10);
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('fr-FR');
}
