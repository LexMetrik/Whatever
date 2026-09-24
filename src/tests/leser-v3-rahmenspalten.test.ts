import { describe, expect, it } from 'vitest';
import { rahmenBild, type RahmenLage } from '../pages/gesetz-leser/v3/rahmenSpalten';

// ─── Die Rahmen-Entscheidung an JEDER Breite (H4 18.8.2026 · D32/D33 7.9.2026
//     · Entscheid A 24.9.2026) ──────────────────────────────────────────────
//
// `rahmenBild` ist eine reine Funktion — sie lässt sich für jede Breite
// nachrechnen, nicht nur für die drei, die ein Bildbogen zufällig trifft (§2,
// dieselbe Begründung wie bei `kopfStufen`/`useElementBreite`). Der e2e-Fall
// `e2e/leser-v3-rahmen.e2e.ts` misst dieselben Zusagen im echten Browser; diese
// Datei sichert die ARITHMETIK ab, auch dort, wo kein Screenshot hinkommt.
//
// ── §6.3-DEKLARATION (Entscheid A, David 24.9.2026) · DIE DRITTE SPUR IST ZURÜCK
// Bis 24.9.2026 prüfte diese Datei D33: «das Beiwerk-Blatt bekommt keine Spur
// — der Rahmen hat zwei», `blattOffen` war als Eingabe gestrichen, und die
// Gliederung hing «NUR am Nutzerwillen». Davids Entscheid 24.9.2026, Variante A
// «Echte dritte Spalte»: «Das Blatt wird eine eigene Spalte wie die Gliederung
// und deckt nie Text ab. Nachteil: Der Text rutscht beim Öffnen zur Seite und
// bricht auf kleineren Bildschirmen neu um. Das hebt D33 (‹nichts verschiebt
// sich›) auf.» Deklarierte fachliche Änderung, kein Refactoring. Die geprüften
// Aussagen sind dabei SCHÄRFER geworden, nicht lockerer: statt «zwei Spuren»
// prüft die Datei jetzt über jede Breite von 952 bis 2600 px, dass die
// Lese-Zelle neben offenem Blatt nie unter `LESE_MIN` fällt, der Rahmen nie
// über den Raum wächst, und das Blatt @1920 bündig am Text sitzt.
//
// ROT ZU BEKOMMEN (§6.7, gesehen 24.9.2026): in `rahmenBild` die Bedingung
// `weicht` auf `false` setzen ⇒ «nie unter LESE_MIN» und «Schwelle 1»
// scheitern; die Aufweitung weglassen (`breite: undefined`) ⇒ «@1920 bündig»
// scheitert; `spurVersatzRem` fest auf `0` ⇒ die D32-Versatz-Fälle scheitern.

const REM = 16;
/** Fenster → Raum: die Aussenabstände des Route-Wrappers sind 2 × 24 px. */
const raumFuer = (fensterPx: number, ruhePx = Math.min(1072, fensterPx - 48)) =>
  ({ raumPx: fensterPx - 48, ruhePx, remPx: REM });

const LAGE: RahmenLage = {
  raum: raumFuer(1440),
  spaltenLage: true,
  tocOffen: true,
  ruheForm: 'rechts',
  blattLage: true,
  blattOffen: false,
};

/** Breite des aufgeweiteten Rahmens (px) — ohne Aufweitung die Ruhebreite. */
function rahmenPx(lage: RahmenLage): number {
  const b = rahmenBild(lage).breite as Record<string, string> | undefined;
  return b ? parseFloat(b['--leser-max-w']) : lage.raum!.ruhePx;
}
/** Breite der Lese-Zelle (px) = Rahmen − linke Spur − rechte Spur. */
function zellePx(lage: RahmenLage): number {
  const b = rahmenBild(lage);
  return rahmenPx(lage) - (b.spurVersatzRem + b.spurVersatzRechtsRem) * (lage.raum?.remPx ?? REM);
}

