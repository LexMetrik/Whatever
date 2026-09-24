import { Link } from 'react-router-dom';
import { GruppenKopf } from '../../../components/ui/GruppenKopf';
import { werkzeugAnsicht, type WerkzeugZeile } from './werkzeugModell';

// ─── Reiter «Werkzeuge» (S6, Entscheid David 23.9.2026) ─────────────────────
//
// Die Rechner und Vorlagen dieses Hauses zum Erlass — EINE Zeile je Werkzeug,
// mit den Artikeln, zu denen es passt (Modell und Herleitung:
// `./werkzeugModell`). Hervorgegangen aus der Hälfte «Werkzeuge» des Reiters
// «Anwendung» (W2·7-VZUI); die Behörden-Praxis steht seither im eigenen
// Reiter «Erläuterungen».
//
// SYNCHRON: die Zuordnung ist eine statische Tabelle, es gibt nichts zu laden
// und darum keinen Lade- oder Fehlerzustand (§15: kein Byte über die Leitung).
//
// ── AN-14 · DER BELEG IST ERREICHBAR, NICHT NUR ÜBERFAHRBAR ────────────────
// Der fachliche Beleg einer Zuordnung (§7) stand bis hierher allein im
// `title` des Artikel-Etiketts — mit der Maus erreichbar, mit Tastatur und
// Finger nicht. Er steht jetzt in einem `<details>` je Zeile («Zuordnung»):
// fokussierbar, antippbar, und zugeklappt kostet er eine Zeile.

function Zuordnung({ z }: { z: WerkzeugZeile }) {
  if (z.artikel.length === 0) return null;
  return (
    <details data-v3-werkzeug-beleg className="mt-0.5">
      <summary className="cursor-pointer text-micro text-ink-600 hover:text-ink-900">
        <span className="num">zu {z.artikel.map((a) => a.label).join(' · ')}</span>
        <span className="text-ink-500"> — Zuordnung</span>
      </summary>
      <ul className="mt-0.5 grid gap-1 pl-2.5">
        {z.artikel.map((a) => (
          <li key={a.label} className="text-micro leading-snug text-ink-600">{a.beleg}</li>
        ))}
      </ul>
    </details>
  );
}

function Art({ z }: { z: WerkzeugZeile }) {
  return (
    <span className="text-micro text-ink-500">
      {z.modus === 'vorlage' ? 'Vorlage' : 'Rechner'}
      {/* Status wie im Katalog (`components/Katalog.tsx`): «Entwurf» heisst
          erstellt, fachlich noch nicht geprüft (§8). */}
      {z.status === 'entwurf' && (
        <span className="lc-badge-entwurf ml-1.5 align-middle" title="erstellt, fachlich noch nicht geprüft">Entwurf</span>
      )}
    </span>
  );
}

export function PanelWerkzeuge({ erlassKey }: { erlassKey: string }) {
  const { verfuegbar, geplant, erlassWeit } = werkzeugAnsicht(erlassKey);
  if (verfuegbar.length === 0 && geplant.length === 0) {
    return (
      <p data-v3-panel-reiter-inhalt="werkzeuge" className="px-3 py-3 text-body-s text-ink-600">
        Zu diesem Erlass führen wir bisher keinen Rechner und keine Vorlage.
      </p>
    );
  }
  return (
    <div data-v3-panel-reiter-inhalt="werkzeuge" className="px-3 py-1">
      <section data-v3-werkzeuge={erlassWeit ? 'erlass' : 'artikel'} className="pt-1">
        <GruppenKopf als="p" dicht titel="Rechner und Vorlagen" zahl={verfuegbar.length} />
        {/* §8: WIE genau die Zuordnung ist, steht da — artikelscharf mit Beleg,
            oder ausdrücklich nur dem Erlass als Ganzem zugeordnet. */}
        <p className="pb-1 pt-0.5 text-micro leading-snug text-ink-500">
          {erlassWeit
            ? 'Dem Erlass als Ganzem zugeordnet, nicht einzelnen Artikeln.'
            : 'Eindeutige Zuordnungen zu Artikeln dieses Erlasses; Zweifelsfälle sind bewusst ausgelassen.'}
        </p>
        {verfuegbar.length > 0 && (
          <ul className="mt-0.5">
            {verfuegbar.map((z) => (
              <li key={z.id} data-v3-werkzeug={z.id} className="border-l-2 border-t border-line border-l-reg-w py-2 pl-2.5">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <Link to={z.href ?? '#'} className="text-body-s font-medium text-ink-800 no-underline hover:text-ink-900">{z.titel}</Link>
                  <Art z={z} />
                </span>
                <Zuordnung z={z} />
              </li>
            ))}
          </ul>
        )}
        {geplant.length > 0 && (
          // AN-12 · wie im Katalog: hinter einer eigenen Aufklappzeile, ohne Link.
          <details data-v3-werkzeuge-geplant className="border-t border-line py-2">
            <summary className="cursor-pointer text-micro text-ink-600 hover:text-ink-900">
              In Vorbereitung (<span className="num">{geplant.length}</span>)
            </summary>
            <ul className="mt-1">
              {geplant.map((z) => (
                <li key={z.id} data-v3-werkzeug-geplant={z.id} className="border-t border-line py-1.5 pl-2.5">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-body-s text-ink-700">{z.titel}</span>
                    <span className="lc-badge-geplant">In Vorbereitung</span>
                  </span>
                  <Zuordnung z={z} />
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>
    </div>
  );
}
