import type { Metadata } from 'next';
import { LegalLayout, LegalSection } from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
    title: "Conditions générales d'utilisation | bricq",
    description: "Conditions générales d'utilisation de bricq : description du service, compte utilisateur, contenus, limites de responsabilité et droit applicable.",
};

export default function CguPage() {
    return (
        <LegalLayout
            title="Conditions générales d'utilisation"
            intro="Les présentes conditions régissent l'accès et l'utilisation du site et des services bricq. En créant un compte ou en utilisant le service, vous les acceptez."
        >
            <LegalSection title="1. Objet et acceptation">
                <p>
                    Les présentes conditions générales d'utilisation (ci-après « CGU ») définissent les modalités d'accès et d'utilisation du service bricq, édité par [raison sociale] (ci-après « l'Éditeur »). Elles sont accessibles à tout moment depuis le site.
                </p>
                <p>
                    L'utilisation du service implique l'acceptation pleine et entière des CGU. Si vous n'acceptez pas ces conditions, vous devez cesser d'utiliser le service.
                </p>
            </LegalSection>

            <LegalSection title="2. Description du service">
                <p>bricq est une plateforme d'information immobilière qui :</p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>agrège des données publiques (notamment BDNB, DPE de l'ADEME, DVF, Géorisques, PLU, ARCEP et données sur l'eau) pour produire, pour une adresse donnée, un rapport de synthèse ;</li>
                    <li>propose à chaque utilisateur propriétaire un espace personnel permettant de répertorier ses biens, ses travaux, ses dépenses et ses documents ;</li>
                    <li>analyse, à la demande de l'utilisateur, les documents qu'il téléverse, à l'aide d'un service d'intelligence artificielle tiers (voir la politique de confidentialité).</li>
                </ul>
                <p>
                    Le service est proposé gratuitement, sous réserve de l'évolution future de son offre, dont l'Éditeur informera les utilisateurs. [À compléter si une offre payante est prévue.]
                </p>
            </LegalSection>

            <LegalSection title="3. Nature des informations fournies">
                <p>
                    <strong className="text-bricq-slate">Les rapports bricq sont fournis à titre purement informatif.</strong> Ils ne constituent ni un diagnostic technique immobilier (DTI, DPE réglementaire, état des risques et pollutions, état parasitaire, etc.), ni une expertise, ni un conseil juridique, fiscal, financier ou de négociation, ni une estimation de valeur ayant une valeur d'expertise.
                </p>
                <p>
                    Les données affichées proviennent de bases publiques tierces dont l'Éditeur ne maîtrise ni l'exactitude, ni l'exhaustivité, ni les délais de mise à jour. L'Éditeur ne garantit donc pas l'exactitude, la complétude ou l'actualité de ces données, et l'absence d'une information dans un rapport ne signifie pas l'absence de risque ou de désordre.
                </p>
                <p>
                    Les analyses produites à partir de documents téléversés par l'utilisateur sont automatisées et peuvent contenir des erreurs. Elles doivent être vérifiées par l'utilisateur. Avant toute décision d'achat, de vente, de travaux ou de financement, il est recommandé de faire appel à un professionnel qualifié (diagnostiqueur, notaire, expert, architecte, avocat).
                </p>
            </LegalSection>

            <LegalSection title="4. Création et gestion du compte">
                <p>
                    L'accès à l'espace propriétaire nécessite la création d'un compte. Vous vous engagez à fournir des informations exactes, à maintenir la confidentialité de vos identifiants et à signaler sans délai tout usage non autorisé de votre compte.
                </p>
                <p>
                    Vous pouvez supprimer votre compte à tout moment depuis votre espace ou en contactant l'Éditeur à l'adresse [email de contact]. La suppression entraîne l'effacement de vos données dans les conditions décrites dans la politique de confidentialité.
                </p>
                <p>
                    L'Éditeur se réserve le droit de suspendre ou de supprimer un compte en cas de non-respect des CGU, après en avoir informé l'utilisateur lorsque cela est possible.
                </p>
            </LegalSection>

            <LegalSection title="5. Contenus fournis par l'utilisateur">
                <p>
                    L'utilisateur reste propriétaire des documents, données et informations qu'il ajoute à son espace (titres de propriété, factures, diagnostics, devis, etc.). Il déclare disposer des droits nécessaires sur ces contenus et qu'ils ne portent pas atteinte aux droits de tiers.
                </p>
                <p>
                    L'utilisateur s'engage à ne pas téléverser de contenus illicites, de logiciels malveillants, ni de documents qui ne le concernent pas sans l'accord des personnes concernées. Il est seul responsable de la véracité des informations qu'il saisit.
                </p>
                <p>
                    Il accorde à l'Éditeur le droit de traiter ces contenus dans la seule finalité de fournir le service (stockage et analyse à sa demande), sans les exploiter à d'autres fins commerciales.
                </p>
            </LegalSection>

            <LegalSection title="6. Obligations de l'utilisateur">
                <p>L'utilisateur s'engage notamment à :</p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>utiliser le service conformément à sa destination et à la loi ;</li>
                    <li>ne pas tenter de contourner les mesures de sécurité, de limiter l'accès au service ou d'extraire massivement les données (scraping) ;</li>
                    <li>ne pas utiliser le service pour porter atteinte à la vie privée ou à la réputation de tiers.</li>
                </ul>
            </LegalSection>

            <LegalSection title="7. Disponibilité du service">
                <p>
                    L'Éditeur met en œuvre des moyens raisonnables pour assurer l'accès au service, sans garantie d'accessibilité permanente. Le service peut être interrompu pour maintenance, mise à jour ou pour des raisons techniques ou de force majeure. Certaines fonctions dépendent de services tiers (sources de données publiques, service d'analyse) dont la disponibilité échappe à l'Éditeur.
                </p>
            </LegalSection>

            <LegalSection title="8. Responsabilité">
                <p>
                    Dans les limites permises par la loi, l'Éditeur ne saurait être tenu responsable des dommages directs ou indirects résultant :
                </p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>de l'inexactitude, de l'incomplétude ou de l'obsolescence des données publiques tierces ;</li>
                    <li>des erreurs ou omissions dans les analyses automatisées de documents ;</li>
                    <li>d'une décision prise sur la seule base d'un rapport bricq ;</li>
                    <li>de l'indisponibilité temporaire du service ou de la perte de données résultant d'un fait qui ne lui est pas imputable ;</li>
                    <li>d'une utilisation non conforme aux présentes CGU.</li>
                </ul>
                <p>
                    Pour les utilisateurs professionnels, la responsabilité totale de l'Éditeur est limitée au montant des sommes effectivement versées par l'utilisateur au cours des douze derniers mois, ou, à défaut, à [montant forfaitaire, ex. 100 €]. Ces limites ne s'appliquent pas en cas de faute lourde ou dolosive, ni dans les cas où la loi les interdit (notamment pour les consommateurs, la responsabilité de l'Éditeur demeure régie par le droit applicable).
                </p>
            </LegalSection>

            <LegalSection title="9. Propriété intellectuelle">
                <p>
                    Le service, sa marque, son logo, son interface et son code sont protégés. L'utilisateur bénéficie d'un droit d'usage personnel, non exclusif et non cessible, pendant la durée de son compte. Toute autre utilisation est soumise à l'autorisation préalable de l'Éditeur.
                </p>
            </LegalSection>

            <LegalSection title="10. Modification des CGU">
                <p>
                    L'Éditeur peut modifier les CGU à tout moment. Les utilisateurs sont informés de toute modification substantielle. La poursuite de l'utilisation du service après publication des nouvelles conditions vaut acceptation de celles-ci.
                </p>
            </LegalSection>

            <LegalSection title="11. Droit applicable et litiges">
                <p>
                    Les présentes CGU sont soumises au droit français. En cas de litige, l'utilisateur peut d'abord adresser une réclamation à l'Éditeur à l'adresse [email de contact]. À défaut de résolution amiable, et sans préjudice des droits du consommateur, les tribunaux compétents sont ceux du ressort du siège social de l'Éditeur. Le consommateur peut également recourir à un médiateur de la consommation : [coordonnées du médiateur, le cas échéant].
                </p>
            </LegalSection>
        </LegalLayout>
    );
}
