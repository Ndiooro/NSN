import { getTranslations } from 'next-intl/server';
import Script from 'next/script';
import { AuroraBackground } from '@/components/animations/AuroraBackground/AuroraBackground';
import { FadeIn } from '@/components/animations/FadeIn/FadeIn';
import { ParticleTitle } from '@/components/animations/ParticleTitle/ParticleTitle';
import './AboutHero.css';

export async function AboutHero() {
  const t = await getTranslations('About.hero');

  return (
    <section className="about-hero">
      <Script
        src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"
        type="module"
        strategy="afterInteractive"
      />
      <AuroraBackground />
      <div className="about-hero__content">
        <div className="about-hero__veil" aria-hidden="true" />
        <FadeIn
          as="p"
          className="about-hero__eyebrow"
          delay={200}
          duration={600}
        >
          {t('eyebrow')}
        </FadeIn>
        <ParticleTitle text={t('title')} />
      </div>
      <ion-icon
        className="about-hero__scroll-hint"
        name="arrow-down-outline"
        aria-hidden="true"
      />
    </section>
  );
}

export default AboutHero;
