import { getTranslations } from "next-intl/server";
import { ValuesCards, type ValueCardContent } from "./ValuesCards";
import { ValuesHeading } from "./ValuesHeading";
import { values } from "./values-data";
import "./Values.css";

export async function Values() {
  const t = await getTranslations("About.values");
  const cardContents: ValueCardContent[] = values.map(({ id, number }) => ({
    id,
    number,
    title: t(`${id}.title`),
    lead: t(`${id}.lead`),
    text: t(`${id}.text`),
    toggleLabel: t("cardLabel"),
  }));

  return (
    <section className="values" id="valeurs">
      <div className="values__inner">
        <ValuesHeading title={t("sectionTitle")} />
        <ValuesCards cards={cardContents} />
      </div>
    </section>
  );
}
