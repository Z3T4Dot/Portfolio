# 16 · Definition of Done V1

La V1 está terminada cuando **todas** las casillas están marcadas y cada una tiene evidencia
enlazada: un run de CI, un reporte o una captura. Una casilla sin evidencia no cuenta.

**2026-10-06:** casillas de seguridad, rendimiento y manejo de errores actualizadas tras el spike D4
(ADR-0001 y ADR-0013).

## Producto

- [ ] Todas las páginas del sitemap (02) terminadas: Home, Work, casos, Security hub, Wazuh SOC Lab,
      Judgment, ensayos, Cyber Ops, About, Contact, Architecture, ADRs y 404.
- [ ] Prueba de 5 segundos de la Home superada con 3 personas (01).
- [ ] Revisión guiada con al menos un CTO o EM, un recruiter y una persona de seguridad; hallazgos
      resueltos o registrados.
- [ ] Responsive verificado a 360, 768, 1024 y 1440px en Playwright (capturas en el reporte).
- [ ] ES/EN con paridad completa; el selector conserva la ruta.
- [ ] Navegación: header, menú móvil, footer, índices de sección, "siguiente paso" al final de cada
      página profunda.
- [ ] Contacto: email, LinkedIn, GitHub y CV en PDF (ES y EN) funcionando.
- [ ] Tema claro y oscuro sin parpadeo en la carga.

## Contenido

- [ ] Todos los casos y fichas de Selected Work revisados por César, con la checklist de sanitización
      de 06 completa; ninguna ficha permite deducir el cliente.
- [ ] Información confidencial removida (texto, diagramas, capturas y metadatos EXIF).
- [ ] Permiso de Brandex registrado en `.private/` (D7).
- [ ] Ninguna métrica sin fuente; las simuladas están etiquetadas (lo garantiza el tipo `Metric` y
      lo confirma la revisión).
- [ ] Ninguna entidad PLANEADA fuera de "Lo que viene"; ninguna CONFIDENCIAL publicada (test de
      integridad).
- [ ] Evidencia real enlazada en cada caso y en cada capítulo del lab.
- [ ] Atribución correcta de lo que es trabajo propio y lo que es software de terceros (por ejemplo,
      los componentes upstream de Wazuh).
- [ ] Lo diseñado pero no implementado se presenta como tal (zero-trust interno de Quantum; límites
      del motor de workflows).
- [ ] El uso de asistentes de IA se declara según D9.
- [ ] Repositorio público del Wazuh SOC Lab limpio (historial sin la captura sensible) antes de
      enlazarlo.
- [ ] Timeline respaldado: ninguna etapa sin evidencia.
- [ ] Sin "PENDIENTE" visible en el sitio.

## Ingeniería

- [ ] TypeScript `strict` sin errores; sin `any` explícito fuera de excepciones documentadas.
- [ ] Lint sin errores, incluidas las reglas de fronteras entre módulos (ADR-0007) y `jsx-a11y`.
- [ ] Tests unitarios y de integración en verde (motor del juego, i18n, contenido, componentes).
- [ ] Test de integridad de contenido en verde (05), incluido el chequeo 10: ningún `draft` genera
      ruta, entrada de sitemap ni enlace en el build de producción.
- [ ] Trazabilidad: cada componente y funcionalidad cita la sección del blueprint o la evidencia que
      lo justifica; lo que no la tiene quedó fuera de la V1.
- [ ] E2E en verde: un recorrido por audiencia, en ES y en EN, más el camino feliz de Cyber Ops.
- [ ] Build limpio: sin warnings y con todas las rutas × idiomas prerenderizadas.
- [ ] Manejo de errores verificado: 404 (estática, sin JS ni selector de tema), error de ruta, error
      del juego y fallo de chunk tras un deploy (recarga una vez la página actual; el usuario repite
      la navegación).
- [ ] README del repositorio: qué es, cómo correrlo, arquitectura en breve, enlaces a ADRs.

## Seguridad

