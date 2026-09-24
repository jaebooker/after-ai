# After AI

An interactive field guide to twelve possible AI futures, with a five-question values compass, a scenario atlas, and source notes.

Live site: https://after-ai-futures.jb126.chatgpt.site

## Run locally

Use Node.js 22.13 or newer (Node.js 24 recommended).

```sh
npm ci
npm run build
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_public_votes.sql
npm run dev
```

Open the local URL printed by the development server.
Apply the SQL migration only once per local database. Sites applies production migrations on deployment.

```sh
npm run build
```

The site uses React, TypeScript, Vinext/Vite, Tailwind CSS, and Base UI components. The generated deployment output targets Cloudflare Workers through Sites.

## Main files

- `app/page.tsx`: interface, values journey, and scenario panels
- `app/futures.ts`: scenario content, questions, and matching logic
- `app/public-vote.tsx`: optional ballot and aggregate results
- `app/api/votes/route.ts`: anonymous voting API with D1 persistence
- `drizzle/0000_public_votes.sql`: database schema and unique voter constraint
- `app/regal.css`: navy, ivory, and gold theme
- `app/globals.css`: visual design and responsive styles
- `app/layout.tsx`: metadata and fonts
- `public/future-city.webp`: original AI-generated illustration
- `.openai/hosting.json`: existing Sites project association; contains no credentials

Values matching is an editorial reflection tool, not a forecast or a validated psychological assessment. Answers remain in page memory and are cleared on reload.

## Public voting

The separate optional ballot stores only a SHA-256 hash of a random browser identifier and the selected scenario in D1. An HttpOnly, SameSite cookie remembers the browser for up to one year (Secure on HTTPS). No quiz answers, names, emails, or IP addresses are stored by the voting application. Hosting infrastructure may maintain its own request logs.

One database row per identifier and an atomic upsert prevent repeated or concurrent submissions from inflating totals. Visitors can change or remove their vote. This is best-effort browser deduplication, not verified unique people: clearing cookies, private browsing, other devices, and deliberate automated submissions can bypass it. Results are labelled as voluntary visitor votes, not representative public opinion. No historical FLI data is mixed in.

With a local preview running, run `VOTE_TEST_URL=http://localhost:3001 node tests/votes.mjs` (substitute its printed port). The integration test checks repeat/concurrent votes, updates, cookie persistence, separate browsers, validation, cross-origin writes, and deletion, then removes its test votes. It refuses non-local hosts.

## Sources and inspiration

- [Future of Life Institute: AI Aftermath Scenarios](https://futureoflife.org/ai/ai-aftermath-scenarios/), summarizing Max Tegmark’s *Life 3.0*
- [Thore Husfeldt’s aftermath map](https://thorehusfeldt.com/2018/05/25/superintelligence-in-sf-part-iii-aftermaths/)
- [Tomorrow’s AI](https://www.tomorrows-ai.org/)
- [OECD AI Principles](https://www.oecd.org/en/topics/ai-principles.html)
- [UNESCO Recommendation on AI Ethics](https://www.unesco.org/en/artificial-intelligence/recommendation-ethics)
- [Taking AI Welfare Seriously](https://arxiv.org/abs/2411.00986)

Independent project; not affiliated with or endorsed by these organizations.
