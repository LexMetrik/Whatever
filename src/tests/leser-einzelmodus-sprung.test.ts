import { describe, expect, it } from 'vitest';
import {
  einzelSprungAdresse, erlassAdresse, ersterArtikelDerSektion, lesestelle, loeseEinzelToken,
} from '../pages/gesetz-leser/v3/einzelModus';
import type { Sektion } from '../lib/normtext/browse';
import type { NormSnapshot } from '../lib/normtext/typen';
import { erzeugeSprungZeitplan, type ZeitplanUhr } from '../pages/gesetz-leser/v3/sprungWege';

// ═══ W2·17-UI-BEFUNDE · EIN SPRUNGWEG FÜR DEN EINZELMODUS ═══════════════════
//
// Befund-Cluster «Navigation im Einzelmodus» (1.10.2026): `springeZuArtikel`
// schrieb die Adresse per `replaceState` am Router vorbei, der Einzelmodus liest
// den gezeigten Artikel aber aus dem Router-Hash — Adresse und Anzeige liefen
// auseinander (PE-C3-B01, PE-B10-B02, PE-B12-B03). Die reinen Entscheide stehen
// in `v3/einzelModus.ts`, die Zeitplanung in `v3/sprungWege.ts`; die Verdrahtung
// im Browser misst `e2e/leser-einzelmodus.e2e.ts` (Block «W2·17»).
//
// ROT ZU BEKOMMEN (§6.7), vor dem Bau am Vorzustand: alle Importe existierten
// nicht, die Datei war rot. Danach je Zeile einzeln:
//  · `einzelSprungAdresse` liefert im Gesamt-Modus eine Adresse        → (a) rot;
//  · `lesestelle` nimmt im Gesamt-Modus den Einstiegsanker vor der Lesestellung → (c) rot;
//  · `loeseEinzelToken` gibt den rohen Anker als Token zurück           → (b) rot;
//  · der Zeitplan verwirft den früheren Sprung nicht                    → (e) rot.

describe('(a) der Sprung im Einzelmodus ist eine ROUTER-Adresse (PE-C3-B01, PE-B10-B02)', () => {
  const OR = '/gesetze/bund/OR';

  it('Einzelmodus per Adresse: `?ansicht=artikel#art-41`, andere Parameter bleiben', () => {
    expect(einzelSprungAdresse(OR, '?ansicht=artikel', 'erlass', '41')).toBe(`${OR}?ansicht=artikel#art-41`);
    expect(einzelSprungAdresse(OR, '?q=zins&ansicht=artikel', 'erlass', '41_a')).toBe(`${OR}?q=zins&ansicht=artikel#art-41_a`);
  });

  it('Einzelmodus per gemerkter Wahl (Adresse schweigt) — die Adresse nennt den Modus dann ausdrücklich', () => {
    expect(einzelSprungAdresse(OR, '', 'artikel', '41')).toBe(`${OR}?ansicht=artikel#art-41`);
  });

  it('Gesamtansicht: KEINE Router-Adresse (dort scrollt der Sprung, die Adresse schreibt `replaceState`)', () => {
    expect(einzelSprungAdresse(OR, '', 'erlass', '41')).toBeNull();
    // Die Adresse schlägt die Präferenz (Kap. 15.6): ausdrücklich «erlass» gilt trotz gemerktem «artikel».
    expect(einzelSprungAdresse(OR, '?ansicht=erlass', 'artikel', '41')).toBeNull();
  });
});

