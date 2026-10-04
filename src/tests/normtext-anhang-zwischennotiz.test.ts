// W2·27-BUND-FERTIG, Paket P4 (2.10.2026): marke-lose Anhang-Zeilen mit eigener Unterliste (und Zeilen hinter
// einem Item mit Unterliste) stehen als eigener Block AN IHRER STELLE, nicht lose vor der Liste.
// Regel + Begründung (Block statt Eltern-Item-Erweiterung): scripts/normtext/anhang-fortsetzung.ts.
//
// Fixtures: WÖRTLICH aus den gepinnten Fedlex-Filestore-HTMLs (abgerufen 2.10.2026), nur class-/data-Attribute
// und Nachbar-Items gekürzt — AVO SR 961.011 (Konsolidierung 20260226), VTS SR 741.41, FIDLEV SR 950.11.
import { describe, it, expect } from 'vitest';
import { extrahiereAnhang, extrahiereArtikel } from '../../scripts/normtext/extrahiere-fedlex.ts';
import { bloeckeAusItems } from '../../scripts/normtext/anhang-fortsetzung.ts';

const wrap = (dl: string, vor = '') =>
  '<div id="annex"><section id="annex_u1"><h1 class="heading" role="heading" aria-level="1"><a href="#annex_u1">Beilage</a></h1><div class="collapseable">' +
  vor +
  dl +
  '</div></section></div>';
const liste = (dl: string, vor = '') => extrahiereAnhang(wrap(dl, vor), 'annex_u1')!;
type Ex = ReturnType<typeof liste>;
const itemsVon = (ex: Ex) => ex.bloecke.flatMap((b) => b.items ?? []);
// Lesefolge der Blöcke: Text, dann je Item «marke text» (Tiefe als Punkte) — die Reihenfolge, in der der Reader zeigt.
const lesefolge = (ex: Ex): string[] =>
  ex.bloecke.flatMap((b) => [
    ...(b.text ? [b.text] : []),
    ...(b.items ?? []).map((i) => `${'.'.repeat(i.tiefe ?? 0)}${i.marke} ${i.text}`.trim()),
  ]);

// AVO Anh. 1 B7–B10: B7/B9 mit absorbierter Zeile, B8 mit Zeile + Unterliste.
const AVO_B7_B10 =
  '<dl><dt>B7 </dt><dd>Transportgüter (einschliesslich Waren, Gepäckstücke und alle sonstigen Güter)</dd><dt></dt><dd>Sämtliche Schäden an transportierten Gütern, unabhängig von dem jeweils verwendeten Transportmittel</dd>' +
  '<dt>B8 </dt><dd>Feuer und Elementarschäden</dd><dt></dt><dd>Sämtliche Sachschäden (soweit sie nicht unter die Zweige B3, B4, B5, B6 oder B7 fallen), die verursacht werden durch:<dl><dt>– </dt><dd>Feuer</dd><dt>– </dt><dd>Explosion</dd><dt>– </dt><dd>Sturm</dd><dt>– </dt><dd>andere Elementarschäden ausser Sturm</dd><dt>– </dt><dd>Kernenergie</dd><dt>– </dt><dd>Bodensenkungen und Erdrutsch</dd></dl></dd>' +
  '<dt>B9 </dt><dd>Sonstige Sachschäden</dd><dt></dt><dd>Sämtliche Sachschäden (soweit sie nicht unter die Zweige B3, B4, B5, B6 und B7 fallen), die durch Hagel oder Frost sowie durch Ursachen aller Art (wie beispielsweise Diebstahl) hervorgerufen werden, soweit diese Ursachen nicht unter Nummer 8 erfasst sind</dd>' +
  '<dt>B10 </dt><dd>Haftpflicht für Landfahrzeuge mit eigenem Antrieb</dd></dl>';

