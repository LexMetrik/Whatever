// ─── Feiertags-Gegenprobe gegen date-holidays (QS-VERWENDEN V7) ───────────
//
// Reiner TEST — keine Änderung an src/data/schkgFeiertage.ts, src/data/
// zpoFeiertage.ts oder src/lib/datumsUtils.ts. Zweck: unabhängige Zweitquelle
// (npm-Paket `date-holidays`, ISC + CC-BY-3.0-Daten, kein amtliches Register
// — §7) gegen LexMetriks eigene Feiertagsformel (`istFeiertag`, Art. 142
// Abs. 3 ZPO) für die Jahre 2024–2027 und alle 26 Kantone gegenprüfen.
//
// Getrennt gehalten (Auftrag QS-VERWENDEN V7): «gesetzliche Feiertage»
// (dieser Test, Art. 142 Abs. 3 ZPO) vs. «Stillstandstage» (Art. 145 ZPO,
// Art. 56 SchKG) — ein Stillstands-/Betreibungsferien-Tag ist rechtlich KEIN
// Feiertag (istFeiertag bleibt für die meisten Stillstandstage bewusst
// false) und wird hier nicht gegen die Bibliothek geprüft; nur zur
// Information wird pro Abweichung mitgeloggt, ob der Tag in eine ZPO-
// Stillstands- oder SchKG-Betreibungsferien-Periode fällt.
//
// Vorgehen je (Kanton, Jahr): alle `type: 'public'`-Feiertage der Bibliothek
// gegen `istFeiertag` (Richtung Bibliothek → LexMetrik) UND alle Tage, an
// denen `istFeiertag` true liefert, gegen die Bibliothek (Richtung
// LexMetrik → Bibliothek). Jede nicht gelistete Abweichung ist ROT.
//
// Erstlauf-Befund (2.9.2026, 26 Kantone × 4 Jahre = 104 Kanton-Jahre):
// 469 Rohabweichungen, auf zwei generische Regeln (Sonntags-Duplikate;
// Bibliothek klassiert einen Tag nicht als «public», obwohl LexMetrik ihn
// nach der BJ-Liste als gesetzlichen Feiertag führt) und eine explizite,
// kommentierte Ausnahmeliste zurückgeführt. Eine Abweichung (Näfelser Fahrt
// GL 2027) bleibt ungeklärt — siehe test.skip unten.

import { describe, expect, it, test } from 'vitest';
import Holidays from 'date-holidays';
import { istFeiertag, ostersonntag, stillstandsperiodeFuer } from '../data/zpoFeiertage';
import { betreibungsperiodeFuer } from '../data/schkgFeiertage';
import type { Kanton } from '../types/legal';

const ALLE_KANTONE: Kanton[] = [
  'ZH', 'BE', 'LU', 'UR', 'SZ', 'OW', 'NW', 'GL', 'ZG', 'FR', 'SO', 'BS', 'BL',
  'SH', 'AR', 'AI', 'SG', 'GR', 'AG', 'TG', 'TI', 'VD', 'VS', 'NE', 'GE', 'JU',
];
const JAHRE = [2024, 2025, 2026, 2027];

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function tageDesJahres(jahr: number): Date[] {
  const tage: Date[] = [];
  let cur = new Date(jahr, 0, 1);
  const ende = new Date(jahr, 11, 31);
  while (cur <= ende) {
    tage.push(cur);
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
  }
  return tage;
}

// ─── Bibliothek: rohe Feiertagsliste je Kanton/Jahr (alle Typen, für die
// Rule-2-Prüfung unten) ──────────────────────────────────────────────────
type LibEintrag = { name: string; type: string };
function bibliotheksTage(kanton: Kanton, jahr: number): Map<string, LibEintrag[]> {
  const hd = new Holidays('CH', kanton);
  const byDay = new Map<string, LibEintrag[]>();
  for (const h of hd.getHolidays(jahr)) {
    const [datumTeil] = h.date.split(' ');
    const [y, m, d] = datumTeil.split('-').map(Number);
    const key = iso(new Date(y, m - 1, d));
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push({ name: h.name, type: h.type });
  }
  return byDay;
}

