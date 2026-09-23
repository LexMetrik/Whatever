// ─── B4: Facetten-Auswahl der Bezüge — reine Auswahl-/Abbildungslogik ────────
//
// W2·7-BEZUG/B4. Geprüft wird, was NICHT über eine Momentaufnahme der
// Oberfläche prüfbar ist: die Weiche «schlanker vs. grosser Shard», die
// Ordnung der Auswahl, die Kanton-Achse (der teuerste Denkfehler, s. u.) und
// die Vollständigkeit der Label-Tabellen.

import { describe, it, expect } from 'vitest';
import {
  BEDIENBARE_KLASSEN, DEFAULT_KLASSEN, KLASSE_KURZ, KLASSE_SCHALTER,
  istEingegrenzt, normalisiereKlassen, normalisiereKantone, schalteKlasse,
  schalteKanton, waehleBezuege, bauePraedikate, type WaehlbareKante,
} from '../pages/gesetz-leser/bezugAuswahl';
import { STATUS_LABEL, type BezugStatus } from '../lib/verzahnung/facetten';
import { filtereBezuege, type Bezug } from '../lib/rechtsprechung/bezuege';

function kante(key: string, status: BezugStatus, kanton: string): Bezug {
  return {
    key,
    zitierung: key,
    regesteKurz: null,
    datum: '2020-01-01',
    gewicht: null,
    facetten: {
      quelltyp: 'rechtsprechung',
      ebene: kanton === 'CH' ? 'bund' : 'kanton',
      kanton,
      gericht: status,
      status,
    },
  };
}

// FACHLICHE ÄNDERUNG (deklariert, §6.3): bis S6-W1b hielt dieser Block den
// Grundzustand «nur Leitentscheide» fest. Entscheid David 23.9.2026 («zuerst bge
// aber nur die 5 neusten und dann kantonal jeweils 5 und dann der rest»): der
// Reiter zeigt ohne Filtereingriff ALLE Instanzen, die Ordnung und Portion
// leistet die Anzeige. Die Aussage «Grundzustand ≠ Abweichung» bleibt geprüft.
describe('B4 · Default und Weiche', () => {
  it('Grundeinstellung ist ALLE bedienbaren Instanzen (Entscheid David 23.9.2026)', () => {
    expect([...DEFAULT_KLASSEN]).toEqual(['bge', 'bger', 'eidg', 'kantonal']);
  });

  it('Grundzustand ist NICHT eingegrenzt — auch in anderer Reihenfolge', () => {
    expect(istEingegrenzt(DEFAULT_KLASSEN)).toBe(false);
    expect(istEingegrenzt(['kantonal', 'bge', 'eidg', 'bger'])).toBe(false);
  });

  it('jede Abweichung vom Grundzustand ist eingegrenzt — auch «nur bge»', () => {
    expect(istEingegrenzt(['bge'])).toBe(true);
    expect(istEingegrenzt(['bge', 'kantonal'])).toBe(true);
    expect(istEingegrenzt(['kantonal'])).toBe(true);
    expect(istEingegrenzt([])).toBe(true);
  });
});

describe('B4 · Normalisierung', () => {
  it('ordnet nach deklariertem Status-Rang, nicht nach Klick-Reihenfolge (§2)', () => {
    expect(normalisiereKlassen(['kantonal', 'bge', 'eidg', 'bger']))
      .toEqual(['bge', 'bger', 'eidg', 'kantonal']);
  });

  it('wirft Unbekanntes und Doppeltes weg', () => {
    expect(normalisiereKlassen(['bge', 'bge', 'quatsch', 42, null]))
      .toEqual(['bge']);
  });

  it('«material» ist NICHT bedienbar, solange der Korpus keine Materialien trägt (§13 F4)', () => {
    expect(BEDIENBARE_KLASSEN).not.toContain('material');
    expect(normalisiereKlassen(['material'])).toEqual([]);
  });

  it('setzt die LEERE Auswahl nicht still auf den Default zurück (§8)', () => {
    // «alles abgewählt» ist eine Nutzerabsicht; die Zeile weist sie sichtbar aus,
    // statt heimlich wieder Leitentscheide einzublenden.
    expect(normalisiereKlassen([])).toEqual([]);
  });

  it('Kantone: nur ISO-Kürzel, dedupliziert, alphabetisch', () => {
    expect(normalisiereKantone(['ZH', 'BS', 'ZH', 'ch', 'B', 'BERN', 7])).toEqual(['BS', 'ZH']);
  });
});

describe('B4 · Schalten', () => {
  it('schaltet eine Klasse an und wieder aus, immer normalisiert', () => {
    const auf = schalteKlasse(['bge'], 'kantonal');
    expect(auf).toEqual(['bge', 'kantonal']);
    expect(schalteKlasse(auf, 'kantonal')).toEqual(['bge']);
  });

  it('schaltet einen Kanton an und wieder aus', () => {
    expect(schalteKanton([], 'BS')).toEqual(['BS']);
    expect(schalteKanton(['BS', 'ZH'], 'BS')).toEqual(['ZH']);
  });
});

