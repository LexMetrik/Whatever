import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { SeitenTitel } from '../components/ui/SeitenTitel';
import { PaneProvider } from '../components/layout/PaneKontext';
import { alleTsx, liesOhneKommentare, pruefeAusnahmen, rel } from './appDateien';

// ─── A-1 (W2·19-DESIGN-KONSISTENZ, 31.8.2026) · EIN SEITENTITEL ─────────────
//
// Die H1 der Seite war an vier Stellen von Hand nachgebaut und trug überall die
// VIEWPORT-Kaskade `text-h2 sm:text-h1`. Im Split-View ist der Viewport die
// falsche Zahl (Herleitung in `components/ui/SeitenTitel.tsx` und in
// `pages/gesetz-leser/v3/kopfStufen.ts` Z. 17/18).
//
// ROT ZU BEKOMMEN (§6.7, am 31.8.2026 vor dem Bau gesehen):
//  · den `usePaneKlasse`-Aufruf in `SeitenTitel` durch die feste Viewport-Kette
//    ersetzen → «im Pane container-basiert» fällt;
//  · in einer der vier Konsumenten-Dateien die H1 wieder von Hand schreiben →
//    die Quellensonde unten fällt (sie war vor dem Bau in ALLEN vier rot).

const KEIN_PANE = { imPane: false as const, rolle: 'primaer' as const, wurzel: null, overlayWurzel: null };
const IM_PANE = { imPane: true as const, rolle: 'sekundaer' as const, wurzel: null, overlayWurzel: null };

describe('A-1 — SeitenTitel: EINE Grössen-Kaskade, kontextabhängig gemessen', () => {
  it('ausserhalb eines Panes: zeichengleich zum Vorzustand (Prerender unberührt)', () => {
    const html = renderToString(<SeitenTitel>Streitwert</SeitenTitel>);
    expect(html).toContain('class="text-h2 sm:text-h1 font-display font-semibold text-ink-900"');
  });

  it('im Pane: die Kaskade misst die PANE-Breite, nicht den Viewport', () => {
    const html = renderToString(
      <PaneProvider value={IM_PANE}><SeitenTitel>Streitwert</SeitenTitel></PaneProvider>,
    );
    expect(html).toContain('@xl/pane:text-h1');
    expect(html, 'der Viewport-Zweig steht im Pane noch da').not.toContain('sm:text-h1');
  });

  it('Zwei-Stimmen-Regel (§e): `serif` ersetzt die Display-Stimme, nichts sonst', () => {
    const html = renderToString(
      <PaneProvider value={KEIN_PANE}>
        <SeitenTitel stimme="serif" className="min-h-titel-2z">OR</SeitenTitel>
      </PaneProvider>,
    );
    expect(html).toContain('class="text-h2 sm:text-h1 font-serif font-semibold text-ink-900 min-h-titel-2z"');
    expect(html).not.toContain('font-display');
  });

  it('POSITIV-SONDE: es ist eine <h1> — sonst prüfte alles oben nur eine Klassenzeile', () => {
    expect(renderToString(<SeitenTitel>X</SeitenTitel>)).toMatch(/^<h1 /);
  });
});

// Die vier Flächen, die den Titel bis 31.8.2026 je einzeln nachbauten. Der
// `EntscheidLeser` fehlte hier zunächst bewusst: er zog im Paket BAU-4
// DERSELBEN Runde nach und war bis dahin der ausgewiesene Rest (Fahrplan §3,
// Befund A-2/A-5/B-5). Seit BAU-4 (31.8.2026) steht er mit — und zwar mit ZWEI
// H1: dem Kopf-Titel und seinem Zwilling im Lesemodus-Overlay, beide in der
// Mono-Stimme (`num`), weil der Titel dort die Zitierung selbst ist.
// DEKLARIERTE ANPASSUNG (W2·29-WERKBANK-VORLAGEN V1, 23.9.2026, §6.3): der
// Vorlagen-Kopf ist aus `vorlagen/wizard.tsx` in den geteilten
// `layout/WerkzeugKopf` gezogen — der Konsument des Bausteins ist jetzt dieser
// Kopf (die Rechner folgen). Umfang und Assertion unverändert.
const KONSUMENTEN = [
  'src/components/layout/SeitenKopf.tsx',
  'src/components/layout/RechnerKopf.tsx',
  'src/components/layout/WerkzeugKopf.tsx',
  'src/pages/gesetz-leser/parts/ErlassLeserKopf.tsx',
  'src/pages/EntscheidLeser.tsx',
  'src/components/rechtsprechung/LesemodusOverlay.tsx',
];

