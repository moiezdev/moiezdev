# Motion

Motion on moiez.dev has two jobs. **Most of it explains**: it shows how a system works, confirms that an action happened, or keeps you oriented when the page changes. **One piece sets the tone**: the nano swarm behind the home page. It's a field of small metallic cubes linked by a mesh of hairlines that gathers into a formation around the portrait, keeps rebuilding itself, and answers the cursor and scroll. It's the site's signature, so it gets a strict budget, and nothing else on the site gets to be decoration.

## The rules

### 1. Content first, always

- Every page renders complete on first paint, in prerendered HTML, with no JavaScript. Motion only ever enhances what is already there.
- An element is hidden for a reveal only when it is fully below the fold *and* the browser can observe it.
- Text never moves for effect. There's no parallax, typewriter or word-by-word stagger on copy. Text is placed once and stays put.
- Ambient motion sits behind content, never in front of it. Where it passes behind text (the hero's lines of copy, the stats, the header) it drops to a tenth of its opacity, eased in over a short margin so there's no visible box. Cards stay opaque. The one exception is the hero portrait, which sits on a see-through panel: the swarm shows through it at 40%, softened by a light blur. Tinted bands let only a little through.

### 2. Two kinds of motion

| | Functional | Ambient (signature) |
| --- | --- | --- |
| Purpose | explain, confirm, orient | set the tone |
| Examples | reveals, view transitions, the architecture explainer, button feedback | the home nano swarm |
| How many | as many as a page needs | **one per page, at most**: today only on home |
| Triggered by | the user, or entering the viewport | time, scroll and the cursor |
| May loop? | only while on screen (rule 5) | yes, while on screen (rule 5) |

A new ambient piece replaces the swarm. It isn't added next to it.

### 3. The background is live: it answers scroll and the cursor

- **Scroll**: the swarm turns as you scroll, scatters on a fast flick and regroups at rest, and comes apart into the page-wide field as the hero leaves. The field drifts slower than the page, so it reads as depth.
- **Cursor**: the swarm parts around the pointer, the formation leans toward it, and hairlines link the pointer into the mesh. On touch screens a finger does the same while it's down. Device tilt isn't used, because iOS would need a permission prompt for it.
- Every response is **scrubbed or eased**: it's a function of where the scroll or pointer is now, so going back undoes it. Nothing is triggered once and left half-finished.
- Responses are gentle. Nothing jumps, flashes, or follows the pointer across the page.
- No scroll-jacking, no smooth-scroll libraries, no pinned sections. The page always scrolls at the speed you scroll it.

### 4. Cheap to run

- Animate `transform` and `opacity` in the DOM. Three deliberate exceptions remain: `stroke-dashoffset` and `offset-path` in the architecture explainer, and the circular `clip-path` theme reveal on the View Transition snapshot.
- Anything heavier goes on **one** fixed `<canvas>`, using 2D context, prerendered sprites, no WebGL and no animation library. The swarm is about 1,000 cubes on desktop and 450 on phones, with the device pixel ratio capped at 1.5. The mesh uses a spatial grid, with at most 3 links per cube, so it never compares every cube with every other.
- Ambient code loads after first paint (`requestIdleCallback` plus a dynamic `import()`), so it never competes with the LCP image.
- No animation library. The whole system is plain CSS, the Web Animations API, a few small hooks and one canvas engine.

### 5. Nothing runs unseen

- Anything that repeats (the queue visual, gallery autoplay, the cursor's rAF) runs only while it is on screen and the tab is visible. Gate it with `usePauseWhenHidden`, or with an IntersectionObserver plus `visibilitychange` for rAF loops.
- The swarm is always on screen on home, so it stops only when the tab is hidden. Once the hero has scrolled away, only the slow field is left, and it renders at half rate.
- Status pulses stop after 3 iterations.

### 6. Reduced motion is respected

With `prefers-reduced-motion: reduce`:

- every token duration becomes `0ms` and the reveal distance `0px`;
- JS-driven pieces render their final state. The swarm draws one still, assembled formation and repaints it only when the theme or language changes;
- scroll- and cursor-linked effects are off;
- view transitions are skipped;
- the custom cursor is off.

### 7. Every input, both directions, both themes

- Each hover effect has a `:focus-visible` equivalent and doesn't depend on hover on touch.
- Directional motion (arrows, sliders, the segmented thumb, the queue, the swarm's position beside the portrait) is mirrored in RTL.
- Anything drawn in JS reads the theme at draw time. The swarm is brushed steel on dark and graphite on light.
- Canvas is `aria-hidden`, `pointer-events: none` and hidden when printing.

### 8. One vocabulary

Every duration and easing comes from the tokens below. No ad-hoc `300ms` values. Canvas timing (the swarm's hold and rebuild) is the one place where it lives in its own module, as named constants.

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
| `nanoSwarm.js` | The swarm engine: formations, the free field, the mesh, cube sprites per theme, and a `step(t, dt)` that reads the anchor, scroll, pointer and the rects to keep clear. Knows nothing about React or the DOM beyond its canvas. |

## The nano swarm

`components/home/HeroSwarm.jsx` mounts the engine from the home page. It doesn't touch the hero's markup. It adds one fixed canvas behind the page (the body goes transparent while it's there) and centres the formation in the hero.

- **Formation**: about two thirds of the cubes form a large cloud around the portrait. About every 7s they burst apart and rebuild, top to bottom, into the next shape: sphere, ring, helix, `</>`, then a hollow cube. A band of light sweeps down through its mesh, and tumbling cubes catch the light now and then.
- **Field**: the rest drift as a loose plexus across the whole viewport, linked by fainter hairlines.
- **Scroll**: the formation turns with scroll position and trails the page slightly. A fast scroll stirs it, and it regroups when the page comes to rest. As the hero leaves, its cubes join the field across the rest of the page, and scrolling back pulls them home.
- **Cursor**: the swarm parts around the pointer, the formation leans toward it, and hairlines link the pointer to the cubes nearby. A finger does the same on touch screens.
- **Where**: on desktop, the cloud sits on the hero's exact centre. It almost vanishes behind the lines of text and the stats, and shows through the portrait's see-through panel, dimmed. On phones, it forms a wide halo around the round avatar.
- **Off**: not rendered off home, stopped in hidden tabs, and still under reduced motion.

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

Loading screens, scroll-jacking, smooth-scroll libraries, pinned sections, parallax on text, typewriter effects, word-by-word staggers, WebGL, and a second ambient piece on the same page.

## Adding motion

- Decide which kind it is (rule 2). If it's ambient, it replaces the swarm.
- Reach for an existing token and an existing component first.
- If it loops, gate it (rule 5). If it is driven by JS, check `prefersReducedMotion()` and render the end state.
- If it follows scroll or the pointer, scrub or ease it: it must undo itself when you go back.
- Check it in EN and AR, light and dark, at 390px, with reduced motion on, and with a keyboard.