- [ ] Escaneo de dependencias sin vulnerabilidades altas ni críticas abiertas.
- [ ] Escaneo de secretos (gitleaks) en todo el historial, sin hallazgos.
- [ ] Cabeceras de seguridad presentes en producción, verificadas por el health check posterior al
      despliegue.
- [ ] CSP evaluada: sin `unsafe-inline` ni `unsafe-eval`, con hashes por ruta generados en el
      build y una sola cabecera CSP por respuesta; cero `securitypolicyviolation` en E2E en Chromium,
      Firefox y WebKit. Plantilla de 11 §8: `default-src 'self'` con `object-src`, `frame-src`,
      `worker-src` y `media-src` en `'none'`; sin Trusted Types en V1.
- [ ] **B3 verificado en un preview real** de Cloudflare Pages antes del primer deploy a
      producción: exactamente una `Content-Security-Policy` por respuesta HTML, páginas y 404 (o,
      si falló, CSP en `<meta>` según ADR-0001).
- [ ] **`Access-Control-Allow-Origin` revisado** en el preview: se sabe si Pages lo envía y, si lo
      envía, está decidido y aplicado si se quita (13).
- [ ] MDN HTTP Observatory medido sobre producción y publicado con fecha.
- [ ] Sin secretos en el repositorio; el token de despliegue con mínimo privilegio y solo en CI.
- [ ] gitleaks con la lista de términos confidenciales (secret, nunca en el repo) sin hallazgos.
- [ ] Dependabot, dependency review, CodeQL y push protection activos.
- [ ] `security.txt` y `SECURITY.md` publicados.
- [ ] Cero scripts y fuentes de terceros en runtime.

## Rendimiento

- [ ] Lighthouse medido de verdad sobre producción (móvil y desktop), con fecha y versión
      guardadas como evidencia.
- [ ] Presupuestos de 04 cumplidos: código propio de Home y JS total de Home (brotli-11) según
      ADR-0013, con las cifras que confirme César; JS por ruta, chunk del juego, LCP y CLS.
- [ ] Bundle analizado; reporte guardado.
- [ ] Imágenes en AVIF/WebP con dimensiones explícitas; fuentes woff2 con subconjunto.

## Accesibilidad

- [ ] axe sin violaciones en todas las rutas, en ambos temas.
- [ ] Recorrido completo solo con teclado.
- [ ] Prueba con lector de pantalla (NVDA y VoiceOver) en Home, un caso, el lab y Cyber Ops.
- [ ] `prefers-reduced-motion` respetado.

## SEO y descubribilidad

- [ ] Título, descripción, canonical y hreflang por ruta e idioma.
- [ ] Imágenes Open Graph según 12 (por página, o la imagen por defecto donde 12 lo permite),
      verificadas con los validadores de LinkedIn y X.
- [ ] `sitemap.xml` con alternativas por idioma; `robots.txt`.
- [ ] JSON-LD `Person` válido.

## Cyber Ops

- [ ] Misión 01 (Firewall) completa según 09 §6.14, incluido el playtest con 5 personas.
- [ ] Misión 02 (Detection) completa según 09 §7.13; el texto puente coincide con 08.
- [ ] Misión 03 (Recovery) completa según 09 §8.11.
- [ ] IPs y dominios del juego en rangos reservados (test).
- [ ] Final con mensaje y enlace al Security Lab real.
- [ ] Datos del juego etiquetados como simulados; sin afirmar integración con Wazuh.
- [ ] Responsive y táctil.
- [ ] Accesible: jugable solo con teclado, modo sin presión de tiempo, señales que no dependen del color.
- [ ] Chunk diferido dentro del presupuesto.
- [ ] Motor con tests deterministas.

## Despliegue

- [ ] Dominio propio con HTTPS y HSTS.
- [ ] Previews por PR funcionando.
- [ ] Procedimiento de rollback probado al menos una vez.
- [ ] Health check posterior al despliegue en el pipeline (rutas, cabeceras, sitemap).