describe('B4 · Abbildung auf die Datenschicht-Auswahl', () => {
  const kanten: Bezug[] = [
    kante('bge_1', 'bge', 'CH'),
    kante('bger_1', 'bger', 'CH'),
    kante('eidg_1', 'eidg', 'CH'),
    kante('bs_1', 'kantonal', 'BS'),
    kante('zh_1', 'kantonal', 'ZH'),
  ];

  it('ohne Kantons-Wahl filtert nur die Status-Achse', () => {
    const aus = waehleBezuege(kanten, ['bge', 'kantonal'], []);
    expect(aus.map((b) => b.key)).toEqual(['bge_1', 'bs_1', 'zh_1']);
  });

  it('der Kantons-Schnitt wirkt INNERHALB der kantonalen Klasse und löscht die Bundes-Kanten NICHT', () => {
    // Der teure Denkfehler, gegen den dieser Test steht: ein
    // Bundesgerichtsentscheid trägt kanton:'CH'. Würde die Kantons-Achse naiv
    // gesetzt, verschwände bei «nur BS» die gesamte bundesgerichtliche Praxis —
    // ein Filter für die kantonale Ebene hätte die Bundesebene gelöscht (§1).
    const aus = waehleBezuege(kanten, ['bge', 'bger', 'kantonal'], ['BS']);
    expect(aus.map((b) => b.key)).toEqual(['bge_1', 'bger_1', 'bs_1']);
  });

  it('eine Kantons-Wahl ohne kantonale Klasse schneidet gar nichts', () => {
    const aus = waehleBezuege(kanten, ['bge'], ['BS']);
    expect(aus.map((b) => b.key)).toEqual(['bge_1']);
  });

  it('LEERE Auswahl zeigt NICHTS — nicht alles (reproduzierter Befund 28.7.2026)', () => {
    // Die Datenschicht liest eine leere Achse als «keine Einschränkung»; naiv
    // durchgereicht zeigte das Abwählen der letzten Klasse plötzlich ALLES.
    // Erst der Fehlschlag, dann der Fix (§0-2) — `waehleBezuege` deutet die
    // leere Bedien-Auswahl richtig, ohne die Datenschicht anzufassen.
    expect(filtereBezuege(kanten, { status: new Set([]) })).toHaveLength(5); // die Konvention
    expect(waehleBezuege(kanten, [], [])).toEqual([]);                      // die Bedienung
  });
});

describe('B4 · Label-Tabellen bleiben vollständig', () => {
  // Beide Tabellen leben NEBEN dem massgeblichen STATUS_LABEL (facetten.ts).
  // Dieser Test ist der Grund, warum sie nicht auseinanderlaufen: eine neue
  // Status-Klasse muss überall eintreffen, sonst rendert die Gruppe «undefined».
  for (const k of BEDIENBARE_KLASSEN) {
    it(`«${k}» hat Kurz-, Schalter- und ausgeschriebenes Label`, () => {
      expect(KLASSE_KURZ[k]).toBeTruthy();
      expect(KLASSE_SCHALTER[k]).toBeTruthy();
      expect(STATUS_LABEL[k]).toBeTruthy();
    });
  }

  it('§7-Wortfeld: kein «geprüft»/«verifiziert» in einem Nutzertext dieser Schicht', () => {
    const texte = [...Object.values(KLASSE_KURZ), ...Object.values(KLASSE_SCHALTER)];
    for (const t of texte) expect(t).not.toMatch(/gepr(ü|ue)ft|verifiziert|gegengepr/i);
  });
});

describe('B4 · Andockpunkt für B5 (Datums-Bereichsfilter)', () => {
  // Vorgabe David 28.7.2026: die Zeit-Filterung baut B5 zentral (Von-Bis-Datum),
  // NICHT B4. Dieser Test hält nur die Struktur fest, auf die B5 sich verlassen
  // darf — eine offene Prädikat-Liste statt fester Einzelchecks. Er baut den
  // Datumsfilter NICHT, er zeigt, dass er ohne Umbau andocken kann.
  const kanten: Bezug[] = [
    kante('alt', 'bge', 'CH'),
    kante('neu', 'bge', 'CH'),
  ];
  kanten[0].datum = '1999-01-01';
  kanten[1].datum = '2024-06-01';

  it('bauePraedikate liefert eine erweiterbare Liste, nicht einen festen Block', () => {
    const p = bauePraedikate(['bge'], []);
    expect(Array.isArray(p)).toBe(true);
    expect(p.length).toBeGreaterThan(0);
  });

  it('ein zusätzliches Prädikat greift, ohne dass eine bestehende Funktion sich ändert', () => {
    const p = [...bauePraedikate(['bge'], []), (k: WaehlbareKante) => (k.datum ?? '') >= '2020-01-01'];
    expect(kanten.filter((b) => p.every((f) => f(b))).map((b) => b.key)).toEqual(['neu']);
  });

  it('die Kante trägt `datum` schon im Auswahl-Vertrag', () => {
    const k: WaehlbareKante = kanten[0];
    expect(k.datum).toBe('1999-01-01');
  });
});
