// ─── Entwurf ↔ Beschluss («hat das Parlament den Entwurf verändert?») ────────
//
// E6 von «Entstehung am Artikel» (FAHRPLAN-MATERIALIEN-VERZAHNUNG §11.4/§11.7).
// Zu einer Vorlage veröffentlicht das Bundesblatt zwei Erlass-Texte: den ENTWURF des
// Bundesrats (Verfahrens-Ereignis `type-projet/2`) und den SCHLUSSABSTIMMUNGSTEXT der
// Bundesversammlung (`type-projet/300`). Der Vergleich beantwortet die Praktikerfrage
// «stand das im Entwurf auch schon so?».
//
// JOIN ÜBER DAS LABEL, NIE ÜBER DIE id (Recherche R3, 6.9.2026): beide Dokumente führen
// `<article class="man-art-mod" id="mod_uN">` mit rein SEQUENZIELLER Zählung. Ein im
// Parlament eingefügter Artikel verschiebt alle nachfolgenden `mod_uN` — ein id-Abgleich
// ordnete gemessen 7 von 41 Artikeln (17 %) FALSCH zu. Die Artikelbezeichnung steht nur
// im Überschriften-Text.
//
// GRENZE, die die Oberfläche benennt (§8): der Join läuft über das VOLLSTÄNDIGE,
// normalisierte Label. Ändert das Parlament zugleich den Sachtitel, erscheint derselbe
// Artikel als «nur im Entwurf» UND «nur im Beschluss» — zwei ehrliche Einträge statt
// einer geratenen Zuordnung (§1: keine falsche Behauptung am Artikel). Eine Grammatik,
// die «Art. 16c Abs. 3 Bst. a» vom Sachtitel trennt, wäre offen und damit §2-widrig.
//
// §3 Schichtentrennung: Typen + Lazy-Loader. Keine UI, keine Rechtslogik.

/** Wie das Parlament einen Entwurfs-Artikel angefasst hat. */
type EntwurfArt =
  /** Label in beiden Dokumenten, Wortlaut verschieden. */
  | 'geaendert'
  /** Label nur im Entwurf — gestrichen ODER im Beschluss anders betitelt (§8). */
  | 'nur_entwurf';

/** Ein Artikel des bundesrätlichen Entwurfs, der den Beschluss nicht unverändert erreichte. */
export interface EntwurfArtikel {
  /** Normalisiertes Label = der Join-Schlüssel. */
  schluessel: string;
  /** Amtliches Label im Entwurf, verbatim zitiert. */
  label: string;
  /** `id` im Entwurfs-HTML («mod_u7») — reine Fundstelle, NIE Join-Schlüssel. */
  id: string;
  art: EntwurfArt;
  /** Wortlaut im Entwurf (das «Vorher» der parlamentarischen Beratung). */
  entwurf: string;
  /** sha256 über den normalisierten Entwurfs-Wortlaut. */
  shaNorm: string;
}

/** Ein ausgewertetes BBl-Dokument (Quell-Beleg, §7 a–d). */
interface EntwurfDokument {
  /** ELI-Kurzform, z. B. «fga/2025/1529». */
  fga: string;
  /** Filestore-URL des ausgewerteten HTML (aus `isExemplifiedBy`, nie konstruiert). */
  htmlUrl: string;
  /** Live-Link zur amtlichen Fassung (§7c). */
  liveUrl: string;
  /** sha256 über das abgerufene HTML (§7d). */
  sha: string;
  /** Datum des Verfahrens-Ereignisses (ISO) oder null. */
  datum: string | null;
  /** Zahl der `man-art-mod`-Blöcke im Dokument. */
  bloecke: number;
}

/** Shard je Vorlage: `public/materialien/synopse-entwurf/<BOTSCHAFT-KEY>.json`. */
export interface EntwurfShard {
  /** Botschafts-Key (= Dateiname ohne .json). */
  botschaft: string;
  /** Projekt-Knoten des Fedlex-Graphen. */
  projEli: string;
  /** Erlass-Keys der Vorlage (amtlich aus dem SR-Join der Botschaften-Query). */
  erlassKeys: string[];
  normProfil: string;
  erzeugt: string;
  abgerufen: string;
  entwurfDok: EntwurfDokument;
  beschlussDok: EntwurfDokument;
  /** Labels in beiden Dokumenten mit identischem Wortlaut (Zahl, nicht Text — §5). */
  unveraendert: number;
  /** Labels nur im Beschluss (im Parlament eingefügt ODER umbenannt) — nur Labels. */
  nurBeschluss?: string[];
  /** Struktur-Anweisungen des Entwurfs ohne eigenen Wortlaut («Gliederungstitel nach
   *  Art. 10») — nichts zu vergleichen, aber auch nichts zu verschweigen (§8). */
  ohneWortlaut?: string[];
  artikel: EntwurfArtikel[];
}

/** Verzeichnis der Shards (lädt erst auf Klick). */
export const ENTWURF_DIR = 'public/materialien/synopse-entwurf';

const cache = new Map<string, Promise<EntwurfShard | null>>();

/** Lädt den Entwurf↔Beschluss-Shard einer Botschaft — LAZY (§15). */
export function ladeEntwurfShard(botschaftKey: string): Promise<EntwurfShard | null> {
  const vorhanden = cache.get(botschaftKey);
  if (vorhanden) return vorhanden;
  const p = fetch(`/materialien/synopse-entwurf/${encodeURIComponent(botschaftKey)}.json`)
    .then((r) => (r.ok ? (r.json() as Promise<EntwurfShard>) : null))
    .catch(() => null);
  cache.set(botschaftKey, p);
  return p;
}

/** Tiefer Link auf den Artikel im amtlichen Entwurf (Live-Link + Fragment, §7c). */
export function entwurfUrl(s: EntwurfShard, a: EntwurfArtikel): string {
  return `${s.entwurfDok.liveUrl}#${a.id}`;
}
