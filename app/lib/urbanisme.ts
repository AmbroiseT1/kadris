// Fichier : lib/urbanisme.ts

export interface UrbanismeData {
  zonage: {
    code: string;      // "Ua", "N", "1AU"
    libelle: string;   // "Zone urbaine mixte"
    type: string;      // "PLU"
    conseil: string;   // NOTRE INTELLIGENCE AJOUTÉE
    is_constructible: boolean;
  } | null;

  document: {
    nom: string;       // "PLU de Wambrechies"
    id: string;
    url_reglement: string | null; // Le lien vers le PDF !
    etat: string;      // "En vigueur"
  } | null;

  prescriptions: Array<{
    type: string;
    libelle: string;
    categorie: string; // Pour trier (Patrimoine, Risque...)
  }>;

  servitudes: Array<{
    code: string;     // "AC1"
    libelle: string;
    description: string; // Description générique du code
  }>;
}

// --- DICTIONNAIRE D'INTELLIGENCE (Code -> Conseil) ---
function interpreterZone(code: string, libelle: string) {
  const c = code.toUpperCase();
  
  if (c.startsWith('U')) return {
    conseil: "Zone Urbaine. Terrain a priori constructible. Vérifiez le coefficient d'emprise au sol (CES) et la hauteur maximale dans le règlement.",
    constructible: true
  };
  if (c.startsWith('AU') || c.startsWith('1AU') || c.startsWith('2AU')) return {
    conseil: "Zone À Urbaniser. Constructibilité soumise à conditions (réseaux, aménagements d'ensemble). Potentiel à moyen/long terme.",
    constructible: true
  };
  if (c.startsWith('A')) return {
    conseil: "Zone Agricole. Constructibilité très stricte (liée à l'activité agricole). Extensions souvent limitées ou interdites.",
    constructible: false
  };
  if (c.startsWith('N')) return {
    conseil: "Zone Naturelle et Forestière. Inconstructible (sauf exceptions rares). Préservation stricte de l'environnement.",
    constructible: false
  };
  
  return {
    conseil: "Zone spécifique. Reportez-vous au règlement complet pour connaître les droits à bâtir.",
    constructible: true // Dans le doute
  };
}

// --- DICTIONNAIRE SERVITUDES (Code -> Explication) ---
function interpreterSUP(code: string) {
  const dict: Record<string, string> = {
    "AC1": "Protection des Monuments Historiques (ABF)",
    "AC2": "Sites Patrimoniaux Remarquables",
    "I4": "Passage de lignes électriques",
    "I3": "Canalisations Gaz/Hydrocarbures",
    "A5": "Canalisations d'eau potable",
    "PM1": "Plan de Prévention des Risques (PPR)",
    "EL7": "Alignement des voies (Recul obligatoire)"
  };
  return dict[code] || "Servitude d'utilité publique";
}

export async function fetchUrbanisme(lat: number, lon: number): Promise<UrbanismeData | null> {
  try {
    // GeoJSON Point pour l'API
    const geojson = { type: "Point", coordinates: [lon, lat] };
    const geomParam = encodeURIComponent(JSON.stringify(geojson));

    console.log("🏗️ Appel API Urbanisme (IGN GPU)...");

    const [resZone, resDoc, resPrescr, resSup] = await Promise.all([
      fetch(`https://apicarto.ign.fr/api/gpu/zone-urba?geom=${geomParam}`),
      fetch(`https://apicarto.ign.fr/api/gpu/document?geom=${geomParam}`),
      fetch(`https://apicarto.ign.fr/api/gpu/prescription-surf?geom=${geomParam}`),
      fetch(`https://apicarto.ign.fr/api/gpu/assiette-sup-s?geom=${geomParam}`)
    ]);

    // 1. ZONAGE
    let zonage = null;
    if (resZone.ok) {
      const data = await resZone.json();
      if (data.features?.length > 0) {
        const p = data.features[0].properties;
        const interpretation = interpreterZone(p.libelle || p.typezone, p.libelong);
        
        zonage = {
          code: p.libelle || p.typezone || "Zone Inconnue",
          libelle: p.libelong || "Zone réglementée",
          type: p.typezone || "PLU",
          conseil: interpretation.conseil,
          is_constructible: interpretation.constructible
        };
      }
    }

    // 2. DOCUMENT (Pour le PDF)
    let document = null;
    if (resDoc.ok) {
      const data = await resDoc.json();
      if (data.features?.length > 0) {
        const d = data.features[0].properties;
        // L'URL de téléchargement est souvent dans 'urlfic' ou on la reconstruit via le Geoportail
        // L'API renvoie parfois une url directe
        const pdfUrl = d.urlfic || `https://www.geoportail-urbanisme.gouv.fr/document/${d.id}`;
        
        document = {
          nom: d.nom || `Document d'Urbanisme (${d.type})`,
          id: d.id,
          url_reglement: pdfUrl,
          etat: d.etat || "En vigueur"
        };
      }
    }

    // 3. PRESCRIPTIONS
    const prescriptions = [];
    if (resPrescr.ok) {
      const data = await resPrescr.json();
      if (data.features) {
        prescriptions.push(...data.features.map((f: any) => ({
            type: f.properties.typepsc,
            libelle: f.properties.libelle || f.properties.txt || "Prescription surfacique",
            categorie: f.properties.nomfic ? "Détail disponible" : "Général"
        })));
      }
    }

    // 4. SERVITUDES
    const servitudes = [];
    if (resSup.ok) {
      const data = await resSup.json();
      if (data.features) {
        servitudes.push(...data.features.map((f: any) => {
            const code = f.properties.catsup || "SUP";
            return {
                code: code,
                libelle: f.properties.nomgen || f.properties.libelle,
                description: interpreterSUP(code)
            };
        }));
      }
    }

    return {
      zonage,
      document,
      prescriptions: prescriptions.slice(0, 5),
      servitudes: servitudes.slice(0, 5)
    };

  } catch (error) {
    console.error("❌ Erreur Urbanisme:", error);
    return null;
  }
}