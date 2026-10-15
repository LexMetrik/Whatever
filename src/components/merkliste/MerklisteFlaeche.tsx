import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MERKLISTE_PARAM, dekodiereMerkliste, entferneMerkung, leereMerkliste, merklisteLink, uebernimmMerkliste,
} from '../../lib/merkliste';
import { RegisterStrich } from '../start/ZuletztVerwendet';
import { StartFlaeche } from '../start/StartFlaeche';
import { SchliessKnopf } from '../ui/SchliessKnopf';
import { useKopieren } from '../useKopieren';
import { useMerkliste } from './useMerkliste';

// ─── «Merkliste» — Fläche der Startseite (LESER-NAV · R-2) ───────────────────
//
// MEHRWERT gegenüber Fedlex (gemessen 15.10.2026, www.fedlex.admin.ch, SR 220 und
// FAQ: weder Merkliste noch Konto, nur Drucken/HTML/PDF): ein Jurist sammelt hier
// Artikel, Erlasse und Entscheide quer über alle Bestände an EINEM Ort, ganz ohne
// Konto, und gibt die Liste als Link an Kollegen weiter.
//
// Die Liste lebt in `lib/merkliste.ts` (nur dieses Gerät, §3). Hier: ansehen,
// einzeln entfernen, leeren, als Link teilen und einen geteilten Link ÜBERNEHMEN —
// nie stillschweigend: ein fremder Link zeigt zuerst, was er enthält (§8).
// OHNE EINTRÄGE UND OHNE LINK KEINE FLÄCHE (keine Überschrift über Leerraum).
// Der Link `/?merkliste=…` landet auf der Startseite, weil die Merkliste keine
// eigene Route hat (kein neuer Prerender-/Sitemap-Eintrag für reinen Lokalzustand).

/** So viele Zeilen vor «Alle anzeigen» (Darstellung, nicht Speicher). */
const SICHTBAR = 6;

