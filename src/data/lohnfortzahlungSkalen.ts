import type { Skala, Kanton } from '../types/legal';
import { formatSkalaDauer } from '../lib/datumsUtils';

// ─── Lohnfortzahlungsskalen ───────────────────────────────────────────────
//
// WICHTIG: Diese Werte sind GERICHTSPRAXIS zur Konkretisierung von Art. 324a
// Abs. 2 OR («angemessen längere Zeit»), KEINE Gesetzesnormen und für die
// Gerichte nicht verbindlich (SHK Art. 324a N 50).
// Vor Produktiveinsatz gegen aktuelle kantonale Praxis abzugleichen.
// Stand der Tabellen: Gerichtspraxis, mehrheitlich anerkannte Werte.
// Alle Einträge sind als «zu verifizieren» zu behandeln.
//
// §2.5: Aus der vorliegenden SECO-/SHK-Tabelle (Seite 232, bis 11. DJ abgedruckt)
// belegt ist die ZUORDNUNG nur für: Basel BS/BL, Zürich ZH/GR, Bern BE/AG/OW/SG +
// Westschweiz. Weitere Kantone (SH, TG, ZG sowie übrige Berner-Skala-Kantone) sind
// eine ANNAHME des Tools (verifiziert: false) und werden mit Warnhinweis versehen.
// Basler und Zürcher Skala: Fortschreibungen über das 11. Dienstjahr hinaus sind
// aus der Quelle nicht belegt.
//
// RL-25 (W2·30-RL-W2A, Befund Q6/S3b-b, 24.9.2026): Werte der Berner Skala
// 1.–19. Dienstjahr nach der einzigen amtlichen Wiedergabe durch die Berner
// Justiz — Obergericht des Kantons Bern, Zivil- und Strafgerichtsbarkeit,
// Themenseite «Krankheit» (undatiert), abgerufen 24.9.2026:
// https://www.zsg.justice.be.ch/de/start/themen/zivilrecht/arbeitsrecht/krankheit.html
//   1. DJ 3 Wochen · 2. DJ 1 Monat · 3.–4. DJ 2 Monate · 5.–9. DJ 3 Monate ·
//   10.–14. DJ 4 Monate · 15.–19. DJ 5 Monate. Die Tabelle endet beim 19. DJ.
// Vorher (seit Erstbau): 10.–11. DJ 4, 12.–16. DJ 5, ab 17. DJ 6 Monate — in
// DJ 12–14 und 17–19 je 1 Monat zu hoch.
// Ab dem 20. DJ: 6 Monate als FORTSCHREIBUNG nach Behördenangaben (nicht vom
// Obergericht BE belegt), je abgerufen 24.9.2026:
//   Arbeitsamt AI https://www.ai.ch/themen/wirtschaft-und-arbeit/arbeit/arbeitsvertragsrecht
//     («20. bis 24. Dienstjahr - 6 Monate», «danach alle 5 Dienstjahre - 1 Monat zusätzlich»);
//   DGEM VD, FAQ droit du travail (PDF vom 24.6.2026) S. 17
//     https://www.vd.ch/fileadmin/user_upload/themes/economie_emploi/emploi/fichiers_pdf/FAQ-droit_du_travail-DGEM_01.pdf
//     («20e à 24e année six mois etc.»);
//   Kanton NE https://www.ne.ch/themes/economie-et-emploi/chomage/licenciement-ou-perte-dun-emploi
//     («6 mois après 20 ans», keine weitere Stufe).
// Ab dem 25. DJ sind die Angaben uneinheitlich (AI: +1 Monat je 5 DJ; NE: 6).
// Entscheid W-13 (David 24.9.2026 «nach Empfehlung»): 6 Monate fest, Alternative
// offenlegen (skalaHinweise unten). Nidwalden: Merkblatt «Lohnzahlung» des
// Arbeitsamts NW vom 7.4.2017 https://www.nw.ch/_docn/91122/Merkblatt_Lohnzahlung_.pdf
// nennt die «Berner Skala», zeigt aber die Werte der Basler Skala (2.–3. DJ 2 Mt,
// 4.–10. 3 Mt, 11.–15. 4 Mt, 16.–20. 5 Mt, ab 21. 6 Mt) → W-13: NW bleibt bei
// der Berner Skala, mit Warnung bis zur Klärung durch das Arbeitsamt NW.

