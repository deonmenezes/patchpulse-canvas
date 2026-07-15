# PatchPulse Canvas

A local-first security release readiness planner for small software teams. Define a response owner, release date, dependency watch surface, and honest operational checks; PatchPulse turns them into a weighted readiness pulse and a five-stage drill timeline.

**Live app:** https://patchpulse-canvas.vercel.app

## Why now

On July 14, 2026, the Next.js team announced on X that future security releases will be announced ahead of time. Its primary-source post explains that a formal process is intended to make these releases more predictable. Predictability creates a new coordination opportunity: teams can rehearse patch intake before disclosure day rather than only automate dependency updates afterward.

Sources:

- [Next.js announcement on X](https://x.com/nextjs/status/2077110668881527123)
- [Next.js Security Release and Our Next Patch Release](https://nextjs.org/blog/next-security-release-program)

## What it does

- Builds a local-only release contract with an owner and 2–48 hour response window
- Scores five concrete readiness checks with transparent weights
- Produces a UTC drill from inventory lock through post-release verification
- Deduplicates and displays the framework/package watch surface
- Saves the canvas in browser storage and copies a Markdown handoff plan
- Handles missing dependencies, clipboard failure, and invalid stored data

## Existing-solutions preflight

[Renovate](https://github.com/renovatebot/renovate) and [Dependabot Core](https://github.com/dependabot/dependabot-core) are mature, actively maintained tools for creating dependency update PRs. PatchPulse does not duplicate that automation. It complements it by helping a small team decide ownership, rehearse tests and rollback, and set a human response window before a coordinated security release.

No account, API key, backend, or paid service is required. Canvas data never leaves the browser.

## Development

```bash
npm test
npm run check
npm run build
```

The production build is emitted to `dist/` and can be served by any static host.

## Architecture

The app uses semantic HTML, responsive CSS, and small ES modules. Planner calculations live in `src/planner.js` so scoring, normalization, timeline generation, and Markdown export can be tested without a browser.

## License

MIT
