import type { ArtikelStruktur, StrukturMap } from '../../../lib/normtext/browse';
import type { NormSnapshot } from '../../../lib/normtext/typen';
import type { LandkarteEinheit } from '../../../components/leser/landkarteModell';

// ─── W2·28 · Erlass-Daten → Bausteine der Treffer-Landkarte ──────────────────
//
// Reine Projektion (§2/§3): aus den bereits geladenen Artikeln eines Erlasses
// wird die Folge der Bausteine, die `landkarteSpur` in Lagen umrechnet. Kein
// Netz, kein Index, keine zweite Suchwahrheit.
//
// ── DER MASSSTAB IST DER TEXTUMFANG, NICHT DIE ARTIKELZAHL ──────────────────
// Ein Erlass ist nicht gleichmässig gefüllt: Art. 336c OR trägt ein Vielfaches
// der Zeichen von Art. 1 OR. Zählte die Landkarte Artikel statt Zeichen, sässe
// die Marke eines langen Artikels deutlich neben der Stelle, an der er im Text
// wirklich steht. Gezählt wird darum, was auch gerendert wird: Bezeichnung,
// Absatztexte, Aufzählungspunkte, Tabellenzellen. Die Zahl ist eine NÄHERUNG an
// die gerenderte Höhe (Schriftgrad, Umbrüche und Randtitel gehen nicht ein) —
// genau darum bleibt der SPRUNG die eine genaue Auskunft (§8).
//
// ── DAS ABSCHNITTS-ETIKETT KOMMT AUS DER AMTLICHEN GLIEDERUNG ───────────────
// `struktur[token].gliederung[0].label` ist dieselbe Quelle, aus der
// `leserSuche.ts` das Feld `gruppe` der Trefferliste speist (§5). Trägt der
// Erlass keine Gliederung, bleibt das Etikett weg — es wird keines erfunden (§8).

/** Zeichen eines Artikels, so wie die Lesespalte ihn zeigt. */
function umfangVon(e: NormSnapshot): number {
  let n = e.artikelLabel.length;
  for (const b of e.bloecke) {
    n += (b.absatz?.length ?? 0) + b.text.length;
    for (const it of b.items ?? []) n += it.marke.length + it.text.length;
    for (const z of b.tabelle ?? []) n += z.beschreibung.length + z.betrag.length;
  }
  return n;
}

export function gesetzLandkarteEinheiten(
  eintraege: readonly NormSnapshot[],
  struktur: StrukturMap | null,
): LandkarteEinheit[] {
  return eintraege.map((e) => {
    const st: ArtikelStruktur | undefined = struktur?.[e.artikel];
    const oberste = st?.gliederung?.[0]?.label ?? null;
    return {
      id: e.artikel,
      label: e.artikelLabel,
      umfang: umfangVon(e),
      abschnitt: oberste,
    };
  });
}