describe('(b) ein unbekannter Anker wird benannt, nicht verschluckt (E-D10)', () => {
  const tokens = ['1', '97', '336_c', '336_d'];

  it('ein bekannter Anker wird aufgelöst, auch unscharf bei eindeutigem Treffer', () => {
    expect(loeseEinzelToken('#art-97', tokens)).toEqual({ token: '97', unbekannt: null });
    expect(loeseEinzelToken('#art-336c', tokens)).toEqual({ token: '336_c', unbekannt: null });
  });

  it('ein Anker ohne Eintrag ist `unbekannt` und liefert KEINEN Token', () => {
    expect(loeseEinzelToken('#art-99999', tokens)).toEqual({ token: null, unbekannt: '99999' });
  });

  it('ohne Artikel-Anker gibt es nichts zu melden', () => {
    expect(loeseEinzelToken('', tokens)).toEqual({ token: null, unbekannt: null });
    expect(loeseEinzelToken('#sek-3', tokens)).toEqual({ token: null, unbekannt: null });
  });
});

describe('(c) der Moduswechsel nimmt die LESESTELLE (PA-15-B01, E-D11-B03)', () => {
  it('Gesamtansicht → Einzel: die Lesestellung schlägt den Einstiegsanker der Adresse', () => {
    // `OR#art-97` geöffnet, bis Art. 200 gescrollt — Art. 200 ist der gelesene.
    expect(lesestelle('erlass', '97', '200', '1')).toBe('200');
  });

  it('Gesamtansicht ohne Lesestellung: Adresse, dann erster Artikel', () => {
    expect(lesestelle('erlass', '97', null, '1')).toBe('97');
    expect(lesestelle('erlass', null, null, '1')).toBe('1');
  });

  it('Einzelmodus: die ADRESSE ist massgebend, die Lesestellung nur Ersatz', () => {
    expect(lesestelle('artikel', '97', '200', '1')).toBe('97');
    expect(lesestelle('artikel', null, '200', '1')).toBe('200');
    expect(lesestelle('artikel', null, null, '1')).toBe('1');
  });

  it('kein Erlass geladen: kein Token statt eines erfundenen', () => {
    expect(lesestelle('artikel', null, null, null)).toBeNull();
  });
});

describe('(d) der Rückweg über den Gliederungspfad verlässt den Einzelmodus WIRKLICH (E-D12-B02)', () => {
  const OR = '/gesetze/bund/OR';

  it('Standard-Präferenz: die Adresse bleibt schlank, ohne Parameter', () => {
    expect(erlassAdresse(OR, '?ansicht=artikel', '337_c', 'erlass')).toBe(`${OR}#art-337_c`);
  });

  it('gemerkte Wahl «Einzelne Bestimmung»: die Adresse sagt ausdrücklich «erlass» (die Adresse schlägt die Präferenz)', () => {
    expect(erlassAdresse(OR, '?ansicht=artikel', '337_c', 'artikel')).toBe(`${OR}?ansicht=erlass#art-337_c`);
    expect(erlassAdresse(OR, '', '337_c', 'artikel')).toBe(`${OR}?ansicht=erlass#art-337_c`);
  });

  it('fremde Parameter bleiben', () => {
    expect(erlassAdresse(OR, '?q=zins&ansicht=artikel', '337_c', 'artikel')).toBe(`${OR}?q=zins&ansicht=erlass#art-337_c`);
  });
});

describe('(f) ein Klick auf eine Stufe der Gliederung führt im Einzelmodus zu ihrem ersten Artikel (PE-B10-B02)', () => {
  const snap = (artikel: string) => ({ id: `x-${artikel}`, artikel, artikelLabel: `Art. ${artikel}`, bloecke: [] }) as unknown as NormSnapshot;
  const sek = (id: string, artikel: NormSnapshot[], kinder: Sektion[] = []) =>
    ({ id, ebene: 1, label: id, artikel, kinder }) as unknown as Sektion;
  const baum = [
    sek('sek-1', [], [sek('sek-2', [snap('7'), snap('8')]), sek('sek-3', [snap('9')])]),
    sek('sek-4', []),
    sek('sek-5', [snap('20')]),
  ];

  it('eine Stufe mit eigenen Artikeln: ihr erster', () => {
    expect(ersterArtikelDerSektion(baum, 'sek-2')).toBe('7');
    expect(ersterArtikelDerSektion(baum, 'sek-5')).toBe('20');
  });

  it('eine Stufe ohne eigene Artikel: der erste ihrer Unterstufen', () => {
    expect(ersterArtikelDerSektion(baum, 'sek-1')).toBe('7');
  });

  it('eine Stufe ohne jeden Artikel und eine unbekannte Id liefern kein Ziel (§8: nichts erfinden)', () => {
    expect(ersterArtikelDerSektion(baum, 'sek-4')).toBeNull();
    expect(ersterArtikelDerSektion(baum, 'sek-99')).toBeNull();
  });
});