export function MerklisteFlaeche() {
  const liste = useMerkliste();
  const { search } = useLocation();
  const navigate = useNavigate();
  const payload = new URLSearchParams(search).get(MERKLISTE_PARAM);
  const geteilt = useMemo(() => (payload ? dekodiereMerkliste(payload) : null), [payload]);
  const [alle, setAlle] = useState(false);
  const [leerenFrage, setLeerenFrage] = useState(false);
  const [status, setStatus] = useState('');
  const [fokusRoute, setFokusRoute] = useState<string | null>(null);
  const { marke, kopieren } = useKopieren();

  // Fokus nach dem Entfernen auf die Nachbarzeile — sonst fiele er auf <body> (WCAG 2.4.3).
  useEffect(() => {
    if (!fokusRoute) return;
    const el = Array.from(document.querySelectorAll<HTMLElement>('[data-merk-route]'))
      .find((li) => li.dataset.merkRoute === fokusRoute)?.querySelector<HTMLElement>('a');
    el?.focus();
    setFokusRoute(null);
  }, [fokusRoute, liste]);

  if (liste.length === 0 && !payload) return null;

  const entferne = (route: string, idx: number) => {
    const nachbar = liste[idx + 1] ?? liste[idx - 1];
    if (!entferneMerkung(route)) { setStatus('Nicht entfernt: der Browser lässt keinen Speicher zu.'); return; }
    setStatus('');
    if (nachbar) setFokusRoute(nachbar.route);
  };
  const verwirf = () => navigate('/', { replace: true });
  const uebernimm = () => {
    if (!geteilt) return;
    // Date.now() ist in der Darstellungsschicht erlaubt (nicht in src/lib, §2).
    const n = uebernimmMerkliste(geteilt, Date.now());
    if (n < 0) { setStatus('Nicht übernommen: der Browser lässt keinen Speicher zu.'); return; }
    setStatus(n === 0 ? 'Alle Stellen waren schon gemerkt.' : `${n} ${n === 1 ? 'Stelle' : 'Stellen'} übernommen.`);
    navigate('/', { replace: true });
  };
  const sichtbar = alle ? liste : liste.slice(0, SICHTBAR);
  const ursprung = typeof window !== 'undefined' ? window.location.origin : 'https://lexmetrik.ch';

  return (
    <StartFlaeche titel="Merkliste">
      {payload && (
        <div className="grid gap-y-2 border-b border-rule pb-3" data-merkliste-import>
          {geteilt ? (
            <>
              <p className="font-sans text-body-s text-ink-900">
                Geteilte Merkliste mit {geteilt.length} {geteilt.length === 1 ? 'Stelle' : 'Stellen'}. Noch nichts übernommen:
              </p>
              <ul className="grid gap-y-1 font-sans text-body-s text-ink-700">
                {geteilt.map((e) => (
                  <li key={e.route} className="min-w-0 truncate" title={`${e.titel} (${e.route})`}>
                    {e.titel} <span className="text-micro text-ink-500">{e.route}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="font-sans text-body-s text-ink-900">Dieser Link enthält keine gültige Merkliste.</p>
          )}
          <div className="flex flex-wrap gap-2">
            {geteilt && <button type="button" className="lc-btn-outline lc-btn-sm" onClick={uebernimm}>Übernehmen</button>}
            <button type="button" className="lc-btn-outline lc-btn-sm" onClick={verwirf}>{geteilt ? 'Verwerfen' : 'Schliessen'}</button>
          </div>
        </div>
      )}
      {liste.length > 0 && (
        <>
          <ul className="grid gap-x-8 gap-y-1.5 font-sans text-body-s @xl:grid-cols-2">
            {sichtbar.map((e, i) => (
              <li key={e.route} data-merk-route={e.route} className="flex min-w-0 items-center justify-between gap-1">
                <Link to={e.route} title={e.titel}
                  className="inline-flex min-w-0 max-w-full items-center border-b border-rule-soft pb-px no-underline hover:border-ink-900 hover:text-ink-900">
                  <RegisterStrich typ={e.typ} />
                  <span className="truncate">{e.titel}</span>
                </Link>
                <SchliessKnopf name={`${e.titel} aus der Merkliste entfernen`} onClick={() => entferne(e.route, i)} />
              </li>
            ))}
          </ul>
          {liste.length > SICHTBAR && (
            <button type="button" aria-expanded={alle} onClick={() => setAlle((v) => !v)}
              className="justify-self-start font-sans text-body-s text-ink-700 underline underline-offset-2 hover:text-ink-900">
              {alle ? 'Weniger anzeigen' : `Alle ${liste.length} anzeigen`}
            </button>
          )}
          <div className="flex flex-wrap items-center gap-2 border-t border-rule-soft pt-2">
            {/* §8: die Liste liegt nur in diesem Browser — wer sie braucht, teilt sie als Link. */}
            <span className="mr-auto text-micro leading-snug text-ink-500">Nur auf diesem Gerät</span>
            <button type="button" className="lc-btn-outline lc-btn-sm"
              onClick={() => kopieren({ text: merklisteLink(ursprung, liste), marke: 'link', ansage: 'Link zur Merkliste kopiert' })}>
              {marke === 'link' ? '✓ Link kopiert' : 'Als Link teilen'}
            </button>
            {leerenFrage ? (
              <>
                <button type="button" className="lc-btn-outline lc-btn-sm"
                  onClick={() => { if (leereMerkliste()) setLeerenFrage(false); else setStatus('Nicht geleert: der Browser lässt keinen Speicher zu.'); }}>
                  Wirklich leeren
                </button>
                <button type="button" className="lc-btn-outline lc-btn-sm" onClick={() => setLeerenFrage(false)}>Abbrechen</button>
              </>
            ) : (
              <button type="button" className="lc-btn-outline lc-btn-sm" onClick={() => setLeerenFrage(true)}>Leeren</button>
            )}
          </div>
        </>
      )}
      <p role="status" className={status ? 'font-sans text-body-s text-ink-900' : 'sr-only'}>{status}</p>
    </StartFlaeche>
  );
}