// ─── Ausnahmeliste: feste Kalendertage ─────────────────────────────────────
// Je Eintrag: Kanton, Tag (fix), Grund MIT Norm/Beleg — ausschliesslich aus
// den Kopfkommentaren und der FEIERTAGE-Datenstruktur in zpoFeiertage.ts
// (Doppelcheck 6.6.2026) hergeleitet, nichts aus dem Gedächtnis.
type FesteAusnahme = { kanton: Kanton; monat: number; tag: number; grund: string };
const AUSNAHMEN_FEST: FesteAusnahme[] = [
  {
    kanton: 'AI', monat: 12, tag: 8,
    grund: 'Bibliothekslücke: date-holidays kennt für AI am 8.12. (Mariä Empfängnis) keinen ' +
      'Eintrag jeglichen Typs. LexMetriks Eintrag folgt der FEIERTAGE-Kantonsliste in ' +
      'zpoFeiertage.ts (Mariä-Empfängnis-Kantone inkl. AI), verifiziert im Doppelcheck ' +
      '6.6.2026 gegen die BJ-Liste (Art. 142 Abs. 3 ZPO).',
  },
  {
    kanton: 'SG', monat: 1, tag: 2,
    grund: 'Bibliothekslücke: date-holidays kennt für SG am 2.1. (Berchtoldstag) keinen ' +
      'Eintrag jeglichen Typs. LexMetriks Eintrag folgt der FEIERTAGE-Kantonsliste ' +
      '(Doppelcheck 6.6.2026, zpoFeiertage.ts).',
  },
  {
    kanton: 'SO', monat: 3, tag: 19,
    grund: 'Bewusst weggelassen laut Kopfkommentar zpoFeiertage.ts: «SO-Josephstag/-Patrozinien ' +
      '(nur einzelne Gemeinden)» — kein kantonsweiter gesetzlicher Feiertag nach Art. 142 ' +
      'Abs. 3 ZPO.',
  },
  // SO 1.5.: Ausnahme bis 24.9.2026 («bewusst weggelassen, erst ab 12.00 Uhr»)
  // gestrichen — EG ZPO SO § 22 Abs. 2 (BGS 221.2) nennt den 1. Mai ganztags als
  // Feiertag für Art. 142 ZPO; LexMetrik und Bibliothek stimmen seit RL-22 überein
  // (R1-02, Sammelfreigabe W-05).
  {
    kanton: 'VS', monat: 5, tag: 1,
    grund: '1. Mai («Tag der Arbeit») gilt nach der FEIERTAGE-Kantonsliste in zpoFeiertage.ts ' +
      '(Doppelcheck 6.6.2026) nur für ZH/BS/BL/SH/TG/AG/JU/NE/TI — VS ist bewusst nicht ' +
      'darin enthalten.',
  },
  {
    kanton: 'VS', monat: 12, tag: 24,
    grund: 'Weihnachtsabend («Veille de Noël») ist kein gesetzlicher Feiertag nach der ' +
      'BJ-Liste (Art. 142 Abs. 3 ZPO) — die Bibliothek listet eine branchenübliche ' +
      'Ladenschluss-Konvention ohne Rechtsquelle.',
  },
  {
    kanton: 'GL', monat: 12, tag: 24,
    grund: 'Heiliger Abend ist kein gesetzlicher Feiertag nach der BJ-Liste (Art. 142 Abs. 3 ' +
      'ZPO) — die Bibliothek listet eine branchenübliche Konvention ohne Rechtsquelle.',
  },
  {
    kanton: 'GL', monat: 12, tag: 31,
    grund: 'Silvester ist kein gesetzlicher Feiertag nach der BJ-Liste (Art. 142 Abs. 3 ZPO) ' +
      '— die Bibliothek listet eine branchenübliche Konvention ohne Rechtsquelle.',
  },
];

// ─── Ausnahmeliste: osterbezogene Tage (Kanton-Ausschluss ist im FEIERTAGE-
// Array selbst dokumentiert: `kantone: ausser('NE')` bzw. die Fronleichnam-
// Kantonsliste ohne NE) ─────────────────────────────────────────────────
type OsterAusnahme = { kanton: Kanton; offset: number; grund: string };
const AUSNAHMEN_OSTERN: OsterAusnahme[] = [
  {
    kanton: 'NE', offset: 1,
    grund: 'Ostermontag ist in zpoFeiertage.ts FEIERTAGE ausdrücklich `kantone: ausser(\'NE\')` ' +
      '— NE ist bewusst ausgenommen (RSN 941.02 Art. 3); die Bibliothek führt «Lundi de Pâques» ' +
      'für NE dennoch als public. Seit RL-22 (24.9.2026) ist der NE-Ostermontag in Jahren mit ' +
      'amtlich publizierter Schliesstagsliste (LI-CPC Art. 10a, bisher 2026) Feiertag — dort ' +
      'stimmen beide Quellen überein, die Ausnahme greift nur noch für die übrigen Jahre.',
  },
  {
    kanton: 'NE', offset: 60,
    grund: 'Fronleichnam («la Fête-Dieu») ist in zpoFeiertage.ts FEIERTAGE nicht in der ' +
      'Fronleichnam-Kantonsliste enthalten (kein NE); die Bibliothek führt ihn für NE ' +
      'dennoch als public.',
  },
];

