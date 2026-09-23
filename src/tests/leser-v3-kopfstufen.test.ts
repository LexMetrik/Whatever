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

  // A-2 (David 17.8.2026): das Feld hiess `sektion` und stand für die eine Krume
  // «Gesetze ›». Seit der Leisten-Verschmelzung trägt die Kopfzeile die ganze
  // Kette «Gesetze › Bund ›» — ein Feld für beide führenden Stufen, darum
  // `krume`. Deklarierte fachliche Anpassung (§6.3), kein Aufweichen: geprüft
  // wird dieselbe Aussage über dieselbe Zone.
  // V2 (Nachzug 17.8.2026): `krume` ist kein `boolean` mehr, sondern
  // 'voll' | 'kurz' — die Kette schrumpft auf einen Rücksprung «‹ Gesetze»,
  // statt ganz zu verschwinden. Zweite deklarierte fachliche Anpassung (§6.3):
  // die Aussage «die führenden Stufen fallen zuerst» gilt unverändert, neu
  // kommt die Zusicherung darunter dazu, dass NICHTS ganz wegfällt.
  it('die Reihenfolge des Wegfalls ist «Gesetze › Bund ›» zuerst, dann der Volltitel', () => {
    expect(kopfElemente('voll')).toMatchObject({ krume: 'voll', volltitel: true });
    expect(kopfElemente('kompakt')).toMatchObject({ krume: 'kurz', volltitel: false });
    expect(kopfElemente('mini')).toMatchObject({ krume: 'kurz', volltitel: false });
  });

  // V2 · DIE AUFWÄRTS-NAVIGATION FÄLLT AUF KEINER BREITE WEG.
  // Rot zu bekommen: in `kopfStufen.kopfElemente` einen dritten Krumen-Wert
  // einführen (oder auf `boolean` zurückgehen) — dann trägt mindestens eine
  // Breite keine Krume mehr, und genau das war der Befund V2.
  it('auf JEDER Breite trägt der Kopf eine Krume — voll oder als Rücksprung', () => {
    for (let b = 280; b <= 2000; b += 1) {
      const el = kopfElemente(kopfStufe(b));
      expect(['voll', 'kurz'], `Krume fehlt bei ${b} px`).toContain(el.krume);
    }
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

  // ── Ä87/Ä91 (H4-Nachzug 18.8.2026) · DAS ✕ IST WEG, DER RÜCKSPRUNG BLEIBT ──
  // Hier stand `zeigeSchliessKreuz`. Die Funktion ist gestrichen (Messreihe im
  // Kopf von `kopfStufen.ts`): das Kopf-✕ lag @1440 bei offenem Blatt 47 px über
  // dessen eigenem ✕ und war @720 das fünfte Element einer Zeile, die vier
  // trägt. Was BLEIBEN muss, ist die Zusage, auf der die Streichung ruht — auf
  // JEDER Breite steht ein beschrifteter Weg nach `/gesetze` in derselben Zeile.
  // Genau das prüft dieser Fall, und zwar an beiden Hälften der Aussage:
  // der Krumen-Zuschnitt fällt nie weg, und die erste Krumen-Stufe trägt ein Ziel.
  // Rot zu bekommen (§6.7, gefahren 18.8.2026): in `kopfElemente` einen dritten
  // Krumen-Wert einführen, oder in `erlassAnsicht.brotkrume` das `to` der ersten
  // Stufe entfernen.
  it('auf jeder Breite steht ein beschrifteter Rücksprung — das ✕ braucht es nicht', () => {
    for (let b = 280; b <= 2000; b += 1) {
      expect(['voll', 'kurz'], `kein Rücksprung-Zuschnitt bei ${b} px`)
        .toContain(kopfElemente(kopfStufe(b)).krume);
    }
    // Dass die erste Krumen-Stufe wirklich ein ZIEL trägt (sonst wäre der
    // «Rücksprung» ein stummes Wort und `LeserKopf` liesse ihn weg), prüft
    // `leser-v3-erlassansicht.test.ts` an `hatRuecksprung` — dort, wo die Krume
    // entsteht.
  });

  it('die Kopfhöhe folgt der Design-Grundlage (H/S 48 px · D 56 px)', () => {
    // Kap. 3 der Design-Grundlage. Die Werte sind zugleich die Grundlage des
    // Sprung-Offsets `--nt-stick` (Risiko R1) — ein stiller Wechsel hier
    // verschöbe jeden Artikel-Sprung.
    expect(kopfHoehe('voll')).toBe('3.5rem');
    expect(kopfHoehe('kompakt')).toBe('3rem');
    expect(kopfHoehe('mini')).toBe('3rem');
  });
});
