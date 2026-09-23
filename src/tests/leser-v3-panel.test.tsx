import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  OEFFNER_NAME, OEFFNER_WORT, PANEL_REITER, gruppiereKanten, normZitat, panelBezug, reiterTitel,
} from '../pages/gesetz-leser/v3/panelModell';
import { panelForm } from '../pages/gesetz-leser/v3/kopfStufen';
import { PanelSachgebiet } from '../pages/gesetz-leser/v3/PanelSachgebiet';
import { belegung } from '../pages/gesetz-leser/parts/leserTastaturBelegung';
import type { Bezug } from '../lib/rechtsprechung/bezuege';
import type { BezugStatus } from '../lib/verzahnung/facetten';

// ─── Die rechnenden Zusagen des H3-Panels, ohne Browser (§3/§6) ──────────────
//
// Was hier steht, steht hier, weil es eine AUSSAGE ist und keine Optik: was am
// Öffner geschrieben wird, in welcher Reihenfolge die Reiter stehen, wie die
// Kanten gruppiert werden, ab welcher Breite das Panel andockt und wann der
// vierte Filter gar nicht existiert. Der Rest (Klick, Fokus, Layout) gehört in
// die vier e2e-Specs.

function kante(key: string, status: BezugStatus, datum = '2022-03-14'): Bezug {
  return {
    key,
    zitierung: key.toUpperCase(),
    regesteKurz: null,
    datum,
    gewicht: null,
    facetten: { status, ebene: status === 'kantonal' ? 'kanton' : 'bund', kanton: status === 'kantonal' ? 'BS' : 'CH', gericht: 'bger', quelltyp: 'entscheid' },
  } as unknown as Bezug;
}

// ── §6.3-DEKLARATION (D35-F2, Entscheid David 7.9.2026) · DER KOPF ZÄHLT NICHT
// MEHR ──────────────────────────────────────────────────────────────────────
// Hier standen vier `describe`-Blöcke: `oeffnerLabelKompakt` (die Zahl-Marke),
// `oeffnerName(anzahl, artikel)` und `zaehlerAttribut` (dieselbe Wahrheit
// maschinell) sowie weiter unten `artikelZahl` (die Bezugsgrösse aus der
// Zähl-Datei). Sie prüften eine Zusage, die N1 am 7.9.2026 eingelöst hat: EINE
// Zahl je Artikel, an Kopf und Zeile dieselbe. Die Zusage ist mit Variante A
// (D35-F2) überholt, nicht verletzt — der Kopf nennt GAR KEINE Artikel-Zahl
// mehr, die Zahl steht an genau einem Ort. Vier Sonden auf gestrichene
// Funktionen sind keine Sonden mehr; sie fallen mit ihnen (§17-Gegengewicht).
//
// WAS AN IHRE STELLE TRITT: der Fall unten hält die neue, engere Zusage fest —
// das Wort ist «Erlass», der Accessible Name nennt die Reiter des Blattes und
// KEINE Zahl. Dass im Browser genau EIN Ort je Artikel eine Entscheid-Zahl
// nennt, misst `e2e/w224-d35-f2-kopf.e2e.ts` (a); die §8-Schranke «keine Zahl,
// die wir nicht haben» lebt unverändert an der Funktionszeile weiter
// (`parts/Funktionszeile.tsx`: `anzahl > 0` filtert die Rubrik heraus).
describe('OEFFNER_WORT / OEFFNER_NAME — der Kopf-Griff nennt den ERLASS', () => {
  // §6.3-DEKLARATION (S6-W1a, 23.9.2026): «Erlass» → «Erlass-Blatt» — EIN Name
  // für Öffner, Kopf, Tastenhilfe und Funktionszeile (C-1/D-5, gewollt).
  it('das Wort am Knopf ist unveränderlich und heisst «Erlass-Blatt»', () => {
    expect(OEFFNER_WORT).toBe('Erlass-Blatt');
  });

  it('der Accessible Name nennt die vier Reiter des Blattes', () => {
    for (const reiter of PANEL_REITER) {
      expect(OEFFNER_NAME, `Reiter «${reiter.label}» fehlt im Namen`).toContain(reiter.label);
    }
  });

  // DIE EIGENTLICHE ZUSAGE VON D35-F2, an der Stelle, an der sie entsteht: der
  // Name des Kopf-Griffs enthält keine Ziffer. Rot zu bekommen: in
  // `panelModell` eine Zahl an `OEFFNER_NAME` hängen.
  it('er behauptet keine Zahl — die steht an der Funktionszeile', () => {
    expect(OEFFNER_NAME).not.toMatch(/\d/);
    expect(OEFFNER_WORT).not.toMatch(/\d/);
  });
});