const SKALA_BASEL: Skala = {
  name: 'Basler Skala',
  kantone: ['BS', 'BL'],
  quellenhinweis:
    'Gerichtspraxis Basel-Stadt/Basel-Landschaft. ' +
    'Werte vor Produktiveinsatz gegen aktuelle kantonale Praxis abzugleichen.',
  eintraege: [
    { dienstjahrVon: 1, dienstjahrBis: 1,  dauer: { typ: 'wochen', anzahl: 3 } },
    { dienstjahrVon: 2, dienstjahrBis: 3,  dauer: { typ: 'monate', anzahl: 2 } },
    { dienstjahrVon: 4, dienstjahrBis: 10, dauer: { typ: 'monate', anzahl: 3 } },
    { dienstjahrVon: 11, dienstjahrBis: 15, dauer: { typ: 'monate', anzahl: 4 } },
    { dienstjahrVon: 16, dienstjahrBis: 20, dauer: { typ: 'monate', anzahl: 5 } },
    { dienstjahrVon: 21, dienstjahrBis: null, dauer: { typ: 'monate', anzahl: 6 } },
  ],
};

const SKALA_BERN: Skala = {
  name: 'Berner Skala',
  kantone: [
    'BE', 'AG', 'AI', 'AR', 'FR', 'GE', 'GL', 'JU', 'LU', 'NE',
    'NW', 'OW', 'SG', 'SO', 'SZ', 'TI', 'UR', 'VD', 'VS',
  ],
  quellenhinweis:
    'Berner Skala: Werte 1.–19. Dienstjahr gemäss Tabelle Obergericht des Kantons Bern ' +
    '(zsg.justice.be.ch, Themenseite «Krankheit», undatiert, abgerufen 24.9.2026); ab dem 20. Dienstjahr ' +
    'Fortschreibung nach Angaben kantonaler Behörden (AI, VD, NE). Gerichtspraxis, keine Rechtsnorm.',
  eintraege: [
    { dienstjahrVon: 1,  dienstjahrBis: 1,  dauer: { typ: 'wochen', anzahl: 3 } },
    { dienstjahrVon: 2,  dienstjahrBis: 2,  dauer: { typ: 'monate', anzahl: 1 } },
    { dienstjahrVon: 3,  dienstjahrBis: 4,  dauer: { typ: 'monate', anzahl: 2 } },
    { dienstjahrVon: 5,  dienstjahrBis: 9,  dauer: { typ: 'monate', anzahl: 3 } },
    { dienstjahrVon: 10, dienstjahrBis: 14, dauer: { typ: 'monate', anzahl: 4 } },
    { dienstjahrVon: 15, dienstjahrBis: 19, dauer: { typ: 'monate', anzahl: 5 } },
    // Fortschreibung (AI/VD/NE), ab DJ 25 fest 6 Monate (W-13) — siehe skalaHinweise.
    { dienstjahrVon: 20, dienstjahrBis: null, dauer: { typ: 'monate', anzahl: 6 } },
  ],
};

const SKALA_ZUERICH: Skala = {
  name: 'Zürcher Skala',
  // ZG/GR: Zuordnung unsicher, separater Warnhinweis wird generiert
  kantone: ['ZH', 'SH', 'TG', 'ZG', 'GR'],
  quellenhinweis:
    'Zürcher Skala. ZG/GR: Zuordnung zu verifizieren. ' +
    'Werte vor Produktiveinsatz gegen aktuelle kantonale Praxis abzugleichen.',
  eintraege: [
    { dienstjahrVon: 1,  dienstjahrBis: 1,  dauer: { typ: 'wochen', anzahl: 3 } },
    { dienstjahrVon: 2,  dienstjahrBis: 2,  dauer: { typ: 'wochen', anzahl: 8 } },
    // Ab 3. DJ: +1 Woche je weiteres Dienstjahr (9, 10, 11 …)
    // Gespeichert als Einträge bis DJ 52 (praktische Obergrenze)
    ...Array.from({ length: 50 }, (_, i) => ({
      dienstjahrVon: i + 3,
      dienstjahrBis: i + 3,
      dauer: { typ: 'wochen' as const, anzahl: 9 + i },
    })),
  ],
};

const ALLE_SKALEN: Skala[] = [SKALA_BASEL, SKALA_ZUERICH, SKALA_BERN];

export function skaleFuerKanton(kanton: Kanton): { skala: Skala; warnung?: string } {
  const skala = ALLE_SKALEN.find((s) => (s.kantone as string[]).includes(kanton));
  if (!skala) {
    return { skala: SKALA_BERN, warnung: `Für Kanton ${kanton} keine spezifische Skala hinterlegt; Berner Skala als Näherung verwendet. Zuordnung zu verifizieren.` };
  }
  const warnung =
    kanton === 'ZG' || kanton === 'GR'
      ? `Kanton ${kanton}: Zuordnung zur Zürcher Skala in der Praxis uneinheitlich. Bitte aktuelle kantonale Praxis prüfen.`
      : undefined;
  return { skala, warnung };
}

