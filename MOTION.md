# Motion

Motion on moiez.dev has two jobs. **Most of it explains**: it shows how a system works, confirms that an action happened, or keeps you oriented when the page changes. **One piece sets the tone**: the nano forge in the home hero. It's a few thousand machined metal cubes, rendered in real 3D, strung together by hairlines, that keep flying apart and re-assembling into a new shape. Once they're in place they fuse into the real, smooth solid of that shape. It answers the cursor and scroll. It's the site's signature, so it gets a strict budget, and nothing else on the site gets to be decoration.

## The rules

### 1. Content first, always

- Every page renders complete on first paint, in prerendered HTML, with no JavaScript. Motion only ever enhances what is already there.
- An element is hidden for a reveal only when it is fully below the fold *and* the browser can observe it.
- Text never moves for effect. There's no parallax, typewriter or word-by-word stagger on copy. Text is placed once and stays put.
- Ambient motion gets its own space and never sits behind text. The nano forge lives in a stage beside the hero copy (above it on phones), so nothing has to be dimmed for the copy to stay readable. The rest of the page has no background animation.

### 2. Two kinds of motion

| | Functional | Ambient (signature) |
| --- | --- | --- |
| Purpose | explain, confirm, orient | set the tone |
| Examples | reveals, view transitions, the architecture explainer, button feedback | the home nano forge |
| How many | as many as a page needs | **one per page, at most**: today only on home |
| Triggered by | the user, or entering the viewport | time, scroll and the cursor |
| May loop? | only while on screen (rule 5) | yes, while on screen (rule 5) |

A new ambient piece replaces the forge. It isn't added next to it.

### 3. The signature is live: it answers scroll and the cursor

- **Scroll**: the shape turns as you scroll, breaks back into cubes, and blows apart into shrinking debris as the hero leaves. Scrolling back reassembles it.
- **Cursor**: hover only. The pointer never turns or tilts the shape. Hovering the stage peels about 15% of the standing solid back into loose cubes, in big patches, and loose cubes near the pointer part and glow. On touch screens a finger does the same while it's down. Device tilt isn't used, because iOS would need a permission prompt for it.
- Every response is **scrubbed or eased**: it's a function of where the scroll or pointer is now, so going back undoes it. Nothing is triggered once and left half-finished.
- Responses are gentle. Nothing jumps, flashes, or follows the pointer across the page.
- No scroll-jacking, no smooth-scroll libraries, no pinned sections. The page always scrolls at the speed you scroll it.

### 4. Cheap to run