describe('normZitat — zeichengleich mit dem Kurz-Zitat des Kerns', () => {
  it('Label + Kürzel, in dieser Reihenfolge, mit einem Leerzeichen', () => {
    expect(normZitat('Art. 429', 'StPO')).toBe('Art. 429 StPO');
  });

  it('Bereichs-Label bleibt unangetastet (der Kern liefert es fertig)', () => {
    expect(normZitat('Art. 226a–226d', 'ZGB')).toBe('Art. 226a–226d ZGB');
  });

  it('ohne Leseposition steht das Kürzel allein — nie ein erfundener Artikel', () => {
    expect(normZitat(null, 'StPO')).toBe('StPO');
  });
});

describe('panelBezug — ohne Leseposition gilt der erste Artikel, benannt', () => {
  const erster = { artikelLabel: 'Art. 1', artikel: '1' };

  it('mit Leseposition gewinnt sie', () => {
    expect(panelBezug('Art. 429', '429', erster)).toEqual({ label: 'Art. 429', token: '429' });
  });

  it('ohne Leseposition der ERSTE Artikel — und sein Label wird mitgegeben (§8)', () => {
    // Der Befund @390: ohne diesen Fallback stand «kein Entscheid erfasst» an
    // einem Erlass mit 1443 Verknüpfungen.
    expect(panelBezug(null, null, erster)).toEqual({ label: 'Art. 1', token: '1' });
  });

  it('Bereichs-Artikel bekommen das Kern-Label (Halbgeviert), nicht das Rohlabel', () => {
    expect(panelBezug(null, null, { artikelLabel: 'Art. 226a226d', artikel: '226_a_226_d' }))
      .toEqual({ label: 'Art. 226a–226d', token: '226_a_226_d' });
  });

  it('ohne Artikel überhaupt (leerer Erlass) bleibt beides null', () => {
    expect(panelBezug(null, null, undefined)).toEqual({ label: null, token: null });
  });

  it('halbe Leseposition zählt nicht als Leseposition', () => {
    // Label ohne Token (oder umgekehrt) käme nur aus einem Zwischenzustand; darauf
    // eine Kanten-Abfrage zu bauen ergäbe eine Zahl ohne Bezug.
    expect(panelBezug('Art. 429', null, erster).token).toBe('1');
  });
});

describe('gruppiereKanten — Rangordnung strukturell, nie nach Zähler', () => {
  it('ordnet die Klassen nach STATUS_RANG, unabhängig von der Eingabe-Folge', () => {
    const gruppen = gruppiereKanten([kante('a', 'kantonal'), kante('b', 'bge'), kante('c', 'bger')]);
    expect(gruppen.map(([s]) => s)).toEqual(['bge', 'bger', 'kantonal']);
  });

  it('erhält INNERHALB der Klasse die Shard-Ordnung (keine zweite Sortier-Wahrheit)', () => {
    const gruppen = gruppiereKanten([kante('neu', 'bge', '2024-01-01'), kante('alt', 'bge', '1990-01-01')]);
    expect(gruppen[0]?.[1].map((b) => b.key)).toEqual(['neu', 'alt']);
  });

  it('Klassen ohne Treffer erscheinen gar nicht (kein leerer Gruppenkopf)', () => {
    expect(gruppiereKanten([kante('a', 'bge')]).map(([s]) => s)).toEqual(['bge']);
    expect(gruppiereKanten([])).toEqual([]);
  });
});

