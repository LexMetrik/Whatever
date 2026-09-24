import { describe, expect, it } from 'vitest';
import { migriereOptFelder } from '../pages/gesetz-leser/leserOptionen';

// ─── MIGRATION alter gespeicherter Werte ────────────────────────────────────
//
// S1 (16.8.2026, FAHRPLAN-LESER-V3 Kap. 4f, Entscheide David F1/F2): der Store
// trug bis dahin ein DREIWERTIGES `hist` ('aus' | 'fussnoten' | 'chronologie')
// und einen Schalter `verweise`; danach drei zweiwertige Felder, darunter
// `histansicht: 'an' | 'aus'`. Diese Sätze bleiben stehen, was auch immer
// später gemessen wird (§0 Ziff. 2b) — sie beschreiben den Bestand, aus dem
// heute noch migriert wird.
//
// D35-F3 (Entscheid David 7.9.2026, «A und verlustfrei»): `fussnoten` und
// `histansicht` sind zu EINER dreiwertigen Wahl `vermerke` geworden
// ('fassung' | 'fussnoten' | 'aus'). Damit gibt es ZWEI Migrationsstufen im
// selben Speicher, und die zweite frisst die erste: ein Bestands-Speicher von
// vor S1 muss über `hist` → `histansicht` → `vermerke` durchlaufen.
//
// Warum das ein eigener Test ist und keine Zeile im Store: der Fall, der wehtut,
// ist ein BESTANDS-Speicher — und der ist im Browser nicht mehr nachstellbar,
// sobald er einmal überschrieben wurde. Wer «Chronologie» gewählt hatte, wollte
// die Änderungsvermerke SEHEN; ihn nach dem Update auf «aus» zu setzen, nähme
// ihm amtliche Substanz weg, die er ausdrücklich bestellt hat (§8). Umgekehrt
// darf ein unbekannter Wert NIE durchrutschen: er landete als
// `data-vermerke="…"` am <html>, wo keine Regel greift — die Radiogruppe stünde
// auf einer Stellung, die es nicht gibt.
//
// Rot zu bekommen (§6.7): in `migriereOptFelder` die 'chronologie'-Zeile auf
// 'aus' drehen (Fall «beide Alt-Darstellungen» wird rot), in `ausAltenSchaltern`
// die zwei Zeilen tauschen (die Vier-Felder-Tabelle wird rot), oder
// `VERMERKE_WAHLEN` durch eine `typeof === 'string'`-Prüfung ersetzen (der
// Unfug-Fall wird rot).
//
// DOM-frei und uhr-frei (§2): `migriereOptFelder` ist rein.
//
// ── §6.3-DEKLARATION (S6 W1f, 24.9.2026) · DIE WAHL WIRD ZWEIWERTIG ──────────
// Entscheid David 24.9.2026, wörtlich: «die zeile soll ganz weg. infos sollen
// alle im blatt erscheinen. einzige ausnahme sind wenn fussnoten aktiviert sind
// die sollen unten am artikel erschienen». Mit der Funktionszeile fallen die
// Stellung «Fassung» und die Rubriken-Wahl `fussRubriken` (samt `stand`).
// Die Stufen darunter (hist → histansicht → Dreier-Wahl) bleiben unverändert
// stehen; NEU ist die letzte Stufe `fassung → aus` (Herleitung am
// `aufZweiwertig` in `leserOptionen.ts`: «Fassung» zeigte seit W2·26/Z8 KEINEN
// Apparat, der Fussnoten-Zustand bleibt also erhalten). Darum steht, wo bis
// hierher «fassung» erwartet war, jetzt «aus» — dieselbe Sichtbarkeit der
// Fussnoten. Die D40-Fälle zu `fussRubriken`/`stand` sind gestrichen, weil das
// Feld nicht mehr existiert; an ihre Stelle tritt der Fall «Alt-Felder rutschen
// nicht durch». Rot (§6.7): in `aufZweiwertig` 'fassung' auf 'fussnoten' drehen
// ⇒ der Block «S6 W1f» und die Tabellen-Fälle werden rot.