// ─── Ausnahme: Stephanstag UR/AR — die Bibliothek date-holidays prüft den
// Wochentag des 26.12. selbst, mit kantonal unterschiedlichen Ausschlusstagen
// (Rule laut Bibliotheksdaten: UR «12-26 not on monday, friday», AR «12-26
// not on monday»).
//  - AR: LexMetrik prüft den Wochentag von Weihnachten (25.12.) nach V ArG AR
//    822.11 Art. 7 («nicht gefeiert, wenn der 1. Weihnachtstag auf einen Montag
//    oder Freitag fällt», Stand 1.1.2016) — gleiche Rechtsidee, anderer Bezugstag.
//  - UR: seit RL-22 (24.9.2026, R1-03, Sammelfreigabe W-05) führt LexMetrik den
//    Stephanstag UNBEDINGT (Ruhetagsgesetz UR Art. 9 lit. b, RB 70.1421: «…
//    Weihnachten und Sankt-Stefans-Tag» ohne Vorbehalt). Die Bibliotheksregel
//    hat dafür keine Rechtsgrundlage; Abweichung z.B. UR 26.12.2025 (Fr).
//    Vorher (bis 24.9.2026) begründet mit dem BJ-Fn.-1-Vorbehalt im Code.
function istStephanstagBezugstagAusnahme(kanton: Kanton, monat: number, tag: number): boolean {
  return (kanton === 'UR' || kanton === 'AR') && monat === 12 && tag === 26;
}

// ─── Näfelser Fahrt GL 2027: amtlich verifiziert (Beleg 5.9.2026)
// ────────────────────────────────────────────────────────────────────────
// gl.ch: «Am ersten Donnerstag im April (ausser er falle in die Karwoche)»
// (https://www.gl.ch/portrait/naefelser-fahrt.html/207, abgerufen 5.9.2026).
// Ostersonntag 2027 = 28.3.2027 ⇒ Karwoche 21.–27.3.2027, Gründonnerstag
// 25.3.2027. Der erste Donnerstag im April 2027 ist der 1.4. — er liegt
// NICHT in der Karwoche und ist nicht der Gründonnerstag ⇒ keine
// Verschiebung, 1.4.2027 bleibt amtlich richtig. LexMetriks Formel
// (naefelserFahrt in zpoFeiertage.ts: erster Donnerstag im April, verschoben
// um eine Woche NUR wenn er auf den Gründonnerstag fällt) prüft genau diese
// gl.ch-Regel und liefert damit die amtlich korrekte Antwort — geprüft direkt
// gegen `istFeiertag`, nicht gegen die Bibliothek. Die Bibliothek
// date-holidays weicht für 2027 ab (eigene Regel «Thursday after 04-02»,
// s. deren `rule`-Feld) und berechnet 8.4.2027 — ein Bibliotheksfehler, kein
// LexMetrik-Fehler; bleibt darum als bekannte, begründete Abweichung in
// NAEFELSER_FAHRT_2027_UNGEKLAERT_DATEN gelistet (Gegenprobe unten bleibt grün).
test('Näfelser Fahrt GL 2027: LexMetrik berechnet amtlich korrekt den 1.4.2027 (nicht 8.4., Bibliotheksfehler)', () => {
  expect(istFeiertag(new Date(2027, 3, 1), 'GL')).toBe(true);
  expect(istFeiertag(new Date(2027, 3, 8), 'GL')).toBe(false);
});
// Beide Richtungen derselben ungeklärten Abweichung: die Bibliothek nennt
// den 8.4.2027 (NUR_BIBLIOTHEK), LexMetriks Formel den 1.4.2027
// (NUR_LEXMETRIK) — ein und derselbe offene Punkt, von beiden Seiten aus
// betrachtet.
const NAEFELSER_FAHRT_2027_UNGEKLAERT_DATEN = new Set(['GL|2027-04-08', 'GL|2027-04-01']);
function istNaefelserFahrt2027Ungeklaert(kanton: Kanton, datum: string): boolean {
  return NAEFELSER_FAHRT_2027_UNGEKLAERT_DATEN.has(`${kanton}|${datum}`);
}

