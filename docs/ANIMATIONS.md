# Documentation des Animations — Nicomatic Sénégal

Ce document détaille toutes les animations réutilisables du projet, leurs caractéristiques techniques, leurs déclencheurs, leurs comportements sur mobile et sous préférence d'accessibilité (`prefers-reduced-motion`).

---

## 1. Vue d'ensemble des principes d'animation

- **Zéro dépendance lourde** : Les animations de texte et de structure reposent exclusivement sur du CSS natif et fonctionnent immédiatement avant même l'hydratation JavaScript.
- **Performances GPU strictes** : Seules les propriétés compositées (`opacity`, `transform`, `filter`) sont animées. Jamais `width`, `height`, `top` ou `left`.
- **Tokens centralisés** : Les durées et courbes proviennent de `src/styles/tokens.css` :
  - Courbe par défaut : `--ease: cubic-bezier(0.22, 1, 0.36, 1)`
  - Durées : `--dur-fast: 400ms`, `--dur-base: 600ms`, `--dur-slow: 1100ms`
- **Accessibilité universelle** : Sous `prefers-reduced-motion: reduce`, aucun effet de flou, de déplacement ou de boucle n'est joué ; les éléments sont immédiatement nets et visibles, avec un simple fondu universel de 0,6 s au maximum.

---

## 2. BlurLines

- **Fichier** : `src/components/animations/BlurLines/BlurLines.tsx` & `BlurLines.css`
- **Type** : Server Component (CSS pur, zéro JavaScript requis)
- **Rôle** : Révèle un titre ou un paragraphe ligne par ligne avec un effet progressif passant d'un flou léger avec espacement étendu vers un texte net et condensé.
- **Déclencheur** : Immédiat au chargement de la page (HTML/CSS initial).
- **Accessibilité** : Insère un séparateur sémantique `<span className="sr-only"> </span>` entre chaque ligne pour garantir qu'une phrase complète et fluide soit énoncée par les lecteurs d'écran.

### Props

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `lines` | `string[]` | *Requis* | Tableau des lignes de texte à afficher |
| `staggerMs` | `number` | `140` | Décalage en ms entre le départ de chaque ligne consécutive via la variable `--i` |
| `duration` | `string` | `'var(--dur-slow)'` | Durée de l'animation de chaque ligne (1100 ms) |
| `className`| `string` | `''` | Classes CSS additionnelles |

### Comportement mobile
- Identique au desktop, s'adapte automatiquement à la taille de police fluide (`clamp`).

### Comportement reduced-motion
- Désactive immédiatement le flou (`filter: none !important`), l'opacité est forcée à 1 et le crénelage à `-0.02em`. Aucun retard ni flou perçu.

### Exemple d'utilisation
```tsx
import { BlurLines } from '@/components/animations/BlurLines/BlurLines';

<h1 className="text-4xl font-semibold leading-tight text-[var(--ink)]">
  <BlurLines
    lines={[
      "Nous concevons des solutions technologiques",
      "sur mesure pour l’industrie africaine"
    ]}
  />
</h1>
```

---

## 3. DrawRule

- **Fichier** : `src/components/animations/DrawRule/DrawRule.tsx` & `DrawRule.css`
- **Type** : Server Component (CSS pur)
- **Rôle** : Dessine un filet de séparation horizontal élégant depuis la gauche vers la droite (`scaleX: 0 -> 1`).
- **Déclencheur** : CSS au chargement avec délai paramétrable.
- **Dimensions & Style** : Épaisseur fixe de 2 px, largeur dynamique `min(200px, 40%)`, couleur de marque `--brand` (`#009ee0`).

### Props

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `delayMs` | `number` | `650` | Délai en millisecondes avant le début de l'étirement |
| `durationMs`| `number` | `900` | Durée en millisecondes de l'étirement (0,9 s) |
| `color` | `string` | `'var(--brand)'` | Couleur du trait |
| `className`| `string` | `''` | Classes CSS additionnelles |

### Comportement mobile
- La largeur `min(200px, 40%)` assure que le trait ne déborde jamais sur écran étroit (smartphone 390 px : 40% = ~156 px).

### Comportement reduced-motion
- `scaleX` fixé immédiatement à `1`, animation neutralisée.

### Exemple d'utilisation
```tsx
import { DrawRule } from '@/components/animations/DrawRule/DrawRule';

<DrawRule delayMs={650} durationMs={900} className="mt-8" />
```

---

## 4. FadeIn

- **Fichier** : `src/components/animations/FadeIn/FadeIn.tsx` & `FadeIn.css`
- **Type** : Server Component (CSS pur)
- **Rôle** : Fondu d'apparition doux pour les sur-titres, badges, descriptions et éléments d'interface.
- **Déclencheur** : CSS au chargement avec délai paramétrable.

### Props

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `children` | `ReactNode` | *Requis* | Contenu à animer |
| `delay` | `number` | `0` | Délai avant affichage en millisecondes |
| `duration` | `number` | `600` | Durée du fondu en millisecondes |
| `as` | `ElementType` | `'div'` | Balise HTML sémantique (`div`, `p`, `span`, etc.) |
| `className`| `string` | `''` | Classes CSS additionnelles |

