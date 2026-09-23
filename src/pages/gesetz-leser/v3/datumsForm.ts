import { nurErlassdatum } from '../erlassUebersichtDaten';

// ─── Datums-SCHREIBUNG des Lesers V3 (Ä107, 18.8.2026) ──────────────────────
//
// Eigene Datei, weil es eine eigene Sache ist: `formatiereDatum` (`../helpers`,
// = `datumCh`) macht aus einem ISO-Wert die Schweizer Form — hier steht der
// Fall, für den es KEINEN ISO-Wert gibt. Das Erlassdatum kommt als amtlicher
// TEXT aus dem Struktur-Sidecar («vom 5. Oktober 2007»), und der Steckbrief
// setzt es neben zwei ISO-Daten. Rein und deterministisch (§2): kein `Date`,
// keine Locale, keine Uhr.
//
/**
 * Ä107 (Live-Ästhetik-Prüfung 18.8.2026) · EIN DATUMSFORMAT IM STECKBRIEF.
 *
 * GEMESSEN am Live-Stand: die Datums-Kette der Box mischte zwei Notationen in
 * DREI untereinanderstehenden Zeilen — «Erlass vom 5. Oktober 2007» (Wortform,
 * aus dem Sidecar) über «In Kraft seit 01.01.2011» und «Stand 01.04.2025»
 * (numerisch, über `formatiereDatum`); am FR-Erlass 635.1.1 stand die erste
 * Zeile ihrerseits schon numerisch («01.05.1996»). Eine Chronologie, deren
 * Glieder verschieden aussehen, liest sich nicht als Kette — und `tabular-nums`
 * richtet an einer Wortform ohnehin nichts aus (derselbe Ä80-Befund, eine Stufe
 * weiter). Der Erlass-KOPF führt dieselben Daten numerisch; die Box folgt ihm
 * (§5), statt eine dritte Schreibweise zu erfinden.
 *
 * BELEGT, NICHT GERATEN (gezählt 18.8.2026 über alle 1420 Struktur-Sidecars):
 * 1062 Erlassdaten stehen in Wortform, 330 bereits numerisch (dd.mm.yyyy), 1
 * trägt eine Klammer-Variante, die `nurErlassdatum` schneidet. Die Monatstabelle
 * deckt Deutsch und Französisch — die beiden Sprachen, in denen die gezählten
 * Präpositionen («vom» 1383, «du» 10) vorkommen.
 *
 * §7 · IDENTITÄT MIT WORTGRENZE, KEIN RATEN. Getroffen wird nur die vollständige
 * Form «T. Monat JJJJ» bzw. «T.M.JJJJ» mit einem Monatsnamen AUS DER TABELLE;
 * alles andere gibt `null` zurück und behält seinen amtlichen Wortlaut. Ein
 * Datum falsch umzuschreiben wäre schlimmer als zwei Formate — darum keine
 * Präfix-Erkennung, kein `parseInt` auf Verdacht, kein `Date`-Konstruktor
 * (der nimmt Gebietsschema und Zeitzone mit, §2).
 */
const MONATE: Readonly<Record<string, number>> = Object.freeze({
  Januar: 1, Februar: 2, März: 3, April: 4, Mai: 5, Juni: 6,
  Juli: 7, August: 8, September: 9, Oktober: 10, November: 11, Dezember: 12,
  janvier: 1, février: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, août: 8, septembre: 9, octobre: 10, novembre: 11, décembre: 12,
});

const WORTDATUM = /^(\d{1,2})\.\s*([A-Za-zÀ-ÿ]+)\s+(\d{4})$/;
const ZIFFERNDATUM = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;

function numerischesDatum(wert: string): string | null {
  const z = ZIFFERNDATUM.exec(wert);
  if (z) return baueDatum(Number(z[1]), Number(z[2]), z[3]);
  const w = WORTDATUM.exec(wert);
  if (!w) return null;
  const monat = MONATE[w[2]];
  if (!monat) return null;
  return baueDatum(Number(w[1]), monat, w[3]);
}

/** dd.MM.jjjj — dieselbe Schreibung wie `formatiereDatum` (`datumCh`) sie aus
 *  ISO-Werten macht (§5: EINE Datumsform im Leser). Unplausible Tag-/Monatszahl
 *  ⇒ `null`: lieber der amtliche Wortlaut als ein zurechtgebogenes Datum. */
function baueDatum(tag: number, monat: number, jahr: string): string | null {
  if (tag < 1 || tag > 31 || monat < 1 || monat > 12) return null;
  return `${String(tag).padStart(2, '0')}.${String(monat).padStart(2, '0')}.${jahr}`;
}

