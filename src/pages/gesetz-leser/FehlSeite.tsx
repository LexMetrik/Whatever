import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { filtern } from '../../lib/normtext/browse';
import { istLesbar } from '../../lib/normtext/browse-typen';
import type { BrowseManifest } from '../../lib/normtext/browse-typen';
import { erlassVorschlaege } from './helpers';
import { erlassPfad } from '../../lib/normtext/erlassAdresse';
import { FehlSeite } from '../../components/ui/FehlSeite';
import { SeitenKopf } from '../../components/layout/SeitenKopf';
import { usePaneKlasse } from '../../components/layout/PaneKontext';
import { AbrufFehler } from '../../components/ui/AbrufFehler';
import type { LeserFehler, LadefehlerZustand } from './inhalt-zustand';

// ─── W2·10-UI-NAV/N0b: hilfreiche Fehlseite für einen unbekannten Erlass-Key ───
//
// Statt der nackten «nicht verfügbar»-Notiz: den ANGEFRAGTEN Key nennen (§8 —
// ehrlich, nichts Erfundenes), deterministische Fuzzy-Vorschläge aus dem
// Browse-Manifest («Meinten Sie …?», erlassVorschlaege = norm()+Levenshtein,
// kein neuer Index/K10) und ein eingebettetes Erlass-Suchfeld über das Register.
// Reine Darstellung/Navigation (§3) — keine Rechtslogik.
//
// ── D-6 (Design-Konsistenz, 31.8.2026) · DIE HÜLLE IST JETZT GETEILT ────────
// Kopf, Aussage und Rückweg kamen bis hierher aus dieser Datei allein — mit
// eigenem `lc-notice-warn`-Kasten, ohne H1 und mit «‹» statt «←». Die drei
// Stücke stehen jetzt in `components/ui/FehlSeite` (Herleitung dort); der
// Satz «‹key› ist nicht als Erlass im Bestand.» ist dabei WÖRTLICH erhalten
// geblieben — er wurde zum Kanon-Lead des Bausteins, weil er als einziger der
// vier den angefragten Schlüssel nannte (§8).
// WAS HIER BLEIBT: die beiden Zonen, die nur diese Domäne kennt — die
// deterministischen «Meinten Sie …?»-Vorschläge und das Register-Suchfeld.
// Genau die Arbeitsteilung, die §5/§10 verlangt: die geteilte Anatomie oben,
// die domänen-eigene Auskunft als Inhalt hineingereicht.
//
// ── W2·17-UI-BEFUNDE (PA-3-B01/B02, PE-C10-D01) · ZWEI AUSKÜNFTE, EINE WEICHE ──
// «Nicht im Bestand» ist eine Auskunft über den ERLASS (nicht im Register, Datei
// 404). Ein Funkloch oder ein 5xx ist eine Auskunft über die VERBINDUNG — und
// darf nie als erstere erscheinen: die alte Seite behauptete ««OR» ist nicht als
// Erlass im Bestand» und schlug «OR» als Vorschlag vor (§8). Welche Auskunft
// gilt, trägt das `fehler`-Feld DIESER Leser-Instanz (`LeserFehler`, gesetzt von
// `useLeserDaten`) — kein Kanal je Erlass-Schlüssel: zwei Fenster mit demselben
// Erlass können verschiedene Auskünfte haben (Auflage A1, Gegenprüfung #1256).
export function GesetzFehlSeite({ schluessel, manifest, fehler }: {
  schluessel: string;
  manifest: BrowseManifest | null;
  /** Das Fehlerfeld der Instanz; ohne Ladefehler gilt «nicht im Bestand». */
  fehler: Exclude<LeserFehler, false>;
}) {
  return typeof fehler === 'object'
    ? <GesetzLadeFehler schluessel={schluessel} manifest={manifest} ladefehler={fehler} />
    : <GesetzNichtImBestand schluessel={schluessel} manifest={manifest} />;
}

/** Der Erlass lässt sich gerade nicht laden — ehrliche Meldung mit «Erneut laden»
 *  statt «nicht im Bestand». Kein Vorschlags-/Suchblock: der Erlass ist nicht
 *  unbekannt, es fehlt nur die Verbindung. Der Weiterweg bleibt (REGL:122/C1). */
