// Blueprint 07-current-projects/quantum-erp-rental.md §7 (diagramas Q1–Q3: nodos y aristas a nivel
// lógico, sin puertos, hosts, nombres de cabeceras ni claves) y §8 (los servicios agrupados por capa,
// nunca uno por uno), 03 §Diagramas y 05 (ArchitectureGraph). Redibujados desde datos tipados.
import type { ArchitectureGraph } from '../../schema'

/** Q1 · Vista de plataforma: la forma del sistema en 10 segundos. */
const platform: ArchitectureGraph = {
  id: 'platform',
  title: { es: 'Vista de la plataforma', en: 'Platform view' },
  description: {
    es: 'Un único punto de entrada, un runtime que resuelve y autoriza cada petición, motores de negocio que no se conocen entre sí y eventos por Redis Streams.',
    en: 'A single entry point, a runtime that resolves and authorizes every request, business engines that do not know about each other and events over Redis Streams.',
  },
  nodes: [
    {
      id: 'browser',
      label: { es: 'Navegador', en: 'Browser' },
      kind: 'client',
      description: {
        es: 'Aplicación React (SPA) que descubre desde el runtime los módulos disponibles.',
        en: 'React single-page app that discovers the available modules from the runtime.',
      },
    },
    {
      id: 'gateway',
      label: { es: 'Gateway', en: 'Gateway' },
      kind: 'edge',
      description: {
        es: 'Único punto de entrada: los servicios internos no publican sus puertos.',
        en: 'The single entry point: internal services do not expose their ports.',
      },
      controls: {
        es: ['Firma del token (JWT RS256)', 'Versión de sesión', 'Límite de peticiones por tenant'],
        en: ['Token signature (JWT RS256)', 'Session version', 'Per-tenant rate limit'],
      },
    },
    {
      id: 'modules',
      label: { es: 'Módulos YAML', en: 'YAML modules' },
      kind: 'config',
      description: {
        es: 'Módulos de negocio declarados en YAML, sin código propio: eventos, custodia, personalización, marketplace, servicios y portal interno. El runtime los carga.',
        en: 'Business modules declared in YAML, with no code of their own: events, custody, personalization, marketplace, services and the internal portal. The runtime loads them.',
      },
    },
    {
      id: 'runtime',
      label: { es: 'Runtime', en: 'Runtime' },
      kind: 'service',
      description: {
        es: 'Resuelve cada petición (módulo, motor, capability y contexto), aplica la autorización y orquesta la ejecución. Aloja el motor de workflows.',
        en: 'Resolves each request (module, engine, capability and context), applies authorization and orchestrates execution. It hosts the workflow engine.',
      },
      controls: {
        es: ['Aplica la autorización (PEP) en cada petición y en cada paso de workflow'],
        en: ['Enforces authorization (PEP) on every request and every workflow step'],
      },
    },
    {
      id: 'identity',
      label: { es: 'Identidad (PDP)', en: 'Identity (PDP)' },
      kind: 'service',
      description: {
        es: 'Fuente de verdad de identidad y autorización. Decide cada permiso con usuario, permiso y alcance.',
        en: 'Source of truth for identity and authorization. It decides every permission from user, permission and scope.',
      },
      controls: {
        es: [
          'Falla cerrado',
          'Contraseñas con Argon2id',
          'Refresh tokens como hash, con rotación y detección de reutilización',
        ],
        en: [
          'Fails closed',
          'Passwords with Argon2id',
          'Refresh tokens stored as hashes, with rotation and reuse detection',
        ],
      },
    },
    {
      id: 'context',
      label: { es: 'Contexto y organización', en: 'Context and organization' },
      kind: 'service',
      description: {
        es: 'Servicios de fundación que el runtime consulta para resolver cada petición.',
        en: 'Foundation services the runtime queries to resolve each request.',
      },
    },
    {
      id: 'engines',
      label: { es: 'Motores de negocio', en: 'Business engines' },
      kind: 'service',
      description: {
        es: 'Inventario, tienda, moneda, proyectos, creativo y organización. No se conocen entre sí: solo el runtime los invoca.',
        en: 'Inventory, store, currency, projects, creative and organization. They do not know about each other: only the runtime calls them.',
      },
    },
    {
      id: 'streams',
      label: { es: 'Redis Streams', en: 'Redis Streams' },
      kind: 'queue',
      description: {
        es: 'Bus de eventos entre servicios: consumer groups, confirmación después de procesar e idempotencia por id de evento.',
        en: 'Event bus between services: consumer groups, acknowledgement after processing and idempotency by event id.',
      },
    },
    {
      id: 'consumers',
      label: { es: 'Auditoría, notificaciones y analítica', en: 'Audit, notifications and analytics' },
      kind: 'service',
      description: {
        es: 'Servicios de plataforma que consumen eventos. Las notificaciones salen por un outbox con reintentos.',
        en: 'Platform services that consume events. Notifications go out through an outbox with retries.',
      },
    },
    {
      id: 'postgres',
      label: { es: 'PostgreSQL', en: 'PostgreSQL' },
      kind: 'datastore',
      description: {
        es: 'Una base de datos lógica por servicio, sobre una instancia de PostgreSQL. Cada servicio aplica sus propias migraciones.',
        en: 'One logical database per service, on a single PostgreSQL instance. Each service runs its own migrations.',
      },
    },
  ],
  edges: [
    { from: 'browser', to: 'gateway' },
    { from: 'gateway', to: 'runtime' },
    { from: 'modules', to: 'runtime', label: { es: 'carga', en: 'loads' } },
    { from: 'runtime', to: 'identity' },
    { from: 'runtime', to: 'engines', label: { es: 'despacho', en: 'dispatch' } },
    { from: 'runtime', to: 'context' },
    { from: 'engines', to: 'streams', label: { es: 'eventos', en: 'events' } },
    { from: 'streams', to: 'runtime' },
    { from: 'streams', to: 'consumers' },
    { from: 'engines', to: 'postgres' },
    { from: 'consumers', to: 'postgres' },
    { from: 'context', to: 'postgres' },
  ],
  boundaries: [
    {
      id: 'internal',
      label: { es: 'Red interna', en: 'Internal network' },
      nodes: ['gateway', 'modules', 'runtime', 'identity', 'context', 'engines', 'streams', 'consumers', 'postgres'],
    },
  ],
  layout: {
    grid: [
      [null, 'browser', null],
      [null, 'gateway', null],
      ['modules', 'runtime', 'identity'],
      ['engines', 'streams', 'context'],
      [null, 'consumers', null],
      ['postgres', 'postgres', 'postgres'],
    ],
    vertical: [
      'browser',
      'gateway',
      'runtime',
      'modules',
      'identity',
      'context',
      'engines',
      'streams',
      'consumers',
      'postgres',
    ],
  },
}