describe('P4: AVO Anh. 1 B8 — Quellreihenfolge, kein Verlust, keine Dublette', () => {
  const ex = liste(AVO_B7_B10);
  it('Lesefolge: B7 (+Zeile), B8, Einleitung «… durch:», sechs Spiegelstriche, B9 (+Zeile), B10', () => {
    const l = lesefolge(ex);
    expect(l[0]).toMatch(/^B7 Transportgüter .*Güter\) Sämtliche Schäden an transportierten Gütern/);
    expect(l[1]).toBe('B8 Feuer und Elementarschäden');
    expect(l[2]).toBe(
      'Sämtliche Sachschäden (soweit sie nicht unter die Zweige B3, B4, B5, B6 oder B7 fallen), die verursacht werden durch:',
    );
    expect(l.slice(3, 9)).toEqual([
      '.– Feuer',
      '.– Explosion',
      '.– Sturm',
      '.– andere Elementarschäden ausser Sturm',
      '.– Kernenergie',
      '.– Bodensenkungen und Erdrutsch',
    ]);
    expect(l[9]).toMatch(/^B9 Sonstige Sachschäden Sämtliche Sachschäden .*Nummer 8 erfasst sind$/);
    expect(l[10]).toBe('B10 Haftpflicht für Landfahrzeuge mit eigenem Antrieb');
    expect(l).toHaveLength(11);
  });
  it('B8 trägt die Einleitung NICHT im Text (eigener Block: keine Zuordnung, die die Quelle nicht trägt)', () => {
    expect(itemsVon(ex).find((i) => i.marke === 'B8')!.text).toBe('Feuer und Elementarschäden');
  });
  it('Drop/Leak: jede Quell-Zeile genau einmal im Output', () => {
    const out = JSON.stringify(ex.bloecke);
    for (const satz of [
      'Sämtliche Sachschäden (soweit sie nicht unter die Zweige B3, B4, B5, B6 oder B7',
      'Bodensenkungen und Erdrutsch',
      'Sämtliche Schäden an transportierten Gütern',
      'Haftpflicht für Landfahrzeuge mit eigenem Antrieb',
    ]) {
      expect(AVO_B7_B10.split(satz).length - 1).toBe(1);
      expect(out.split(satz).length - 1).toBe(1);
    }
    expect(out).not.toContain('notiz');
  });
});

// VTS Anh. 7 Ziff. 232/233: ZWEI Zeilen mit je eigener Unterliste hintereinander; die zweite Unterliste besteht aus
// marke-losen Zeilen.
const VTS_232 =
  '<dl><dt><i>232</i><i> </i></dt><dd><i>Bremsung auf ein Rad</i></dd><dt></dt><dd>Die Verzögerung muss bei der Bremsung mit der Vorderradbremse allein mindestens betragen für Fahrzeuge der:<dl><dt>Klasse 1: </dt><dd>3,4 m/s<sup>2</sup></dd><dt>Klasse 2: </dt><dd>2,7 m/s<sup>2</sup></dd></dl></dd>' +
  '<dt></dt><dd>Die Verzögerung muss bei der Bremsung mit der Hinterradbremse allein mindestens betragen für Fahrzeuge der:<dl><dt></dt><dd>Klassen 1 und 2: 2,7 m/s<sup>2</sup></dd><dt></dt><dd>Klasse 3: 2,9 m/s<sup>2</sup></dd></dl></dd>' +
  '<dt><i>233</i><i> </i></dt><dd><i>Bremsung bei teilweise kombinierten Bremsanlagen</i></dd></dl>';

