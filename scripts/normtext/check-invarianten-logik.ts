// ─── Struktur-Invarianten für Bund-Normtext-Snapshots (Bündel N, Phase 0) ────
//
// Asymmetrisches Verifikations-Tor (Council 30.6.2026): fängt STILLE Extraktions-
// Defekte, die die Vollständigkeits-/Struktur-Tore NICHT sehen, weil sie Token-
// bzw. Sidecar-Parität prüfen, nicht den TEXT-INHALT je Block. Bewusst NUR robuste,
// falsch-positiv-freie Invarianten (auf dem geltenden Korpus kalibriert = 0 Treffer):
//
//   1. Kein HTML-Markup im Body — ein «<…>» im Block-/Item-Text bedeutet, der
//      Tag-Strip (entferneTags) hat versagt (Fussnoten-/Navigations-Leak, N-Klasse).
//   2. Keine unaufgelöste HTML-Entity («&nbsp;», «&amp;», «&#…;») — Zeichen, das
//      der Entity-Dekoder übersehen hat (zweite Wahrheit im Text).
//   3. Kein geleaktes lat. Zähl-Suffix am Textanfang («bis .», «ter )») — die
//      exakte N1-Fehlerklasse: das Suffix gehört an die Marke/Nummer, nie in den
//      Fliesstext. Direkter Regressionswächter für den N1-Fix.
//
// BEWUSST NICHT als Tor (auf dem Korpus als NICHT-invariant nachgewiesen):
//   • Absatz-Lückenlosigkeit (1→2→3) — echte Teil-Aufhebungen erzeugen legitime
//     Lücken (z.B. AHVV art_15 «1,3» = Abs. 2 aufgehoben); ein Tor wäre falsch-positiv.
//   • Marken-Format — Anhänge tragen beschreibende Legenden-Marken («SEM», «Flupo»).
//   • Wort-Containment gegen die Quelle — der naive Quell-Diff rauscht 28–58 %
//     (Council-Befund); Token-Vollständigkeit + Leerblock-Sanity deckt check:
//     vollstaendigkeit bereits ab.

export interface InvariantenEintrag {
  id?: string;
  artikel?: string;
  bloecke: Array<{
    absatz?: string | null;
    text?: string;
    items?: Array<{ marke?: string; text?: string }>;
    titel?: string;
  }>;
}

export interface InvariantenVerstoss {
  gesetz: string;
  id: string;
  art: 'markup' | 'entity' | 'suffix-leak' | 'artefakt';
  stelle: string;
  ausschnitt: string;
}

const TAG_RE = /<[a-z!/][^>]*>/i;
const ENTITY_RE = /&[a-z]+;|&#\d+;/i;
// Negativ-Lexikon (Design-Gegenprüfung L2/L3): Generator-Artefakte, die BEIDE
// Quellformate teilen und darum symmetrisches Containment grün passieren — «[tab]»
// (Fedlex-`<placeholder message="E40S10-TAB">`/`<span data-message=…>`). Kein
// Snapshot-Feld darf ein solches Literal tragen (§1). Die HEUTE bekannten Bestands-
// stellen sind als Expected-Fail registriert (ARTEFAKT_ERWARTET) — sie blockieren
// nicht, aber jede NEUE Stelle / jede Zunahme in einem bekannten Artikel schlägt an.
const ARTEFAKT_RE = /\[tab\]|data-message/i;
// Artikel-Schlüssel (`gesetz|id`) → erwartete Artefakt-Trefferzahl (Bestand 5.7.2026,
// 24 Stellen / 14 Artikel; HTML-seitiger Alt-Bug, kontrollierte Sanierung = eigener
// Folge-Batch). Artikel-Ebene statt Block-Index = robust gegen Index-Verschiebung.
export const ARTEFAKT_ERWARTET: ReadonlyMap<string, number> = new Map([
  ['AHVG|bund/AHVG/art_3', 1],
  ['AHVV|bund/AHVV/art_6', 1],
  // ASYLV2 art_41 Abs. 2: Formel (PB = …) im geltenden Stand 20260612 als
  // <dl>-Spacer serialisiert (marke «[tab]»); Formeltext im Item-Text erhalten.
  // Alt-Stand hatte marke «p». Expected-Fail (QS-CURRENCY P1-a 5.7.2026),
  // Sanierung = eigener [tab]-Batch.
  ['ASYLV2|bund/ASYLV2/art_41', 1],
  ['AVO|bund/AVO/art_216', 2],
  ['BPV|bund/BPV/art_116', 1],
  ['CHEMV|bund/CHEMV/art_2', 2],
  ['KLV|bund/KLV/art_5', 1],
  ['RPV|bund/RPV/art_43', 1],
  ['VTS|bund/VTS/annex_6', 1],
  ['VTS|bund/VTS/annex_9', 8],
  ['VVV|bund/VVV/annex_1', 1],
  ['VVV|bund/VVV/annex_4', 1],
  ['VZV|bund/VZV/annex_2', 2],
  // W2·27-BUND-FERTIG (30.9.2026): VZV «Beilage» (annex_u1, neu im Snapshot) — 3 Tab-Platzhalter
  // (Kategorien/Unterkategorien/Spezialkategorien); Item-TEXT vollständig, nur das Marken-Label
  // trägt den Fedlex-Platzhalter. Sanierung = der deferierte [tab]-Batch.
  ['VZV|bund/VZV/annex_u1', 3],
  ['ZPO|bund/ZPO/art_250', 1],
  // ── P1-a/b Kanonik-Re-Pin (11.7.2026): die kanonischen isExemplifiedBy-
  // Fassungen tragen mehr Anhang-/Tabellen-Inhalt als die alten Alias-Dumps →
  // 23 NEUE «[tab]»-Marker-Artefakte in 14 Artikeln/Anhängen. EMPIRISCH geprüft:
  // reine MARKER-Label-Artefakte (Fedlex-Tab-Platzhalter) — der Item-TEXT ist je
  // vollständig erhalten (Muster STG art_22: marke «[tab]», text «abis. Lebens-
  // versicherung, soweit diese der beruflichen Vorsorge …»; STG-Tarife art_6/art_8
  // unversehrt). KEIN Textverlust, kein Parser-Eingriff (Quelle alias→kanonisch);
  // Sanierung = der deferierte [tab]-Batch (P5). Beleg: fedlex-pin-kanonik-2026-07-11.md.
  ['ENTG|bund/ENTG/art_19', 1],
  ['FAV|bund/FAV/annex_5', 5],
  ['FZA|bund/FZA/annex_II', 2],
  ['HREGV|bund/HREGV/art_171', 1],
  ['HZUE|bund/HZUE/annex_u1', 2],
  ['IRSG|bund/IRSG/art_109', 1],
  ['LUGUE|bund/LUGUE/annex_VI', 2],
  ['MVG|bund/MVG/art_95_a', 1],
  ['STG|bund/STG/art_1', 1],
  ['STG|bund/STG/art_6', 2],
  ['STG|bund/STG/art_7', 1],
  ['STG|bund/STG/art_22', 2],
  ['VSTRR|bund/VSTRR/art_29', 1],
  ['VSTV|bund/VSTV/art_47', 1],
]);
// Text, der mit einem freistehenden lat. Zähl-Suffix + Trenner beginnt (der
// N1-Leak «a bis .» → Text «bis . …»). Nur am ANFANG, gefolgt von Punkt/Klammer,
// damit legitime Sätze mit «bis» («… bis zum Ende …») nicht getroffen werden.
const SUFFIX_LEAK_RE = /^(?:bis|ter|quater|quinquies|sexies)\s*[.)]/i;

