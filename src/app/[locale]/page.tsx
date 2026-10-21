import { setRequestLocale, getTranslations } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Hero } from '@/components/sections/home/Hero/Hero';
import { WorldMapSection } from '@/components/sections/home/WorldMap/WorldMapSection';
import { ValuesSection } from '@/components/sections/home/Values/ValuesSection';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations('Home.hero');
  const eyebrow = t('eyebrow');
  const sub = t('sub');
  const titleLines = t.raw('titleLines') as string[];

  return (
    <main>
      <Hero eyebrow={eyebrow} sub={sub} titleLines={titleLines} />
      <WorldMapSection />
      <ValuesSection />
    </main>
  );
}
