import { addDays, parseISO } from 'date-fns';
import { berechneSchkgFrist } from '../schkgFristen';
import { PRESETS_SCHKG } from '../schkgPresets';
import { normalisiereEnde, OHNE_STILLSTAND } from '../fristenEngine';
import { formatDatum, formatISO } from '../datumsUtils';
import type { Kanton } from '../../types/legal';
import type { FristenspiegelErgebnis, SpiegelZeile } from './typen';

// ─── Fristenspiegel A.2: Zustellung des Zahlungsbefehls ─────────────────────
//
// Orchestrierung über die SchKG-Presets (Konzept-Dossier A.2, «NICHTS fehlt»):
// jede Zeile ruft `berechneSchkgFrist` mit EXAKT den Parametern des
// bestehenden Presets auf (§5 — der Test erzwingt die Parameter-Identität).
// Das Dual von Art. 88 SchKG (frühestens 20 Tage / spätestens 1 Jahr) liefert
// ZWEI Zeilen aus EINEM Preset — genau die Bauform des SchKG-Rechners.

export type ZahlungsbefehlSpiegelInput = {
  zustellung: string; // yyyy-MM-dd — Zustellung des Zahlungsbefehls
  kanton: Kanton;
};

function preset(key: string) {
  const p = PRESETS_SCHKG.find((x) => x.key === key);
  if (!p) throw new Error(`SchKG-Preset fehlt: ${key}`);
  return p;
}

