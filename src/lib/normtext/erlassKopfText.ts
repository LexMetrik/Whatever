// ═══ Wortlaut des Erlass-Kopfs (W2·5m-LESER-V3 · Etappe S3, Entscheid F5) ═════
//
// EINE Quelle für die Sätze, mit denen ein Erlass seinen Fassungs- und
// Konsolidierungs-Stand ausweist (§5). Sie stehen an ZWEI Orten, die sich nie
// widersprechen dürfen:
//   · `src/pages/gesetz-leser/parts/ErlassLeserKopf.tsx` — was der Nutzer liest,
//   · `src/lib/seo-detail.ts` (`erlassVolltextHtml`) — was die Suchmaschine liest.
// Vor S3 waren das zwei handgeschriebene Template-Strings. Sie waren bereits
// auseinandergelaufen: die UI schrieb «geltend geprüft am 14.08.2026», der
// prerenderte Kopf «geltend geprüft am 2026-08-14» — derselbe Sachverhalt in
// zwei Formen. Darum liegt hier auch die Datumsform (`datumCh`), nicht nur der
// Satzbau; sonst ist die Einheit nach dem nächsten Bau wieder weg.
//
// Warum `lib/normtext/` und nicht `pages/gesetz-leser/`: `seo-detail.ts` liegt in
// der Bibliotheks-Schicht und darf nicht auf die Seiten-Schicht zeigen (§3).
//
// REINER TEXT, KEIN RECHENPFAD (§2/§3). Hier wird nichts entschieden — weder ob
// eine Änderung konsolidiert ist (das tut der Generator
// `scripts/normtext/revisionen-generieren.ts` über `dateEntryInForce > korpusStand`)
// noch wann geprüft wurde (`public/normtext/currency.json`, erhoben von
// `scripts/fedlex-wiedervorlage-generieren.ts`). Kein `Date.now()`, keine
// Datums-Arithmetik, keine Heuristik.
//
// ─── F5 im Klartext (Entscheid David 16.8.2026, Fahrplan Kap. 9) ─────────────
// Der alte Ausweis «geltend geprüft am TT.MM.JJJJ (maschinell)» war für sich
// wahr, las sich aber wie «alles aktuell». Geprüft wurde aber nur, ob unser
// gepinnter Text der aktuellen FEDLEX-KONSOLIDIERUNG entspricht — nicht, ob
// Fedlex seinerseits alle in Kraft getretenen Änderungen eingearbeitet hat.
// Genau diese Lücke ist der Positions-11-Befund. Neu benennt der Ausweis den
// Prüfgegenstand («gegen Fedlex-Konsolidierung»), und die Warnzeile benennt,
// was trotzdem fehlt. §7/§8 bleiben gewahrt: «(maschinell)» bleibt tragend,
// kein «gegengeprüft/verifiziert»-Wortfeld, und massgeblich ist stets die
// amtliche Fassung.
//
// ─── B-6-Anbindung (Design-Konsistenz, 31.8.2026) ────────────────────────────
// Der Vorbehalts-Halbsatz «massgeblich ist die amtliche Fassung» stand hier als
// Literal — einer von mehreren Streuorten in zwei Substantiv-Varianten
// (Herleitung und korrigierte Zählung: `lib/benennung.ts`, Gegenprüfung
// 31.8.2026 N1). Seit B-6 hat er EINE Heimat; hier steht nur noch der Bezug. Die ERZEUGTEN Sätze
// sind byte-gleich zum Stand davor — die Zusicherung darüber steht als
// Wortlaut-Sonde in `src/tests/leser-benennung.test.ts`.
// Kein Rechenpfad berührt (§2/§3): eine Zeichenkette wechselt den Ort, nicht
// den Wert.

import { MASSGEBLICH_HALBSATZ } from '../benennung';

/** ISO-Datum `YYYY-MM-DD` → Schweizer Anzeigeform `TT.MM.JJJJ`; sonst unverändert. */
export function datumCh(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}

/**
 * Standausweis (F5): «gegen Fedlex-Konsolidierung geprüft am TT.MM.JJJJ (maschinell)».
 *
 * Ersetzt den bis 16.8.2026 gültigen Wortlaut «geltend geprüft am … (maschinell)».
 * Das Datum ist der letzte maschinelle Abgleich gegen den amtlichen
 * Fedlex-Konsolidierungsgraphen (`dateApplicability`), NICHT ein Zusicherungs-
 * datum: was die Prüfung nicht abdeckt, sagt `nichtKonsolidiertSatz()`.
 */
export function standausweisSatz(geprueftAmIso: string): string {
  return `gegen Fedlex-Konsolidierung geprüft am ${datumCh(geprueftAmIso)} (maschinell)`;
}

