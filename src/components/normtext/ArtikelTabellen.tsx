import type React from 'react';
import { gruppiereTausender } from '../../lib/normtext/darstellung';
import { useTabellenDruck, vorabDruck } from './tabellenDruck';
import { KENNZAHL_TITEL, gruppiereZelle, istJahrSpalte, istProsaZelle, teileNachZifferngruppen } from './tarifText';

// Tarif- und Tabellen-KOMPONENTEN des Normtext-Artikels. Aus ArtikelBody.tsx
// ausgelagert (verhaltensneutral, §6/§6.6-Churn-Regrowth: die Vereinigung von
// S2-Typografie und H3-Panel-Zone hob ArtikelBody.tsx über die Baseline-Toleranz).
// Der Wortlaut der Blöcke ist UNVERÄNDERT übernommen — reine Darstellung (§3),
// kein Normtext wird erzeugt. Nachbarschaftsmuster wie BildElemente.tsx.
// Die reinen Text-Funktionen (staffelZeilen, normalisiereTarifText) liegen in
// tarifText.ts: eine Datei darf nicht Komponenten UND Funktionen exportieren
// (eslint react-refresh/only-export-components).

// TABELLEN-REGEL (Auftrag David 20.6.2026): erkannte Tarif-/Gebühren-Staffeln
// (staffelZeilen) werden als gestylte Tabelle dargestellt — umrandeter Block,
// abgesetzte Kopfzeile, Zeilen-Trenner je Band, tabular-nums. REIN DARSTELLUNG
// (§3): der Wortlaut je Zeile bleibt unverändert; verschmolzene PDF-Ziffern
// werden NICHT neu getrennt (§1). Wird sowohl für Absatz-Blöcke als auch für
// Tarif-Items (lit./Ziff.) verwendet — viele Notariats-/Grundbuchtarife stehen
// als Items.
// Reiner Text je Zeile (wie die ursprüngliche Staffel-Darstellung) — kein
// Autolink/NormText in den Tabellen-Zeilen: Tarif-Bänder enthalten ohnehin keine
// zitierten Normen, und so bleibt das Markup einfach (keine verschachtelten
// Fragmente/Key-Themen). Reine Darstellung (§3), Wortlaut unverändert.
export function StaffelTabelle({ zeilen }: { zeilen: string[] }) {
  // R5-B (5.9.2026): in dieser Datei stand viermal die Roh-Utility
  // `[font-variant-numeric:tabular-nums]` — dieselbe Rolle wie `.num`, nur ohne
  // dessen Monospace-Familie UND ohne dessen `lining-nums`. Genau die Hälfte,
  // die R4-C als Defekt nachgewiesen hat (`tabular-nums` allein ersetzt die
  // ganze Deklaration und nimmt die Versalziffern weg). Die Rolle heisst jetzt
  // `.lc-ziffern` und ist app-weit dieselbe (§5).
  return (
    <span className="mt-1.5 block rounded-md border border-line overflow-hidden [text-indent:0] lc-ziffern">
      {zeilen.map((z, j) => (
        <span key={j}
          className={`block px-3 py-1.5 leading-snug ${
            j === 0 ? 'font-medium text-ink-800 bg-paper-sunken/40' : 'border-t border-rule-artikel'
          }`}>
          {z}
        </span>
      ))}
    </span>
  );
}

// Vorab-Markierung für den Druck (tabellenDruck.ts, Stufe 1): `data-breit` und die geschätzte
// Schrift stehen schon im Render-/Prerender-Markup, damit die Querformat-Regel auch ohne
// JavaScript und ohne Druck-Ereignis greift.
function vorabAttribute(v: { breit: boolean; zoom: number }) {
  return v.breit
    ? { 'data-breit': '', style: { '--druck-zoom-vorab': String(Math.round(v.zoom * 100) / 100) } as React.CSSProperties }
    : {};
}

// Zifferngruppen mit Leerzeichen («Fr. 1 000», «300 000») brechen nie mitten in der Zahl
// (Gegenprüfung #1279, §1: ZH-215.3 § 4 «300 ⏎ 000»). `nowrap`-Span statt U+202F: der
// Text für Suche und Kopieren bleibt Zeichen für Zeichen derselbe.
function zelleText(text: string): React.ReactNode {
  const teile = teileNachZifferngruppen(text);
  if (teile.length === 1 && !teile[0].nowrap) return text;
  return teile.map((x, i) => (x.nowrap ? <span key={i} className="whitespace-nowrap">{x.t}</span> : x.t));
}

