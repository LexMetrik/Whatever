// ─── Fedlex · Trägergesetz-Kontext (V-7c, W2·20-VERWEIS-SCHAERFE) ───────────
//
// Eigene Datei, weil die Tabelle einer ANDEREN Frage dient als `positivliste.ts`:
// dort wird ein Erlassname IM ZITAT aufgelöst, hier hängt die Auflösung am
// GELESENEN Erlass. Zugleich hält der Schnitt `positivliste.ts` unter der
// §6.6-Schwelle. Kette ohne Zyklus: tabelle ← traegergesetz ← parser.

import { type FedlexGesetz } from './tabelle';

// ─── V-7c · Trägergesetz-Kontext «Artikel N des Gesetzes» ────────────────────
//
// PROBLEM (gemessen 14.9.2026 über alle Bund-Snapshots): 35 Bund-Stellen
// zitieren «Artikel N des Gesetzes» — ohne Namen. Der des/der-Guard macht
// daraus Text. Der Verweis ist aber nicht unbestimmt: in einer Vollzugs-
// verordnung meint «das Gesetz» das Gesetz, auf das sie sich stützt.
//
// AMTLICHER BELEG, nicht Vermutung (§1/§7): der Gesetzgeber DEFINIERT die
// Kurzform selbst im Ingress, in der Klammer hinter dem zitierten Erlass —
// «gestützt auf Artikel 27 des Arbeitsgesetzes vom 13. März 1964 (Gesetz),».
// Ein Ingress mit mehreren zitierten Erlassen bleibt eindeutig, weil die
// Legaldefinition an genau einem davon hängt (ARGV1 nennt ArG, UVG und DSG —
// «(Gesetz, ArG)» steht nur beim Arbeitsgesetz).
//
// QUELLE (§5): `kopf.praeambel[rolle='ingress']` des Struktur-Sidecars
// `public/normtext/struktur/bund/<KEY>.json`, aus der amtlichen Fedlex-Fassung
// übernommen; das Register führt `quelleUrl`/`stand`. Diese Tabelle ist eine
// KURATIERTE Auswahl daraus, keine Ableitung: ein neuer Erlass mit derselben
// Wendung bekommt den Link erst, wenn er hier steht. Der Wächter
// `src/tests/fedlex-traegergesetz.test.ts` prüft JEDEN Eintrag gegen den
// Ingress (genau eine «(… Gesetz …)»-Klammer; das davor zitierte Erlassdatum
// ist das Erlassdatum des Ziels; der davor zitierte NAME löst über die
// bestehende Positivliste auf dasselbe Ziel auf) — ein erfundener Eintrag
// reisst das Tor.
//
// VOLLSTÄNDIGKEIT ist seit 14.9.2026 bewiesen, nicht behauptet (Gegenprüfung
// zu #864, Befund B1): der Wächter SWEEPT alle Bund-Struktur-Sidecars nach
// Ingress-Klammern, die die Kurzform «Gesetz» definieren, und verlangt
// Mengen-GLEICHHEIT in beide Richtungen mit dieser Tabelle. Die erste Fassung
// listete 7 von 9 Erlassen: ARGV3 und ARGV4 fehlten, weil ihre Klammer nicht
// «(Gesetz)» lautet, sondern «(nachstehend «Gesetz»)» — eine Form, die der
// damalige Handsweep nicht sah. Der Sweep kennt alle vier belegten Formen
// («Gesetz», «Gesetz, ArG», «Gesetz/UVG», «nachstehend «Gesetz»»).
//
// NICHT aufgenommen (gemessene Gegenprobe, bleiben Text — kein Ingress dieser
// Erlasse definiert die Kurzform «Gesetz», darum sind sie auch im Sweep nicht):
//   · bund/BANKG art_16 und bund/GSCHG art_83 — Gesetze ohne solche
//     Legaldefinition im Ingress;
//   · bund/LUGUE annex_I (3 Stellen) — «des Gesetzes zur Lösung von
//     Gesetzeskollisionen …» ist ein AUSLÄNDISCHES Gesetz, kein Trägergesetz;
//   · bund/KKV art_128 (2 Stellen) — der KKV-Ingress definiert nur «(KAG)».
//     Gemeint ist das KAG; ein Sprung auf KKV Art. 124/120 wäre falsch. Diese
//     Restklasse hält seit 14.9.2026 der Guard `GESETZES_GENITIV`
//     (NormText.tsx, V-7d) als Text fest — vorher war sie ein Self-Link.
export interface TraegerEintrag {
  /** Register-Key der Verordnung (= letztes Segment des Lese-Basispfads). */
  verordnung: string;
  /** Das im Ingress als «Gesetz» legaldefinierte Trägergesetz. */
  gesetz: FedlexGesetz;
  /** Beleg: der Ingress-Wortlaut mit der Legaldefinition, wörtlich. */
  beleg: string;
}
export const TRAEGER_EINTRAEGE: ReadonlyArray<TraegerEintrag> = [
  {
    verordnung: 'ARGV1', gesetz: 'ArG',
    beleg: 'gestützt auf Artikel 40 des Arbeitsgesetzes vom 13. März 1964 (Gesetz, ArG)',
  },
  {
    verordnung: 'ARGV2', gesetz: 'ArG',
    beleg: 'gestützt auf Artikel 27 des Arbeitsgesetzes vom 13. März 1964 (Gesetz),',
  },
  // ARGV3/ARGV4 (Nachzug 14.9.2026, Befund B1): Klammerform «(nachstehend
  // «Gesetz»)». Amtlich selbst geöffnet — SPARQL-Fassungsfenster + AKN-XML aus
  // dem Fedlex-Filestore (Content-Type application/xml, kein Casemates-Shell):
  //   ArGV 3, SR 822.113, ELI cc/1993/2553_2553_2553, Fassung 2024-09-01
  //   ArGV 4, SR 822.114, ELI cc/1993/2564_2564_2564, Fassung 2015-05-01
  // Ziel ist beide Male das ArG (SR 822.11, Stand 1.9.2023).
  {
    verordnung: 'ARGV3', gesetz: 'ArG',
    beleg: 'gestützt auf die Artikel 6 Absatz 4 und 40 des Arbeitsgesetzes vom 13. März 1964 (nachstehend «Gesetz»),',
  },
  {
    // ArGV 4 zitiert im Ingress zusätzlich das UVG — ohne Kurzform-Klammer.
    // Die Legaldefinition hängt allein am Arbeitsgesetz, der Sweep zählt
    // darum weiterhin genau eine «Gesetz»-Klammer.
    verordnung: 'ARGV4', gesetz: 'ArG',
    beleg: 'gestützt auf die Artikel 8 und 40 des Arbeitsgesetzes vom 13. März 1964 (nachstehend «Gesetz»)',
  },
  {
    verordnung: 'UVV', gesetz: 'UVG',
    beleg: 'auf das Bundesgesetz vom 20. März 1981 über die Unfallversicherung (Gesetz/UVG)',
  },
  {
    verordnung: 'MVV', gesetz: 'MVG',
    beleg: 'des Bundesgesetzes vom 19. Juni 1992 über die Militärversicherung (Gesetz),',
  },
  {
    verordnung: 'LSV', gesetz: 'USG',
    beleg: 'des Umweltschutzgesetzes vom 7. Oktober 1983 (Gesetz),',
  },
  {
    verordnung: 'LRV', gesetz: 'USG',
    beleg: 'des Bundesgesetzes vom 7. Oktober 1983 über den Umweltschutz (Gesetz),',
  },
  {
    verordnung: 'VKL', gesetz: 'KVG',
    beleg: 'gestützt auf Artikel 96 des Bundesgesetzes vom 18. März 1994 über die Krankenversicherung (Gesetz),',
  },
];

const TRAEGER_BY_KEY = new Map<string, FedlexGesetz>(
  TRAEGER_EINTRAEGE.map((e) => [e.verordnung.toUpperCase(), e.gesetz]),
);

/**
 * Trägergesetz des GELESENEN Erlasses — das Gesetz, das sein Ingress als
 * «Gesetz» legaldefiniert. Ohne Eintrag null (⇒ «des Gesetzes» bleibt Text).
 *
 * @param erlassKey Register-Key des gelesenen Erlasses (letztes Segment des
 *        Lese-Basispfads, z. B. `ARGV1`).
 */
export function traegergesetzFuerErlass(erlassKey: string | undefined): FedlexGesetz | null {
  return erlassKey ? TRAEGER_BY_KEY.get(erlassKey.toUpperCase()) ?? null : null;
}
