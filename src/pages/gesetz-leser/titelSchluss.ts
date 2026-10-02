// ─── Ist der Registerwert `kuerzel` der abgespaltene SCHLUSS des Titels? ──────
//
// BEFUND (Prüfer-Befund F1/F2 zu PR #1261, 2.10.2026; amtliche Abrufe am selben
// Tag): Bei einigen Kantonserlassen ist `kuerzel` im Register kein Kurztitel,
// sondern der Teil des amtlichen Titels NACH dem letzten Komma. Die Ableitung im
// Datenpfad (`scripts/normtext/browse-manifest.ts`, `identitaetAusErlass` +
// `istKuerzelFragment`) teilt am letzten Komma und lässt den Tail durch, sobald
// IRGENDEIN Wort wie eine Erlassform endet («Handgelübde», «Vollziehungs-
// verordnung», «Tarifverbund») — so wurde aus dem amtlichen Titel
//
//   BS-154.123 «Reglement über das von den Präsidentinnen …, nebenamtlichen
//              Richterinnen und Richtern, Gerichtsschreiberinnen … abzulegende
//              Handgelübde»
//
// ein `titel` («… nebenamtlichen Richterinnen und Richtern») und ein «Kürzel»
// («Gerichtsschreiberinnen … Handgelübde»). Amtlich gilt immer
// `titel + ", " + kuerzel` (BS: gesetzessammlung.bs.ch/api/de/texts_of_law/<nr>,
// ZH: zh.ch/…/zhlex-ls/erlass-<nr>-….html, abgerufen 2.10.2026).
//
// Wer so einen Wert verwirft (PR-Stand dc4c1e08f: Längen-Deckel 70) oder als
// «Kennung» vor den Titel stellt, zeigt einen falschen Titel (§1, §8). Darum
// erkennt diese Regel den Schluss INHALTLICH und der Kopf zeigt dann den ganzen
// Titel — nie weniger als der Registerwert hergibt.
//
// ── DIE REGEL (rein, deterministisch, §2) ────────────────────────────────────
// `kuerzel` K ist ein Titel-Schluss, wenn K weder gleich einem noch Teil des
// Titels ist UND mindestens eines zutrifft:
//
//  S1  K beginnt klein UND hat ≥ 3 Wörter («handelnd aufgrund seines …», «en lien
//      avec le …»), oder K beginnt mit einem Aufzählungs-Buchstaben «b) …».
//      Echte kleinbeginnende Kürzel sind kurz («eGovG», «kEnG», «kant. BBV»,
//      «kantonale Waldverordnung», «ad personam-Verordnung»: ≤ 2 Wörter).
//  S2  K enthält ein Relationswort der Satzverbindung als eigenes Wort:
//      betreffend · gemäss · sowie · zwischen · aufgrund · handelnd ·
//      nachstehend · namens («… sowie den Mitarbeitenden …», «Solothurn
//      betreffend den integralen …», «Kosten und Entschädigungen gemäss …»).
//      Ein Kurztitel verbindet nichts mit dem Titel — er benennt.
//  S3  K ist «<Text> (<Klammer>)» mit ≥ 2 Wörtern vor der Klammer, und der Text
//      VOR der Klammer enthält kein Erlassform-Wort («Auskunftspersonen und
//      Sachverständigen (Entschädigungsverordnung der obersten Gerichte)»: der
//      Klammerinhalt ist das Kürzel des GANZEN Titels, der Text davor sein Rest).
//      Hat der Text vor der Klammer ein Erlassform-Wort («Anerkennungsverordnung
//      Inland (AVO Inland)», «Notariatsgebührenverordnung (221.101 …)»), ist es
//      ein Kurztitel mit Zusatz.
//
// Trifft nichts zu, bleibt K, was es bisher war (Kennung bzw. «Titel (Kürzel)»):
// UNENTSCHEIDBARE Werte werden damit nie verworfen — K steht dann vollständig
// im Kopf, nur in der gewohnten Kürzel-Form. Kalibriert und bewiesen an ALLEN
// 41 Registerwerten «Kürzel ≠ Titel, nicht im Titel enthalten, Länge > 30»
// (6 Titel-Schlüsse, 35 Kurztitel) und an allen 506 Werten «Kürzel ≠ Titel,
// nicht im Titel enthalten» (keine weitere Zuordnung): `src/tests/leser-titel-kopf.test.ts`.
//
// WURZEL im Datenpfad (nicht hier behoben): `istKuerzelFragment` müsste den Tail
// nach dem Satzglied-Charakter beurteilen statt nach «irgendein Wort endet auf
// eine Erlassform». Wird das dort behoben, stehen diese Erlasse im Register mit
// `kuerzel == titel`, und diese Regel greift nie mehr — sie kann dann entfallen.

