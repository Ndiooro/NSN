import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { AboutHero } from "@/components/sections/about/AboutHero/AboutHero";
import { Storytelling } from "@/components/sections/about/Storytelling/Storytelling";
import { Values } from "@/components/sections/about/Values/Values";
import { routing } from "@/i18n/routing";

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "About.metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <main>
      <AboutHero />
      <Storytelling />
      <Values />
    </main>
  );
}
