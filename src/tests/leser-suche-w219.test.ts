/**
 * W2·19-GLIEDERUNG · S8 — die zwei Mechanik-Regeln der erlass-lokalen Suche.
 *
 * Bau-Spec fahrplaene/FAHRPLAN-W2-19-SEITENLEISTE.md §4.1 (Felder), §4.2
 * (Sortierung «ehrlich statt Reuse-Behauptung»), §4.3 (Ausschnitt/Badges),
 * §4.4 (findbar/malbar-Vertrag).
 *
 * WAS HIER GEPRÜFT WIRD und warum es hier und nicht in e2e steht: beide Regeln
 * sind reine Ableitungen aus Snapshot + Sidecar. Sie im Browser zu prüfen hiesse,
 * eine Datenfrage über den Umweg von Render, Scroll und Timing zu stellen —
 * genau die Bauart, die im Reader-Bestand die belegte Flake-Familie stellt
 * (§0/3). Der e2e-Teil prüft, was nur dort prüfbar ist: dass die gemalte Menge
 * die gezählte nie übersteigt.
 *
 * FIXTURE-REGEL (§8-Kasten der Spec, Lehre 9.8.2026): Erlasse werden über den
 * REGISTER-SCHLÜSSEL geladen (`BGFA`, `VWVG`), nie über einen von Hand gebauten
 * Dateipfad — macOS löst case-blind auf, der Linux-CI nicht.
 */
import { describe, it, expect } from 'vitest';
import { ladeNormFixture } from './fixtures/normtext-fixture';
import {
  baueLeserSuchIndex, sucheImErlass, zaehleTreffer, badgesFuer, fundstellenFolge,
  FELD_GEWICHT, AUSSCHNITT_MAX,
  type LeserSuchIndex,
} from '../pages/gesetz-leser/leserSuche';
import type { NormSnapshot } from '../lib/normtext/typen';
import type { StrukturMap } from '../lib/normtext/browse';

function index(key: string, ebene: 'bund' | 'kanton' = 'bund'): LeserSuchIndex {
  const { eintraege, struktur } = ladeNormFixture(ebene, key);
  return baueLeserSuchIndex(key, eintraege, struktur);
}

// Ein handgebauter Mini-Erlass: er stellt jede Feldklasse GENAU EINMAL, damit
// die Sortierregel an einer Lage geprüft wird, die man vollständig überblickt.
// Die Referenz-Erlasse darunter belegen dieselben Regeln am echten Korpus.
function kunstErlass(): { eintraege: NormSnapshot[]; struktur: StrukturMap } {
  const basis = {
    ebene: 'bund' as const, quelle: 'X', erlass: 'X',
    stand: '2026-01-01', quelleUrl: 'https://example.invalid', abgerufen: '2026-01-01',
    fassungsToken: '20260101', sha: 'x',
  };
  const eintraege: NormSnapshot[] = [
    // nur Fliesstext (t) — einmal
    { ...basis, id: 'x/1', artikel: '1', artikelLabel: 'Art. 1', bloecke: [{ absatz: '1', text: 'Der Zaunkoenig ist geschuetzt.' }] },
    // nur Randtitel-Blatt (m) — einmal
    { ...basis, id: 'x/2', artikel: '2', artikelLabel: 'Art. 2', bloecke: [{ absatz: '1', text: 'Ohne Fundstelle.' }] },
    // nur Gliederungstitel (g) — DREIMAL, damit die Fundstellenzahl allein den
    // Feldrang nicht schlagen darf (Stufe 1 vor Stufe 2).
    { ...basis, id: 'x/3', artikel: '3', artikelLabel: 'Art. 3', bloecke: [{ absatz: '1', text: 'Ohne Fundstelle.' }] },
    // nur Fussnote (f) — einmal
    { ...basis, id: 'x/4', artikel: '4', artikelLabel: 'Art. 4', bloecke: [{ absatz: '1', text: 'Ohne Fundstelle.' }] },
    // nur Tabelle (tb) — einmal
    { ...basis, id: 'x/5', artikel: '5', artikelLabel: 'Art. 5',
      bloecke: [{ absatz: null, text: '', tabelle: [{ beschreibung: 'Zaunkoenig', betrag: '10' }] }] },
    // nachrangiger Randtitel (n) — einmal
    { ...basis, id: 'x/6', artikel: '6', artikelLabel: 'Art. 6', bloecke: [{ absatz: '1', text: 'Ohne Fundstelle.' }] },
  ];
  const struktur: StrukturMap = {
    '1': { gliederung: [], marginalie: [] },
    '2': { gliederung: [], marginalie: ['Zaunkoenig'] },
    '3': { gliederung: [{ ebene: 1, label: 'Zaunkoenig, Zaunkoenig und Zaunkoenig' }], marginalie: [] },
    // D35-F3: `kl: 'A'` — eine ÄNDERUNGS-Fussnote. Nur diese Klasse kann seit
    // dem Entscheid vom 7.9.2026 überhaupt noch gedämpft werden, also muss der
    // Baustein sie tragen, damit die Malbarkeits-Fälle unten etwas prüfen.
    '4': { gliederung: [], marginalie: [], fussnoten: [{ nr: '7', text: 'Fassung zum Zaunkoenig', links: [], kl: 'A' }] },
    '5': { gliederung: [], marginalie: [] },
    // Der Treffer sitzt auf der NACHRANGIGEN Stufe (Index ≥ 1) — die oberste
    // Stufe ist `m`, jede weitere `n` (Generator-Semantik, such-index-generieren).
    '6': { gliederung: [], marginalie: ['Etwas anderes', 'A. Zaunkoenig'] },
  };
  return { eintraege, struktur };
}