// ─── Ausnahme: NE-Schliesstage (RL-22, 24.9.2026, R1-04, Entscheid W-10 a) ──
// LI-CPC NE Art. 10a (RSN 251.1): Tage, an denen die Kantonsverwaltung mind.
// halbtags geschlossen ist, gelten als Feiertag für Art. 142 ZPO. zpoFeiertage.ts
// führt sie je Jahr mit amtlich publizierter Liste (NE_SCHLIESSTAGE, bisher 2026;
// Quelle ne.ch «Jours fériés officiels», laut Zweitprüfung V8 abgerufen
// 23.9.2026). date-holidays kennt keine Verwaltungsschliesstage — Abweichung
// NUR_LEXMETRIK ist daher begründet; nur die hier gelisteten Einzeldaten.
const NE_SCHLIESSTAG_AUSNAHMEN = new Set(['NE|2026-05-15', 'NE|2026-12-24', 'NE|2026-12-31']);
function istNeSchliesstagAusnahme(kanton: Kanton, datum: string): boolean {
  return NE_SCHLIESSTAG_AUSNAHMEN.has(`${kanton}|${datum}`);
}

function findeFesteAusnahme(kanton: Kanton, monat: number, tag: number): FesteAusnahme | undefined {
  return AUSNAHMEN_FEST.find((a) => a.kanton === kanton && a.monat === monat && a.tag === tag);
}
function findeOsterAusnahme(kanton: Kanton, datum: Date, jahr: number): OsterAusnahme | undefined {
  const o = ostersonntag(jahr);
  return AUSNAHMEN_OSTERN.find((a) => {
    if (a.kanton !== kanton) return false;
    const erwartet = new Date(o.getFullYear(), o.getMonth(), o.getDate() + a.offset);
    return iso(erwartet) === iso(datum);
  });
}

type Abweichung = {
  richtung: 'NUR_BIBLIOTHEK' | 'NUR_LEXMETRIK';
  kanton: Kanton;
  jahr: number;
  datum: string;
  bibliotheksName: string;
  stillstand: string;
  betreibung: string;
  begruendet: boolean;
  grund: string;
};

const alleAbweichungen: Abweichung[] = [];
const ungelisteteRoteAbweichungen: Abweichung[] = [];

for (const kanton of ALLE_KANTONE) {
  for (const jahr of JAHRE) {
    const bibTage = bibliotheksTage(kanton, jahr);
    const bibPublicTage = new Map<string, string>();
    for (const [key, entries] of bibTage) {
      const pub = entries.find((e) => e.type === 'public');
      if (pub) bibPublicTage.set(key, pub.name);
    }

    // Richtung 1: Bibliothek (public) → LexMetrik
    for (const [key, name] of bibPublicTage) {
      const [y, m, d] = key.split('-').map(Number);
      const datum = new Date(y, m - 1, d);
      if (istFeiertag(datum, kanton)) continue; // Übereinstimmung

      // Generische Regel: Sonntags-Duplikat — ein Sonntag ist über Art. 142
      // Abs. 1 ZPO / isWeekend ohnehin arbeitsfrei; die BJ-Liste (Art. 142
      // Abs. 3 ZPO) muss ihn nicht separat als «anerkannten Feiertag»
      // führen. Betrifft strukturell immer nur Sonntagsfeiertage der
      // Bibliothek (Ostersonntag/Pâques/Pasqua, Pfingstsonntag/Pentecôte/
      // Pentecoste, Eidg. Dank-, Buss- und Bettag/Jeûne fédéral).
      if (datum.getDay() === 0) continue;

      const fest = findeFesteAusnahme(kanton, m, d);
      const oster = findeOsterAusnahme(kanton, datum, jahr);
      const stephanstag = istStephanstagBezugstagAusnahme(kanton, m, d);
      const istNaefelserFahrt2027 = istNaefelserFahrt2027Ungeklaert(kanton, key);

      const grund = fest?.grund ?? oster?.grund ??
        (stephanstag ? 'Stephanstag UR/AR: Bibliotheksregel ohne Rechtsgrundlage (UR) bzw. anderer Bezugstag (AR) — siehe Kommentar oben.' : '');
      const begruendet = Boolean(fest || oster || stephanstag);

      const eintrag: Abweichung = {
        richtung: 'NUR_BIBLIOTHEK', kanton, jahr, datum: key, bibliotheksName: name,
        stillstand: stillstandsperiodeFuer(datum)?.key ?? '-',
        betreibung: betreibungsperiodeFuer(datum)?.key ?? '-',
        begruendet, grund,
      };
      alleAbweichungen.push(eintrag);
      if (!begruendet && !istNaefelserFahrt2027) ungelisteteRoteAbweichungen.push(eintrag);
    }

    // Richtung 2: LexMetrik → Bibliothek
    for (const datum of tageDesJahres(jahr)) {
      if (!istFeiertag(datum, kanton)) continue;
      const key = iso(datum);
      if (bibPublicTage.has(key)) continue; // Übereinstimmung

      const [, mStr, dStr] = key.split('-');
      const m = Number(mStr);
      const d = Number(dStr);

      // Generische Regel: die Bibliothek hat einen Eintrag an diesem Tag,
      // klassiert ihn aber nicht als «public» (optional/bank/observance).
      // date-holidays' public/optional-Unterscheidung folgt keiner
      // Schweizer Rechtsquelle; LexMetrik folgt der BJ-Liste (Art. 142
      // Abs. 3 ZPO, Kopfkommentar zpoFeiertage.ts, Doppelcheck 6.6.2026).
      // Ein «optional/bank»-Typ der Bibliothek widerspricht damit nicht
      // LexMetriks stärkerer, gesetzlich begründeter Einordnung.
      const bibEintraege = bibTage.get(key) ?? [];
      if (bibEintraege.length > 0 && bibEintraege.every((e) => e.type !== 'public')) continue;

      const fest = findeFesteAusnahme(kanton, m, d);
      const oster = findeOsterAusnahme(kanton, datum, jahr);
      const stephanstag = istStephanstagBezugstagAusnahme(kanton, m, d);
      const istNaefelserFahrt2027 = istNaefelserFahrt2027Ungeklaert(kanton, key);
      const neSchliesstag = istNeSchliesstagAusnahme(kanton, key);

      const grund = fest?.grund ?? oster?.grund ??
        (stephanstag ? 'Stephanstag UR/AR: Bibliotheksregel ohne Rechtsgrundlage (UR) bzw. anderer Bezugstag (AR) — siehe Kommentar oben.' : null) ??
        (neSchliesstag ? 'NE-Schliesstag nach LI-CPC Art. 10a (RSN 251.1) — siehe Kommentar oben.' : '');
      const begruendet = Boolean(fest || oster || stephanstag || neSchliesstag);

      const eintrag: Abweichung = {
        richtung: 'NUR_LEXMETRIK', kanton, jahr, datum: key, bibliotheksName: bibEintraege[0]?.name ?? '(kein Eintrag)',
        stillstand: stillstandsperiodeFuer(datum)?.key ?? '-',
        betreibung: betreibungsperiodeFuer(datum)?.key ?? '-',
        begruendet, grund,
      };
      alleAbweichungen.push(eintrag);
      if (!begruendet && !istNaefelserFahrt2027) ungelisteteRoteAbweichungen.push(eintrag);
    }
  }
}

