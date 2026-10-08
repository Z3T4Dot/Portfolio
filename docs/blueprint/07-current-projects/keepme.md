# KeepMe: operación de custodia y su módulo de software

**Estado:** investigación para el blueprint, 2026-10-05.
**Documento público.** No contiene nombres de clientes, proveedores ni personas, cifras de negocio,
rutas internas ni URLs. Las rutas, comandos y conteos de autoría están en la evidencia privada
(`.private/evidence/keepme-and-others.md`, fuera del repositorio).

---

## Qué es KeepMe (genérico)

KeepMe es una línea de negocio de Brandex. Guarda en bodega el material de marca de sus clientes
(merchandising, material POP, piezas de eventos) y lo despacha a eventos cuando el cliente lo pide.
El servicio tiene dos momentos que se cobran distinto:

1. **Custodia.** El cliente reserva espacio. La bodega recibe el material, lo audita, lo etiqueta y
   lo guarda en una zona. Se cobra por volumen ocupado y tiempo, más un cargo fijo de plataforma.
2. **Despacho (handling).** Cuando el material sale a un evento, se alista y se despacha. Si
   vuelve, se inspecciona. Se cobra por unidad movida, según su peso.

En Quantum, el ERP de Brandex, KeepMe es un *business module* declarativo: un blueprint YAML que
activa capacidades del motor de inventario (custodia, despacho, zonas de bodega, inspección de
retornos, tarifas). El código de negocio vive en el motor, que comparten otros departamentos; el
módulo solo declara qué usa, qué navegación expone y qué eventos publica.

La documentación general del repositorio conserva descripciones anteriores de KeepMe (activaciones
de marca, renta de equipo) que no coinciden con el modelo actual de custodia.
**PENDIENTE: confirmar con César** la definición vigente que debe usar el sitio.

---

## Qué hizo César

### Respaldado por el repositorio (REAL)

César es el autor de la mayoría de los commits que tocan KeepMe y custodia, en backend y frontend.
Hubo otros contribuidores, así que el caso no debe presentarse como trabajo individual.
Lo que el código muestra:

- **Máquina de estados de una custodia**: 10 estados, con las transiciones validadas en el dominio
  y ningún camino para saltárselas. Tiene dos cierres distintos a propósito ("terminada" y
  "cancelada"): los dos liberan espacio, pero no significan lo mismo para el historial ni para la
  facturación.
- **Solicitud de espacio (pre-alerta)** desde una página pública, aceptación por el equipo de
  bodega y creación de la operación de custodia.
- **Recepción de cajas**: separa unidades de cajas master. El volumen cobrable sale de la medida
  real de la caja master, no de multiplicar la medida de una unidad (esa cuenta ignoraba el
  empaque). Las fotos van a object storage.
- **Zonas de bodega** con capacidad física. Cuando una zona se llena, bloquea nuevas reservas.
  Cada cambio de capacidad queda en historial.
- **Costos internos** de custodia y de handling como filas fijas con historial de cambios. El
  precio de las líneas de custodia lo calcula el servidor.
- **Despacho con checkpoints por ítem** en cada tramo (bodega a sitio, en sitio, regreso), para
  saber en qué tramo ocurrió un daño o una pérdida.
- **Inspección de retornos**: lo que vuelve dañado ya no entra al stock disponible como si estuviera
  intacto.
- **Visibilidad por cliente decidida en el servidor**, con fallo cerrado, sobre el modelo de
  autorización por departamento del ERP (documentado en un ADR).
- **Eventos de dominio** hacia el hub de analítica: pulso diario de bodega, ocupación por marca.
- **Etiquetas por caja** impresas desde el navegador, una por caja registrada.
- **Migración** de los datos que vivían en el almacenamiento del navegador hacia el servidor.
- **Auditoría previa al lanzamiento**: bloqueo de concurrencia en el despacho, idempotencia en la
  creación de órdenes, validaciones en el servidor.

### Lo que sugieren los documentos de operación (inferencias)

Los documentos de negocio son CONFIDENCIALES. Solo se revisaron títulos y encabezados, y no se
copió nada de su contenido.

- **Modelo tarifario y de costeo** (presentación). Sus secciones tratan la capacidad física de la
  bodega, el alquiler de espacio y la custodia, una matriz de handling por contenedor o caja, un
  ejemplo resuelto, la simulación del despacho a un evento, una proyección financiera de la planta
  y las variables que debe pedir el formulario web. El software implementa ese mismo modelo de dos
  momentos. **PENDIENTE: confirmar con César** si diseñó el modelo, lo diseñó con alguien más o lo
  recibió y lo implementó.
- **Marcación y etiquetado.** Hay hojas de marcación con columnas de identificador, cliente, tipo,
  posición, contenido, cantidad y fecha de entrada, y plantillas de etiquetas para el centro de
  distribución (CEDI) y para maquilas. Eso apunta a un esquema de trazabilidad de caja a posición.
  **PENDIENTE: confirmar con César** quién lo diseñó, si se usa en la operación y cómo se relaciona
  con la etiqueta que imprime el software.
