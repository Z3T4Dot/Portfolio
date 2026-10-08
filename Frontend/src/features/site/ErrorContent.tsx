// Blueprint 11 §9 (error de render en una ruta: mensaje claro y enlace a Home; header y footer siguen
// funcionando; nunca se muestra el stack).
import { Link } from 'react-router'
import { PageHeader } from '../../components/ui/PageHeader'
import { href, useLocale } from '../../i18n'

export function ErrorContent() {
  const { locale, t } = useLocale()
  return (
    <>
      <PageHeader title={t('error.title')} lede={t('error.body')} />
      <p>
        <Link to={href('home', locale)}>{t('error.home')}</Link>
      </p>
    </>
  )
}