// Bis zu welchem Dienstjahr die Werte der jeweiligen Skala aus der hinterlegten
// Quelle belegt sind (darüber: Fortschreibung, offengelegt).
const BELEGT_BIS: ReadonlyMap<Skala, { dienstjahr: number; quelle: string }> = new Map([
  [SKALA_BASEL, { dienstjahr: 11, quelle: 'SECO-/SHK-Tabelle (nur bis 11. DJ abgedruckt)' }],
  [SKALA_ZUERICH, { dienstjahr: 11, quelle: 'SECO-/SHK-Tabelle (nur bis 11. DJ abgedruckt)' }],
  [SKALA_BERN, { dienstjahr: 19, quelle: 'Tabelle des Obergerichts des Kantons Bern (nur bis 19. DJ)' }],
]);

// Fortschreibung Arbeitsamt AI ab dem 25. DJ: «danach alle 5 Dienstjahre - 1 Monat
// zusätzlich» (25.–29. DJ 7, 30.–34. DJ 8 Monate …). Nur offengelegt, nicht gerechnet (W-13).
function berneAlternativeMonate(dienstjahr: number): number {
  return 6 + Math.floor((dienstjahr - 20) / 5);
}

/**
 * Offenlegungen zur Skala-Herkunft (§8) für ein konkretes Dienstjahr:
 * Beleggrenze der Quelle, Fortschreibung der Berner Skala ab dem 20. DJ, die
 * abweichende Fortschreibung ab dem 25. DJ (W-13) und der Nidwaldner Widerspruch
 * (W-13). `rechenwegZusatz` ergänzt den Satz «Skala-Dauer ablesen».
 */
export function skalaHinweise(
  kanton: Kanton,
  skala: Skala,
  dienstjahr: number,
): { warnungen: string[]; rechenwegZusatz: string } {
  const warnungen: string[] = [];
  let rechenwegZusatz = '';
  const beleg = BELEGT_BIS.get(skala);
  if (beleg && dienstjahr > beleg.dienstjahr) {
    if (skala === SKALA_BERN) {
      warnungen.push(
        `Für das ${dienstjahr}. Dienstjahr ist der Wert eine Fortschreibung: Die Tabelle des Obergerichts des Kantons Bern ` +
          `endet beim 19. Dienstjahr. 6 Monate ab dem 20. Dienstjahr stützen sich auf Angaben kantonaler Behörden ` +
          `(Kantone AI, VD und NE), nicht auf die Berner Gerichte (verifiziert: false). Kantonale Praxis prüfen.`,
      );
      rechenwegZusatz = ` – Fortschreibung über das 19. DJ hinaus (Behördenangaben AI/VD/NE), vom Obergericht BE nicht belegt`;
      if (dienstjahr >= 25) {
        const alt = berneAlternativeMonate(dienstjahr);
        warnungen.push(
          `Ab dem 25. Dienstjahr sind die Behördenangaben uneinheitlich: Der Kanton NE nennt 6 Monate ohne weitere Stufe; ` +
            `das Arbeitsamt AI schreibt die Skala mit 1 Monat zusätzlich je weitere 5 Dienstjahre fort ` +
            `(für das ${dienstjahr}. Dienstjahr: ${alt} Monate). Das Tool rechnet mit 6 Monaten; ein Anspruch von ${alt} Monaten ist nicht ausgeschlossen.`,
        );
        rechenwegZusatz += `; ab dem 25. DJ abweichende Fortschreibung Arbeitsamt AI: ${alt} Monate`;
      }
    } else {
      warnungen.push(
        `Skala-Fortschreibung für das ${dienstjahr}. Dienstjahr ist in der vorliegenden ${beleg.quelle} nicht belegt ` +
          `(verifiziert: false). Kantonale Praxis prüfen.`,
      );
      rechenwegZusatz = ` – Fortschreibung über das ${beleg.dienstjahr}. DJ hinaus aus der Quelle nicht belegt`;
    }
  }
  if (kanton === 'NW') {
    const basler = dauerAusSkala(SKALA_BASEL, dienstjahr);
    const bern = dauerAusSkala(SKALA_BERN, dienstjahr);
    const fmt = (e: ReturnType<typeof dauerAusSkala>) => (e ? formatSkalaDauer(e.dauer) : '–');
    warnungen.push(
      `Kanton Nidwalden: Das Merkblatt «Lohnzahlung» des Arbeitsamts Nidwalden vom 7.4.2017 verweist auf die Berner Skala, ` +
        `gibt aber abweichende Werte wieder (sie entsprechen der Basler Skala; für das ${dienstjahr}. Dienstjahr: ${fmt(basler)}). ` +
        `Bis zur Klärung durch das Arbeitsamt Nidwalden rechnet das Tool mit der Berner Skala (${fmt(bern)}). Im Einzelfall prüfen.`,
    );
  }
  return { warnungen, rechenwegZusatz };
}

export function dauerAusSkala(skala: Skala, dienstjahr: number): import('../types/legal').SkalaEintrag | null {
  return (
    skala.eintraege.find(
      (e) => e.dienstjahrVon <= dienstjahr && (e.dienstjahrBis === null || e.dienstjahrBis >= dienstjahr),
    ) ?? null
  );
}
