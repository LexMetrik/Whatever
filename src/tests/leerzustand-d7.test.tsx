/**
 * W2·19-DESIGN-KONSISTENZ · B1/BAU-3 — Befund D-7: EIN Leerzustand statt dreier.
 *
 * Bewacht werden die drei Dinge, die still zurückfallen können:
 *   (1) FORM — der Baustein rendert den Kanon (nackter Absatz `text-body-s
 *       text-ink-500`, 12:2 gegen die `lc-notice`-Box), und der Weiterweg ist ein
 *       echtes Bedienelement, kein Prosa-Hinweis.
 *   (2) WEITERWEG-PFLICHT — wo ein Filter/eine Suche leerläuft, steht ein Ausweg
 *       (C1 «nie eine Sackgasse»). Der Typ erzwingt es beim Aufruf; dieser Test
 *       hält die Aufrufstellen zusätzlich fest, damit ein späteres Umflaggen auf
 *       `art="bestand"` (das den Weiterweg optional macht) nicht unbemerkt durch
 *       den Review geht.
 *   (3) AUSSAGESATZ, NIE FRAGE (§8) — die Sonde liest die echten Aufrufstellen
 *       im Quelltext. Das ist der Punkt, an dem «Filter zurücksetzen?» entstanden
 *       ist; ein Unit-Test am Baustein allein hätte ihn nie gesehen.
 *
 * §6.7 (Tor muss scheitern können) — beide Sonden einmal rot gesehen:
 *   · (3) mit dem Ist-Stand VOR dem Bau: «Kein Material gefunden. Filter
 *     zurücksetzen?» in Materialien.tsx.
 *   · (2)/(4) mit versuchsweise entferntem `weiterweg`-Prop bzw. wieder
 *     eingesetzter `lc-notice`-Box in Rechtsprechung.tsx.
 *
 * Reine Darstellung (§3).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { Leerzustand } from '../components/ui/Leerzustand';
import { alleTsx, APP_WURZEL, liesOhneKommentare, pruefeAusnahmen, rel } from './appDateien';
import { join } from 'node:path';

const TAGERECHNER = join(APP_WURZEL, 'pages/RechnerTagerechner.tsx');

/** Quelltext ohne Kommentare — die Sonden prüfen den ausführbaren Teil. Die
 *  Begründungen am Fundort benennen den Vorzustand ausdrücklich («hier stand
 *  ‹Filter zurücksetzen?›»); läse die Sonde den Rohtext, zwänge sie dazu, genau
 *  diese Belege zu löschen (§2b: Belege altern nicht, sie werden nicht
 *  nachgeführt). Beim ersten Lauf ist sie an genau dieser Stelle rot geworden. */
const lies = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n').filter((z) => !/^\s*(\/\/|\*)/.test(z)).join('\n');

// ─── R3-α-WURZEL (31.8.2026, §17/§6.7) ──────────────────────────────────────
//
// Hier stand eine Liste von DREI Dateien («KONSUMENTEN»). Sie hat getan, was
// eine Datei-Liste immer tut: bestätigt, was schon migriert war. Gemessen am
// 31.8.2026 standen SECHS unmigrierte Leerzustands-Kopien ausserhalb der Liste
// (GesetzeGliederung ×4, InternationalRubriken, AzRegister) — der Wächter war
// grün. Beide Sonden fegen darum jetzt die ganze App:
//   (A) AUFRUFSTELLEN — jede Datei, die `<Leerzustand …/>` aufruft (finden
//       statt aufzählen).
//   (B) ROHFORM — nirgends in der App steht die Kanon-Form des Leerzustands
//       («Kein …» im nackten `text-body-s text-ink-500`-Absatz) noch von Hand.
//
// GELTUNGSBEREICH von (B), ausdrücklich: die Sonde greift die Kanon-STIMME
// (`text-body-s`). Dichte Rails/Sheets tragen ihre Kurzhinweise in `text-micro`
// (ErwaegungsRail, GliederungSheet) — das ist eine andere Textklasse, nicht ein
// umgangener Kanon; sie hier mitzunehmen hiesse, eine Regel zu behaupten, die
// das Reglement nicht trägt (§8: keine erfundene Strenge).

/** Alle Dateien, die den Baustein aufrufen — App-weit gefunden, nicht gelistet. */
function konsumenten(): string[] {
  return alleTsx().filter((d) => /<Leerzustand\b/.test(liesOhneKommentare(d)));
}

