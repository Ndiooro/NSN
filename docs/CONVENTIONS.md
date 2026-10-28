# Conventions de Développement — Nicomatic Sénégal

Ce document rassemble les règles d'architecture et les conventions de développement appliquées sur la refonte du site de Nicomatic Sénégal. Tout développeur reprenant le projet doit respecter ces principes pour maintenir la cohérence, la performance et l'accessibilité du codebase.

---

## 1. Principes Fondamentaux d'Architecture

1. **Server Components par défaut** :
   - Toutes les pages et sections de page (`Hero`, `Services`, `Map`, etc.) sont des **Server Components** (sans `"use client"`).
   - `"use client"` est strictement réservé aux micro-composants nécessitant des API navigateur exclusives (ex: canvas WebGL, écouteurs d'événements spécifiques, formulaires).

2. **Animations légères et résilientes** :
   - Les animations d'entrée simples reposent sur du **CSS pur** (keyframes déclarées dans le CSS du composant + variable CSS `--i` pour les effets échelonnés).
   - Elles s'exécutent immédiatement dès la réception du HTML/CSS, avant l'hydratation et même si JavaScript est désactivé.
   - Les animations au défilement (scroll) s'appuient uniquement sur le hook/composant `InView` réutilisable (`IntersectionObserver`, seuil `0.35`, déclenchement unique).
   - **Règle GPU stricte** : seules les propriétés `opacity`, `transform` et `filter` peuvent être animées. Ne jamais animer `width`, `height`, `top`, `bottom`, `left`, `right` ou `margin`.

3. **Internationalisation (i18n) sans compromis** :
   - Aucun texte en dur dans les composants.
   - Tous les textes sont stockés dans `messages/fr.json` et `messages/en.json`.
   - Les routes sont bilingues (`/fr` et `/en`), avec redirection automatique vers `/fr` par défaut.
   - Toujours employer l'apostrophe typographique (`’`) dans les chaînes françaises et anglaises.

4. **Intégration de composants communautaires** :
   - Intégrer un composant de la communauté (21st.dev) : copier, recolorer, auditer l'accessibilité et la performance.

5. **Design Tokens & Nuances Officielles (reference/colors.png)** :
   - Les couleurs, durées et courbes d'animation sont déclarées sous forme de variables CSS dans `src/styles/tokens.css`.
   - **Premier bleu (original)** : `--brand: #009ee0` (décoratif, traits, badges).
   - **Tints de bleu** : `--brand-tint-90` (`#19a8e3`) jusqu'à `--brand-tint-10` (`#e5f5fc`).
   - **Shades de bleu** : `--brand-shade-100` (`#008eca`) jusqu'à `--brand-shade-900` (`#001016`).
   - **Neutres** : `--neutral-dark` (`#4b4d4f`), `--neutral-mid` (`#b1b5b9`), `--neutral-light` (`#dddfdf`), `--neutral-subtle` (`#f8f9fa`).
   - **Fond** : Totalement blanc (`#ffffff`).
   - **Typographie de base** : Helvetica Now Display (fichiers `.woff2` dans `src/styles/fonts/`, déclarés dans `src/styles/fonts.ts`).

---

## 2. Arborescence du Projet

```text
src/
├── app/
│   └── [locale]/
│       ├── layout.tsx       # Layout bilingue (HTML, Helvetica Now Display, NextIntlClientProvider)
│       └── page.tsx         # Page d'accueil (agrégation des sections Server Components)
├── components/
│   ├── animations/          # Composants d'animation réutilisables (un dossier par animation)
│   │   ├── Antigravity/     # Code source tiers React Bits (WebGL2 natif)
│   │   ├── BlurLines/       # Révélation progressive de lignes de texte (centré)
│   │   ├── DrawRule/        # Filet décoratif étirable centré ou aligné à gauche
│   │   ├── FadeIn/          # Fondu d'apparition simple
│   │   ├── HeroBackground/  # Enveloppe client sécurisée pour Antigravity sur fond blanc
│   │   └── InView/          # Déclencheur au défilement (seuil 0.35)
│   ├── sections/
│   │   └── home/            # Une section par dossier (Hero/, puis Map/, Services/ ...)
│   │       └── Hero/        # Section d'accueil centrée sur fond blanc
│   └── ui/                  # Composants d'interface génériques (boutons, badges, liens)
├── i18n/
│   ├── request.ts           # Configuration de chargement des messages par requête
│   └── routing.ts           # Déclaration des langues et helpers de navigation
├── lib/                     # Hooks et utilitaires génériques (ex: useInView.ts)
├── styles/
│   ├── fonts/               # Polices woff2 (Helvetica Now Display)
│   ├── fonts.ts             # Déclaration unique localFont (Helvetica Now Display)
│   ├── globals.css          # Styles globaux, fond blanc et règles reduced-motion
│   └── tokens.css           # Palette complète officielle (bleus, neutres, mouvement)
messages/
├── fr.json                  # Traductions françaises (namespace Home.hero.*, Home.services.*)
└── en.json                  # Traductions anglaises
reference/                   # Fichiers sources et exports fournis (colors.png, exports)
docs/
├── ANIMATIONS.md            # Spécifications détaillées de chaque composant d'animation
└── CONVENTIONS.md           # Ce guide d'architecture et conventions
```

---

## 3. Guide Pratique pour Étendre le Projet

### Comment ajouter une nouvelle section ? (ex: `Services`)

1. **Ajouter les traductions** dans `messages/fr.json` et `messages/en.json` :
   ```json
   // messages/fr.json
   {
     "Home": {
       "services": {
         "eyebrow": "Nos Domaines d’Expertise",
         "title": "Ingénierie électronique, mécanique et logicielle"
       }
     }
   }
   ```

2. **Créer le dossier de section** `src/components/sections/home/Services/` :
   - `Services.tsx` : Server Component acceptant des props de contenu.
   - `Services.css` : Styles de mise en page spécifiques de la section si nécessaire.

3. **Exemple d'implémentation** :
   ```tsx
   // src/components/sections/home/Services/Services.tsx
   import React from 'react';
   import { getTranslations } from 'next-intl/server';
   import { FadeIn } from '@/components/animations/FadeIn/FadeIn';

   export interface ServicesProps {
     eyebrow?: string;
     title?: string;
   }

   export async function Services({ eyebrow: propEyebrow, title: propTitle }: ServicesProps) {
     const t = await getTranslations('Home.services');
     const eyebrow = propEyebrow ?? t('eyebrow');
     const title = propTitle ?? t('title');

     return (
       <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto text-center">
         <FadeIn>
           <p className="text-sm text-[var(--muted)]">{eyebrow}</p>
           <h2 className="text-3xl font-bold text-[var(--ink)] mt-2">{title}</h2>
         </FadeIn>
       </section>
     );
   }
   ```

4. **Intégrer la section dans `src/app/[locale]/page.tsx`** :
   ```tsx
   import { Hero } from '@/components/sections/home/Hero/Hero';
   import { Services } from '@/components/sections/home/Services/Services';

   export default async function HomePage() {
     return (
       <main>
         <Hero />
         <Services />
       </main>
     );
   }
   ```

---

### Comment utiliser la palette officielle de couleurs ?

Toutes les nuances de `reference/colors.png` sont directement accessibles en variables CSS :
- Bleu original : `var(--brand)` (`#009ee0`)
- Tints de bleu (clair vers très clair) : `var(--brand-tint-90)` à `var(--brand-tint-10)`
- Shades de bleu (sombre vers nuit) : `var(--brand-shade-100)` à `var(--brand-shade-900)`
- Neutres : `var(--neutral-dark)`, `var(--neutral-mid)`, `var(--neutral-light)`, `var(--neutral-subtle)`, `var(--neutral-white)`