describe('PANEL_REITER — eine Quelle für Ordnung und Beschriftung', () => {
  // W2·7-VZUI (31.8.2026): der vierte Reiter «Anwendung» ist dazugekommen — die
  // Behörden-Ressourcen und die Werkzeuge hatten seit H3 keinen Ort mehr
  // (Herleitung im Kopf von `PanelAnwendung.tsx`). Er steht HINTEN: die Reihe
  // bleibt damit die Frage-Chronologie, und der Pfeiltasten-Weg der drei
  // bestehenden Reiter ist unverändert.
  // §6.3-DEKLARATION (S6, 23.9.2026): gewollte Produktänderung — Entscheid
  // David 23.9.2026 (AN-11): «Anwendung» wird in «Erläuterungen» und
  // «Werkzeuge» geteilt, fünf Reiter. Die ersten drei und ihr Pfeiltasten-Weg
  // bleiben unverändert; die Zusage «Ordnung = Frage-Chronologie» gilt weiter.
  it('genau fünf, in der Reihenfolge der Fragen am Artikel', () => {
    expect(PANEL_REITER.map((r) => r.id)).toEqual(['entscheide', 'aenderungen', 'materialien', 'erlaeuterungen', 'werkzeuge']);
  });

  it('jeder Reiter trägt Label UND erklärenden Titel (kein nackter Kurzname)', () => {
    for (const r of PANEL_REITER) {
      expect(r.label.length, r.id).toBeGreaterThan(2);
      expect(reiterTitel(r.id, 'Artikel').length, r.id).toBeGreaterThan(10);
    }
  });

  // §5: `reiterTitel` fällt am Ende in einen `return` ohne Bedingung. Ein fünfter
  // Reiter, dessen Titel jemand zu ergänzen vergisst, bekäme damit STILL den
  // Anwendungs-Titel. Der Test hält die Zuordnung Reiter → Titel darum einzeln
  // fest, statt nur ihre Länge zu prüfen.
  it('jeder Reiter hat SEINEN eigenen Titel (kein still geerbter Default)', () => {
    const titel = PANEL_REITER.map((r) => reiterTitel(r.id, 'Artikel'));
    expect(new Set(titel).size, titel.join(' | ')).toBe(PANEL_REITER.length);
    // S6 (deklariert, s. o.): der Anwendungs-Titel ist mit seinem Reiter entfallen.
    expect(reiterTitel('erlaeuterungen', 'Artikel')).toBe('Behördliche Erläuterungen zu diesem Erlass');
    expect(reiterTitel('werkzeuge', 'Artikel')).toBe('Rechner und Vorlagen zu diesem Erlass');
  });

  // C1 (H3-Nachzug): der Titel des Entscheid-Reiters trug «zu diesem Artikel» als
  // Literal — an einem §-Erlass (BS-640.100) schlicht falsch (Ä23-Klasse).
  it('der Entscheid-Reiter nennt die Bestimmung des ERLASSES, nicht «Artikel»', () => {
    expect(reiterTitel('entscheide', 'Artikel')).toBe('Gerichtsentscheide zu diesem Artikel');
    expect(reiterTitel('entscheide', 'Paragraphen')).toBe('Gerichtsentscheide zu diesem Paragraphen');
  });

  it('die beiden ERLASS-weiten Reiter hängen nicht am Zähl-Substantiv', () => {
    for (const wort of ['Artikel', 'Paragraphen'] as const) {
      expect(reiterTitel('aenderungen', wort)).toBe('Änderungserlasse dieses Erlasses');
      expect(reiterTitel('materialien', wort)).toContain('zu diesem Erlass');
    }
  });
});

