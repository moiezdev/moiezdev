# Motion

Motion on moiez.dev explains things. It shows how a system works, confirms that an action happened, or keeps you oriented when the page changes. If an animation does none of these, it isn't added.

## Principles

1. **Content first.** Every page renders complete on first paint, in prerendered HTML, with no JavaScript. Animation only ever enhances what is already there: an element is hidden for a reveal only when it is fully below the fold *and* the browser can observe it.
2. **Compositor only.** We animate `transform` and `opacity`. There are three deliberate exceptions:
   - `stroke-dashoffset` and `offset-path` in the architecture explainer;
   - the circular `clip-path` theme reveal, which runs on the View Transition snapshot only.
3. **One vocabulary.** Every duration and easing comes from the tokens below. No ad-hoc `300ms` values.
4. **Reduced motion is respected.** With `prefers-reduced-motion: reduce`:
   - every token duration becomes `0ms` and the reveal distance `0px`;
   - JS-driven pieces render their final state;
   - view transitions are skipped;
   - the custom cursor is off.
5. **No idle loops.** Anything that repeats (the queue visual, gallery autoplay, the cursor's rAF) runs only while it is on screen and the tab is visible. Status pulses stop after 3 iterations.
6. **Every input gets the effect.** Each hover effect has a `:focus-visible` equivalent and doesn't depend on hover on touch. Directional motion (arrows, sliders, the segmented thumb, the queue) is mirrored in RTL.
7. **Light by design.** No animation library. The whole system is plain CSS, the Web Animations API and a few small hooks.

**Not used:** loading screens, scroll-jacking, smooth-scroll libraries, parallax on text, typewriter effects, word-by-word staggers, cursor-reactive backgrounds.

## Tokens (`src/motion/tokens.css`, `src/motion/tokens.js`)

| Token | Value | Use |
| --- | --- | --- |
| `--dur-fast` | 150ms | presses, tooltips, highlights |
| `--dur-base` | 250ms | reveals, menus, state changes |
| `--dur-slow` | 400ms | page/theme transitions, flips, hops |
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

## Each piece, and what it proves

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

## Adding motion

- Reach for an existing token and an existing component first.
- If it loops, gate it with `usePauseWhenHidden`.
- If it is driven by JS, check `prefersReducedMotion()` and render the end state.
- Check it in EN and AR, light and dark, at 390px, with reduced motion on, and with a keyboard.
