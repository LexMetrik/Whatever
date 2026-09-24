import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { berechneAllgemeineFrist, type Einheit } from '../../lib/allgemeineFrist';
import { berechneFrist } from '../../lib/zpoFristen';
import { berechneSchkgFrist } from '../../lib/schkgFristen';
import { berechneBggVwvgFrist, bvAusnahmenSatz } from '../../lib/bggVwvgFristen';
import { zpoFristenLink, SCHKG_LINK_SPEC } from '../../lib/rechnerPermalinks';
import { permalinkKodieren } from '../../lib/permalink';
import { KANTONE } from '../../lib/kantone';
import { stillstandsperioden } from '../../data/zpoFeiertage';
import type { Kanton } from '../../types/legal';
import { ErgebnisBlock } from '../ErgebnisBlock';
import { DatumsFeld } from '../DatumsFeld';
import { ErgebnisPlatzhalter, FehlerBox, Field } from '../vorlagen/ui';
import { IcsExportButton } from '../IcsExportButton';
import type { FristMarkierung } from './FristKalenderKompakt';
import { getStandardKanton } from '../../lib/einstellungen';
import { usePaneKlasse } from '../layout/PaneKontext';
import { EINHEITEN, FERIEN_OPTIONEN, icsTitelSchnellrechner, type EinfacheFristEingaben, type EinfacheFristMeldung, type Ferien } from './einfacheFristTexte';

// ─── Einfacher Fristenrechner (S-5a FAHRPLAN-STRUKTUR-UMBAU) ────────────────
//
// Auftrag David 10.6.2026 abends: «ein ganz simpler fristenrechner … mit
// datum, frist, auswahl ob der rechner ferien nach schkg und zpo oder
// sonstige ferien (sofern einschlägig) oder keine behandeln soll».
// Reine Kompositions-Schicht (§3): je nach Ferien-Wahl rechnet die
// BESTEHENDE Engine (allgemeineFrist · zpoFristen · schkgFristen) — keine
// eigene Rechtslogik. Die ZPO-/SchKG-Aufrufe nutzen offengelegte
// Standard-Annahmen (Ergebnis zeigt sie); Sonderkonstellationen gehören in
// die Voll-Rechner («verfeinern»-Link mit denselben Werten, §5-Kodierung).

const istISOTag = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

const isoLokal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Gerichtsferien-/Stillstand-Perioden rund um das Fristende für die Kalender-
// Markierung (Auftrag David: Stillstand sichtbar machen). DIESELBEN Perioden, die
// die Engine verwendet (§5, data/zpoFeiertage) — Jahr des Fristendes + Vorjahr, weil
// die Weihnachtsperiode über den Jahreswechsel greift. Reine Anzeige (§3).
function stillstandFenster(endeISO: string): { vonISO: string; bisISO: string }[] {
  const jahr = Number(endeISO.slice(0, 4));
  return [jahr - 1, jahr].flatMap((j) => stillstandsperioden(j)).map((p) => ({ vonISO: isoLokal(p.von), bisISO: isoLokal(p.bis) }));
}

