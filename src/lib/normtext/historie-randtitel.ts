// ─── Historie · Randtitel-Prädikate («Randtitel zählt nicht», Entscheid David 3.10.2026) ──
//
// Aus `historie-parse.ts` ausgelagert (§6.6 Datei-Schlankheit, Nachzug GP #1298): Wann datiert eine Fassungs-Fussnote an einem
// EIGENEN Randtitel nur diesen Randtitel (⇒ Chronik, nicht «Gilt seit»)? Reine Prädikate über Fussnoten-Wortlaut, §2-deterministisch;
// `sektionsAnalyse` (historie-parse.ts) ist der einzige Aufrufer. Quelle/Messung:
// bibliothek/normtext/randtitel-fussnote-gilt-seit-2026-10-03.md.

/** Schmale Struktur-Sicht auf eine Fussnote (`FnEingang` aus historie-parse.ts ist damit zuweisbar; kein Import ⇒ kein Zyklus). */
interface FnKern {
  text?: string;
  links?: ReadonlyArray<{ url: string }>;
  sektion?: string | null;
}

/** Lateinisches Vervielfältigungs-Suffix der Gliederungszeichen («Abis.», «Aquater.», «Asexies.», «Asepties.»). */
const GLIEDERUNG_SUFFIX = '(?:bis|ter|quater|quinquies|sexies|septies|octies|novies|decies)';
const GLIEDERUNGSZEICHEN_EINZEL =
  `(?:[IVXLC]{1,6}[a-z]?${GLIEDERUNG_SUFFIX}?|[A-Za-z]${GLIEDERUNG_SUFFIX}?|[a-z]{2}|\\d{1,3}[a-z]?${GLIEDERUNG_SUFFIX}?)\\.`;
// Einzeln («A.», «Asexies.») oder als Lauf («V.–VII.», «II. und III.», «2.–3.») — wie die Anzeige-Erkennung (darstellung.ts ENUM_RUN).
const GLIEDERUNGSZEICHEN = new RegExp(
  `^${GLIEDERUNGSZEICHEN_EINZEL}(?:\\s*(?:und|bis|[–-])\\s*${GLIEDERUNGSZEICHEN_EINZEL})*\\s+\\S`,
);

/**
 * Randtitel MIT Gliederungszeichen (Buchstabe/Ziffer, ggf. mit lat. Suffix: «A.», «IIIa.», «2bis.», «Asexies.»)? Entscheid
 * David 3.10.2026 («Randtitel zählt nicht»): eine Fassungs-Fussnote an einem solchen Randtitel datiert nur den Randtitel.
 * Das Gliederungszeichen ist ein STELLVERTRETER, kein amtliches Kriterium: Gesetzestechnische Richtlinien des Bundes (GTR,
 * Stand 5.6.2026) Rz. 81 sagt nur, dass bei Randtiteln mit Gliederung durch Ziffern/Buchstaben die Gliederung des ganzen
 * Erlasses zu überdenken ist (Randtitel statt Sachüberschrift, Rz. 79) — NICHT, dass ein Randtitel mit Gliederung keine
 * Artikel-Sachüberschrift sei. Die amtliche Anweisung selbst steht nur im AS-Erlass: Rz. 322 verlangt, dass die Änderung
 * eines Randtitels als «Randtitel» in der Anweisung genannt wird (AS 2017 3699: «Art. 299 Randtitel», «Art. 300 Randtitel»
 * ⇒ Körper unverändert). Die Sachüberschrift OHNE Gliederungszeichen bleibt eigen (VVG 47a: AS 2021 758 Anhang Ziff. 4
 * ändert Randtitel UND Körper; NHG 3: AS 1999 3071 «Art. 3 Randtitel und Abs. 4»). Wo das Zeichen als Stellvertreter
 * versagt, nimmt `randtitelNurRandtitel` die Fälle aus (Körper-Fundstelle, Ausdruck-Fussnote).
 * Eigenes Prädikat statt `darstellung.ts`: dessen Aufzähler-Erkennung (ENUM) kennt «Asexies.» nicht und bleibt (Anzeige, §3).
 * Quelle/Messung: bibliothek/normtext/randtitel-fussnote-gilt-seit-2026-10-03.md.
 */
