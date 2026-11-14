import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { LegalList, LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Rotaract Club of Bibwewadi',
  description:
    'The terms on which members and visitors may use the Rotaract Club of Bibwewadi website and members app.',
};

export default function TermsAndConditionsPage() {
  return (
    <LegalPage title="Terms & Conditions" updated="13 November 2026">
      <p>
        These terms govern your use of the website and members app operated by Rotaract Club of Bibwewadi (&ldquo;the Club&rdquo;, &ldquo;we&rdquo;). By creating an account or continuing to
        use the app, you accept them.
      </p>

      <LegalSection heading="Who may use the app">
        <p>
          The members app is for approved members of the Rotaract Club of Bibwewadi. Accounts are
          created by application and activated after the club approves them. You must give
          accurate details, keep your password to yourself, and tell us at rotaractclubofbibwewadi@gmail.com. if you believe someone else has used your account.
        </p>
      </LegalSection>

      <LegalSection heading="What you post">
        <LegalList
          items={[
            'You keep ownership of the ideas, comments, images and other content you post.',
            'You give the club permission to store, display and share that content inside the app and within club activity, so the features you are using can work.',
            'You must have the right to post what you post, and it must not be unlawful, misleading, abusive, or someone else’s material used without permission.',
            'We may remove content or suspend an account that breaks these terms or club policy.',
          ]}
        />
      </LegalSection>

      <LegalSection heading="AI features">
        <p>
          Some features send what you write to an AI service so it can answer, summarise or
          analyse it. AI output can be wrong or incomplete; it is a suggestion, not advice, and
          you remain responsible for what you do with it. Whether your content may also be used
          to train the club&rsquo;s own future AI models is a separate, optional permission you
          control under Privacy in your profile.
        </p>
      </LegalSection>

      <LegalSection heading="Your personal information">
        <p>
          How we collect and handle your personal information is described in our{' '}
          <Link href="/privacy-policy" className="underline underline-offset-2">
            Privacy Notice
          </Link>
          , which forms part of these terms.
        </p>
      </LegalSection>

      <LegalSection heading="Availability">
        <p>
          The app is provided as it is, without a guarantee of uninterrupted service. We may
          change, suspend or withdraw features, and will give notice of material changes where we
          reasonably can.
        </p>
      </LegalSection>

      <LegalSection heading="Ending your account">
        <p>
          You may close your account at any time by writing to rotaractclubofbibwewadi@gmail.com.. We may
          close or suspend an account that breaks these terms, or when club membership ends. Some
          records are kept after closure for the periods set out in the Privacy Notice.
        </p>
      </LegalSection>

      <LegalSection heading="Liability">
        <p>
          To the extent the law allows, the club is not liable for indirect or consequential loss
          arising from your use of the app, or for content posted by other members.
        </p>
      </LegalSection>

      <LegalSection heading="Governing law">
        <p>
          These terms are governed by the laws of India, and the courts at Pune
          have exclusive jurisdiction over any dispute.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Rotaract Club of Bibwewadi, Bibwewadi Pune. Questions about these terms: rotaractclubofbibwewadi@gmail.com.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
