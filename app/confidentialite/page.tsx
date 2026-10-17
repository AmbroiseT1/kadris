import type { Metadata } from 'next';
import { LegalLayout, LegalSection } from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
    title: 'Politique de confidentialité | bricq',
    description: "Politique de confidentialité de bricq : données collectées, finalités, bases légales, sous-traitants (dont Google Gemini), durées de conservation et exercice de vos droits RGPD.",
};

export default function ConfidentialitePage() {
    return (
        <LegalLayout
            title="Politique de confidentialité"
            intro="Cette politique explique comment bricq collecte et traite vos données personnelles, pourquoi, pendant combien de temps, et quels sont vos droits, conformément au Règlement (UE) 2016/679 (RGPD) et à la loi n° 78-17 du 6 janvier 1978 modifiée."
        >
            <LegalSection title="1. Responsable du traitement">
                <p>
                    Le responsable du traitement est [raison sociale], [forme juridique], dont le siège social est situé à [adresse du siège social]. Contact : [email de contact].
                </p>
                <p>
                    Délégué à la protection des données (si désigné) : [email du DPO ou de la personne référente].
                </p>
            </LegalSection>

            <LegalSection title="2. Données collectées">
                <p>Selon l’usage que vous faites du service, bricq traite les catégories de données suivantes :</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong className="text-bricq-slate">Données de compte :</strong> adresse email et mot de passe. Le mot de passe n’est jamais conservé en clair : seule une empreinte cryptographique (hash) est stockée.</li>
                    <li><strong className="text-bricq-slate">Données de vos biens :</strong> adresses et identifiants cadastraux des biens que vous rattachez à votre compte, caractéristiques que vous saisissez.</li>
                    <li><strong className="text-bricq-slate">Données de travaux et de dépenses :</strong> descriptions, dates, montants et statuts des travaux, achats et dépenses que vous enregistrez.</li>
                    <li><strong className="text-bricq-slate">Documents téléversés :</strong> fichiers que vous ajoutez à votre espace (factures, diagnostics, actes, devis, etc.), ainsi que les informations extraites de ces documents lors de l’analyse.</li>
                    <li><strong className="text-bricq-slate">Données techniques :</strong> journaux de connexion et de sécurité (adresse IP, date et heure des requêtes) nécessaires à la sécurité du service et à la lutte contre les tentatives d’accès frauduleuses.</li>
                </ul>
                <p>
                    Les rapports de quartier et de bien s’appuient sur des données publiques (voir section 5). La consultation d’un rapport sans être connecté ne crée pas de compte. [À vérifier : données techniques transmises aux services de cartographie et de données publiques lors de la consultation.]
                </p>
            </LegalSection>

            <LegalSection title="3. Finalités et bases légales">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-bricq-slate/10 bg-white">
                        <thead className="bg-bricq-cream text-bricq-slate">
                            <tr>
                                <th className="text-left p-3 font-bold border-b border-bricq-slate/10">Finalité</th>
                                <th className="text-left p-3 font-bold border-b border-bricq-slate/10">Base légale</th>
                            </tr>
                        </thead>
                        <tbody className="align-top">
                            <tr>
                                <td className="p-3 border-b border-bricq-slate/10">Création et gestion de votre compte, fourniture de l’espace propriétaire</td>
                                <td className="p-3 border-b border-bricq-slate/10">Exécution du contrat (art. 6.1.b RGPD)</td>
                            </tr>
                            <tr>
                                <td className="p-3 border-b border-bricq-slate/10">Stockage de vos biens, travaux, dépenses et documents</td>
                                <td className="p-3 border-b border-bricq-slate/10">Exécution du contrat (art. 6.1.b RGPD)</td>
                            </tr>
                            <tr>
                                <td className="p-3 border-b border-bricq-slate/10">Analyse de vos documents par un service d’IA, à votre demande</td>
                                <td className="p-3 border-b border-bricq-slate/10">Votre consentement, donné au moment du lancement de l’analyse (art. 6.1.a RGPD)</td>
                            </tr>
                            <tr>
                                <td className="p-3 border-b border-bricq-slate/10">Sécurité du service, prévention des fraudes et des attaques par force brute</td>
                                <td className="p-3 border-b border-bricq-slate/10">Intérêt légitime (art. 6.1.f RGPD)</td>
                            </tr>
                            <tr>
                                <td className="p-3">Respect d’obligations légales (ex. demandes des autorités, comptabilité)</td>
                                <td className="p-3">Obligation légale (art. 6.1.c RGPD)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p>
                    bricq ne vend pas vos données et ne les utilise pas à des fins publicitaires.
                </p>
            </LegalSection>

            <LegalSection title="4. Analyse des documents par Google Gemini (sous-traitant)">
                <p>
                    Lorsque vous demandez l’analyse d’un document téléversé, son contenu est transmis à l’API Gemini de Google afin d’en extraire des informations. Google agit en qualité de <strong className="text-bricq-slate">sous-traitant</strong> de bricq, dans le cadre des conditions de service de l’API retenues par bricq. [À confirmer : entité Google contractante, par exemple Google Cloud EMEA Limited ou Google LLC, et paramètres de non-utilisation des données pour l’entraînement des modèles.]
                </p>
                <p>
                    Ce traitement peut impliquer un <strong className="text-bricq-slate">transfert de données hors de l’Union européenne</strong>, notamment vers les États-Unis. Ces transferts sont encadrés par les clauses contractuelles types de la Commission européenne et, le cas échéant, par le cadre de protection des données UE-États-Unis (EU-US Data Privacy Framework). [À vérifier et compléter selon les mécanismes effectivement en place.]
                </p>
                <p>
                    Vous pouvez choisir de ne pas téléverser de document ou de ne pas lancer l’analyse. Les documents contenant des données sensibles (par exemple des données de santé) doivent être évités ou anonymisés avant envoi.
                </p>
            </LegalSection>

            <LegalSection title="5. Sources de données publiques">
                <p>
                    Les rapports affichés par bricq sont construits à partir de jeux de données publics ou ouverts, réutilisés conformément à leurs licences :
                </p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>BDNB (Base de Données Nationale des Bâtiments) ;</li>
                    <li>DPE (diagnostics de performance énergétique) de l’ADEME ;</li>
                    <li>DVF (Demandes de valeurs foncières) de la DGFiP ;</li>
                    <li>Géorisques (risques naturels et technologiques) ;</li>
                    <li>PLU et données d’urbanisme (géoportail de l’urbanisme) ;</li>
                    <li>données de couverture ARCEP ;</li>
                    <li>données relatives à l’eau (services publics de l’eau et de l’assainissement).</li>
                </ul>
                <p>
                    Ces données concernent principalement des biens et des transactions. Lorsqu’elles peuvent se rattacher à une personne physique, bricq ne les utilise que pour produire le rapport du bien concerné, sans chercher à identifier les personnes. Si vous estimez qu’une information vous concernant doit être rectifiée ou retirée d’un rapport, contactez-nous à l’adresse indiquée en section 9.
                </p>
            </LegalSection>

            <LegalSection title="6. Durées de conservation">
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong className="text-bricq-slate">Données de compte :</strong> pendant toute la durée de votre compte, puis [durée, ex. 3 ans] après sa suppression pour la gestion des litiges, ou jusqu’à la fin des obligations légales applicables.</li>
                    <li><strong className="text-bricq-slate">Biens, travaux, dépenses et documents :</strong> jusqu’à leur suppression par vous ou jusqu’à la suppression de votre compte.</li>
                    <li><strong className="text-bricq-slate">Journaux de sécurité :</strong> [durée, ex. 12 mois] à compter de leur création.</li>
                    <li><strong className="text-bricq-slate">Demandes d’exercice de droits :</strong> [durée, ex. 3 ans] à compter de leur traitement, pour justifier de leur gestion.</li>
                </ul>
                <p>
                    À l’issue de ces durées, les données sont supprimées ou anonymisées. Les sauvegardes techniques sont purgées selon [durée de rotation des sauvegardes].
                </p>
            </LegalSection>

            <LegalSection title="7. Destinataires et hébergement">
                <p>Vos données sont accessibles uniquement aux personnes habilitées de bricq, dans la limite de leurs fonctions, ainsi qu’aux sous-traitants suivants :</p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>[hébergeur de l’application et de la base de données] : hébergement, situé en [pays et région d’hébergement] ;</li>
                    <li>Google (API Gemini) : analyse des documents à votre demande, voir section 4.</li>
                </ul>
                <p>
                    Nous exigeons de chaque sous-traitant qu’il présente des garanties suffisantes et qu’il traite les données uniquement sur nos instructions, dans le cadre d’un contrat conforme à l’article 28 du RGPD.
                </p>
            </LegalSection>

            <LegalSection title="8. Cookies et stockage local">
                <p>
                    bricq n’utilise pas de cookies publicitaires. Le service utilise le <strong className="text-bricq-slate">stockage local</strong> (localStorage) de votre navigateur pour :
                </p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>conserver le jeton de session (clé « token ») qui vous maintient connecté ;</li>
                    <li>conserver votre note personnelle dans le tableau de bord (clé « bricq_user_notes »), uniquement sur votre appareil.</li>
                </ul>
                <p>
                    Ces éléments sont strictement nécessaires au fonctionnement du service et ne nécessitent donc pas de consentement au sens de l’article 82 de la loi Informatique et Libertés. Vous pouvez les supprimer à tout moment depuis les paramètres de votre navigateur ; cela vous déconnectera. [À compléter si des outils de mesure d’audience sont ajoutés, avec recueil de consentement préalable.]
                </p>
            </LegalSection>

            <LegalSection title="9. Vos droits">
                <p>Conformément au RGPD, vous disposez des droits suivants :</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong className="text-bricq-slate">Accès</strong> (art. 15) : obtenir une copie des données vous concernant ;</li>
                    <li><strong className="text-bricq-slate">Rectification</strong> (art. 16) : corriger des données inexactes ou incomplètes ;</li>
                    <li><strong className="text-bricq-slate">Effacement</strong> (art. 17) : obtenir la suppression de vos données, dans les cas prévus par la loi ;</li>
                    <li><strong className="text-bricq-slate">Portabilité</strong> (art. 20) : recevoir vos données dans un format structuré et lisible par machine, ou les faire transmettre à un autre responsable ;</li>
                    <li><strong className="text-bricq-slate">Opposition</strong> (art. 21) : vous opposer à un traitement fondé sur l’intérêt légitime ;</li>
                    <li><strong className="text-bricq-slate">Retrait du consentement</strong> (art. 7.3) : retirer à tout moment votre consentement, notamment pour l’analyse de documents, sans remettre en cause les traitements antérieurs.</li>
                </ul>
                <p>
                    Pour exercer vos droits, écrivez à [email de contact ou du DPO] en précisant l’objet de votre demande et en joignant, si nécessaire, un justificatif d’identité. Nous vous répondrons dans un délai d’un mois, prorogeable de deux mois en cas de demande complexe.
                </p>
                <p>
                    Vous pouvez également définir des directives relatives au sort de vos données après votre décès, conformément à l’article 85 de la loi Informatique et Libertés.
                </p>
            </LegalSection>

            <LegalSection title="10. Réclamation auprès de la CNIL">
                <p>
                    Si vous estimez que le traitement de vos données ne respecte pas la réglementation, vous pouvez introduire une réclamation auprès de la Commission nationale de l’informatique et des libertés (CNIL) : 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, ou via <a href="https://www.cnil.fr/fr/plaintes" className="text-bricq-terracotta underline underline-offset-2" target="_blank" rel="noopener noreferrer">cnil.fr</a>.
                </p>
            </LegalSection>

            <LegalSection title="11. Sécurité">
                <p>
                    bricq met en œuvre des mesures techniques et organisationnelles adaptées : chiffrement des échanges, stockage des mots de passe sous forme de hash, limitation des tentatives de connexion, cloisonnement des données entre comptes et accès restreint aux personnes habilitées. Aucun système n’étant totalement exempt de risques, vous êtes invité à utiliser un mot de passe robuste et unique.
                </p>
            </LegalSection>

            <LegalSection title="12. Mise à jour">
                <p>
                    La présente politique peut être mise à jour pour tenir compte de nouveaux traitements ou de changements réglementaires. La date de dernière mise à jour est indiquée ci-dessous. En cas de modification substantielle, les utilisateurs en seront informés.
                </p>
                <p>Dernière mise à jour : [date de mise à jour].</p>
            </LegalSection>
        </LegalLayout>
    );
}
