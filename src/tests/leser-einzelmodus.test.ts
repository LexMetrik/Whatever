import { describe, expect, it } from 'vitest';
import {
  MODUS_VORGABE, einzelAdresse, gliederungsPfad, modusAusSuche, modusEntscheid,
  nachbarToken, sucheMitModus, tokenAusHash, vorschauZiel,
} from '../pages/gesetz-leser/v3/einzelModus';
import type { Sektion } from '../lib/normtext/browse';
import type { NormSnapshot } from '../lib/normtext/typen';

// ═══ W2·5m · DIE REINE SEITE DER EINZELARTIKEL-ANSICHT ══════════════════════
//
// Konzept FAHRPLAN-LESER-V3 Kap. 15. Geprüft wird hier, was OHNE Browser
// entscheidbar ist — Modus-Vorrang, Adressform, Gliederungspfad, Blätter-Schritt.
// Die Verdrahtung (Verlauf, Tastatur, Bild) prüft `e2e/leser-einzelmodus.e2e.ts`.
//
// ── WAS DIESE SONDE ROT MACHT (§6.7) ───────────────────────────────────────
// Vor dem Bau am Vorzustand gefahren: alle Importe existierten nicht, die Datei
// war rot. Einzeln nachgestellt beim Bau:
//  · `modusEntscheid` gibt die Präferenz statt der Adresse zurück → (b) rot;
//  · `sucheMitModus` schreibt `?ansicht=erlass` → (c) rot;
//  · `nachbarToken` filtert aufgehobene Artikel → (f) rot;
//  · `gliederungsPfad` liefert die Sektions-Id statt des ersten Artikels → (e) rot.

const snap = (artikel: string, label = `Art. ${artikel}`): NormSnapshot => ({
  id: `x-${artikel}`, artikel, artikelLabel: label, bloecke: [],
} as unknown as NormSnapshot);

const sek = (id: string, label: string, artikel: NormSnapshot[], kinder: Sektion[] = []): Sektion => ({
  id, ebene: 1, label, artikel, kinder,
} as unknown as Sektion);

describe('(a) der Modus steht in der Adresse — oder gar nicht', () => {
  it('liest `?ansicht=artikel` und `?ansicht=erlass`', () => {
    expect(modusAusSuche('?ansicht=artikel')).toBe('artikel');
    expect(modusAusSuche('?ansicht=erlass')).toBe('erlass');
  });

  it('eine Adresse ohne den Parameter schweigt (`null`), sie sagt NICHT «erlass»', () => {
    // Der Unterschied ist die ganze Vorrang-Regel: nur eine schweigende Adresse
    // lässt die gemerkte Wahl zu Wort kommen (Kap. 15.6).
    expect(modusAusSuche('')).toBeNull();
    expect(modusAusSuche('?q=zins')).toBeNull();
  });

  it('ein unbekannter Wert rutscht nicht durch (Whitelist wie bei `vermerke`)', () => {
    expect(modusAusSuche('?ansicht=xyz')).toBeNull();
    expect(modusAusSuche('?ansicht=')).toBeNull();
  });
});

describe('(b) Vorrang: die Adresse schlägt die Präferenz', () => {
  it('ein geteilter Link zeigt, was der Absender meinte', () => {
    expect(modusEntscheid('artikel', 'erlass')).toBe('artikel');
    expect(modusEntscheid('erlass', 'artikel')).toBe('erlass');
  });

  it('schweigt die Adresse, gilt die gemerkte Wahl', () => {
    expect(modusEntscheid(null, 'artikel')).toBe('artikel');
    expect(modusEntscheid(null, 'erlass')).toBe('erlass');
  });

  it('F-E3 (David 14.9.2026: «ja») · die Vorgabe ist der ganze Erlass', () => {
    expect(MODUS_VORGABE).toBe('erlass');
  });
});

describe('(c) die Adressform', () => {
  it('der Grundzustand wird NIE ausgeschrieben', () => {
    // Sonst gäbe es zwei Schreibweisen für dieselbe Seite — und jeder geteilte
    // Link trüge eine Einstellung, die der Absender nie getroffen hat.
    expect(sucheMitModus('', 'erlass')).toBe('');
    expect(sucheMitModus('?ansicht=artikel', 'erlass')).toBe('');
  });

  it('fremde Parameter bleiben unangetastet', () => {
    expect(sucheMitModus('?q=zins', 'artikel')).toBe('?q=zins&ansicht=artikel');
    expect(sucheMitModus('?ansicht=artikel&q=zins', 'erlass')).toBe('?q=zins');
  });

  it('die volle Adresse trägt den BESTEHENDEN `#art-`-Anker', () => {
    // §5: derselbe Anker wie in der Gesamtansicht — ein eigener Anker liesse
    // jeden bestehenden Tieflink je nach Modus woanders landen.
    expect(einzelAdresse('/gesetze/bund/OR', '', '336_c', 'artikel'))
      .toBe('/gesetze/bund/OR?ansicht=artikel#art-336_c');
    expect(einzelAdresse('/gesetze/bund/OR', '?ansicht=artikel', '336_c', 'erlass'))
      .toBe('/gesetze/bund/OR#art-336_c');
  });

  it('Hin- und Rückweg sind deckungsgleich', () => {
    const adresse = einzelAdresse('/gesetze/kanton/BS-640.100', '', '12_a', 'artikel');
    const [pfad, rest] = adresse.split('?');
    expect(pfad).toBe('/gesetze/kanton/BS-640.100');
    expect(modusAusSuche(`?${rest.split('#')[0]}`)).toBe('artikel');
    expect(tokenAusHash(`#${adresse.split('#')[1]}`)).toBe('12_a');
  });
});

