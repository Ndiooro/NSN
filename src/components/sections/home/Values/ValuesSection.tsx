import { getTranslations } from 'next-intl/server';
import { ValuesAnimation } from './ValuesAnimation';
import './ValuesSection.css';

export async function ValuesSection() {
  const t = await getTranslations('Home.values');

  return (
    <section className="values-section">
      <p className="values-eyebrow">{t('eyebrow')}</p>
      <ValuesAnimation
        statement={t('statement')}
        descriptions={[t('innovate'), t('create'), t('transform')]}
        paragraph={t('paragraph')}
      />
    </section>
  );
}

export default ValuesSection;
