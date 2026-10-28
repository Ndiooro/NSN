# Documentation des Animations — Nicomatic Sénégal

Ce document détaille toutes les animations réutilisables du projet, leurs caractéristiques techniques, leurs déclencheurs, leurs comportements sur mobile et sous préférence d'accessibilité (`prefers-reduced-motion`).

---

## 1. Vue d'ensemble des principes d'animation

- **Zéro dépendance lourde** : Les animations de texte et de structure reposent exclusivement sur du CSS natif et fonctionnent immédiatement avant même l'hydratation JavaScript.
- **Performances GPU strictes** : Seules les propriétés compositées (`opacity`, `transform`, `filter`) sont animées. Jamais `width`, `height`, `top` ou `left`.
- **Palette officielle (reference/colors.png)** : Les couleurs de marque et leurs déclinaisons proviennent directement de la charte graphique :
  - **Bleu original** : `--brand: #009ee0` (premier bleu de la charte)
  - **Tints (éclaircissements de 90% à 10%)** : `--brand-tint-90` (`#19a8e3`) à `--brand-tint-10` (`#e5f5fc`)
  - **Shades (assombrissements)** : `--brand-shade-100` (`#008eca`) à `--brand-shade-900` (`#001016`)
  - **Neutres** : `--neutral-dark` (`#4b4d4f`), `--neutral-mid` (`#b1b5b9`), `--neutral-white` (`#ffffff`)
- **Tokens de mouvement centralisés** :
  - Courbe par défaut : `--ease: cubic-bezier(0.22, 1, 0.36, 1)`
  - Durées : `--dur-fast: 400ms`, `--dur-base: 600ms`, `--dur-slow: 1100ms`
- **Accessibilité universelle** : Sous `prefers-reduced-motion: reduce`, aucun effet de flou, de déplacement ou de boucle n'est joué ; les éléments sont immédiatement nets et visibles, avec un simple fondu universel de 0,6 s au maximum.

---

## 2. BlurLines

- **Fichier** : `src/components/animations/BlurLines/BlurLines.tsx` & `BlurLines.css`
- **Type** : Server Component (CSS pur, zéro JavaScript requis)
- **Rôle** : Révèle un titre ou un paragraphe ligne par ligne avec un effet progressif passant d'un flou léger avec espacement étendu vers un texte net et condensé. Supporte le centrage du texte.
- **Déclencheur** : Immédiat au chargement de la page (HTML/CSS initial).
- **Accessibilité** : Insère un séparateur sémantique `<span className="sr-only"> </span>` entre chaque ligne pour garantir qu'une phrase complète et fluide soit énoncée par les lecteurs d'écran.

### Props

| Prop        | Type       | Défaut              | Description                                                                      |
| :---------- | :--------- | :------------------ | :------------------------------------------------------------------------------- |
| `lines`     | `string[]` | _Requis_            | Tableau des lignes de texte à afficher                                           |
| `staggerMs` | `number`   | `140`               | Décalage en ms entre le départ de chaque ligne consécutive via la variable `--i` |
| `duration`  | `string`   | `'var(--dur-slow)'` | Durée de l'animation de chaque ligne (1100 ms)                                   |
| `className` | `string`   | `''`                | Classes CSS additionnelles (ex: `text-center`)                                   |

### Comportement mobile

- Identique au desktop, s'adapte automatiquement à la taille de police fluide (`clamp`).

### Comportement reduced-motion

- Désactive immédiatement le flou (`filter: none !important`), l'opacité est forcée à 1 et le crénelage à `-0.02em`. Aucun retard ni flou perçu.

### Exemple d'utilisation

```tsx
import { BlurLines } from "@/components/animations/BlurLines/BlurLines";

<h1 className="text-4xl font-bold leading-tight text-center text-[var(--ink)]">
  <BlurLines
    lines={[
      "Nous concevons des solutions technologiques",
      "sur mesure pour l’industrie africaine",
    ]}
  />
</h1>;
```

---

## 3. DrawRule