// Hilfsfunktion: Zelle gilt als (rechtsbündiger) Betrag, wenn sie Ziffern
// enthält, aber kein Wort mit ≥4 Buchstaben (à la «über», «bis», «zuzügl.»,
// «übersteigenden») — lange Text-Zellen bleiben linksbündig. AUSNAHME: reine
// Positions-/Tarif-Nummern («1.1.1.1», «1.», «5000») sind KEINE Beträge → bleiben
// linksbündig zur Hierarchie. Rein Darstellung (§3); steuert Ausrichtung.
function istNumerischeZelle(s: string): boolean {
  const t = s.trim();
  if (t === '' || /^\d+(\.\d+)*\.?$/.test(t)) return false;
  return /\d/.test(t) && !/[A-Za-zÀ-ÿ]{4,}/.test(t);
}

// Spaltentyp des kanonischen Modells (M10, T-B1) — spiegelt
// scripts/normtext/tabelle-normalisieren.ts; hier lokal, weil die Render-Schicht
// nicht aus scripts/ importiert (§3-Schichtentrennung).
type TabSpalte = { typ: 'bereich' | 'zahl' | 'text' | 'betrag'; titel: string };

// N-Spalten-Tabelle aus block.mehrspaltig. Dispatcht: kanonisches `spalten`-Modell
// (Bund, M10) → dumme typgesteuerte Projektion; Alt-`{kopf,zeilen}` (Kanton/Legacy)
// → unveränderter Alt-Renderer (abwärtskompatibel, byte-gleiche Darstellung).
export function MehrspaltigeTabelle({ spalten, kopf, zeilen }: { spalten?: TabSpalte[]; kopf?: string[]; zeilen: string[][] }) {
  useTabellenDruck(); // `beforeprint`: breite Tabellen quer/kleiner/mit Hinweis (tabellenDruck.ts)
  if (spalten && spalten.length > 0) return <KanonischeTabelle spalten={spalten} zeilen={zeilen} />;
  return <LegacyMehrspaltigeTabelle kopf={kopf} zeilen={zeilen} />;
}

