# After AI

An interactive field guide to twelve possible AI futures, with a five-question values compass, a scenario atlas, and source notes.

Live site: https://after-ai-futures.jb126.chatgpt.site (private access)

## Run locally

Use Node.js 22.13 or newer (Node.js 24 recommended).

```sh
npm ci
npm run dev
```

Open the local URL printed by the development server.

```sh
npm run build
```

The site uses React, TypeScript, Vinext/Vite, Tailwind CSS, and Base UI components. The generated deployment output targets Cloudflare Workers through Sites.

## Main files

- `app/page.tsx`: interface, values journey, and scenario panels
- `app/futures.ts`: scenario content, questions, and matching logic
- `app/globals.css`: visual design and responsive styles
- `app/layout.tsx`: metadata and fonts
- `public/future-city.webp`: original AI-generated illustration
- `.openai/hosting.json`: existing Sites project association; contains no credentials

Values matching is an editorial reflection tool, not a forecast or a validated psychological assessment. Answers remain in page memory and are cleared on reload.

## Sources and inspiration

- [Future of Life Institute: AI Aftermath Scenarios](https://futureoflife.org/ai/ai-aftermath-scenarios/), summarizing Max Tegmark’s *Life 3.0*
- [Thore Husfeldt’s aftermath map](https://thorehusfeldt.com/2018/05/25/superintelligence-in-sf-part-iii-aftermaths/)
- [Tomorrow’s AI](https://www.tomorrows-ai.org/)
- [OECD AI Principles](https://www.oecd.org/en/topics/ai-principles.html)
- [UNESCO Recommendation on AI Ethics](https://www.unesco.org/en/artificial-intelligence/recommendation-ethics)
- [Taking AI Welfare Seriously](https://arxiv.org/abs/2411.00986)

Independent project; not affiliated with or endorsed by these organizations.
