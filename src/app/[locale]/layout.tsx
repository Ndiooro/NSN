import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';
import { fontSans } from '@/styles/fonts';
import '@/styles/globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const isEn = locale === 'en';
  return {
    title: isEn
      ? 'Nicomatic Senegal | Tailor-made Technology Solutions'
      : 'Nicomatic Sénégal | Solutions technologiques sur mesure',
    description: isEn
      ? 'Tailor-made technology solutions for African industry: electronics, mechanics, software.'
      : 'Solutions technologiques sur mesure pour l’industrie africaine : électronique, mécanique, informatique.',
  };
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className={fontSans.variable}>
      <body className="font-sans antialiased bg-white text-[var(--ink)]">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
