// Fichier : lib/urbanisme.ts

export interface PrescriptionItem {
  type: string;
  titre: string;
  libelle: string;
  categorie: 'forte' | 'patrimoine' | 'technique' | 'autre';
  description: string;
  url_doc?: string | null;
}

export interface UrbanismeData {
  /** Couches GPU qui n'ont pas répondu (affichées « indisponibles », jamais « aucune contrainte »). */
  indisponibles?: string[];
  zonage: {
    code: string;
    libelle: string;
    type: string;
    conseil: string;
    is_constructible: boolean;
    // 👇 C'est ici qu'on va stocker le lien direct (ex: UC1.pdf)
    url_doc: string | null;
    // 👇 Fallback si pas d'URL mais un nom de fichier
    filename_doc?: string | null;
  } | null;

  document: {
    nom: string;
    id: string;
    url_reglement: string | null; // Lien du dossier global
    etat: string;
  } | null;

  contraintes: PrescriptionItem[];

  servitudes: Array<{
    code: string;
    libelle: string;
    description: string;
    url_doc?: string | null;
  }>;

  _raw?: unknown;
}

// --- DICTIONNAIRES (Inchus) ---
const CNIG_CODES: Record<string, { titre: string, cat: PrescriptionItem['categorie'], desc: string }> = {
  "01": { titre: "Espace Boisé Classé (EBC)", cat: "forte", desc: "Interdiction stricte de défricher. Arbres protégés." },
  "05": { titre: "Emplacement Réservé", cat: "forte", desc: "Terrain réservé par la collectivité (voirie, école...)." },
  "16": { titre: "Zone de Risque", cat: "forte", desc: "Périmètre d'un Plan de Prévention des Risques (PPR)." },
  "07": { titre: "Protection Patrimoine", cat: "patrimoine", desc: "Protection paysagère ou bâtie. Démolition interdite." },
  "39": { titre: "Restriction Hauteur", cat: "technique", desc: "Limitation spécifique de la hauteur (cône de vue)." },
  "44": { titre: "Règles Stationnement", cat: "technique", desc: "Obligations spécifiques pour les places de parking." },
  "18": { titre: "OAP", cat: "technique", desc: "Orientation d'Aménagement : règles spécifiques au quartier." },
  "19": { titre: "Mixité Sociale", cat: "technique", desc: "Servitude de mixité sociale ou fonctionnelle." },
  "99": { titre: "Autre Prescription", cat: "autre", desc: "Règle locale spécifique." },
};

function interpreterZone(code: string, libelle: string) {
  const c = code ? code.toUpperCase() : "";
  const l = libelle ? libelle.toLowerCase() : "";

  if (c.startsWith('U') || l.includes('urbaine')) return { conseil: "Zone Urbaine. Terrain a priori constructible. Vérifiez le CES et la hauteur.", constructible: true };
  if (c.startsWith('AU') || c.startsWith('1AU') || l.includes('urbaniser')) return { conseil: "Zone À Urbaniser. Constructibilité conditionnée (réseaux).", constructible: true };
  if (c.startsWith('A') || l.includes('agricole')) return { conseil: "Zone Agricole. Inconstructible (sauf exploitation agri).", constructible: false };
  if (c.startsWith('N') || l.includes('naturelle')) return { conseil: "Zone Naturelle. Inconstructible (protection environnement).", constructible: false };

  return { conseil: "Zone Spécifique. Voir règlement.", constructible: true };
}

function interpreterSUP(code: string) {
  const dict: Record<string, { label: string, impact: string }> = {
    "AC1": { label: "Monument Historique", impact: "Périmètre ABF (500m). Avis conforme requis." },
    "AC2": { label: "Site Patrimonial", impact: "Protection forte. Travaux soumis à autorisation." },
    "I4": { label: "Ligne Électrique", impact: "Non aedificandi sous la ligne." },
    "I3": { label: "Gazoduc / Pipeline", impact: "Canalisation dangereuse. Périmètre de sécurité." },
    "PM1": { label: "Plan Prévention Risques", impact: "Zone à risque (Inondation). Voir PPR." },
    "EL7": { label: "Alignement Voirie", impact: "Recul obligatoire (futur élargissement)." },
  };
  return dict[code] || { label: "Servitude d'Utilité Publique", impact: "Contrainte administrative." };
}

function removeDuplicates<T extends object>(array: T[], key: keyof T): T[] {
  return array.filter((obj, index, self) => index === self.findIndex((t) => (t[key] === obj[key])));
}

// Feature GeoJSON renvoyée par l'API Carto GPU
interface GpuFeature {
  properties: Record<string, string | undefined>;
}