// ═══ S4 · Sortierung auf Dokument-Reihenfolge ════════════════════════════════
//
// FAHRPLAN-LESER-V3 Kap. 7, Strang S4. DEKLARIERTE VERHALTENSÄNDERUNG gegenüber
// S8: die Trefferliste ist ein VERZEICHNIS neben dem vollständigen Wortlaut, kein
// Relevanz-Ranking. Herleitung vollständig im Modulkommentar von `leserSuche.ts`.
//
// Die beiden Tests dieses Blocks hiessen bis hierher «Feldgewicht … schlägt die
// Fundstellenzahl» und «bei gleichem Feld entscheidet die Fundstellenzahl». Sie
// schrieben die alte Rangfolge fest und sind mit ihr rot geworden (2 Fehlschläge,
// vor dem Umschreiben gesehen — §0 Ziff. 2). Sie sind darum NEU GEFASST, nicht
// nachgezogen: §6.3 verbietet das Anpassen von Tests im Refactoring, und genau
// deshalb ist S4 auch keines, sondern eine deklarierte fachliche Änderung mit
// eigener Begründung.
describe('S4 §4.2 — erlass-lokale Sortierung: Dokument-Reihenfolge', () => {
  it('ordnet nach Dokument-Position, NICHT nach Feldgewicht oder Fundstellenzahl', () => {
    const { eintraege, struktur } = kunstErlass();
    const treffer = sucheImErlass(baueLeserSuchIndex('X', eintraege, struktur), 'Zaunkoenig');
    // Der Kunst-Erlass stellt jede Feldklasse genau einmal, in einer Reihenfolge,
    // die der alten Rangfolge WIDERSPRICHT: Art. 3 trifft dreimal, aber nur im
    // Gliederungstitel (g); Art. 6 trägt das stärkere Feld `n`, steht aber
    // hinten. Unter der alten Regel kam ['1','2','6','3','5','4'] heraus — jetzt
    // steht jeder Artikel an seiner Stelle im Erlass.
    expect(treffer.map((t) => t.token)).toEqual(['1', '2', '3', '4', '5', '6']);
    // Das getroffene Feld ist damit NICHT verschwunden: es steht weiter an jedem
    // Treffer und trägt Badge und Ausschnitt (§8 — sichtbar statt in einer
    // Listenposition versteckt).
    expect(treffer.map((t) => t.topFeld)).toEqual(['t', 'm', 'g', 'f', 'tb', 'n']);
    expect(treffer.find((t) => t.token === '3')!.fundstellen).toBe(3);
  });

  it('eine höhere Fundstellenzahl zieht einen späteren Artikel NICHT nach vorn', () => {
    const { eintraege, struktur } = kunstErlass();
    // Zwei zusätzliche reine Fliesstext-Artikel: der spätere trifft zweimal, der
    // noch spätere einmal. Unter der alten Stufe 2 stand Art. 7 vor Art. 1.
    eintraege.push(
      { ...eintraege[0], id: 'x/7', artikel: '7', artikelLabel: 'Art. 7', bloecke: [{ absatz: '1', text: 'Zaunkoenig und Zaunkoenig.' }] },
      { ...eintraege[0], id: 'x/8', artikel: '8', artikelLabel: 'Art. 8', bloecke: [{ absatz: '1', text: 'Zaunkoenig allein.' }] },
    );
    struktur['7'] = { gliederung: [], marginalie: [] };
    struktur['8'] = { gliederung: [], marginalie: [] };
    const treffer = sucheImErlass(baueLeserSuchIndex('X', eintraege, struktur), 'Zaunkoenig');
    const t = treffer.filter((x) => x.topFeld === 't').map((x) => x.token);
    expect(t).toEqual(['1', '7', '8']);
  });

  // DIESER TEST TÖTET DIE MUTANTE «sort ganz weglassen».
  //
  // B11 (Bug-Check §9 zu S8) hielt für die alte Stufe 3 fest, dass kein
  // Black-Box-Test sie erreichen kann: die Artikel kommen bereits in
  // Dokument-Reihenfolge aus dem Index, ein `sort` danach ist
  // beobachtungsgleich mit gar keinem. Für S4 wäre das derselbe blinde Fleck —
  // die einzige Sortierstufe IST jetzt die Index-Ordnung. Er wird hier
  // ausgeräumt, statt ihn ein zweites Mal im Kommentar zuzugeben: der Index
  // wird VOR dem Suchlauf permutiert. Kommt die Liste trotzdem in
  // Dokument-Reihenfolge heraus, sortiert die Funktion wirklich; fällt der
  // `sort` weg, kommt die Permutation durch.
  it('sortiert wirklich — permutierter Index liefert dieselbe Dokument-Reihenfolge', () => {
    const { eintraege, struktur } = kunstErlass();
    const ix = baueLeserSuchIndex('X', eintraege, struktur);
    const gedreht: LeserSuchIndex = { ...ix, artikel: [...ix.artikel].reverse() };
    const treffer = sucheImErlass(gedreht, 'Zaunkoenig');
    expect(treffer.map((t) => t.token)).toEqual(['1', '2', '3', '4', '5', '6']);
    // `pos` ist der Laufindex über `eintraege` und je Artikel eindeutig — die
    // Ordnung ist damit strikt aufsteigend und total, es gibt keinen
    // Gleichstand, den eine zweite Stufe brechen müsste (§2).
    const posFolge = treffer.map((t) => t.pos);
    expect(posFolge).toEqual([...posFolge].sort((a, b) => a - b));
    expect(new Set(posFolge).size).toBe(posFolge.length);
  });

  // Die Reihenfolge-Zusage gilt nicht nur am Kunst-Erlass, sondern am echten
  // Korpus — dort, wo Feldklassen und Fundstellenzahlen wild durcheinander
  // liegen und die alte Rangfolge die Liste sichtbar durchmischt hätte.
  it('am echten Erlass (BGFA): die ganze Liste läuft mit dem Gesetz mit', () => {
    // §6.3-DEKLARATION (LESER-NAV, FB O-36 b): der Begriff war «Anwalt». Seit ein
    // Sektionskopf nur noch am ERSTEN Artikel seines Teilbaums zählt, trägt dort
    // jeder «Anwalt»-Artikel auch Fliesstext — das Feld `t` schlägt `g` und alle
    // Treffer haben topFeld `t`. «Disziplin» trifft in `t`, `m` und `g` (je ein
    // Artikel nur über Randtitel bzw. Kopf), der Fall bleibt damit ein Fall.
    const treffer = sucheImErlass(index('BGFA'), 'Disziplin');
    expect(treffer.length).toBeGreaterThan(5);
    const posFolge = treffer.map((t) => t.pos);
    expect(posFolge).toEqual([...posFolge].sort((a, b) => a - b));
    // Und es sind wirklich verschiedene Feldklassen im Spiel — sonst wäre die
    // Aussage «Feldgewicht ordnet NICHT mehr» am Fixture leer.
    expect(new Set(treffer.map((t) => t.topFeld)).size).toBeGreaterThan(1);
  });

  it('Ergebnis ist deterministisch — zweimal gesucht ist zweimal dasselbe (§2)', () => {
    const ix = index('BGFA');
    const a = sucheImErlass(ix, 'Anwalt');
    const b = sucheImErlass(index('BGFA'), 'Anwalt');
    expect(a.map((x) => `${x.token}:${x.fundstellen}`)).toEqual(b.map((x) => `${x.token}:${x.fundstellen}`));
    expect(a.length).toBeGreaterThan(5);
  });

  it('die Feldordnung ist die des Generators, nicht neu erfunden', () => {
    expect(FELD_GEWICHT.t).toBeGreaterThan(FELD_GEWICHT.m);
    expect(FELD_GEWICHT.m).toBeGreaterThan(FELD_GEWICHT.n);
    expect(FELD_GEWICHT.n).toBeGreaterThan(FELD_GEWICHT.g);
    expect(FELD_GEWICHT.g).toBeGreaterThan(FELD_GEWICHT.tb);
    expect(FELD_GEWICHT.tb).toBeGreaterThan(FELD_GEWICHT.f);
  });
});