function GesetzLadeFehler({ schluessel, manifest, ladefehler }: {
  schluessel: string;
  manifest: BrowseManifest | null;
  ladefehler: LadefehlerZustand;
}) {
  const art = ladefehler.grund;
  const pk = usePaneKlasse();
  // Bei «datei» steht der Erlass im Register: die amtliche Quelle ist ein echter Ausweg.
  const quelle = art === 'datei' ? manifest?.erlasse.find((e) => e.key === schluessel)?.quelleUrl : undefined;
  const erklaerung = art === 'datei'
    ? 'Der Erlass ist im Bestand, seine Daten konnten aber gerade nicht abgerufen werden (Verbindung oder Server).'
    : 'Das Verzeichnis der Erlasse konnte gerade nicht abgerufen werden (Verbindung oder Server). Ob dieser Erlass im Bestand ist, lässt sich so nicht sagen.';
  return (
    <div className={pk('py-16 space-y-6', 'py-6 space-y-5')} data-leser-ladefehler={art}>
      <SeitenKopf overline="Gesetzessammlung" titel="Erlass nicht geladen" intro={erklaerung} />
      <div role="alert">
        <AbrufFehler gegenstand={`Der Erlass «${schluessel}»`} href={quelle || undefined}
          onErneut={ladefehler.erneut} />
      </div>
      <nav aria-label="Weiterweg" className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <Link to="/gesetze" className="lc-link text-body-s font-medium text-brass-700 hover:text-brass-600">
          ← Zur Gesetzessammlung
        </Link>
      </nav>
    </div>
  );
}

function GesetzNichtImBestand({ schluessel, manifest }: {
  schluessel: string;
  manifest: BrowseManifest | null;
}) {
  const [filter, setFilter] = useState('');
  const erlasse = useMemo(() => manifest?.erlasse ?? [], [manifest]);

  const vorschlaege = useMemo(
    () => erlassVorschlaege(erlasse, schluessel, 6),
    [erlasse, schluessel],
  );
  // Suchfeld: über die lesbaren Erlasse (Volltext/PDF), damit jeder Treffer auch
  // wirklich in eine Lesesicht führt (§8). Leerer Filter → keine Liste (ruhig).
  const treffer = useMemo(() => {
    if (filter.trim() === '') return [];
    return filtern(erlasse.filter(istLesbar), filter).slice(0, 12);
  }, [erlasse, filter]);

  const pfad = erlassPfad;

  return (
    <FehlSeite
      bereich="Gesetzessammlung" objekt="Erlass" name={schluessel}
      wege={[{ to: '/gesetze', label: 'Zur Gesetzessammlung' }]}
      vorschlaege={vorschlaege.length > 0 ? (
        <div className="space-y-2">
          <p className="lc-overline">Meinten Sie …?</p>
          <div className="flex flex-wrap gap-1.5">
            {vorschlaege.map((e) => (
              <Link key={`${e.ebene}/${e.key}`} to={pfad(e)}
                className="lc-chip hover:text-brass-700 hover:border-brass-300"
                title={e.titel}>
                {e.kuerzel}
              </Link>
            ))}
          </div>
        </div>
      ) : undefined}
      suchfeld={(
        <div className="space-y-2">
          <label htmlFor="fehl-erlass-suche" className="lc-overline">Erlass suchen</label>
          <input id="fehl-erlass-suche" type="search" value={filter}
            onChange={(ev) => setFilter(ev.target.value)}
            placeholder="Kürzel, Titel oder SR-Nummer …" aria-label="Erlass suchen"
            className="lc-input h-9 py-0 text-body-s w-full max-w-reading" />
          {filter.trim() !== '' && (
            treffer.length > 0 ? (
              <ul className="space-y-1">
                {treffer.map((e) => (
                  <li key={`${e.ebene}/${e.key}`}>
                    <Link to={pfad(e)} className="inline-flex min-h-11 items-center gap-2 text-body-s text-ink-700 hover:text-brass-700 no-underline">
                      <span className="num font-medium">{e.kuerzel}</span>
                      <span className="truncate text-ink-500">{e.titel}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              // Kein `ui/Leerzustand`: dieser Satz steht INNERHALB einer
              // Fehlseite, deren Weiterweg schon unten steht — der Pflicht-
              // Weiterweg der Filter-Variante wäre hier ein zweiter Ausweg
              // in derselben Ansicht. Form (nackter Absatz, `text-body-s
              // text-ink-500`) und Wortlaut sind identisch zum D-7-Kanon.
              <p className="text-body-s text-ink-500">Kein Erlass gefunden.</p>
            )
          )}
        </div>
      )}
    />
  );
}