- Animate `transform` and `opacity` in the DOM. Three deliberate exceptions remain: `stroke-dashoffset` and `offset-path` in the architecture explainer, and the circular `clip-path` theme reveal on the View Transition snapshot.
- Anything heavier goes on **one** `<canvas>`. The nano forge is the one WebGL piece: WebGL2, no library, a handful of draws per frame (the floor shadow, drawn at quarter size and blurred, then the solid, one instanced cube mesh, and one pass of hairlines that reuses the cubes' maths). Every shape and solid is precomputed, and the whole morph runs in the vertex shader, so the CPU only updates a few uniforms per frame. It's 2,648 cubes on desktop and 1,178 on phones and small or low-core devices, with the device pixel ratio capped at 2 (1.5 on phones). If the first 4 seconds run slow, it drops to 1x once.
- Ambient code loads after first paint (`requestIdleCallback` plus a dynamic `import()`), so it never competes with the LCP image.
- No animation library. The whole system is plain CSS, the Web Animations API, a few small hooks and one canvas engine.
- Without WebGL2 the stage keeps its static glow. Nothing else depends on it.
- Botfolio's avatar (`components/chatbot/RobotAvatar.jsx`) is the one other canvas: a tiny raymarched ball of the same liquid metal as the forge's blob (white on dark, black on light). It ripples slowly at rest, churns faster while thinking and swells unevenly while speaking. One full-screen triangle per frame at avatar size; only one avatar is on screen at a time. With reduced motion it draws one still frame, and without WebGL2 it shows a shaded CSS sphere.

### 5. Nothing runs unseen

- Anything that repeats (the queue visual, gallery autoplay, the cursor's rAF) runs only while it is on screen and the tab is visible. Gate it with `usePauseWhenHidden`, or with an IntersectionObserver plus `visibilitychange` for rAF loops.
- The forge runs only while its stage is on screen (IntersectionObserver) and the tab is visible.
- Status pulses stop after 3 iterations.

### 6. Reduced motion is respected

With `prefers-reduced-motion: reduce`:

- every token duration becomes `0ms` and the reveal distance `0px`;
- JS-driven pieces render their final state. The forge draws one still, finished solid (the torus knot) and repaints it only when the theme changes;
- scroll- and cursor-linked effects are off;
- view transitions are skipped;
- the custom cursor is off.

### 7. Every input, both directions, both themes

- Each hover effect has a `:focus-visible` equivalent and doesn't depend on hover on touch.
- Directional motion (arrows, sliders, the segmented thumb, the queue, the forge's stage beside the copy) is mirrored in RTL.
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
| `nanoForge.js` | The forge engine: the shapes, their solids (rounded box, tubes, Möbius band, globe, the blob), the WebGL2 shaders and buffers, the metal look per theme, and a `step(t, dt)` that reads scroll and the pointer. Knows nothing about React or the DOM beyond its canvas. |

## The nano forge

`components/home/HeroStage.jsx` is the stage in the hero: beside the copy on desktop (mirrored in RTL), above it on phones. The prerendered HTML is only its glow. Once the browser is idle it loads the engine and adds one WebGL canvas, which fades in. The canvas is 1.5x the stage on every side and fades out softly towards its own edge (a radial mask), so loose cubes, the scroll scatter and the shadow never hit a hard cut. It takes no pointer events, and the copy sits above it.

- **Shapes**, in order: a liquid-metal blob (the forge opens on it), a cube, a torus knot, a Möbius loop, a planet with a belt of orbiting debris, and a double helix (1.5 turns, 9 rungs). Every cube has a place in every shape. Only the planet's globe fuses: its ring stays a belt of loose cubes of mixed sizes that orbit it, inner ones faster, and turn slowly. While the planet stands the shape itself stops turning, so only the ring moves. The solid cube has softly rounded edges and corners. The blob is the one living solid: the same metal as the rest, glossier, staying close to a sphere while it gently ripples, sways and pushes out small bulges, all displaced in the vertex shader. It also forms differently from the rest: its cubes first close into a ball, then liquid leaks out of it at scattered spots, one after another, and the puddles spread with wavering, swollen edges and run together until the ball is coated and the cubes and their strings are gone beneath it. Then it settles into the blob. Breaking up runs the same steps backwards.
- **A cycle (12.7s)**: the standing solid breaks up into its cubes in patches (1.2s). The cubes fly to the next shape, built from the core outwards (4s): each one travels almost straight, without tumbling, and stays square to the grid, so the shape simply comes apart and goes back together. Then they fuse into that shape's smooth solid, which grows over them in patches with a glowing edge (1.5s), and the solid holds (6s). There's no scan line or sweep.
- **Strings**: while cubes are loose, each is linked by hairlines to a few neighbours in the same part of the shape. Separate parts are never strung together: the planet's globe and ring, and the helix's two strands and its rungs, each keep their own strings. Lines that stretch too far fade out, and they're gone once the solid stands.
- **Shadow**: the shape casts a soft shadow on an unseen floor below it, flattened from its real silhouette. There's no caption or pedestal. In dark mode the shadow is faint by nature.
- **Scroll**: the shape turns with scroll position, and blows apart into shrinking debris as the hero leaves. It's scrubbed, so scrolling back rebuilds it.
- **Cursor**: hover only. The pointer never turns or tilts the shape. Hovering the stage peels about 15% of the solid back into smaller cubes, which drift out a little and are strung together. Each opening reads as a dent: its inner wall is in shadow, and a little below the skin the inside is packed with small cubes of mixed sizes, a matrix rather than a hollow shell. It closes up again when the pointer leaves. The patches come from an integer-hash noise shared by the shaders and JS, so the packed cubes are placed under exactly the patches that can open. A finger does the same while it's down.
- **Off**: only on home, stopped when the stage is off screen or the tab is hidden, and one still shape under reduced motion.

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