- **Fichier** : `src/components/animations/DrawRule/DrawRule.tsx` & `DrawRule.css`
- **Type** : Server Component (CSS pur)
- **Rôle** : Dessine un filet de séparation horizontal élégant (`scaleX: 0 -> 1`), centré ou aligné à gauche.
- **Déclencheur** : CSS au chargement avec délai paramétrable.
- **Dimensions & Style** : Épaisseur fixe de 2 px, largeur dynamique `min(200px, 40%)`, couleur de marque `--brand` (`#009ee0`).

### Props

| Prop         | Type                 | Défaut           | Description                                          |
| :----------- | :------------------- | :--------------- | :--------------------------------------------------- |
| `delayMs`    | `number`             | `650`            | Délai en millisecondes avant le début de l'étirement |
| `durationMs` | `number`             | `900`            | Durée en millisecondes de l'étirement (0,9 s)        |
| `color`      | `string`             | `'var(--brand)'` | Couleur du trait                                     |
| `align`      | `'center' \| 'left'` | `'center'`       | Alignement horizontal du trait                       |
| `className`  | `string`             | `''`             | Classes CSS additionnelles                           |

### Comportement mobile

- La largeur `min(200px, 40%)` assure que le trait ne déborde jamais sur écran étroit (smartphone 390 px : 40% = ~156 px).

### Comportement reduced-motion

- `scaleX` fixé immédiatement à `1`, animation neutralisée.

### Exemple d'utilisation

```tsx
import { DrawRule } from "@/components/animations/DrawRule/DrawRule";

<DrawRule delayMs={650} durationMs={900} align="center" className="mt-8" />;
```

---

## 4. FadeIn

- **Fichier** : `src/components/animations/FadeIn/FadeIn.tsx` & `FadeIn.css`
- **Type** : Server Component (CSS pur)
- **Rôle** : Fondu d'apparition doux pour les sur-titres, badges, descriptions et éléments d'interface.
- **Déclencheur** : CSS au chargement avec délai paramétrable.

### Props

| Prop        | Type          | Défaut   | Description                                       |
| :---------- | :------------ | :------- | :------------------------------------------------ |
| `children`  | `ReactNode`   | _Requis_ | Contenu à animer                                  |
| `delay`     | `number`      | `0`      | Délai avant affichage en millisecondes            |
| `duration`  | `number`      | `600`    | Durée du fondu en millisecondes                   |
| `as`        | `ElementType` | `'div'`  | Balise HTML sémantique (`div`, `p`, `span`, etc.) |
| `className` | `string`      | `''`     | Classes CSS additionnelles                        |

---

## 5. InView (Scroll Trigger)

