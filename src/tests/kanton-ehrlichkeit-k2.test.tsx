/**
 * W2·13-KANTONE · K-2 — §8-Ehrlichkeit im Kanton-Reader (Paket B).
 *
 * Vier Zusagen, die ohne Test still zurückfallen — und je eine gemessene
 * Tatsache, die sie TRÄGT (§7: verifizieren, nicht vertrauen). Bricht eine
 * dieser Tatsachen (Kanton-Currency kommt, Systematik vollständig, VD-Stand
 * nachgeführt), muss der Wortlaut BEWUSST neu bewertet werden — darum stehen
 * die Befunde hier als eigene Erwartungen und nicht bloss im Kommentar.
 *
 *  B1  Kantonserlass OHNE Currency-Beleg zeigt die zweite Stufe des
 *      Standausweises: «Geltung ungeprüft». Vorher zeigte er GAR KEINEN
 *      Geltungs-Status — der Nutzer las eine Stand-Zeile und konnte nicht
 *      wissen, dass sie nie gegen die amtliche Sammlung geprüft wurde.
 *  B2  Die Panel-Leerzustände nennen bei `ebene='kanton'` die WAHRE Ursache
 *      (Abdeckung), statt eine Bestandsaussage über den Erlass zu machen.
 *  B3  Leerer `stand` erzeugt «Stand unbekannt» statt einer stillen Auslassung.
 *  B4  Ein Kanton ohne amtlichen Systematik-Baum sagt, dass die Systematik noch
 *      folgt — «Nicht systematisiert» allein liest sich wie eine Eigenschaft
 *      des Kantons, nicht wie eine Lücke bei uns.
 *
 * Reine SSR-Renders, kein Browser: geprüft wird Wortlaut und Weiche, nicht
 * Layout.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ErlassLeserKopf } from '../pages/gesetz-leser/parts/ErlassLeserKopf';
import { GELTUNG_UNGEPRUEFT_SATZ, STAND_UNBEKANNT } from '../lib/normtext/erlassKopfText';
import { PanelEntscheide } from '../pages/gesetz-leser/v3/PanelEntscheide';
import { PanelMaterialien } from '../pages/gesetz-leser/v3/PanelMaterialien';
import { PanelErlaeuterungen } from '../pages/gesetz-leser/v3/PanelErlaeuterungen';
import { KantonSystematik } from '../pages/gesetze-teile/KantonSystematik';
import type { BrowseErlass } from '../lib/normtext/browse-typen';
import type { CurrencyEintrag } from '../lib/normtext/browse';
import type { KantonSystematik as KantonSystematikBaum } from '../lib/normtext/systematik';

const PUB = join(process.cwd(), 'public');
const erlasse: BrowseErlass[] = JSON.parse(
  readFileSync(join(PUB, 'normtext/register.json'), 'utf8'),
).erlasse;
const currencyDatei = JSON.parse(readFileSync(join(PUB, 'normtext/currency.json'), 'utf8'));
const SYS_BAUM: Record<string, KantonSystematikBaum> = JSON.parse(
  readFileSync(join(PUB, 'normtext/kanton-systematik.json'), 'utf8'),
);

const bund = erlasse.find((e) => e.ebene === 'bund' && e.sr && !e.aufgehoben)!;
const kantonal = erlasse.find((e) => e.ebene === 'kanton' && e.status === 'snapshot')!;
const currency: CurrencyEintrag = { geprueftAm: '2026-08-14' };

function kopf(props: Partial<Parameters<typeof ErlassLeserKopf>[0]> = {}) {
  return renderToString(
    <ErlassLeserKopf
      erlass={kantonal} overline="Kanton" artikelAnzahl={12} bestimmungsWort="Paragraphen"
      hinweis="Kopie des amtlichen Texts — massgeblich ist die amtliche Fassung" {...props}
    />,
  );
}

// ─── Die gemessenen Tatsachen, auf denen die vier Wortlaute stehen ───────────
describe('K-2 · Befunde (§7) — die Grundlage der Wortlaute, nicht nur ihr Anlass', () => {
  it('kein einziger kantonaler Erlass trägt einen Currency-Beleg', () => {
    const belegt = new Set(Object.keys(currencyDatei.erlasse ?? currencyDatei));
    const kant = erlasse.filter((e) => e.ebene === 'kanton');
    expect(kant.length).toBeGreaterThan(0);
    expect(
      kant.filter((e) => belegt.has(e.key)).length,
      'Kanton-Currency ist da → «Geltung ungeprüft» neu bewerten',
    ).toBe(0);
  });

  it('nicht jeder Kanton liefert einen amtlichen Systematik-Baum', () => {
    const mit = Object.keys(SYS_BAUM).length;
    expect(mit).toBeGreaterThan(0);
    expect(mit, 'alle 26 hinterlegt → B4-Hinweis streichen').toBeLessThan(26);
  });

  it('es gibt Erlasse ganz ohne `stand` — sonst wäre B3 ein Tor ohne Fall', () => {
    expect(erlasse.filter((e) => !e.stand).length).toBeGreaterThan(0);
  });
});

// ─── B1 · Zweite Stufe des Standausweises ───────────────────────────────────
describe('B1/F26 — «Geltung ungeprüft» beim Kantonserlass ohne Beleg', () => {
  it('der Satz sagt genau das und behauptet nichts darüber hinaus (§8)', () => {
    expect(GELTUNG_UNGEPRUEFT_SATZ).toContain('Geltung ungeprüft');
    expect(GELTUNG_UNGEPRUEFT_SATZ).not.toMatch(/verifiziert|gegengeprüft|garantiert|aktuell\b/);
    // Kein Datum: die zweite Stufe hat gerade keines (§8, nichts erfinden).
    expect(GELTUNG_UNGEPRUEFT_SATZ).not.toMatch(/\d/);
  });

  it('Kanton ohne Currency: die Zeile steht', () => {
    expect(kopf()).toContain(GELTUNG_UNGEPRUEFT_SATZ);
  });

  it('BUND ohne Currency bleibt unverändert — Bund-Verhalten byte-identisch', () => {
    const html = renderToString(
      <ErlassLeserKopf erlass={bund} overline="Bund" artikelAnzahl={12} hinweis="H" />,
    );
    expect(html).not.toContain(GELTUNG_UNGEPRUEFT_SATZ);
  });

  it('MIT Currency-Beleg tritt die zweite Stufe zurück (die erste ist stärker)', () => {
    const html = kopf({ currency });
    expect(html).toContain('gegen Fedlex-Konsolidierung geprüft am 14.08.2026 (maschinell)');
    expect(html).not.toContain(GELTUNG_UNGEPRUEFT_SATZ);
  });

  it('aufgehobener Kantonserlass: die Aufhebung bleibt DIE Aussage', () => {
    const html = kopf({ erlass: { ...kantonal, aufgehoben: { seit: '2026-03-01' } } });
    expect(html).toContain('lc-notice-danger');
    expect(html).not.toContain(GELTUNG_UNGEPRUEFT_SATZ);
  });
});

// ─── B3 · «Stand unbekannt» statt stiller Auslassung ─────────────────────────
describe('B3/F27 — leerer `stand` wird benannt, nicht weggelassen', () => {
  it('ohne Stand steht «Stand unbekannt»', () => {
    expect(STAND_UNBEKANNT).toBe('Stand unbekannt');
    const html = kopf({ erlass: { ...kantonal, stand: '' } });
    expect(html).toContain(STAND_UNBEKANNT);
  });

  it('mit Stand bleibt das Datum, ohne Zusatzwort', () => {
    const html = kopf({ erlass: { ...kantonal, stand: '2026-01-01' } });
    expect(html).toContain('01.01.2026');
    expect(html).not.toContain(STAND_UNBEKANNT);
  });

  it('kein leerer Trenner, wenn nur die zwei Ersatz-Segmente stehen', () => {
    const html = kopf({ erlass: { ...kantonal, sr: null, stand: '', inkraftSeit: undefined } });
    expect(html).not.toContain('· ·');
    expect(html).not.toContain('>· <');
  });
});

// ─── B2 · Kanton-Hinweis in den drei v3-Panels ──────────────────────────────
const panelBasis = {
  kanten: [] as never[], aktArtikel: 'art-5', revisionShard: null,
  normZitat: '§ 5 BS-111.100', artikelLabel: '§ 5', geladen: true,
  bestimmungsWort: 'Paragraphen' as const,
  klassen: ['bger'] as never, kantone: [] as never, kantoneVerfuegbar: [] as never,
  klassenImErlass: {}, histogramm: { balken: [], ohneJahr: 0 },
  bereich: { von: '', bis: '' },
  onKlassen: () => {}, onKantone: () => {}, onBereich: () => {},
};

function entscheide(ebene: 'bund' | 'kanton') {
  return renderToString(<MemoryRouter><PanelEntscheide {...panelBasis} ebene={ebene} /></MemoryRouter>);
}

describe('B2/F37 — der Leerzustand nennt bei Kanton die Abdeckungs-Lücke', () => {
  it('Entscheide · Kanton: die Bestandsaussage steht NICHT allein da', () => {
    const html = entscheide('kanton');
    expect(html).toContain('kein Entscheid der eingeschalteten Instanzen erfasst');
    expect(html).toContain('Kantonale Erlasse sind erst teilweise verknüpft');
  });

  it('Entscheide · Bund: unverändert, kein Kanton-Zusatz', () => {
    const html = entscheide('bund');
    expect(html).toContain('kein Entscheid der eingeschalteten Instanzen erfasst');
    expect(html).not.toContain('Kantonale Erlasse sind erst teilweise verknüpft');
  });

  // §6.3-DEKLARATION (S6, 23.9.2026, Befund M-3/B-4): die Sammlung führt seit
  // dem BS-Import die Grossratsgeschäfte Basel-Stadt (`register.json`, 117
  // Einträge) — «nur Bundeserlasse» war damit falsch. Der Zusatz nennt jetzt
  // die tatsächliche Abdeckung; die Zusage «Kanton nennt die Lücke, Bund
  // nicht» bleibt dieselbe. Reiter «Materialien» heisst seither NUR
  // Gesetzgebung, darum «Gesetzgebungsmaterial».
  it('Materialien · Kanton nennt die Abdeckung der Sammlung', () => {
    const leer = { fertig: true as const, wert: { botschaften: [], vernehmlassungen: [], kanton: [], erzeugt: null } };
    const kant = renderToString(<PanelMaterialien stand={leer} ebene="kanton" />);
    const bundHtml = renderToString(<PanelMaterialien stand={leer} ebene="bund" />);
    expect(kant).toContain('kein Gesetzgebungsmaterial erfasst');
    expect(kant).toContain('nur für Basel-Stadt');
    expect(bundHtml).not.toContain('nur für Basel-Stadt');
  });

  // §6.3-DEKLARATION (S6, 23.9.2026, Entscheid David AN-11): der Reiter
  // «Anwendung» ist in «Erläuterungen» und «Werkzeuge» geteilt; die
  // Behörden-Ressourcen und ihr Kanton-Zusatz stehen im Reiter
  // «Erläuterungen». Zusage unverändert: Kanton nennt die Bundes-Beschränkung.
  it('Erläuterungen · Kanton nennt die Bundes-Beschränkung der Behörden-Ressourcen', () => {
    const leer = { fertig: true as const, wert: { liste: [], erzeugt: '2026-09-18' } };
    const kant = renderToString(<MemoryRouter><PanelErlaeuterungen stand={leer} ebene="kanton" /></MemoryRouter>);
    const bundHtml = renderToString(<MemoryRouter><PanelErlaeuterungen stand={leer} ebene="bund" /></MemoryRouter>);
    expect(kant).toContain('nur zu Bundeserlassen');
    expect(bundHtml).not.toContain('nur zu Bundeserlassen');
  });
});

// ─── B4 · Systematik-Hinweis für Kantone ohne Baum ──────────────────────────
describe('B4/F43 — Kanton ohne Systematik-Baum sagt, dass sie noch folgt', () => {
  const ohneBaum = erlasse.filter((e) => e.kanton && !SYS_BAUM[e.kanton]).slice(0, 3);
  const mitBaum = erlasse.filter((e) => e.kanton && SYS_BAUM[e.kanton]);

  function sicht(liste: BrowseErlass[], sys?: KantonSystematikBaum) {
    return renderToString(<MemoryRouter><KantonSystematik erlasse={liste} sys={sys} /></MemoryRouter>);
  }

  it('der Fall existiert überhaupt (sonst ist der Hinweis tot)', () => {
    expect(ohneBaum.length).toBeGreaterThan(0);
    expect(mitBaum.length).toBeGreaterThan(0);
  });

  it('ohne Baum: «Nicht systematisiert» PLUS die ehrliche Ursache', () => {
    const html = sicht(ohneBaum, undefined);
    expect(html).toContain('Nicht systematisiert');
    expect(html).toContain('amtliche Systematik dieses Kantons ist noch nicht hinterlegt');
    // §8: keine Zusage mit Datum. Geprüft wird die HINWEIS-ZEILE, nicht das
    // Dokument — die Erlass-Zeilen darunter tragen legitim Jahreszahlen
    // (Stand-Jahr), Substring-Präsenz wäre hier der falsche Massstab (§7).
    const zeile = html.match(/<p data-kanton-systematik-offen[^>]*>(.*?)<\/p>/s)?.[1] ?? '';
    expect(zeile).not.toBe('');
    expect(zeile).not.toMatch(/\d/);
  });

  it('mit Baum: kein Hinweis — dort ist nichts offen', () => {
    const kanton = mitBaum[0]!.kanton!;
    const html = sicht(mitBaum.filter((e) => e.kanton === kanton).slice(0, 40), SYS_BAUM[kanton]);
    expect(html).not.toContain('amtliche Systematik dieses Kantons ist noch nicht hinterlegt');
  });
});
