# Motion

Motion on moiez.dev has two jobs. **Most of it explains**: it shows how a system works, confirms that an action happened, or keeps you oriented when the page changes. **One piece sets the tone**: Deto, the living liquid behind the home page. It's one body of liquid metal floating in space, rendered in real 3D, that takes each section's shape and melts and floats from one into the next with real inertia, stretch and a tail. It answers scroll. It's the site's signature, so it gets a strict budget, and nothing else on the site gets to be decoration.

## The rules

### 1. Content first, always

- Every page renders complete on first paint, in prerendered HTML, with no JavaScript. Motion only ever enhances what is already there.
- An element is hidden for a reveal only when it is fully below the fold *and* the browser can observe it.
- Text never moves for effect. There's no parallax, typewriter or word-by-word stagger on copy. Text is placed once and stays put.
- Ambient motion gets its own space and never sits behind text. Deto lives behind the content, never under the headline, so nothing has to be dimmed for the copy to stay readable. The rest of the page has no background animation.

### 2. Two kinds of motion

| | Functional | Ambient (signature) |
| --- | --- | --- |
| Purpose | explain, confirm, orient | set the tone |
| Examples | reveals, view transitions, the architecture explainer, button feedback | Deto, the home page's living liquid |
| How many | as many as a page needs | **one per page, at most**: today only on home |
| Triggered by | the user, or entering the viewport | time and scroll |
| May loop? | only while on screen (rule 5) | yes, while on screen (rule 5) |

A new ambient piece replaces the forge. It isn't added next to it.

### 3. The signature is live: it answers scroll and the cursor

- **Scroll**: scroll drives the morph: shape, dissolve, next shape, dissolve, and so on. Each home section has its own shape. While you scroll towards the next section the standing shape dissolves into one churning liquid blob, the same liquid metal as the hero's sludge, and the cloud forms that section's shape. Scrolling back runs it backwards.
- **Cursor**: not used for now. The forge sits behind the content, so it never reacts to the pointer. Device tilt isn't used either, because iOS would need a permission prompt for it.
- Every response is **scrubbed or eased**: it's a function of where the scroll or pointer is now, so going back undoes it. Nothing is triggered once and left half-finished.
- Responses are gentle. Nothing jumps, flashes, or follows the pointer across the page.
- No scroll-jacking, no smooth-scroll libraries, no pinned sections. The page always scrolls at the speed you scroll it.

### 4. Cheap to run

- Animate `transform` and `opacity` in the DOM. Three deliberate exceptions remain: `stroke-dashoffset` and `offset-path` in the architecture explainer, and the circular `clip-path` theme reveal on the View Transition snapshot.
- Anything heavier goes on **one** `<canvas>`. Deto is the one WebGL piece on the page: WebGL2, no library, one raymarched full-screen draw per frame, with pixels away from the body discarded early. Its physics is a handful of springs on the CPU, passed in as uniforms. The resolution is capped at 1.25x (1x on phones and small or low-core devices), and if the first 4 seconds run slow it drops to 0.75x once.
- Ambient code loads after first paint (`requestIdleCallback` plus a dynamic `import()`), so it never competes with the LCP image.
- No animation library. The whole system is plain CSS, the Web Animations API, a few small hooks and one canvas engine.
- Without WebGL2 the stage keeps its static glow. Nothing else depends on it.
- Botfolio's avatar (`components/chatbot/RobotAvatar.jsx`) is the one other canvas: a tiny raymarched ball of the same liquid metal as Deto (white on dark, black on light). It ripples slowly at rest, churns faster while thinking and swells unevenly while speaking. One full-screen triangle per frame at avatar size; only one avatar is on screen at a time. With reduced motion it moves at half speed, and without WebGL2 it shows a shaded CSS sphere.

### 5. Nothing runs unseen

