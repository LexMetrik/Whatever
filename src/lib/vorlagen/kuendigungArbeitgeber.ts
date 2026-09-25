// Dossier: bibliothek/recherche/kuendigungs-masken.md
import type { VorlageSchema, Antworten } from './engine';
import { assemble } from './engine';
import { fmtDatum, fmtDatumLang } from './datum';
import { berechneSperrfristen, type SperrfristenErgebnis } from '../sperrfristen';
import { berechneKuendigungsfrist } from '../kuendigungsfrist';
import { STANDARD_ARBEITSTAGE } from '../kuendigungsfristProbezeit';
import type { Sperrereignis } from '../../types/legal';
import {
  type KdgBasisAntworten, KDG_BASIS_DEFAULTS, kdgBasisAbgeleitet,
  kdgAbsender, kdgAdressat, kdgDatumzeile, kdgBetreff, kdgSchluss,
} from './kuendigungGemeinsam';

// ─── Maske 1b: Kündigung Arbeitsverhältnis durch ARBEITGEBER:in (Flaggschiff) ─
//
// Bauspezifikation: bibliothek/recherche/kuendigungs-masken.md (6.6.2026).
// FÜHRENDE Engine ist berechneSperrfristen (lib/sperrfristen.ts — ruft intern
// berechneKuendigungsfrist); hier wird KEINE Frist und KEINE Sperrfrist neu
// gerechnet (§3/§5). Kern-Sicherheitsregel der Spezifikation:
// Engine-Status 'nichtig' = HARTER BLOCKER (Export gesperrt) — eine in der
// Sperrfrist zugegangene Kündigung wäre nichtig (Art. 336c Abs. 2 OR).

export type KagProbezeit = 'keine' | 'gesetzlich' | 'vereinbart';

export type KagAntworten = KdgBasisAntworten & {
  unterzeichner: string;                 // zeichnungsberechtigte Person (M6)
  vertragsbeginn: string;                // ISO
  zugangKuendigung: string;              // ISO (erwarteter Zugang — Stichtag)
  probezeit: KagProbezeit;
  probezeitMonate: number;               // 1–3 (nur bei 'vereinbart')
  fristQuelle: 'gesetzlich' | 'abweichend';
  abweichendeFristMonate: number;        // ≥ 1 bzw. GAV-Sonderfall
  abweichendeFristFormGueltig: boolean;
  abweichendeFristQuelleGAV: boolean;
  kuendigungsterminMonatsende: boolean;
  vaterschaftsurlaubResttage: number;    // Art. 335c Abs. 3 OR
  sperrereignisse: Sperrereignis[];      // Art. 336c OR (geteilter Editor)
  // RL-16b Nachzug (Gegenprüfung Runde 2, 25.9.2026): Arbeitstage der Person
  // für die Probezeitverlängerung (Art. 335b Abs. 3 OR, BGE 148 III 126
  // E. 5.2.6) — Wochentage nach date-fns getDay (0 = So … 6 = Sa). Optional:
  // fehlt das Feld (Antworten vor RL-16b), rechnet die Engine Mo–Fr und legt
  // das als Warnung offen; die Maske setzt den Standard sichtbar (KAG_DEFAULTS).
  arbeitstageWoche?: number[];
  // Offengelegte Spez.-Abweichung (Bug-Check B, 6.6.2026): Der Feldkatalog 1b
  // der Spezifikation listet freistellung/freistellungAb nicht, ihre Baustein-
  // liste nennt K2_freistellung mit {{freistellungAbFmt}} aber ausdrücklich —
  // die Felder schliessen diese Spez.-interne Lücke (Art. 324 Abs. 2 OR).
  freistellung: boolean;
  freistellungAb: string;                // ISO (nur bei freistellung)
  begruendungAufnehmen: boolean;         // bewusst Default false (Spez. 1b)
  begruendungText: string;
};

