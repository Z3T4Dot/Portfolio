// Blueprint 05 §Estructura (content/about: introducción y "cómo trabajo", prosa por idioma), 02 §About
// (máximo 3 párrafos; 4–5 principios) y 00 D9 (ingeniería asistida por IA y dirigida por personas).
// Texto fuente en español; en.ts debe cumplir el mismo tipo (paridad verificada por el compilador).
//
// En TS y no en es.mdx (05) porque la tubería de MDX llega con F2 y esta prosa es corta y
// estructurada (párrafos y principios con título). Si crece, se migra a MDX sin cambiar el tipo.
// Cada frase condensa una redacción pública confirmada por César (C2); la aprueba en C5.
import type { AboutProse } from '../schema'

export const es = {
  intro: [
    'Soy desarrollador de software y trabajo en Brandex desde julio de 2025. Construyo sistemas empresariales: diseño su arquitectura, los implemento y me ocupo de cómo se protegen y de cómo fallan.',
  ],
  principles: [
    {
      title: 'Ingeniería asistida por IA y dirigida por personas',
      body: 'Trabajo con asistencia de IA para proponer alternativas y redactar; las decisiones, su validación y la responsabilidad son mías. Este portafolio también se diseña con agentes de IA.',
    },
    {
      title: 'Una frontera se hace cumplir',
      body: 'Cuando separo módulos, la frontera no queda en una convención: la hacen cumplir pruebas de arquitectura que corren en CI.',
    },
    {
      title: 'Si la migración no corre en CI, la prueba es producción',
      body: 'Un deploy dejó de levantar aunque los tests pasaban, porque ninguno tocaba SQL real. Lo diagnostiqué y agregué una compuerta de CI que aplica todas las migraciones sobre un Postgres limpio.',
    },
    {
      title: 'Arreglar el síntoma dos veces es la señal para arreglar la causa',
      body: 'La primera vez que una imagen de terceros dejó de estar disponible, se cambió de registro. Cuando volvió a pasar, diagnostiqué que el error de autorización no era de permisos sino que el repositorio ya no existía, y eliminé la dependencia espejando la imagen en un registro propio.',
    },
    {
      title: 'Lo diseñado no se presenta como hecho',
      body: 'Si una parte del diseño no llegó al código, la presento como diseñada y no implementada.',
    },
  ],
} satisfies AboutProse