describe('(d) der Anker → Token', () => {
  it('liest den Token und dekodiert ihn', () => {
    expect(tokenAusHash('#art-336_c')).toBe('336_c');
    // 54 Token des Korpus tragen Leerzeichen oder Halbgeviert («22 a», «36–42»).
    expect(tokenAusHash(`#art-${encodeURIComponent('22 a')}`)).toBe('22 a');
    expect(tokenAusHash(`#art-${encodeURIComponent('36–42')}`)).toBe('36–42');
  });

  it('ein fremder Hash ist kein Token', () => {
    expect(tokenAusHash('')).toBeNull();
    expect(tokenAusHash('#oben')).toBeNull();
    expect(tokenAusHash('#sek-3')).toBeNull();
    expect(tokenAusHash('#art-')).toBeNull();
  });

  it('ein kaputtes Prozent-Escape liefert keinen falschen Token', () => {
    expect(tokenAusHash('#art-%E0%A4%A')).toBeNull();
  });
});

describe('(e) der Gliederungspfad ist zugleich der Rückweg (B4)', () => {
  const baum = [
    sek('sek-1', 'Erster Titel', [], [
      sek('sek-2', 'Zweiter Abschnitt', [snap('7'), snap('8')]),
    ]),
    sek('sek-9', 'Zweiter Titel', [snap('20')]),
  ];

  it('nennt die Stufen von der Wurzel bis zum Artikel', () => {
    expect(gliederungsPfad(baum, '8').map((s) => s.label))
      .toEqual(['Erster Titel', 'Zweiter Abschnitt']);
  });

  it('jede Stufe trägt ihren ERSTEN Artikel als Sprungziel', () => {
    // Kein Sektions-Sprung, sondern ein `#art-`-Anker: den löst der bestehende
    // Tieflink-Zweig auf, ohne dass ein Sprung auf einen Render warten muss.
    const pfad = gliederungsPfad(baum, '8');
    expect(pfad.map((s) => s.ersterArtikel)).toEqual(['7', '7']);
  });

  it('ein Artikel ohne amtliche Gliederung hat keinen Pfad (§8, keine erfundene Stufe)', () => {
    expect(gliederungsPfad(baum, '999')).toEqual([]);
    expect(gliederungsPfad([], '8')).toEqual([]);
  });
});

describe('(f) der Blätter-Schritt überspringt nichts (§8)', () => {
  // Genau die Reihung des Korpus, aufgehobene Artikel eingeschlossen: wer von
  // Art. 348 ZGB weiterblättert, landet auf 349 und sieht dort «· aufgehoben».
  const tokens = ['337_b', '337_c', '337_d', '338'];

  it('geht einen Schritt vor und zurück', () => {
    expect(nachbarToken(tokens, '337_c', 1)).toBe('337_d');
    expect(nachbarToken(tokens, '337_c', -1)).toBe('337_b');
  });

  it('am Rand des Erlasses gibt es kein Ziel (kein Umlauf)', () => {
    expect(nachbarToken(tokens, '337_b', -1)).toBeNull();
    expect(nachbarToken(tokens, '338', 1)).toBeNull();
  });

  it('ohne bekannte Stellung wird nicht geraten', () => {
    expect(nachbarToken(tokens, null, 1)).toBeNull();
    expect(nachbarToken(tokens, 'gibt-es-nicht', 1)).toBeNull();
  });
});

describe('(g) die Nachbarn-Vorschau (F-E2)', () => {
  it('nimmt Nummer, Randtitel und Zustand aus dem geladenen Snapshot', () => {
    const ziel = vorschauZiel(
      { token: '337_d', label: 'Art. 337d', aufgehoben: false },
      (t) => (t === '337_d' ? 'Ungerechtfertigtes Nichtantreten' : null),
    );
    expect(ziel).toEqual({
      token: '337_d', label: 'Art. 337d',
      marginalie: 'Ungerechtfertigtes Nichtantreten', aufgehoben: false,
    });
  });

  it('ohne Randtitel steht nichts da — keine gebastelte Kurzfassung (§8)', () => {
    const ziel = vorschauZiel({ token: '5', label: 'Art. 5', aufgehoben: true }, () => null);
    expect(ziel?.marginalie).toBeNull();
    expect(ziel?.aufgehoben).toBe(true);
  });

  it('am Rand des Erlasses gibt es keine Karte', () => {
    expect(vorschauZiel(null, () => 'x')).toBeNull();
    expect(vorschauZiel(undefined, () => 'x')).toBeNull();
  });
});