/** Q2 · Pipeline de ejecución: toda operación pasa por la misma autorización, con la rama de denegación. */
const pipeline: ArchitectureGraph = {
  id: 'pipeline',
  title: { es: 'Pipeline de ejecución', en: 'Execution pipeline' },
  description: {
    es: 'Cada operación recorre las mismas etapas y pasa por la misma autorización. Si el PDP deniega o no responde, la operación no se ejecuta.',
    en: 'Every operation goes through the same stages and the same authorization. If the PDP denies or does not respond, the operation does not run.',
  },
  nodes: [
    {
      id: 'request',
      label: { es: 'Petición', en: 'Request' },
      kind: 'client',
      description: {
        es: 'Una llamada del frontend. Los pasos de un workflow entran a este mismo pipeline.',
        en: 'A call from the frontend. Workflow steps enter this same pipeline.',
      },
    },
    {
      id: 'gateway',
      label: { es: 'Gateway', en: 'Gateway' },
      kind: 'edge',
      description: {
        es: 'Valida la firma del token, la versión de sesión y el límite de peticiones antes de dejar pasar la petición.',
        en: 'Validates the token signature, the session version and the rate limit before letting the request through.',
      },
    },
    {
      id: 'resolve',
      label: { es: 'Módulo, motor y capability', en: 'Module, engine and capability' },
      kind: 'step',
      description: {
        es: 'El runtime ubica el módulo declarado, el motor que lo atiende y la capability pedida.',
        en: 'The runtime finds the declared module, the engine that serves it and the requested capability.',
      },
    },
    {
      id: 'context',
      label: { es: 'Contexto', en: 'Context' },
      kind: 'step',
      description: {
        es: 'El runtime arma y propaga el contexto de la petición.',
        en: 'The runtime builds and propagates the request context.',
      },
    },
    {
      id: 'pep',
      label: { es: 'Autorización (PEP)', en: 'Enforcement (PEP)' },
      kind: 'step',
      description: {
        es: 'El runtime pide la decisión al PDP, con una caché de decisiones de vida corta. Si la caché falla, consulta al PDP: nunca permite ni niega por su cuenta.',
        en: 'The runtime asks the PDP for a decision, with a short-lived decision cache. If the cache fails, it queries the PDP: it never allows or denies on its own.',
      },
      controls: {
        es: ['Timeouts explícitos de conexión y de lectura', 'Credenciales por servicio para llamar al PDP'],
        en: ['Explicit connection and read timeouts', 'Per-service credentials to call the PDP'],
      },
    },
    {
      id: 'pdp',
      label: { es: 'Decisión (PDP)', en: 'Decision (PDP)' },
      kind: 'service',
      description: {
        es: 'El servicio de identidad combina usuario, permiso y alcance. Si no puede decidir, deniega.',
        en: 'The identity service combines user, permission and scope. If it cannot decide, it denies.',
      },
      controls: { es: ['Falla cerrado'], en: ['Fails closed'] },
    },
    {
      id: 'denied',
      label: { es: 'Denegada', en: 'Denied' },
      kind: 'outcome',
      description: {
        es: 'La operación no se ejecuta.',
        en: 'The operation does not run.',
      },
    },
    {
      id: 'model',
      label: { es: 'Modelo de ejecución', en: 'Execution model' },
      kind: 'step',
      description: {
        es: 'Directo: un solo despacho al motor. Workflow: el motor de workflows ejecuta cada paso por este mismo pipeline.',
        en: 'Direct: a single dispatch to the engine. Workflow: the workflow engine runs each step through this same pipeline.',
      },
    },
    {
      id: 'engine',
      label: { es: 'Motor de negocio', en: 'Business engine' },
      kind: 'service',
      description: {
        es: 'Ejecuta la capability. No conoce a los demás motores.',
        en: 'Runs the capability. It does not know about the other engines.',
      },
    },
  ],
  edges: [
    { from: 'request', to: 'gateway' },
    { from: 'gateway', to: 'resolve' },
    { from: 'resolve', to: 'context' },
    { from: 'context', to: 'pep' },
    { from: 'pep', to: 'pdp' },
    { from: 'pdp', to: 'pep' },
    { from: 'pep', to: 'denied', label: { es: 'deniega', en: 'denies' } },
    { from: 'pep', to: 'model', label: { es: 'permite', en: 'allows' } },
    { from: 'model', to: 'engine' },
  ],
  layout: {
    grid: [
      ['request', 'gateway', 'resolve', 'context'],
      ['engine', 'model', 'pep', 'pdp'],
      [null, null, 'denied', null],
    ],
    vertical: ['request', 'gateway', 'resolve', 'context', 'pep', 'pdp', 'denied', 'model', 'engine'],
  },
}