export const KAG_DEFAULTS: KagAntworten = {
  ...KDG_BASIS_DEFAULTS,
  unterzeichner: '',
  vertragsbeginn: '', zugangKuendigung: '',
  probezeit: 'keine', probezeitMonate: 1,
  fristQuelle: 'gesetzlich', abweichendeFristMonate: 3,
  abweichendeFristFormGueltig: false, abweichendeFristQuelleGAV: false,
  kuendigungsterminMonatsende: true,
  vaterschaftsurlaubResttage: 0,
  sperrereignisse: [],
  arbeitstageWoche: [...STANDARD_ARBEITSTAGE],
  freistellung: false, freistellungAb: '',
  begruendungAufnehmen: false, begruendungText: '',
};

/** Vereinbarte Probezeit: zwingende Grenzen nach Art. 335b Abs. 2 OR (1–3 Monate).
 *  Single Source (§3/§5, D-5): sowohl die Engine-Klemmung als auch die Formular-
 *  Validierung/Eingabegrenzen in der Page beziehen sich hierauf, statt 1/3 + Norm
 *  ein zweites Mal in der Darstellungsschicht zu kodieren. */
export const KAG_PROBEZEIT = { MIN_MONATE: 1, MAX_MONATE: 3, NORM: 'Art. 335b OR' } as const;

// ── Engine-Adapter (M9): reine Feld-Umbenennung, keine Rechenregel ──────────

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function kagEngineInput(a: KagAntworten) {
  return {
    vertragsbeginn: a.vertragsbeginn,
    zugangKuendigung: a.zugangKuendigung,
    kuendigendePartei: 'arbeitgeber' as const,
    probezeitMonate: a.probezeit === 'keine' ? 0 : a.probezeit === 'gesetzlich' ? 1 : Math.min(Math.max(a.probezeitMonate, KAG_PROBEZEIT.MIN_MONATE), KAG_PROBEZEIT.MAX_MONATE),
    abweichendeFristMonate: a.fristQuelle === 'abweichend' ? a.abweichendeFristMonate : undefined,
    abweichendeFristFormGueltig: a.fristQuelle === 'abweichend' ? a.abweichendeFristFormGueltig : undefined,
    abweichendeFristQuelleGAV: a.fristQuelle === 'abweichend' ? a.abweichendeFristQuelleGAV : undefined,
    kuendigungsterminMonatsende: a.kuendigungsterminMonatsende,
    vaterschaftsurlaubResttage: a.vaterschaftsurlaubResttage > 0 ? a.vaterschaftsurlaubResttage : undefined,
    // RL-16b Nachzug: unverändert durchreichen — Prüfung/Standard in der Engine
    // (istGueltigeArbeitstage), sonst rechnete der Brief bei Teilzeit Mo–Fr.
    arbeitstageWoche: a.arbeitstageWoche,
  };
}

export function kagEngine(a: KagAntworten): SperrfristenErgebnis | null {
  if (!ISO.test(a.vertragsbeginn) || !ISO.test(a.zugangKuendigung)) return null;
  // Defensiv gegen fremde Speicherstände (Bug-Check A 6.6.2026): kein Array → leer.
  const ereignisse = Array.isArray(a.sperrereignisse) ? a.sperrereignisse : [];
  if (ereignisse.some((e) => e.bis < e.von)) return null;
  return berechneSperrfristen({ ...kagEngineInput(a), sperrereignisse: ereignisse });
}

/** Probezeit-Flag aus derselben reinen Engine (identische Eingaben → identisch
 *  zum internen Befund von berechneSperrfristen; §5 — kein Text-Parsing). */
export function kagIstProbezeit(a: KagAntworten): boolean {
  if (!ISO.test(a.vertragsbeginn) || !ISO.test(a.zugangKuendigung)) return false;
  // RL-16b: dieselben Sperrereignisse wie kagEngine — sonst sähe der
  // Probezeit-Satz des Briefs die Verlängerung nach Art. 335b Abs. 3 OR nicht.
  const ereignisse = Array.isArray(a.sperrereignisse) ? a.sperrereignisse : [];
  return berechneKuendigungsfrist({ ...kagEngineInput(a), sperrereignisse: ereignisse }).istProbezeit;
}

// ── Gates (Spez. 1b/d) ──────────────────────────────────────────────────────

export type KagGateErgebnis = { blocker: string[]; warnungen: string[]; hinweise: string[] };