/**
 * ZWEITE STUFE des Standausweises (K-2a/F26, W2·13-KANTONE, 31.8.2026).
 *
 * `standausweisSatz` setzt einen Currency-Beleg voraus. Den gibt es nur für
 * Bundeserlasse: GEMESSEN am 31.8.2026 führt `public/normtext/currency.json`
 * 224 Einträge, davon **0 kantonale** — bei 1231 kantonalen Registereinträgen.
 * Ein Kantonserlass zeigte damit gar keinen Geltungs-Status: der Leser sah eine
 * Stand-Zeile und hatte keinen Anhalt, dass dieser Stand nie gegen die amtliche
 * Sammlung abgeglichen wurde. Das Schweigen las sich wie ein Häkchen (§8).
 *
 * Der Satz sagt genau so viel, wie wir wissen, und keinen Halbsatz mehr: die
 * GELTUNG ist ungeprüft — nicht «veraltet», nicht «unzuverlässig». Kein Datum,
 * weil es keines gibt (dieselbe Schranke wie `nichtKonsolidiertSatz(null)`);
 * der Stand selbst steht als eigenes Segment daneben und wird hier nicht
 * gedoppelt.
 *
 * Konstante statt Funktion: der Satz hat kein Argument, und `ANHANG_DOMINANZ`
 * zeigt, dass argumentlose Werte in diesem Modul so leben.
 */
export const GELTUNG_UNGEPRUEFT_SATZ = 'Geltung ungeprüft';

/**
 * Ersatz für ein fehlendes Stand-Datum (K-2d/F27-Rest).
 *
 * Zwei Registereinträge tragen `stand: ''` (VD-vd-106879, VD-vd-128150 —
 * gemessen 31.8.2026). Der Erlass-Kopf liess das Segment bis dahin still weg;
 * wer die Zeile las, sah keinen Unterschied zwischen «kein Stand erfasst» und
 * «Stand steht anderswo». Die Auslassung ist die unehrlichere der beiden
 * Formen: sie verschweigt eine Lücke, statt sie zu benennen (§8).
 */
export const STAND_UNBEKANNT = 'Stand unbekannt';

/**
 * Angekündigte, noch nicht geltende Konsolidierung: «nächste Fassung ab TT.MM.JJJJ».
 * Echter Fassungsvorbehalt (Farb-Rolle `warn`, DESIGN-REGLEMENT-NORMTEXT §Farb-
 * Wörterbuch) — unverändert gegenüber P1-d, nur nicht mehr doppelt geschrieben.
 */
export function naechsteFassungSatz(abIso: string): string {
  return `nächste Fassung ab ${datumCh(abIso)}`;
}

/**
 * Klartext-Warnung (F5), NUR wenn mindestens eine in Kraft getretene Änderung
 * nicht in den gezeigten Text eingearbeitet ist:
 *
 *   «Fedlex hat eine seit 01.07.2025 geltende Änderung noch nicht in den Text
 *    eingearbeitet — massgeblich ist die amtliche Fassung.»
 *
 * `seitIso` = frühestes Inkrafttreten unter den nicht konsolidierten Revisionen.
 * `null` = das Datum ist (noch) nicht bekannt — dann fällt der Zeitbezug weg,
 * statt eines zu erfinden (§8). Das Zeichen «⚠» gehört NICHT in diesen String:
 * es ist redundante Verstärkung und wird im UI `aria-hidden` davorgesetzt
 * (DESIGN-REGLEMENT B3 — nie alleiniger Bedeutungsträger).
 */
export function nichtKonsolidiertSatz(seitIso: string | null): string {
  const seit = seitIso ? ` seit ${datumCh(seitIso)}` : '';
  return `Fedlex hat eine${seit} geltende Änderung noch nicht in den Text eingearbeitet`
    + ` — ${MASSGEBLICH_HALBSATZ}.`;
}

/**
 * Standausweis des AUFGEHOBENEN Erlasses (Gegenprüfung PR #823, 12.9.2026,
 * W2·18-FEHLERBUCH): «aufgehoben per TT.MM.JJJJ».
 *
 * Der interaktive Kopf (`ErlassLeserKopf.tsx`) weist einen aufgehobenen
 * Erlass seit dem §8-Aufhebungs-Banner unmissverständlich aus («Aufgehoben
 * per …»). Der prerenderte Kopf (`seo-detail.ts: erlassVolltextHtml`) schrieb
 * denselben Erlass bis zu diesem Fund weiterhin als «amtliche Fassung
 * (geltend)» — belegt an `dist/gesetze/bund/BMV.html` (BMV aufgehoben
 * 1.3.2026, Stand-Zeile «Stand 2016-08-23 · amtliche Fassung (geltend)», kein
 * Aufhebungs-Hinweis). Die crawlbare Fassung sagte damit das GEGENTEIL der
 * lesenden. GETEILTE DATUMSFORM (§5, `datumCh` — dieselbe, die `Datum.tsx`
 * im Reader nutzt), nicht dieselbe Ableitung wie der Reader: dessen
 * Aufhebungs-Banner (`ErlassLeserKopf.tsx`) trägt weiterhin eigene Literale
 * («Aufgehoben per …», «Nachfolge-Erlass: SR …») statt dieser Funktionen —
 * Umstellung dort ist Reader-Nachzug, offen (Gegenprüfung PR #826, 12.9.2026).
 */
export function aufgehobenSeitSatz(seitIso: string): string {
  return `aufgehoben per ${datumCh(seitIso)}`;
}

