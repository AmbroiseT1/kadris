import type { Metadata } from 'next';
import { isValidCleInterop } from '@/app/lib/bndb';
import ReportClient from './ReportClient';

// Le segment s'appelle historiquement `cityCode` mais contient la clé d'interopérabilité BAN
// de l'adresse (ex. 75107_8909_00012).
type Params = Promise<{ cityCode: string }>;

const GENERIC_TITLE = 'Rapport immobilier';
const DESCRIPTION_SUFFIX = 'risques naturels, DPE, urbanisme, prix DVF et quartier à partir des données publiques.';

/** Libellé d'adresse depuis la BAN (plateforme adresse.data.gouv.fr), ou null. */
async function lookupBanLabel(cleInterop: string): Promise<string | null> {
  try {
    const res = await fetch(`https://plateforme.adresse.data.gouv.fr/lookup/${encodeURIComponent(cleInterop)}`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const a = await res.json();
    const numero = [a.numero, a.suffixe].filter(Boolean).join(' ');
    const voie = a.voie?.nomVoie ?? a.nomVoie;
    const commune = a.commune?.nom;
    const cp = a.codePostal ?? a.parcelles?.codePostal;
    if (!voie && !commune) return null;
    return [[numero, voie].filter(Boolean).join(' '), [cp, commune].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { cityCode } = await params;
  const cle = decodeURIComponent(cityCode);
  const adresse = isValidCleInterop(cle) ? await lookupBanLabel(cle) : null;
  if (!adresse) {
    return { title: GENERIC_TITLE, description: `Rapport immobilier Bricq : ${DESCRIPTION_SUFFIX}` };
  }
  return {
    title: `${GENERIC_TITLE} – ${adresse}`,
    description: `Rapport immobilier du ${adresse} : ${DESCRIPTION_SUFFIX}`,
  };
}

export default async function ReportPage({ params }: { params: Params }) {
  const { cityCode } = await params;
  return <ReportClient cleInterop={decodeURIComponent(cityCode)} />;
}