- **Fichiers** : `src/lib/useInView.ts` et `src/components/animations/InView/InView.tsx`
- **Type** : Client Component / Hook (`useInView`)
- **Rôle** : Prévu pour les futures sections du site nécessitant un déclenchement d'animation à l'entrée dans le viewport.
- **Comportement architectural** :
  - Utilise l'`IntersectionObserver` natif.
  - Seuil fixé à **0.35** (l'élément doit être à 35% visible).
  - Déclenchement unique (`triggerOnce: true` par défaut) pour éviter tout clignotement ou coût CPU inutile lors des scrolls suivants.

---

## 6. HeroBackground & Antigravity

- **Fichiers** :
  - Wrapper : `src/components/animations/HeroBackground/HeroBackground.tsx` & `.css`
  - Composant WebGL : `src/components/animations/Antigravity/Antigravity.tsx` & `.css`
- **Type** : Client Component (`"use client"`) monté dynamiquement (`next/dynamic`, `{ ssr: false }`).

### Architecture & Montage différé

1. **Fond totalement blanc permanent** : Le conteneur affiche en permanence un fond `#ffffff` pur. Il n'y a **aucun décalage de mise en page (CLS = 0)**.
2. **Montage asynchrone non-bloquant** : Antigravity n'est monté qu'après le premier affichage via `requestIdleCallback` (avec repli `setTimeout(..., 300)`). Le texte et le navigateur ne sont jamais ralentis.
3. **Fondu d'apparition** : Dès son initialisation, le canvas apparaît avec une transition fluide de 1,2 s (`opacity: 0 -> 1`).
4. **Interaction fluide** : Le composant écoute les événements de curseur sur `window`, ce qui permet aux particules d'interagir sur toute la surface de l'écran, y compris quand le curseur survole le texte centré.

### Props utilisées pour Antigravity

```tsx
colors={["#009ee0", "#4cbbe9", "#80cfef", "#b2e2f6"]} // Nuances officielles tirées de reference/colors.png
count={particleCount}           // 1500 sur desktop, 700 sur mobile/tactile
magnetRadius={4.5}
ringRadius={4}
particleSize={0.65}
particleVariance={0.25}
particleShape="sphere"
fieldStrength={25}
waveAmplitude={0.6}
rotationSpeed={1.2}
autoAnimate={true}
lightMode
maxDevicePixelRatio={1.5}
```

### Comportement mobile

- Si la largeur d'écran est inférieure à 760 px (`window.innerWidth < 760`) ou si le pointeur principal est tactile (`pointer: coarse`), le nombre de particules est automatiquement réduit de 1500 à **700**. Cette adaptation est calculée après montage côté client pour éviter toute anomalie d'hydratation.

### Repli statique (Zero WebGL)

Antigravity n'est **jamais monté** et aucun contexte WebGL n'est alloué si :

1. L'utilisateur a activé `prefers-reduced-motion: reduce`.
2. L'utilisateur a activé l'économie de données (`navigator.connection.saveData === true`).
3. WebGL2 n'est pas disponible sur le périphérique (testé à la volée sur un canvas temporaire aussitôt détruit via `WEBGL_lose_context`).

**Rendu du repli statique** : Un motif géométrique de points en CSS pur (`radial-gradient` de 1.5 px répété tous les 28 px, estompé par un masque radial centré à 50% 50% vers 70%), totalement figé sur fond blanc et sans aucun impact CPU/GPU.

### Exceptions ESLint du composant Antigravity

Le composant `Antigravity.tsx` provenant de la bibliothèque tierce React Bits manipule `settingsRef.current = settings;` directement dans son corps de rendu pour synchroniser les paramètres sans réinstancier le contexte WebGL.
La directive `/* eslint-disable */` est présente en en-tête du fichier pour autoriser ce fonctionnement sans altérer le code source d'origine.

---

## 7. AuroraBackground

- **Fichiers** : `src/components/animations/AuroraBackground/AuroraBackground.tsx` & `.css`
- **Type** : Client Component minimal, limité à l’observation de visibilité avec `IntersectionObserver`.
- **Rôle** : Fond clair composé de nappes radiales et répétées en bleu ciel, bleu clair et blanc, sur le dégradé `--hero-bg1` → `--hero-bg2`.
- **Couleurs** : Modifier les couleurs et opacités des deux calques `background-image` dans `AuroraBackground.css`. La base et le fondu bas utilisent `--hero-bg1`, `--hero-bg2` et `--surface-warm`.
- **Performance** : Le calque est deux fois plus large que son conteneur. Le mouvement de 60 s anime uniquement `transform: translate3d(...)`, jamais `background-position`. `animation-play-state` reste à `paused` hors écran et passe à `running` pendant l’intersection.
- **Accessibilité** : Le calque est `aria-hidden`, non interactif et sa couche mobile s’arrête sous `prefers-reduced-motion: reduce`; le dégradé reste statique.

## 8. ParticleTitle

- **Fichiers** : `src/components/animations/ParticleTitle/ParticleTitle.tsx` & `.css`
- **Type** : Client Component, aucun paquet supplémentaire.
- **Props** : `text: string` — le libellé traduit affiché dans le vrai `<h1>`.
- **États et accessibilité** : Le `<h1>` conserve son texte sémantique, sélectionnable et sa mise en page dans les trois modes `pending`, `canvas` et `static`. Lorsque les scripts sont activés, le texte est masqué visuellement en `pending` et `canvas`; le canvas superposé est décoratif (`aria-hidden`, non interactif). Sans JavaScript, la règle `scripting: none` laisse le texte visible. Le mode statique est utilisé en cas de repli.
- **Couleurs** : Les particules et le titre de repli utilisent `#009FF0`.
- **Échantillonnage et alignement** : Attend `document.fonts.ready`, mesure chaque caractère visible avec `Range`, groupe les caractères selon le haut de leur rectangle (tolérance de 1 px), puis dessine chaque glyphe à sa position DOM. La ligne utilise la baseline `line.top + measureText(lineText).fontBoundingBoxAscent` (repli à 80 % de la taille de police). Les cellules sont échantillonnées au centroïde de leurs pixels de glyphe. `ResizeObserver` recalcule les positions avec un debounce de 100 ms; au repos, le redimensionnement redessine directement les particules sur les nouvelles cibles.
- **Dispersion** : Le canvas de rendu s'étend à 240 % × 280 % du bloc du titre, centré autour de celui-ci, afin que le nuage ne révèle pas les bords d'un canvas ajusté au seul texte. Les positions dispersées couvrent une ellipse de 68 % de la largeur et 85 % de la hauteur du titre; les limites restent cohérentes au premier rassemblement et lors des dispersions suivantes. Le canvas d'échantillonnage du texte reste à la taille exacte du `<h1>`.
- **Séquence et budget** : Après le chargement des polices et l’échantillonnage, le titre passe en mode `canvas`, puis attend 500 ms lorsqu’il est visible. Les particules se rassemblent pendant 4 200 ms, le titre reste net pendant 5 200 ms, se disperse pendant 4 200 ms, puis le nuage reste en pause 1 400 ms avant le prochain rassemblement. Six styles de mouvement (smoke, vortex, sand, burst, sweep, absorb) tournent sans répétition avant d’avoir parcouru la liste. Les délais de particules sont normalisés pour que la dernière arrive exactement à la fin de chaque transition. Le DPR est plafonné à 2 et le budget à 3 500 particules sur ordinateur ou 1 800 sous 760 px.
- **Sommeil et debug** : `requestAnimationFrame` tourne uniquement pendant le rassemblement et la dispersion; aucun frame n’est programmé pendant les phases de titre et de nuage. Les transitions, délais et pauses sont suspendus hors du viewport ou lorsque l’onglet est masqué. En développement, `?debug=particles` dessine le texte de référence rouge à 40 % sous les particules pour contrôler leur alignement.
- **Repli statique** : Le mode `static` est utilisé avec `prefers-reduced-motion: reduce`, `navigator.connection.saveData`, un canvas/contexte indisponible, un échantillonnage vide ou en cas d’erreur. Une sécurité bascule aussi vers ce mode si l’échantillonnage n’a pas abouti en 3 s. Le texte reste visible avec un fondu d’entrée de 600 ms; aucun canvas n’est rendu en mode statique.

### Provenance des références communautaires

Le fichier Particle Title annoncé dans le brief n’était pas présent dans `reference/about-hero/` ni dans `reference/about/`; sa version locale a été écrite à partir du cahier des charges. La référence Aurora a ensuite été fournie dans la conversation et adaptée aux règles de ce projet. Aucun paquet tiers n’a été ajouté.

- [Aurora Background — Manu Arora (`manuarora700`), 21st.dev](https://21st.dev/@manuarora700/components/aurora-background) : licence MIT, confirmée sur la fiche. Le fond est adapté du code fourni dans la conversation; la démo framer-motion n’est pas utilisée.
- [Particle Title — saki (`yingwuyi6l6`), 21st.dev](https://21st.dev/@yingwuyi6l6/components/particle-title) : licence MIT, confirmée sur la fiche. La référence source attendue était `reference/about-hero/particle-title.tsx`.