/** Alle `<Leerzustand …/>`-Aufrufe einer Datei als Rohtext. */
function aufrufe(quelle: string): string[] {
  return quelle.match(/<Leerzustand\b[\s\S]*?\/>/g) ?? [];
}

/**
 * Die EINE Ausnahme, mit ihrer Begründung AM FUNDORT (nicht bloss hier).
 *
 * Die Fehlseite ist selbst schon die Antwort auf «hier ist nichts»; ihr
 * Weiterweg steht als Sprungliste darunter. Ein zweiter Baustein mit
 * zweitem Ausweg in derselben Ansicht wäre die Doppelung, nicht die
 * Vereinheitlichung. Form und Wortlaut sind identisch zum Kanon.
 */
const AUSNAHMEN = [{
  datei: 'pages/gesetz-leser/FehlSeite.tsx',
  begruendung: 'dieser Satz steht INNERHALB einer',
}] as const;


describe('D-7 (1) — Form: der Baustein rendert den Kanon', () => {
  it('Bestands-Leere: nackter Absatz, kein Kasten, kein Knopf', () => {
    const out = renderToStaticMarkup(<Leerzustand art="bestand" text="Kein Erlass gefunden." />);
    expect(out).toContain('text-body-s text-ink-500');
    expect(out).toContain('Kein Erlass gefunden.');
    expect(out).not.toContain('lc-notice');
    expect(out).not.toContain('<button');
  });

  it('Filter-Leere: derselbe Absatz PLUS ein echter Knopf mit der Aktions-Grammatik', () => {
    const out = renderToStaticMarkup(
      <Leerzustand art="filter" text="Kein Entscheid gefunden."
        weiterweg={{ text: 'Filter zurücksetzen', onKlick: () => {} }} />,
    );
    expect(out).toContain('text-body-s text-ink-500');
    expect(out).toContain('<button type="button"');
    expect(out).toContain('text-brass-700');
    expect(out).toContain('Filter zurücksetzen');
    // Der Ausweg ist ein Bedienelement, kein Satzteil: die Beschriftung trägt
    // kein Fragezeichen und keinen Schlusspunkt.
    expect(out).not.toContain('zurücksetzen?');
  });

  it('die beiden Nutzungen sind im Markup unterscheidbar (Sonde/Deep-Link-Debug)', () => {
    expect(renderToStaticMarkup(<Leerzustand art="bestand" text="Nichts." />))
      .toContain('data-leerzustand="bestand"');
    expect(renderToStaticMarkup(
      <Leerzustand art="filter" text="Nichts." weiterweg={{ text: 'x', onKlick: () => {} }} />,
    )).toContain('data-leerzustand="filter"');
  });
});