export function randtitelMitAufzaehler(label: string): boolean {
  return GLIEDERUNGSZEICHEN.test(label.trim());
}

/** AS-Fundstellen einer Fussnote: Fedlex-`oc`-Links plus «AS <Jahr> <Seite>» im Wortlaut (ältere Fussnoten tragen oft keinen Link). */
function asQuellen(fn: FnKern): Set<string> {
  const q = new Set<string>();
  for (const l of fn.links ?? []) if (/\/eli\/oc\//.test(l.url)) q.add(l.url);
  for (const m of (fn.text ?? '').replace(/<[^>]+>/g, '').matchAll(/\bAS\s+(\d{4})\s+(\d+)/g)) q.add(`AS ${m[1]} ${m[2]}`);
  return q;
}

/**
 * Hat der Änderungserlass der Randtitel-Fussnote (`label`) auch den Körper dieses Artikels angefasst? Beleg: eine ANDERE
 * Fussnote des Artikels (Artikelnummer/Absatz/Buchstabe — ohne `sektion`) nennt dieselbe AS-Fundstelle. Dann lautete die
 * amtliche Anweisung «Art. N Randtitel und Abs. …» (GTR Rz. 322) und das Fassungsdatum gilt auch für den Artikel selbst
 * (Messung 3.10.2026: IPRG 11a «Randtitel und Abs. 4», OR 981 «Randtitel und Abs. 2»; NHG 3 «Randtitel und Abs. 4»).
 * Ohne gemeinsame Fundstelle gilt die Fussnote als reine Randtitel-Änderung (ZGB 299/300: «Art. 299 Randtitel»).
 */
function koerperTeiltQuelle(fussnoten: ReadonlyArray<FnKern> | undefined, label: string): boolean {
  const fns = fussnoten ?? [];
  const koerper = fns.filter((f) => !f.sektion).map(asQuellen);
  return fns.some((f) => f.sektion === label && [...asQuellen(f)].some((u) => koerper.some((k) => k.has(u))));
}

/**
 * Ist eine Randtitel-Fussnote eine «Ausdruck»-Fussnote (Ersatz eines Ausdrucks)? Erkennung am Segment-Anfang «Ausdruck gemäss»
 * (Verb-Kopf `ausdruck`) oder am amtlichen Zusatz «Diese Änd. wurde in den in der AS genannten Bestimmungen vorgenommen» /
 * «Diese Änd. ist im ganzen Erlass berücksichtigt». Eine solche Anweisung (Ersatz von Ausdrücken, GTR Rz. 327–330) nennt den
 * Randtitel nur als EINE der betroffenen Stellen und ändert auch den Körper (ZGB 124: AS 2023 92 Anhang Ziff. 1 «In den
 * Artikeln 124 Randtitel und Absatz 1 …»; OR 928c: AS 2021 758 Anhang Ziff. 3 «Randtitel sowie Absätze 1 und 2»; ZGB 4:
 * AS 1999 1118 Abs. 1 nennt Art. 4). Sie ist also keine reine Randtitel-Änderung, trotz Gliederungszeichen (Befund H1
 * Gegenprüfung 3.10.2026; Messung: 3 von 87).
 */
function ausdruckFussnote(fn: FnKern): boolean {
  return /^Ausdruck gemäss|Diese Änd\. (?:wurde in den in der AS genannten Bestimmungen vorgenommen|ist im ganzen Erlass berücksichtigt)/.test(
    (fn.text ?? '').replace(/<[^>]+>/g, '').trim(),
  );
}

/**
 * Reine Randtitel-Änderung (⇒ nur Chronik, nicht «Gilt seit»)? Nein, wenn der Änderungserlass auch den Körper angefasst hat
 * (`koerperTeiltQuelle`) oder eine der Fussnoten dieses Randtitels eine Ausdruck-Anweisung ist (`ausdruckFussnote`).
 * Bei gemischten Fussnoten desselben Randtitels gewinnt die Ausnahme (Verhalten wie auf main, §8: lieber keine Aussage als
 * eine falsche).
 */
export function randtitelNurRandtitel(fussnoten: ReadonlyArray<FnKern> | undefined, label: string): boolean {
  if ((fussnoten ?? []).some((f) => f.sektion === label && ausdruckFussnote(f))) return false;
  return !koerperTeiltQuelle(fussnoten, label);
}