describe('Feiertags-Gegenprobe gegen date-holidays (2024–2027, 26 Kantone)', () => {
  it('Untergrenze: die Gegenprobe hat tatsächlich Kanton-Jahre geprüft (Leerlauf-Grün-Falle)', () => {
    expect(ALLE_KANTONE.length).toBe(26);
    expect(alleAbweichungen.length).toBeGreaterThan(0);
  });

  it('Erstlauf-Tabelle: alle Abweichungen (begründet und unbegründet)', () => {
    // Wird immer ausgegeben (auch bei grün) — Beleg für den Erstlauf-Befund.
    const zeilen = alleAbweichungen
      .sort((a, b) => a.kanton.localeCompare(b.kanton) || a.datum.localeCompare(b.datum))
      .map((a) =>
        `${a.begruendet ? 'OK ' : 'ROT'} | ${a.richtung.padEnd(14)} | ${a.kanton} | ${a.datum} | ` +
        `Bibliothek="${a.bibliotheksName}" | Stillstand=${a.stillstand} | Betreibung=${a.betreibung}`,
      );
    console.log(
      `\nKanton | Datum | Bibliothek | LexMetrik — ${alleAbweichungen.length} Abweichungen ` +
      `(${alleAbweichungen.filter((a) => a.begruendet).length} begründet):\n${zeilen.join('\n')}`,
    );
    expect(zeilen.length).toBe(alleAbweichungen.length);
  });

  it('jede Abweichung ist entweder begründet (Ausnahmeliste) oder die bekannte, ungeklärte Näfelser-Fahrt-2027-Lücke — sonst ROT', () => {
    if (ungelisteteRoteAbweichungen.length > 0) {
      const detail = ungelisteteRoteAbweichungen
        .map((a) => `${a.richtung} ${a.kanton} ${a.datum} (Bibliothek: "${a.bibliotheksName}")`)
        .join('\n');
      throw new Error(`Nicht gelistete Feiertags-Abweichung(en) — §7-Prüfauftrag, keine Auto-Korrektur:\n${detail}`);
    }
    expect(ungelisteteRoteAbweichungen).toEqual([]);
  });
});
