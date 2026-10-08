import type { Messages } from './es'

// Debe cumplir la forma de es.ts: una clave faltante o sobrante no compila (05, verificación 9).
// Los marcadores `{nombre}` deben ser los mismos que en español (lo verifica i18n.test.ts).
export const en = {
  a11y: {
    skipToContent: 'Skip to content',
  },
  nav: {
    label: 'Main',
    menu: 'Menu',
    home: 'Home',
    work: 'Work',
    security: 'Security',
    judgment: 'Judgment',
    about: 'About',
    contact: 'Contact',
    cyberOps: 'Cyber Ops',
    architecture: 'How this site is built',
  },
  language: {
    label: 'Language',
    es: 'Español',
    en: 'English',
  },
  theme: {
    toLight: 'Switch to light theme',
    toDark: 'Switch to dark theme',
  },
  pages: {
    home: {
      description:
        'Portfolio of Cesar Acosta, software engineer: case studies, a security lab, essays on engineering judgment and how this site is built.',
    },
    work: {
      title: 'Case studies',
      description:
        'Case studies of systems I built: the problem, the technical decisions, what they cost and what I learned from each one.',
    },
    securityHub: {
      title: 'Security',
      description:
        'How I approach security: as a design discipline in the systems I build and as blue team practice in a lab of my own.',
    },
    securityLab: {
      title: 'Wazuh SOC Lab',
      description:
        'Wazuh SOC Lab, my personal detection lab, told chapter by chapter: what I ran, the evidence for each step and what I did not do.',
    },
    judgment: {
      title: 'Engineering judgment',
      description:
        'Short essays on engineering judgment: a claim, the context in which I learned it and the cases in which it would be wrong.',
    },
    cyberOpsHub: {
      title: 'Cyber Ops: a security game',
      description:
        'Cyber Ops is a security game in the browser: short missions on firewall, detection and recovery, all of them with simulated data.',
    },
    cyberOpsFirewall: {
      title: 'Cyber Ops · Mission 01: Firewall',
      description:
        'Cyber Ops firewall mission: review the traffic reaching a fictional system and block the input that is not validated. Simulated data.',
    },
    cyberOpsDetection: {
      title: 'Cyber Ops · Mission 02: Detection',
      description:
        'Cyber Ops detection mission: find an intrusion in the logs of a fictional system and investigate it step by step. Simulated data.',
    },
    cyberOpsRecovery: {
      title: 'Cyber Ops · Mission 03: Recovery',
      description:
        'Cyber Ops recovery mission: a fictional service goes down after a reasonable change, and you diagnose and restore it. Simulated data.',
    },
    cyberOpsEnding: {
      title: 'Cyber Ops: debrief',
      description:
        'Cyber Ops debrief: what each mission shows about how systems fail, and where to see the real work, in the security lab and the case studies.',
    },
    about: {
      title: 'About',
      description:
        'Who I am as a software engineer: the pillars of my work, a timeline with real projects and the principles I work by.',
    },
    contact: {
      title: 'Contact',
      description:
        'How to reach me: email and professional profiles, plus my CV to download in Spanish or English, with my location and time zone.',
    },
    architecture: {
      title: 'How this site is built',
      description:
        'How this site is built: a static architecture, decisions recorded as ADRs, quality measured with dates and what comes next.',
    },
  },
  rootIndex: {
    description: 'Portfolio of Cesar Acosta, software engineer. Choose Spanish or English.',
  },
  page: {
    underConstruction: 'This page is under construction.',
  },
  notFound: {
    title: 'Page not found',
    body: 'This address does not exist on the site. You can continue from the home page, the work or the contact page.',
    exits: 'Ways out',
  },
  error: {
    title: 'Something went wrong',
    body: 'This page could not be displayed. The rest of the site still works.',
    home: 'Back to home',
  },
  existence: {
    real: 'Real',
    experiment: 'Experiment',
    planned: 'Planned',
  },
  projectKind: {
    product: 'product',
    lab: 'lab',
    spike: 'spike',
  },
  confidentiality: {
    public: 'Public',
    sanitized: 'Sanitized',
  },
  metricSource: {
    measured: 'Measured',
    repository: 'From the repository',
    simulated: 'Simulated',
  },
  caseStudy: {
    inThirtySeconds: 'In 30 seconds',
    onThisPage: 'On this page',
    sections: {
      context: 'Context',
      problem: 'Problem',
      role: 'Role',
      constraints: 'Constraints',
      architecture: 'Architecture',
      decisions: 'Technical decisions',
      tradeoffs: 'Trade-offs',
      security: 'Security',
      'failure-modes': 'Failure modes',
      implementation: 'Implementation',
      result: 'Result',
      lessons: 'Lessons',
    },
    meta: {
      role: 'Role',
      period: 'Period',
      team: 'Team',
      stack: 'Stack',
      reading: 'Reading time',
    },
    readingTime: '{minutes} min',
    sanitizedNote: 'Sanitized case: no clients, business data, identifiable infrastructure or names of people.',
    decision: {
      context: 'Context',
      options: 'Options',
      choice: 'Choice',
      cost: 'Cost',
      repeat: 'Would I do it again?',
      adr: 'ADR',
    },
    repeat: {
      yes: 'Yes',
      no: 'No',
      nuanced: 'With caveats',
    },
    failureModes: {
      caption: 'Failures with a mitigation in the code: how they are detected, their impact and the remaining risk',
      failure: 'Failure',
      detection: 'How it is detected',
      impact: 'Impact',
      mitigation: 'Implemented mitigation',
      residual: 'Residual risk',
    },
    metric: {
      repository: 'counted on {date}.',
      measured: 'measured with {tool} on {date}.',
    },
    closing: 'Next step',
    next: 'Next case: {title}',
    allCases: 'See all cases',
    contact: 'Get in touch',
  },
  diagram: {
    textAlternative: 'View the diagram as text',
    components: 'Components',
    connections: 'Connections',
    boundaries: 'Boundaries',
    controls: 'Security controls',
    hint: 'Hover, focus or tap a component to see what it does.',
    edge: 'From {from} to {to}',
    note: 'Redrawn at the logical level, with no identifiable infrastructure.',
    kinds: {
      client: 'Client',
      edge: 'Edge',
      service: 'Service',
      datastore: 'Data store',
      queue: 'Event queue',
      external: 'External',
      observability: 'Observability',
      config: 'Declarative configuration',
      step: 'Step',
      event: 'Event',
      outcome: 'Outcome',
    },
  },
  work: {
    cases: 'Cases and labs',
    role: 'Role',
    period: 'Period',
  },
  code: {
    copy: 'Copy',
    copied: 'Copied',
  },
  footer: {
    label: 'Site links',
    updated: 'Updated {date}',
  },
  pillars: {
    engineering: 'Engineering',
    security: 'Security',
    leadership: 'Technical leadership',
    'business-systems': 'Business systems',
  },
  home: {
    ctaWork: 'See the case studies',
    ctaLab: 'Explore the Security Lab',
    featured: 'Selected work',
    thinking: 'How I think',
    thinkingMore: 'Read the essays',
    cyberOpsBody:
      'A short game about how systems fail. Each mission shows one failure mode: input that is not validated, an intrusion you have to find in the logs and a service that goes down after a reasonable change. All the data is simulated.',
    cyberOpsCta: 'Play Cyber Ops',
    contactCta: 'Go to the contact page',
  },
  timeline: {
    title: 'Timeline',
    since: 'Since {date}',
    more: 'See the full timeline',
  },
  about: {
    role: 'Title and responsibilities',
    formalTitle: 'Formal title',
    responsibilities: 'Responsibilities',
    pillars: 'Pillars',
    evidence: 'Evidence',
    principles: 'How I work',
    education: 'Education',
    selectedWork: 'See the client work (Selected Work)',
    cv: 'Download CV (PDF)',
    contact: 'Get in touch',
  },
  contact: {
    email: 'Email',
    profiles: 'Profiles',
    cv: 'CV',
    cvEs: 'CV in Spanish (PDF)',
    cvEn: 'CV in English (PDF)',
    location: 'Location and time zone',
    availability: 'Availability',
    roleSought: 'Roles I am looking for',
  },
} satisfies Messages