// --- FETCH PRINCIPAL ---
export async function fetchUrbanisme(lat: number, lon: number): Promise<UrbanismeData | null> {
  try {
    const geojson = { type: "Point", coordinates: [lon, lat] };
    const geomParam = encodeURIComponent(JSON.stringify(geojson));

    console.log("🏗️ Appel API Urbanisme (IGN GPU)...");

    const [resZone, resDoc, resPrescr, resSup] = await Promise.all([
      fetch(`https://apicarto.ign.fr/api/gpu/zone-urba?geom=${geomParam}`),
      fetch(`https://apicarto.ign.fr/api/gpu/document?geom=${geomParam}`),
      fetch(`https://apicarto.ign.fr/api/gpu/prescription-surf?geom=${geomParam}`),
      fetch(`https://apicarto.ign.fr/api/gpu/assiette-sup-s?geom=${geomParam}`)
    ]);

    const indisponibles = ([['zonage', resZone], ['document', resDoc], ['prescriptions', resPrescr], ['servitudes', resSup]] as const)
      .filter(([, r]) => !r.ok)
      .map(([name]) => name as string);
    if (indisponibles.length === 4) return null; // Géoportail de l'Urbanisme injoignable

    // 1. ZONAGE (C'est ici qu'on récupère le lien URLFIC précieux)
    let zonage = null;
    let rawZone = null;
    if (resZone.ok) {
      const data = await resZone.json();
      rawZone = data;
      if (data.features && data.features.length > 0) {
        const p = data.features[0].properties;
        const interpretation = interpreterZone(p.libelle || p.typezone, p.libelong);

        // 🚨 LE FIX EST ICI : On récupère 'urlfic' directement
        const specificUrl = p.urlfic || null;
        // Si pas d'URL, on tente de récupérer le nom du fichier pour l'afficher
        const filename = !specificUrl && p.nomfic ? p.nomfic : null;

        zonage = {
          code: p.libelle || p.typezone || "INCONNU",
          libelle: p.libelong || "Zone réglementée",
          type: p.typezone || "PLU",
          conseil: interpretation.conseil,
          is_constructible: interpretation.constructible,
          url_doc: specificUrl, // <--- On stocke le lien spécifique ici
          filename_doc: filename // <--- On stocke le nom du fichier si pas de lien
        };
      }
    }

    // 2. DOCUMENT GLOBAL
    let document = null;
    let rawDoc = null;
    if (resDoc.ok) {
      const data = await resDoc.json();
      rawDoc = data;
      if (data.features?.length > 0) {
        const d = data.features[0].properties;
        // Fallback si pas d'urlfic dans le zonage, on prend le doc global
        let pdfUrl = d.urlfic;
        if (!pdfUrl && d.partition) pdfUrl = `https://www.geoportail-urbanisme.gouv.fr/document/by-partition/${d.partition}`;

        document = {
          nom: d.nom || (d.type ? `Document Urbanisme (${d.type})` : "Document d'Urbanisme"),
          id: d.partition || d.id,
          url_reglement: pdfUrl,
          etat: d.etat || "En vigueur"
        };
      }
    }

    // 3. PRESCRIPTIONS
    let contraintes: PrescriptionItem[] = [];
    let rawPrescr = null;
    if (resPrescr.ok) {
      const data = await resPrescr.json();
      rawPrescr = data;
      if (data.features) {
        const rawList = data.features.map((f: GpuFeature) => {
          const type = f.properties.typepsc;
          const info = CNIG_CODES[type ?? ""] || { titre: "Prescription Diverse", cat: "autre", desc: "Règle spécifique locale." };
          return {
            type: type,
            titre: info.titre,
            libelle: f.properties.libelle || f.properties.txt || info.titre,
            categorie: info.cat,
            description: info.desc,
            url_doc: f.properties.urlfic || null
          };
        });
        contraintes = removeDuplicates(rawList, 'libelle');
      }
    }

    // 4. SERVITUDES
    let servitudes: UrbanismeData["servitudes"] = [];
    let rawSup = null;
    if (resSup.ok) {
      const data = await resSup.json();
      rawSup = data;
      if (data.features) {
        const rawList = data.features.map((f: GpuFeature) => {
          const code = f.properties.catsup || "SUP";
          const info = interpreterSUP(code);
          return {
            code: code,
            libelle: f.properties.nomgen || f.properties.libelle,
            description: info.impact,
            url_doc: f.properties.urlfic || null
          };
        });
        servitudes = removeDuplicates(rawList, 'code');
      }
    }

    return {
      indisponibles,
      zonage,
      document,
      contraintes,
      servitudes,
      _raw: { zonage: rawZone, document: rawDoc, prescriptions: rawPrescr, servitudes: rawSup }
    };

  } catch (error) {
    console.error("❌ Erreur Urbanisme:", error);
    return null;
  }
}