describe('P4: zwei Zeilen mit Unterliste hintereinander (VTS Anh. 7 Ziff. 232)', () => {
  it('Lesefolge: 232, Vorderrad-Zeile, Klassen, Hinterrad-Zeile, deren marke-lose Zeilen, 233', () => {
    // P8 (3.10.2026, DEKLARIERTE FACHÄNDERUNG): die Quelle setzt «m/s<sup>2</sup>»; die Erwartung pinnte den
    // alten Normalisierungsfehler «m/s 2» (Leerzeichen um die Ziffer). Jetzt «m/s²» — nur diese vier Zeilen ändern sich,
    // die Lesefolge/Struktur des Tests (P4) bleibt unverändert.
    expect(lesefolge(liste(VTS_232))).toEqual([
      '232 Bremsung auf ein Rad',
      'Die Verzögerung muss bei der Bremsung mit der Vorderradbremse allein mindestens betragen für Fahrzeuge der:',
      '.Klasse 1 3,4 m/s²',
      '.Klasse 2 2,7 m/s²',
      'Die Verzögerung muss bei der Bremsung mit der Hinterradbremse allein mindestens betragen für Fahrzeuge der:',
      'Klassen 1 und 2: 2,7 m/s²',
      'Klasse 3: 2,9 m/s²',
      '233 Bremsung bei teilweise kombinierten Bremsanlagen',
    ]);
  });
});

// AVO Anh. 7 Ziff. 9.2: Zeile mit Unterliste a)–c), danach eine SCHLUSSZEILE ohne Unterliste — sie steht NACH a)–c)
// und darf nicht davor (am Eltern-Item) erscheinen.
const AVO_9_2 =
  '<dl><dt>«9.2 </dt><dd><i>Rückforderung der Entschädigung (Storno)</i></dd><dt></dt><dd>Für die Rückforderung der Entschädigung betreffend sämtliche Produkte gelten folgende Bedingungen unabhängig vom Start der Versicherung (per 1.1. oder unterjährig):<dl><dt>a) </dt><dd>Bei einer Vertragsdauer zwischen null bis und mit 365 Tagen muss die Entschädigung vom Vermittler zu 100 % zurückerstattet werden.</dd><dt>b) </dt><dd>Bei einer Vertragsdauer zwischen 366 und 730 Tagen bezahlt der Vermittler mindestens 50 % der erhaltenen Entschädigung zurück.</dd><dt>c) </dt><dd>Ab dem 731. Tag entscheidet jeder Versicherer über die Höhe individuell.</dd></dl></dd>' +
  '<dt></dt><dd>Schaltjahre sind entsprechend zu berücksichtigen. Bei Todesfall einer versicherten Person innerhalb der Fristen mit Rückerstattung kann der Versicherer auf die Rückforderung ganz oder teilweise verzichten.»</dd></dl>';

describe('P4: Schlusszeile NACH der Unterliste steht dahinter (AVO Anh. 7 Ziff. 9.2)', () => {
  const l = lesefolge(liste(AVO_9_2));
  it('Lesefolge: 9.2, Einleitung, a), b), c), Schaltjahre-Zeile', () => {
    expect(l).toHaveLength(6);
    expect(l[0]).toBe('«9.2 Rückforderung der Entschädigung (Storno)');
    expect(l[1]).toMatch(/^Für die Rückforderung der Entschädigung betreffend sämtliche Produkte/);
    expect(l.slice(2, 5).map((x) => x.slice(0, 3))).toEqual(['.a ', '.b ', '.c ']);
    expect(l[5]).toMatch(/^Schaltjahre sind entsprechend zu berücksichtigen\./);
  });
});