describe('D-7 (2) — Aufrufstellen: Aussagesatz und Weiterweg-Pflicht (App-weit)', () => {
  it('die Sonde findet überhaupt Aufrufstellen (Negativ-Kontrolle des Sweeps)', () => {
    // Ohne diese Zusicherung wäre jede Sonde darunter grün, sobald der Baustein
    // aus der App verschwindet — das genaue Gegenteil dessen, was sie bewacht.
    expect(konsumenten().map(rel).sort()).not.toEqual([]);
  });

  it('jede Aufrufstelle nennt einen Aussagesatz — nie eine Frage (§8)', () => {
    const gefunden: string[] = [];
    for (const datei of konsumenten()) {
      for (const a of aufrufe(liesOhneKommentare(datei))) {
        const m = a.match(/text=(?:"([^"]*)"|\{`([^`]*)`\})/);
        expect(m, `text-Prop fehlt in ${datei}: ${a}`).not.toBeNull();
        const text = (m![1] ?? m![2]).trim();
        gefunden.push(text);
        expect(text, `${datei}: «${text}»`).not.toMatch(/\?\s*$/);
        expect(text, `${datei}: «${text}»`).toMatch(/\.\s*$/);
      }
    }
    // Negativ-Kontrolle: die Schleife hat überhaupt Aufrufe gesehen. Ohne das
    // wäre der Test grün, sobald jemand den Baustein wieder ausbaut (§6.7).
    expect(gefunden.length).toBeGreaterThanOrEqual(5);
  });

  it('jede Filter-Leere trägt einen Weiterweg, jede Bestands-Leere keinen erfundenen', () => {
    let filterFaelle = 0;
    for (const datei of konsumenten()) {
      for (const a of aufrufe(liesOhneKommentare(datei))) {
        if (a.includes('art="filter"')) {
          filterFaelle += 1;
          expect(a, `${datei}: Filter-Leerzustand ohne Weiterweg`).toContain('weiterweg=');
        } else {
          expect(a).toContain('art="bestand"');
        }
      }
    }
    expect(filterFaelle).toBeGreaterThanOrEqual(3);
  });

  // ─── R4-E (5.9.2026) · die ART folgt der LAGE, nicht dem Wortlaut ─────────
  //
  // GEMESSEN am Preview: derselbe Sachverhalt — «die Suche hat nichts
  // gefunden» — trug zwei Darstellungen:
  //   /rechner/tagerechner, Suchtext «zzzzz»  → data-leerzustand="bestand", KEIN Weiterweg
  //   /rechtsprechung?q=zzzzzz                → data-leerzustand="filter",  Weiterweg «Filter zurücksetzen»
  // Massgeblich ist die LAGE: läuft der Zweig nur bei nicht-leerer Suche, ist
  // etwas VERDECKT (`filter`, Weiterweg Pflicht); läuft er über den vollen
  // Bestand, ist nichts DA (`bestand`, kein erfundener Weiterweg — Herleitung
  // an den beiden `Gesetze.tsx`-Fundstellen). Der WORTLAUT entscheidet nicht:
  // «gefunden» steht in beiden Lagen, und die Zweiteilung gefunden/erfasst ist
  // seit Runde 1 ausdrücklich kein Befund.
  it('R4-E: die suchgefilterte Preset-Leere des Tagerechners ist eine Filter-Leere', () => {
    const q = liesOhneKommentare(TAGERECHNER);
    // Der Zweig hängt an einer nicht-leeren Suche — also ist etwas verdeckt.
    expect(q, 'der Leerzustand steht hinter `presetQuery.trim() !== \'\'`')
      .toContain("presetQuery.trim() !== ''");
    const a = aufrufe(q);
    expect(a, 'genau ein Leerzustand in dieser Datei').toHaveLength(1);
    expect(a[0], 'verdeckt ⇒ art="filter"').toContain('art="filter"');
    expect(a[0], 'Filter-Leere ⇒ Weiterweg Pflicht').toContain('weiterweg=');
    // Der Satz selbst bleibt unangetastet (§8) — er nennt die zwei fachlichen
    // Auswege, die der Knopf NICHT ersetzt.
    expect(a[0]).toContain('Kein Preset gefunden');
    expect(a[0]).toContain('Spezialrechner der Fristen-Kategorie');
  });

  it('die alten Bauformen sind weg, nicht bloss danebengestellt (§5/§10)', () => {
    expect(lies('../pages/Materialien.tsx')).not.toContain('Filter zurücksetzen?');
    expect(lies('../pages/Rechtsprechung.tsx'))
      .not.toContain('Kein Entscheid gefunden. Filter anpassen oder zurücksetzen.');
  });
});

describe('D-7 (3) — App-weit: die Rohform des Leerzustands existiert nirgends mehr', () => {
  /** Der Kanon-Absatz des Leerzustands, von Hand gezeichnet. */
  const ROHFORM = /<p className="(?=[^"]*text-body-s)(?=[^"]*text-ink-500)[^"]*">\s*(?:Kein|Keine|Noch kein)/;

  it('jede Ausnahme trägt ihre Begründung am Fundort', () => {
    expect(() => pruefeAusnahmen(AUSNAHMEN)).not.toThrow();
  });

  it('kein handgezeichneter Leerzustand ausserhalb der begründeten Ausnahme', () => {
    const erlaubt = pruefeAusnahmen(AUSNAHMEN);
    const funde = alleTsx()
      .filter((d) => !erlaubt.has(rel(d)))
      .filter((d) => ROHFORM.test(liesOhneKommentare(d)))
      .map(rel);
    expect(funde, 'handgezeichneter Leerzustand statt <Leerzustand art="bestand" …/>').toEqual([]);
  });

  it('NEGATIV-KONTROLLE: der Ausdruck findet die sechs Vorher-Formen', () => {
    // Wortlaut aus GesetzeGliederung.tsx / InternationalRubriken.tsx /
    // AzRegister.tsx, Stand vor R3-α (31.8.2026).
    for (const vorher of [
      '<p className="text-body-s text-ink-500">Kein Erlass gefunden.</p>',
      '<p className="text-body-s text-ink-500">Kein Eintrag gefunden.</p>',
      '<p className="px-2 py-1 text-body-s text-ink-500">Kein Titel im Register gefunden.</p>',
    ]) {
      expect(ROHFORM.test(vorher), vorher).toBe(true);
    }
  });
});