describe('Entscheid A · das Erlass-Blatt ist eine Spur rechts — zu eine Schiene', () => {
  it('@1440 zu: Gliederung · Text · Schiene, Blatt-Gestalt `spalte`', () => {
    const b = rahmenBild(LAGE);
    expect(b.blattForm).toBe('spalte');
    expect(b.blattSchiene).toBe(true);
    expect(b.blattSpur).toBe(false);
    expect(b.spalten).toBe('18rem minmax(0,1fr) 2.25rem');
    expect(b.spurVersatzRechtsRem * REM, 'Schiene 2.25 + 1.25 rem').toBe(56);
  });

  it('@1440 offen: die Spur ist 23.75 rem (380 px), die Schiene weg', () => {
    const b = rahmenBild({ ...LAGE, blattOffen: true });
    expect(b.blattSpur).toBe(true);
    expect(b.blattSchiene).toBe(false);
    expect(b.spalten).toBe('18rem minmax(0,1fr) 23.75rem');
    expect(b.spurVersatzRechtsRem * REM).toBe(400);
  });

  it('@1920 offen: das Blatt sitzt BÜNDIG am Text (Zelle = Lesemass-Deckel 720 px), linke Kante bleibt', () => {
    const lage = { ...LAGE, raum: raumFuer(1920), blattOffen: true };
    expect(zellePx(lage)).toBe(720);
    expect(rahmenPx(lage)).toBe(308 + 720 + 400);
    expect((rahmenBild(lage).breite as Record<string, string>).marginInlineStart, 'der Text rutscht @1920 nicht').toBe('0px');
  });

  it('über jede Breite: offenes Blatt ⇒ Zelle ≥ LESE_MIN (448 px), Rahmen ≤ Raum', () => {
    let geprueft = 0;
    for (let fenster = 952; fenster <= 2600; fenster += 4) {
      const lage = { ...LAGE, raum: raumFuer(fenster), blattOffen: true };
      if (rahmenBild(lage).blattForm !== 'spalte') continue;
      geprueft += 1;
      expect(zellePx(lage), `@${fenster}: Lesespalte zu schmal`).toBeGreaterThanOrEqual(448);
      expect(rahmenPx(lage), `@${fenster}: Rahmen über dem Raum`).toBeLessThanOrEqual(fenster - 48);
    }
    expect(geprueft, 'die Schleife prüfte nichts').toBeGreaterThan(400);
  });

  it('Schwelle 1: unter 1156 px Raum weicht die Gliederung dem offenen Blatt — transient', () => {
    for (const [fenster, weicht] of [[1024, true], [1150, true], [1203, true], [1204, false], [1280, false], [1440, false]] as const) {
      const offen = rahmenBild({ ...LAGE, raum: raumFuer(fenster), blattOffen: true });
      expect(offen.gliederungSpalte, `@${fenster}`).toBe(!weicht);
      expect(offen.schieneHoltPlatz, `@${fenster}: die Schiene holt Platz`).toBe(weicht);
      // Transient: dieselbe Nutzerwahl, Blatt zu ⇒ die Gliederung steht wieder.
      const zu = rahmenBild({ ...LAGE, raum: raumFuer(fenster) });
      expect(zu.gliederungSpalte, `@${fenster} zu`).toBe(true);
      expect(zu.schieneHoltPlatz).toBe(false);
    }
  });

  it('Schwelle 2: unter 904 px Raum (etwa 1024 mit App-Seitenleiste) keine Blatt-Spur — das Sheet', () => {
    expect(rahmenBild({ ...LAGE, raum: { raumPx: 720, ruhePx: 720, remPx: REM } }).blattForm).toBe('unten');
    expect(rahmenBild({ ...LAGE, raum: { raumPx: 903, ruhePx: 903, remPx: REM } }).blattForm).toBe('unten');
    expect(rahmenBild({ ...LAGE, raum: { raumPx: 904, ruhePx: 904, remPx: REM } }).blattForm).toBe('spalte');
  });

  it('ohne Blatt-Lage (Pane, unter 1024): Sheet unten, keine rechte Spur', () => {
    const b = rahmenBild({ ...LAGE, blattLage: false, blattOffen: true });
    expect(b.blattForm).toBe('unten');
    expect(b.blattSpur).toBe(false);
    expect(b.spalten).toBe('18rem minmax(0,1fr)');
    expect(b.spurVersatzRechtsRem).toBe(0);
  });

  it('Blatt zu: Gliederung klappen verstellt den Rahmen NICHT (D28, Kopf-Griffe bleiben stehen)', () => {
    for (const fenster of [1024, 1280, 1440, 1920]) {
      const auf = rahmenPx({ ...LAGE, raum: raumFuer(fenster) });
      const zu = rahmenPx({ ...LAGE, raum: raumFuer(fenster), tocOffen: false });
      expect(zu, `@${fenster}`).toBe(auf);
    }
  });

  it('eingeklappte Gliederung: Schiene links, bei offenem Blatt holt ihr Klick NICHTS', () => {
    const b = rahmenBild({ ...LAGE, tocOffen: false, blattOffen: true });
    expect(b.gliederungSpalte).toBe(false);
    expect(b.schiene).toBe(true);
    expect(b.schieneHoltPlatz, 'Nutzerwahl «zu» — der Klick blendet ein').toBe(false);
    expect(b.spalten).toBe('2.25rem minmax(0,1fr) 23.75rem');
  });
});