// Kalender-Markierung je Ferien-Regime (reine Komposition, §3 — jede Engine liefert
// ein ISO-Enddatum). So zeigt der Kalender das Fristende für ALLE Regimes, nicht nur
// «keine Ferien» (Auftrag David: Kalender immer ersichtlich). null bei Fehleingabe.
function baueMarkierung(start: string, laenge: number, einheit: Einheit, ferien: Ferien, kanton: Kanton): FristMarkierung | null {
  try {
    if (ferien === 'keine') {
      const r = berechneAllgemeineFrist({ start, laenge, einheit, wochenendeVerschieben: true, feiertageVerschieben: true, kanton });
      return { startISO: r.startISO, endeISO: r.endDatumISO, fristbeginnISO: r.fristbeginnISO, verschiebeGruende: r.verschoben ? r.verschiebeGruende : undefined };
    }
    if (ferien === 'zpo') {
      const r = berechneFrist({ ereignis: start, einheit, laenge, verfahren: 'ordentlich', kanton, fristnatur: 'gesetzlich' });
      // ZPO-Gerichtsferien (Art. 145): immer markieren — die Perioden gelten unabhängig
      // davon, ob diese konkrete Frist verschoben wurde (Sichtbarkeit, Auftrag David).
      return { startISO: start, endeISO: r.diesAdQuemISO, hinweis: r.stillstandAktiv ? 'Stillstand (Art. 145 ZPO) berücksichtigt' : undefined, stillstand: stillstandFenster(r.diesAdQuemISO) };
    }
    if (ferien === 'vwvg' || ferien === 'bgg') {
      const r = berechneBggVwvgFrist({ regime: ferien, ereignis: start, einheit, laenge, kanton });
      // VwVG/BGG-Stillstand gilt NUR für nach Tagen bestimmte Fristen → nur dann markieren.
      return { startISO: start, endeISO: r.diesAdQuemISO, hinweis: r.stillstandAktiv ? `Stillstand (${ferien === 'vwvg' ? 'Art. 22a VwVG' : 'Art. 46 BGG'}) berücksichtigt` : undefined, stillstand: r.stillstandAktiv ? stillstandFenster(r.diesAdQuemISO) : undefined };
    }
    const r = berechneSchkgFrist({ ereignis: start, einheit: einheit as 'tage' | 'monate' | 'jahre', laenge, modus: 'schkg_betreibungsferien', fristnatur: 'frist', kanton });
    return { startISO: start, endeISO: r.diesAdQuemISO };
  } catch {
    return null;
  }
}