describe('S8 §4.4 — findbar/malbar: der Zähler ist datenseitig, die Badges sind ehrlich', () => {
  it('der Zähler summiert ALLE Felder — auch die, die nie gemalt werden', () => {
    const { eintraege, struktur } = kunstErlass();
    const treffer = sucheImErlass(baueLeserSuchIndex('X', eintraege, struktur), 'Zaunkoenig');
    const { artikel, fundstellen } = zaehleTreffer(treffer);
    expect(artikel).toBe(6);
    // 1×t + 1×m + 1×n + 3×g + 1×tb + 1×f = 8 — auch die Köpfe (n, 3×g) sind
    // mitgezählt; Art. 3 und Art. 6 sind jeweils der erste Artikel unter ihrem
    // Kopf, die Zahl bleibt unverändert (LESER-NAV, FB O-36 b).
    expect(fundstellen).toBe(8);
  });

  // §6.3-DEKLARATION (LESER-NAV, FB O-36 b, Entscheid David 15.10.2026 «Ja,
  // markieren»): Gliederungstitel und geteilte Randtitel-Stufen waren `nie`
  // malbar. Sie stehen im DOM aber als Sektionskopf — gemalt wird dort, also `kopf`.
  it('Sektionsköpfe (Gliederung, geteilter Randtitel) sind als `kopf` markiert, das Blatt als `immer`', () => {
    const { eintraege, struktur } = kunstErlass();
    const treffer = sucheImErlass(baueLeserSuchIndex('X', eintraege, struktur), 'Zaunkoenig');
    const feldVon = (token: string) => treffer.find((t) => t.token === token)!.felder[0];
    expect(feldVon('3').malbar).toBe('kopf');
    expect(feldVon('6').malbar).toBe('kopf');
    expect(feldVon('1').malbar).toBe('immer');
    // §6.3-DEKLARATION (D35-F3): der Wert hiess `'fussnoten'` und meinte «hängt
    // am Apparat-Schalter»; den gibt es nicht mehr. Er heisst `'aenderung'` und
    // meint die einzige Klasse, die noch verschwinden kann (`kl:'A'`).
    expect(feldVon('4').malbar).toBe('aenderung');
  });

  it('jeder Nicht-Fliesstext-Treffer trägt einen Herkunfts-Badge, ein Fliesstext-Treffer keinen', () => {
    const { eintraege, struktur } = kunstErlass();
    const treffer = sucheImErlass(baueLeserSuchIndex('X', eintraege, struktur), 'Zaunkoenig');
    const badges = (token: string) => badgesFuer(treffer.find((t) => t.token === token)!, false);
    expect(badges('1')).toEqual([]);
    expect(badges('2')).toEqual(['Randtitel']);
    expect(badges('3')).toEqual(['Überschrift']);
    expect(badges('4')).toEqual(['Fussnote']);
    expect(badges('5')).toEqual(['Tabelle']);
    expect(badges('6')).toEqual(['Randtitel']);
  });

  it('bei gedämpfter Änderungshistorie sagt der Badge es — die Ansicht wird nicht still umgeschaltet', () => {
    const { eintraege, struktur } = kunstErlass();
    const treffer = sucheImErlass(baueLeserSuchIndex('X', eintraege, struktur), 'Zaunkoenig');
    const fn = treffer.find((t) => t.token === '4')!;
    expect(badgesFuer(fn, true)).toEqual(['Fussnote (ausgeblendet)']);
    // Der ZÄHLER bleibt davon unberührt — er ist datenseitig (§4.4 Ziff. 1).
    expect(fn.fundstellen).toBe(1);
  });

  it('am echten Erlass: Fussnoten- und Überschriften-Treffer sind findbar und benannt (BGFA)', () => {
    const treffer = sucheImErlass(index('BGFA'), 'Fassung');
    expect(treffer.length).toBeGreaterThan(0);
    const mitFussnote = treffer.filter((t) => t.felder.some((f) => f.quelle === 'Fussnote'));
    expect(mitFussnote.length, 'BGFA trägt Fussnoten-Treffer für «Fassung»').toBeGreaterThan(0);
    for (const t of mitFussnote) expect(badgesFuer(t, false)).toContain('Fussnote');
    // Und die alte Filterregel hätte davon KEINEN gefunden: sie las nur Label
    // und `bloecke[].text`/`items[].text`.
    const { eintraege } = ladeNormFixture('bund', 'BGFA');
    const alt = eintraege.filter((e) => e.artikelLabel.toLowerCase().includes('fassung')
      || e.bloecke.some((b) => b.text.toLowerCase().includes('fassung')
        || (b.items ?? []).some((it) => it.text.toLowerCase().includes('fassung'))));
    expect(treffer.length, 'die neue Suche findet mehr als die alte Filterregel').toBeGreaterThan(alt.length);
  });

  it('die Fundstellen-Folge deckt sich mit dem Zähler (↑↓-Navigation, §4.3)', () => {
    const treffer = sucheImErlass(index('BGFA'), 'Anwalt');
    const folge = fundstellenFolge(treffer, false);
    expect(folge.length).toBe(zaehleTreffer(treffer).fundstellen);
    // Die Ränge laufen je Artikel lückenlos von 0 hoch.
    const ersterToken = treffer[0].token;
    expect(folge.filter((f) => f.token === ersterToken).map((f) => f.rang))
      .toEqual([...Array(treffer[0].fundstellen).keys()]);
  });

  // ── B5 (Bug-Check §9 zu S8): der Sprung indexierte GEMALTE Stellen mit dem
  // DATENSEITIGEN Rang. Beides ist dieselbe Zahl nur, solange jede Fundstelle
  // eines Artikels malbar ist — der Modulkommentar nannte das den «Regelfall»,
  // empirisch ist es das nicht (im OR trifft es 235+ Artikel). Sobald ein
  // Artikel eine NIE malbare Fundstelle trägt (Gliederungspfad, Bild-Alt),
  // verschiebt sich die Zuordnung um genau deren Zahl.
  // Der Folge-Eintrag führt darum zusätzlich `malRang`: die Position unter den
  // MALBAREN Stellen desselben Artikels, in derselben Reihenfolge, in der
  // `sammleTrefferRanges` sie im DOM findet. Nicht malbar ⇒ `null`, und der
  // Sprung bleibt designkonform beim Artikel, statt eine Stelle zu behaupten (§8).
  it('B5 — malRang zählt nur die malbaren Stellen, in Dokument-Reihenfolge', () => {
    const treffer = sucheImErlass(index('BGFA'), 'Anwalt');
    const folge = fundstellenFolge(treffer, false);
    // Vertrag 1: je Artikel sind die malRänge lückenlos 0..k-1 — genau so
    // indexiert der Sprung in die Range-Liste.
    // Stellen im Sektionskopf zählen im KOPF (`kopf` gesetzt, O-36 b) und stehen
    // nicht in der Range-Liste des Artikels — sie sind hier ausgenommen, ihr Rang
    // ist je Kopf lückenlos (eigener Test in leser-kopf-treffer-o36b).
    for (const t of treffer) {
      const raenge = folge.filter((f) => f.token === t.token && f.kopf === null && f.malRang !== null).map((f) => f.malRang);
      expect(raenge, `malRang-Folge von ${t.token}`).toEqual([...Array(raenge.length).keys()]);
    }
    // Vertrag 2: jede Fundstelle hat entweder einen malRang oder ist als nicht
    // malbar ausgewiesen — nie beides, nie keines.
    for (const f of folge) expect(f.malRang === null || f.malRang >= 0).toBe(true);
  });

  it('B5 — ein Artikel mit NICHT malbarer Fundstelle bekommt einen versetzten malRang', () => {
    // «Anwältinnen» steht im BGFA auch in einem Sektionskopf (`g`, `kopf`). Die
    // Stelle steht im Kopf, nicht im Artikel: datenseitiger Rang und Artikel-Rang
    // trennen sich — vor dem Fix gab es die Unterscheidung gar nicht. (Bis
    // O-36 b stand hier der Gliederungspfad als `nie`; er ist jetzt der Kopf.)
    const treffer = sucheImErlass(index('BGFA'), 'Anwältinnen');
    const folge = fundstellenFolge(treffer, false);
    const versetzt = folge.filter((f) => f.kopf === null && f.malRang !== null && f.malRang !== f.rang);
    expect(versetzt.length, 'kein Artikel mit versetztem malRang — Testfall trägt nicht').toBeGreaterThan(0);
  });

  // ── B1: derselbe Betrag, drei Schreibweisen, EINE Trefferzahl ────────────
  // Beleg aus dem committeten Korpus: die AHVV speichert «16 800 Franken»
  // (Art. 6quater) bzw. «10 100 Franken» (Art. 21) mit LEERZEICHEN, die
  // Lesespalte malt sie mit Apostroph. Wer «16'800» tippte, bekam vor dem Fix
  // NULL Treffer gemeldet — und sah die Stelle im Text trotzdem leuchten.
  it('B1 — «16 800», «16\'800» und «16800» finden dieselben Stellen (AHVV)', () => {
    const ix = index('AHVV');
    const mitLuecke = sucheImErlass(ix, '16 800');
    const mitApostroph = sucheImErlass(ix, "16'800");
    const blank = sucheImErlass(ix, '16800');
    expect(mitLuecke.length, 'Testfall trägt nicht — AHVV kennt «16 800» nicht mehr').toBeGreaterThan(0);
    const signatur = (ts: ReturnType<typeof sucheImErlass>) =>
      ts.map((t) => `${t.token}:${t.fundstellen}`).join('|');
    expect(signatur(mitApostroph)).toBe(signatur(mitLuecke));
    expect(signatur(blank)).toBe(signatur(mitLuecke));
  });

  it('B5 — bei gedämpfter Änderungshistorie zählen deren Stellen nicht als malbar', () => {
    // Die A-Fussnoten sind per CSS gedämpft; `sammleTrefferRanges` überspringt
    // sie dann (`istGerendert`). Wer den malbaren Rang unabhängig davon zählte,
    // verschöbe die Zuordnung genau um diese Treffer.
    // ── §6.3-DEKLARATION (D35-F3, Entscheid David 7.9.2026) ──────────────────
    // Der Fall zitierte bis hierher die Malbarkeit `'fussnoten'` — den Zustand
    // «der ganze Apparat ist aus». Den gibt es nicht mehr (verlustfrei: amtlicher
    // Nicht-Änderungs-Apparat wird nie ausgeblendet). Geprüft wird jetzt, was
    // wirklich verschwinden kann: `kl:'A'`. Die MECHANIK des Falls — gedämpfte
    // Stellen sind nicht malbar, also schrumpft die Folge — ist unverändert.
    const treffer = sucheImErlass(index('BGFA'), 'Fassung');
    const mitFn = treffer.filter((t) => t.felder.some((f) => f.malbar === 'aenderung'));
    expect(mitFn.length, 'BGFA trägt Änderungs-Fussnoten-Treffer für «Fassung»').toBeGreaterThan(0);
    const an = fundstellenFolge(treffer, false).filter((f) => f.malRang !== null).length;
    const aus = fundstellenFolge(treffer, true).filter((f) => f.malRang !== null).length;
    expect(aus, 'gedämpfte Änderungshistorie ⇒ weniger malbare Stellen').toBeLessThan(an);
  });
});

