import type { Metadata } from 'next';
import LegalPage, { LegalList, LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Notice | Rotaract Club of Bibwewadi',
  description:
    'How the Rotaract Club of Bibwewadi collects, uses and protects personal information on its website and members app.',
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Notice" updated="13 November 2026">
      <p>
        This notice explains what personal information Rotaract Club of Bibwewadi (&ldquo;the
        Club&rdquo;, &ldquo;we&rdquo;) collects through its website and members app, why we
        collect it, and the choices you have. It is written for the Digital Personal Data
        Protection Act, 2023.
      </p>

      <LegalSection heading="What we collect">
        <LegalList
          items={[
            'Account details: your name, username, email address, contact number and password (stored only as a one-way hash).',
            'Profile details you choose to add: date of birth, college or course, profession, business, interests and a photo.',
            'What you post in the app: ideas, comments, votes, referrals, event registrations and any AI conversations you have inside the app.',
            'Technical data needed to run the service: push notification subscriptions for the device you install the app on, and ordinary server logs.',
          ]}
        />
      </LegalSection>

      <LegalSection heading="Why we collect your email address and contact number">
        <p>
          Your email address identifies your account, lets you reset your password and receives
          service messages about the club. Your contact number lets the club and, where you have
          allowed it in your directory settings, other members reach you about club activity,
          referrals and events. Neither is sold, and neither is used for advertising.
        </p>
      </LegalSection>

      <LegalSection heading="Why we store your ideas and conversations">
        <p>
          Ideas, comments and AI conversations are stored so the app can show them back to you
          and to other members, keep your history available across devices, and let the club run
          the programmes built on them. Without this storage, the features you are using cannot
          work, which is why this consent is required to use the app.
        </p>
      </LegalSection>

      <LegalSection heading="How AI processing works">
        <p>
          When you ask the app to analyse or respond to something, your text is sent to an AI
          service provider ([TBD]) which generates a response and returns it. This
          is called inference: the provider processes your text to answer you at that moment. The
          response and your message are then stored in your account the same way any other post
          is.
        </p>
      </LegalSection>

      <LegalSection heading="Inference is not model training">
        <p>
          Using AI to answer you (inference) is separate from using your content to train an AI
          model. The club does not train its own AI models today, and intends to in the future.
          Your ideas, prompts and conversations will only be included in such training if you
          have given the separate, optional training permission and have not withdrawn it.
        </p>
        <p>
          Declining or withdrawing that permission changes nothing else: you can still post
          ideas, have them analysed by AI, keep your conversation history and use every feature
          of the app.
        </p>
      </LegalSection>

      <LegalSection heading="Withdrawing your consent">
        <LegalList
          items={[
            'The optional AI-training permission can be turned on or off at any time under Privacy in your app profile. Withdrawal applies from the moment you make it.',
            'The required consent cannot be withdrawn while you keep using the app, because the app cannot run without storing your account and posts. Withdrawing it means closing your account: write to the contact below and we will delete it.',
            'Every decision you make is recorded with its date, so we can show what was agreed and when.',
          ]}
        />
      </LegalSection>

      <LegalSection heading="How long we keep it">
        <p>
          Account and profile data is kept while you are a member and for 1 year
          after your account is closed, unless a law requires us to keep it longer. Ideas,
          comments and conversations are kept for 1 year. Consent records are kept
          for 1 year as proof of what was agreed. On deletion, your personal data is
          removed from our live systems and from backups within 1 year.
        </p>
      </LegalSection>

      <LegalSection heading="Who else processes your data">
        <LegalList
          items={[
            'Supabase — database, authentication records and file storage.',
            'Vercel — hosting of the website, the app and its APIs.',
            'Resend — sending service emails such as password resets.',
            'Your browser or device vendor — delivering push notifications you have enabled.',
            '[AI PROVIDER NAME] — generating AI responses to the content you submit.',
          ]}
        />
        <p>
          These providers process your data on our instructions. Some of them store data outside
          India; where they do, the transfer is made on the terms their service agreements
          provide.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>
          You may ask us for a copy of the personal data we hold about you, ask us to correct or
          complete it, ask us to erase it, nominate someone to exercise your rights if you cannot,
          and raise a grievance about how we handle it. We answer requests within 1 week of receiving them.
        </p>
      </LegalSection>

      <LegalSection heading="Grievances and contact">
        <p>
          Write to our Data Protection point of contact, our DEI, at
          rotaractclubofbibwewadi@gmail.com. If you are not satisfied with our
          answer, you may complain to the Data Protection Board of India.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to this notice">
        <p>
          If the purposes described here materially change, we will publish the updated notice
          and ask you for fresh consent in the app before continuing.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
