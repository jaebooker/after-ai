# After AI

An interactive field guide to twelve possible AI futures, built as one guided flow: a six-question values compass, your three closest futures, then a vote for the future you would choose. The scenario atlas and the method notes open on request.

Hosted on Vercel (project `after-ai`), with anonymous survey and vote data in Neon Postgres.

## Run locally

Use Node.js 22.13 or newer (Node.js 24 recommended). Point `DATABASE_URL` at any Postgres database; tables are created automatically on first request.

```sh
npm ci
DATABASE_URL=postgres://user:pass@localhost:5432/after_ai npm run dev
```

The site uses Next.js, React, TypeScript, Tailwind CSS, and Base UI components. Pushes to `main` deploy to Vercel automatically.

## Main files

- `app/page.tsx`: interface, values journey, and scenario panels
- `app/futures.ts`: scenario content, questions, and matching logic
- `app/survey-compare.tsx`: optional answer sharing and comparison with other visitors
- `app/public-vote.tsx`: optional ballot and aggregate results
- `app/api/survey/route.ts`: anonymous survey API
- `app/api/votes/route.ts`: anonymous voting API
- `lib/server.ts`: Postgres pool, schema, and anonymous visitor identity
- `app/regal.css`: navy, ivory, and gold theme
- `app/globals.css`: visual design and responsive styles
- `app/layout.tsx`: metadata and fonts
- `public/future-city.webp`: original AI-generated illustration

Values matching is an editorial reflection tool, not a forecast or a validated psychological assessment. Answers remain in page memory unless the visitor chooses to share them.

## Compass questions

Six values: agency, distribution, pluralism, development ambition, continuity, and oversight (who checks the ones in charge). Oversight was added after launch. Responses saved before it are marked `v = 1` in `survey_responses` and are left out of the question-six totals, so their missing answer is not counted as "unsure". The columns are added automatically on first request.

## Survey sharing

After finishing the compass, visitors can share their six answers. The server stores the answers (-1, 0, 1, or null for unsure) and the closest match computed from them, keyed by the same hashed browser identifier as the ballot. Each browser has one response; sharing again replaces it, and visitors can remove it. Once shared, the visitor sees for each question how all responses split and what percentage answered as they did, plus the distribution of closest matches. The same deduplication limits described below apply.

## Public voting

The ballot is the last step of the flow, after the results. It stores only a SHA-256 hash of a random browser identifier and the selected scenario in Postgres. An HttpOnly, SameSite cookie remembers the browser for up to one year (Secure on HTTPS). No names, emails, or IP addresses are stored; quiz answers are stored only if the visitor shares them. Hosting infrastructure may maintain its own request logs.

One database row per identifier and an atomic upsert prevent repeated or concurrent submissions from inflating totals. Visitors can change or remove their vote. This is best-effort browser deduplication, not verified unique people: clearing cookies, private browsing, other devices, and deliberate automated submissions can bypass it. Results are labelled as voluntary visitor votes, not representative public opinion. No historical FLI data is mixed in.

With a local server running, run `VOTE_TEST_URL=http://localhost:3001 node tests/votes.mjs` and `node tests/survey.mjs` with the same variable (substitute its printed port). The vote integration test checks repeat/concurrent votes, updates, cookie persistence, separate browsers, validation, cross-origin writes, and deletion, then removes its test votes. It refuses non-local hosts.

## Sources and inspiration

- [Future of Life Institute: AI Aftermath Scenarios](https://futureoflife.org/ai/ai-aftermath-scenarios/), summarizing Max Tegmark’s *Life 3.0*
- [Thore Husfeldt’s aftermath map](https://thorehusfeldt.com/2018/05/25/superintelligence-in-sf-part-iii-aftermaths/)
- [Tomorrow’s AI](https://www.tomorrows-ai.org/)
- [OECD AI Principles](https://www.oecd.org/en/topics/ai-principles.html)
- [UNESCO Recommendation on AI Ethics](https://www.unesco.org/en/artificial-intelligence/recommendation-ethics)
- [Taking AI Welfare Seriously](https://arxiv.org/abs/2411.00986)

Independent project; not affiliated with or endorsed by these organizations.
