import { gruppiereTausender } from '../../lib/normtext/darstellung';

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
  const hatKopf = spalten.some((s) => s.titel !== '');
  const zelleCls = (typ: TabSpalte['typ'], kopfZeile: boolean) =>
    `table-cell px-3 py-1.5 leading-snug align-baseline${rechts(typ) ? ' text-right whitespace-nowrap lc-ziffern' : ''}${
      kopfZeile || rechts(typ) ? ' font-medium text-ink-800' : ' text-ink-700'
    }`;
  return (
    <span data-mehrspaltig="" tabIndex={0} role="group" aria-label="Tabelle, seitlich scrollbar" className="lc-scroll-x lc-scrollrand-x mt-1.5 block overflow-x-auto rounded-md border border-line [text-indent:0]">
      {/* ARIA-Tabellen-Semantik auf den display:table-Spans; je Datenzeile genau
          N cell zu N columnheader (folgt aus T-B2). Echtes <table> ist im
          Phrasing-/<p>-Kontext nicht möglich. */}
      <span role="table" aria-label="Tarif-Tabelle" className="table min-w-full w-max">
        {hatKopf && (
          <span role="row" className="table-row bg-paper-sunken/40">
            {spalten.map((s, ci) => (
              <span key={ci} role="columnheader" className={zelleCls(s.typ, true)}>{s.titel}</span>
            ))}
          </span>
        )}
        {zeilen.map((z, ri) => (
          <span key={ri} role="row" className="table-row">
            {z.map((cell, ci) => (
              <span
                key={ci}
                role="cell"
                className={`${zelleCls(spalten[ci].typ, false)}${ri > 0 || hatKopf ? ' border-t border-rule-artikel' : ''}`}
              >
                {gruppieren(spalten[ci].typ) ? gruppiereTausender(cell) : cell}
              </span>
            ))}
          </span>
        ))}
      </span>
    </span>
  );
}

// Alt-Renderer für Legacy-`{kopf,zeilen}` (Kanton/nicht migrierte Bund-Fallbacks):
// UNVERÄNDERT übernommen — Inhalts-Heuristik + Padding bleiben, damit Kanton-Tabellen
// byte-gleich rendern (L0-Abwärtskompatibilität). Bund nutzt KanonischeTabelle.
function LegacyMehrspaltigeTabelle({ kopf, zeilen }: { kopf?: string[]; zeilen: string[][] }) {
  const spalten = Math.max(kopf?.length ?? 0, ...zeilen.map((z) => z.length));
  const padZeile = (z: string[]) => {
    const padded = [...z];
    while (padded.length < spalten) padded.push('');
    return padded;
  };
  const spalteNumerisch = Array.from({ length: spalten }, (_, ci) =>
    zeilen.some((z) => istNumerischeZelle(z[ci] ?? '')),
  );
  const zelleCls = (ci: number, kopfZeile: boolean) =>
    `table-cell px-3 py-1.5 leading-snug align-baseline${spalteNumerisch[ci] ? ' text-right whitespace-nowrap' : ''}${
      kopfZeile ? ' font-medium text-ink-800' : spalteNumerisch[ci] ? ' font-medium text-ink-800' : ' text-ink-700'
    }`;
  return (
    <span data-mehrspaltig="" tabIndex={0} role="group" aria-label="Tabelle, seitlich scrollbar" className="lc-scroll-x lc-scrollrand-x mt-1.5 block overflow-x-auto rounded-md border border-line [text-indent:0] lc-ziffern">
      <span role="table" aria-label="Tarif-Tabelle" className="table min-w-full w-max">
        {kopf && kopf.length > 0 && (
          <span role="row" className="table-row bg-paper-sunken/40">
            {padZeile(kopf).map((h, ci) => (
              <span key={ci} role="columnheader" className={zelleCls(ci, true)}>{h}</span>
            ))}
          </span>
        )}
        {zeilen.map((z, ri) => (
          <span key={ri} role="row" className="table-row">
            {padZeile(z).map((cell, ci) => (
              <span
                key={ci}
                role="cell"
                className={`${zelleCls(ci, false)}${ri > 0 || (kopf && kopf.length) ? ' border-t border-rule-artikel' : ''}`}
              >
                {gruppiereTausender(cell)}
              </span>
            ))}
          </span>
        ))}
      </span>
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