describe('D35-F3: zwei Bestands-Schalter → eine Dreier-Wahl', () => {
  // Die Tabelle IST Davids Entscheid vom 7.9.2026 (Notation fussnoten/histansicht).
  const TABELLE = [
    // S6 W1f: «fassung» der Dreier-Wahl ⇒ heute «aus» (dieselbe Fussnoten-Sicht).
    { fussnoten: 'an', histansicht: 'an', erwartet: 'aus' },
    { fussnoten: 'aus', histansicht: 'an', erwartet: 'aus' },
    { fussnoten: 'an', histansicht: 'aus', erwartet: 'fussnoten' },
    { fussnoten: 'aus', histansicht: 'aus', erwartet: 'aus' },
  ] as const;

  for (const f of TABELLE) {
    it(`fussnoten=${f.fussnoten} · histansicht=${f.histansicht} ⇒ «${f.erwartet}»`, () => {
      expect(migriereOptFelder({ fussnoten: f.fussnoten, histansicht: f.histansicht }).vermerke)
        .toBe(f.erwartet);
    });
  }

  it('eine schon gesetzte Wahl hat Vorrang vor den Alt-Schaltern', () => {
    // Ein Bestands-Rest kann aus einem anderen Tab oder einem alten Profil
    // stammen. Steht der neue Schlüssel da, ist er die Wahrheit — sonst zöge der
    // Alt-Rest die frische Wahl bei jedem Laden zurück (§8).
    expect(migriereOptFelder({ vermerke: 'aus', fussnoten: 'an', histansicht: 'an' }).vermerke).toBe('aus');
    expect(migriereOptFelder({ vermerke: 'fussnoten', histansicht: 'an' }).vermerke).toBe('fussnoten');
  });

  it('unbekannte Werte fallen auf die Vorgabe (heute «aus»), ohne zu werfen', () => {
    const unfug: unknown[] = [
      undefined, null, 1, 0, true, 'Fassung', 'FUSSNOTEN', 'histansicht', '', {}, [], 'an',
    ];
    for (const wert of unfug) {
      expect(() => migriereOptFelder({ vermerke: wert }), `Wert: ${String(wert)}`).not.toThrow();
      expect(migriereOptFelder({ vermerke: wert }).vermerke, `Wert: ${String(wert)}`).toBe('aus');
    }
  });

  // §6.3-DEKLARATION (D35-F2, 7.9.2026): der Fall hiess «… Rechtsprechung im
  // Kopf an» und prüfte `leitfaelle: 'an'`. Der Schalter ist ersatzlos
  // gestrichen (Herleitung in `leserOptionen.ts`); an seiner Stelle steht der
  // Grundzustand der Rubriken-Wahl, und die Aussage bleibt dieselbe: ein leerer
  // Speicher ergibt die Vorgabe, nichts Halbes.
  // §6.3-DEKLARATION (D40, 7.9.2026): der Grundzustand hat eine SECHSTE Rubrik
  // bekommen — `f` = Fassung, seit sie in der Funktionszeile am Artikelende
  // steht statt am Artikelkopf (David: «und wieso ist fassung nicht auch unten
  // am artikel?»). Die Aussage des Falls ist unverändert.
  // S6 W1f: Vorgabe «aus» — dieselbe Fussnoten-Sicht wie die frühere Vorgabe «Fassung».
  it('leerer Speicher ⇒ Vorgabe: Fussnoten am Bildschirm aus', () => {
    expect(migriereOptFelder({})).toEqual({ vermerke: 'aus' });
  });

  it('das Ergebnis trägt GENAU den einen heutigen Schlüssel', () => {
    // Die gestrichenen (`verweise`, `linien`, `zeitraum`, `hist`, `fussnoten`,
    // `histansicht`) dürfen nicht durchrutschen: jeder von ihnen landete sonst
    // als `data-<name>` am <html> und schaltete eine Regel, die es nicht gibt.
    const ergebnis = migriereOptFelder({
      verweise: 'aus', linien: 'auto', zeitraum: '10', hist: 'chronologie',
      fussnoten: 'aus', histansicht: 'aus', leitfaelle: 'aus',
      // S6 W1f: die gestrichene Rubriken-Wahl und ihr Stand rutschen ebenfalls nicht durch.
      fussRubriken: ['r'], stand: 2,
    });
    // §6.3-DEKLARATION (D35-F2, 7.9.2026): `leitfaelle` ist selbst gestrichen
    // (Herleitung in `leserOptionen.ts`) und steht darum jetzt in der Liste der
    // Alt-Schlüssel, die NICHT durchrutschen dürfen; an seine Stelle tritt
    // `fussRubriken`. Die Aussage des Falls ist unverändert: aus dem
    // Bestands-Speicher kommt genau der Feldsatz heraus, den der Store führt.
    expect(Object.keys(ergebnis).sort()).toEqual(['vermerke']);
  });
});

describe('S6 W1f: drei Stellungen → zwei (Fussnoten am Artikel an/aus)', () => {
  // Massgeblich ist, was am Artikel SICHTBAR war — beim Fussnoten-Apparat, dem
  // einzigen, was am Artikel bleibt. «Fassung» verbarg ihn seit W2·26/Z8.
  const TABELLE = [
    { gespeichert: 'fassung', erwartet: 'aus' },
    { gespeichert: 'fussnoten', erwartet: 'fussnoten' },
    { gespeichert: 'aus', erwartet: 'aus' },
  ] as const;
  for (const f of TABELLE) {
    it(`vermerke «${f.gespeichert}» ⇒ «${f.erwartet}»`, () => {
      expect(migriereOptFelder({ vermerke: f.gespeichert }).vermerke).toBe(f.erwartet);
    });
  }

  it('die gespeicherte Dreier-Wahl hat Vorrang vor Alt-Schaltern — auch «fassung»', () => {
    // Ein Bestands-Rest `fussnoten: 'an'` darf ein gespeichertes «fassung» nicht
    // auf «Fussnoten an» heben: die Wahl stand und verbarg den Apparat.
    expect(migriereOptFelder({ vermerke: 'fassung', fussnoten: 'an', histansicht: 'aus' }).vermerke).toBe('aus');
  });
});

