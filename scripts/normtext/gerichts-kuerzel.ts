// Ausgelagert aus entscheide-mapping.ts (§6.6 check:schlankheit, 25.9.2026) —
// reine Daten + Belegregel; die Auflösung (gerichtsKuerzelKey, normKeyImSnapshot)
// bleibt in entscheide-mapping.ts. Keine Imports (Zyklus-frei).

// ─── VOM BUNDESGERICHT IM URTEIL SELBST DEFINIERTE KÜRZEL ────────────────────
// (QS-KORPUS, Entscheid Orchestrator 25.9.2026 «Weg A», Anlass CI-Lauf
// 36124134898: check:normkeys rot, Token «CV» in 20 Snapshots)
//
// WAS HIER HINEINGEHÖRT — und nur das: Kürzel für einen Erlass, der im
// ERLASS_REGISTER steht, für den Fedlex aber KEIN amtliches Kurzzeichen führt
// (kein `jolux:titleShort` in der betreffenden Sprache) und den das
// Bundesgericht im Urteil selbst definiert («… (ci-après: CV; RS 0.111)»). Die
// generierte ABK_ALIASE-Ebene kann solche Kürzel strukturell nicht tragen — sie
// ist bewusst Fedlex-only. Ohne diese Tabelle verschwände jedes Zitat lautlos,
// obwohl Erlass und Register-Eintrag feststehen; der Kopf von
// check-normkeys-abdeckung.ts nennt das ausdrücklich «offene Arbeit, keine
// Ausnahme» — darum Zuordnung statt Ignore-Eintrag.
//
// GELTUNG: nur Snapshots mit `gerichtstyp === 'bundesgericht'` (bge/bger). Ein
// Kürzel, das das Bundesgericht definiert, ist für kantonale oder eidg.
// Entscheide kein Beleg (dort kann dieselbe Buchstabenfolge anderes meinen) —
// `normKeyFuerAbk` (datumsfrei, auch vom kantonalen Resolver benutzt) sieht
// diese Tabelle darum NICHT; nur die snapshot-gebundenen Pfade (normKeyImSnapshot).
//
// `sprachen` benennt die Sprache der Definitionsstellen. Nicht als Filter auf
// `snap.sprache` angewandt: deutschsprachige BGE tragen die fr/it-Regeste-
// Fassungen im selben Snapshot (Beleg bund/bge/151_II_494 [de]: «Regeste
// Art. 31 et 32 CV; art. 11 par. 1 CDI CH-DK»), und ein Sprachfilter verlöre
// genau diese Nennungen.
//
// REGEL FÜR NEUE EINTRÄGE (dieselbe Belegform, sonst kein Eintrag, §7):
//   (1) ≥ 3 BGE mit wörtlicher Definitionsstelle (Titel + Kürzel + SR/RS),
//   (2) Fedlex-SPARQL-Nachweis «kein titleShort» mit Abrufdatum,
//   (3) Abgrenzung gegen verwechselbare Kürzel im selben Rechtsgebiet,
//   (4) Register-Key über die SR-Nummer auflösbar (sonst: Korpus-Kandidat,
//       nicht hier).
// Eine Kollision mit einem Register-/Fedlex-Kürzel verwirft den Eintrag und
// erscheint in GERICHTS_KUERZEL_NOTIZEN (nie raten, §1).
export interface GerichtsKuerzel {
  readonly abk: string;
  readonly sr: string;
  readonly sprachen: ReadonlyArray<'fr' | 'it'>;
  readonly beleg: string;
}

export const GERICHTS_KUERZEL: ReadonlyArray<GerichtsKuerzel> = [
  {
    abk: 'CV',
    sr: '0.111',
    sprachen: ['fr', 'it'],
    beleg:
      'Wiener Übereinkommen vom 23. Mai 1969 über das Recht der Verträge, SR 0.111 '
      + '(Register-Key VRK). Definitionsstellen: bund/bge/152_II_233 «Convention de '
      + 'Vienne du 23 mai 1969 sur le droit des traités (ci-après: CV; RS 0.111)»; '
      + 'bund/bge/151_II_726 «Convenzione di Vienna, conclusa il 23 maggio 1969, sul '
      + 'diritto dei trattati (in seguito: CV [RS 0.111])»; bund/bge/149_III_235 '
      + '«… sur le droit des traités (RS 0.111; ci-après: CV)»; ebenso 147_II_1, '
      + '147_V_402, 151_II_213. Alle 20 Snapshots der Tor-Erhebung (25.9.2026) sind '
      + 'BGE und zitieren Art. 24–32/60 im Sinn des Vertragsrechts. Fedlex-SPARQL '
      + '(Abruf 25.9.2026, Notation 0.111): Titel FRA «Convention de Vienne du 23 mai '
      + '1969 sur le droit des traités», ITA «Convenzione di Vienna del 23 maggio 1969 '
      + 'sul diritto dei trattati» — KEIN jolux:titleShort in DE/FR/IT. Abgrenzung: '
      + 'das Wiener Übereinkommen über diplomatische Beziehungen (SR 0.191.01) trägt '
      + 'beim Bundesgericht das EIGENE Kürzel «CVRD» (bund/bge/152_III_190: «Convention '
      + 'de Vienne sur les relations diplomatiques du 18 avril 1961 (CVRD; RS 0…», im '
      + 'selben Urteil «CV; RS 0.111» für das Vertragsrecht) — CVRD wird hier nicht '
      + 'berührt.',
  },
];