// Kanonische Tabelle (T-C1–C6/T-D1–D7): N = spalten.length, Ausrichtung +
// Tausender-Gruppierung rein typgesteuert; KEINE Inhalts-Heuristik, KEIN Padding
// (§3 dumme Projektion). Zell-Wortlaut unverändert (nur Tausender-Apostroph = Anzeige).
function KanonischeTabelle({ spalten, zeilen }: { spalten: TabSpalte[]; zeilen: string[][] }) {
  const N = spalten.length;
  // Defensive (T-E5): empfängt der Renderer trotz Gate eine aritätsverletzende
  // Zeile, rendert er linear (verlustfrei, alle Werte in Quellreihenfolge) statt
  // ein verschobenes Gitter — heilt nie, wirft nie.
  if (zeilen.some((z) => z.length !== N)) {
    return (
      <span data-mehrspaltig="" className="mt-1.5 block text-ink-700">
        {zeilen.map((z, ri) => (
          <span key={ri} className="block leading-snug">{z.filter((c) => c.trim() !== '').join(' · ')}</span>
        ))}
      </span>
    );
  }
  const rechts = (typ: TabSpalte['typ']) => typ === 'zahl' || typ === 'betrag';
  const gruppieren = (typ: TabSpalte['typ']) => typ !== 'text'; // bereich/zahl/betrag: Swiss-Apostroph
  // W2·17 E-D4-B03: Jahres-/Kennzahl-Spalten (Referenzdatum, Jahrgang, Code) und
  // Datums-/Nummern-Zellen bekommen keinen Tausender-Apostroph («31.01.2'022»).
  const ohneGruppe = spalten.map((s, ci) => KENNZAHL_TITEL.test(s.titel) || istJahrSpalte(zeilen.map((z) => z[ci])));
  const hatKopf = spalten.some((s) => s.titel !== '');
  // W2·17-UI-BEFUNDE DFG-D02 (2.10.2026): `w-max` hielt JEDE Zelle einzeilig, auch
  // die Textspalte (ZH-211.11 § 4: Tabelle 1'077 px in einem 603-px-Kasten,
  // Spalte 3 abgeschnitten, links und rechts je ~400 px frei). Jetzt bricht nur
  // um, was Prosa ist (Text-Spalte, ab `PROSA_AB` Zeichen) und jede Kopfzelle
  // (nur dort, wo die Breite fehlt: «Restschuld/Franken» belegte sonst allein
  // 199 px); Zahlen, Beträge, Bereiche und kurze Zellen bleiben einzeilig
  // (§N-4a). Der Typ steuert weiter allein die Ausrichtung (dumme Projektion).
  const zelleCls = (typ: TabSpalte['typ'], kopfZeile: boolean, zelle: string) =>
    `table-cell px-3 py-1.5 leading-snug align-baseline${rechts(typ) ? ' text-right lc-ziffern' : ''}${
      (istProsaZelle(zelle) && typ === 'text') || kopfZeile ? ' lc-zelltext' : ' whitespace-nowrap'
    }${kopfZeile || rechts(typ) ? ' font-medium text-ink-800' : ' text-ink-700'}`;
  const vorab = vorabDruck(spalten.map((sp, ci) => [
    { text: sp.titel, umbrechbar: true },
    ...zeilen.map((z) => ({ text: z[ci] ?? '', umbrechbar: istProsaZelle(z[ci] ?? '') && sp.typ === 'text' })),
  ]));
  return (
    <span data-mehrspaltig="" {...vorabAttribute(vorab)} tabIndex={0} role="group" aria-label="Tabelle, seitlich scrollbar" className="lc-scroll-x lc-scrollrand-x mt-1.5 block overflow-x-auto rounded-md border border-line [text-indent:0]">
      {/* ARIA-Tabellen-Semantik auf den display:table-Spans; je Datenzeile genau
          N cell zu N columnheader (folgt aus T-B2). Echtes <table> ist im
          Phrasing-/<p>-Kontext nicht möglich. */}
      <span role="table" aria-label="Tarif-Tabelle" className="table min-w-full">
        {hatKopf && (
          <span role="row" className="table-row bg-paper-sunken/40">
            {spalten.map((s, ci) => (
              <span key={ci} role="columnheader" className={zelleCls(s.typ, true, s.titel)}>{zelleText(s.titel)}</span>
            ))}
          </span>
        )}
        {zeilen.map((z, ri) => (
          <span key={ri} role="row" className="table-row">
            {z.map((cell, ci) => (
              <span
                key={ci}
                role="cell"
                className={`${zelleCls(spalten[ci].typ, false, cell)}${ri > 0 || hatKopf ? ' border-t border-rule-artikel' : ''}`}
              >
                {zelleText(gruppieren(spalten[ci].typ) && !ohneGruppe[ci] ? gruppiereZelle(cell) : cell)}
              </span>
            ))}
          </span>
        ))}
      </span>
    </span>
  );
}

/** Beschriftung der ersten Spalte ab dieser Länge darf umbrechen; kürzere Marken («a.», «1.1.») nicht. */
const LABEL_AB = 4;