describe('A-1 — keine zweite Titel-Anatomie mehr (§5/§10)', () => {
  it('POSITIV-SONDE: alle Konsumenten beziehen den Baustein', () => {
    for (const datei of KONSUMENTEN) {
      expect(readFileSync(datei, 'utf8'), `${datei} importiert SeitenTitel nicht`)
        .toMatch(/import \{ SeitenTitel \} from/);
    }
  });

  // ─── R3-α-WURZEL (31.8.2026, §17/§6.7) ────────────────────────────────────
  //
  // Hier stand `/<h1[^>]*text-h2/` gegen sechs gelistete Dateien. Beides war zu
  // eng, und beides zusammen ergab ein Vakuum: der Ausdruck erkannte nur die
  // KASKADE (`text-h2 sm:text-h1`), die Liste nur die schon migrierten Flächen.
  // Gemessen am 31.8.2026 standen drei Vorlagen-Seiten mit fester `text-h1`-H1
  // ausserhalb von beidem (VorlageKuendigungVermieter, VorlageKapitalerhoehung,
  // VorlageGmbhGruendung) — der Wächter war grün. Jetzt: KEIN `<h1` in der App
  // ausser im Baustein und in der einen begründeten Ausnahme.
  // DEKLARIERTE ANPASSUNG (W2·24-DESIGN-IDENTITAET R10, 6.9.2026, §6.3): die
  // Ausnahme ist DIESELBE und trägt dieselbe Begründung — nur ist aus
  // `start/Hero` (Titelblatt-Zeile des Satzspiegels) der `start/SuchBlock`
  // (erste Ebene des Pults) geworden. Umfang und Assertion unverändert: genau
  // eine handgebaute <h1> in der App, und die trägt ihre Begründung am Fundort.
  const AUSNAHMEN = [{
    datei: 'components/start/SuchBlock.tsx',
    begruendung: 'A-1-AUSNAHME (R3-α, 31.8.2026)',
  }] as const;

  it('jede Ausnahme trägt ihre Begründung am Fundort', () => {
    expect(() => pruefeAusnahmen(AUSNAHMEN)).not.toThrow();
  });

  it('App-weit: die H1 zeichnet nur der Baustein', () => {
    const erlaubt = pruefeAusnahmen(AUSNAHMEN);
    const funde = alleTsx()
      .filter((d) => rel(d) !== 'components/ui/SeitenTitel.tsx' && !erlaubt.has(rel(d)))
      .filter((d) => /<h1[\s>]/.test(liesOhneKommentare(d)))
      .map(rel);
    expect(funde, 'handgebaute <h1> statt <SeitenTitel>').toEqual([]);
  });

  it('NEGATIV-KONTROLLE: der Ausdruck findet BEIDE Vorher-Formen', () => {
    // (a) die Kaskade, die der alte Ausdruck sah; (b) die feste `text-h1`, an
    // der er vorbeiging — genau die Lücke, die B3-6 gemeldet hat.
    for (const vorher of [
      '<h1 className="text-h2 sm:text-h1 font-display font-semibold text-ink-900">X</h1>',
      '<h1 className="text-h1 font-display font-semibold text-ink-900">GmbH-Gründungsunterlagen</h1>',
    ]) {
      expect(/<h1[\s>]/.test(vorher), vorher).toBe(true);
    }
    expect(/<h1[^>]*text-h2/.test('<h1 className="text-h1 font-display font-semibold text-ink-900">X</h1>'),
      'der ALTE Ausdruck ging an der festen text-h1 vorbei — das war die Lücke').toBe(false);
  });
});
