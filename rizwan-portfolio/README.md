# rizwan-portfolio

Portfolio for an Operations & Administration Manager. React 18 + Vite, plain CSS, no animation libraries.

```bash
npm install
npm run dev      # local dev
npm run build    # production build in dist/
```

## Editing content

All text, numbers and images live in `src/data/content.js`: profile, stats, about,
experience, projects, events, testimonials and contact. Replace the dummy data there;
no component changes needed.

Images: put files in `public/images/` and reference them as `'/images/name.jpg'`.
An empty string shows the neutral placeholder.

## Design notes

- Apple-style system typography (SF Pro on Apple devices, Inter elsewhere), neutral
  surfaces, one accent colour, automatic light/dark mode.
- Motion is limited to opacity and short translations (fade + 16px rise on scroll,
  0.6s ease). It is fully disabled under `prefers-reduced-motion`.
- The contact form currently opens the visitor's mail app (`mailto:`); swap for
  EmailJS/Formspree when going live.