function pruefeText(
  gesetz: string,
  id: string,
  stelle: string,
  text: string | undefined,
  raus: InvariantenVerstoss[],
): void {
  if (!text) return;
  if (TAG_RE.test(text)) raus.push({ gesetz, id, art: 'markup', stelle, ausschnitt: text.slice(0, 80) });
  if (ENTITY_RE.test(text)) raus.push({ gesetz, id, art: 'entity', stelle, ausschnitt: text.slice(0, 80) });
  if (SUFFIX_LEAK_RE.test(text)) raus.push({ gesetz, id, art: 'suffix-leak', stelle, ausschnitt: text.slice(0, 80) });
  if (ARTEFAKT_RE.test(text)) raus.push({ gesetz, id, art: 'artefakt', stelle, ausschnitt: text.slice(0, 80) });
}

/** Prüft alle Text-Felder eines Gesetzes auf die drei Invarianten. */
export function pruefeInvarianten(gesetz: string, eintraege: InvariantenEintrag[]): InvariantenVerstoss[] {
  const raus: InvariantenVerstoss[] = [];
  for (const e of eintraege) {
    const id = e.id ?? e.artikel ?? '(ohne id)';
    e.bloecke.forEach((b, bi) => {
      pruefeText(gesetz, id, `block[${bi}].text`, b.text, raus);
      pruefeText(gesetz, id, `block[${bi}].titel`, b.titel, raus);
      (b.items ?? []).forEach((it, ii) => {
        pruefeText(gesetz, id, `block[${bi}].item[${ii}].text`, it.text, raus);
        // Marken NUR auf Markup/Entity/Artefakt prüfen, NICHT auf Suffix-Leak (Anhang-
        // Legenden-Marken sind beschreibender Text, kein Leak). Das «[tab]»-Artefakt
        // sitzt fast ausschliesslich in Marken (Bestand 2.7.2026).
        if (it.marke) {
          const markeStelle = `block[${bi}].item[${ii}].marke`;
          if (TAG_RE.test(it.marke)) raus.push({ gesetz, id, art: 'markup', stelle: markeStelle, ausschnitt: it.marke.slice(0, 80) });
          if (ENTITY_RE.test(it.marke)) raus.push({ gesetz, id, art: 'entity', stelle: markeStelle, ausschnitt: it.marke.slice(0, 80) });
          if (ARTEFAKT_RE.test(it.marke)) raus.push({ gesetz, id, art: 'artefakt', stelle: markeStelle, ausschnitt: it.marke.slice(0, 80) });
        }
      });
    });
  }
  return raus;
}
