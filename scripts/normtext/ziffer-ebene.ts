// Ziffer-Ebene eines Bund-Artikels (HN-05-Auflage, W2·27-BUND-FERTIG P6).
//
// Fedlex kennt unterhalb des Artikels KEINEN Anker (die HTML-ids enden bei
// `art_N`; verifiziert gegen die gepinnten Filestore-HTMLs BV 20240303, StGB
// 20261001). Zwei amtliche Markup-Formen tragen aber eine Ziffer-Ebene, die
// bisher im Snapshot nicht adressierbar war («Art. 197 Abs. 1 BV» mehrdeutig —
// jede Ziffer zählt ihre Absätze neu; «Art. 139 Ziff. 3 StGB» nicht auffindbar):
//
//  (A) ÜBERSCHRIFT-Ziffer (BV Art. 196/197, ParlG Art. 173):
//      <p class="man-template-tab-utit-kurs …">12.<fn> Übergangsbestimmung …</p>
//      gefolgt von den Absätzen der Ziffer. Die Überschrift wurde bisher stumm
//      verworfen; jetzt ein `titel`-Block mit `ziffer`, ALLE folgenden Blöcke
//      bis zur nächsten Überschrift tragen dieselbe `ziffer`.
//  (B) ABSATZ-Ziffer (StGB, MStG, VStrR, LugÜ, GFK …):
//      <p class="absatz">1.&nbsp;&nbsp;Wer …</p> — die Ziffer steht statt der
//      <sup>-Absatznummer (Strafnormen werden «Art. 139 Ziff. 1 StGB» zitiert).
//      Der Text bleibt VERBATIM («1. Wer …»), der Block bekommt `ziffer`; die
//      folgenden Blöcke (Aufzählung, unnummerierte Folge-Absätze = Abs. 2 …)
//      erben sie bis zur nächsten Ziffer.
//
// `ziffer` ist reine Struktur wie `titel`/`absatz` — es fliesst NICHT in den
// Block-sha (Text und items sind dort abgedeckt, golden-neutral ausser der neu
// erfassten Überschrift-Texte). Konvention des Zitats: `PassusInfo.ziff`
// (passus.ts) löst gegen `ziffer` auf, bevor es als Aufzählungs-Marke gilt
// (passusZiel.ts). Eigene Datei (wie stern-note.ts), damit der Extraktor nur
// eine Alternative, einen Zweig und einen Aufruf trägt.

/** Heading-Tiefe der Ziffer-Überschrift (kein <h>-Tag in der Quelle; 3 = «nicht flach», s. ArtikelBody). */
export const ZIFFER_TITEL_TIEFE = 3;

/** Nackte Ziffer-Marke: «12», «5bis», «3a» (ohne Punkt). */
const ZIFFER = '\\d+[a-z]{0,12}';

/**
 * Alternative für die Block-Regex des Extraktors (eine Fanggruppe = <p>-Inhalt):
 * jede Zwischentitel-Zeile `man-template-tab-utit*`. Ob sie eine Ziffer trägt,
 * entscheidet `zifferTitelBlock` — alle anderen Titel bleiben unverändert
 * verworfen (kein Block), exakt wie vor P6.
 */
export const ZIFFER_TITEL_ALTERNATIVE =
  '<p[^>]*\\bclass="[^"]*\\bman-template-tab-utit[\\w-]*\\b[^"]*"[^>]*>' + '((?:(?!</p>)[\\s\\S])*?)</p>';

const TITEL_RE = new RegExp(`^(${ZIFFER})\\.(?!\\d)`);

/**
 * Titel-Text (Tags und Fussnoten bereits entfernt) → Ziffer-Überschrift-Block
 * oder null. «331.1» (Dezimalnummer) und unnummerierte Titel sind keine Ziffer.
 */
export function zifferTitelBlock(
  text: string,
): { absatz: null; text: string; titel: number; ziffer: string } | null {
  const m = text.trim().match(TITEL_RE);
  return m ? { absatz: null, text: text.trim(), titel: ZIFFER_TITEL_TIEFE, ziffer: m[1] } : null;
}

/** Wie `zifferTitelBlock`, hängt den Block (falls Ziffer-Überschrift) an `bloecke` an — Einzeiler für den Extraktor. */
export function zifferTitelZu(bloecke: unknown[], text: string): void {
  const b = zifferTitelBlock(text);
  if (b) bloecke.push(b);
}

// «N.» + optional ein Fussnoten-<sup> + ZWEI &nbsp; — die Doppel-nbsp-Signatur
// trennt die Ziffer-Absatz-Form sicher von Tagesdaten («1. Januar 2020 …») und
// Bereichs-Auslassungen («2. und 3. …»); einfaches «1.&nbsp;Die» (SSV 116, FZV 24:
// 3 von 909 Fällen im Pin-Korpus) bleibt bewusst unerkannt (§1: lieber keine
// Adresse als eine geratene).
const ABSATZ_ZIFFER_RE = new RegExp(
  `^(?:\\s|</?inl>)*(${ZIFFER})\\.(?:<sup\\b[^>]*><a\\b[\\s\\S]*?</a></sup>)?&nbsp;&nbsp;(?!&nbsp;)`,
);

/** Quell-Span eines Blocks (`<p class="absatz">…</p>`) → Ziffer der Absatz-Ziffer-Form oder null. */
export function zifferAbsatzNummer(quellSpan: string | null): string | null {
  if (quellSpan == null) return null;
  const k = quellSpan.match(/^<p\b[^>]*\bclass="[^"]*\babsatz\b[^"]*"[^>]*>([\s\S]*)<\/p>$/i);
  if (k == null) return null;
  const m = k[1].match(ABSATZ_ZIFFER_RE);
  return m ? m[1] : null;
}

/**
 * Ordnet jedem Block seine Ziffer zu (Nachlauf über die fertigen Blöcke;
 * `quellen` ist deckungsgleich mit `bloecke`, A31a). Hat der Artikel
 * Überschrift-Ziffern (A), gewinnen sie: verschachtelte «1.»-Absätze darunter
 * würden die Ziffer sonst überschreiben. Blöcke VOR der ersten Ziffer bleiben
 * ohne `ziffer`.
 */
export function ordneZiffern(
  bloecke: Array<{ titel?: number; ziffer?: string }>,
  quellen: ReadonlyArray<string | null>,
): void {
  const hatUeberschriften = bloecke.some((b) => b.titel === ZIFFER_TITEL_TIEFE && b.ziffer != null);
  let aktuell: string | null = null;
  for (let i = 0; i < bloecke.length; i++) {
    const b = bloecke[i];
    if (b.titel === ZIFFER_TITEL_TIEFE && b.ziffer != null) {
      aktuell = b.ziffer;
      continue;
    }
    if (!hatUeberschriften) aktuell = zifferAbsatzNummer(quellen[i] ?? null) ?? aktuell;
    if (aktuell != null) b.ziffer = aktuell;
  }
}
