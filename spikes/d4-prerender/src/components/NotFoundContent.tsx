import { Link } from "react-router";
import { messages, type Lang } from "../lib/i18n";
import { href } from "../lib/seo";

export function NotFoundContent({ lang }: { lang: Lang }) {
  const t = messages[lang];
  return (
    <>
      <h1>{t.notFoundTitle}</h1>
      <p>{t.notFoundBody}</p>
      <ul>
        <li>
          <Link to={href(lang, "/")}>{t.nav.home}</Link>
        </li>
        <li>
          <Link to={href(lang, "/work/")}>{t.nav.work}</Link>
        </li>
      </ul>
    </>
  );
}