export function pruefeKagGates(a: KagAntworten, engine: SperrfristenErgebnis | null): KagGateErgebnis {
  const blocker: string[] = [];
  const warnungen: string[] = [];
  const hinweise: string[] = [
    // Befristung ist in dieser Maske bewusst KEIN Eingabepfad (Spez. G-Befristung).
    'Befristete Arbeitsverhältnisse enden ohne Kündigung durch Zeitablauf (Art. 334 OR) — für sie ist dieses Schreiben nicht gedacht.',
    'Missbräuchliche Kündigung (Art. 336 OR): Die gekündigte Person kann bis zum Ende der Kündigungsfrist schriftlich Einsprache erheben und danach innert 180 Tagen klagen (Art. 336b OR; Entschädigung bis 6 Monatslöhne, Art. 336a Abs. 2).',
  ];

  // G-NICHTIG (BLOCKER): Zugang fällt in eine Sperrfrist.
  if (engine?.status === 'nichtig') {
    blocker.push(
      `Der Zugang fällt in eine Sperrfrist (Art. 336c Abs. 2 OR) — die Kündigung wäre NICHTIG. `
      + `Frühestens am ${fmtDatum(engine.fruehesteNeueKuendigungISO)} kann neu gekündigt werden (Zugang massgebend).`,
    );
  }
  // G-GEHEMMT (Warnung): Frist wurde unterbrochen/erstreckt.
  if (engine && engine.status !== 'nichtig' && (engine.gehemmtTage ?? 0) > 0) {
    warnungen.push(
      `Die Kündigungsfrist wird durch Sperrfristen um ${engine.gehemmtTage} Tage gehemmt; das Beendigungsdatum `
      + `(${fmtDatum(engine.beendigungISO)}) berücksichtigt Hemmung und Erstreckung auf den Endtermin (Art. 336c Abs. 2/3 OR).`,
    );
  }
  // Engine-Warnungen 1:1 durchreichen (§5).
  if (engine) warnungen.push(...engine.warnungen);

  // Begründungs-Warnung (Spez.: heikel — Default leer).
  if (a.begruendungAufnehmen) {
    warnungen.push(
      'Begründung im Kündigungsschreiben: rechtlich nicht erforderlich — sie ist nur auf Verlangen schriftlich zu liefern '
      + '(Art. 335 Abs. 2 OR). Eine frühe Festlegung kann die Verteidigung gegen einen Missbrauchsvorwurf erschweren.',
    );
  }
  return { blocker, warnungen, hinweise };
}

// ── Schema ──────────────────────────────────────────────────────────────────