/** Q3 · Workflow con suspensión: la redención de beneficios, con la rama de compensación. */
const workflow: ArchitectureGraph = {
  id: 'workflow',
  title: {
    es: 'Workflow con suspensión: redención de beneficios',
    en: 'Workflow with suspension: benefit redemption',
  },
  description: {
    es: 'El workflow reserva stock y congela saldo, se suspende hasta que llega la decisión de un administrador y después captura o libera. Si un paso posterior falla, compensa en orden inverso.',
    en: 'The workflow reserves stock and freezes balance, suspends until an administrator’s decision arrives, then captures or releases. If a later step fails, it compensates in reverse order.',
  },
  nodes: [
    {
      id: 'start',
      label: { es: 'Inicio', en: 'Start' },
      kind: 'step',
      description: {
        es: 'El frontend dispara el workflow por la API del runtime.',
        en: 'The frontend triggers the workflow through the runtime API.',
      },
    },
    {
      id: 'reserve',
      label: { es: 'Reservar stock', en: 'Reserve stock' },
      kind: 'step',
      description: {
        es: 'Un paso que llama a un motor por el mismo pipeline de ejecución, con la misma autorización.',
        en: 'A step that calls an engine through the same execution pipeline, with the same authorization.',
      },
    },
    {
      id: 'freeze',
      label: { es: 'Congelar saldo', en: 'Freeze balance' },
      kind: 'step',
      description: {
        es: 'Retiene el saldo del pedido. Repetirlo no lo congela dos veces: es idempotente por referencia del pedido.',
        en: 'Holds the balance for the order. Repeating it does not freeze it twice: it is idempotent by order reference.',
      },
    },
    {
      id: 'wait',
      label: { es: 'Esperar decisión', en: 'Wait for decision' },
      kind: 'step',
      description: {
        es: 'La ejecución se suspende: el estado se guarda en Redis, la ejecución queda en espera en PostgreSQL y se registra una suscripción al evento. Si vence el plazo, pasa a vencida.',
        en: 'The execution suspends: its state is saved in Redis, the execution waits in PostgreSQL and a subscription to the event is registered. If the deadline passes, it expires.',
      },
    },
    {
      id: 'event',
      label: { es: 'Evento de decisión', en: 'Decision event' },
      kind: 'event',
      description: {
        es: 'Llega por Redis Streams. El filtro del wait se resolvió al suspender, así que solo despierta a esta ejecución.',
        en: 'Arrives over Redis Streams. The wait filter was resolved at suspension, so it only wakes this execution.',
      },
    },
    {
      id: 'resume',
      label: { es: 'Reanudar una vez', en: 'Resume once' },
      kind: 'step',
      description: {
        es: 'La idempotencia por id de evento evita reanudar dos veces la misma ejecución.',
        en: 'Idempotency by event id prevents resuming the same execution twice.',
      },
    },
    {
      id: 'decision',
      label: { es: '¿Aprobada?', en: 'Approved?' },
      kind: 'step',
      description: {
        es: 'Un paso condition elige la rama según la decisión.',
        en: 'A condition step picks the branch from the decision.',
      },
    },
    {
      id: 'capture',
      label: { es: 'Capturar', en: 'Capture' },
      kind: 'step',
      description: {
        es: 'Confirma el stock reservado y el saldo congelado.',
        en: 'Confirms the reserved stock and the frozen balance.',
      },
    },
    {
      id: 'release',
      label: { es: 'Liberar', en: 'Release' },
      kind: 'step',
      description: {
        es: 'Devuelve el stock reservado y el saldo congelado.',
        en: 'Returns the reserved stock and the frozen balance.',
      },
    },
    {
      id: 'compensate',
      label: { es: 'Compensar en orden inverso', en: 'Compensate in reverse order' },
      kind: 'step',
      description: {
        es: 'Si un paso posterior falla y pide compensar, los pasos compensables se deshacen en orden inverso. Un fallo durante la compensación no se reintenta.',
        en: 'If a later step fails and asks for compensation, the compensable steps are undone in reverse order. A failure during compensation is not retried.',
      },
    },
    {
      id: 'end',
      label: { es: 'Fin', en: 'End' },
      kind: 'outcome',
      description: { es: 'La ejecución termina.', en: 'The execution ends.' },
    },
  ],
  edges: [
    { from: 'start', to: 'reserve' },
    { from: 'reserve', to: 'freeze' },
    { from: 'freeze', to: 'wait' },
    { from: 'wait', to: 'event' },
    { from: 'event', to: 'resume' },
    { from: 'resume', to: 'decision' },
    { from: 'decision', to: 'capture', label: { es: 'sí', en: 'yes' } },
    { from: 'decision', to: 'release', label: { es: 'no', en: 'no' } },
    { from: 'capture', to: 'end' },
    { from: 'release', to: 'end' },
    { from: 'capture', to: 'compensate', label: { es: 'falla', en: 'fails' } },
    { from: 'compensate', to: 'end' },
  ],
  layout: {
    grid: [
      ['start', 'reserve', 'freeze', 'wait'],
      ['compensate', null, 'resume', 'event'],
      ['end', 'capture', 'decision', null],
      [null, null, 'release', null],
    ],
    vertical: [
      'start',
      'reserve',
      'freeze',
      'wait',
      'event',
      'resume',
      'decision',
      'capture',
      'release',
      'compensate',
      'end',
    ],
  },
}

export const diagrams: readonly ArchitectureGraph[] = [platform, pipeline, workflow]
