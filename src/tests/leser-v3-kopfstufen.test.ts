import { describe, expect, it } from 'vitest';
import {
  KOPF_SCHWELLE_KOMPAKT, KOPF_SCHWELLE_MINI,
  kopfElemente, kopfHoehe, kopfStufe,
} from '../pages/gesetz-leser/v3/kopfStufen';
import { OEFFNER_NAME, OEFFNER_WORT } from '../pages/gesetz-leser/v3/panelModell';

// FAHRPLAN-LESER-V3 Kap. 4a — die Overflow-Regel der V3-Kopfzeile:
//
//   «Unter 900 px fällt zuerst «Gesetze», dann der Volltitel; NIE der Artikel,
//    nie «Ansicht».»
//
// Der zweite Halbsatz ist die eigentliche Zusage. An Utility-Klassen liesse er
// sich nur an den paar Breiten stichproben, die ein Screenshot zufällig trifft;
// an einer reinen Funktion lässt er sich über den ganzen Bereich beweisen.
// Genau das tut der Test unten — nicht drei Beispiele, sondern jede Breite von
// 280 bis 2000 px.
//
// Rot zu bekommen: in `kopfElemente` `artikel` an die Stufe binden, oder die
// beiden Schwellen vertauschen.

describe('Overflow-Regel der V3-Kopfzeile (Kap. 4a)', () => {
  it('die drei Zuschnitte liegen an den Schwellen 640 und 900', () => {
    expect(kopfStufe(360)).toBe('mini');
    expect(kopfStufe(KOPF_SCHWELLE_MINI - 1)).toBe('mini');
    expect(kopfStufe(KOPF_SCHWELLE_MINI)).toBe('kompakt');
    expect(kopfStufe(KOPF_SCHWELLE_KOMPAKT - 1)).toBe('kompakt');
    expect(kopfStufe(KOPF_SCHWELLE_KOMPAKT)).toBe('voll');
    expect(kopfStufe(1440)).toBe('voll');
  });

  // W2·17-UI-BEFUNDE H9-B01 (1.10.2026) · §6.3-DEKLARATION: hier standen zwei
  // Fälle über das Feld `krume` («Gesetze › Bund ›» fällt zuerst; auf jeder
  // Breite trägt der Kopf eine Krume). Seit D27 (David 6.9.2026) rendert die
  // Kopfzeile keine Krume mehr — `LeserKopf` las `krume` nie, die e2e pinnt
  // `[data-v3-kopf-krume-kurz]` auf 0. Die Fälle bewachten ein Feld ohne Leser
  // (§6.7); Feld und Fälle sind gestrichen (§17-Gegengewicht). Was an der
  // Reihenfolge des Wegfalls noch gilt, ist der Volltitel:
  it('der Volltitel steht nur auf der vollen Stufe', () => {
    expect(kopfElemente('voll')).toMatchObject({ volltitel: true });
    expect(kopfElemente('kompakt')).toMatchObject({ volltitel: false });
    expect(kopfElemente('mini')).toMatchObject({ volltitel: false });
  });

  it('Kürzel, laufender Artikel und «Ansicht» fallen bei KEINER Breite weg', () => {
    for (let b = 280; b <= 2000; b += 1) {
      const el = kopfElemente(kopfStufe(b));
      expect(el.kuerzel, `Kürzel fehlt bei ${b} px`).toBe(true);
      expect(el.artikel, `Artikel fehlt bei ${b} px`).toBe(true);
      expect(el.ansicht, `Ansicht fehlt bei ${b} px`).toBe(true);
    }
  });

  it('die Regel ist monoton — mehr Platz nimmt nie etwas weg', () => {
    const rang = { mini: 0, kompakt: 1, voll: 2 } as const;
    let letzter = -1;
    for (let b = 280; b <= 2000; b += 1) {
      const r = rang[kopfStufe(b)];
      expect(r, `Zuschnitt springt bei ${b} px zurück`).toBeGreaterThanOrEqual(letzter);
      letzter = r;
    }
  });

  // ── §6.3-DEKLARATION (D35-F2, Entscheid David 7.9.2026) ───────────────────
  // Hier standen zwei Fälle: «auf JEDER Breite trägt der Kopf einen
  // Panel-Zähler — voll oder als Chip» (`kopfElemente(...).panel`) und «der
  // kompakte Zähler behauptet keine Zahl, die wir nicht haben»
  // (`oeffnerLabelKompakt`). Beide prüften Zusagen über eine ZAHL im Kopf. Mit
  // Variante A trägt der Kopf keine Artikel-Zahl mehr, und der Griff hat auf
  // jeder Breite dieselbe Gestalt — die Fallunterscheidung, die sie bewachten,
  // existiert nicht mehr (§17-Gegengewicht: gestrichen statt umgeschrieben).
  // Die dahinterliegende NM-2-Sorge («auf `mini` steht kein Öffner in der
  // Kopfzeile») bleibt geprüft, und zwar schärfer: sie hängt jetzt an keiner
  // Bedingung mehr, und `e2e/leser-w224-g.e2e.ts` (G14) misst @320/@390, dass
  // jeder Kopf-Griff ein Wort trägt und die Zeile nicht überläuft.
  //
  // WAS BLEIBT: das Wort selbst ist eine Aussage über einen Rückgabewert und
  // steht darum weiter hier. Rot zu bekommen: `OEFFNER_WORT` ändern.
  // §6.3-DEKLARATION (S6-W1a, 23.9.2026): «Erlass» → «Erlass-Blatt» (C-1/D-5).
  it('der Kopf-Griff heisst auf jeder Breite «Erlass-Blatt» und nennt keine Zahl', () => {
    expect(OEFFNER_WORT).toBe('Erlass-Blatt');
    expect(OEFFNER_NAME).not.toMatch(/\d/);
  });

  // ── Ä87/Ä91 (H4-Nachzug 18.8.2026) · DAS ✕ IST WEG — W2·17 H9-B01 ───────────
  // Hier stand ein Fall «auf jeder Breite steht ein beschrifteter Rücksprung»
  // (über `krume` und `erlassAnsicht.hatRuecksprung`). Beides gestrichen: die
  // Kopfzeile trägt seit D27 keine Krume, der Fall bewachte Code ohne Aufrufer.
  // Wortlaut in der Versionshistorie, Stand 0880efac9.

  it('die Kopfhöhe folgt der Design-Grundlage (H/S 48 px · D 56 px)', () => {
    // Kap. 3 der Design-Grundlage. Die Werte sind zugleich die Grundlage des
    // Sprung-Offsets `--nt-stick` (Risiko R1) — ein stiller Wechsel hier
    // verschöbe jeden Artikel-Sprung.
    expect(kopfHoehe('voll')).toBe('3.5rem');
    expect(kopfHoehe('kompakt')).toBe('3rem');
    expect(kopfHoehe('mini')).toBe('3rem');
  });
});
