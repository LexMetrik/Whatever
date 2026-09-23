// ─── Musterdaten der Mappen GmbH-Gründung / Kapitalerhöhung (V5) ────────────
//
// W2·29-WERKBANK-VORLAGEN V5 (23.9.2026). Eigene Datei neben musterdaten.ts,
// weil die Beispiele die Engine-Defaults ausbreiten (Laufzeit-Import aus
// src/lib) — musterdaten.ts hängt an jeder Vorlagen-Seite und bleibt darum
// frei von Laufzeit-Importen (§15). Eine Quelle (§5) für den Knopf «Mit
// Musterdaten füllen» der beiden Mappen UND für die V0-Flächen-Ratsche.

import { GMBH_DOK_DEFAULTS, type GmbhDokAntworten } from '../../lib/vorlagen/gruendungGmbhDokumente';
import { KE_DEFAULTS, type KeAntworten } from '../../lib/vorlagen/kapitalerhoehung';

// ── Mappen-Beispiele (byte-gleich aus dem V0-Ratschen-Test übernommen, dort
// «Wortlaut aus formGate.test.ts»; der Test importiert sie jetzt von hier) ──
export const KE_BEISPIEL: KeAntworten = {
  ...KE_DEFAULTS,
  rechtsform: 'ag', firma: 'Muster Holding AG', sitz: 'Zürich', kanton: 'ZH',
  bisherigesKapitalChf: "100'000", bisherigeAnzahl: '100', nennwertChf: "1'000",
  anzahlNeue: '50', ausgabebetragChf: "1'200", statutenArtikelNr: '3',
  gvDatum: '2026-06-01',
  zeichner: [
    { name: 'Anna Muster', angaben: 'von Basel, in Zürich', anzahl: '30', bereitsBeteiligt: true },
    { name: 'Beat Beispiel', angaben: 'von Bern, in Bern', anzahl: '20', bereitsBeteiligt: true },
  ],
  bankName: 'Zürcher Kantonalbank', bankOrt: 'Zürich',
  berichtUnterzeichner: 'Anna Muster', vorsitzName: 'Anna Muster',
  ort: 'Zürich', datum: '2026-06-07',
};
export const GMBH_BEISPIEL: GmbhDokAntworten = {
  einlageArt: 'bar', besondereVorteile: false, gfGewaehlt: true,
  mehrereGeschaeftsfuehrer: false, weitereVertretungsberechtigte: false,
  optingOut: false, eigeneBueros: true, immobilienHauptzweck: false,
  auslJurPersonGesellschafter: false, fremdwaehrung: false,
  bankInUrkundeGenannt: false, chWohnsitzVertretung: true,
  statutKlauseln: [], leistungenChf: undefined,
  ...GMBH_DOK_DEFAULTS,
  firma: 'Muster GmbH', sitz: 'Zürich', kanton: 'ZH', zweck: 'Treuhand',
  stammkapitalChf: "20'000", anzahlAnteile: '20', nennwertChf: "1'000",
  gruender: [{ name: 'A', angaben: 'von Basel, in Zürich', anzahl: '20' }],
  geschaeftsfuehrer: [
    { name: 'A', herkunft: 'Basel', wohnort: 'Zürich', adresse: 'W 1', vorsitz: true, zeichnungsArt: 'einzelunterschrift' },
  ],
  revisionsstelleName: 'R AG', revisionsstelleSitz: 'Zürich',
  ort: 'Zürich', datum: '2026-06-15',
};

/** Musterdaten der Mappen, je Karten-Id. */
export const MAPPEN_MUSTER = {
  'gmbh-gruendung': (): GmbhDokAntworten => ({ ...GMBH_BEISPIEL }),
  kapitalerhoehung: (): KeAntworten => ({ ...KE_BEISPIEL }),
};
