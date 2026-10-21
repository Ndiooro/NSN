# Nicomatic Sénégal — Refonte du Site Web

Plateforme web de Nicomatic Sénégal, entreprise d'ingénierie de pointe spécialisée dans les solutions électroniques, mécaniques et informatiques adaptées aux exigences de l'industrie africaine.

Cette première phase livre l'architecture de base, la configuration bilingue (FR/EN) et la section d'accueil (Hero) avec fond interactif de particules WebGL2.

---

## Stack Technique

- **Framework** : [Next.js](https://nextjs.org/) (App Router, React 19)
- **Langage** : [TypeScript](https://www.typescriptlang.org/) (mode strict)
- **Styles** : [Tailwind CSS v4](https://tailwindcss.com/) & Variables CSS natives (`tokens.css`)
- **Internationalisation** : [next-intl](https://next-intl-docs.vercel.app/) (routes `/fr` et `/en`, FR par défaut)
- **Typographie** : Bricolage Grotesque via `next/font` (isolée dans `src/styles/fonts.ts`)
- **Animations** : CSS pur pour la typographie + WebGL2 natif sans dépendance externe pour les particules (`Antigravity`)
- **Icônes** : [lucide-react](https://lucide.dev/) (installé pour les sections suivantes)
- **Qualité de code** : ESLint 9 & Prettier

---

## Installation & Démarrage

### Prérequis
- Node.js >= 20 (testé sous Node v24)
- npm >= 10

### Commandes
```bash
# Installation des dépendances
npm install

# Démarrage du serveur de développement (http://localhost:3000)
npm run dev

# Vérification du typage TypeScript
npx tsc --noEmit

# Analyse ESLint
npm run lint

# Compilation pour la production
npm run build

# Démarrage du serveur de production
npm start
```

---

## Structure du Codebase

```text
src/
├── app/
│   └── [locale]/
│       ├── layout.tsx         # Layout racine bilingue avec police et métadonnées
│       └── page.tsx           # Page d'accueil assemblant les Server Components
├── components/
│   ├── animations/            # Composants d'animation autonomes
│   │   ├── Antigravity/       # Moteur WebGL2 de particules (React Bits)
│   │   ├── BlurLines/         # Typographie animée ligne par ligne (CSS pur)
│   │   ├── DrawRule/          # Filet séparateur étirable (CSS pur)
│   │   ├── FadeIn/            # Fondu d'apparition universel
│   │   ├── HeroBackground/    # Enveloppe client avec repli statique et lazy-loading
│   │   └── InView/            # Hook et wrapper d'observation au scroll
│   ├── sections/
│   │   └── home/
│   │       └── Hero/          # Section Hero (Server Component)
│   └── ui/                    # Composants atomiques réutilisables
├── i18n/
│   ├── request.ts             # Résolution des messages par locale
│   └── routing.ts             # Configuration des langues supportées
├── lib/                       # Utilitaires et hooks personnalisés (useInView)
└── styles/
    ├── fonts.ts               # Déclaration unique de la police de caractères
    ├── globals.css            # Import Tailwind, tokens et styles d'accessibilité
    └── tokens.css             # Palette de couleurs, courbes et durées
messages/
├── fr.json                    # Textes français (namespace Home.hero.*)
└── en.json                    # Textes anglais
reference/                     # Sources et spécifications d'origine (exclus du build)
docs/
├── ANIMATIONS.md              # Spécifications détaillées des animations
└── CONVENTIONS.md             # Guide d'architecture pour les développeurs suivants
```

---

## Routes & Langues

- `/fr` : Version française (langue par défaut). Accéder à `/` redirige automatiquement vers `/fr`.
- `/en` : Version anglaise.

Tous les libellés proviennent strictement des fichiers `messages/fr.json` et `messages/en.json`.

---

## Documentation Complémentaire

- Consultez [`docs/ANIMATIONS.md`](docs/ANIMATIONS.md) pour les détails sur les props des animations, les seuils mobiles et le repli statique.
- Consultez [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) pour le guide d'ajout d'une nouvelle section ou d'une nouvelle traduction.
