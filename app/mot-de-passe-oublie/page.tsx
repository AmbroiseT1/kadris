import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout, LegalSection } from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
    title: 'Mot de passe oublié | bricq',
    description: "La réinitialisation du mot de passe bricq n'est pas encore disponible en ligne. Contactez le support pour récupérer l'accès à votre compte.",
};

export default function MotDePasseOubliePage() {
    return (
        <LegalLayout
            title="Mot de passe oublié"
            intro="La réinitialisation du mot de passe en ligne n'est pas encore disponible. Pour récupérer l'accès à votre compte, contactez notre support."
        >
            <LegalSection title="Comment récupérer mon accès ?">
                <p>
                    Envoyez un email à l’adresse suivante en indiquant l’adresse email associée à votre compte bricq :
                </p>
                <p className="font-mono text-bricq-slate">[email de support]</p>
                <p>
                    Pour protéger vos données, nous pourrons vous demander une vérification de votre identité avant toute modification de votre accès. Nous vous répondons dans les meilleurs délais.
                </p>
            </LegalSection>

            <LegalSection title="Conseils">
                <ul className="list-disc pl-6 space-y-1">
                    <li>Vérifiez l’orthographe de votre adresse email ainsi que la saisie de votre mot de passe (majuscules et verrouillage du pavé numérique).</li>
                    <li>Ne communiquez jamais votre mot de passe par email ou par téléphone, y compris à nos équipes.</li>
                </ul>
            </LegalSection>

            <p>
                <Link href="/login" className="font-bold text-bricq-terracotta hover:text-bricq-terracotta/80 transition-colors">
                    ← Retour à la connexion
                </Link>
            </p>
        </LegalLayout>
    );
}
