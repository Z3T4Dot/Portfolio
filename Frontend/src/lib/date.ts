// Blueprint 11 §2 (lib: fechas por idioma), 02 §Navegación (fecha de la última actualización) y
// 02 §About (periodos del Engineering Timeline).

/**
 * Fecha `AAAA-MM-DD` legible en el idioma pedido ("6 de octubre de 2026", "October 6, 2026").
 * En UTC, para que el prerender y el navegador produzcan el mismo texto.
 */
export function formatDate(isoDate: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(`${isoDate}T00:00:00Z`),
  )
}

const monthOf = (yearMonth: string) => new Date(`${yearMonth}-01T00:00:00Z`)

/**
 * Periodo `AAAA-MM` → `AAAA-MM` legible ("abril–septiembre de 2026", "April – September 2026").
 * Sin fin, o con el mismo mes, devuelve solo el inicio ("julio de 2025"): quien llama decide cómo
 * decir que sigue en curso. En UTC, como formatDate.
 */
export function formatMonthPeriod(start: string, end: string | null, locale: string): string {
  const format = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' })
  return end === null || end === start
    ? format.format(monthOf(start))
    : format.formatRange(monthOf(start), monthOf(end))
}

/**
 * Etiqueta de periodo de una etapa del timeline (02, 03 Timeline), sola en su línea: un periodo
 * cerrado empieza en mayúscula ("Abril–septiembre de 2026"); uno en curso usa la frase que reciba
 * (`since`, p. ej. "Desde {date}"), con la fecha tal cual ("Desde julio de 2025").
 */
export function formatStagePeriod(
  start: string,
  end: string | null,
  locale: string,
  since: (date: string) => string,
): string {
  const period = formatMonthPeriod(start, end, locale)
  if (end === null) return since(period)
  return `${period.charAt(0).toLocaleUpperCase(locale)}${period.slice(1)}`
}
