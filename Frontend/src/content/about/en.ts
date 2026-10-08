// Blueprint 05 (prosa por idioma) y 15 F9: traducción de es.ts. Debe cumplir AboutProse, igual que
// es.ts. Borrador de traducción: lo revisa César (o un hablante nativo) en F9.
import type { AboutProse } from '../schema'

export const en = {
  intro: [
    'I am a software engineer and I have worked at Brandex since July 2025. I build business systems: I design their architecture, implement them and care about how they are secured and how they fail.',
  ],
  principles: [
    {
      title: 'AI-assisted, human-directed engineering',
      body: 'I work with AI assistance to propose alternatives and to draft; the decisions, their validation and the responsibility are mine. This portfolio is also designed with AI agents.',
    },
    {
      title: 'A boundary has to be enforced',
      body: 'When I separate modules, the boundary is not left to convention: architecture tests that run in CI enforce it.',
    },
    {
      title: 'If the migration does not run in CI, production is the test',
      body: 'A deploy stopped coming up even though the tests passed, because none of them touched real SQL. I diagnosed it and added a CI gate that applies every migration to a clean Postgres.',
    },
    {
      title: 'Fixing the symptom twice is the signal to fix the cause',
      body: 'The first time a third-party image stopped being available, the registry was switched. When it happened again, I worked out that the authorization error was not about permissions but that the repository no longer existed, and I removed the dependency by mirroring the image in a registry of our own.',
    },
    {
      title: 'What is designed is not presented as done',
      body: 'If part of a design never made it into the code, I present it as designed and not implemented.',
    },
  ],
} satisfies AboutProse