// FIDLEV Anh. 4 lit. d (Tiefe 1): die Zeile mit Unterliste steht in einer Unterliste.
describe('P4: Zeile mit Unterliste in einer Unterliste (FIDLEV Anh. 4, lit. d)', () => {
  const ex = liste(
    '<dl><dt>2.4.2 </dt><dd>Angaben:<dl><dt>c. </dt><dd>Gesellschaftsstufe</dd><dt>d. </dt><dd>Entwicklungsliegenschaften</dd><dt></dt><dd>Bei Entwicklungsliegenschaften oder Projekten nebst den in Buchstabe a aufgelisteten Angaben:<dl><dt>– </dt><dd>Beschreibung des Projekts;</dd><dt>– </dt><dd>Projektstand (Bewilligungen, Bauten, Verkauf/Vermietung);</dd></dl></dd><dt>e. </dt><dd>Beteiligungen des Emittenten an Immobiliengesellschaften</dd></dl></dd><dt>2.4.3 </dt><dd>Bewertungsmethoden</dd></dl>',
  );
  it('Lesefolge hält die Reihenfolge ein; die Spiegelstriche tragen Tiefe 2', () => {
    expect(lesefolge(ex)).toEqual([
      '2.4.2 Angaben:',
      '.c Gesellschaftsstufe',
      '.d Entwicklungsliegenschaften',
      'Bei Entwicklungsliegenschaften oder Projekten nebst den in Buchstabe a aufgelisteten Angaben:',
      '..– Beschreibung des Projekts;',
      '..– Projektstand (Bewilligungen, Bauten, Verkauf/Vermietung);',
      '.e Beteiligungen des Emittenten an Immobiliengesellschaften',
      '2.4.3 Bewertungsmethoden',
    ]);
    expect(itemsVon(ex).filter((i) => i.tiefe === 2)).toHaveLength(2);
  });
});

describe('P4: unverändert bleibt, was schon an seiner Stelle stand', () => {
  it('erste Zeile einer <dl> mit Unterliste (kein Vorgänger-Item) bleibt Lead der Liste', () => {
    const ex = liste(
      '<dl><dt></dt><dd>Die Erleichterungen sind wie folgt gekennzeichnet:<dl><dt>– </dt><dd>Kürzel A</dd><dt>– </dt><dd>Kürzel B</dd></dl></dd><dt>1.1 </dt><dd>Erstes Item</dd></dl>',
    );
    expect(ex.bloecke).toHaveLength(1);
    expect(ex.bloecke[0].text).toBe('Die Erleichterungen sind wie folgt gekennzeichnet:');
    expect(ex.bloecke[0].items!.map((i) => i.marke)).toEqual(['–', '–', '1.1']);
  });
  it('reine Prosa-<dl> ohne Items (nur marke-lose Zeilen) bleibt eine Folge von Notiz-Blöcken in Quellordnung', () => {
    const ex = liste('<dl><dt> </dt><dd>Erste Zeile</dd><dt> </dt><dd>Zweite Zeile</dd></dl>');
    expect(lesefolge(ex)).toEqual(['Erste Zeile', 'Zweite Zeile']);
  });
  it('die erste Item-Gruppe hängt weiter am vorausgehenden Einleitungs-Absatz', () => {
    const ex = liste(
      '<dl><dt>a. </dt><dd>eins</dd><dt></dt><dd>Zusatz mit Liste:<dl><dt>1. </dt><dd>x</dd></dl></dd><dt>b. </dt><dd>zwei</dd></dl>',
      '<p>Es gilt:</p>',
    );
    expect(ex.bloecke[0].text).toBe('Es gilt:');
    expect(ex.bloecke[0].items!.map((i) => i.marke)).toEqual(['a']);
    expect(lesefolge(ex)).toEqual(['Es gilt:', 'a eins', 'Zusatz mit Liste:', '.1 x', 'b zwei']);
  });
});

describe('bloeckeAusItems: Schnitt an Zwischen-Notizen (Einheit)', () => {
  const n = (text: string, tiefe?: number) => ({ marke: '', text, notiz: true as const, ...(tiefe ? { tiefe } : {}) });
  it('Notiz besitzt die folgenden Items tieferer Ebene, danach beginnt ein Items-Block', () => {
    const b = bloeckeAusItems([
      { marke: 'a', text: 'A' },
      n('N'),
      { marke: '–', text: 'x', tiefe: 1 },
      { marke: 'b', text: 'B' },
    ]);
    expect(b).toEqual([
      { absatz: null, text: '', items: [{ marke: 'a', text: 'A' }] },
      { absatz: null, text: 'N', items: [{ marke: '–', text: 'x', tiefe: 1 }], einzug: 0 },
      { absatz: null, text: '', items: [{ marke: 'b', text: 'B' }] },
    ]);
  });
  it('Notiz ohne Unterliste = reiner Text-Block; leere Liste = keine Blöcke', () => {
    expect(bloeckeAusItems([{ marke: 'a', text: 'A' }, n('N')])).toEqual([
      { absatz: null, text: '', items: [{ marke: 'a', text: 'A' }] },
      { absatz: null, text: 'N', einzug: 0 },
    ]);
    expect(bloeckeAusItems([])).toEqual([]);
  });
});