- **Compras.** Existe una orden de compra a un proveedor asociada a KeepMe.
  **PENDIENTE: confirmar con César** si participó en el montaje físico de la operación (compras,
  adecuación de la bodega, procesos con maquilas).
- **Inicio de la operación.** La documentación del repositorio indica que la operación arrancó en
  septiembre de 2026. **PENDIENTE: confirmar con César.**

---

## Qué mostrar / qué ocultar

| Mostrar (SANITIZADO) | Ocultar (CONFIDENCIAL) |
|---|---|
| El problema en términos genéricos: convertir una operación física (recibir, guardar, despachar, recibir de vuelta) en estados verificables y cobrables | Tarifas, costos, márgenes, proyecciones, porcentajes de ocupación, capacidad en m³, cantidades |
| La máquina de estados y por qué tiene dos cierres | Nombres de clientes, de marcas en custodia, de proveedores y de personas |
| La estructura del modelo de costos: qué variables lo mueven (volumen, tiempo, tipo de almacenamiento, peso por unidad despachada, cargo fijo), sin valores | Órdenes de compra, filas de las hojas de marcación, plantillas de etiquetas reales |
| La simplificación de zonas: catálogo configurable reemplazado por un conjunto fijo | Nombres internos de zonas y categorías de costo, salvo que Brandex los apruebe |
| Controles de seguridad: visibilidad por cliente en el servidor, fallo cerrado, permisos de custodia propios, precio calculado en el servidor | Rutas, nombres de repositorios, organizaciones de GitHub, dominios |
| Fallos encontrados y cómo se corrigieron | Páginas o imágenes con la marca de un cliente |
| Capturas con datos de prueba, revisadas una por una antes de publicarlas | Ejemplos numéricos de los comentarios del código, que contienen cifras de negocio |

---

## Evidencia disponible (genérica)

- Código del módulo (blueprint declarativo) y del motor de inventario: backend Java 21 con Spring
  Boot, organizado en dominio, casos de uso, puertos y adaptadores; frontend React con TypeScript.
- Migraciones de base de datos: 25 de las 66 migraciones del servicio de inventario tienen nombres
  relacionados con custodia, despacho, zonas o retornos (DEL REPOSITORIO, conteo por nombre de
  archivo, 2026-10-05).
- 8 clases de test de backend sobre custodia, despacho, inspección, zonas y tarifas (DEL
  REPOSITORIO, 2026-10-05). No se encontraron tests de frontend con nombre de KeepMe o custodia.
- Historial de commits entre mayo y septiembre de 2026, con mensajes que explican el porqué. Por
  ejemplo, la corrección de visibilidad por cliente documenta su propia limitación.
- Un ADR del ERP sobre autorización por departamento, que usa KeepMe como ejemplo.
- Comentarios de diseño en el código que registran decisiones con fecha.
- Documentos de negocio (modelo tarifario, marcación, plantillas de etiquetas, orden de compra).
  Son CONFIDENCIALES y sirven solo para que César confirme su rol. No se publican.

---

## Mapa a la plantilla de caso

| Sección | Material disponible | PENDIENTE |
|---|---|---|
| **Context** | Línea de negocio de custodia dentro de un ERP multi-módulo. Operación iniciada en septiembre de 2026, según la documentación del repositorio | Tamaño del equipo, quién opera la bodega, fecha confirmada |
| **Problem** | Material físico de varias marcas que se cobra por volumen y tiempo y entra y sale hacia eventos. Hubo datos de cajas guardados solo en el navegador que no veía nadie más | Cómo se operaba antes del software (¿hojas de cálculo?) y qué dolía |
| **Role** | Autor principal del módulo en el repositorio | Rol en la operación y en el modelo de costos; cargo; con quién trabajó |
| **Constraints** | Debía ser un módulo declarativo de la plataforma, sin código propio, sobre un motor de inventario compartido con otros departamentos, y con fecha de arranque de la operación | Plazo real, personas, presupuesto (este último no se publica) |
| **Architecture** | Blueprint, runtime con PDP, motor de inventario, base de datos y object storage, eventos al hub de analítica | Ninguno; falta producir el diagrama |
| **Technical decisions** | Máquina de estados en el dominio; dos cierres; zonas fijas; volumen por caja master; handling por unidad según peso; precio calculado en el servidor; filtro por cliente en el servidor | Cuáles decidió César y cuáles vinieron del negocio |
| **Trade-offs** | Generalidad contra simplicidad (zonas fijas). El cliente se cruza por nombre normalizado mientras no exista un identificador de cliente en custodia: falla por defecto, nunca por exceso. Flujos simulados y reales conviven durante la transición | Si el identificador de cliente ya está planeado |
| **Security considerations** | Autorización por departamento; el cliente ve solo lo suyo, decidido en el servidor, con fallo cerrado; permisos de custodia propios para no exponerla a visitantes; precio calculado en el servidor; bloqueo de concurrencia; idempotencia; historial de cambios de estado, tarifas y zonas | Revisión de seguridad independiente, si existió |
| **Failure modes** | Un filtro solo en el navegador como única defensa (corregido). Un merge borró la declaración de eventos y la analítica dejó de ver custodia (corregido). Material dañado que volvía al stock (corregido con la inspección). Volumen calculado sin empaque (corregido). Un registro de despachos desconectado del estado real (retirado). Despliegue caído por un servicio de inventario no saludable (corregido, con guardias) | Incidentes en operación real |
| **Implementation** | Java 21 y Spring Boot, PostgreSQL con migraciones versionadas, object storage compatible con S3, React con TypeScript, eventos de dominio | Despliegue y entorno de producción (el caso de Quantum lo cubre) |
| **Result** | Solo conteos DEL REPOSITORIO: estados, migraciones, tests, con fecha | Uso en producción, qué cambió en la operación. Sin métricas de negocio publicables |
| **Lessons learned** | De los commits: "un filtro de navegador no es una defensa"; una declaración de eventos es un contrato y necesita un guardia; una generalidad que el resto del sistema no respeta no se sostiene | Lecciones de operación, en palabras de César |

