import { getTranslations } from "next-intl/server";
import { DateRoller } from "@/components/animations/DateRoller/DateRoller";
import { InView } from "@/components/animations/InView/InView";
import { ScrollTimeline } from "./ScrollTimeline";
import { storytellingSteps } from "./steps";
import "./Storytelling.css";

export async function Storytelling() {
  const t = await getTranslations("About.story");

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