describe('Haupttext unberührt (anhang=false): keine Zwischen-Notizen, kein Flag im Snapshot', () => {
  it('extrahiereArtikel liefert nie `notiz`', () => {
    const html =
      '<article id="art_1"><h6 class="heading"><a href="#art_1"><b>Art. 1</b></a></h6><div class="collapseable"><p><sup>1</sup> Einleitung:</p>' +
      '<dl><dt>a. </dt><dd>eins</dd><dt></dt><dd>Zusatz:<dl><dt>1. </dt><dd>x</dd></dl></dd><dt>b. </dt><dd>zwei</dd></dl></div></article>';
    const ex = extrahiereArtikel(html, '1')!;
    expect(JSON.stringify(ex)).not.toContain('notiz');
    expect(JSON.stringify(ex)).not.toContain('einzug');
    expect(JSON.stringify(ex)).toContain('eins');
  });
});

describe('bloeckeAusItems: `einzug` trägt die Ebene der Zeile (Render-Hinweis für Einrückung und Zitat-Kette)', () => {
  const n = (text: string, tiefe?: number) => ({ marke: '', text, notiz: true as const, ...(tiefe ? { tiefe } : {}) });
  it('Zeile auf Ebene 1 (in einer Unterliste) trägt einzug 1, auch mit eigener Unterliste (Lead + Unterliste = ein Block)', () => {
    const b = bloeckeAusItems([
      { marke: '2.4.2', text: 'Angaben:' },
      { marke: 'd', text: 'D', tiefe: 1 },
      n('Zeile:', 1),
      { marke: '–', text: 'x', tiefe: 2 },
      { marke: 'e', text: 'E', tiefe: 1 },
    ]);
    expect(b.map((x) => x.einzug)).toEqual([undefined, 1, undefined]);
    expect(b[1]).toEqual({ absatz: null, text: 'Zeile:', items: [{ marke: '–', text: 'x', tiefe: 2 }], einzug: 1 });
  });
  it('die Extraktion setzt einzug an Notiz-Blöcken und nirgends sonst; sha-neutral (kein Textbestandteil)', () => {
    const ex = liste(AVO_B7_B10);
    const mit = ex.bloecke.filter((b) => b.einzug !== undefined);
    expect(mit).toHaveLength(1);
    expect(mit[0].text).toMatch(/^Sämtliche Sachschäden \(soweit sie nicht unter die Zweige B3, B4, B5, B6 oder B7/);
    expect(mit[0].einzug).toBe(0);
  });
});

// FZA SR 0.142.112.681 Anh. II Nr. 3 (ELI cc/2002/243, Konsolidierung 20201215, Filestore-HTML, abgerufen 2.10.2026;
// wörtlich, i)–v) auf i) und ii) gekürzt): zwei Notizen mit/ohne Unterliste um den Punkt b).
// «Als Familienangehörige gelten …» ist eine Notiz OHNE Unterliste; der Items-Block b) danach darf NICHT an sie
// gehängt werden (anhang.ts: Anhängen nur der ERSTEN Item-Gruppe an den Einleitungs-Absatz, k === 0). Gegenprüfung
// 2.10.2026, Befund 3: ohne diese Bedingung blieb jeder Test grün, b) hing aber unter «Als Familienangehörige …».
const FZA_ANH_II_3 =
  '<dl class="man-space-after-0"><dt class="man-space-before-4 man-space-before-2">a) </dt><dd class="man-space-before-4 man-space-before-2">Den schweizerischen Rechtsvorschriften über die Krankenversicherungspflicht unterliegen die nachstehend genannten Personen, die nicht in der Schweiz wohnen:<dl class="man-space-after-0"><dt class="man-space-before-2">i) </dt><dd class="man-space-before-2">die Personen, die nach Titel II der Verordnung den schweizerischen Rechtsvorschriften unterliegen;</dd><dt class="man-space-before-2">ii) </dt><dd class="man-space-before-2">die Personen, für die nach den Artikeln 24, 25 und 26 der Verordnung die Schweiz die Kosten für Leistungen trägt;</dd></dl></dd>' +
  '<dt class="man-space-before-4"></dt><dd class="man-space-before-4">Als Familienangehörige gelten dabei diejenigen Personen, die nach den Rechtsvorschriften des Wohnstaates als Familienangehörige anzusehen sind.</dd>' +
  '<dt class="man-space-before-4">b) </dt><dd class="man-space-before-4">Die in Buchstabe a genannten Personen können auf Antrag von der Versicherungspflicht befreit werden, wenn sie in einem der folgenden Staaten wohnen und nachweisen, dass sie dort für den Krankheitsfall gedeckt sind: Deutschland, Frankreich, Italien, Österreich und – was die unter Buchstabe a Ziffern iv und v genannten Personen angeht – Finnland und – was die unter Buchstabe a Ziffer ii genannten Personen angeht – Portugal.</dd>' +
  '<dt class="man-space-before-4 man-space-before-2"></dt><dd class="man-space-before-4 man-space-before-2">Dieser Antrag:<dl class="man-space-after-0"><dt class="man-space-before-2">aa) </dt><dd class="man-space-before-2">ist innerhalb von drei Monaten nach Entstehung der Versicherungspflicht in der Schweiz zu stellen; wird in begründeten Fällen der Antrag nach diesem Zeitraum gestellt, so wird die Befreiung ab dem Zeitpunkt der Entstehung der Versicherungspflicht wirksam;</dd><dt class="man-space-before-2">bb) </dt><dd class="man-space-before-2">schliesst sämtliche im selben Staat wohnenden Familienangehörigen ein.</dd></dl></dd></dl>';

describe('P4/Befund 3: Notiz ohne Unterliste nimmt den folgenden Items-Block NICHT auf (FZA Anh. II Nr. 3)', () => {
  const ex = liste(FZA_ANH_II_3, '<p class="absatz man-space-before-4">3.&nbsp;&nbsp;Versicherungspflicht in der schweizerischen Krankenversicherung und mögliche Befreiungen:</p>');
  const famBlock = ex.bloecke.find((b) => b.text.startsWith('Als Familienangehörige gelten dabei'))!;
  it('«Als Familienangehörige …» bleibt ein reiner Text-Block (keine Items, Ebene 0)', () => {
    expect(famBlock.items).toBeUndefined();
    expect(famBlock.einzug).toBe(0);
  });
  it('b) steht in einem EIGENEN Items-Block hinter der Notiz, nicht darunter', () => {
    const i = ex.bloecke.indexOf(famBlock);
    expect(ex.bloecke[i + 1].text).toBe('');
    expect(ex.bloecke[i + 1].items!.map((x) => x.marke)).toEqual(['b']);
    expect(itemsVon(ex).map((x) => x.marke)).toEqual(['a', 'i', 'ii', 'b', 'aa', 'bb']);
  });
  it('«Dieser Antrag:» führt aa)/bb) auf Ebene 1 unter b); Lesefolge in Quellordnung', () => {
    const antrag = ex.bloecke.find((b) => b.text === 'Dieser Antrag:')!;
    expect(antrag.items!.map((x) => `${x.marke}/${x.tiefe}`)).toEqual(['aa/1', 'bb/1']);
    expect(lesefolge(ex).map((x) => x.split(' ').slice(0, 2).join(' '))).toEqual([
      '3. Versicherungspflicht', 'a Den', '.i die', '.ii die', 'Als Familienangehörige', 'b Die', 'Dieser Antrag:', '.aa ist', '.bb schliesst',
    ]);
  });
});