describe('(e) ein neuer Sprung verwirft die Timer des früheren (PE-B10-B03)', () => {
  /** Eine Uhr, die nur auf Befehl vorrückt — kein echtes Warten. */
  function falscheUhr() {
    let jetzt = 0;
    let zaehler = 0;
    const offen = new Map<number, { zeit: number; fn: () => void }>();
    const uhr: ZeitplanUhr = {
      rahmen: (fn) => { const id = ++zaehler; offen.set(id, { zeit: jetzt, fn }); return id; },
      rahmenAbbruch: (id) => { offen.delete(id); },
      zeit: (fn, ms) => { const id = ++zaehler; offen.set(id, { zeit: jetzt + ms, fn }); return id; },
      zeitAbbruch: (id) => { offen.delete(id); },
    };
    const vor = (ms: number) => {
      const ziel = jetzt + ms;
      for (;;) {
        const faellig = [...offen.entries()].filter(([, v]) => v.zeit <= ziel).sort((a, b) => a[1].zeit - b[1].zeit)[0];
        if (!faellig) break;
        offen.delete(faellig[0]);
        jetzt = Math.max(jetzt, faellig[1].zeit);
        faellig[1].fn();
      }
      jetzt = ziel;
    };
    return { uhr, vor, offen: () => offen.size };
  }

  it('ein einzelner Sprung läuft wie bisher: erster Scroll nach Frame + 110 ms, Korrektur 400 ms später', () => {
    const { uhr, vor } = falscheUhr();
    const zeitplan = erzeugeSprungZeitplan(uhr);
    const log: string[] = [];
    zeitplan.plane(() => log.push('erst'), () => log.push('danach'));
    vor(109);
    expect(log).toEqual([]);
    vor(1);
    expect(log).toEqual(['erst']);
    vor(399);
    expect(log).toEqual(['erst']);
    vor(1);
    expect(log).toEqual(['erst', 'danach']);
  });

  it('der zweite Sprung 200 ms später reisst die Ansicht nicht mehr zurück', () => {
    // Messreihe PE-B10 (VWVG, «Art. 10» dann «Art. 60»): 498 ms art-10 · 831 art-60 · 1018 art-10 —
    // der Korrektur-Scroll des ERSTEN Sprungs fiel nach dem zweiten.
    const { uhr, vor } = falscheUhr();
    const zeitplan = erzeugeSprungZeitplan(uhr);
    const log: string[] = [];
    zeitplan.plane(() => log.push('A erst'), () => log.push('A danach'));
    vor(200); // A hat seinen ersten Scroll hinter sich
    zeitplan.plane(() => log.push('B erst'), () => log.push('B danach'));
    vor(2000);
    expect(log).toEqual(['A erst', 'B erst', 'B danach']);
  });

  it('abbrechen (Unmount) lässt nichts mehr laufen', () => {
    const { uhr, vor, offen } = falscheUhr();
    const zeitplan = erzeugeSprungZeitplan(uhr);
    const log: string[] = [];
    zeitplan.plane(() => log.push('erst'), () => log.push('danach'));
    zeitplan.abbrechen();
    vor(2000);
    expect(log).toEqual([]);
    expect(offen()).toBe(0);
  });
});
