import { getTranslations } from 'next-intl/server';
import { AuroraBackground } from '@/components/animations/AuroraBackground/AuroraBackground';
import { DrawRule } from '@/components/animations/DrawRule/DrawRule';
import { FadeIn } from '@/components/animations/FadeIn/FadeIn';
import { ParticleTitle } from '@/components/animations/ParticleTitle/ParticleTitle';
import './AboutHero.css';

export async function AboutHero() {
  const t = await getTranslations('About.hero');

  return (
    <section className="about-hero">
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
    </section>
  );
}

export default AboutHero;