// ─── W2·19 DK-B (30.9.2026, HN-D5 / DK-05) · STELLEN OHNE IMPORT ─────────────
//
// DER BEFUND (Herz-und-Nieren-Prüfung 24.9.2026, Sonde G am lebenden System):
// `werkzeuge-blatt` und `gesetze-blatt` lieferten KEIN `[data-leerzustand]`,
// obwohl die Aufrufstellen-Sonde oben grün war — sie findet per Konstruktion nur
// Dateien, die `<Leerzustand …/>` schon AUFRUFEN, und die Start-Blätter haben den
// Baustein nie importiert. (A) fand sie nicht (kein Aufruf), (B) fand sie nicht
// (Rohform verlangt `text-ink-500`, die Blätter trugen `text-ink-600/-700`).
//
// Diese Sonde greift am SATZ, nicht am Import und nicht an der Klasse: die
// Hausform «Kein X gefunden.» / «Kein X passt auf «q».» steht in der App nur noch
// INNERHALB eines `<Leerzustand …/>`-Aufrufs (oder in der begründeten Ausnahme).
describe('DK-B (4) — die Hausform des Leersatzes steht nur im Baustein (auch ohne Import)', () => {
  /** «Kein(e) … gefunden.» bzw. «Kein(e) … passt auf «…».» — der Satz endet
   *  unmittelbar (Schlusspunkt); «Keine amtliche Adresse gefunden — …» (Sucherfolg
   *  MIT fachlichem Weiterweg im Satz) ist bewusst NICHT die Hausform. */
  const LEERSATZ = /\bKeine?\s[^<>"`{}—–]{1,40}?\s(?:gefunden|passt auf|passen auf)\b(?:\s«[^»]*»)?\./g;

  /** Quelltext ohne die `<Leerzustand …/>`-Aufrufe — was übrig bleibt, hat den
   *  Baustein umgangen. */
  const ohneBaustein = (q: string) => q.replace(/<Leerzustand\b[\s\S]*?\/>/g, '');

  function umgeher(): string[] {
    const erlaubt = pruefeAusnahmen(AUSNAHMEN);
    const funde: string[] = [];
    for (const d of alleTsx()) {
      if (erlaubt.has(rel(d))) continue;
      for (const m of ohneBaustein(liesOhneKommentare(d)).matchAll(LEERSATZ)) funde.push(`${rel(d)}: ${m[0]}`);
    }
    return funde;
  }

  it('kein Leersatz ausserhalb des Bausteins (Datei egal, Import egal, Klasse egal)', () => {
    const funde = umgeher();
    expect(
      funde,
      `${funde.length} handgezeichnete Leersätze ausserhalb von <Leerzustand>: Filter-Leere = `
      + '`art="filter"` mit Weiterweg, Bestands-Leere = `art="bestand"` (C1: nie eine Sackgasse).',
    ).toEqual([]);
  });

  it('NEGATIV-KONTROLLE: der Ausdruck findet die sechs Vorher-Formen der Start-Blätter', () => {
    const vorher = [
      '<p className="font-sans text-body-s text-ink-600">Kein Rechner passt auf «{q}».</p>',
      '<p className="font-sans text-body-s text-ink-600">Keine Vorlage passt auf «{q}».</p>',
      '<p className="font-sans text-body-s text-ink-600">Kein Erlass passt auf «{suche}».</p>',
      '<p className="font-sans text-body-s text-ink-600" role="status">Kein Erlass passt auf «{suche.trim()}».</p>',
      '<p className="font-sans text-body-s text-ink-700" role="status">Kein Entscheid gefunden.</p>',
      '<p className="font-sans text-body-s text-ink-700" role="status">Kein Material gefunden.</p>',
    ];
    for (const z of vorher) expect(ohneBaustein(z).match(LEERSATZ), z).not.toBeNull();
  });

  it('GEGEN-KONTROLLE: Baustein-Aufruf, Sucherfolg mit Weg im Satz und Prosa fallen NICHT auf', () => {
    for (const ok of [
      '<Leerzustand art="filter" text="Kein Rechner gefunden." weiterweg={{ text: \'Suche leeren\', onKlick: () => {} }} />',
      '<p>Keine amtliche Adresse gefunden — Schreibweise prüfen oder PLZ/Gemeinde von Hand eingeben.</p>',
      'Keine Rechtsberatung. «ungeprüft» = maschinell erfasst.',
    ]) expect(ohneBaustein(ok).match(LEERSATZ), ok).toBeNull();
  });
});
