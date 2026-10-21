import { Bricolage_Grotesque } from 'next/font/google';

/**
 * Police principale du projet (provisoire).
 * Déclarée dans ce fichier unique pour faciliter son remplacement futur.
 */
export const fontSans = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});
