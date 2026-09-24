import { istISO, einerVon, type PermalinkSpec } from '../../lib/permalink';
import type {
  VerzugszinsInput, VerzugszinsMethode, SatzGrund, VerzugsbeginnTyp,
} from '../../lib/verzugszins';

// ─── Beschriftungen + Permalink des Verzugszinsrechners ─────────────────────
//
// Wörtlich aus `VerzugszinsForm.tsx` herausgelöst (W2·29-WERKBANK-START-
// UEBERARBEITUNG U2, 24.9.2026), weil jetzt ZWEI Formulare sie tragen: der
// volle Rechner `/rechner/verzugszins` und das Schnellwerkzeug der Startseite
// (`VerzugszinsSchnellForm`). EINE Quelle je Fachinhalt (§5) — die Schnellform
// darf die Wahl-Texte, Defaults und die Link-Kodierung nicht nachschreiben.
// Muster wie `einfacheFristTexte.ts`: eine Nicht-Komponente darf nicht aus
// einer `.tsx`-Komponentendatei exportiert werden (react-refresh). Werte und
// Reihenfolge unverändert; keine Rechtslogik (§3), reine Beschriftung.

export const VERZUGSZINS_DISCLAIMER =
  'Automatisierte Orientierungsberechnung des Verzugszinses nach Art. 104 OR – keine Rechtsberatung. ' +
  'Art. 104 OR fixiert den Zinssatz, nicht die Tageszählung; die gewählte Methode ist im Einzelfall zu prüfen. ' +
  'Ein über den Verzugszins hinausgehender Schaden bleibt vorbehalten (Art. 106 OR).';

export const METHODEN: { code: VerzugszinsMethode; label: string }[] = [
  { code: 'act365', label: 'Tatsächliche Tage / 365 (Zürcher Gerichtsrechner)' },
  { code: 'act360', label: 'Tatsächliche Tage / 360 (Bankusanz)' },
  { code: '30E360', label: '30E/360 (kaufmännisch)' },
];
export const GRUENDE: { code: SatzGrund; label: string }[] = [
  { code: 'gesetzlich', label: 'Gesetzlich – 5 % (Art. 104 Abs. 1)' },
  { code: 'vertraglich', label: 'Vertraglich höher (Art. 104 Abs. 2)' },
  { code: 'kaufmaennisch', label: 'Kaufmännischer Diskonto (Art. 104 Abs. 3)' },
];
export const BEGINN: { code: VerzugsbeginnTyp; label: string }[] = [
  { code: 'mahnung', label: 'Mahnung – ab Erhalt (Art. 102 Abs. 1)' },
  { code: 'verfalltag', label: 'Verfalltag – Zins ab Folgetag (Art. 102 Abs. 2)' },
  { code: 'klage', label: 'Klage/Betreibung – ab Zustellung' },
];

// Reine Eingabedaten (Permalink/Beispiele). Die UI-Zeile mit stabiler id lebt
// im vollen Formular; die id erreicht die Engine NIE.
export type EreignisEingabe = { typ: 'teilzahlung' | 'satzaenderung'; datum: string; wert: number };

export const DEFAULTS: VerzugszinsInput = {
  kapital: 10000, verzugsbeginn: '2024-01-01', beginnTyp: 'mahnung', stichtag: '2025-01-01',
  zinssatzProzent: 5, satzGrund: 'gesetzlich', methode: 'act365',
};

// Permalink (FAHRPLAN-PRAXIS 1.3): Input + Ereignis-Zeilen + Zinsforderung.
export type VzLink = VerzugszinsInput & { rows?: EreignisEingabe[]; zinsforderung?: boolean } & Record<string, unknown>;
export const VZ_LINK_SPEC: PermalinkSpec<VzLink> = {
  kapital: { p: 'c', typ: 'num', gueltig: (n) => n > 0 },
  verzugsbeginn: { p: 'vb', typ: 'str', gueltig: istISO },
  beginnTyp: { p: 'bt', typ: 'str', gueltig: einerVon('mahnung', 'verfalltag', 'klage') },
  stichtag: { p: 's', typ: 'str', gueltig: istISO },
  zinssatzProzent: { p: 'z', typ: 'num', gueltig: (n) => n >= 0 && n <= 100 },
  satzGrund: { p: 'sg', typ: 'str', gueltig: einerVon('gesetzlich', 'vertraglich', 'kaufmaennisch') },
  methode: { p: 'm', typ: 'str', gueltig: einerVon('act365', 'act360', '30E360') },
  rows: {
    p: 'r', typ: 'json',
    gueltig: (v): boolean => Array.isArray(v) && v.length <= 50 && v.every((e) =>
      e && typeof e === 'object'
      && ['teilzahlung', 'satzaenderung'].includes((e as { typ?: string }).typ ?? '')
      && istISO((e as { datum?: string }).datum ?? '')
      && Number.isFinite((e as { wert?: number }).wert)),
  },
  zinsforderung: { p: 'zf', typ: 'bool' },
};