// Alt-Renderer für Legacy-`{kopf,zeilen}` (Kanton/nicht migrierte Bund-Fallbacks):
// UNVERÄNDERT übernommen — Inhalts-Heuristik + Padding bleiben, damit Kanton-Tabellen
// byte-gleich rendern (L0-Abwärtskompatibilität). Bund nutzt KanonischeTabelle.
// (Stand bis 25.9.2026; seit B11 gilt die folgende deklarierte Änderung — auch
// für Kanton-Tabellen, deren Markup damit nicht mehr byte-gleich zum L0 ist.)
//
// ── W2·31-BILDSCHIRMBREITE B11 (26.9.2026) · DEKLARIERTE DARSTELLUNGSÄNDERUNG ──
// Befund (gemessen am Build 7b13d9de8, `/gesetze/international/EMRK`, Geltungs-
// bereichs-Tabelle): der Kasten war 3'558 px breit, sichtbar 603 (@1280–1920) bzw.
// 312 (@390) — die Beschriftungsspalte allein 3'118 px. Zwei Ursachen, beide
// Darstellung, keine Daten (§3/§7 — Zellwortlaut und Reihenfolge unverändert):
//  1. NACHSPANN. Die Fussnoten der Tabelle («* Vorbehalte …», «a …» bis «j …»)
//     stehen als EINZELZELLEN-Zeilen am Ende (Quelle: eine Zeile, die die ganze
//     Tabelle überspannt). In Spalte 1 gepresst und ohne Umbruch (`w-max`) gaben
//     sie der ganzen Spalte ihre Länge (bis 350 Zeichen). Sie stehen jetzt unter
//     dem Raster als Absatz über die Kastenbreite — wie in der Quelle, und
//     OHNE `gruppiereTausender`: es ist Prosa («3003 Bern», «9. Mai 2007»), die
//     Zell-Gruppierung setzte dort «3'003»/«2'007» (gesehen @1920). Betroffen
//     (Skript-Zählung public/normtext, 26.9.2026): 82 Legacy-Tabellen in 35
//     Bundes-/Staatsvertrags-Erlassen, keine kantonale.
//  2. BESCHRIFTUNGSSPALTE. `w-max` hielt JEDE Zelle einzeilig. Jetzt darf nur
//     die erste Spalte umbrechen (nie unter 9 rem ≈ 16 Zeichen — sonst zerfällt
//     sie wortweise, gesehen @390: 42 px, Zeile 1'102 px hoch; und nie mitten
//     im Wort ohne Strich: `.lc-wortumbruch` (Silbentrennung, `break-word` als
//     Garant) statt des geerbten `anywhere` — «Aserbaidscha|n*» @390 gesehen;
//     ohne Silbentrennung lief «Vertragsstaaten» @1280 9 px quer); alle übrigen
//     bleiben wie bisher einzeilig (`whitespace-nowrap`, Daten/Zahlen brechen nie,
//     §N-4a). Passt die Tabelle schon heute, ändert sich nichts (`min-w-full`).
//     Reicht die Breite auch so nicht, bleibt der Querscroll samt Affordanz.
//
// ── ERGÄNZUNG W2·17-UI-BEFUNDE DFG-D01 (2.10.2026) ──
// Gemessen am Build 9bb82d7de, GebV SchKG Art. 37 (Legacy, 8 aufgefüllte Spalten):
// Tabelle 1'549 px in 603 px, die Gebühren 945 px rechts ausserhalb — «alle übrigen
// einzeilig» (oben) galt auch für die Prosa-Zellen der Spalten 2–8 («für die
// Vorlegung des Registers oder für eine sich darauf stützende Auskunft» als eine
// Zeile). Jetzt brechen Prosa-Zellen (`istProsaZelle`) in jeder Spalte um; die
// einzeiligen Zahlen/Beträge/Daten bleiben. Nachher 724 px → siehe e2e
// `leser-druck-tabellen-w217`. Die Arität (3 Kopfzellen, Zeilen mit 2–8 Zellen)
// ist ein DATENbefund und liegt bei der Korpus-Werkstatt, nicht hier.
function LegacyMehrspaltigeTabelle({ kopf, zeilen: alleZeilen }: { kopf?: string[]; zeilen: string[][] }) {
  const spalten = Math.max(kopf?.length ?? 0, ...alleZeilen.map((z) => z.length));
  let rumpfEnde = alleZeilen.length;
  while (spalten > 1 && rumpfEnde > 0 && alleZeilen[rumpfEnde - 1].length === 1) rumpfEnde--;
  const zeilen = alleZeilen.slice(0, rumpfEnde);
  const nachspann = alleZeilen.slice(rumpfEnde).map((z) => z[0]);
  const padZeile = (z: string[]) => {
    const padded = [...z];
    while (padded.length < spalten) padded.push('');
    return padded;
  };
  const spalteNumerisch = Array.from({ length: spalten }, (_, ci) =>
    alleZeilen.some((z) => istNumerischeZelle(z[ci] ?? '')),
  );
  // W2·17 E-D4-B04: reine Jahres-Spalten («1996 B», «2003») nie gruppieren; Daten in
  // Prosa-Zellen («8. März 1960») schützt `gruppiereZelle`.
  const jahrSpalte = Array.from({ length: spalten }, (_, ci) => istJahrSpalte(zeilen.map((z) => z[ci] ?? '')));
  // W2·17-UI-BEFUNDE DFG-D01 (2.10.2026), Ergänzung zu B11: «alle übrigen
  // einzeilig» galt auch für Prosa-Zellen ab Spalte 2 — GebV SchKG Art. 37 stand
  // 1'549 px breit in einem 603-px-Kasten, die Gebühren 945 px rechts davon.
  // Umbrechen darf jetzt Spalte 1 (Beschriftung, wie B11, aber nicht mehr die
  // Aufzählungs-Marke «a.»: Art. 37 hielt dafür 144 px frei) UND jede Prosa-Zelle
  // (ab `PROSA_AB` Zeichen, `istProsaZelle`, KEINE Mindestbreite: die Spalte
  // schrumpft nur bis zum längsten Wort, nie mitten hinein); Zahlen, Beträge, Daten,
  // Bereiche und kurze Zellen bleiben einzeilig.
  // Spalten ohne jeden Inhalt (Auffüll-Spalten aus `padZeile`: GebV SchKG Art. 37
  // hat zwei davon) tragen keinen Innenabstand — sie hielten je 24 px frei.
  const leereSpalte = Array.from({ length: spalten }, (_, ci) =>
    ![kopf ?? [], ...zeilen].some((z) => (z[ci] ?? '').trim() !== ''),
  );
  const zelleCls = (ci: number, kopfZeile: boolean, zelle: string) =>
    `table-cell ${leereSpalte[ci] ? 'px-0' : 'px-3'} py-1.5 leading-snug align-baseline${spalteNumerisch[ci] ? ' text-right' : ''}${
      ci === 0 && !spalteNumerisch[ci] && zelle.trim().length > LABEL_AB
        ? ' min-w-[9rem] lc-wortumbruch'
        : istProsaZelle(zelle) || kopfZeile ? ' lc-zelltext' : ' whitespace-nowrap'
    }${kopfZeile ? ' font-medium text-ink-800' : spalteNumerisch[ci] ? ' font-medium text-ink-800' : ' text-ink-700'}`;
  const vorab = vorabDruck(Array.from({ length: spalten }, (_, ci) => {
    if (leereSpalte[ci]) return [];
    const zellen = zeilen.map((z) => {
      const t = z[ci] ?? '';
      // Beschriftungsspalte: mindestens 9 rem (144 px), angesetzt als 18 Zeichen einzeilig.
      if (ci === 0 && !spalteNumerisch[ci] && t.trim().length > LABEL_AB) return { text: 'x'.repeat(18), umbrechbar: false };
      return { text: t, umbrechbar: istProsaZelle(t) };
    });
    return [{ text: kopf?.[ci] ?? '', umbrechbar: true }, ...zellen];
  }));
  return (
    <span data-mehrspaltig="" {...vorabAttribute(vorab)} tabIndex={0} role="group" aria-label="Tabelle, seitlich scrollbar" className="lc-scroll-x lc-scrollrand-x mt-1.5 block overflow-x-auto rounded-md border border-line [text-indent:0] lc-ziffern">
      <span role="table" aria-label="Tarif-Tabelle" className="table min-w-full">
        {kopf && kopf.length > 0 && (
          <span role="row" className="table-row bg-paper-sunken/40">
            {padZeile(kopf).map((h, ci) => (
              <span key={ci} role="columnheader" className={zelleCls(ci, true, h)}>{zelleText(h)}</span>
            ))}
          </span>
        )}
        {zeilen.map((z, ri) => (
          <span key={ri} role="row" className="table-row">
            {padZeile(z).map((cell, ci) => (
              <span
                key={ci}
                role="cell"
                className={`${zelleCls(ci, false, cell)}${ri > 0 || (kopf && kopf.length) ? ' border-t border-rule-artikel' : ''}`}
              >
                {zelleText(jahrSpalte[ci] ? cell : gruppiereZelle(cell))}
              </span>
            ))}
          </span>
        ))}
      </span>
      {/* `sticky left-0`: scrollt das Raster quer, bleibt der Nachspann im Blick. */}
      {nachspann.length > 0 && (
        <span data-tabelle-nachspann="" className="sticky left-0 block border-t border-rule-artikel px-3 py-1.5 text-ink-700">
          {nachspann.map((t, i) => <span key={i} className="block leading-snug">{t}</span>)}
        </span>
      )}
    </span>
  );
}

// 2-Spalten-Tarif (Beschreibung | Betrag) aus strukturiertem block.tabelle.
// Reine Darstellung (§3); Wortlaut je Zelle unverändert.
export function TarifTabelle({ zeilen }: { zeilen: Array<{ beschreibung: string; betrag: string }> }) {
  return (
    <span role="table" aria-label="Tarif-Tabelle" className="mt-1.5 block rounded-md border border-line overflow-hidden [text-indent:0] lc-ziffern">
      {zeilen.map((z, j) => (
        <span key={j} role="row" className={`flex items-baseline justify-between gap-4 px-3 py-1.5 leading-snug ${j > 0 ? 'border-t border-rule-artikel' : ''}`}>
          <span role="cell" className="text-ink-700">{z.beschreibung}</span>
          <span role="cell" className="shrink-0 text-right font-medium text-ink-800">{gruppiereTausender(z.betrag)}</span>
        </span>
      ))}
    </span>
  );
}