describe('S8 §4.3 — Textausschnitt aus den Quell-Strings (Entscheid c)', () => {
  it('der Ausschnitt zeigt den Begriff in Original-Schreibweise und bleibt im Rahmen', () => {
    const treffer = sucheImErlass(index('BGFA'), 'anwalt');
    for (const t of treffer.slice(0, 12)) {
      const a = t.ausschnitt!;
      expect(a, `Ausschnitt fehlt bei ${t.token}`).not.toBeNull();
      expect(a.treffer.toLowerCase()).toBe('anwalt');
      // «…»-Marken zählen nicht zum Text; der Rahmen gilt für den Inhalt.
      const laenge = a.vor.replace(/^… /, '').length + a.treffer.length + a.nach.replace(/ …$/, '').length;
      expect(laenge, `Ausschnitt zu lang bei ${t.token}: ${laenge}`).toBeLessThanOrEqual(AUSSCHNITT_MAX);
    }
  });

  it('der Ausschnitt kommt aus dem stärksten getroffenen Feld, nicht aus dem ersten', () => {
    const { eintraege, struktur } = kunstErlass();
    // Art. 2 trifft im Randtitel (m, Segment 1) UND im Fliesstext (t, später).
    eintraege[1].bloecke = [{ absatz: '1', text: 'Auch hier steht Zaunkoenig im Wortlaut.' }];
    const treffer = sucheImErlass(baueLeserSuchIndex('X', eintraege, struktur), 'Zaunkoenig');
    const t = treffer.find((x) => x.token === '2')!;
    expect(t.ausschnitt!.quelle).toBe('Fliesstext');
    expect(t.topFeld).toBe('t');
  });

  it('Fussnoten-Ausschnitte sind markup-frei (§8: keine rohen spitzen Klammern)', () => {
    const ix = index('BGFA');
    for (const a of ix.artikel) {
      for (const s of a.segmente) expect(s.text, `Markup in ${a.token}`).not.toMatch(/<\/?[bi]>/i);
    }
  });
});