---

## Diagramas necesarios

1. **Ciclo de vida de una custodia.** Diagrama de estados con los 10 estados y sus transiciones,
   marcando los dos cierres. Es el diagrama central del caso.
2. **Del mundo físico al sistema.** Flujo: pre-alerta, recepción, auditoría, etiquetado, zona,
   despacho, evento, retorno, inspección. Indica qué registra el sistema en cada paso.
3. **El módulo dentro de Quantum.** Blueprint declarativo, runtime y decisión de permisos, motor de
   inventario, base de datos y object storage, eventos, hub de analítica.
4. **Qué mueve el costo.** Estructura del modelo de dos momentos con sus variables y sin valores.
   Se etiqueta como ilustrativo.
5. **(Opcional) Quién ve qué.** El equipo de bodega opera por departamento; el cliente ve solo lo
   suyo, y lo decide el servidor.

---

## Profundidad recomendada

**Caso propio de profundidad media ("operaciones + tecnología"), enlazado desde Quantum**, si se
cumple la condición de abajo.

- Si César confirma que participó en el diseño de la operación o del modelo de costos: caso propio.
  Sería el único caso del portafolio que muestra cómo se traduce una operación física y su modelo
  de costos a software (pilar *business systems*, audiencia CTO).
- Si solo hizo el software: no tiene caso propio. Pasa a una sección "Módulo de negocio: custodia"
  dentro del caso de Quantum.

Por qué no es un caso profundo: la confidencialidad impide mostrar cifras, la operación acaba de
empezar y aún no hay resultados, y parte del módulo sigue en transición de flujos simulados a
servidor.

---

## Clasificación en los 3 ejes

| Eje | Clase | Nota |
|---|---|---|
| Existencia | **REAL** | El módulo está en el repositorio con backend persistido. Partes aún simuladas no se presentan como terminadas. Uso en producción: PENDIENTE |
| Datos | **DEL REPOSITORIO** | Estados, migraciones y tests, con fecha de conteo. Nada MEDIDO hoy. Los diagramas de costos sin valores se etiquetan como ilustrativos |
| Confidencialidad | **SANITIZADO** (software y estructura del modelo) / **CONFIDENCIAL** (documentos de negocio, cifras, clientes, proveedores) | El nombre "KeepMe" puede usarse si Brandex lo aprueba (decisión D7) |

---

## Preguntas para César

1. ¿Cuál es la definición vigente de KeepMe: custodia y despacho de material de marca? ¿Las
   descripciones anteriores (activaciones, renta de equipo) ya no aplican?
2. ¿Diseñaste el modelo tarifario y de costeo, lo diseñaste con alguien o lo implementaste a partir
   de otro?
3. ¿Diseñaste el esquema de marcación (identificador, posición, contenido) y las plantillas de
   etiquetas para el CEDI y las maquilas? ¿Se usan hoy en la operación?
4. ¿Participaste en el montaje físico: compras, adecuación de la bodega, procesos con maquilas?
5. ¿KeepMe ya opera en producción con el software? ¿Desde cuándo, y qué partes siguen en hojas de
   cálculo o en flujos simulados?
6. ¿Cómo se hacía esto antes del módulo y qué problema concreto resolvió?
7. ¿Qué decisiones de diseño fueron tuyas y cuáles vinieron del negocio (dos cierres, zonas fijas,
   handling por peso)?
8. ¿Cuál era tu cargo y cuántas personas trabajaban en el módulo y en la operación?
9. ¿Brandex autoriza nombrar KeepMe y publicar capturas con datos de prueba?
10. Parte de los commits declara coautoría con un asistente de IA. ¿Cómo quieres presentar eso en
    el sitio? Recomendación: decirlo de forma directa, en el caso o en About.
