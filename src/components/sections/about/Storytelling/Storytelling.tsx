import { getTranslations } from "next-intl/server";
import { BlurLines } from "@/components/animations/BlurLines/BlurLines";
import { DateRoller } from "@/components/animations/DateRoller/DateRoller";
import { DrawRule } from "@/components/animations/DrawRule/DrawRule";
import { FadeIn } from "@/components/animations/FadeIn/FadeIn";
import { InView } from "@/components/animations/InView/InView";
import { ScrollTimeline } from "./ScrollTimeline";
import { storytellingSteps } from "./steps";
import "./Storytelling.css";

export async function Storytelling() {
  const t = await getTranslations("About.story");
  const heroT = await getTranslations("About.hero");

  return (
    <section className="storytelling">
      <noscript>
        <style>{`
          .date-roller__strip {
            transform: translate3d(0, var(--end-offset), 0) !important;
            transition: none !important;
          }
        `}</style>
      </noscript>
      <div className="storytelling__inner">
        <header className="storytelling__header">
          <h2 className="storytelling__headline">
            <BlurLines lines={[heroT("eyebrow")]} />
          </h2>
          <FadeIn as="p" className="storytelling__subtitle">
            {heroT("title")}
          </FadeIn>
          <DrawRule align="left" className="storytelling__rule" />
        </header>
        <ScrollTimeline>
          {storytellingSteps.map((step) => {
            const Illustration = step.svg;
            const title = t(step.titleKey);

            return (
              <article
                className="story-step"
                data-step={step.id}
                data-align={step.align}
                key={step.id}
              >
                <div className="story-step__anchor-row">
                  <span
                    className="story-step__marker-slot"
                    data-placeholder={step.id}
                    aria-hidden="true"
                  />
                  <span
                    className="story-step__anchor"
                    data-anchor={step.id}
                    aria-hidden="true"
                  >
                    {step.year}
                  </span>
                </div>

                <div className="story-step__content">
                  <Illustration
                    className="story-step__illustration"
                    data-draw={step.id}
                  />
                  <h2
                    className="story-step__heading"
                    aria-label={`${step.year}: ${title}`}
                  >
                    <span className="sr-only">
                      {step.year}: {title}
                    </span>
                    <span className="story-step__date" data-date={step.id}>
                      <DateRoller from={step.from} to={step.year} />
                    </span>
                    <span className="story-step__title" aria-hidden="true">
                      {title}
                    </span>
                  </h2>
                  <InView
                    as="div"
                    className="story-step__copy-reveal"
                    threshold={0}
                    triggerOffset={0.8}
                    triggerIfAbove
                  >
                    <p className="story-step__copy">
                      {t.rich(step.descriptionKey, {
                        b: (chunks) => <strong>{chunks}</strong>,
                      })}
                    </p>
                  </InView>
                </div>
              </article>
            );
          })}
        </ScrollTimeline>
      </div>
    </section>
  );
}