// ── D32 · DIE KANTE, AN DER DIE ERLASS-SUCHE BEGINNT ────────────────────────
// `spurVersatzRem` ist die Breite der linken Spur SAMT Abstand — also genau der
// Punkt, an dem die Lese-Zelle anfängt (Befund 7.9.2026: Feld x 184 gegen
// Textspalte x 492, Δ 308 px).
describe('D32 · der Versatz der Lese-Zelle', () => {
  it('Spalte 308 px · Schiene 56 px · ohne Spur 0 px', () => {
    expect(rahmenBild(LAGE).spurVersatzRem * REM, 'Gliederungsspalte 18 + 1.25 rem').toBe(308);
    expect(rahmenBild({ ...LAGE, tocOffen: false }).spurVersatzRem * REM, 'Schiene 2.25 + 1.25 rem').toBe(56);
    expect(rahmenBild({ ...LAGE, spaltenLage: false }).spurVersatzRem, 'ohne Spur kein Versatz').toBe(0);
  });

  it('der Schriftregler skaliert den Versatz mit (rem, nicht px)', () => {
    const gross = { raumPx: 1392, ruhePx: 1340, remPx: 20 };
    expect(rahmenBild({ ...LAGE, raum: gross }).spurVersatzRem * 20).toBe(385);
  });
});

// ── Die Artikelform an ihrer Schwelle (W2·24-R6b, unverändert gültig) ───────
describe('die Artikelform kippt an SPIEGEL_MIN_BREIT — und im Pane nie', () => {
  it('breit @1440, auch neben offenem Blatt @1024; Zeile in der engen Lage und im Pane', () => {
    expect(rahmenBild(LAGE).satzspiegel).toBe('breit');
    // @1024 offen: Gliederung weicht, Zelle = 976 − 56 − 400 = 520 px ≥ 448.
    expect(rahmenBild({ ...LAGE, raum: raumFuer(1024), blattOffen: true }).satzspiegel).toBe('breit');
    // Enge Lage (1024 mit ausgeklappter App-Seitenleiste: 720 px Raum): nach der
    // Gliederungsspur bleiben 412 px < 448 ⇒ Zeilenform (das Blatt ist dort Sheet).
    const engRaum = { raumPx: 720, ruhePx: 720, remPx: REM };
    expect(rahmenBild({ ...LAGE, raum: engRaum }).satzspiegel).toBe('zeile');
    expect(rahmenBild({ ...LAGE, spaltenLage: false, blattLage: false, raum: raumFuer(1000) }).satzspiegel).toBe('zeile');
    expect(rahmenBild({ ...LAGE, ruheForm: 'unten', blattLage: false, raum: raumFuer(2560) }).satzspiegel).toBe('zeile');
  });
});

describe('die Ränder des Bildes', () => {
  it('ohne Spalten- und Blatt-Lage (unter 1024 px, Pane) gibt es kein Grid', () => {
    const schmal = rahmenBild({ ...LAGE, spaltenLage: false, blattLage: false, raum: raumFuer(1000) });
    expect(schmal.blattForm).toBe('unten');
    expect(schmal.spalten).toBeUndefined();
    expect(schmal.breite).toBeUndefined();
  });

  it('ohne Messung (erster Render) steht die Spur-Gestalt, aber keine Aufweitung', () => {
    const b = rahmenBild({ ...LAGE, raum: null, blattOffen: true });
    expect(b.blattForm).toBe('spalte');
    expect(b.breite).toBeUndefined();
    expect(b.spurVersatzRem * REM).toBe(308);
  });
});