/**
 * Präpositionen, die ein Sidecar-Erlassdatum einleiten kann — BELEGT, nicht
 * geraten. Gezählt über alle 1420 Struktur-Sidecars (18.8.2026, kein Netz):
 * «Vom» 890 · «vom» 493 · gar keine 27 · «du» 10 (FR/VS). Andere Formen kommen
 * im Korpus nicht vor; käme eine dazu, fängt sie der Rückfall in `datumsAngabe`
 * auf, statt still verstümmelt zu werden.
 *
 * WARUM EIN MUSTER MIT WORTGRENZE UND KEIN `slice(4)`: 27 Sidecars schreiben das
 * Datum ohne Präposition («12. April 2000», gemessen an BS-640.100 im
 * Ä74-Befund). Ein stumpfes Abschneiden verstümmelte diese Gruppe still — der
 * Wert begänne mit «April 2000». Darum eine Identitäts-Prüfung mit Wortgrenze
 * (§7): getroffen wird nur ein führendes Listenwort, gefolgt von Weissraum.
 */
const PRAEPOSITION = /^(?:vom|du)\s+/i;

/**
 * Die fremdsprachigen Geschwister der «(Stand …)»-Klammer, die `nurErlassdatum`
 * schneidet. Gezählt an denselben 1420 Sidecars: «(Stand …)» 1409 (dort erledigt)
 * · «(version …)» 5 · «(état …)» 5 · «(Fassung in Kraft getreten am …)» 1.
 *
 * WARUM NICHT «jede Schluss-Klammer»: `nurErlassdatum` lässt «vom 1. Januar 2000
 * (AS 2000 1)» ausdrücklich stehen (Fundstellen-Angabe, `gesetz-leser-uebersicht-s6`),
 * und diese Regel darf sie nicht hintenherum doch schneiden. Getroffen wird nur,
 * was eine FASSUNG bezeichnet — dieselbe Aussage wie «Stand», in einer anderen
 * Sprache. `Etat` ohne Akzent steht daneben, weil derselbe Erlass je nach
 * Ausgabe-Kodierung beides liefert.
 *
 * NUR IN V3. Die Ist-Hülle rendert ihre Übersicht weiter aus dem blossen
 * `nurErlassdatum` — die eingefrorene Hülle hängt nie an der neuen (FL-4).
 */
const FASSUNGS_KLAMMER = /\s*\((?:Fassung|État|Etat|Version)\b[^)]*\)\s*$/i;

/**
 * Ä80 + P1-2 · Das Sidecar-Erlassdatum wird zur Label/Wert-Zeile: die
 * Präposition wandert ins Etikett («vom 5. Oktober 2007» → Label «Erlass vom»,
 * Wert «5. Oktober 2007»), die Fassungs-Klammer fällt weg (sie steht als
 * eigene Zeile «Stand» direkt darunter — Ä74).
 *
 * DER RÜCKFALL IST DER KERN DES FIXES (Bug-Check 18.8.2026). Ein Etikett «Erlass
 * vom» ist eine ZUSAGE an den Wert: dass dort ein Datum steht und sonst nichts.
 * Bis hierher wurde sie auch dann gegeben, wenn beide Muster danebengriffen —
 * am FR-Erlass 635.1.1 stand «Erlass vom · du 01.05.1996 (version entrée en
 * vigueur le 01.03.2024)», also die Präposition doppelt und der Stand ein
 * zweites Mal. Beginnt der Wert nach beiden Schnitten nicht mit einer Ziffer,
 * halten wir die Zusage nicht: das Etikett fällt auf das neutrale «Erlassdatum»
 * zurück (so heisst es in V1), der Wortlaut bleibt unangetastet, und
 * `tabular-nums` entfällt — eine Zahlen-Kante an einem Wort auszurichten ist der
 * Ä80-Fehler in umgekehrter Richtung.
 *
 * `null` = nach dem Schnitt bleibt nichts (27 Sidecars tragen NUR die Klammer,
 * z. B. «(Stand am 4. September 2024)»). Dann entsteht keine Zeile (§8).
 */
export function datumsAngabe(erlassdatum: string): { label: string; wert: string; ziffern?: boolean } | null {
  const ohneKlammer = nurErlassdatum(erlassdatum).replace(FASSUNGS_KLAMMER, '').trim();
  const wert = ohneKlammer.replace(PRAEPOSITION, '').trim();
  if (!wert) return null;
  // Ä107 (18.8.2026): dieselbe Notation wie die drei Zeilen darunter.
  const num = numerischesDatum(wert);
  if (num) return { label: 'Erlass vom', wert: num, ziffern: true };
  // Rückfall (P1-2, unverändert gültig): lässt sich der Wortlaut nicht als Datum
  // lesen, halten wir die Zusage «hier steht ein Datum» nicht — neutrales
  // Etikett, Wortlaut unangetastet (§1), kein `tabular-nums` an einem Wort.
  return { label: 'Erlassdatum', wert };
}
