import localFont from 'next/font/local';

/**
 * Police principale du projet : Helvetica Now Display
 * Chargée localement depuis les fichiers woff2 du projet.
 * Déclarée dans ce fichier unique pour faciliter son utilisation globale.
 */
export const fontSans = localFont({
  src: [
    {
      path: './fonts/HelveticaNowDisplay-Thin.woff2',
      weight: '100',
      style: 'normal',
    },
    {
      path: './fonts/HelveticaNowDisplay-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: './fonts/HelveticaNowDisplay-LightIta.woff2',
      weight: '300',
      style: 'italic',
    },
    {
      path: './fonts/HelveticaNowDisplay-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/HelveticaNowDisplay-RegIta.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: './fonts/HelveticaNowDisplay-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: './fonts/HelveticaNowDisplay-MedIta.woff2',
      weight: '500',
      style: 'italic',
    },
    {
      path: './fonts/HelveticaNowDisplay-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: './fonts/HelveticaNowDisplay-BoldIta.woff2',
      weight: '700',
      style: 'italic',
    },
    {
      path: './fonts/HelveticaNowDisplay-ExtraBold.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: './fonts/HelveticaNowDisplay-Black.woff2',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-sans',
  display: 'swap',
});
