/**
 * Fundierter Vollständigkeitstest für das Norm-Vorschau-System.
 *
 * Vier Prüfungen (alle OFFLINE, deterministisch):
 *   1. Bund-Extraktions-Vollständigkeit: jedes art_*-Token aus dem Fedlex-Cache-HTML
 *      muss einen Snapshot-Eintrag haben (Ausnahme: dokumentierte leere Artikel).
 *   2. Kanton-Zitat-Abdeckung: jede (kanton, lawId, artikel)-Stelle aus dem
 *      kantonalen Inventar muss einen Snapshot haben oder in der bekannteLuecken-
 *      Liste stehen (mit Grund). Unerwartete Lücken → FEHLER.
 *   3. Inhalts-Sanity: kein Snapshot-Eintrag hat leere bloecke[], kein Block ist
 *      ohne text und ohne items.
 *   4. Manifest-Konsistenz (Kanton): jeder Manifest-Eintrag → Datei existiert;
 *      jede Kanton-Datei → mind. eine quelleUrl im Manifest.
 *
 * §2: kein Date.now/Math.random. §8: kein stilles Versagen.
 *
 * Aufruf:
 *   vite-node scripts/normtext/check-vollstaendigkeit.ts
 *
 * Reine Vergleichslogik: scripts/normtext/vollstaendigkeit-logik.ts
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { parseFedlexCacheEintraege } from './inventar-bund.ts';
import { pinBefund } from './cache-pin-befund.ts';
import {
  sammleKantonInventar,
  sammleHtmInventar,
  sammleZhPdfInventar,
  sammlePdfInventar,
} from './inventar-kanton.ts';
import { alleArtikelTokens, alleSchlussteilAnker, alleAnhangAnker, extrahiereAnhang } from './extrahiere-fedlex.ts';
import {
  fehlendeBundArtikel,
  unerwarteteKantonLueckenMitQuelleUrl,
  pruefeInhaltsSanity,
  pruefeManifestKonsistenz,
} from './vollstaendigkeit-logik.ts';
import type {
  BekannteLuecke,
  SnapshotEintrag,
} from './vollstaendigkeit-logik.ts';
import type { PdfProfilName } from './adapter-pdf.ts';

// ─── Bekannte Kanton-Lücken (dokumentiert mit Grund) ─────────────────────────
//
// Jede Lücke muss hier mit Grund eingetragen sein. Lücken, die NICHT hier stehen,
// führen zu einem FEHLER (unerwartete Lücke = §8-Verletzung).
//
// Gründe:
//   'token-nicht-im-Erlass' — LexWork-Snapshot wurde erzeugt, aber dieser spezifische
//     Artikel-Token existiert nicht im Erlass (LexWork lieferte ihn nicht zurück).
//     Typisch: bisacodes-freie «a»-Paragraphen (1_a, 8_a), Übergangs-/Schlussartikel.
//   'nicht-LexWork' — Die Law-ID taucht im Inventar auf, ist aber nicht über LexWork
//     als Snapshot verfügbar (z.B. GL/III%20B/7/1 vs. encodierter Pfad, SH/273.100
//     nicht gesnapshottet, OW/210.32 nicht gesnapshottet).
//
// Verifikation: Stand 16.6.2026 — alle Einträge empirisch geprüft.
// Entfernt (16.6.2026): LU/228/art_29 — §29 existiert in SRL 258, nicht 228; quelleUrl in
//   notariat-grundbuch.ts (GRUNDPFAND LU) auf 258 korrigiert; Snapshot via 258 abgedeckt.
// Entfernt (16.6.2026): OW/134.15/art_7 — Art. 7 GebOR aufgehoben; Gerichtskosten OW zitieren
//   jetzt Art. 12 (Kantonsgericht; bis 30 000 Art. 9). Snapshot deckt art_12 (und art_9) ab.
//
const BEKANNTE_LUECKEN: BekannteLuecke[] = [
  // ── SG/941.12: kein Snapshot (nurPdf-Erlass)
  {
    snapshotId: 'kanton/SG/941.12/art_8',
    grund: 'nurPdf',
    notiz: 'SG-941.12 nicht über LexWork verfügbar (Stand 16.6.2026).',
  },
  {
    snapshotId: 'kanton/SG/941.12/art_10',
    grund: 'nurPdf',
    notiz: 'SG-941.12 nicht über LexWork verfügbar (Stand 16.6.2026).',
  },

  // ── SG/914.5: kein Snapshot (nurPdf-Erlass)
  {
    snapshotId: 'kanton/SG/914.5/art_8',
    grund: 'nurPdf',
    notiz: 'SG-914.5 nicht über LexWork verfügbar (Stand 16.6.2026).',
  },
  {
    snapshotId: 'kanton/SG/914.5/art_10',
    grund: 'nurPdf',
    notiz: 'SG-914.5 nicht über LexWork verfügbar (Stand 16.6.2026).',
  },
  {
    snapshotId: 'kanton/SG/914.5/art_11',
    grund: 'nurPdf',
    notiz: 'SG-914.5 nicht über LexWork verfügbar (Stand 16.6.2026).',
  },
  {
    snapshotId: 'kanton/SG/914.5/art_13',
    grund: 'nurPdf',
    notiz: 'SG-914.5 nicht über LexWork verfügbar (Stand 16.6.2026).',
  },
  {
    snapshotId: 'kanton/SG/914.5/art_15',
    grund: 'nurPdf',
    notiz: 'SG-914.5 nicht über LexWork verfügbar (Stand 16.6.2026).',
  },
  {
    snapshotId: 'kanton/SG/914.5/art_16',
    grund: 'nurPdf',
    notiz: 'SG-914.5 nicht über LexWork verfügbar (Stand 16.6.2026).',
  },
  {
    snapshotId: 'kanton/SG/914.5/art_17',
    grund: 'nurPdf',
    notiz: 'SG-914.5 nicht über LexWork verfügbar (Stand 16.6.2026).',
  },
  {
    snapshotId: 'kanton/SG/914.5/art_22',
    grund: 'nurPdf',
    notiz: 'SG-914.5 nicht über LexWork verfügbar (Stand 16.6.2026).',
  },

  // (SH/273.100 entfernt 16.6.2026: ZPO 1951 am 1.1.2011 aufgehoben; SH-Schlichtung
  //  zitiert neu Art. 82 JG SHR 173.200, das via LexWork sauber snapshottet — kein 404 mehr.)

  // ── OW/210.32: nurPdf
  {
    snapshotId: 'kanton/OW/210.32/art_10',
    grund: 'nurPdf',
    notiz: 'OW-210.32 nicht über LexWork verfügbar (Stand 16.6.2026).',
  },

  // ── AR/153.2: nurPdf
  {
    snapshotId: 'kanton/AR/153.2/art_12',
    grund: 'nurPdf',
    notiz: 'AR-153.2 nicht über LexWork verfügbar (Stand 16.6.2026).',
  },

  // ── NW/265.51: keine LexWork-Quelle verfügbar
  {
    snapshotId: 'kanton/NW/265.51/art_28',
    grund: 'nicht-LexWork',
    notiz: 'NW-265.51 nicht über LexWork verfügbar (Stand 16.6.2026).',
  },

  // ── Anhang-/Tarif-Ziffern (N.N.N) in LexWork-Erlassen: NICHT als Snapshot ──
  // parsePassus löst seit 17.6.2026 «Anhang Ziff. N.N.N» / «Nr. 60.xx» auf einen
  // gepunkteten Token auf. In diesen LexWork-Erlassen steht der Tarif-Anhang aber
  // NICHT als strukturierter <div class='article'>, sondern nur als Querverweis im
  // Artikeltext (empirisch BE 154.21: «Gebühren gemäss Anhang VII, Ziffern 3.1.1 …»).
  // Ein Segmentierer würde die Verweiszeile statt des Tarifs greifen → §1: lieber
  // ehrliche Lücke (Live-Link bleibt) als verstümmelter Gesetzestext. (Der ZH-NotGebV-
  // Anhang, 21 Ziffern, IST abgedeckt — er kommt über das zhlex-PDF, nicht LexWork.)
  // Stand 17.6.2026, empirisch je Erlass geprüft.
  { snapshotId: 'kanton/BE/154.21/art_1.6', grund: 'token-nicht-im-Erlass', notiz: 'BE GebV 154.21: Tarif-Anhang 4B Ziff. 1.6 nur als Querverweis im Artikeltext, nicht strukturiert. Live-Link massgeblich.' },
  { snapshotId: 'kanton/BE/154.21/art_2.1', grund: 'token-nicht-im-Erlass', notiz: 'BE GebV 154.21: Anhang 4B Ziff. 2.1 nicht strukturiert (nur Querverweis).' },
  { snapshotId: 'kanton/BE/154.21/art_3.1.1', grund: 'token-nicht-im-Erlass', notiz: 'BE GebV 154.21: Anhang 4B Ziff. 3.1.1 nicht strukturiert (nur Querverweis).' },
  { snapshotId: 'kanton/BE/154.21/art_3.2', grund: 'token-nicht-im-Erlass', notiz: 'BE GebV 154.21: Anhang 4B Ziff. 3.2 nicht strukturiert (nur Querverweis).' },
  { snapshotId: 'kanton/BE/154.21/art_3.3.1', grund: 'token-nicht-im-Erlass', notiz: 'BE GebV 154.21: Anhang 4B Ziff. 3.3.1 nicht strukturiert (nur Querverweis).' },
  { snapshotId: 'kanton/BE/154.21/art_3.4', grund: 'token-nicht-im-Erlass', notiz: 'BE GebV 154.21: Anhang 4B Ziff. 3.4 nicht strukturiert (nur Querverweis).' },
  { snapshotId: 'kanton/BE/154.21/art_3.5', grund: 'token-nicht-im-Erlass', notiz: 'BE GebV 154.21: Anhang 4B Ziff. 3.5 nicht strukturiert (nur Querverweis).' },
  { snapshotId: 'kanton/SG/914.5/art_10.01', grund: 'token-nicht-im-Erlass', notiz: 'SG GebT 914.5: Tarif-Nr. 10.01 im Anhang, nicht über LexWork strukturiert.' },
  { snapshotId: 'kanton/SG/914.5/art_11.01', grund: 'token-nicht-im-Erlass', notiz: 'SG GebT 914.5: Tarif-Nr. 11.01 im Anhang, nicht über LexWork strukturiert.' },
  { snapshotId: 'kanton/SG/914.5/art_60.01.01', grund: 'token-nicht-im-Erlass', notiz: 'SG GebT 914.5: Tarif-Nr. 60.01.01 im Anhang, nicht über LexWork strukturiert.' },
  { snapshotId: 'kanton/GL/III%20B%2F3%2F2/art_1.1', grund: 'token-nicht-im-Erlass', notiz: 'GL Gebührengesetz: Anhang-Ziff. 1.1 nicht über LexWork strukturiert.' },
  { snapshotId: 'kanton/GL/III%20B%2F3%2F2/art_8.1', grund: 'token-nicht-im-Erlass', notiz: 'GL Gebührengesetz: Anhang-Ziff. 8.1 nicht über LexWork strukturiert.' },
  { snapshotId: 'kanton/NW/265.51/art_2.6.1.1', grund: 'token-nicht-im-Erlass', notiz: 'NW 265.51: Tarif-Nr. 2.6.1.1 im Anhang, nicht strukturiert.' },

  // ── SH/221.101: verkettetes Zitat auf den ergänzenden Erlass 211.433 ────────
  // Der SH-Beurkundungs-Eintrag zitiert «211.433 § 13 Abs. 1 Ziff. 4» (Grundbuch-
  // gebührenverordnung SHR 211.433) UNTER der quelleUrl der Notariatsgebühren-
  // verordnung 221.101. § 13 gehört zum anderen Erlass → nicht im 221.101-Snapshot.
  // Der 221.101-Erlass selbst ist über /app/ voll erschlossen (7 Snapshots, § 1
  // abgedeckt). Stand 17.6.2026, /app/-quelleUrl korrigiert (Onboarding TG/AG/SH).
  { snapshotId: 'kanton/SH/221.101/art_13', grund: 'token-nicht-im-Erlass', notiz: 'SH: «211.433 § 13» (Grundbuchgebührenverordnung) ist ein anderer Erlass als 221.101.' },
];
// Entfernt (16.6.2026): FR/130.11 (art_18/20/64), VS/173.8 (art_15/16/17/32/34),
// GL/III%20B/7/1 (art_13) — diese Snapshots existieren unter ihren quelleUrls und
// werden via Laufzeit-Auflösung (unerwarteteKantonLueckenMitQuelleUrl) korrekt
// als ABGEDECKT erkannt. ID-Suffixe (-de/-fr/III%20B_7_1) in Snapshot-Dateien
// sind kein Loch, sondern ein Auflösungsartefakt (BUG A3).

// ─── Bekannte HTM/ZH-Lücken (dokumentiert mit Grund) ─────────────────────────
//
// Wie BEKANNTE_LUECKEN, aber für die HTM- (NE/GE) und ZH-Tiers. snapshotId ist
// die kanonische Form `kanton/${kanton}/${safeLawId}/art_${token}` (safeLawId =
// htmLawIdSafe bzw. zhLawIdSafe der quelleUrl). Lücken, die NICHT hier stehen,
// führen zu einem FEHLER (§8).
//
// Verifikation: Stand 16.6.2026 — alle Einträge empirisch geprüft.
const BEKANNTE_LUECKEN_HTMZH: BekannteLuecke[] = [
  // ── NE/2154116 (LERF, htm): Arrêté-Artikel liegen NICHT im LERF-htm ───────
  // Die festen Emolument-Tarife stehen im Arrêté RSN 215.411.60 (eigener Erlass,
  // nicht als htm erschlossen). Das LERF-htm (2154116.htm) enthält nur die
  // LERF-Artikel selbst (Art. 9–13 werden sauber gesnapshottet). Die «Arrêté
  // Art. …»-Zitate teilen sich die LERF-quelleUrl (gemeinsamer Tarif-Eintrag)
  // → im LERF-htm nicht auffindbar. Bekannt (Stand 16.6.2026): 14, 18, 20, 21,
  // 27 (Arrêté) sowie 44 (Tarif notaires RSN 166.31, mitzitiert).
  { snapshotId: 'kanton/NE/2154116/art_14', grund: 'token-nicht-im-Erlass', notiz: 'Arrêté RSN 215.411.60 Art. 14 — im LERF-htm nicht enthalten (anderer Erlass).' },
  { snapshotId: 'kanton/NE/2154116/art_18', grund: 'token-nicht-im-Erlass', notiz: 'Arrêté RSN 215.411.60 Art. 18 — im LERF-htm nicht enthalten (anderer Erlass).' },
  { snapshotId: 'kanton/NE/2154116/art_20', grund: 'token-nicht-im-Erlass', notiz: 'Arrêté RSN 215.411.60 Art. 20 — im LERF-htm nicht enthalten (anderer Erlass).' },
  { snapshotId: 'kanton/NE/2154116/art_21', grund: 'token-nicht-im-Erlass', notiz: 'Arrêté RSN 215.411.60 Art. 21 — im LERF-htm nicht enthalten (anderer Erlass).' },
  { snapshotId: 'kanton/NE/2154116/art_27', grund: 'token-nicht-im-Erlass', notiz: 'Arrêté RSN 215.411.60 Art. 27 — im LERF-htm nicht enthalten (anderer Erlass).' },
  // Entfernt (17.6.2026): kanton/NE/2154116/art_44 — die GRUNDPFAND-NE-Zitatkorrektur
  // (notariat-grundbuch.ts) führt das LERF-Zitat jetzt auf den existierenden Art. 10
  // (Eintrag 2‰); die Beurkundung (RSN 166.31 Art. 14 ch. 44 «gage immobilier») steht
  // im Hinweis, nicht mehr als toter Art.-44-Token gegen die LERF-quelleUrl.

  // ── NE/16631 (Tarif notaires RSN 166.31, htm): vormals tote Verweis-Zitate ─
  // Entfernt (17.6.2026): art_54 (war «Art. 54» → korrigiert zu «Art. 14 ch. 54»,
  //   Vente immobilière) und art_81 (war «Art. 81 lit. B/C» → «Art. 14 ch. 81 lit. B/C»,
  //   Société anonyme). Beide lösen jetzt auf Art. 14 auf (live an rsn.ne.ch/16631.htm
  //   verifiziert: RSN 166.31 endet bei Art. 17; die Gebühren-Chiffres 1–82 stehen in
  //   Art. 14). Snapshot NE-16631.json deckt art_14 ab.

  // ── GE/rsg_e1_50p06: vormals tote Fremdartikel-Tokens ─────────────────────
  // Entfernt (17.6.2026): art_16 (war REmNot-Beurkundung «Art. 16» → gehört zu RSG
  //   E 6 05.03, nicht E 1 50.06) und art_84 (war LDE-Steuer «Art. 84» → gehört zu RSG
  //   D 3 30). Das verkettete GRUNDPFAND-GE-Zitat führt jetzt auf den existierenden
  //   Art. 4 (REmORFDIT, Eintrag 0,085 %) der quelleUrl; die Beurkundung (E 6 05.03
  //   Art. 16) und Registrierungssteuer (D 3 30 Art. 84) stehen im Hinweis. Live
  //   verifiziert (17.6.2026): rsg_e1_50p06 endet bei Art. 13, Art. 16/84 dort nie
  //   vorhanden. (Der Bug-Check-Verdacht «RTFMC rsg_e1_05p10» war falsch: RTFMC Art. 16
  //   = Schlichtungspauschale, Art. 84 = Parteientschädigung — beide kein Grundpfand.)

  // ── SZ/280.411 (Gebührentarif Rechtsanwälte): tote PDF-URL (assets/4837) ───
  // Das nicht-vermögensrechtliche Zitat «§ 9» trägt die quelleUrl
  // …/assets/4837/280_411.pdf, die jetzt 404 liefert (der Tarif-Eintrag in
  // notariat/grundbuch nutzt die funktionierende …/assets/5862/-Variante; nur
  // die 4837-Variante in nicht-vermoegensrechtlich.ts ist veraltet). Kein
  // Volltext-Snapshot über die 4837-URL → bekannte Lücke (§8); Korrektur der
  // Daten-URL ist eine eigene fachliche Änderung. Stand 16.6.2026.
  { snapshotId: 'kanton/SZ/280.411/art_9', grund: 'nicht-LexWork', notiz: 'SZ-280.411 PDF-URL assets/4837 liefert 404 (funktionierende 5862-Variante in anderem Tarif-Eintrag). Stand 16.6.2026.' },

  // ── JU/37773 (Décret tarifaire): Art. 13 existiert nicht im Erlass ─────────
  // Das Décret (idn=20021&id=37773) umfasst Art. 1–12 (letzter Artikel: «Le
  // Gouvernement fixe l'entrée en vigueur»). Das Zitat «Art. 13» verweist auf
  // einen nicht vorhandenen Artikel (Mis-/Fremdzitat) → token-nicht-im-Erlass.
  { snapshotId: 'kanton/JU/ju-20021-37773-dl/art_13', grund: 'token-nicht-im-Erlass', notiz: 'JU Décret 37773 hat nur Art. 1–12; Art. 13 nicht vorhanden. Stand 16.6.2026.' },

  // ── SG GebT (sGS 821.5) «Nr. 60.xx/70.01»: NICHT im GB-GebV-PDF (2935) ──────
  // Diese Tarif-Einträge zitieren GebT-Nummern (sGS 821.5), tragen aber die
  // quelleUrl des GB-GebV-Konsolidierungs-PDF (gesetzessammlung.sg.ch …/versions/
  // 2935/…). Der GebT ist ein ANDERER Erlass → die «60.xx»-Nummern stehen nicht im
  // 2935-PDF (token-nicht-im-Erlass). Der GB-GebV selbst ist über dasselbe PDF voll
  // erschlossen (83 Snapshots). Daten-Hinweis (§8): die quelleUrl dieser GebT-Zitate
  // sollte auf den GebT 821.5 zeigen — eigene fachliche Datenkorrektur. Stand 17.6.2026.
  { snapshotId: 'kanton/SG/2935/art_60.01', grund: 'token-nicht-im-Erlass', notiz: 'GebT sGS 821.5 Nr. 60.01 — nicht im GB-GebV-PDF (2935); quelleUrl zeigt auf anderen Erlass.' },
  { snapshotId: 'kanton/SG/2935/art_60.02.01', grund: 'token-nicht-im-Erlass', notiz: 'GebT sGS 821.5 Nr. 60.02.01 — nicht im GB-GebV-PDF (2935).' },
  { snapshotId: 'kanton/SG/2935/art_60.02.03', grund: 'token-nicht-im-Erlass', notiz: 'GebT sGS 821.5 Nr. 60.02.03 — nicht im GB-GebV-PDF (2935).' },
  { snapshotId: 'kanton/SG/2935/art_60.05.01', grund: 'token-nicht-im-Erlass', notiz: 'GebT sGS 821.5 Nr. 60.05.01 — nicht im GB-GebV-PDF (2935).' },
  { snapshotId: 'kanton/SG/2935/art_60.06', grund: 'token-nicht-im-Erlass', notiz: 'GebT sGS 821.5 Nr. 60.06 — nicht im GB-GebV-PDF (2935).' },
  { snapshotId: 'kanton/SG/2935/art_60.07', grund: 'token-nicht-im-Erlass', notiz: 'GebT sGS 821.5 Nr. 60.07 — nicht im GB-GebV-PDF (2935).' },
  { snapshotId: 'kanton/SG/2935/art_60.11', grund: 'token-nicht-im-Erlass', notiz: 'GebT sGS 821.5 Nr. 60.11 — nicht im GB-GebV-PDF (2935).' },
  { snapshotId: 'kanton/SG/2935/art_60.12', grund: 'token-nicht-im-Erlass', notiz: 'GebT sGS 821.5 Nr. 60.12 — nicht im GB-GebV-PDF (2935).' },
  { snapshotId: 'kanton/SG/2935/art_60.13', grund: 'token-nicht-im-Erlass', notiz: 'GebT sGS 821.5 Nr. 60.13 — nicht im GB-GebV-PDF (2935).' },
  { snapshotId: 'kanton/SG/2935/art_60.14', grund: 'token-nicht-im-Erlass', notiz: 'GebT sGS 821.5 Nr. 60.14 — nicht im GB-GebV-PDF (2935).' },
  { snapshotId: 'kanton/SG/2935/art_60.15', grund: 'token-nicht-im-Erlass', notiz: 'GebT sGS 821.5 Nr. 60.15 — nicht im GB-GebV-PDF (2935).' },
  { snapshotId: 'kanton/SG/2935/art_70.01', grund: 'token-nicht-im-Erlass', notiz: 'GebT sGS 821.5 Nr. 70.01 — nicht im GB-GebV-PDF (2935).' },
  { snapshotId: 'kanton/SG/2935/art_772', grund: 'token-nicht-im-Erlass', notiz: 'Verkettetes Zitat «Nr. 60.13 … Art. 772 ff. OR»: Art. 772 ist OR-Bund, nicht im SG-PDF.' },

  // ── VS Notariatstarif (1413): «art. 493 al. 2» ist ein OR-Querverweis ───────
  { snapshotId: 'kanton/VS/1413/art_493', grund: 'token-nicht-im-Erlass', notiz: 'VS Tarif notaires 1413: «art. 493 al. 2» verweist auf OR Art. 493 (Bürgschaft), kein Artikel des VS-Tarifs.' },
];

// ─── HTM/ZH-lawIdSafe (kongruent zum Orchestrator) ───────────────────────────
function htmLawIdSafe(url: string): string {
  const letzter = url.split('/').pop() ?? url;
  return letzter.replace(/\.html?$/i, '');
}
function zhLawIdSafe(url: string): string {
  const m = url.match(/\/erlass-([^-]+)-/);
  return m ? m[1].replace(/_/g, '.') : url.replace(/[^a-z0-9.]+/gi, '_');
}
function pdfLawIdSafe(profil: PdfProfilName, url: string): string {
  if (profil === 'sz') {
    const m = url.match(/\/(\d+_\d+)\.pdf$/i);
    if (m) return m[1].replace(/_/g, '.');
    const t = url.match(/\/tolv\/(\d+)\//i);
    if (t) return t[1];
  }
  if (profil === 'ti') {
    const a = url.match(/\/pdfatto\/atto\/(\d+)/i);
    if (a) return `ti-${a[1]}`;
    const t = url.match(/\/tolv\/(\d+)\//i);
    if (t) return `ti-${t[1]}`;
  }
  if (profil === 'vd') {
    const m = url.match(/\/tolv\/(\d+)\//i);
    if (m) return `vd-${m[1]}`;
  }
  if (profil === 'olexAt' || profil === 'olexPar') {
    const v = url.match(/\/versions\/(\d+)\/pdf_file/i);
    if (v) return v[1];
    const t = url.match(/\/tolv\/(\d+)\//i);
    if (t) return t[1];
  }
  if (profil === 'ju') {
    const idn = url.match(/[?&]idn=(\d+)/i);
    const id = url.match(/[?&]id=(\d+)/i);
    const dl = /[?&]download=1/i.test(url) ? '-dl' : '';
    if (idn && id) return `ju-${idn[1]}-${id[1]}${dl}`;
  }
  return url.replace(/[^a-z0-9.]+/gi, '_');
}

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

interface SnapshotDatei {
  erzeugt: string;
  eintraege: SnapshotEintrag[];
}

function ladeBundSnapshots(): {
  snapshots: SnapshotEintrag[];
  snapshotIds: Set<string>;
} {
  const bundDir = 'public/normtext/bund';
  if (!existsSync(bundDir)) return { snapshots: [], snapshotIds: new Set() };

  const snapshots: SnapshotEintrag[] = [];
  const snapshotIds = new Set<string>();

  for (const datei of readdirSync(bundDir)) {
    if (!datei.endsWith('.json')) continue;
    const pfad = `${bundDir}/${datei}`;
    const inhalt = JSON.parse(readFileSync(pfad, 'utf8')) as SnapshotDatei;
    for (const e of inhalt.eintraege ?? []) {
      snapshots.push(e);
      snapshotIds.add(e.id);
    }
  }

  return { snapshots, snapshotIds };
}

function ladeKantonSnapshots(): {
  snapshots: SnapshotEintrag[];
  snapshotIds: Set<string>;
  vorhandeneD: Set<string>;
} {
  const kantonDir = 'public/normtext/kanton';
  if (!existsSync(kantonDir)) {
    return { snapshots: [], snapshotIds: new Set(), vorhandeneD: new Set() };
  }

  const snapshots: SnapshotEintrag[] = [];
  const snapshotIds = new Set<string>();
  const vorhandeneD = new Set<string>();

  for (const datei of readdirSync(kantonDir)) {
    if (!datei.endsWith('.json') || datei === 'index.json') continue;
    vorhandeneD.add(datei);
    const pfad = `${kantonDir}/${datei}`;
    const inhalt = JSON.parse(readFileSync(pfad, 'utf8')) as SnapshotDatei;
    for (const e of inhalt.eintraege ?? []) {
      snapshots.push(e);
      snapshotIds.add(e.id);
    }
  }

  return { snapshots, snapshotIds, vorhandeneD };
}

function ladeKantonManifest(): Map<string, string> {
  const pfad = 'public/normtext/kanton/index.json';
  if (!existsSync(pfad)) return new Map();
  const manifest = JSON.parse(readFileSync(pfad, 'utf8')) as Record<string, string>;
  return new Map(Object.entries(manifest));
}

// ─── Hauptprogramm ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const shellQuelle = readFileSync('scripts/fedlex-cache.sh', 'utf8');
  const cacheEintraege = parseFedlexCacheEintraege(shellQuelle);
  // §17 (Gegenprüfung #822 C1): `ci.yml` fährt dieses Tor bei JEDEM Nicht-Doku-PR, OHNE
  // je `fedlex-cache.sh` zu rufen — dort ist ein /tmp-Cache die AUSNAHME, kein Normalfall.
  // `--cache-pflicht` (nur im Frische-Arm `fedlex-frische.yml` gesetzt, der den Cache
  // selbst frisch fetcht) verlangt die VOLLE Bestandszahl auch bei 0 vorhandenen Caches.
  const cachePflicht = process.argv.includes('--cache-pflicht') || process.env.LEXMETRIK_CACHE_PFLICHT === '1';
  // Cache-Ort (Ergänzung 7.10.2026, ARCH-REVIEW cache-tore): Default /tmp; nur Tests/Rot-Beweise
  // setzen LEXMETRIK_FEDLEX_CACHE_DIR (dieselbe Variable wie fedlex-cache.sh/check-segmente.ts),
  // damit geteilte /tmp-Caches anderer Sessions unberührt bleiben (§12).
  const cacheDir = process.env.LEXMETRIK_FEDLEX_CACHE_DIR || '/tmp';

  const { snapshots: bundSnapshots, snapshotIds: bundSnapshotIds } = ladeBundSnapshots();
  const {
    snapshots: kantonSnapshots,
    snapshotIds: kantonSnapshotIds,
    vorhandeneD,
  } = ladeKantonSnapshots();
  const manifestMap = ladeKantonManifest();

  let exitCode = 0;

  // ─── Prüfung 1: Bund-Extraktions-Vollständigkeit ────────────────────────────
  console.log('\n── Prüfung 1: Bund-Extraktions-Vollständigkeit ──────────────────────────');

  let bundHtmlGeprüft = 0;
  let bundVorhanden = 0; // Gegenprüfung #822 C1: Caches, die ÜBERHAUPT existieren (Existenz, nicht Pin-Gültigkeit)
  let bundFehlendTotal = 0;
  let bundSkipTotal = 0;
  // ARCH-REVIEW cache-tore 7.10.2026: fehlende Caches gesammelt statt je eine HINWEIS-Zeile
  // (PR-CI-Lauf 37646635703: 231 Zeilen Rauschen vor einer «GRÜN»-Meldung ohne Prüfung).
  const ohneCache: string[] = [];

  for (const eintrag of cacheEintraege) {
    const htmlPfad = `${cacheDir}/${eintrag.name}.html`;
    if (!existsSync(htmlPfad)) {
      ohneCache.push(eintrag.name);
      continue;
    }
    bundVorhanden++;
    // §17 (Gegenprüfung #808 B4): Inhalt allein genügt nicht — ein VOR einem Re-Pin
    // geschriebener Cache besteht die Existenz-Prüfung anstandslos, stammt aber aus
    // der überholten Manifestation. Dieselbe Pin-Sonde wie normtext-snapshot.ts
    // (sicherstelleCaches) und struktur-run.ts (cacheGueltig), hier bisher gefehlt.
    //
    // Gegenprüfung #822 B1: ein Pin-Fehlbefund war bis hierher nur eine HINWEIS +
    // `continue` — mit ALLEN `.pin`-Markern weggelegt (fedlex-cache.sh selbst schreibt
    // nie welche, nur normtext-snapshot.ts/struktur-run.ts nach einem Fetch) übersprang
    // das JEDEN Erlass, `bundFehlendTotal` blieb bei 0 und das Tor meldete «ok» EXIT=0 —
    // ein stiller No-op statt eines Befunds. Jetzt FEHLER wie in struktur-run.ts
    // (cacheGueltig): zählt in `exitCode` UND in der Bestandszahl-Sperre unten.
    const pin = pinBefund(eintrag.name, eintrag.eli, eintrag.konsolidierung, eintrag.htmlN, cacheDir);
    if (!pin.ok) {
      console.error(`  FEHLER ${eintrag.name}: ${pin.grund} — Cache pin-ungültig, Prüfung unzuverlässig.`);
      exitCode = 1;
      continue;
    }

    const html = readFileSync(htmlPfad, 'utf8');
    const htmlTokens = alleArtikelTokens(html);
    // M13: Schlusstitel-/UeB-Anker (eigenes Schema) ebenfalls auf Vollabdeckung prüfen.
    const schlussteilAnker = alleSchlussteilAnker(html);
    // M13-Annex: NUR content-tragende Anhang-Anker prüfen (reine Gruppen-
    // Überschriften ohne Body sind keine Snapshot-Einträge) — gleicher Keep-
    // Prädikat wie Generator/Struktur (extrahiereAnhang ≠ null).
    const anhangAnker = alleAnhangAnker(html).filter((a) => {
      const ex = extrahiereAnhang(html, a);
      return ex !== null && ex.bloecke.length > 0;
    });
    bundHtmlGeprüft++;

    const gesetz = eintrag.name.toUpperCase();
    // Es gibt keine bekannte Skip-Liste für leere Artikel (extrahiereArtikel liefert nie leer
    // bei gültigen Tokens in der aktuellen Implementierung).
    const leereArtikel = new Set<string>();
    const fehlend = fehlendeBundArtikel(gesetz, htmlTokens, bundSnapshotIds, leereArtikel, schlussteilAnker, anhangAnker);

    const echteFehlend = fehlend.filter((f) => !f.warLeererArtikel);
    const skippe = fehlend.filter((f) => f.warLeererArtikel);

    if (echteFehlend.length > 0) {
      console.error(
        `  FEHLER ${gesetz}: ${echteFehlend.length} Artikel in HTML, nicht im Snapshot:`,
      );
      for (const f of echteFehlend) {
        console.error(`    ${f.snapshotId}`);
      }
      exitCode = 1;
    }

    if (skippe.length > 0) {
      console.log(
        `  HINWEIS ${gesetz}: ${skippe.length} leere Artikel (dokumentierter Skip):`,
        skippe.map((f) => f.token).join(', '),
      );
    }

    bundFehlendTotal += echteFehlend.length;
    bundSkipTotal += skippe.length;

    const statusText =
      echteFehlend.length === 0
        ? `ok (${htmlTokens.length} Tokens)`
        : `FEHLER ${echteFehlend.length} fehlend`;
    console.log(`  ${gesetz}: ${statusText}`);
  }

  // Bestandszahl-Sperre (Gegenprüfung #822 B1, verschärft C1): `bundFehlendTotal` bleibt
  // bei 0, wenn der Schleifenkörper für JEDEN Eintrag übersprungen wurde (fehlender ODER
  // pin-ungültiger Cache) — ohne diese Sperre meldete Prüfung 1 dann trotzdem «ok».
  // `cacheEintraege.length` ist die Zahl der in fedlex-cache.sh registrierten Bund-Erlasse.
  //
  // C1-KORREKTUR: `ci.yml` fährt dieses Tor bei JEDEM Nicht-Doku-PR, OHNE je
  // `fedlex-cache.sh` zu rufen — dort ist `bundVorhanden === 0` der NORMALFALL, kein
  // Befund. Eine strikte Vollzahl-Pflicht hätte darum JEDEN Nicht-Doku-PR rot gestellt
  // (Rot-Beweis dieses genauen Fehlers: erste Fassung dieses Fixes, reproduziert mit
  // allen 227 Bund-Caches weggelegt). Die Schranke bezieht sich darum auf VORHANDENE
  // Caches: 0 vorhanden ⇒ Prüfung ungefahren (grün, HINWEIS) — ausser `--cache-pflicht`
  // (nur im Frische-Arm `fedlex-frische.yml`, der den Cache selbst frisch fetcht) verlangt
  // dort auch bei 0 die volle Zahl. Ein TEILBESTAND (0 < n < alle) ist in JEDEM Kontext ein
  // Befund — halb gefetchte Caches sind kein gültiger Zustand.
  //
  // Nachtrag 7.10.2026 (ARCH-REVIEW cache-tore, Ergänzung — der Absatz oben bleibt als
  // Beleg seines Stands): (1) «0 vorhanden ⇒ grün, HINWEIS» meldete bisher «fehlend: ok»
  // und «GRÜN — alle 4 Prüfungen bestanden», obwohl Prüfung 1 nichts geprüft hatte
  // (Beleg: PR-CI-Lauf 37646635703, 7.10.2026, «Bund: 0 Gesetze geprüft … fehlend: ok»).
  // Jetzt heisst es «NICHT GEPRÜFT (kein Cache)»; Prüfungen 2–4 (offline) laufen und
  // zählen unverändert. (2) Teilbestand OHNE `--cache-pflicht` (nur lokal denkbar):
  // vorhandene Erlasse werden geprüft, Ausgabe «TEILGEPRÜFT n/N» statt Rot — wenn 0 Caches
  // tolerant durchgehen, prüft ein Teilbestand streng mehr; Rot war dort Fehlalarm. MIT
  // Pflicht bleibt der Teilbestand ein Befund (halb gelungener Fetch). Pin-ungültige
  // Caches bleiben in JEDEM Fall FEHLER (#808 B4, im Schleifenkörper). Mit Pflicht läuft
  // das Tor in fedlex-frische.yml (bei Re-Pin) und korpus-raw-release.yml (nach Pin-Push).
  const bundTeil = bundVorhanden > 0 && bundVorhanden < cacheEintraege.length;
  let bundPruefVermerk = ''; // leer = voll geprüft
  if (bundVorhanden === 0 && !cachePflicht) {
    bundPruefVermerk = 'NICHT GEPRÜFT (kein Cache)';
    console.log(
      `\nNICHT GEPRÜFT (kein Cache): 0/${cacheEintraege.length} Bund-Erlasse haben einen /tmp-Cache — ` +
        `Prüfung 1 hat NICHTS geprüft. Volle Prüfung: 'bash scripts/fedlex-cache.sh', dann erneut. ` +
        `Mit --cache-pflicht läuft sie in fedlex-frische.yml (bei Re-Pin) und korpus-raw-release.yml.`,
    );
  } else if (bundTeil && cachePflicht) {
    console.error(
      `\nFEHLER: nur ${bundVorhanden}/${cacheEintraege.length} Bund-Erlasse haben überhaupt einen ` +
        `/tmp-Cache (Teilbestand) — --cache-pflicht verlangt ALLE ('bash scripts/fedlex-cache.sh'). ` +
        `Ohne Cache: ${ohneCache.join(', ')}`,
    );
    exitCode = 1;
  } else if (bundVorhanden === 0 && cachePflicht) {
    console.error(
      `\nFEHLER: --cache-pflicht verlangt Bund-Caches, aber 0/${cacheEintraege.length} vorhanden ` +
        `— 'bash scripts/fedlex-cache.sh' lief nicht oder scheiterte vollständig.`,
    );
    exitCode = 1;
  } else {
    if (bundTeil) {
      bundPruefVermerk = `TEILGEPRÜFT ${bundVorhanden}/${cacheEintraege.length}`;
      console.log(
        `\nHINWEIS — TEILGEPRÜFT ${bundVorhanden}/${cacheEintraege.length}: nur Bund-Erlasse mit ` +
          `/tmp-Cache geprüft; ${ohneCache.length} NICHT GEPRÜFT (kein Cache): ${ohneCache.join(', ')}`,
      );
    }
    if (bundHtmlGeprüft < bundVorhanden) {
      // Mindestens ein vorhandener Cache ist pin-ungültig (bereits oben je einzeln als
      // FEHLER geloggt) — hier nur die Summenzeile, damit ein Scroll-Log die Ursache
      // nicht verliert.
      console.error(
        `\nFEHLER: nur ${bundHtmlGeprüft}/${bundVorhanden} vorhandene Bund-Caches tatsächlich geprüft ` +
          `(pin-ungültige Caches zählen NICHT als bestanden, s. FEHLER-Zeilen oben).`,
      );
      exitCode = 1;
    }
  }

  const bundStatus = bundFehlendTotal === 0 ? 'ok' : `${bundFehlendTotal} fehlend`;
  console.log(
    `\nBund: ${bundHtmlGeprüft} Gesetze geprüft, ${bundSnapshots.length} Snapshots, fehlend: ` +
      `${bundVorhanden === 0 && !cachePflicht ? bundPruefVermerk : bundStatus}` +
      `${bundTeil && !cachePflicht ? ` (${bundPruefVermerk})` : ''}` +
      `${bundSkipTotal > 0 ? `, ${bundSkipTotal} leere-Artikel-Skips` : ''}`,
  );

  // ─── Prüfung 2: Kanton-Zitat-Abdeckung (via Laufzeit-Auflösung) ─────────────
  // Auflösung: quelleUrl (aus dem Inventar) → Manifest → Snapshot-Datei → Eintrag
  // mit artikel === token. So werden Suffixe (-de/-fr) und URL-Encoding-Varianten
  // (III%20B_7_1) transparent, da der Eintrag explizit seine quelleUrl trägt.
  // Ein echtes Loch liegt nur vor, wenn die Auflösung fehlschlägt (BUG A3 Fix).
  console.log('\n── Prüfung 2: Kanton-Zitat-Abdeckung (via Laufzeit-Auflösung) ────────────');

  const gruppen = sammleKantonInventar();

  // Bilde Map quelleUrl → Set<artikel-String> aus den geladenen Snapshot-Einträgen.
  // Der `artikel`-Feld im Snapshot (z.B. '18', '20', '64') entspricht dem Token
  // aus parsePassus, der im Inventar als artikelToken steht.
  const artikelNachUrl = new Map<string, Set<string>>();
  for (const eintrag of kantonSnapshots) {
    const url = (eintrag as { quelleUrl?: string }).quelleUrl;
    const art = (eintrag as { artikel?: string }).artikel;
    if (url && art) {
      let s = artikelNachUrl.get(url);
      if (!s) {
        s = new Set<string>();
        artikelNachUrl.set(url, s);
      }
      s.add(art);
    }
  }

  const unerwartet = unerwarteteKantonLueckenMitQuelleUrl(
    gruppen,
    manifestMap,
    artikelNachUrl,
    BEKANNTE_LUECKEN,
  );

  if (unerwartet.length > 0) {
    console.error(`  FEHLER: ${unerwartet.length} unerwartete Kanton-Zitat-Lücken (LexWork, nicht in bekannteLuecken):`);
    for (const l of unerwartet) {
      console.error(`    ${l.snapshotId}`);
    }
    exitCode = 1;
  }

  // ── HTM (NE/GE) + ZH-Tier: gleiche quelleUrl-Auflösung, eigene Lücken-Liste ──
  // Diese Tiers liefen bisher NICHT durch das Tor (BUG3) — eine künftige HTM/ZH-
  // Lücke lief still durch. Jetzt: jede HTM/ZH-Inventar-Gruppe wird gegen ihre
  // Snapshots via quelleUrl-Auflösung geprüft (kanton/${kanton}/${safeLawId}/…).
  const htmGruppen = sammleHtmInventar().map((g) => ({
    kanton: g.kanton,
    lawId: htmLawIdSafe(g.quelleUrl),
    quelleUrl: g.quelleUrl,
    artikel: g.artikel,
  }));
  const zhGruppen = sammleZhPdfInventar().map((g) => ({
    kanton: g.kanton,
    lawId: zhLawIdSafe(g.quelleUrl),
    quelleUrl: g.quelleUrl,
    artikel: g.artikel,
  }));
  const pdfGruppen = sammlePdfInventar().map((g) => ({
    kanton: g.kanton,
    lawId: pdfLawIdSafe(g.profil, g.quelleUrl),
    quelleUrl: g.quelleUrl,
    artikel: g.artikel,
  }));
  const unerwartetHtmZh = unerwarteteKantonLueckenMitQuelleUrl(
    [...htmGruppen, ...zhGruppen, ...pdfGruppen],
    manifestMap,
    artikelNachUrl,
    BEKANNTE_LUECKEN_HTMZH,
  );

  if (unerwartetHtmZh.length > 0) {
    console.error(`  FEHLER: ${unerwartetHtmZh.length} unerwartete Kanton-Zitat-Lücken (HTM/ZH, nicht in bekannteLuecken):`);
    for (const l of unerwartetHtmZh) {
      console.error(`    ${l.snapshotId}`);
    }
    exitCode = 1;
  }

  const htmZhZitate = [...htmGruppen, ...zhGruppen, ...pdfGruppen].reduce((s, g) => s + g.artikel.length, 0);
  console.log(
    `  HTM/ZH/PDF: ${htmZhZitate} Zitat-Tripel geprüft (via quelleUrl-Auflösung), bekannte Lücken: ${BEKANNTE_LUECKEN_HTMZH.length}, unerwartet: ${unerwartetHtmZh.length === 0 ? 'ok' : unerwartetHtmZh.length}`,
  );

  // Bekannte Lücken: zeige nur jene, die tatsächlich in einem Inventar-Zitat auftauchen
  // (kanonische snapshotId-Form: kanton/${kanton}/${lawId}/art_${token}).
  const zitierteIds = new Set<string>();
  for (const g of gruppen) {
    for (const a of g.artikel) {
      zitierteIds.add(`kanton/${g.kanton}/${g.lawId}/art_${a.token}`);
    }
  }
  const abgedeckt = BEKANNTE_LUECKEN.filter((l) => zitierteIds.has(l.snapshotId));
  if (abgedeckt.length > 0) {
    console.log(`  Bekannte Lücken (${abgedeckt.length}, akzeptiert mit Grund):`);
    for (const l of abgedeckt) {
      console.log(`    [${l.grund}] ${l.snapshotId}${l.notiz ? ' — ' + l.notiz : ''}`);
    }
  }

  const zitierteAnzahl = [...gruppen].reduce((s, g) => s + g.artikel.length, 0);
  const kantonStatus = unerwartet.length === 0 ? 'ok' : `${unerwartet.length} unerwartet`;
  console.log(
    `\nKanton: ${zitierteAnzahl} Zitat-Tripel geprüft (via quelleUrl-Auflösung), ${kantonSnapshotIds.size} Snapshot-IDs, bekannte Lücken: ${abgedeckt.length}, unerwartet: ${kantonStatus}`,
  );

  // ─── Prüfung 3: Inhalts-Sanity ───────────────────────────────────────────────
  console.log('\n── Prüfung 3: Inhalts-Sanity ─────────────────────────────────────────────');

  const alleSnapshots = [...bundSnapshots, ...kantonSnapshots];
  const sanityFehler = pruefeInhaltsSanity(alleSnapshots);

  if (sanityFehler.length > 0) {
    console.error(`  FEHLER: ${sanityFehler.length} Sanity-Probleme:`);
    for (const f of sanityFehler) {
      const detail =
        f.problem === 'leerer-block' ? ` (Block ${f.blockIndex})` : '';
      console.error(`    [${f.problem}${detail}] ${f.snapshotId}`);
    }
    exitCode = 1;
  }

  const sanityStatus = sanityFehler.length === 0 ? 'ok' : `${sanityFehler.length} Fehler`;
  console.log(
    `Sanity: ${alleSnapshots.length} Einträge (${bundSnapshots.length} Bund + ${kantonSnapshots.length} Kanton) geprüft — ${sanityStatus}`,
  );

  // ─── Prüfung 4: Manifest-Konsistenz (Kanton) ────────────────────────────────
  console.log('\n── Prüfung 4: Manifest-Konsistenz (Kanton) ──────────────────────────────');

  const manifestFehler = pruefeManifestKonsistenz(manifestMap, vorhandeneD);

  if (manifestFehler.length > 0) {
    console.error(`  FEHLER: ${manifestFehler.length} Manifest-Inkonsistenzen:`);
    for (const f of manifestFehler) {
      const detail = f.quelleUrl ? ` (quelleUrl: ${f.quelleUrl})` : '';
      console.error(`    [${f.problem}] ${f.datei}${detail}`);
    }
    exitCode = 1;
  }

  const manifestStatus = manifestFehler.length === 0 ? 'ok' : `${manifestFehler.length} Fehler`;
  console.log(
    `Manifest: ${manifestMap.size} Einträge, ${vorhandeneD.size} Dateien — ${manifestStatus}`,
  );

  // ─── Gesamtstatus ─────────────────────────────────────────────────────────────
  console.log('\n── Gesamtstatus ─────────────────────────────────────────────────────────');
  if (exitCode === 0) {
    console.log(
      bundPruefVermerk === ''
        ? 'check:vollstaendigkeit: GRÜN — alle 4 Prüfungen bestanden.'
        : `check:vollstaendigkeit: GRÜN für Prüfungen 2–4; Prüfung 1 (Bund gegen Fedlex-Cache) ${bundPruefVermerk}.`,
    );
  } else {
    console.error('check:vollstaendigkeit: ROT — Fehler oben beheben!');
  }

  process.exit(exitCode);
}

main().catch((err) => {
  console.error('check-vollstaendigkeit: unerwarteter Fehler:', err);
  process.exit(1);
});