export const KAG_SCHEMA: VorlageSchema = {
  id: 'kuendigung-arbeitgeber',
  format: 'eingabe',
  ausgabeArt: 'fertig',
  version: '1.0.0 (Rechtsstand OR Art. 335 ff./336c; Masken-Spezifikation 6.6.2026)',
  titel: 'Kündigung des Arbeitsverhältnisses',
  disclaimer:
    'Erstellt mit LexMetrik. Keine Rechtsberatung. Beendigungsdatum und Sperrfrist-Prüfung beruhen '
    + 'auf den eingegebenen Daten (Art. 335a–c, 336c OR); massgebend ist der Zugang bei der '
    + 'Arbeitnehmerin/beim Arbeitnehmer. GAV und Einzelvertrag gehen vor.',
  bausteine: [
    kdgAbsender('K2_absender'),
    kdgAdressat('K2_adressat'),
    kdgDatumzeile('K2_datumzeile'),
    kdgBetreff('K2_betreff', 'Kündigung des Arbeitsverhältnisses'),
    { id: 'K2_anrede', rolle: 'anrede', text: 'Sehr geehrte Frau, sehr geehrter Herr {{adressatNachnameZeile}}',
      begruendung: 'Anrede — immer enthalten (Nachname aus dem Adressat-Feld, anpassbar).' },
    { id: 'K2_erklaerung',
      text: 'Hiermit kündigen wir das mit Ihnen bestehende Arbeitsverhältnis ordentlich per {{beendigungFmt}}.',
      norm: 'Art. 335 Abs. 1 OR',
      begruendung: 'Kündigungserklärung; Beendigungsdatum aus der Sperrfristen-Engine (gehemmt/erstreckt nach Art. 336c OR).' },
    { id: 'K2_probezeit',
      text: '(Die Kündigung erfolgt während der Probezeit; es gilt die siebentägige Frist nach Art. 335b OR.)',
      includeIf: { feld: 'istProbezeit', eq: true },
      norm: 'Art. 335b OR',
      begruendung: 'Zugang liegt in der Probezeit (Engine-Befund) — Klarstellung der 7-Tage-Frist; Sperrfristen gelten in der Probezeit nicht.' },
    { id: 'K2_begruendung',
      text: '{{begruendungText}}',
      includeIf: { and: [{ feld: 'begruendungAufnehmen', eq: true }, { feld: 'begruendungText', nichtLeer: true }] },
      begruendung: 'Begründung auf ausdrücklichen Wunsch aufgenommen (Freitext — rechtlich nur auf Verlangen geschuldet, Art. 335 Abs. 2 OR).',
      hinweis: 'Bewusst optional: Eine frühe Festlegung kann die Verteidigung gegen einen Missbrauchsvorwurf erschweren.' },
    { id: 'K2_freistellung',
      text: 'Wir stellen Sie ab {{freistellungAbFmt}} bis zum Austritt von der Arbeitspflicht frei. Der Lohn wird bis zur Beendigung ausgerichtet; anderweitiger Erwerb wird nach Art. 324 Abs. 2 OR angerechnet.',
      includeIf: { feld: 'freistellung', eq: true },
      norm: 'Art. 324 OR',
      begruendung: 'Freistellung gewählt; Lohnfortzahlungs- und Anrechnungsfolge nach Art. 324 OR.',
      hinweis: 'Ferienanrechnung während der Freistellung ist eine Würdigungsfrage (Verhältnis Freistellungsdauer/Feriensaldo) und wird hier bewusst nicht berechnet.' },
    { id: 'K2_abrechnung',
      text: 'Bis zum Austritt erhalten Sie die Schlussabrechnung (Lohn, anteiliger 13. Monatslohn, Feriensaldo, Überstunden). Wir bitten Sie, Arbeitsmittel und Unterlagen bis zum letzten Arbeitstag zurückzugeben. Ein Arbeitszeugnis (Art. 330a OR) stellen wir Ihnen zu.',
      norm: 'Art. 330a OR',
      begruendung: 'Abwicklung (Schlussabrechnung, Rückgaben, Zeugnis-Zusage) — immer enthalten.' },
    kdgSchluss('K2_schluss'),
    { id: 'K2_unterschrift', rolle: 'unterschrift',
      text: '___________________________\n{{absenderName}}\n{{unterzeichner}}',
      begruendung: 'Unterschrift der zeichnungsberechtigten Person für die Arbeitgeberin/den Arbeitgeber.' },
  ],
};

// ── Zusammenstellung ────────────────────────────────────────────────────────

export function kagZusammenstellen(a: KagAntworten) {
  const engine = kagEngine(a);
  const nichtig = engine?.status === 'nichtig';
  // Nachname-Heuristik bewusst NICHT geraten: das letzte Wort des Namensfelds
  // dient nur als Anrede-Vorschlag und bleibt im Brief sichtbar editierbar.
  const nachname = a.adressatName.trim().split(/\s+/).pop() ?? '';
  const antworten: Antworten = {
    ...a,
    ...kdgBasisAbgeleitet(a),
    adressatNachnameZeile: nachname,
    // Bei Nichtigkeit KEIN Beendigungsdatum ins Dokument (Blocker sperrt den
    // Export ohnehin; die Vorschau zeigt den Strich, §8).
    beendigungFmt: !nichtig && engine?.beendigungISO ? fmtDatum(engine.beendigungISO) : '',
    istProbezeit: engine != null && kagIstProbezeit(a),
    freistellungAbFmt: fmtDatumLang(a.freistellungAb),
  };
  return { ergebnis: assemble(KAG_SCHEMA, antworten), engine };
}