export function berechneZahlungsbefehlsSpiegel(input: ZahlungsbefehlSpiegelInput): FristenspiegelErgebnis {
  const rv = preset('rechtsvorschlag');
  const fb = preset('fortsetzungsbegehren');

  const rvErg = berechneSchkgFrist({
    ereignis: input.zustellung, einheit: rv.einheit!, laenge: rv.laenge!,
    modus: rv.modus, fristnatur: rv.fristnatur, kanton: input.kanton, ausloeser: rv.ausloeser,
  });
  const fbWarte = berechneSchkgFrist({
    ereignis: input.zustellung, einheit: fb.wartefrist!.einheit, laenge: fb.wartefrist!.laenge,
    modus: fb.modus, fristnatur: 'wartefrist', kanton: input.kanton, ausloeser: fb.ausloeser,
  });
  const fbVerwirkung = berechneSchkgFrist({
    ereignis: input.zustellung, einheit: fb.verwirkung!.einheit, laenge: fb.verwirkung!.laenge,
    modus: fb.modus, fristnatur: 'verwirkung', kanton: input.kanton, ausloeser: fb.ausloeser,
  });

  // RL-17 / Befund R1-07 (Prüfung Rechtslogik 23.9.2026, deklarierte fachliche
  // Änderung): Das Fortsetzungsbegehren setzt voraus, dass die Betreibung
  // «nicht durch Rechtsvorschlag … eingestellt» ist (Art. 88 Abs. 1 SchKG,
  // SR 281.1, Fassung 1.1.2026) — also den unbenutzten Ablauf der
  // Rechtsvorschlagsfrist. Endet diese wegen Art. 63 SchKG nach der Wartefrist
  // (ZB 10.12.2026, ZH: RV bis 06.01.2027, Wartefrist-Folgetag 31.12.2026),
  // ist frühestens der Tag NACH dem RV-Ende zulässig (07.01.2027). Vorher wies
  // der Spiegel das RV-Ende selbst aus (06.01.2027 — an dem Tag kann der
  // Schuldner noch Rechtsvorschlag erheben). Der Folgetag wird wie der
  // Wartefrist-Folgetag auf den nächsten Werktag gelegt (Art. 31 SchKG i.V.m.
  // Art. 142 Abs. 3 ZPO); Art. 63 verlängert ihn nicht (Engine, RL-17/F2-08).
  // Richtungssicher: ausgewiesen wird der spätere der beiden Tage.
  const nachRv = normalisiereEnde(addDays(parseISO(rvErg.diesAdQuemISO), 1), input.kanton, OHNE_STILLSTAND).tag;
  const rvBestimmt = formatISO(nachRv) > fbWarte.diesAdQuemISO;
  const warteISO = rvBestimmt ? formatISO(nachRv) : fbWarte.diesAdQuemISO;
  const warteText = rvBestimmt ? formatDatum(nachRv) : fbWarte.diesAdQuem;

  const zeilen: SpiegelZeile[] = [
    {
      key: 'rechtsvorschlag',
      label: 'Rechtsvorschlag (Schuldner)',
      normRef: rv.norm,
      fristnatur: 'gesetzlich',
      status: 'berechnet',
      endeText: rvErg.diesAdQuem,
      endeISO: rvErg.diesAdQuemISO,
      bedingung: 'Keine Begründung nötig (Art. 75 SchKG); Erklärung an den Überbringer oder das Betreibungsamt.',
    },
    {
      key: 'fortsetzung_warte',
      label: 'Fortsetzungsbegehren (Gläubiger) — Wartefrist',
      normRef: 'Art. 88 Abs. 1 SchKG',
      fristnatur: 'wartefrist',
      status: 'bedingt',
      endeText: warteText,
      endeISO: warteISO,
      endePraefix: 'frühestens ab',
      bedingung: rvBestimmt
        ? `Nur ohne Rechtsvorschlag bzw. nach dessen Beseitigung (Art. 88 Abs. 1 SchKG). Nach der 20-Tage-Wartefrist wäre das Begehren ab ${fbWarte.diesAdQuem} zulässig; die Rechtsvorschlagsfrist endet wegen der Betreibungsferien aber erst am ${rvErg.diesAdQuem} (Art. 63 SchKG) — ausgewiesen ist der Werktag danach.`
        : 'Nur ohne Rechtsvorschlag bzw. nach dessen Beseitigung — vor Ablauf von 20 Tagen unzulässig (Art. 88 Abs. 1 SchKG).',
    },
    {
      key: 'fortsetzung_verwirkung',
      label: 'Fortsetzungsbegehren (Gläubiger) — Verwirkung',
      normRef: 'Art. 88 Abs. 2 SchKG',
      fristnatur: 'verwirkung',
      status: 'bedingt',
      endeText: fbVerwirkung.diesAdQuem,
      endeISO: fbVerwirkung.diesAdQuemISO,
      bedingung: 'Bei erhobenem Rechtsvorschlag steht die Jahresfrist zwischen Einleitung und Erledigung des dadurch veranlassten Gerichts-/Verwaltungsverfahrens STILL (Art. 88 Abs. 2 SchKG) — diese Hemmung erfasst der Spiegel nicht; mit Hemmungsfenster im SchKG-Fristenrechner rechnen.',
    },
    {
      key: 'rechtsoeffnung',
      label: 'Rechtsöffnung / Aberkennungsklage',
      normRef: 'Art. 83 Abs. 2 SchKG',
      fristnatur: 'klagefrist',
      status: 'hinweis',
      bedingung: 'Folgestufe nach erhobenem Rechtsvorschlag: Die 20-Tage-Frist der Aberkennungsklage läuft erst ab der provisorischen Rechtsöffnung (ZPO-Stillstand, Art. 145 Abs. 4 ZPO) — im SchKG-Fristenrechner berechnen.',
    },
  ];

  // Engine-Warnungen der drei Läufe zusammenführen (dedupliziert, §8).
  const warnungen = [...new Set([...rvErg.warnungen, ...fbWarte.warnungen, ...fbVerwirkung.warnungen])];

  return {
    ereignisLabel: 'Zustellung des Zahlungsbefehls',
    ereignisDatumISO: input.zustellung,
    zeilen,
    annahmen: [
      'Ordentliche Betreibung (auf Pfändung/Konkurs). In der WECHSELbetreibung gilt: Rechtsvorschlag 5 Tage und KEINE Betreibungsferien (Art. 179 Abs. 1 / Art. 56 Ziff. 2 SchKG) — dafür den SchKG-Fristenrechner verwenden.',
      `Kanton ${input.kanton} (staatlich anerkannte Feiertage für die Endregel).`,
      ...new Set([...rvErg.annahmen]),
    ],
    warnungen,
  };
}