/**
 * Finding 4b, zweite Stufe (W2·18-FEHLERBUCH, Gegenprüfung PR #832, Auflage 2):
 * amtlicher Wortlaut ist «in Kraft **für die Schweiz** seit» — bei
 * Staatsvertrags-Beschlüssen (Gemischter-Ausschuss-Entscheide) ist «in Kraft
 * seit» ohne den Zusatz sinnverengend, weil ein Vertrag pro Vertragspartei
 * unterschiedlich in Kraft treten kann; der Fedlex-Text selbst nennt IMMER
 * den Bezug («in Kraft für die Schweiz seit 15. Dez. 2020 …», FZA-Fussnote,
 * s. `scripts/normtext/revisionen-generieren.ts` Docstring `belegtImXml`).
 * Verwendet von `RevisionenGruppe.tsx` neben `dateInKraftFuerCh` — hier statt
 * als Literal in der Komponente, damit das Wort nicht ein zweites Mal
 * abweichend formuliert wird (§5).
 */
export const IN_KRAFT_FUER_CH_LABEL = 'in Kraft für die Schweiz seit';

/**
 * Nachfolge-Erlass-Hinweis für den Prerender-Kopf (Kurzform des Reader-
 * Banner-Satzes «Nachfolge-Erlass: SR … (in Kraft seit …)», hier als reiner
 * Text ohne Link-Anatomie — der Prerender-Kopf trägt bereits EINEN Live-Link
 * auf `quelleUrl`, ein zweiter auf die Nachfolger-ELI ist nicht Teil dieses
 * Funds und bliebe ein separater, deklarierter Schritt).
 *
 * Gegenprüfung PR #826 (12.9.2026, §7 — Nachtrag zur ersten Fassung dieser
 * Funktion, die das Inkrafttreten noch aus dem Aufhebungsdatum des ALTEN
 * Erlasses geraten hatte, `seitIso` statt eines eigenen Felds): das Datum
 * kommt jetzt NUR aus `nachfolger.inKraftSeit` — einem separat verifizierten,
 * optionalen Feld an der SSoT (`aufhebungen.ts`) — und wird weggelassen,
 * wenn dort nichts hinterlegt ist, statt geschätzt (§8: keine unbelegte
 * Aussage). Dass eine Rate-Heuristik nicht verallgemeinert: SPARQL bestätigt
 * für PATV (SR 232.141, ELI cc/1977/2027_2027_2027) und VGVP (SR 814.621,
 * ELI cc/2000/299) je `jolux:dateNoLongerInForce=2027-01-01` — beide OHNE
 * deklarierten Eintrag in `ANERKANNTE_AUFHEBUNGEN` (Repeal liegt noch in der
 * Zukunft) und ohne verifizierten Nachfolger-Bezug; Abruf 12.9.2026,
 * https://fedlex.data.admin.ch/sparqlendpoint.
 *
 * SR-IDENTISCH = TOTALREVISION (Gegenprüfung PR #826): trägt der Nachfolger
 * dieselbe SR-Nummer wie der aufgehobene Erlass (`altSr`), wäre «Nachfolge-
 * Erlass SR …» ein Selbstverweis (§8) — Wortlaut wechselt auf «Totalrevision»
 * mit der ELI als Unterscheidungsmerkmal.
 */
export function nachfolgerHinweis(
  nachfolger: { sr: string; eli: string; inKraftSeit?: string },
  altSr: string | null,
): string {
  const datumTeil = nachfolger.inKraftSeit ? ` in Kraft seit ${datumCh(nachfolger.inKraftSeit)}` : '';
  if (altSr && nachfolger.sr === altSr) {
    return `Totalrevision${datumTeil} (ELI ${nachfolger.eli})`;
  }
  return `Nachfolge-Erlass SR ${nachfolger.sr}${datumTeil}`;
}

/**
 * Anteil Anhang-Einträge, ab dem die Fakten-Zeile nicht mehr «Artikel» zählt.
 * Fahrplan Kap. 14, Wording-Punkt «Anhang-Dominanz»: «N Artikel» ist falsch, wo
 * der Snapshot fast nur aus Anhang-Einträgen besteht (typisch bei Tarif- und
 * Verzeichnis-Erlassen). 0.9 = Ermessens-Schwelle für ein ANZEIGE-Etikett, kein
 * Rechtsbegriff — sie verändert keine Zahl, nur ihr Substantiv.
 */
export const ANHANG_DOMINANZ = 0.9;

/** Zähl-Substantiv einer Snapshot-Menge, siehe `ANHANG_DOMINANZ`. */
export function zaehlWort(
  basis: 'Artikel' | 'Paragraphen',
  kennzahlen?: { artikelAnzahl: number; anhangArtikel: number } | null,
): 'Artikel' | 'Paragraphen' | 'Einträge' {
  if (!kennzahlen || kennzahlen.artikelAnzahl <= 0) return basis;
  return kennzahlen.anhangArtikel / kennzahlen.artikelAnzahl >= ANHANG_DOMINANZ ? 'Einträge' : basis;
}