- Anything that repeats (the queue visual, gallery autoplay, the cursor's rAF) runs only while it is on screen and the tab is visible. Gate it with `usePauseWhenHidden`, or with an IntersectionObserver plus `visibilitychange` for rAF loops.
- The forge runs only while its stage is on screen (IntersectionObserver) and the tab is visible.
- Status pulses stop after 3 iterations.

### 6. Reduced motion is respected

With `prefers-reduced-motion: reduce`:

- every token duration becomes `0ms` and the reveal distance `0px`;
- JS-driven pieces render their final state, with two deliberate exceptions (Moiz's call, 2026-11-19: a frozen hero read as broken). The forge plays a gentle version: it opens on the finished blob instead of a swarm flying in, runs at half speed, and ignores scroll (no scatter, no scroll spin). Botfolio's avatar ripples at half speed;
- scroll- and cursor-linked effects are off;
- view transitions are skipped;
- the custom cursor is off.

### 7. Every input, both directions, both themes

- Each hover effect has a `:focus-visible` equivalent and doesn't depend on hover on touch.
- Directional motion (arrows, sliders, the segmented thumb, the queue, Deto's side columns) is mirrored in RTL.
- Anything drawn in JS reads the theme at draw time. Every forge shape is one neutral metal: near-white on dark and near-black on light, with no tint.
- Canvas is `aria-hidden` and hidden when printing. It listens to the pointer on the window, so it never takes clicks or blocks scrolling.

### 8. One vocabulary

Every duration and easing comes from the tokens below. No ad-hoc `300ms` values. Canvas timing (the forge's morph and hold) is the one place where it lives in its own module, as named constants.

## Tokens (`src/motion/tokens.css`, `src/motion/tokens.js`)

| Token | Value | Use |
| --- | --- | --- |
| `--dur-fast` | 150ms | presses, tooltips, highlights |
| `--dur-base` | 250ms | reveals, menus, state changes |
| `--dur-slow` | 400ms | page/theme transitions, flips, hops, canvas fade-in |
| `--ease-spring` | `cubic-bezier(0.32, 0.72, 0, 1)` | anything that moves |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | fades |
| `--reveal-distance` | 8px | section reveal offset (max 12px) |

In Tailwind classes, use them as `duration-(--dur-base) ease-(--ease-spring)`. In JS, use `DUR` and `EASE` from `src/motion/tokens.js`.

## Building blocks (`src/motion/`)

| File | Purpose |
| --- | --- |
| `Reveal.jsx` | The one shared reveal: fade plus 8px, 250ms. Used only on section headings and card groups (7–13 per page). Static unless fully below the fold. Also reveals on `beforeprint`. |
| `useInView.js` | IntersectionObserver hook (`once` by default). |
| `usePauseWhenHidden.js` | `true` only while the element is in view, the tab is visible and motion is allowed. Gates every loop. |
| `reducedMotion.js` | `prefersReducedMotion()` and a `usePrefersReducedMotion()` hook (via `useSyncExternalStore`). |
| `viewTransition.js` | `withViewTransition()` and `navigateWithTransition()`. Card → case study shared-element morph. Waits for the new route to commit before the snapshot is taken. |
| `prefsTransitions.js` | Circular theme reveal from the toggle, and the EN⇄AR crossfade. |
| `deto.js` | Deto, the home page's living liquid: the shapes as signed distance fields, its zero-gravity physics (spring-driven body, volume-keeping stretch mode, lag-spine tail), the raymarching shader and the metal look per theme. Knows nothing about React or the DOM beyond its canvas. |

## Deto, the living liquid

`components/home/ForgeLayer.jsx` runs Deto (Moiz's name, after the Pokémon that reshapes itself into anything; engine in `motion/deto.js`) behind the whole home page: one fixed, viewport-sized WebGL2 canvas under the content (`#root` sits above it), drawn at full strength. Nothing on the page dims or blurs it: no fade, no frosted glass on the cards, no tint on the bands while it runs. Each section marks where it starts with `ForgeSpot` (a zero-height `data-forge-spot="<shape>"` marker, via `SectionTitle`'s `forge` prop), and the hero's marker stands for the first shape. The canvas loads once the browser is idle, fades in, and takes no pointer events.

- **What it is**: one body of liquid metal floating in space. There are no cubes, no floor and no gravity. It is drawn by raymarching signed distance fields on one full-screen triangle, and pixels far from the body and its tail are discarded before any marching.
- **Shapes**, one per section: hero, a rippling liquid blob (behind the portrait, scrolling with it, so it never runs under the headline); Projects, a rounded cube; Architecture, a torus knot; AI, a double helix (1.5 turns, 9 rungs flaring into the strands); Experience, a Möbius band; Contact, a planet circled by two belts of small pebbles, rocks and shards set out from the globe (the inner belt orbits faster). A real liquid would pinch thin parts (helix strands, the band, the knot) into drops, so each shape is the form the liquid holds itself to. On wide screens the shape stands in the free side column of its section, alternating sides (Projects right, Architecture left, AI right, Experience left, Contact right, mirrored in Arabic); phones keep it centred behind the content.
- **A transition**, set by scroll (the drawn position glides after the scroll, catching up over a second or two): each shape stands whole and solid for the middle 60% of the way between its neighbouring sections' middles; only the 40% around each hand-over is spent changing. Leaving, it melts into one round body of liquid; the body floats to the next place in a straight line; the next shape grows out of it. Every stage eases into the next.
- **Physics** (in time, on top of the scroll): the body follows its target on a soft, slightly underdamped spring, so it accelerates, coasts and settles with a small give. While it moves it stretches along its motion and narrows across it, keeping its volume, through a lightly damped oscillator, so when it stops it swings through a squash and wobbles out over two or three swings. Its tail is its own lag: a spine of 14 points, each easing after the one in front, so the tail lies along the path the body actually took, is longer the faster it moves, works in any direction, and is pulled back in once it stops. The tail starts at 75% of the body's width and thins to a fine tip, joined to the body with a smooth union. While a shape stands, the body holds firmly to its place. The shapes never turn: each faces the viewer at one fixed angle (the double helix straight upright), and only the planet's debris orbits. The stretch runs along an axis, so when the body swings back past its place the axis never turns the long way round (that used to snap the liquid sideways).
- **Surface**: a slow ripple, livelier while it changes shape or is pushed about. The look matches Botfolio's avatar: near-white metal on the dark page and near-black on the light one, with a tight wet glint.
- **Cursor**: no hover effect.
- **Off**: only on home, stopped when the tab is hidden, drawn at reduced resolution (1.25x at most, 1x on phones, dropping lower once if frames are slow), and at half speed under reduced motion.

## Each functional piece, and what it proves

| Piece | Where | What it shows about the work |
| --- | --- | --- |
| Live architecture explainer | Home, `home/ArchitectureGraph.jsx` | The real TWLM POS topology (Next.js → NestJS → PostgreSQL/Redis/BullMQ → Wallet/AI). Pick a scenario (order, wallet pass update, AI query) and a packet hops along the actual path, with a caption for each step. Shows system design, not just a list of tools. Data: `src/data/architecture.json`. |
| Card → case study view transition | Works, home, `ui/TransitionLink.jsx` | The card image morphs into the case-study hero, so you keep your place. Shows attention to navigation. |
| Wallet pass flip | TWLM case study, `project/WalletPass.jsx` | The Apple/Google Wallet pass integration, front and back. |
| Latency bar | TWLM case study, `project/LatencyBar.jsx` | The ~64% p95 API latency reduction, drawn to scale once. |
| API console | Home AI section, `home/ApiConsole.jsx` | Request/response shapes for creating an order and AI menu search. Responses are labelled illustrative. |
| BullMQ queue | TWLM case study, `project/QueueVisual.jsx` | Jobs moving through waiting → active → completed/failed → retry: the async wallet-update pipeline. |
| Theme reveal and language crossfade | Header, ⌘K | Both themes and full RTL Arabic are first-class, not toggles bolted on. |
| ⌘K palette | Everywhere, `CommandPalette.jsx` | Keyboard-first UX, plus shortcuts: open the TWLM case study, download the CV, switch language, toggle theme, contact via WhatsApp. |
| Scroll progress and moving TOC marker | Case studies | Orientation in long-form writing. |
| Card hover | Cards | Lift 3px, shadow fade, image scale 1.03, arrow nudge (mirrored in RTL). The same effect on `:focus-visible`. |
| Button press and success check | Buttons, contact form | Immediate feedback: scale 0.98 on press, animated check after sending. |
| Tech chip tooltips | Tech chips, `ui/TechChip.jsx` | What each technology was used for, and in which projects. Data: `src/data/techNotes.json`. |
| Copy email/phone with toast | Contact | One-tap copy with a "Copied" confirmation. |
| Custom cursor | Fine pointers only, `ui/Cursor.jsx` | Dot tracks the pointer exactly; a hairline ring trails by under 80ms. The ring grows over links and shows a label over cards ("View ↗") and the pass ("Flip pass"). The native cursor is used over inputs and in the chatbot. |

The code window on About is kept static on purpose: it is read, not watched.

## Not used

Loading screens, scroll-jacking, smooth-scroll libraries, pinned sections, parallax on text, typewriter effects, word-by-word staggers, a second ambient piece on the same page, and background animation behind text.

## Adding motion

- Decide which kind it is (rule 2). If it's ambient, it replaces the forge.
- Reach for an existing token and an existing component first.
- If it loops, gate it (rule 5). If it is driven by JS, check `prefersReducedMotion()` and render the end state.
- If it follows scroll or the pointer, scrub or ease it: it must undo itself when you go back.
- Check it in EN and AR, light and dark, at 390px, with reduced motion on, and with a keyboard.
