// Blueprint 06 (cabecera, "En 30 segundos", formato de decisión y de failure modes; sanitización), 05
// (CaseStudyMeta), 12 (título y descripción del caso) y 07-current-projects/quantum-erp-rental.md
// (material sanitizado; conteos DEL REPOSITORIO del 2026-10-05, §10). Rol, equipo, autoría, estado,
// decisiones y lecciones usan solo redacciones públicas confirmadas por César; lo demás sale de 07.
// `draft` hasta el permiso de Brandex (G3): ni su ruta ni sus textos llegan al build de producción.
// Inglés: borrador cuidado hasta la revisión de F9.
import type { CaseMetric, CaseStudyMeta, Localized } from '../../schema'

const COUNTED_AT = '2026-10-05'

const repository = (how: Localized): CaseMetric['source'] => ({ type: 'repository', countedAt: COUNTED_AT, how })

export const meta = {
  slug: 'quantum',
  existence: 'real',
  publication: 'draft',
  projectKind: 'product',
  confidentiality: 'sanitized',
  title: { es: 'Quantum', en: 'Quantum' },
  kind: {
    es: 'Plataforma de operaciones para una empresa de eventos',
    en: 'Operations platform for an events company',
  },
  problem: {
    es: 'La primera versión mostró problemas de estabilidad, mantenibilidad y rendimiento, con casi todo concentrado en un servicio central.',
    en: 'The first version had stability, maintainability and performance problems, with almost everything concentrated in one central service.',
  },
  highlight: {
    es: 'Desacoplar no significa necesariamente distribuir todo: hoy conservaría las fronteras y decidiría la distribución según las necesidades operacionales.',
    en: 'Decoupling does not necessarily mean distributing everything: today I would keep the boundaries and decide distribution by operational need.',
  },
  summary: {
    es: 'Quantum es la plataforma interna de operaciones de Brandex, una empresa de experiencias y eventos. Su primera versión mostró problemas de estabilidad, mantenibilidad y rendimiento. Diseñé la arquitectura de la segunda e implementé la plataforma del backend: un SDK y un runtime propios, identidad y autorización, gateway, motor de workflows y CI/CD. Quedó implementada y desplegada. Al momento del traspaso, a finales de septiembre de 2026, estaba integrada de forma parcial con el ERP y con parte del portal interno.',
    en: 'Quantum is the internal operations platform of Brandex, an experiences and events company. Its first version had stability, maintainability and performance problems. I designed the architecture of the second version and implemented the backend platform: an in-house SDK and runtime, identity and authorization, the gateway, the workflow engine and CI/CD. It was implemented and deployed. When I handed it over at the end of September 2026, it was partially integrated with the ERP and with part of the internal portal.',
  },
  description: {
    es: 'Cómo diseñé Quantum, una plataforma de operaciones con fronteras verificadas en CI, y por qué hoy no llevaría cada motor a su propio proceso.',
    en: 'How I designed Quantum, an operations platform with boundaries enforced in CI, and why today I would not give every engine its own process.',
  },
  // Responsabilidades, no un cargo: el cargo formal va aparte (About) y nunca se reemplaza por uno implícito.
  role: {
    es: 'Dirección técnica y tecnológica. Diseñé la arquitectura e implementé la plataforma del backend.',
    en: 'Technical and technology direction. I designed the architecture and implemented the backend platform.',
  },
  period: { start: '2026-04', end: '2026-09' },
  team: {
    es: 'Tres personas. El liderazgo formal del proyecto estuvo a cargo del diseñador de interfaz.',
    en: 'Three people. The interface designer was the formal project lead.',
  },
  stack: [
    'Java 21',
    'Spring Boot 3.3',
    'Maven',
    'PostgreSQL 16',
    'Flyway',
    'Redis 7 (Streams)',
    'ArchUnit',
    'React 18',
    'TypeScript',
    'Docker Compose',
    'GitHub Actions',
  ],
  pillars: ['engineering', 'security', 'leadership'],
  sections: [
    'context',
    'problem',
    'role',
    'constraints',
    'architecture',
    'decisions',
    'tradeoffs',
    'security',
    'failure-modes',
    'implementation',
    'result',
    'lessons',
  ],
  decisions: [
    {
      id: 'sdk-runtime',
      title: {
        es: 'Un SDK y un runtime propios, con la frontera verificada en CI',
        en: 'An in-house SDK and runtime, with the boundary enforced in CI',
      },
      context: {
        es: 'V1 me enseñó el costo del acoplamiento. V2 iba a repartir el negocio en varios motores.',
        en: 'V1 taught me the cost of coupling. V2 was going to split the business into several engines.',
      },
      options: {
        es: [
          'Separar los motores por convención de código.',
          'Un SDK y un runtime propios como único punto de entrada, con la frontera verificada por pruebas de arquitectura.',
        ],
        en: [
          'Separate the engines by code convention.',
          'An in-house SDK and runtime as the single entry point, with the boundary enforced by architecture tests.',
        ],
      },
      choice: {
        es: 'Diseñé un SDK y un runtime propios para que los motores de negocio no se conocieran entre sí: el runtime resuelve cada petición, aplica la autorización y orquesta la ejecución. La frontera no es una convención: la hacen cumplir pruebas de arquitectura que corren en CI; por ejemplo, impiden que el runtime importe clases de dominio.',
        en: 'I designed an in-house SDK and runtime so that the business engines would not know about each other: the runtime resolves each request, applies authorization and orchestrates execution. The boundary is not a convention: architecture tests that run in CI enforce it; for example, they stop the runtime from importing domain classes.',
      },
      cost: {
        es: 'El runtime queda en el camino de cada operación, así que es la pieza que más tiene que estar bien. Y el SDK es código propio que hay que mantener.',
        en: 'The runtime sits in the path of every operation, so it is the piece that most has to be right. And the SDK is in-house code that has to be maintained.',
      },
      repeat: {
        answer: 'yes',
        reason: {
          es: 'Mantendría el diseño de los motores, el SDK, el Runtime y las fronteras arquitectónicas, y las mismas pruebas de arquitectura para preservar los límites.',
          en: 'I would keep the design of the engines, the SDK, the Runtime and the architectural boundaries, and the same architecture tests to preserve the limits.',
        },
      },
    },
    {
      id: 'processes',
      title: {
        es: 'Llevar la frontera hasta 15 procesos independientes',
        en: 'Taking the boundary all the way to 15 independent processes',
      },
      context: {
        es: 'En V1, un servicio central concentraba casi todo. La arquitectura de V2 decidió partirlo por dominio, de forma incremental. Faltaba decidir hasta dónde llegaba la separación.',
        en: 'In V1, one central service held almost everything. The V2 architecture decided to split it by domain, incrementally. What remained was deciding how far the separation would go.',
      },
      options: {
        es: [
          'Mantener los motores en un mismo proceso, con la frontera como convención de código.',
          'Separar cada motor en un proceso independiente.',
        ],
        en: [
          'Keep the engines in a single process, with the boundary as a code convention.',
          'Run each engine as an independent process.',
        ],
      },
      choice: {
        es: 'Separé la plataforma en 15 procesos independientes porque no quería que la frontera entre los motores dependiera solamente de una convención de código. Quería aislamiento real de ejecución, posibilidad de desplegar y escalar capacidades de forma independiente y una arquitectura preparada para crecer con más servicios y más personas. Con el conocimiento que tenía en ese momento, llevar esa frontera hasta procesos independientes también me permitió validar el modelo en condiciones más cercanas a una arquitectura distribuida real.',
        en: 'I split the platform into 15 independent processes because I did not want the boundary between the engines to depend only on a code convention. I wanted real execution isolation, the option to deploy and scale capabilities independently, and an architecture ready to grow with more services and more people. With what I knew at the time, taking that boundary all the way to independent processes also let me validate the model in conditions closer to a real distributed architecture.',
      },
      cost: {
        es: 'Con un equipo pequeño y un único servidor, 15 procesos introdujeron complejidad operacional que no era estrictamente necesaria para conseguir el desacoplamiento lógico. El despliegue y el escalado independientes quedaron como posibilidad: el pipeline despliega las 15 imágenes juntas en el mismo servidor.',
        en: 'With a small team and a single server, 15 processes added operational complexity that was not strictly needed to achieve logical decoupling. Independent deployment and scaling remained an option rather than a practice: the pipeline deploys all 15 images together to the same server.',
      },
      repeat: {
        answer: 'nuanced',
        reason: {
          es: 'No exactamente. Mantendría el diseño de los motores, el SDK, el Runtime y las fronteras arquitectónicas, pero probablemente no convertiría cada motor en un proceso independiente desde el principio. Hoy empezaría con un monolito modular o con un número reducido de procesos y mantendría las mismas pruebas de arquitectura para preservar los límites. Separaría un motor en su propio proceso cuando existiera una razón operacional concreta: aislamiento de fallos, necesidades de escalabilidad independientes, despliegue independiente o carga suficientemente diferente.',
          en: 'Not exactly. I would keep the design of the engines, the SDK, the Runtime and the architectural boundaries, but I probably would not turn every engine into an independent process from the start. Today I would begin with a modular monolith or a small number of processes and keep the same architecture tests to preserve the limits. I would move an engine into its own process when there was a concrete operational reason: fault isolation, independent scaling needs, independent deployment or a sufficiently different load.',
        },
      },
    },
    {
      id: 'redis-streams',
      title: {
        es: 'Redis Streams en lugar de activar Kafka',
        en: 'Redis Streams instead of switching Kafka on',
      },
      context: {
        es: 'V1 tenía Kafka configurado, pero inactivo. Redis ya corría en producción para limitar peticiones, y el equipo era pequeño, con un solo servidor.',
        en: 'V1 had Kafka configured but inactive. Redis was already running in production for rate limiting, and the team was small, with a single server.',
      },
      options: {
        es: ['Activar y operar Kafka.', 'Usar Redis Streams sobre el Redis que ya existía.'],
        en: ['Switch Kafka on and operate it.', 'Use Redis Streams on the Redis that already existed.'],
      },
      choice: {
        es: 'Redis Streams: un sistema menos que operar. Para no perder eventos cuando falla un consumidor, cada consumer group confirma un mensaje solo después de procesarlo, reclama los pendientes al volver a suscribirse y descarta duplicados por id de evento.',
        en: 'Redis Streams: one less system to operate. So that events are not lost when a consumer fails, each consumer group acknowledges a message only after processing it, claims pending messages when it subscribes again and discards duplicates by event id.',
      },
      cost: {
        es: 'Menos durabilidad: en la configuración revisada, Redis persiste con snapshots periódicos y no registra cada escritura, así que una caída puede perder los eventos más recientes. La decisión dejó fijado un umbral de volumen a partir del cual revisarla.',
        en: 'Less durability: in the configuration reviewed, Redis persists with periodic snapshots and does not log every write, so a crash can lose the most recent events. The decision set a volume threshold at which to revisit it.',
      },
    },
    {
      id: 'server-authz',
      title: {
        es: 'La autorización se decide en el servidor',
        en: 'Authorization is decided on the server',
      },
      context: {
        es: 'En V1, el frontend decidía el nivel de acceso de cada usuario con un dato que el backend nunca emitía, y el alcance por departamento nunca se evaluaba.',
        en: "In V1, the frontend decided each user's access level from a value the backend never issued, and department scope was never evaluated.",
      },
      options: {
        es: [
          'Un servicio de autorización propio desde el principio.',
          'El punto de decisión (PDP) dentro del servicio de identidad, con criterios escritos para extraerlo cuando haga falta.',
        ],
        en: [
          'A dedicated authorization service from the start.',
          'The decision point (PDP) inside the identity service, with written criteria for extracting it when needed.',
        ],
      },
      choice: {
        es: 'Roles genéricos con alcance por departamento, decididos por un PDP dentro del servicio de identidad. El PDP combina usuario, permiso y alcance, y falla cerrado. El runtime aplica la decisión (PEP) en cada petición y en cada paso de workflow.',
        en: 'Generic roles with department scope, decided by a PDP inside the identity service. The PDP combines user, permission and scope, and fails closed. The runtime enforces the decision (PEP) on every request and every workflow step.',
      },
      cost: {
        es: 'Si el PDP no responde, la operación se deniega: la disponibilidad depende de él. La caché de decisiones baja la carga sobre el PDP, a cambio de que un cambio de permisos tarde en aplicarse hasta que la caché vence.',
        en: 'If the PDP does not respond, the operation is denied: availability depends on it. The decision cache lowers the load on the PDP, at the cost of a permission change taking effect only once the cache expires.',
      },
    },
  ],
  // Solo cifras publicables de 07 §10, con su fecha de conteo. Ninguna de rendimiento (no se midió).
  metrics: [
    {
      id: 'services',
      value: '15',
      label: { es: 'servicios desplegables', en: 'deployable services' },
      source: repository({
        es: 'Módulos Maven desplegables de la rama principal del backend, sin la carpeta de V1.',
        en: 'Deployable Maven modules on the backend main branch, excluding the V1 folder.',
      }),
    },
    {
      id: 'libraries',
      value: '4',
      label: { es: 'librerías compartidas', en: 'shared libraries' },
      source: repository({
        es: 'Módulos Maven de librería que comparten los servicios.',
        en: 'Maven library modules shared by the services.',
      }),
    },
    {
      id: 'modules',
      value: '6',
      label: { es: 'módulos de negocio declarados en YAML', en: 'business modules declared in YAML' },
      source: repository({
        es: 'Un archivo de declaración por módulo.',
        en: 'One declaration file per module.',
      }),
    },
    {
      id: 'backend-commits',
      value: '214',
      label: {
        es: 'de los 262 commits del backend son de mi autoría',
        en: 'of the 262 backend commits are mine',
      },
      source: repository({
        es: 'Rama principal del backend. Los commits no miden contribución: el código de V2 entró en un solo commit.',
        en: 'Backend main branch. Commits do not measure contribution: the V2 code went in as a single commit.',
      }),
    },
    {
      id: 'engine-rules',
      value: '12',
      label: { es: 'reglas de validación del DSL de workflows', en: 'workflow DSL validation rules' },
      source: repository({
        es: 'Reglas con código propio que se aplican al cargar un workflow.',
        en: 'Rules with their own code, applied when a workflow is loaded.',
      }),
    },
    {
      id: 'engine-tests',
      value: '40',
      label: { es: 'métodos de prueba del motor de workflows', en: 'workflow engine test methods' },
      source: repository({
        es: 'Pruebas unitarias con Mockito. No hay pruebas de integración del motor contra un Redis real.',
        en: 'Unit tests with Mockito. There are no integration tests of the engine against a real Redis.',
      }),
    },
    {
      id: 'migrations',
      value: '120',
      label: { es: 'migraciones de base de datos', en: 'database migrations' },
      source: repository({
        es: 'Migraciones Flyway de todos los servicios.',
        en: 'Flyway migrations across all services.',
      }),
    },
    {
      id: 'tests',
      value: '411',
      label: { es: 'métodos de prueba en 60 clases', en: 'test methods across 60 classes' },
      source: repository({
        es: 'Métodos de prueba del backend. La cobertura no se midió.',
        en: 'Backend test methods. Coverage was not measured.',
      }),
    },
  ],
  // Solo fallas de la tabla verificada de 07, sin nombres internos. Se omiten las que no tienen
  // mitigación en el código o revelan una debilidad abierta (06 §Sanitización).
  failureModes: [
    {
      id: 'pdp-down',
      failure: { es: 'El PDP no responde', en: 'The PDP does not respond' },
      detection: {
        es: 'Timeout explícito de conexión o de lectura.',
        en: 'Explicit connection or read timeout.',
      },
      impact: { es: 'La operación no se ejecuta.', en: 'The operation does not run.' },
      mitigation: { es: 'Se deniega: falla cerrado.', en: 'It is denied: it fails closed.' },
      residual: {
        es: 'Mientras el PDP no responda, nada que requiera autorización funciona.',
        en: 'While the PDP is down, nothing that needs authorization works.',
      },
    },
    {
      id: 'engine-down',
      failure: { es: 'Un motor de negocio no responde', en: 'A business engine does not respond' },
      detection: { es: 'Timeout de la llamada.', en: 'Call timeout.' },
      impact: { es: 'El paso termina como fallido.', en: 'The step ends as failed.' },
      mitigation: {
        es: 'En un workflow, la ruta de falla decide: terminar o compensar.',
        en: 'In a workflow, the failure path decides: end or compensate.',
      },
      residual: {
        es: 'Sin reintento automático ni circuit breaker.',
        en: 'No automatic retry and no circuit breaker.',
      },
    },
    {
      id: 'redis-edge',
      failure: {
        es: 'Redis no responde en el borde y en la autorización',
        en: 'Redis does not respond at the edge and in authorization',
      },
      detection: { es: 'Error al consultar Redis, registrado.', en: 'Error when querying Redis, logged.' },
      impact: {
        es: 'El gateway no puede comprobar si una sesión fue revocada y la caché de decisiones no está disponible.',
        en: 'The gateway cannot check whether a session was revoked, and the decision cache is unavailable.',
      },
      mitigation: {
        es: 'El gateway sigue validando la firma del token y omite el chequeo de revocación, con registro. La autorización consulta directamente al PDP.',
        en: 'The gateway keeps validating the token signature and skips the revocation check, logging it. Authorization queries the PDP directly.',
      },
      residual: {
        es: 'Un token revocado sigue siendo válido hasta que vence; su vida es corta.',
        en: 'A revoked token stays valid until it expires; it is short-lived.',
      },
    },
    {
      id: 'redis-events',
      failure: {
        es: 'Redis no responde al publicar eventos o al suspender un workflow',
        en: 'Redis does not respond when publishing events or suspending a workflow',
      },
      detection: {
        es: 'Error al publicar o al guardar el estado, registrado.',
        en: 'Error when publishing or saving state, logged.',
      },
      impact: {
        es: 'El evento se pierde. Un workflow que se estaba suspendiendo no podrá reanudarse.',
        en: 'The event is lost. A workflow that was being suspended cannot be resumed.',
      },
      mitigation: {
        es: 'La publicación no deshace la operación de negocio, que continúa. La ejecución que no pudo suspenderse vence por plazo.',
        en: 'Publishing does not roll back the business operation, which continues. The execution that could not be suspended expires by deadline.',
      },
      residual: {
        es: 'No hay outbox para los eventos de dominio: un evento perdido no se recupera.',
        en: 'There is no outbox for domain events: a lost event is not recovered.',
      },
    },
    {
      id: 'event-error',
      failure: {
        es: 'Un evento falla al procesarse o llega repetido',
        en: 'An event fails to process or arrives twice',
      },
      detection: {
        es: 'El consumidor no confirma el mensaje; el id del evento ya se vio.',
        en: 'The consumer does not acknowledge the message; the event id has been seen before.',
      },
      impact: {
        es: 'La reanudación espera al siguiente intento.',
        en: 'The resume waits for the next attempt.',
      },
      mitigation: {
        es: 'El mensaje queda pendiente y se reclama al volver a suscribirse. La idempotencia por id de evento descarta duplicados y evita reanudar dos veces.',
        en: 'The message stays pending and is claimed again on resubscription. Idempotency by event id discards duplicates and prevents a double resume.',
      },
      residual: {
        es: 'Los pendientes se reclaman al volver a suscribirse, no de forma continua.',
        en: 'Pending messages are claimed on resubscription, not continuously.',
      },
    },
    {
      id: 'notifications-down',
      failure: {
        es: 'El proveedor de notificaciones no responde',
        en: 'The notification provider does not respond',
      },
      detection: { es: 'Error al enviar.', en: 'Error when sending.' },
      impact: { es: 'La notificación se retrasa.', en: 'The notification is delayed.' },
      mitigation: {
        es: 'Outbox con estados y reintentos programados; varias réplicas se reparten el trabajo sin duplicarlo (SKIP LOCKED de PostgreSQL).',
        en: 'An outbox with states and scheduled retries; several replicas share the work without duplicating it (PostgreSQL SKIP LOCKED).',
      },
      residual: {
        es: 'Tras agotar los reintentos, el mensaje queda en un estado terminal y ya no se reintenta.',
        en: 'Once retries run out, the message moves to a terminal state and is not retried again.',
      },
    },
  ],
  diagrams: ['platform', 'pipeline', 'workflow'],
  updatedAt: '2026-10-07',
} satisfies CaseStudyMeta
