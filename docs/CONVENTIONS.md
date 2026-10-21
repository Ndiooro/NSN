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

4. **Design Tokens centralisés** :
   - Les couleurs, durées et courbes d'animation sont déclarées sous forme de variables CSS dans `src/styles/tokens.css`.
   - Tailwind CSS est configuré pour consommer ces variables.
   - Le thème actif est un thème clair (`color-scheme: light`).
   - La couleur `--brand` (`#009ee0`) est décorative (traits, accents) et ne doit jamais être utilisée pour du texte courant sur fond clair (contraste WCAG insuffisant).

---

## 2. Arborescence du Projet

```text
src/
├── app/
│   └── [locale]/
│       ├── layout.tsx       # Layout bilingue (HTML, polices, NextIntlClientProvider)
│       └── page.tsx         # Page d'accueil (agrégation des sections Server Components)
├── components/
│   ├── animations/          # Composants d'animation réutilisables (un dossier par animation)
│   │   ├── Antigravity/     # Code source tiers React Bits (WebGL2 natif)
│   │   ├── BlurLines/       # Révélation progressive de lignes de texte
│   │   ├── DrawRule/        # Filet décoratif s'étirant depuis la gauche
│   │   ├── FadeIn/          # Fondu d'apparition simple
│   │   ├── HeroBackground/  # Enveloppe client sécurisée pour Antigravity
│   │   └── InView/          # Déclencheur au défilement (seuil 0.35)
│   ├── sections/
│   │   └── home/            # Une section par dossier (Hero/, puis Map/, Services/ ...)
│   │       └── Hero/
│   └── ui/                  # Composants d'interface génériques (boutons, badges, liens)
├── i18n/
│   ├── request.ts           # Configuration de chargement des messages par requête
│   └── routing.ts           # Déclaration des langues et helpers de navigation
├── lib/                     # Hooks et utilitaires génériques (ex: useInView.ts)
├── styles/
│   ├── fonts.ts             # Déclaration unique de la police (Bricolage Grotesque)
│   ├── globals.css          # Styles globaux, Tailwind v4 et règles reduced-motion
│   └── tokens.css           # Variables de design (couleurs, courbes, durées)
messages/
├── fr.json                  # Traductions françaises (namespace Home.hero.*, Home.services.*)
└── en.json                  # Traductions anglaises
reference/                   # Fichiers sources et exports fournis (exclus du build TypeScript)
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
       <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
         <FadeIn>
           <p className="text-sm text-[var(--muted)]">{eyebrow}</p>
           <h2 className="text-3xl font-semibold text-[var(--ink)] mt-2">{title}</h2>
         </FadeIn>
       </section>
     );
   }
   ```

4. **Intégrer la section dans `src/app/[locale]/page.tsx`** :
   ```tsx
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

### Comment ajouter une nouvelle animation réutilisable ?

1. Créer un sous-dossier dans `src/components/animations/NomAnimation/`.
2. Implémenter le composant avec des valeurs par défaut issues de `tokens.css`.
3. Privilégier un Server Component avec des keyframes CSS pures si l'animation se joue à l'apparition.
4. Gérer impérativement le repli pour l'accessibilité :
   ```css
   @media (prefers-reduced-motion: reduce) {
     .mon-element-anime {
       transform: none !important;
       filter: none !important;
       animation: none !important;
     }
   }
   ```
5. Documenter l'animation dans `docs/ANIMATIONS.md` (nom, rôle, props, déclencheur, mobile, reduced-motion, exemple).

---

### Comment remplacer la typographie du projet ?

La police est déclarée dans un unique fichier : `src/styles/fonts.ts`.
Pour remplacer "Bricolage Grotesque" par une autre police (ex: Helvetica Now Display fournie dans `reference/` ou une police Google Fonts) :
1. Modifier ou remplacer l'import dans `src/styles/fonts.ts`.
2. Conserver la variable exportée `variable: '--font-sans'`.
3. L'ensemble des styles et layouts du site s'adapteront immédiatement sans modification de balisage.
