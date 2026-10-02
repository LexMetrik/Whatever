import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { G, suchtext, waechterGuards } from '../../scripts/verweis-inventar-transkription';

// ─── Wächter: Transkription des V-1-Tors ↔ Produktions-Quelltext ────────────
//
// `scripts/check-verweis-inventar.ts` misst, wie der Leser Verweise auflöst.
// Die Erkenner importiert es echt; die INLINE-GUARDS der Entscheidkette leben
// aber in React-internen, nicht exportierten Funktionen
// (`restMitIntern` in NormText.tsx, `etabliertFremdgesetz` in ArtikelBody.tsx)
// und sind im Tor TRANSKRIBIERT. Eine Transkription, die still von ihrem
// Original abdriftet, wäre die schlimmste Sorte Messgerät: sie meldet Ruhe
// über etwas anderes als das, was läuft.
//
// Dieser Test ist die UNABHÄNGIGE Gegenprobe zum Wächter, den das Tor selbst
// fährt: er liest die Guard-Tabelle aus dem Tor-Quelltext (statt sie zu
// importieren — das Tor führt beim Import seinen ganzen Korpus-Lauf aus) und
// prüft jedes Literal zeichengleich gegen die genannte Quelldatei. Ändert
// jemand einen Guard, ohne das Tor nachzuziehen, kippt dieser Test.
//
// Ergänzend: der SHA-256-Anker aus dem committeten Artefakt. Er fängt, was ein
// Literal-Vergleich strukturell NICHT sehen kann — eine geänderte
// Entscheid-REIHENFOLGE in `restMitIntern` bei unveränderten Regex-Literalen.

const TOR = 'scripts/verweis-inventar-transkription.ts';
const ARTEFAKT = 'messwerte/verweis-inventar.json';
const QUELLEN: Record<string, string> = {
  'NormText.tsx': 'src/components/NormText.tsx',
  'ArtikelBody.tsx': 'src/components/normtext/ArtikelBody.tsx',
  // V-3 (W2·20): die Kürzel-KANDIDATEN-Regel entscheidet mit über Link/kein
  // Link, steht aber in der Datenzuleitung des Lesers, nicht in NormText.
  'inhalt-sprung.tsx': 'src/pages/gesetz-leser/inhalt-sprung.tsx',
};

/** Guard-Tabelle der Transkription: (Name, Quelldatei, transkribiertes Literal).
 *  Direkt importiert — das Modul ist frei von Import-Seiteneffekten (der
 *  Korpus-Lauf liegt im Tor). Der frühere Quelltext-Scraper ist damit weg. */
function guards(): { name: string; datei: string; literal: string }[] {
  return Object.entries(G).map(([name, g]) => ({ name, datei: g.datei, literal: g.literal }));
}

describe('V-1 · Verweis-Inventar-Tor: Guard-Transkription', () => {
  it('findet genau so viele Guards, wie das Artefakt deklariert', () => {
    // §6.7 lit. b: ein Wächter, dessen Fundmenge leer laufen kann, ist keiner.
    // Gegengelesen wird gegen die Zahl, die das Tor selbst in die Basislinie
    // geschrieben hat — ein zugefügter oder entfernter Guard verlangt damit
    // eine bewusste Regeneration, statt still an diesem Test vorbeizugehen.
    const artefakt = JSON.parse(readFileSync(ARTEFAKT, 'utf8')) as { _quellen: { guards: number } };
    expect(guards().length).toBe(artefakt._quellen.guards);
    expect(guards().length).toBeGreaterThan(0);
  });

  it('jedes transkribierte Muster steht zeichengleich in seiner Quelldatei', () => {
    // Verglichen wird das MUSTER, nicht die Schreibweise des Literals: ein
    // verhaltensneutraler Umbau («const X = String.raw`…`; new RegExp(X, 'g')»)
    // darf keinen Fehlalarm auslösen, jede Musteränderung dagegen schon.
    // Begründung bei `suchtext()`.
    const abweichungen: string[] = [];
    for (const [name, g] of Object.entries(G)) {
      const pfad = QUELLEN[g.datei];
      expect(pfad, `Unbekannte Quelldatei «${g.datei}» in ${TOR}`).toBeTruthy();
      if (!readFileSync(pfad, 'utf8').includes(suchtext(g))) {
        abweichungen.push(`${name} fehlt in ${pfad}: ${suchtext(g)}`);
      }
    }
    expect(abweichungen).toEqual([]);
  });

  it('deckt sich mit dem Wächter, den das Tor selbst fährt', () => {
    // Zwei Wege, ein Ergebnis: findet der Test etwas, das der Tor-Wächter
    // durchlässt (oder umgekehrt), ist einer von beiden kaputt.
    expect(waechterGuards()).toEqual([]);
  });

  it('deckt die Guards ab, die über Link/kein-Link entscheiden', () => {
    const namen = guards().map((g) => g.name);
    for (const pflicht of [
      'ART_INTERN', 'PARAGRAF_INTERN', 'PARAGRAF_FREMD_GROSS', 'PARAGRAF_FREMD_NAME',
      'M12', 'NORM_REF', 'KUERZEL_KANON',
      'CHAPEAU_DOPPELPUNKT', 'CHAPEAU_BESTIMMUNGEN', 'CHAPEAU_KUERZEL',
      'KANTON_KUERZEL_TOKEN', 'KANTON_KUERZEL_INTERPUNKTION',
      'KANTON_KUERZEL_KANDIDAT', 'KANTON_KUERZEL_KANDIDAT_FILTER',
    ]) {
      expect(namen, `Guard ${pflicht} nicht mehr transkribiert`).toContain(pflicht);
    }
  });

  it('der SHA-256-Anker im Artefakt zeigt auf die heutige NormText.tsx', () => {
    // Zieht jemand NormText.tsx um (V-2/V-4), MUSS die Basislinie im selben
    // Commit regeneriert werden: npm run check:verweis-inventar -- --schreiben
    const artefakt = JSON.parse(readFileSync(ARTEFAKT, 'utf8')) as {
      _quellen: { normTextSha256: string };
    };
    const ist = createHash('sha256')
      .update(readFileSync(QUELLEN['NormText.tsx']))
      .digest('hex');
    expect(artefakt._quellen.normTextSha256).toBe(ist);
  });
});
