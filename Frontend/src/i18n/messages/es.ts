// Mensajes de interfaz en español. Este archivo define la forma: en.ts debe cumplirla o no compila
// (05, verificación 9). Los textos de contenido (casos, ensayos) no van aquí sino en content/.
// Interpolación: `{nombre}` se reemplaza con el parámetro del mismo nombre en t().

export const es = {
  a11y: {
    skipToContent: 'Saltar al contenido',
  },
  nav: {
    label: 'Principal',
    menu: 'Menú',
    home: 'Inicio',
    work: 'Trabajo',
    security: 'Seguridad',
    judgment: 'Criterio',
    about: 'Sobre mí',
    contact: 'Contacto',
    cyberOps: 'Cyber Ops',
    architecture: 'Cómo está hecho este sitio',
  },
  language: {
    label: 'Idioma',
    // Cada idioma se nombra en su propio idioma, con su `lang` (WCAG 3.1.2).
    es: 'Español',
    en: 'English',
  },
  theme: {
    toLight: 'Cambiar a tema claro',
    toDark: 'Cambiar a tema oscuro',
  },
  // Título y descripción de cada página fija (12, "Patrones de título" y "de descripción"). La
  // descripción mide 110–160 caracteres, en primera persona y sin números (lo verifica seo/meta.test.ts).
  // Home no tiene título propio: su patrón es `Cesar Acosta | {rol}` y el rol vive en content/site.ts.
  pages: {
    home: {
      description:
        'Portafolio de Cesar Acosta, desarrollador de software: casos de estudio, un laboratorio de seguridad, ensayos de criterio y cómo está hecho este sitio.',
    },
    work: {
      title: 'Casos de estudio',
      description:
        'Casos de estudio de sistemas que construí: el problema, las decisiones técnicas, lo que costaron y lo que aprendí en cada uno.',
    },
    securityHub: {
      title: 'Seguridad',
      description:
        'Cómo trato la seguridad: como disciplina de diseño en los sistemas que construyo y como práctica blue team en un laboratorio propio.',
    },
    securityLab: {
      title: 'Wazuh SOC Lab',
      description:
        'Wazuh SOC Lab, mi laboratorio personal de detección, contado por capítulos: qué ejecuté, la evidencia de cada paso y lo que no hice.',
    },
    judgment: {
      title: 'Criterio de ingeniería',
      description:
        'Ensayos breves sobre criterio de ingeniería: una afirmación, el contexto en que la aprendí y en qué casos estaría equivocada.',
    },
    cyberOpsHub: {
      title: 'Cyber Ops: un juego de seguridad',
      description:
        'Cyber Ops es un juego de seguridad en el navegador: misiones cortas sobre firewall, detección y recuperación, todas con datos simulados.',
    },
    cyberOpsFirewall: {
      title: 'Cyber Ops · Misión 01: Firewall',
      description:
        'Misión de Cyber Ops sobre firewall: revisar el tráfico que llega a un sistema ficticio y bloquear la entrada que no se valida. Datos simulados.',
    },
    cyberOpsDetection: {
      title: 'Cyber Ops · Misión 02: Detección',
      description:
        'Misión de Cyber Ops sobre detección: encontrar una intrusión en los registros de un sistema ficticio e investigarla. Datos simulados.',
    },
    cyberOpsRecovery: {
      title: 'Cyber Ops · Misión 03: Recuperación',
      description:
        'Misión de Cyber Ops sobre recuperación: un servicio ficticio cae por un cambio razonable y hay que diagnosticarlo y recuperarlo. Datos simulados.',
    },
    cyberOpsEnding: {
      title: 'Cyber Ops: cierre',
      description:
        'Cierre de Cyber Ops: qué muestra cada misión sobre cómo fallan los sistemas y dónde ver el trabajo real, en el laboratorio y en los casos.',
    },
    about: {
      title: 'Sobre mí',
      description:
        'Quién soy como desarrollador de software: los pilares de mi trabajo, una línea de tiempo con proyectos reales y los principios con los que trabajo.',
    },
    contact: {
      title: 'Contacto',
      description:
        'Cómo contactarme: correo y perfiles profesionales, y el CV para descargar en español o en inglés, con mi ubicación y zona horaria.',
    },
    architecture: {
      title: 'Cómo está hecho este sitio',
      description:
        'Cómo está hecho este sitio: arquitectura estática, decisiones registradas en ADRs, calidad medida con fecha y lo que viene después.',
    },
  },
  // Página bilingüe de `/` (12): su descripción une la de ambos idiomas.
  rootIndex: {
    description: 'Portafolio de Cesar Acosta, desarrollador de software. Elige español o inglés.',
  },
  page: {
    underConstruction: 'Esta página está en construcción.',
  },
  notFound: {
    title: 'Página no encontrada',
    body: 'Esta dirección no existe en el sitio. Puedes seguir por el inicio, el trabajo o el contacto.',
    exits: 'Salidas',
  },
  error: {
    title: 'Algo salió mal',
    body: 'No se pudo mostrar esta página. El resto del sitio sigue funcionando.',
    home: 'Volver al inicio',
  },
  // Contrato de autenticidad (00): las etiquetas siempre son texto visible.
  existence: {
    real: 'Real',
    experiment: 'Experimento',
    planned: 'Planeado',
  },
  projectKind: {
    product: 'producto',
    lab: 'lab',
    spike: 'spike',
  },
  confidentiality: {
    public: 'Público',
    sanitized: 'Sanitizado',
  },
  metricSource: {
    measured: 'Medido',
    repository: 'Del repositorio',
    simulated: 'Simulado',
  },
  caseStudy: {
    inThirtySeconds: 'En 30 segundos',
    onThisPage: 'En esta página',
    // Una etiqueta por CaseSectionId (06); un test de tipos verifica que coincidan.
    sections: {
      context: 'Contexto',
      problem: 'Problema',
      role: 'Rol',
      constraints: 'Restricciones',
      architecture: 'Arquitectura',
      decisions: 'Decisiones técnicas',
      tradeoffs: 'Trade-offs',
      security: 'Seguridad',
      'failure-modes': 'Failure modes',
      implementation: 'Implementación',
      result: 'Resultado',
      lessons: 'Lecciones',
    },
    // Cabecera de metadatos (06 §Anatomía; 03 MetaList).
    meta: {
      role: 'Rol',
      period: 'Periodo',
      team: 'Equipo',
      stack: 'Stack',
      reading: 'Lectura',
    },
    readingTime: '{minutes} min',
    sanitizedNote:
      'Caso sanitizado: sin clientes, datos de negocio, infraestructura identificable ni nombres de personas.',
    // Formato de una decisión (06).
    decision: {
      context: 'Contexto',
      options: 'Opciones',
      choice: 'Elección',
      cost: 'Costo',
      repeat: '¿Lo repetiría?',
      adr: 'ADR',
    },
    // Una etiqueta por RepeatAnswer (content/schema.ts); un test de tipos verifica que coincidan.
    repeat: {
      yes: 'Sí',
      no: 'No',
      nuanced: 'Con matices',
    },
    // Columnas de la tabla de failure modes (06).
    failureModes: {
      caption: 'Fallas con mitigación en el código: cómo se detectan, su impacto y el riesgo que queda',
      failure: 'Falla',
      detection: 'Cómo se detecta',
      impact: 'Impacto',
      mitigation: 'Mitigación implementada',
      residual: 'Riesgo residual',
    },
    // Fuente visible de cada número (06 §Resultado sin métricas inventadas).
    metric: {
      repository: 'contado el {date}.',
      measured: 'medido con {tool} el {date}.',
    },
    // Cierre de un caso (02 §CTAs: siguiente caso, ensayo relacionado, contactar).
    closing: 'Siguiente paso',
    next: 'Siguiente caso: {title}',
    allCases: 'Ver todos los casos',
    contact: 'Contactar',
  },
  // Diagramas (03 §Diagramas): alternativa textual, panel y tipos de nodo.
  diagram: {
    textAlternative: 'Ver el diagrama como texto',
    components: 'Componentes',
    connections: 'Conexiones',
    boundaries: 'Fronteras',
    controls: 'Controles de seguridad',
    hint: 'Pasa el puntero, enfoca o toca un componente para ver qué hace.',
    edge: 'De {from} a {to}',
    note: 'Redibujado a nivel lógico, sin infraestructura identificable.',
    // Una etiqueta por DiagramNodeKind (content/schema.ts); un test de tipos verifica que coincidan.
    kinds: {
      client: 'Cliente',
      edge: 'Borde',
      service: 'Servicio',
      datastore: 'Almacén de datos',
      queue: 'Cola de eventos',
      external: 'Externo',
      observability: 'Observabilidad',
      config: 'Configuración declarativa',
      step: 'Paso',
      event: 'Evento',
      outcome: 'Resultado',
    },
  },
  // Índice de casos (02 §Work: cada fila con nombre, tipo, rol, periodo, etiquetas y el problema).
  work: {
    cases: 'Casos y labs',
    role: 'Rol',
    period: 'Periodo',
  },
  code: {
    copy: 'Copiar',
    copied: 'Copiado',
  },
  footer: {
    label: 'Enlaces del sitio',
    updated: 'Actualizado el {date}',
  },
  // Los cuatro pilares (01). Un test de tipos verifica que coincidan con Pillar de content/schema.ts.
  pillars: {
    engineering: 'Ingeniería',
    security: 'Seguridad',
    leadership: 'Liderazgo técnico',
    'business-systems': 'Sistemas de negocio',
  },
  // Home (02 §Home, bloques 1–6; CTAs de 02 §CTAs, sin flechas). Cyber Ops: 09 §10.1, sin duración.
  home: {
    ctaWork: 'Ver casos',
    ctaLab: 'Explorar el Security Lab',
    featured: 'Trabajo seleccionado',
    thinking: 'Cómo pienso',
    thinkingMore: 'Leer los ensayos',
    cyberOpsBody:
      'Un juego corto sobre cómo fallan los sistemas. Cada misión muestra un modo de falla: una entrada que no se valida, una intrusión que hay que encontrar en los registros y un servicio que cae por un cambio razonable. Todos los datos son simulados.',
    cyberOpsCta: 'Jugar Cyber Ops',
    contactCta: 'Ir a la página de contacto',
  },
  timeline: {
    title: 'Trayectoria',
    since: 'Desde {date}',
    more: 'Ver la trayectoria completa',
  },
  // About (02 §About; CTAs: Descargar CV y Contactar).
  about: {
    role: 'Cargo y responsabilidades',
    formalTitle: 'Cargo formal',
    responsibilities: 'Responsabilidades',
    pillars: 'Pilares',
    evidence: 'Evidencia',
    principles: 'Cómo trabajo',
    education: 'Formación',
    selectedWork: 'Ver el trabajo para clientes (Selected Work)',
    cv: 'Descargar CV (PDF)',
    contact: 'Contactar',
  },
  // Contact (02 §Contact).
  contact: {
    email: 'Correo',
    profiles: 'Perfiles',
    cv: 'CV',
    cvEs: 'CV en español (PDF)',
    cvEn: 'CV en inglés (PDF)',
    location: 'Ubicación y zona horaria',
    availability: 'Disponibilidad',
    roleSought: 'Qué rol busco',
  },
} as const

/** Misma forma que `es`, con cada texto como `string`. */
export type DeepStringify<T> = { [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]> }

export type Messages = DeepStringify<typeof es>
