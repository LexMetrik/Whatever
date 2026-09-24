import { useId, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { NormChip } from '../../../components/vorlagen/NormChip';
import { GruppenKopf } from '../../../components/ui/GruppenKopf';
import { EntstehungsBlock } from '../../../components/entstehung/EntstehungsBlock';
import { sammleVerweise } from '../parts/ArtikelLeser.fussnoten';
import type { BlattArtikel } from './panelModell';
import type { MaterialBezug, Werkzeug } from '../../../lib/normtext/werkzeuge';
import { fassungsMarkeEtikett } from '../fassungsEtikett';
import { bestimmungGenitiv as dieses, type BestimmungsWort } from './erlassWortlaut';

// ═══ W2·29-WERKBANK-LESER S6 W1f · WAS AM ARTIKEL STAND, STEHT IM BLATT ══════
//
// Entscheid David 24.9.2026, wörtlich: «also blatt teil soll raus. verweise
// soll auch in blatt. und die zeile soll ganz weg. infos sollen alle im blatt
// erscheinen. einzige ausnahme sind wenn fussnoten aktiviert sind die sollen
// unten am artikel erschienen». Dazu: Verweise «Oben im Blatt» (ein schmaler
// Abschnitt über den Reitern, KEIN sechster Reiter), die Aktionen «Klein am
// Artikel».
//
// Bis hierher trug die Funktionszeile am Artikelende (`parts/Funktionszeile`,
// gelöscht) fünf Rubriken dieses EINEN Artikels. Drei davon hatte das Blatt
// schon artikelscharf oder erlassweit (Entscheide, Erläuterungen, Werkzeuge);
// zwei hatte es gar nicht (Fassung, Verweise). Diese Datei holt die
// artikelscharfe Auskunft ins Blatt, damit mit der Zeile keine Information
// verschwindet (§8):
//
//   Rubrik der Zeile   jetzt im Blatt
//   ────────────────   ──────────────────────────────────────────────────────
//   Fassung            Reiter «Änderungen», oben: `BlattFassung`
//   Entscheide         Reiter «Entscheide» (war schon artikelscharf)
//   Erläuterungen      Reiter «Erläuterungen», oben: `BlattArtikelGruppe`
//   Verweise           über den Reitern: `BlattVerweise`
//   Werkzeuge          Reiter «Werkzeuge», oben: `BlattArtikelGruppe`
//
// KEINE ZWEITE RECHNUNG (§5): die Verweise sammelt dieselbe Funktion wie bisher
// (`sammleVerweise`), die Fassung zeigt dieselbe Karte (`EntstehungsBlock`,
// darin `ArtikelHistorieZeile`), die Erläuterungen kommen aus derselben
// Nachschlage-Hook (`../artikelMaterialienLaden`), die Werkzeuge aus derselben
// Tabelle (`../randNotizWerkzeuge`). Der «aktive Artikel» ist derselbe, den der
// Reiter «Entscheide» seit H3 zeigt (`./panelModell.panelBezug`).
//
// ── ÜBERSICHTLICH STATT VOLL (Nachtrag David 24.9.2026) ─────────────────────
// Wörtlich: «nicht zu viele infos resp. darauf achten dass es übersichtlich
// erscheint» und «noch mehr am werkbank entwurf orientieren sodass klarer
// unterteilt ist». Darum stehen Verweise und Fassung je als EINE Klappzeile —
// die Anatomie des Boards «Fliesstext-Blatt» (Werkbank-Entwurf, Abschnitt
// «▸ Verweise 0»): Registerlinie oben, ▸, Überzeile links, Zahl bzw. Stand
// rechts. Der Inhalt rendert erst aufgeklappt — die Fassungs-Karte lädt ihre
// Projektion beim Einhängen, und das soll erst auf Wunsch geschehen (Auflage
// David 6.9.2026, «nur auf Wunsch sichtbar»). Farben ausschliesslich über die
// Register-Token (`border-reg-g`), nie über Board-Hexwerte (§13).

// Der Blatt-Artikel selbst (Typ + Auflösung) steht als Modell-Funktion neben
// `panelBezug` in `./panelModell` — er ist dieselbe Frage «worauf bezieht sich
// das Blatt?», und der Rahmen importiert ihn von dort (v3-Grenze 420 Zeilen).
export type { BlattArtikel } from './panelModell';

/**
 * Eine Klappzeile des Blatts (Board-Anatomie, s. Kopf). `<button>` mit
 * `aria-expanded`, kein `<details>`: ein geschlossenes `<details>` rendert
 * seinen React-Inhalt trotzdem — die Fassungs-Karte lüde dann beim blossen
 * Scrollen je Artikel ihre Projektion.
 */
function Klappzeile({ titel, rechts, name, daten, children }: {
  titel: string;
  rechts: string;
  /** Zugänglicher Name — nennt Rubrik UND Artikel (WCAG 4.1.2). */
  name: string;
  daten: Record<string, string>;
  children: ReactNode;
}) {
  const [auf, setAuf] = useState(false);
  const id = useId();
  const knopf = useRef<HTMLButtonElement>(null);
  return (
    // Escape schliesst die OFFENE Klappzeile und gibt den Fokus an ihren Griff —
    // dieselbe Regel wie an der gefallenen Zeile (W2·26/Z4); erst ein zweites
    // Escape erreicht das Blatt (`./usePopoverAutoZu`, Fenster-Hörer).
    <section {...daten} className="shrink-0 px-3 pt-2"
      onKeyDown={(ev) => {
        if (ev.key !== 'Escape' || !auf) return;
        ev.stopPropagation();
        setAuf(false);
        knopf.current?.focus();
      }}>
      <button ref={knopf} type="button" aria-expanded={auf} aria-controls={auf ? id : undefined} aria-label={name}
        onClick={() => setAuf((v) => !v)}
        // `.lc-btn-mini` ist der Knopf-Baustein (Höhe `--tap-ziel`, WCAG 2.5.8);
        // Rahmen und Rundung weichen der Registerlinie oben (Board-Anatomie).
        className="lc-btn-mini w-full justify-start gap-1.5 rounded-none border-0 border-t-2 border-reg-g px-0 pb-1 pt-2 text-left hover:text-ink-900">
        <span aria-hidden className="w-2.5 shrink-0 text-ink-600">{auf ? '▾' : '▸'}</span>
        <span className="lc-overline">{titel}</span>
        <span className="num ml-auto text-xs text-ink-600">{rechts}</span>
      </button>
      {auf && <div id={id} className="pb-2 pt-1">{children}</div>}
    </section>
  );
}

/**
 * «Verweise dieses Artikels» — oben im Blatt, über jedem Reiter, zugeklappt.
 *
 * NULL VERWEISE ⇒ KEINE ZEILE (Nachtrag David 24.9.2026, «nicht zu viele
 * infos»). Die Null ist gesichert — die Verweise stehen aus dem Artikel selbst,
 * es wartet kein Shard —, also verschweigt der fehlende Abschnitt nichts, was
 * erst noch käme. Die Rückrichtung («wer verweist auf ihn») führen wir nicht
 * (W2·22-VERWEIS-FEDLEX Z4); der Aufklapp-Inhalt sagt das, damit die Liste
 * nicht für vollständig gehalten wird (§8).
 */
export function BlattVerweise({ artikel, zitat, wort }: {
  artikel: BlattArtikel | null;
  zitat: string;
  wort: BestimmungsWort;
}) {
  if (!artikel) return null;
  const verweise = sammleVerweise(artikel.eintrag.bloecke);
  if (verweise.length === 0) return null;
  return (
    <Klappzeile key={artikel.eintrag.artikel} titel={`Verweise ${dieses(wort)}`} rechts={String(verweise.length)}
      name={`${verweise.length} Verweise in ${zitat}`}
      daten={{ 'data-v3-blatt-verweise': artikel.eintrag.artikel }}>
      <span className="flex flex-wrap items-center gap-1.5">
        {verweise.map((v) => <NormChip key={v} artikel={v} />)}
      </span>
      <p className="mt-1 text-micro text-ink-500">Nur Verweise, die hier stehen; wer auf diese Bestimmung verweist, führen wir noch nicht.</p>
    </Klappzeile>
  );
}

/**
 * Die Fassung DIESES Artikels oben im Reiter «Änderungen»: zugeklappt EINE
 * Zeile mit dem Stand («Gilt seit 1.1.2023», dieselbe Zeichenkette wie die
 * frühere Marke, `../fassungsEtikett`), aufgeklappt dieselbe Karte wie die
 * Rubrik «Fassung» (Zeitleiste, Entstehung, Alt/Neu). Ohne Historie-Eintrag
 * steht nichts (§8: wie die Rubrik, die ohne echte Zahl nicht erschien); der
 * erlassweite Reiter darunter bleibt.
 */
export function BlattFassung({ artikel, erlassKey, zitat, wort }: {
  artikel: BlattArtikel | null;
  erlassKey?: string;
  zitat: string;
  wort: BestimmungsWort;
}) {
  if (!artikel?.historie?.ereignisse?.length) return null;
  const { historie, eintrag } = artikel;
  return (
    <Klappzeile key={eintrag.artikel} titel={`Fassung ${dieses(wort)}`} rechts={fassungsMarkeEtikett(historie)}
      name={`Fassung von ${zitat}: ${fassungsMarkeEtikett(historie)}, ${historie.ereignisse.length} Änderungsstände`}
      daten={{ 'data-v3-blatt-fassung': eintrag.artikel }}>
      <EntstehungsBlock historie={historie} erlassKey={erlassKey} artikel={eintrag.artikel} snapshot={eintrag} />
    </Klappzeile>
  );
}

/** Die artikelscharfe Gruppe oben in «Materialien», «Erläuterungen» und
 *  «Werkzeuge». Leer ⇒ ehrlich «Zu Art. N nichts erfasst.» (§8, Auftrag
 *  24.9.2026) — aber erst, wenn die Quelle GELADEN ist: vorher wäre «nichts»
 *  eine Behauptung über etwas, das noch kommt. */
export function BlattArtikelGruppe({ titel, zahl, daten, token, geladen = true, children }: {
  titel: string;
  zahl: number;
  /** Ist die Quelle der Gruppe durch? Sonst steht (noch) nichts. */
  geladen?: boolean;
  /** Anker der Sonden: `data-v3-blatt-artikelgruppe="<reiter>"`. */
  daten: string;
  /** Token des aktiven Artikels — `data-v3-blatt-artikel`, damit eine Sonde
   *  prüfen kann, WELCHEM Artikel die Gruppe gilt (nicht nur, dass sie steht). */
  token: string | null;
  children: ReactNode;
}) {
  if (!token || !geladen) return null;
  if (zahl === 0) {
    return (
      <p data-v3-blatt-artikelgruppe={daten} data-v3-blatt-artikel={token} data-v3-blatt-leer
        className="px-3 pt-2 text-body-s text-ink-600">{titel} nichts erfasst.</p>
    );
  }
  return (
    <section data-v3-blatt-artikelgruppe={daten} data-v3-blatt-artikel={token} className="px-3 pt-2">
      <GruppenKopf als="p" dicht titel={titel} zahl={zahl} />
      <ul className="m-0 mt-0.5 grid list-none gap-1 p-0">{children}</ul>
    </section>
  );
}

/**
 * Der ERLASSWEITE Teil eines Reiters, unter dem Artikel-Teil und ZUGEKLAPPT
 * («Alle Änderungen des Erlasses · 12»). Auftrag 24.9.2026: «Standard ist nur
 * der Artikelteil offen» — David: «nicht zu viele infos». Die Liste selbst ist
 * unverändert die bisherige Tafel; sie hängt sich erst beim Aufklappen ein.
 */
export function ErlassTeil({ was, zahl, daten, children }: {
  /** «Änderungen», «Materialien», … — Reitername im Plural. */
  was: string;
  /** Anzahl, sobald bekannt; `null` = (noch) keine Zahl, dann steht keine. */
  zahl: number | null;
  daten: string;
  children: ReactNode;
}) {
  return (
    <Klappzeile titel={`Alle ${was} des Erlasses`} rechts={zahl === null ? '' : String(zahl)}
      name={`Alle ${was} des Erlasses${zahl === null ? '' : ` (${zahl})`}`}
      daten={{ 'data-v3-blatt-erlassteil': daten }}>
      {/* Die Tafel trägt ihren eigenen Seitenabstand (`px-3`). */}
      <div className="-mx-3">{children}</div>
    </Klappzeile>
  );
}

/** Eine Erläuterung des Artikels (Anatomie der früheren Rubrik `m`). */
export function ArtikelErlaeuterung({ m }: { m: MaterialBezug }) {
  return (
    <li data-bez-material className="grid border-l-2 border-l-reg-m pl-2.5 text-body-s">
      <Link to={m.pfad}>{m.titel}</Link>
      <span className="text-micro text-ink-500">
        {m.behoerdeKuerzel} {m.doktypLabel}{m.sublabel ? ` · ${m.sublabel}` : ''}
      </span>
    </li>
  );
}

/** Ein Werkzeug des Artikels (Anatomie der früheren Rubrik `w`). */
export function ArtikelWerkzeug({ w }: { w: Werkzeug }) {
  return (
    <li className="grid border-l-2 border-l-reg-w pl-2.5 text-body-s">
      <Link to={w.href}>{w.titel}</Link>
      {/* Ein Rechner rechnet, eine Vorlage füllt ein Dokument. */}
      <span className="text-micro text-ink-500">{w.modus === 'vorlage' ? 'Vorlage' : 'Rechner'}</span>
    </li>
  );
}