/** Dieselbe Liste wie `KUERZEL_FORM_RE` in `scripts/normtext/browse-manifest.ts`
 *  (Schichtentrennung: `src/` importiert nicht aus `scripts/`). */
const ERLASSFORM_RE =
  /(gesetz|verordnung|reglement|ordnung|vertrag|vereinbarung|übereinkommen|uebereinkommen|konkordat|abkommen|statut|verfassung|beschluss|dekret|weisung|richtlinie|tarif|programm|prämie|preis|fonds|verbund|gelübde|gesetzessammlung)$/i;

const RELATIONSWORT_RE = /(^|\s)(betreffend|gemäss|sowie|zwischen|aufgrund|handelnd|nachstehend|namens)(\s|$)/;

function woerter(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

/** S1 — klein beginnend mit ≥ 3 Wörtern, oder Aufzählungs-Buchstabe «b) …». */
function satzAnfang(k: string): boolean {
  if (/^[A-Za-zÄÖÜäöü]\)\s/.test(k)) return true;
  return /^[a-zäöüéèà]/.test(k) && woerter(k).length >= 3;
}

/** S2 — ein Relationswort als eigenes Wort. */
function hatRelationswort(k: string): boolean {
  return RELATIONSWORT_RE.test(k);
}

/** S3 — «<Text ≥ 2 Wörter> (<Klammer>)», im Text kein Erlassform-Wort. */
function restMitKlammerKuerzel(k: string): boolean {
  const m = k.match(/^(.*?)\s*\((?:[^()]|\([^()]*\))*\)\s*$/);
  const vor = m?.[1]?.trim() ?? '';
  const w = woerter(vor);
  if (w.length < 2) return false;
  return !w.some((x) => ERLASSFORM_RE.test(x.replace(/[(),;:]/g, '')));
}

/** Das Signal, das zutrifft — für Tests und Tabelle; `null` = kein Titel-Schluss. */
export function titelSchlussSignal(erlass: { titel: string; kuerzel: string }): 'S1' | 'S2' | 'S3' | null {
  const k = erlass.kuerzel.trim();
  const t = erlass.titel.trim();
  if (!k || !t) return null;
  const kl = k.toLowerCase();
  const tl = t.toLowerCase();
  // Identität oder Teilstring: der Wert ist kein Anhängsel, sondern der Titel selbst
  // (oder darin enthalten) — dort gelten die bisherigen Zweige von `kopfTitelZeile`.
  if (kl === tl || tl.includes(kl)) return null;
  if (satzAnfang(k)) return 'S1';
  if (hatRelationswort(k)) return 'S2';
  if (restMitKlammerKuerzel(k)) return 'S3';
  return null;
}

export function kuerzelIstTitelSchluss(erlass: { titel: string; kuerzel: string }): boolean {
  return titelSchlussSignal(erlass) !== null;
}

/** Der amtliche Titel, wie ihn das Register zerlegt hat: Titel, Komma, Schluss. */
export function titelMitSchluss(erlass: { titel: string; kuerzel: string }): string {
  return `${erlass.titel.trim()}, ${erlass.kuerzel.trim()}`;
}