### Exemple d'utilisation
```tsx
import { FadeIn } from '@/components/animations/FadeIn/FadeIn';

<FadeIn delay={300} duration={1000} as="p" className="text-sm text-[var(--muted)]">
  Votre voyage vers la transformation commence aujourd’hui.
</FadeIn>
```

---

## 5. InView (Scroll Trigger)

- **Fichiers** : `src/lib/useInView.ts` et `src/components/animations/InView/InView.tsx`
- **Type** : Client Component / Hook (`useInView`)
- **Rôle** : Prévu pour les futures sections du site nécessitant un déclenchement d'animation à l'entrée dans le viewport.
- **Comportement architectural** :
  - Utilise l'`IntersectionObserver` natif.
  - Seuil fixé à **0.35** (l'élément doit être à 35% visible).
  - Déclenchement unique (`triggerOnce: true` par défaut) pour éviter tout clignotement ou coût CPU inutile lors des scrolls suivants.

### Exemple d'utilisation
```tsx
import { InView } from '@/components/animations/InView/InView';

<InView threshold={0.35} triggerOnce>
  {(isInView) => (
    <div className={`transition-opacity duration-700 ${isInView ? 'opacity-100' : 'opacity-0'}`}>
      Contenu révélé au défilement
    </div>
  )}
</InView>
```

---

## 6. HeroBackground & Antigravity

- **Fichiers** :
  - Wrapper : `src/components/animations/HeroBackground/HeroBackground.tsx` & `.css`
  - Composant WebGL : `src/components/animations/Antigravity/Antigravity.tsx` & `.css`
- **Type** : Client Component (`"use client"`) monté dynamiquement (`next/dynamic`, `{ ssr: false }`).

### Architecture & Montage différé
1. **Fond CSS permanent** : Le conteneur affiche en permanence un dégradé subtil (`--hero-bg1` vers `--hero-bg2`) accompagné d'un halo radial (`--hero-halo`) en haut à droite. Il n'y a **aucun décalage de mise en page (CLS = 0)** et le hero est parfait visuellement avant même que le canvas n'arrive.
2. **Montage asynchrone non-bloquant** : Antigravity n'est monté qu'après le premier affichage via `requestIdleCallback` (avec repli `setTimeout(..., 300)`). Le texte et le navigateur ne sont jamais ralentis.
3. **Fondu d'apparition** : Dès son initialisation, le canvas apparaît avec une transition fluide de 1,2 s (`opacity: 0 -> 1`).
4. **Interaction fluide** : Le composant écoute les événements de curseur sur `window`, ce qui permet aux particules d'interagir sur toute la surface de l'écran, y compris quand le curseur survole le texte positionné par-dessus.

### Props utilisées pour Antigravity
```tsx
colors={["#7dd3fc", "#e0f2fe", "#c3e7fa"]}
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

### Comment modifier l'apparence des particules
- **Couleurs** : Modifier le tableau `colors` dans `HeroBackground.tsx` (ex: `colors={["#009ee0", "#7dd3fc", "#e0f2fe"]}`).
- **Densité** : Ajuster `setParticleCount(...)` dans `HeroBackground.tsx` (ex: 2000 pour plus dense, 1000 pour plus aéré).
- **Taille** : Modifier `particleSize` (ex: `0.5` pour des micro-particules discrètes, `0.9` pour des particules plus marquées).
- **Vitesse & Réactivité** : Modifier `rotationSpeed` (vitesse de rotation), `waveAmplitude` (ondulation) ou `fieldStrength` (réactivité au curseur).

### Comportement mobile
- Si la largeur d'écran est inférieure à 760 px (`window.innerWidth < 760`) ou si le pointeur principal est tactile (`pointer: coarse`), le nombre de particules est automatiquement réduit de 1500 à **700**. Cette adaptation est calculée après montage côté client pour éviter toute anomalie d'hydratation.

### Repli statique (Zero WebGL)
Antigravity n'est **jamais monté** et aucun contexte WebGL n'est alloué si :
1. L'utilisateur a activé `prefers-reduced-motion: reduce`.
2. L'utilisateur a activé l'économie de données (`navigator.connection.saveData === true`).
3. WebGL2 n'est pas disponible sur le périphérique (testé à la volée sur un canvas temporaire aussitôt détruit via `WEBGL_lose_context`).

**Rendu du repli statique** : Un motif géométrique de points en CSS pur (`radial-gradient` de 1.5 px répété tous les 28 px, estompé par un masque radial centré à 62% 50% vers 70%), totalement figé et sans aucun impact CPU/GPU.

### Exceptions ESLint du composant Antigravity
Le composant `Antigravity.tsx` provenant de la bibliothèque tierce React Bits manipule `settingsRef.current = settings;` directement dans son corps de rendu pour synchroniser les paramètres sans réinstancier le contexte WebGL. 
Conformément aux directives de ne pas modifier le code source interne du composant fourni, la directive `/* eslint-disable */` a été ajoutée en en-tête du fichier pour autoriser ce fonctionnement sans bloquer le pipeline de build.