describe('S1-Migration: hist (dreiwertig) speist die Wahl weiter', () => {
  it('beide Alt-Darstellungen bedeuten «an» — «chronologie» ist keine Abwesenheit', () => {
    // Der entscheidende Fall. 'fussnoten' und 'chronologie' waren ZWEI
    // Darstellungen DERSELBEN Vermerke, nicht Vorhandensein vs. Abwesenheit.
    // «Vermerke sichtbar» ist seit D35-F3 die Stellung «Fassung» — und die ist
    // seit S6 W1f «aus» (am Artikel stand dann kein Apparat, s. Kopf).
    expect(migriereOptFelder({ hist: 'fussnoten' }).vermerke).toBe('aus');
    expect(migriereOptFelder({ hist: 'chronologie' }).vermerke).toBe('aus');
  });

  it('«aus» bleibt «aus» — eine getroffene Nutzerwahl kippt nicht still (§8)', () => {
    // hist=aus + fussnoten fehlt (⇒ galt als «an») ⇒ die Stellung «Fussnoten».
    expect(migriereOptFelder({ hist: 'aus' }).vermerke).toBe('fussnoten');
    // … und mit ebenfalls abgewähltem Apparat die Stellung «aus».
    expect(migriereOptFelder({ hist: 'aus', fussnoten: 'aus' }).vermerke).toBe('aus');
  });

  it('schon migrierter Speicher hat Vorrang vor dem Alt-Schlüssel', () => {
    expect(migriereOptFelder({ histansicht: 'aus', hist: 'chronologie' }).vermerke).toBe('fussnoten');
    expect(migriereOptFelder({ histansicht: 'an', hist: 'aus' }).vermerke).toBe('aus');
  });

  it('unbekannte Alt-Werte fallen auf «Vermerke sichtbar» (heute «aus»), ohne zu werfen', () => {
    const unfug: unknown[] = [
      undefined, null, 1, 0, true, 'chronologisch', 'AUS', 'An', '', {}, [], 'fussnote',
    ];
    for (const wert of unfug) {
      expect(() => migriereOptFelder({ hist: wert }), `Wert: ${String(wert)}`).not.toThrow();
      expect(migriereOptFelder({ hist: wert }).vermerke, `Wert: ${String(wert)}`).toBe('aus');
      // Auch am S1-Schlüssel darf nichts Unbekanntes durchrutschen.
      expect(migriereOptFelder({ histansicht: wert }).vermerke, `Wert: ${String(wert)}`).toBe('aus');
    }
  });
});

describe('Migration: das unveränderte Feld und der reale Bestand', () => {
  // S6 W1f (24.9.2026): HIER STANDEN fünf Fälle zu `fussRubriken` und `stand`
  // (D35-F2/D40). Das Feld ist mit der Funktionszeile gestrichen; dass es aus
  // einem Bestands-Speicher nicht durchrutscht, prüft «GENAU den einen heutigen
  // Schlüssel» oben.

  it('ein realer Bestands-Speicher (vor S1) migriert vollständig', () => {
    // Genau der Speicher, den ein Nutzer von vor S1 hat: alle Alt-Schlüssel
    // beisammen, inkl. der schon früher entfallenen `linien`/`zeitraum`.
    // `hist: 'chronologie'` ⇒ Vermerke sichtbar ⇒ «Fassung»; das abgewählte
    // `fussnoten` spielt in diesem Zweig keine Rolle mehr, weil es den
    // Apparat-Schalter nicht mehr gibt (Herleitung am Typ `VermerkeWahl`).
    const bestand = {
      fussnoten: 'aus', verweise: 'aus', leitfaelle: 'an',
      hist: 'chronologie', linien: 'auto', zeitraum: '10', schrift: 'gross',
    };
    // D35-F2: `leitfaelle: 'an'` im Bestand wird nicht mehr übernommen — das
    // Feld gibt es nicht mehr; die Rubriken-Wahl fehlt im Speicher und fällt
    // darum auf ihren Grundzustand.
    // S6 W1f: «Fassung» ⇒ «aus», die Rubriken-Wahl gibt es nicht mehr.
    expect(migriereOptFelder(bestand)).toEqual({ vermerke: 'aus' });
  });
});
