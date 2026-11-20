# Motion

Motion on moiez.dev has two jobs. **Most of it explains**: it shows how a system works, confirms that an action happened, or keeps you oriented when the page changes. **One piece sets the tone**: Deto, the living liquid in the home hero. It's one body of liquid metal floating in space, rendered in real 3D, that turns from one shape straight into the next. It sits dim in the middle of the hero, between the copy and Moiz's portrait. It's the site's signature, so it gets a strict budget, and nothing else on the site gets to be decoration.

## The rules

### 1. Content first, always

- Every page renders complete on first paint, in prerendered HTML, with no JavaScript. Motion only ever enhances what is already there.
- An element is hidden for a reveal only when it is fully below the fold *and* the browser can observe it.
- Text never moves for effect. There's no parallax, typewriter or word-by-word stagger on copy. Text is placed once and stays put.
- Ambient motion stays out of the copy's way. Deto sits in the gap between the hero copy and the portrait (behind the portrait on phones), drawn at 32% so the text it brushes stays fully readable. The rest of the page has no background animation.

### 2. Two kinds of motion

| | Functional | Ambient (signature) |
| --- | --- | --- |
| Purpose | explain, confirm, orient | set the tone |
| Examples | reveals, view transitions, the architecture explainer, button feedback | Deto, the hero's living liquid |
| How many | as many as a page needs | **one per page, at most**: today only on home |
| Triggered by | the user, or entering the viewport | time |
| May loop? | only while on screen (rule 5) | yes, while on screen (rule 5) |

A new ambient piece replaces Deto. It isn't added next to it.

### 3. The signature runs on its own

- **Scroll**: not used. Deto scrolls away with the hero like the rest of the page.
- **Cursor**: not used. The canvas takes no pointer events. Device tilt isn't used either, because iOS would need a permission prompt for it.
- Every response is **scrubbed or eased**: it's a function of where the scroll or pointer is now, so going back undoes it. Nothing is triggered once and left half-finished.
- Responses are gentle. Nothing jumps, flashes, or follows the pointer across the page.
- No scroll-jacking, no smooth-scroll libraries, no pinned sections. The page always scrolls at the speed you scroll it.

### 4. Cheap to run

- Animate `transform` and `opacity` in the DOM. Three deliberate exceptions remain: `stroke-dashoffset` and `offset-path` in the architecture explainer, and the circular `clip-path` theme reveal on the View Transition snapshot.
- Anything heavier goes on **one** `<canvas>`. Deto is the one WebGL piece on the page: WebGL2, no library, one raymarched full-screen draw per frame, with pixels away from the body discarded early. The resolution is capped at 1.25x (1x on phones and small or low-core devices), and if the first 4 seconds run slow it drops to 0.75x once.
- Ambient code loads after first paint (`requestIdleCallback` plus a dynamic `import()`), so it never competes with the LCP image.
- No animation library. The whole system is plain CSS, the Web Animations API, a few small hooks and one canvas engine.
- Without WebGL2 the hero is just the copy and the portrait. Nothing else depends on it.
- Botfolio's avatar (`components/chatbot/RobotAvatar.jsx`) is the one other canvas: a tiny raymarched ball of the same liquid metal as Deto (white on dark, black on light). It ripples slowly at rest, churns faster while thinking and swells unevenly while speaking. One full-screen triangle per frame at avatar size; only one avatar is on screen at a time. With reduced motion it moves at half speed, and without WebGL2 it shows a shaded CSS sphere.

### 5. Nothing runs unseen

- Anything that repeats (the queue visual, gallery autoplay, the cursor's rAF) runs only while it is on screen and the tab is visible. Gate it with `usePauseWhenHidden`, or with an IntersectionObserver plus `visibilitychange` for rAF loops.
- Deto runs only while the hero is on screen (IntersectionObserver) and the tab is visible.
- Status pulses stop after 3 iterations.

### 6. Reduced motion is respected

With `prefers-reduced-motion: reduce`:

- every token duration becomes `0ms` and the reveal distance `0px`;
- JS-driven pieces render their final state, with two deliberate exceptions (Moiz's call, 2026-11-19: a frozen hero read as broken). Deto runs at half speed. Botfolio's avatar ripples at half speed;
- scroll- and cursor-linked effects are off;
- view transitions are skipped;
- the custom cursor is off.

### 7. Every input, both directions, both themes

- Each hover effect has a `:focus-visible` equivalent and doesn't depend on hover on touch.
- Directional motion (arrows, sliders, the segmented thumb, the queue, the hero's portrait side and Deto's place between copy and portrait) is mirrored in RTL.
- Anything drawn in JS reads the theme at draw time. Every Deto shape is one neutral metal: near-white on dark and near-black on light, with no tint.
- Canvas is `aria-hidden` and hidden when printing. It listens to the pointer on the window, so it never takes clicks or blocks scrolling.

### 8. One vocabulary

Every duration and easing comes from the tokens below. No ad-hoc `300ms` values. Canvas timing (Deto's morph and hold) is the one place where it lives in its own module, as named constants.

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
| `deto.js` | Deto, the hero's living liquid: the shapes as signed distance fields, the raymarching shader and the metal look per theme, driven by `drive(t, dt, { a, b, m, view })`. Knows nothing about React or the DOM beyond its canvas. |

## Deto, the hero's liquid

`components/home/Hero.jsx` puts the copy on one side and Moiz's full cut-out portrait (`HeroStage.jsx`) on the other, mirrored in RTL; on phones the portrait stacks above the copy. `HeroLiquid.jsx` adds one WebGL2 canvas over the whole hero section, under the copy and the portrait, once the browser is idle. It takes no pointer events and is hidden when printing.

- **Where**: on desktop, centred in the gap between the copy and the portrait, at the middle of their height; on phones, behind the portrait. Drawn at 32% opacity. It only exists in the hero; no other section has background animation.
- **What**: one body of liquid metal floating in space, raymarched from signed distance fields. Near-white on the dark theme, near-black on the light one.
- **Cycle**: it appears at once, full size (no pop-up, no fade, no drop-in), as a round liquid whose surface waves and dances. Then it runs through its shapes on a timer: a rounded cube, a torus knot, a double helix standing upright, a Möbius band and a planet. Each stands 4 s and turns straight into the next over 2.6 s, with no sphere in between. The planet's globe forms first, then its debris fans out from behind it into three rings, and tucks back behind it before the next shape. The planet holds still while only its debris orbits; every other shape turns slowly. No jiggle, no bounce, no squash.
- **Off**: only on home, stopped when the hero is off screen or the tab is hidden, and at half speed under reduced motion.

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

- Decide which kind it is (rule 2). If it's ambient, it replaces Deto.
- Reach for an existing token and an existing component first.
- If it loops, gate it (rule 5). If it is driven by JS, check `prefersReducedMotion()` and render the end state.
- If it follows scroll or the pointer, scrub or ease it: it must undo itself when you go back.
- Check it in EN and AR, light and dark, at 390px, with reduced motion on, and with a keyboard.