// ── §6.3-DEKLARATION (D35-F2, 7.9.2026) · `kopfElemente(...).panel` IST WEG ─
// Hier stand «auf `mini` schrumpft der Zähler zum Chip, statt zu verschwinden»
// (H4-II, 17./18.8.2026 — die Antwort auf den NM-2-Blocker: @390 stand im
// Ruhezustand KEIN Öffner in der Kopfzeile, der Weg kostete zwei Taps statt
// einem). Der Befund bleibt in `kopfStufen.ts` stehen (§0 Ziff. 2b); das Feld
// `panel` entschied allein die GESTALT des Zählers, und beide Gestalten gibt es
// seit D35-F2 nicht mehr. Der Griff trägt auf JEDER Breite dasselbe Wort — die
// NM-2-Zusage ist damit stärker eingelöst als vorher, und zwar ohne
// Fallunterscheidung, die eine Sonde bewachen müsste (§17-Gegengewicht).
// Dass im Browser auf jeder Breite genau ein Öffner steht, misst
// `e2e/leser-w224-g.e2e.ts` (G14) an den Griff-Beschriftungen @320/@390.

describe('panelForm — welche Kante das Blatt nimmt', () => {
  it('nur auf der breitesten Stufe UND mit ganzer Seite: rechts angeschlagen (Skizze D)', () => {
    expect(panelForm('voll', true)).toBe('rechts');
  });

  it('jede geteilte Fläche bekommt das Bottom-Sheet — «nie drei vertikale Flächen»', () => {
    expect(panelForm('voll', false)).toBe('unten');
    expect(panelForm('kompakt', false)).toBe('unten');
  });

  it('auf schmalen Stufen unten, auch wenn die Seite ganz zur Verfügung steht (Daumenzone)', () => {
    expect(panelForm('kompakt', true)).toBe('unten');
    expect(panelForm('mini', true)).toBe('unten');
  });
});

describe('PanelSachgebiet — vorgesehen, aber ohne Daten kein Steuerelement', () => {
  it('leere Gebietsliste ⇒ NICHTS im DOM (§13 F4)', () => {
    expect(renderToStaticMarkup(<PanelSachgebiet gebiete={[]} gewaehlt={[]} onGebiete={() => {}} />)).toBe('');
  });

  it('mit Daten ⇒ der Streifen steht fertig da (Positiv-Sonde: der Anschluss trägt)', () => {
    const html = renderToStaticMarkup(
      <PanelSachgebiet gebiete={['Strafrecht', 'Zivilrecht']} gewaehlt={['Strafrecht']} onGebiete={() => {}} />,
    );
    expect(html).toContain('data-v3-panel-sachgebiet');
    expect((html.match(/data-v3-panel-gebiet=/g) ?? []).length).toBe(2);
    // Der gewählte Schalter meldet sich als gedrückt — sonst wäre der Zustand
    // nur eingefärbt und für Screenreader unsichtbar.
    expect(html).toMatch(/aria-pressed="true"[^>]*data-v3-panel-gebiet="Strafrecht"|data-v3-panel-gebiet="Strafrecht"[^>]*aria-pressed="true"/);
  });
});

describe('Tastatur-Belegung — die Hilfe zeigt nur, was auch wirkt', () => {
  it('ohne Panel steht «r» NICHT in der Hilfe (Ist-Hülle)', () => {
    expect(belegung(false).map((b) => b.taste)).not.toContain('r');
  });

  it('mit Panel steht «r» drin, mit seiner Wirkung', () => {
    const r = belegung(true).find((b) => b.taste === 'r');
    // §6.3-DEKLARATION (S6-W1a, 23.9.2026): EIN Name (D-5) und Umschalten (D-8)
    // — bis dahin «Rechtsprechung und Kontext öffnen».
    expect(r?.wirkung).toBe('Erlass-Blatt öffnen oder schliessen');
  });

  it('die bestehenden Tasten bleiben unverändert und in ihrer Reihenfolge', () => {
    expect(belegung(false).map((b) => b.taste)).toEqual(['j', 'k', 't', '?', 'Esc']);
    expect(belegung(true).map((b) => b.taste)).toEqual(['j', 'k', 't', 'r', '?', 'Esc']);
  });
});