export function EinfacheFristForm({ minimal = false, variante = 'block', onErgebnis, onEingaben }: {
  minimal?: boolean;
  /** DARSTELLUNGS-Variante, additiv (W2·23-STARTSEITE-V4 §3 #3). `'block'`
   *  (Default) ist die bisherige Anordnung, unverändert. `'zeile'` legt alle
   *  fünf Eingaben in EINE Reihe und lässt den Rechenweg weg — die Startseite
   *  hostet damit den ECHTEN Rechner (§5/§1: keine Kopie der Logik, keine
   *  zweite Fristen-Wahrheit), nur enger gesetzt. Es ändert sich NICHTS an
   *  Eingabe-Bedeutung, Default-Werten oder Engine-Aufruf. */
  variante?: 'block' | 'zeile';
  /** #7: meldet die Kalender-Markierung (Ereignis + Fristende) nach oben — für
   *  ALLE Regimes (jede Engine liefert ein ISO-Enddatum); null bei Fehleingabe. */
  onErgebnis?: (e: { markierung: FristMarkierung; kanton: Kanton } | null) => void;
  /** Live-Brücke (Auftrag David 1.9.2026): meldet gültige Eingaben nach
   *  oben, damit der Tagerechner sie in das Voll-Formular (mit Rechenweg)
   *  weiterreicht. Meldet erst ab der ersten ÄNDERUNG nach dem Mount und
   *  kennzeichnet die tatsächlich BERÜHRTEN Felder — Permalink-/Preset-
   *  hydratisierte Voll-Formulare würden sonst von unberührten Defaults
   *  dieses Rechners überschrieben (GP-Befunde P0/B2, 1.9.2026). */
  onEingaben?: (m: EinfacheFristMeldung) => void;
} = {}) {
  // Datum-Default heute in LOKALER Zeit (Bug-Check §9, NIEDRIG: toISOString
  // wäre UTC — zwischen 00:00 und 02:00 Schweizer Zeit der Vortag). Auftrag David:
  // standardmässig heute, auch auf der Startseite. Die App hydratisiert nicht
  // (main.tsx createRoot render-then-replace) → kein date-input-Hydration-Mismatch.
  const heute = new Date().toLocaleDateString('sv-SE');
  // `zeile` erbt alles, was `minimal` an KNAPPHEIT bedeutet (Ferien als
  // Dropdown statt Radiokarten, Ergebnis ohne Rechenweg-Zeilen) — es ordnet nur
  // zusätzlich anders an. Eine eigene Knappheits-Regel wäre eine zweite
  // Wahrheit über denselben Sachverhalt (§5).
  const zeile = variante === 'zeile';
  const knapp = minimal || zeile;
  // Split-View: Grids richten sich nach der Pane-Breite (Container-Query) statt
  // nach dem Viewport. Ausserhalb eines Panes liefert pk den Viewport-String.
  const pk = usePaneKlasse();
  const [start, setStart] = useState(heute);
  const [laenge, setLaenge] = useState(10);
  const [einheit, setEinheit] = useState<Einheit>('tage');
  // Auftrag David: Ferien/Stillstand standardmässig ZPO (Gerichtsferien).
  const [ferien, setFerien] = useState<Ferien>('zpo');
  const [kanton, setKanton] = useState<Kanton>(getStandardKanton);

  // Die SchKG-Engine führt keine Wochenfristen (gesetzliche SchKG-Fristen
  // sind tage-/monatsbasiert; types/schkg.ts) — die Option entfällt dort.
  // Bug-Check §9 (Code-Lupe, MITTEL): beim Wechsel auf SchKG wird die
  // Einheit EXPLIZIT auf Tage gestellt (State = Anzeige) statt «N Wochen»
  // still als «N Tage» zu rechnen.
  const waehleFerien = (code: Ferien) => {
    setFerien(code);
    if (code === 'schkg' && einheit === 'wochen') setEinheit('tage');
  };
  const einheiten = ferien === 'schkg' ? EINHEITEN.filter((e) => e.code !== 'wochen') : EINHEITEN;
  const einheitEffektiv = ferien === 'schkg' && einheit === 'wochen' ? 'tage' : einheit;

  const gueltig = istISOTag(start) && Number.isInteger(laenge) && laenge > 0;

  let ende = '';
  let endeZusatz = '';
  let zeilen: string[] = [];
  let fehler = '';
  if (gueltig) {
    try {
      if (ferien === 'keine') {
        const r = berechneAllgemeineFrist({
          start, laenge, einheit: einheitEffektiv,
          wochenendeVerschieben: true, feiertageVerschieben: true, kanton,
        });
        ende = `${r.endWochentag}, ${r.endDatum}`;
        endeZusatz = r.verschoben ? `verschoben: ${r.verschiebeGruende.join(' · ')}` : '';
        zeilen = r.hinweise;
      } else if (ferien === 'zpo') {
        const r = berechneFrist({
          ereignis: start, einheit: einheitEffektiv, laenge,
          verfahren: 'ordentlich', kanton, fristnatur: 'gesetzlich',
        });
        ende = r.diesAdQuem;
        endeZusatz = r.stillstandAktiv ? 'Stillstand (Art. 145 ZPO) berücksichtigt' : '';
        zeilen = [...r.annahmen, ...r.warnungen];
      } else if (ferien === 'vwvg' || ferien === 'bgg') {
        const r = berechneBggVwvgFrist({ regime: ferien, ereignis: start, einheit: einheitEffektiv, laenge, kanton });
        ende = r.diesAdQuem;
        endeZusatz = r.stillstandAktiv
          ? `Stillstand (${ferien === 'vwvg' ? 'Art. 22a VwVG' : 'Art. 46 BGG'}) berücksichtigt`
          : 'Stillstand gilt nur für nach Tagen bestimmte Fristen – hier nicht angewendet';
        zeilen = [...r.annahmen, ...r.warnungen, bvAusnahmenSatz(ferien)];
      } else {
        const r = berechneSchkgFrist({
          ereignis: start, einheit: einheitEffektiv as 'tage' | 'monate' | 'jahre', laenge,
          modus: 'schkg_betreibungsferien', fristnatur: 'frist', kanton,
        });
        ende = r.diesAdQuem;
        zeilen = [...r.annahmen, ...r.warnungen];
      }
    } catch {
      fehler = 'Mit diesen Eingaben lässt sich keine Frist berechnen – bitte Datum und Dauer prüfen.';
    }
  }

  // #7: Kalender-Markierung nach oben melden (Schnellrechner). Für ALLE Regimes,
  // damit der Kalender immer das Fristende zeigt (Auftrag David). Deterministisch.
  //
  // W2·10-UI-NAV-Z1: derselbe Wert trägt jetzt auch den ICS-Export (unten), darum
  // EINMAL memoisiert statt zweimal gerechnet. Identische Eingaben, identische
  // Auslöse-Bedingungen wie zuvor — verhaltensneutral (§6), und `baueMarkierung`
  // ist rein (§2). Der Export liest hier nur ab, er rechnet nichts (§3).
  const markierung = useMemo(
    () => (gueltig ? baueMarkierung(start, laenge, einheitEffektiv, ferien, kanton) : null),
    [gueltig, start, laenge, einheitEffektiv, ferien, kanton],
  );
  useEffect(() => {
    if (!onErgebnis) return;
    onErgebnis(markierung ? { markierung, kanton } : null);
  }, [onErgebnis, markierung, kanton]);

  // Live-Brücke: gemeldet wird erst, sobald sich mindestens EIN Wert gegenüber
  // dem Mount-Stand geändert hat (wertbasiert statt «ersten Lauf überspringen» —
  // StrictMode doppelt Mount-Effekte, ein Lauf-Zähler wäre dort undicht), und
  // nur bei gültigen Eingaben (kein NaN/Leerdatum in die Voll-Formulare drücken).
  // `beruehrt` trägt kumulativ die je angefassten Felder (GP-Befund B2) — ein
  // einmal angefasstes Feld bleibt Nutzer-Absicht, auch wenn es später wieder
  // auf dem Mount-Wert steht.
  const mountEingaben = useRef<EinfacheFristEingaben | null>(null);
  const beruehrt = useRef<Set<'start' | 'laenge' | 'einheit' | 'kanton'>>(new Set());
  const brueckeAktiv = useRef(false);
  useEffect(() => {
    if (!onEingaben || !gueltig) return;
    const e: EinfacheFristEingaben = { start, laenge, einheit: einheitEffektiv, ferien, kanton };
    mountEingaben.current ??= e;
    const i = mountEingaben.current;
    (['start', 'laenge', 'einheit', 'kanton'] as const).forEach((k) => {
      if (e[k] !== i[k]) beruehrt.current.add(k);
    });
    if (!brueckeAktiv.current) {
      if (beruehrt.current.size === 0 && e.ferien === i.ferien) return;
      brueckeAktiv.current = true; // ab der ersten echten Änderung meldet jede weitere
    }
    onEingaben({
      ferien: e.ferien,
      werte: { start: e.start, laenge: e.laenge, einheit: e.einheit, kanton: e.kanton },
      beruehrt: [...beruehrt.current],
    });
  }, [onEingaben, gueltig, start, laenge, einheitEffektiv, ferien, kanton]);

  const verfeinernZiel = ferien === 'zpo'
    ? zpoFristenLink({ ereignis: start, einheit: einheitEffektiv, laenge, verfahren: 'ordentlich', kanton, fristnatur: 'gesetzlich' })
    : ferien === 'schkg'
      ? '/rechner/schkg-fristen' + permalinkKodieren(SCHKG_LINK_SPEC, {
        ereignis: start, einheit: einheitEffektiv, laenge,
        modus: 'schkg_betreibungsferien', fristnatur: 'frist', kanton,
      })
      : null;

  // Eingabe-Atome pixelgleich zu den Voll-Rechnern (Redesign E5): das
  // Haus-Primitiv lc-input statt eines eigenen h-10/ring-Rezepts.
  const inputCls = 'lc-input';

  return (
    <div className="space-y-4">
      {/* items-end: bei verschieden hohen Labels (z.B. zweizeilig) bleiben die
          Eingabefelder auf gleicher Höhe (Auftrag David). */}
      {/* `zeile`: fünf Eingaben in EINER Reihe (ab lg), darunter gestuft 2/3
          Spalten — und ohne die `max-w-2xl`-Kappung, damit die Reihe die
          Kartenbreite nutzt.
          SPALTENBREITEN NAMENTLICH, nicht gleichverteilt (LM-074-Nachzug,
          gemessen 5.9.2026 @1440 auf «/»): fünf gleiche Spalten gaben dem
          Datumsfeld 150 px; abzüglich 14 px Innenabstand und der 44 px, die der
          Kalenderknopf (`w-8` + `right-1.5`) reserviert, blieben 92 px für einen
          87 px breiten Wert — «05.09.2026» wurde zu «05.09…» gekappt, und die
          Ferien-Wahl zeigte «Gerichts…». Das ist genau der Befund, den
          LM-074/B12 am Schnellrechner schon einmal geheilt hat: zu eng war die
          SPALTE, nicht das Feld. 11.5rem geben dem Datum 126 px nutzbaren
          Platz (87 px Wert), die fliessende letzte Spalte trägt die
          Ferien-Wahl, deren Label das Rechtsregime nennt und darum nicht
          ellipsiert werden darf (§1/§8).
          BREAKPOINT xl, NICHT lg — gerechnet, nicht geraten: die fünf Spalten
          brauchen mindestens 184+72+96+80+168 px + 4×12 px Abstand = 648 px.
          Die Karte trägt 2/3 der Werkzeug-Reihe; das sind @1280 rund 659 px
          und @1440 rund 765 px Innenbreite, @1024 aber nur ~509 px. Unter
          1280 bleibt es darum bei drei bzw. zwei Spalten. */}
      <div className={zeile
        ? 'grid grid-cols-2 gap-3 items-end sm:grid-cols-3 xl:grid-cols-[11.5rem_4.5rem_6rem_5rem_minmax(10.5rem,1fr)]'
        : `grid ${minimal ? 'grid-cols-1 @[16.5rem]:grid-cols-2' : `grid-cols-2 ${pk('sm:grid-cols-4', '@3xl/pane:grid-cols-4')}`} gap-3 max-w-2xl items-end`}>
        {/* `minimal` (nur Startseite) misst seine FLÄCHE, nicht das Fenster
            (W2·29-WERKBANK-START-LAYOUT 24.9.2026): seit das Schnellwerkzeug in
            einer Mulde mit Innenabstand steht (`start/StartFlaeche`, ein
            `@container`), blieben @320 nur 240 px — das Datum brauchte 126 px
            Feld und bekam 114 (R8 a/b, `e2e/kein-abschnitt`). Zwei Spalten erst
            ab 16.5 rem = 2 × 126 px + 12 px Abstand, darunter eine. */}
        {/* R2-E/F1-2: dieselbe `Field`-Anatomie wie in allen übrigen Rechner-
            Formularen (ZPO, SchKG, Gewährleistung …) statt der hauseigenen
            `<label><span class="lc-overline">`-Kopie — Label und Control sind
            damit auch programmatisch verknüpft (htmlFor bzw. aria-labelledby
            beim zusammengesetzten DatumsFeld). */}
        <Field label="Datum (Ereignis)">
          {/* R2-E/F1-1: kein natives `type="date"` mehr. Der Browser rendert es
              in SEINER Locale — auf einem us-englischen Profil also MM/DD/YYYY,
              und genau dieses Feld trägt das fristauslösende Ereignis. Das
              Haus-DatumsFeld schreibt TT.MM.JJJJ fest; der Wert bleibt ISO
              (yyyy-MM-dd), die Engines sehen also unverändert dasselbe. */}
          <DatumsFeld value={start} onChange={setStart} className={inputCls + ' w-full'} />
        </Field>
        <Field label="Frist">
          <input type="number" min={1} step={1} value={Number.isNaN(laenge) ? '' : laenge}
            onChange={(e) => setLaenge(parseInt(e.target.value, 10))}
            className={inputCls + ' w-full'} />
        </Field>
        <Field label="Einheit">
          <select value={einheitEffektiv} onChange={(e) => setEinheit(e.target.value as Einheit)}
            className={inputCls + ' w-full'}>
            {einheiten.map((e) => <option key={e.code} value={e.code}>{e.label}</option>)}
          </select>
        </Field>
        <Field label="Kanton (Feiertage)">
          <select value={kanton} onChange={(e) => setKanton(e.target.value as Kanton)}
            className={inputCls + ' w-full'}>
            {KANTONE.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
        {/* In der Zeile-Variante ist die Ferien-/Stillstand-Wahl die FÜNFTE
            Zelle derselben Reihe. Sie bleibt sichtbar und wählbar: sie
            entscheidet über das Rechtsregime und darf nie stillschweigend
            gesetzt werden (§1). */}
        {zeile && (
          /* Volle Reihe auf zwei Spalten (bis sm): GEMESSEN @390 px war das
             Select 148 px breit, das gewählte Label «Gerichtsferien (ZPO)»
             braucht 146 px + Pfeil — es wäre zu «Gerichtsferien (…» gekappt
             worden. Welches Regime rechnet, darf nie hinter einer Ellipse
             stehen (§1/§8). */
          <div className="col-span-2 sm:col-span-1">
            <Field label="Ferien / Stillstand">
              <select value={ferien} onChange={(e) => waehleFerien(e.target.value as Ferien)} className={inputCls + ' w-full'}>
                {FERIEN_OPTIONEN.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
              </select>
            </Field>
          </div>
        )}
      </div>

      {zeile ? null : minimal ? (
        // Startseite-Schnellrechner: kompakte Verfahrens-/Ferien-Wahl als
        // Dropdown, ohne die Erläuterungstexte (Auftrag David: möglichst wenig).
        <div className="max-w-xs">
          <Field label="Ferien / Stillstand">
            <select value={ferien} onChange={(e) => waehleFerien(e.target.value as Ferien)} className={inputCls + ' w-full'}>
              {FERIEN_OPTIONEN.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
          </Field>
        </div>
      ) : (
        <fieldset className="space-y-1.5">
          <legend className="lc-overline">Ferien / Stillstand</legend>
          {/* ── GB-20 (W2·24, Befund G20, 7.9.2026) · RADIO-ZEILEN STATT SECHS KAESTEN
              GEMESSEN im ersten Bild des Fristenrechners, hell und dunkel, 1440
              und 390: die Ferien-/Stillstand-Wahl war ein Raster aus SECHS
              gerahmten Kaesten (`label.lc-card`, je 3-5 Zeilen Kleintext), der
              gewaehlte zusaetzlich mit einem 2-px-Ring. F0.6 «Linien statt
              Flaechen» und David 6.9.2026 («Linien statt Flaechen»).
              NEU: eine Spalte, sechs Zeilen, 1-px-Trennlinie oben
              (`lc-wahl-zeile`, index.css §GB-20); der gewaehlte Zustand traegt
              den 3-px-Strich in `--reg-w` statt eines Rings — dieselbe Sprache,
              die `.lc-wahl-kachel[aria-pressed]` seit R5 spricht (§5).
              DIE SPALTENZAHL FAELLT WEG, nicht die Angabe: Titel, Untertext,
              Radio, Reihenfolge, `name`, `checked`, `onChange` sind Wort fuer
              Wort dieselben — die RECHENLOGIK ist unberuehrt (§3), gewaehlt
              wird weiterhin genau ein Regime, und keine Option ist versteckt
              (§1: welches Regime rechnet, darf nie hinter einer Ellipse oder
              einem Mehr-Knopf stehen). Der `pk()`-Pane-Zweig entfaellt, weil er
              nur die Spaltenzahl unterschied. */}
          <div className="grid grid-cols-1 max-w-2xl">
            {FERIEN_OPTIONEN.map((o) => (
              <label key={o.code}
                className={`lc-wahl-zeile px-3 py-2 cursor-pointer space-y-0.5 ${ferien === o.code ? 'lc-wahl-zeile-gewaehlt' : ''}`}>
                {/* LM-077/LM-082 (B19): items-start statt items-center — bei
                    zweizeiligen Titeln (z. B. «Betreibungsferien (SchKG)»)
                    zentrierte der Radiobutton sonst zwischen den Zeilen statt
                    auf Höhe der ersten Zeile zu stehen; das versetzte die
                    gesamte Karte gegenüber einzeiligen Nachbarn um ~11 px. */}
                <span className="flex items-start gap-2">
                  <input type="radio" name="einfache-frist-ferien" value={o.code}
                    checked={ferien === o.code} onChange={() => waehleFerien(o.code)}
                    className="mt-0.5" />
                  <span className="text-body-s font-medium text-ink-900">{o.label}</span>
                </span>
                <span className="block text-xs text-ink-500 leading-snug">{o.sub}</span>
              </label>
            ))}
          </div>
          <p className="text-micro text-ink-500 max-w-reading">
            Strafprozessuale Fristen kennen KEINE Gerichtsferien (Art. 89 Abs. 2 StPO) –
            «Keine Ferien» wählen. Der Verwaltungs-Stillstand (Art. 22a VwVG) und der
            BGG-Stillstand (Art. 46 BGG) gelten nur für nach Tagen bestimmte Fristen; in
            den Ausnahmeverfahren nach Abs. 2 (vorsorgliche Massnahmen u. a.) «Keine Ferien»
            wählen.
          </p>
        </fieldset>
      )}

      {!gueltig ? (
        /* R2-E/F1-3: der Leerzustand des Ergebnisplatzes ist der geteilte
           `ErgebnisPlatzhalter` (R13) statt eines losen Satzes — er reserviert
           die Fläche (CLS) und sagt an, WAS erscheint. Der Satz selbst ist
           wörtlich unverändert. */
        <ErgebnisPlatzhalter was="Datum und ganzzahlige Dauer eingeben – das Fristende erscheint sofort." />
      ) : fehler !== '' ? (
        /* R2-E/F1-4: Eingabefehler in der geteilten `FehlerBox` (R8) — sie
           trägt role="alert", der lose Absatz tat es nicht. Wortlaut unverändert. */
        <FehlerBox fehler={[fehler]} />
      ) : (
        /* R12-Schnellrechner: derselbe Ergebnis-Rahmen, aber ohne Sprungmarke
           (steht im ersten Viewport; im Tagerechner lebt darunter ein zweiter
           Ergebnisblock mit eigener Sprungmarke). */
        <ErgebnisBlock id="lc-ergebnis-einfach" sprung={false}>
          <div className="lc-notice space-y-1.5">
            <p className="lc-overline">Fristende</p>
            <p className="text-h3 font-semibold text-ink-900 num">{ende}</p>
            {endeZusatz !== '' && <p className="text-body-s text-ink-600">{endeZusatz}</p>}
            {/* Knapp (Startseite/Zeile) nur das Fristende — Rechenweg-Zeilen
                und Verfeinern-Links bleiben dem Voll-Rechner überlassen. */}
            {!knapp && zeilen.length > 0 && (
              <ul className="text-body-s text-ink-500 leading-relaxed list-disc pl-5 space-y-0.5">
                {zeilen.map((z) => <li key={z}>{z}</li>)}
              </ul>
            )}
            {!knapp && verfeinernZiel && (
              <p className="text-body-s">
                <Link to={verfeinernZiel} className="font-medium text-brass-700 hover:text-brass-600 no-underline">
                  Im {ferien === 'zpo' ? 'ZPO' : 'SchKG'}-Rechner verfeinern (Verfahren, Zustellart, Hemmung …) →
                </Link>
              </p>
            )}
            {/* W2·10-UI-NAV-Z1 (ICS-Rest): der Schnell-/Tagerechner war der einzige
                Fristen-Ausgang OHNE Kalender-Ausleitung — alle Voll-Rechner tragen
                den geteilten IcsExportButton seit FAHRPLAN-PRAXIS 1.1, und genau
                dieser Rechner ist der meistbenutzte Einstieg (Startseite + /rechner).
                Reine Ausleitung (§3): das ISO-Enddatum kommt unverändert aus
                `markierung` (= dem Engine-Ergebnis, das schon den Kalender speist),
                der Beschrieb übernimmt WÖRTLICH die angezeigten Formulierungen samt
                Vorbehalten und Annahmen (§8) — er formuliert nichts neu. Die
                zentrale «keine Rechtsberatung»-Fusszeile setzt lib/icsExport.ts. */}
            {markierung?.endeISO && (
              <p className="pt-1">
                <IcsExportButton
                  endISO={markierung.endeISO}
                  /* Diskriminierender Titel — sonst kollidieren zwei fachlich
                     verschiedene Fristen mit gleichem Endtag in EINER UID und
                     der Kalender überschreibt stumm (§9-Bug-Check M-1, s. o.). */
                  titel={icsTitelSchnellrechner(start, laenge, einheitEffektiv, ferien)}
                  className="lc-btn-outline lc-btn-sm"
                  beschreibung={[
                    `Fristende: ${ende}`,
                    `Fristenlauf: ${FERIEN_OPTIONEN.find((o) => o.code === ferien)?.label ?? ''}`,
                    endeZusatz,
                    ...zeilen,
                  ].filter((z) => z.trim() !== '').join('\n')}
                />
              </p>
            )}
          </div>
        </ErgebnisBlock>
      )}
    </div>
  );
}