describe('S8 §4.1 — Feld-Records aus Snapshot + Sidecar, ohne Such-Index', () => {
  it('ein Erlass ohne Sidecar bleibt durchsuchbar (T10, 42 Kantons-Snapshots)', () => {
    const { eintraege } = ladeNormFixture('bund', 'BGFA');
    const ohne = baueLeserSuchIndex('BGFA', eintraege, null);
    const treffer = sucheImErlass(ohne, 'Anwalt');
    expect(treffer.length).toBeGreaterThan(0);
    // Ohne Sidecar gibt es keine Randtitel-, Gliederungs- und Fussnoten-Felder —
    // gefunden wird der Wortlaut, und die Liste sagt es über die Badges nicht
    // anders (§8: keine erfundenen Quellen).
    const quellen = new Set(treffer.flatMap((t) => t.felder.map((f) => f.quelle)));
    expect(quellen.has('Überschrift')).toBe(false);
    expect(quellen.has('Fussnote')).toBe(false);
    expect(quellen.has('Fliesstext')).toBe(true);
  });

  it('leerer Begriff liefert nichts (kein Voll-Lauf über den Erlass)', () => {
    expect(sucheImErlass(index('BGFA'), '')).toEqual([]);
    expect(sucheImErlass(index('BGFA'), '   ')).toEqual([]);
    expect(sucheImErlass(null, 'Anwalt')).toEqual([]);
  });

  it('flacher Erlass mit vielen Randtiteln: VwVG bleibt vollständig indiziert', () => {
    const ix = index('VWVG');
    expect(ix.artikel.length).toBe(93);
    const mitRandtitel = ix.artikel.filter((a) => a.randtitel !== null);
    expect(mitRandtitel.length, 'VwVG trägt 93/93 Randtitel (Spec §8, T3)').toBeGreaterThan(80);
    const treffer = sucheImErlass(ix, 'Beschwerde');
    expect(treffer.length).toBeGreaterThan(10);
    expect(treffer.every((t) => t.gruppe !== null || t.felder.length > 0)).toBe(true);
  });
});
