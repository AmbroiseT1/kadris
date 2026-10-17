import type { Metadata } from 'next';
import { LegalLayout, LegalSection } from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
    title: 'Mentions légales | bricq',
    description: "Mentions légales du site bricq : éditeur, directeur de publication, hébergement et contact.",
};

export default function MentionsLegalesPage() {
    return (
        <LegalLayout
            title="Mentions légales"
            intro="Conformément aux articles 6 III et 19 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN), voici les informations relatives à l'éditeur et à l'hébergement du site."
        >
            <LegalSection title="1. Éditeur du site">
                <p>Le site bricq est édité par :</p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Raison sociale : [raison sociale]</li>
                    <li>Forme juridique : [forme juridique, ex. SAS, SARL, entreprise individuelle]</li>
                    <li>Capital social : [montant du capital, le cas échéant]</li>
                    <li>Numéro SIREN : [numéro SIREN] - RCS [ville d'immatriculation]</li>
                    <li>Numéro de TVA intracommunautaire : [numéro de TVA, le cas échéant]</li>
                    <li>Siège social : [adresse complète du siège social]</li>
                    <li>Email de contact : [email de contact]</li>
                    <li>Téléphone : [numéro de téléphone, facultatif]</li>
                </ul>
            </LegalSection>

            <LegalSection title="2. Directeur de la publication">
                <p>Le directeur de la publication est [nom et prénom du directeur de publication], en qualité de [fonction, ex. président].</p>
            </LegalSection>

            <LegalSection title="3. Hébergement">
                <p>Le site et les services sont hébergés par :</p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Hébergeur : [nom de l'hébergeur]</li>
                    <li>Adresse : [adresse de l'hébergeur]</li>
                    <li>Téléphone ou site web : [coordonnées de l'hébergeur]</li>
                </ul>
            </LegalSection>

            <LegalSection title="4. Propriété intellectuelle">
                <p>
                    L'ensemble des éléments du site (textes, graphismes, logo, interface, code source, mise en forme des rapports) est protégé par le droit de la propriété intellectuelle. Toute reproduction, représentation ou adaptation, totale ou partielle, sans autorisation écrite préalable de l'éditeur est interdite.
                </p>
                <p>
                    Les données publiques affichées dans les rapports proviennent de sources ouvertes (voir la section dédiée de la <a href="/confidentialite" className="text-bricq-terracotta underline underline-offset-2">politique de confidentialité</a>) et sont réutilisées dans les conditions de leurs licences respectives, notamment la Licence Ouverte d'Etalab lorsqu'elle s'applique.
                </p>
            </LegalSection>

            <LegalSection title="5. Données personnelles">
                <p>
                    Les modalités de collecte et de traitement des données personnelles, ainsi que l'exercice de vos droits, sont décrits dans la <a href="/confidentialite" className="text-bricq-terracotta underline underline-offset-2">politique de confidentialité</a>.
                </p>
            </LegalSection>

            <LegalSection title="6. Cookies et stockage local">
                <p>
                    Le site utilise le stockage local de votre navigateur (localStorage) pour conserver votre session de connexion et une note personnelle, et ne dépose pas de cookies publicitaires. [À vérifier avant publication : aucun outil de mesure d'audience ou traceur tiers n'est ajouté.] Plus de détails sont disponibles dans la politique de confidentialité.
                </p>
            </LegalSection>

            <LegalSection title="7. Limitation de responsabilité">
                <p>
                    L'éditeur s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées. Les rapports reposent sur des données publiques tierces et sont fournis à titre informatif, comme précisé dans les <a href="/cgu" className="text-bricq-terracotta underline underline-offset-2">conditions générales d'utilisation</a>.
                </p>
            </LegalSection>

            <LegalSection title="8. Droit applicable">
                <p>Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.</p>
            </LegalSection>
        </LegalLayout>
    );
}
