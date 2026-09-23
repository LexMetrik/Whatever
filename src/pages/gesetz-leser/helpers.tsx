import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Sektion, Fussnote } from '../../lib/normtext/browse';
import type { BrowseErlass } from '../../lib/normtext/browse-typen';
import { ERLASS_REGISTER, type ErlassTyp, type Grundart } from '../../lib/normtext/register';
import { GRUNDART_SEED } from '../../lib/normtext/grundart.generated';
import { sachgruppe, topTitel, subTitel, type KantonSystematik } from '../../lib/normtext/systematik';
import { norm } from '../../lib/suche/normQuery';
import { datumCh } from '../../lib/normtext/erlassKopfText';
import { erlassPfadRoh, erlassPfadVonKey } from '../../lib/normtext/erlassAdresse';
import type { OverlineGlied } from '../../components/layout/LeserKopfGeruest';

// M11 (§5 Verzahnung): Reverse-Resolver SR-Nummer → interner Erlass, ABGELEITET
// aus dem Register (keine Handtabelle, §3/§5 eine Quelle). Nur Bund-Erlasse, die
// wir tatsächlich im Volltext/PDF-embed haben — sonst bleibt der Fedlex-Link der
// ehrliche Fallback (§8). Einmal modulweit aufgebaut (statisch).
const SR_INTERN: ReadonlyMap<string, { key: string; ebene: 'bund' | 'kanton' }> = new Map(
  ERLASS_REGISTER
    .filter((e) => e.ebene === 'bund' && e.sr && (e.status === 'snapshot' || e.status === 'pdf-embed'))
    .map((e) => [e.sr as string, { key: e.key, ebene: e.ebene }]),
);

/**
 * W2·19-GLIEDERUNG/S7: SR-Nummer → intern gehaltener Erlass, sonst `undefined`.
 * Derselbe `SR_INTERN`-Index, den der Fussnoten-Renderer weiter unten schon nutzt
 * (§5, EINE Auflösung) — exportiert, damit der Artikel-Kontext einen
 * Fussnoten-Verweis intern verlinken kann, WO wir den Erlass wirklich halten,
 * und sonst ehrlich beim amtlichen Link bleibt (§8, kein toter interner Pfad).
 */
export function internerErlassFuerSr(sr: string): { key: string; ebene: 'bund' | 'kanton' } | undefined {
  return SR_INTERN.get(sr);
}

/**
 * §5 (W2·5m-LESER-V3/S3): die EINE ISO→CH-Datumsform lebt in
 * `lib/normtext/erlassKopfText` — der prerenderte SEO-Kopf (`lib/seo-detail.ts`)
 * braucht dieselbe Form, und die Bibliotheks-Schicht darf nicht auf `pages/`
 * zeigen (§3). Der eingeführte Name bleibt hier als Fassade stehen, damit die
 * bestehenden Aufrufstellen nicht wandern müssen (§6.1: kleinster Eingriff).
 */
export const formatiereDatum = datumCh;

/**
 * Ä75 (Orchestrator-Entscheid 18.8.2026, David hat Stopp-Recht) · Das Etikett der
 * systematischen Nummer — «SR» am BUNDESERLASS, `null` am Kantonserlass.
 *
 * BEFUND: «SR» heisst Systematische Rechtssammlung DES BUNDES. Über kantonalen
 * Nummern stand es trotzdem — gemessen an BS-640.100 («SR 640.100») und
 * ZH-211.11 («SR 211.11»), in der Ruhezeile der Übersichtsbox und im
 * Erlass-Kopf. Das ist keine Ungenauigkeit in der Beschriftung, sondern eine
 * falsche Fundstellenangabe: BS-640.100 steht in der Gesetzessammlung des
 * Kantons Basel-Stadt, nicht in der SR des Bundes.
 *
 * WARUM KEIN POSITIVES KANTONS-ETIKETT (§7): naheliegend wäre «BS 640.100» — und
 * es wäre erfunden. Die kantonalen Sammlungen führen EIGENE Siglen, die nicht das
 * Kantonskürzel sind (Basel-Stadt «SG», Zürich «LS», Aargau «SAR», Bern «BSG»).
 * Ein aus `erlass.kanton` gebautes Kürzel sähe amtlich aus und wäre es nicht;
 * eine 26-Zeilen-Tabelle im Code wäre die hart kodierte Kantonsliste, die die
 * Erlass-Neutralität ausschliesst — und jede ihrer Zeilen müsste einzeln gegen
 * die amtliche Sammlung geprüft werden. Bis die Sigle im Datenmodell steht
 * (Fahrplan H5: Feld im Register + Verifikation je Kanton), steht die Nummer
 * nackt. Eine Nummer ohne Sammlungs-Angabe ist unvollständig; eine Nummer mit
 * der falschen Sammlung ist falsch.
 *
 * Rein und deterministisch (§2), erlass-neutral: die Weiche liest `ebene`, nie
 * eine Liste von Kantonen.
 */
export function kennungEtikett(erlass: Pick<BrowseErlass, 'ebene'>): string | null {
  return erlass.ebene === 'bund' ? 'SR' : null;
}

/** Etikett + Nummer als EIN String (Ruhezeile). Der Erlass-Kopf braucht die Zahl
 *  getrennt (Mono-Auszeichnung `.num` gilt der Nummer, nicht dem Etikett) und
 *  liest darum `kennungEtikett` — dieselbe Weiche, zwei Formen, EINE Regel (§5). */
export function kennungText(erlass: Pick<BrowseErlass, 'ebene' | 'sr'>): string | null {
  if (!erlass.sr) return null;
  const etikett = kennungEtikett(erlass);
  return etikett ? `${etikett} ${erlass.sr}` : erlass.sr;
}

/**
 * N13 (BS-Audit 23.6.2026) — das VERIFIZIERTE amtliche Sachgebiet eines
 * kantonalen Erlasses, oder `null`.
 *
 * §8: Für nicht zugeordnete Systematik-Nummern liefert die Kanton-Systematik
 * neutrale PLATZHALTER («Bereich SAR», «Ohne Systematik-Nummer»). Das sind keine
 * Sachgebiete, sondern die Auskunft «wir wissen es nicht» — sie werden darum
 * weggelassen statt angezeigt.
 *
 * W2·19-GLIEDERUNG/S7 (Bug-Check B9): diese Filterregel stand nur inline in der
 * Reader-Overline (`inhalt-volltext.tsx`). Die Erlass-Übersicht baute ihren
 * Brotkrümel daneben NEU — und zeigte den Platzhalter, den die Overline
 * derselben Seite korrekt unterdrückte (~80 Kantonserlasse, 6.5 %). Jetzt EINE
 * Regel für beide Stellen (§5); wer sie ändert, ändert sie überall.
 *
 * `sub` ist der Untergruppen-Titel und darf leer sein (nicht jede Nummer hat
 * eine); der Aufrufer filtert ihn selbst weg.
 */
export function verifiziertesSachgebiet(
  erlass: Pick<BrowseErlass, 'kanton' | 'sr'>,
  kantonSys: Record<string, KantonSystematik>,
): { top: string; sub: string } | null {
  const sys = erlass.kanton ? kantonSys[erlass.kanton] : undefined;
  if (!sys) return null;
  const { top, sub } = sachgruppe(sys, erlass.sr);
  if (top === '~') return null;
  const topName = topTitel(sys, top);
  if (/^Bereich /.test(topName)) return null;
  return { top: topName, sub: subTitel(sys, top, sub) };
}

// «Zitat kopieren» (W2·5d G2b, FAHRPLAN §3.3/K12b): EIN deterministisches Zitat-
// Format aus der vorliegenden Provenienz (§7 a–d): Fundstelle (Art./§ + Kürzel) +
// amtliche Kennung (wo vorhanden) + Stand. Rein deterministisch (§2), keine
// Heuristik — `artikelLabel` trägt bereits «Art. 7» bzw. «§ 7» (labelMitBereich),
// die Abs./lit. bleibt bewusst weg (am Kopf/Artikel nicht eindeutig bestimmbar,
// §8 «nichts Erfundenes»). Beispiel: «Art. 7 OR, SR 220 (Stand 01.01.2025)».
//
// ── Ä98 (Live-Ästhetik-Prüfung 18.8.2026) · DIE ZWISCHENABLAGE TRUG EINE
//    FALSCHE FUNDSTELLE ──────────────────────────────────────────────────────
// GEMESSEN am Live-Stand (Accessible-Name-Inventar, drei Kantonserlasse): der
// Knopf «Zitat kopieren» erzeugte «§ 1 …, SR LS 211.11», «… SR RSF 635.1.1»,
// «… SR 640.100». Die Systematische Sammlung des BUNDES führt keine dieser
// Nummern — was hier in die Zwischenablage ging, war eine Quellenangabe, die es
// so nicht gibt, und sie wandert von dort in Rechtsschriften (§7, §1).
// Ä75 hatte die Weiche für die SICHTBARE Kopfzeile schon gezogen
// (`kennungEtikett`/`kennungText` oben); der Zitat-Bau hing als einzige Stelle
// noch am fest verdrahteten `SR ${sr}` — eine zweite Wahrheit über dieselbe
// Frage (§5). Jetzt speist EINE Weiche beide Ausgaben: sichtbar «LS 211.11»,
// kopiert «§ 1 ‹kuerzel›, LS 211.11 (Stand …)».
// ── P1-3 (Bug-Check-Nachzug 18.8.2026) · WAS DAS BEISPIEL WIRKLICH ERGIBT ───
// Hier stand «§ 1 GebV OG, LS 211.11 (Stand …)» — das UNTERSTELLTE, das Feld
// `kuerzel` trage an ZH-211.11 die Sigle. Nachgesehen im Register: es trägt
// «Gebührenverordnung des Obergerichts (GebV OG)», das Zitat lautet also
// «§ 1 Gebührenverordnung des Obergerichts (GebV OG), LS 211.11 (Stand …)».
// Der Bau ist richtig und bleibt unangetastet — falsch war die Erwartung an die
// DATEN. Dass viele Registerkürzel Volltitel sind, ist eine Datenfrage und
// steht als H5-Feld im Fahrplan (Sigle aus dem Register); ein Kommentar, der
// sie stillschweigend als gelöst annimmt, verdeckt sie (§8).
// Darum braucht die Signatur `ebene`: die Kennung ist eine Funktion der EBENE,
// nie des Kürzels und nie einer Kantonsliste (Herleitung bei `kennungEtikett`).
export function baueZitat(
  erlass: Pick<BrowseErlass, 'ebene' | 'kuerzel' | 'sr' | 'stand'>,
  artikelLabel: string,
): string {
  const teile = [`${artikelLabel} ${erlass.kuerzel}`.trim()];
  const kennung = kennungText(erlass);
  if (kennung) teile.push(kennung);
  let s = teile.join(', ');
  if (erlass.stand) s += ` (Stand ${formatiereDatum(erlass.stand)})`;
  return s;
}

// Laufzeit-Anbindung der Grundart an den Reader (W2·5d G3a, §5): die Laufzeit-
// `BrowseErlass` trägt BEWUSST keine Grundart (byte-gleiche Snapshot-Projektion,
// register.json). SSoT ist die Klassifikation GRUNDART_SEED (grundart.generated.ts):
// `mitGrundart` merged sie in die BUND-Register-Einträge, kantonale Erlasse stehen
// aber NICHT im ERLASS_REGISTER (ihre Identität leitet der Generator aus dem
// Snapshot ab) — darum schlägt der Reader zur Laufzeit DIREKT im Seed nach, die
// EINE Quelle für Bund UND Kanton (keine zweite Wahrheit, keine Daten-
// Regeneration). Reiner Read-Accessor in der Darstellungsschicht (§3): er wählt
// nur, welche Grundart die Designvorschrift (§2.2) steuert — kein Rechtsinhalt.
export function grundartMeta(key: string): {
  grundart?: Grundart;
  erlassTyp?: ErlassTyp;
  bestimmungsEtikett?: 'art' | 'paragraf';
  bestimmungsEtikettStatus?: 'entwurf';
} {
  const s = GRUNDART_SEED[key];
  if (!s) return {};
  return {
    grundart: s.grundart,
    erlassTyp: s.erlassTyp,
    bestimmungsEtikett: s.bestimmungsEtikett,
    bestimmungsEtikettStatus: s.bestimmungsEtikettStatus,
  };
}

/**
 * B1 (H2b-Nachzug) — der Volltitel OHNE das Klammer-Suffix, das Fedlex und die
 * kantonalen Register anhängen («… (Strafprozessordnung, StPO)», «… (LS 211.11)»).
 *
 * WARUM HIER UND NICHT ZWEIMAL. Genau diese Zeichenkette ist es, die der
 * Erlass-Kopf DRUCKT (`parts/ErlassLeserKopf.tsx`), und genau sie muss darum auch
 * gemessen werden, wenn über ihre LÄNGE entschieden wird (`v3/erlassAnsicht`
 * `titelKennung`) oder über ihre GLEICHHEIT mit dem Kürzel (`zeigeVolltitel`).
 * Bis zum Nachzug lag die Regex nur im Kopf, die Entscheidungen massen `titel`
 * roh — gemessen 17.8.2026 bekamen dadurch **46 von 1469** Erlassen die
 * vorangestellte Kennung, obwohl ihr angezeigter Titel unter der Schwelle liegt
 * (MSchG: roh 81 Zeichen, angezeigt 60; ebenso FusG, PartG, URV, BetmG, IRSG).
 * Eine Länge, die etwas anderes misst als das Gedruckte, ist keine Kalibrierung.
 *
 * Rein und deterministisch (§2): nur das LETZTE Klammerpaar am Ende fällt, und
 * nur, wenn es dort steht — «Verordnung (EU) 2016/679 über …» bleibt unberührt.
 */
export function titelOhneKlammerSuffix(titel: string): string {
  return titel.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

/**
 * Browser-Reiter-Titel eines Erlasses: «OR (Obligationenrecht) — LexMetrik». Der
 * Kurztitel ist der Klammer-Inhalt am Ende des Volltitels (LEGES-Konvention),
 * sonst der Titel selbst.
 *
 * REDUNDANZ-WEICHE (Fehlerbuch, auf Prod reproduziert 29.8.2026): Wo das
 * Klammer-Suffix GENAU das Kürzel ist — typisch bei Staatsverträgen, «Konvention
 * zum Schutze der Menschenrechte und Grundfreiheiten (EMRK)» —, stand im Reiter
 * «EMRK (EMRK) — LexMetrik»: dasselbe Wort zweimal, die Klammer ohne jeden
 * Informationswert. Sie entfällt dann, statt sich zu wiederholen. Es ist dieselbe
 * Regel ANALOG zu `titelRedundant` in `parts/ErlassLeserKopf.tsx` (H1) — nicht
 * identisch: hier zählt der Klammerinhalt, dort der Titel ohne Suffix (EMRK/IPRG
 * treffen nur hier)
 * (case- und trim-unempfindlich) — der Reiter war der einzige Ausspielungsort
 * ohne sie. Nicht-redundante Titel bleiben Zeichen für Zeichen die von vorher.
 *
 * Warum HIER und nicht bei den übrigen Kopf-Textbausteinen in
 * `lib/normtext/erlassKopfText.ts`: jene Datei liegt auf einem Risikopfad
 * (`check:gegenpruefung`, Rechnen/Extraktion/Norm-Tarif). Ein Reiter-Titel ist
 * reine Darstellung (§3) und hat dort nichts verloren — er würde sonst für jede
 * Wortlaut-Änderung eine adversariale Gegenprüfung auslösen.
 *
 * Rein und deterministisch (§2). Rot-Beweis: `src/tests/tab-titel-redundanz.test.ts`.
 */
export function tabTitel(kuerzel: string, titel: string): string {
  const kurz = titel.match(/\(([^)]+)\)\s*$/)?.[1] ?? titel;
  const redundant = kurz.trim().toLowerCase() === kuerzel.trim().toLowerCase();
  return redundant ? `${kuerzel} — LexMetrik` : `${kuerzel} (${kurz}) — LexMetrik`;
}

// Kopf-Overline JE GRUNDART (W2·5d G3a, FAHRPLAN §2.2 + §5.1): das Kopf-Label
// leitet sich aus `erlassTyp` (Register, SSoT) ab statt aus der früheren
// «ebene»-Heuristik, die JEDE Bund-Norm «Bundesgesetz» nannte — auch die 103
// Verordnungen (VMWG/GBV/VZV …). Reine Darstellung (§3), deterministisch (§2).
//   • International → «Staatsvertrag» (⑤; erlassTyp Arbiter, Gebiet als Fallback).
//   • Bund → Bundesverfassung / Bundesgesetz / Verordnung / Staatsvertrag
//     (undefined/sonstiges → «Bundesgesetz» = heutiger Default, byte-verträglich),
//     das amtliche Sachgebiet bleibt als « · Gebiet»-Zusatz (N13).
//   • Kanton → «Kanton XX · Gesetz|Verordnung» (⑥); wo erlassTyp neutral ist
//     (sonstiges), das amtliche Sachgebiet als Zusatz behalten (N13).
//
// ─── B-7 (W2·19-DESIGN-KONSISTENZ, Runde 2, 31.8.2026) · DIE ORDNUNG ─────────
//
// BEFUND: die Overline beantwortet an jedem Leser dieselbe Frage («woher kommt
// das Dokument?»), und der Erlass-Kopf beantwortete sie ärmer als der
// Entscheid-Leser. Der Kanton-Zweig VERWARF sein Sachgebiet, sobald eine Art
// bekannt war (`const zusatz = typ ?? overlineGebiet` — das eine `??`, das die
// zweite Auskunft wegwirft statt sie danebenzustellen). GEMESSEN heisst das:
// an einem kantonalen Gesetz mit verifiziertem Sachgebiet stand «Kanton BS ·
// Gesetz», das Sachgebiet blieb ungenannt — obwohl es erhoben, verifiziert und
// eine Zeile weiter (Erlass-Übersicht) sichtbar ist.
//
// Die Ordnung ist jetzt ebenen-neutral und dreigliedrig — Herkunft/Ebene ·
// Art/Abteilung · Sachgebiet (Definition und Ton: `layout/LeserKopfGeruest`,
// `KopfOverline`) —, und ein unbekanntes Glied entfällt ERSATZLOS (§8), statt
// ein bekanntes zu verdrängen.
//
// ZWEI AUSSPIELUNGEN, EINE REGEL (§5): `kopfGlieder` ist die Wahrheit,
// `kopfOverline` fügt sie für die Aufrufer, die eine Zeichenkette brauchen
// (Erlass-Übersicht, Art-Zeile). Beide Bund-Ausspielungen bleiben Zeichen für
// Zeichen wie bisher; einzig der Kanton gewinnt sein drittes Glied.
//
// INTERNATIONAL trägt bewusst NUR das erste Glied: sein Sachgebiet heisst
// «International / Staatsverträge» (`GEBIET_LABEL`) und wiederholte damit die
// Herkunft. Ein Glied, das nichts hinzufügt, ist keine Auskunft (§8).
export function kopfGlieder(
  erlass: Pick<BrowseErlass, 'ebene' | 'kanton' | 'rechtsgebiet'>,
  erlassTyp: ErlassTyp | undefined,
  overlineGebiet: string | null,
): OverlineGlied[] {
  const sachgebiet: OverlineGlied[] = overlineGebiet
    ? [{ text: overlineGebiet, rolle: 'sachgebiet' }]
    : [];
  if (erlass.rechtsgebiet === 'international') {
    if (erlassTyp === 'staatsvertrag') return [{ text: 'Staatsvertrag', rolle: 'herkunft' }];
    return [{ text: overlineGebiet ?? 'Staatsvertrag', rolle: 'herkunft' }];
  }
  if (erlass.ebene === 'bund') {
    // «Bundesgesetz»/«Verordnung» IST hier die Herkunfts-Angabe: der amtliche
    // Erlassname nennt Ebene und Art in EINEM Wort. Ihn in «Bund · Gesetz» zu
    // zerlegen, wäre keine Vereinheitlichung, sondern ein neuer, unamtlicher
    // Begriff (§1 vor Symmetrie).
    const typ =
      erlassTyp === 'verfassung' ? 'Bundesverfassung'
      : erlassTyp === 'verordnung' ? 'Verordnung'
      : erlassTyp === 'staatsvertrag' ? 'Staatsvertrag'
      : 'Bundesgesetz';
    return [{ text: typ, rolle: 'herkunft' }, ...sachgebiet];
  }
  const typ =
    erlassTyp === 'gesetz' ? 'Gesetz'
    : erlassTyp === 'verordnung' ? 'Verordnung'
    : erlassTyp === 'verfassung' ? 'Verfassung'
    : null;
  return [
    { text: `Kanton ${erlass.kanton}`, rolle: 'herkunft' },
    ...(typ ? [{ text: typ, rolle: 'art' } as OverlineGlied] : []),
    ...sachgebiet,
  ];
}

/** Dieselbe Ordnung als Zeichenkette — für Aufrufer ohne Darstellungs-Kontext
 *  (Art-Zeile der Erlass-Übersicht). Nie ein zweiter Regelsatz (§5). */
export function kopfOverline(
  erlass: Pick<BrowseErlass, 'ebene' | 'kanton' | 'rechtsgebiet'>,
  erlassTyp: ErlassTyp | undefined,
  overlineGebiet: string | null,
): string {
  return kopfGlieder(erlass, erlassTyp, overlineGebiet).map((g) => g.text).join(' · ');
}

// W2·19-GLIEDERUNG/S8: `passtAufSuche` ist hier ENTFALLEN. Sie war die
// Filterregel der alten, lesespalten-filternden In-Gesetz-Suche und las
// ausschliesslich `artikelLabel` und `bloecke[].text`/`items[].text`. Seit S8
// sucht `leserSuche.ts` über alle sechs Feldklassen und liefert zusätzlich
// Reihenfolge, Herkunft und Ausschnitt; die alte Regel hätte daneben eine
// zweite, ärmere Treffer-Wahrheit behauptet (§5). Ersatzlos entfernt statt
// stehen gelassen — toter Code, der eine Wirkung suggeriert, ist die teuerste
// Sorte (§Aufräumen).

// «Erster Titel: Die Entstehung …» → {pre:'Erster Titel', rest:'Die Entstehung …'}
export function romanFrei(label: string): { pre: string; rest: string } {
  const m = label.match(/^([^:]+):\s*(.+)$/);
  return m ? { pre: m[1].trim(), rest: m[2].trim() } : { pre: '', rest: label };
}

// A30 (David 16.7.2026): Marginalien-/Randtitel-Enumeratoren tragen lateinische
// Ordnungs-Suffixe («IIIbis», «Ia»). Fedlex setzt das Ordnungs-WORT (bis/ter/…)
// HOCHGESTELLT (<sup>) und einen einzelnen Buchstaben-Suffix (Ia) KURSIV (<i>) —
// empirisch am gepinnten Filestore-HTML verifiziert (ZGB: «III<sup>bis</sup>.»,
// «I<i>a</i>.», §7). Reine Darstellung (§3): der Label-STRING bleibt unverändert,
// nur die Auszeichnung des schon im String liegenden Suffixes wird rekonstruiert.
// Greift NUR, wenn der Enumerator eine römische Zahl oder arabische Ziffer ist
// (Buchstaben-Enumeratoren «A.»/«b.» tragen keinen Suffix) UND der Suffix direkt an
// einem Wort-/Satzende klebt — sonst No-op (Sachtitel wie «Mitgliederverzeichnis»
// bleiben unberührt; das Ordnungswort nach reinem Römisch/Ziffer-Präfix ist
// praktisch nur der Enumerator).
const MARG_ORD = /^((?:[IVXLCDM]+|\d+))(bis|ter|quater|quinquies|sexies|septies|octies|novies|decies)(?=[.\s]|$)/;
const MARG_BUCHST = /^((?:[IVXLCDM]+|\d+))([a-z])(?=[.\s]|$)/;
export function margLabel(label: string): ReactNode {
  const ord = label.match(MARG_ORD);
  // LM-107: der nackte <sup> übernahm bislang den Browser-Default
  // `font-size: smaller` (browserabhängig, ~0.75em der jeweils UMGEBENDEN
  // Schrift) — dadurch erschien dasselbe «bis»/«ter» im Gliederungsbaum und in
  // der Artikel-Überschrift in ZWEI Grössen derselben Ansicht. Fix: derselbe
  // deterministische Multiplikator wie bei den hochgestellten Fussnoten-Markern
  // (ArtikelBody.tsx FnRef-Button) statt des UA-Defaults — keine neue
  // Grössen-Systematik, nur der bereits etablierte Wert.
  //
  // NACHZUG 17.8.2026 (Architektur-Prüfer 6): das gemeinsame Token heisst jetzt
  // `--hochgestellt` (vorher `--fn-marke`). Hier trägt es das ORDNUNGS-SUFFIX
  // einer Marginalie, nicht eine Fussnotenmarke — der alte Name benannte nur die
  // andere der beiden Rollen. Die früher an dieser Stelle genannten Absolutwerte
  // «9 px / 12 px» sind mit S2 überholt (Wert 0.72 em statt 0.62 em, Fliesstext
  // 17 px statt 18 px); sie werden EINMAL am Token in `src/index.css` gerechnet
  // und darum hier nicht wiederholt (§5).
  if (ord) return <Fragment>{ord[1]}<sup className="text-[length:var(--hochgestellt)]">{ord[2]}</sup>{label.slice(ord[0].length)}</Fragment>;
  const bu = label.match(MARG_BUCHST);
  if (bu) return <Fragment>{bu[1]}<em>{bu[2]}</em>{label.slice(bu[0].length)}</Fragment>;
  return label;
}

/** Basis-Adresse der Lesesicht, die gerade eine Route vollzieht.
 *
 *  Dünn, aber nicht überflüssig: sie hält die EINE Adress-Formel
 *  (lib/normtext/erlassAdresse.ts) auch in `v3/leserV3Modell.ts` verfügbar, OHNE
 *  dort eine Importzeile zu kosten — das v3/-Fundament steht per Auflage bei 420
 *  Zeilen (`leser-v3-fundament.test.ts`), und der Adapter ist bis auf die letzte
 *  Zeile ausgereizt. Die Alternative wäre eine zweite Formel im Adapter gewesen;
 *  genau aus solchen Zweitformeln entstand Befund 45.
 *
 *  Der Parameter heisst `routenSegment`, nicht `ebene` — dieselbe Namenstrennung
 *  wie in `erlassPfadRoh`, und die Sonde in `erlass-adresse.test.ts` bewacht
 *  auch DIESE Fassade (Gegenprüfung 29.8.2026, zweiter Durchgang: sie war neu
 *  in diesem Zweig und vom Tor nirgends genannt — `basisAdresse(e.ebene, e.key)`
 *  wäre Befund 45 wörtlich gewesen und stumm durchgelaufen).
 *
 *  Nach dem Umzugs-Sprung in `GesetzLeser` ist das Segment immer das kanonische. */
export function basisAdresse(routenSegment: string, schluessel: string): string {
  return erlassPfadRoh(routenSegment, schluessel);
}

// Pfad (Sektions-ids Wurzel→Treffer) zur ersten Sektion, die das Prädikat erfüllt.
export function pfadZu(sektionen: Sektion[], treffer: (s: Sektion) => boolean): string[] | null {
  for (const s of sektionen) {
    if (treffer(s)) return [s.id];
    const sub = pfadZu(s.kinder, treffer);
    if (sub) return [s.id, ...sub];
  }
  return null;
}

// G15: Hervorhebungen (fett/kursiv) im Fussnotentext als Rich-Text rendern. Der
// Extraktor (fussnoten-extrahiere.clean) behält bare <b>/<i>; hier werden sie in
// <strong>/<em> übersetzt (rekursiv für die seltene Verschachtelung <i>…<b>…</b>…</i>).
//
// W2·19-GLIEDERUNG/S7 (Bug-Check B2): EXPORTIERT, weil der Artikel-Kontext
// dieselben amtlichen Labels zeigt («SR <b>281.1</b>» — 100 % der rs-Fussnoten
// im Bund-Korpus tragen die Tags). Eine zweite Parse-Regel daneben wäre eine
// §5-Doppelwahrheit; die eine hier ist bereits am Fussnoten-Text erprobt.
// (Natürlicher Langzeit-Ort wäre ein geteiltes Darstellungs-Modul — der Import
// aus der Komponenten-Schicht ist eine Schicht-Inversion für EINE reine
// Funktion, erzeugt aber keinen Zyklus; siehe check:zyklen.)
export function richText(s: string, keyBase: string): ReactNode {
  if (!s.includes('<')) return s;
  const out: ReactNode[] = [];
  const re = /<(b|i)>([\s\S]*?)<\/\1>/gi;
  let last = 0;
  let k = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) out.push(s.slice(last, m.index));
    const kinder = richText(m[2], `${keyBase}-${k}`);
    out.push(m[1].toLowerCase() === 'b'
      ? <strong key={`${keyBase}-b${k}`}>{kinder}</strong>
      : <em key={`${keyBase}-i${k}`}>{kinder}</em>);
    last = re.lastIndex;
    k++;
  }
  if (last < s.length) out.push(s.slice(last));
  return out.length === 1 ? out[0] : out;
}

/**
 * Derselbe Wortlaut OHNE Auszeichnung — für Attribute (`title`), die kein
 * Markup rendern können und es sonst als rohe Zeichen zeigen würden (§8: was
 * dort steht, muss lesbar sein, nicht «SR &lt;b&gt;281.1&lt;/b&gt;»).
 * Deckt genau die Tags, die der Extraktor durchlässt (b/i, G15).
 */
export function ohneMarkup(s: string): string {
  return s.replace(/<\/?[bi]>/gi, '');
}

// Fussnoten-Text mit klickbaren AS/BBl-Verweisen (die Label-Vorkommen werden
// durch Anker ersetzt) und erhaltenen Hervorhebungen (G15). Reine Darstellung.
function escRe(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ── W2·10-UI-NAV/N0b: Fuzzy-Erlass-Vorschläge für die Fehlseite ──────────────
// Deterministisch (§2 — kein LLM): normalisiert Anfrage + Kandidaten mit norm()
// aus normQuery (dieselbe Normalform wie die Norm-Sprung-Auflösung, KEIN neuer
// Index/K10) und rankt per Levenshtein-Distanz gegen Kürzel + Routen-Key des
// Manifests. «ORR» → «OR» (Distanz 1); Titel-Teilstring als schwächerer Treffer
// («obligationenrecht» → OR). Nur nahe Kandidaten (kurze Keys: Distanz ≤ 1,
// längere ≤ 2, oder Präfix/Teilstring). Rein ableitend (§3), keine Rechtslogik.
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let vor = Array.from({ length: n + 1 }, (_, i) => i);
  let akt = new Array<number>(n + 1);
  for (let i = 1; i <= m; i++) {
    akt[0] = i;
    for (let j = 1; j <= n; j++) {
      const kosten = a[i - 1] === b[j - 1] ? 0 : 1;
      akt[j] = Math.min(akt[j - 1] + 1, vor[j] + 1, vor[j - 1] + kosten);
    }
    [vor, akt] = [akt, vor];
  }
  return vor[n];
}

export function erlassVorschlaege<T extends Pick<BrowseErlass, 'key' | 'kuerzel' | 'titel'>>(
  erlasse: readonly T[],
  roh: string,
  max = 6,
): T[] {
  const nq = norm(roh);
  if (!nq) return [];
  const grenze = nq.length <= 4 ? 1 : 2;
  // Rang für Titel-Teilstring-Treffer: bewusst nicht-ganzzahlig, damit er NIE mit
  // einer echten (ganzzahligen) Levenshtein-Distanz kollidiert und die Titel-Treffer
  // stets NACH den nahen Kürzel-/Key-Treffern (≤ grenze) einsortiert werden.
  const TITEL_RANG = 2.5;
  const bewertet: { e: T; rang: number }[] = [];
  for (const e of erlasse) {
    const kandidaten = [...new Set([norm(e.kuerzel), norm(e.key)])].filter(Boolean);
    let dist = Infinity;
    for (const k of kandidaten) {
      if (k === nq) { dist = 0; break; }
      if (k.startsWith(nq) || nq.startsWith(k)) dist = Math.min(dist, 0.5);
      else dist = Math.min(dist, levenshtein(nq, k));
    }
    if (dist <= grenze) bewertet.push({ e, rang: dist });
    else if (nq.length >= 4 && norm(e.titel).includes(nq)) bewertet.push({ e, rang: TITEL_RANG });
  }
  bewertet.sort((a, b) =>
    a.rang - b.rang
    || a.e.kuerzel.length - b.e.kuerzel.length
    || a.e.key.localeCompare(b.e.key));
  return bewertet.slice(0, max).map((x) => x.e);
}
// DESIGN-D0: die drei Fussnoten-Links unten trugen `text-brass-700/90`. Die
// Deckkraft war seit je ein No-op (Fund B4) — ausgeliefert wurde immer das volle
// brass-700 (5.41:1, AA). Mit dem Wurzel-Fix hätte sie erstmals gegriffen: axe
// mass #8e713a auf Papier = 4.4:1 an 16 Knoten, unter AA (`a11y.e2e.ts`
// «Gesetze — Reader Bund»). Suffix gestrichen, damit bleibt der ausgelieferte
// Zustand; `hover:text-brass-700` war dadurch wirkungslos und fällt mit
// (F7 «keine Leichen»).
export function fnTextMitLinks(fn: Fussnote): ReactNode {
  if (!fn.links.length) return richText(fn.text, 'fn');
  const map = new Map(fn.links.map((l) => [l.label, l]));
  const re = new RegExp(`(${[...map.keys()].sort((a, b) => b.length - a.length).map(escRe).join('|')})`, 'g');
  return fn.text.split(re).map((t, i) => {
    const link = map.get(t);
    if (link === undefined) return <Fragment key={i}>{richText(t, `fn${i}`)}</Fragment>;
    const url = link.url;
    // A42 (Kanton): der Generator hat den zitierten Erlass bereits als internen
    // Reader-Verweis aufgelöst (wo gehalten) — direkt intern verlinken, sonst
    // amtlicher Fallback (§8). Bund-Fussnoten tragen kein `intern` → sie laufen
    // durch die SR-Label-Auflösung unten (unverändert, golden-stabil).
    if (link.intern) {
      return (
        <Link key={i} to={erlassPfadVonKey(link.intern.key, link.intern.ebene)}
          title="Intern öffnen"
          className="text-brass-700 hover:underline decoration-dotted underline-offset-2">{richText(t, `fn${i}`)}</Link>
      );
    }
    const kinder = richText(t, `fn${i}`);
    // M11 (§5): SR-Verweis «SR 220» auf einen Erlass, den wir im Volltext haben,
    // verlinkt INTERN auf den LexMetrik-Leser statt immer nach Fedlex — man bleibt
    // im Werkzeug. Nur exakte Treffer (Bund, snapshot/pdf-embed). Sonst amtlicher
    // ELI-Link als ehrlicher Fallback (§8).
    // G-REF: die SR-Nummer kommt jetzt maschinen-genau aus `link.rs` (Fedlex
    // `data-rs`), sonst — für ungetaggte Alt-Links — aus dem TAG-FREIEN Label
    // («SR <b>220</b>»). `link.url` ist bei SR-Verweisen der amtliche ELI-Deep-Link
    // (data-rs-uri), nicht mehr die Vokabular-Taxonomie-Seite.
    const srNr = link.rs ?? t.replace(/<[^>]+>/g, '').match(/^SR\s+([\d.]+)$/)?.[1];
    const intern = srNr ? SR_INTERN.get(srNr) : undefined;
    if (intern) {
      // Stand-Transparenz (§5/§8, David-Entscheid 28.6.): der intern gezeigte
      // Stand kann vom zitierten abweichen (bis Versionierung) → den zitierten
      // Fedlex-Konsolidierungsstand im title offenlegen, nicht stillschweigend
      // gleichsetzen. Konsolidierung steht als YYYYMMDD im Fedlex-Link.
      const standM = url.match(/\/(\d{4})(\d{2})(\d{2})(?:\/|$)/);
      const titel = standM
        ? `Intern öffnen · zitierter Fedlex-Stand ${standM[3]}.${standM[2]}.${standM[1]}`
        : 'Intern öffnen';
      return (
        <Link key={i} to={erlassPfadVonKey(intern.key, intern.ebene)}
          title={titel}
          className="text-brass-700 hover:underline decoration-dotted underline-offset-2">{kinder}</Link>
      );
    }
    // LM-154 (W2·17-UI-BEFUNDE-B4): reine Fedlex-Verweise (BBl/AS ohne SR-Treffer)
    // trugen nur `hover:underline` (ohne Hover also unsichtbar als Link) und keinen
    // Hinweis auf den externen Tab-Wechsel — anders als die Normverweise im
    // Fliesstext (NormText.tsx `INLINE_CLASS`: persistente gepunktete Unterlinie).
    // Dieselbe Auszeichnung hier: `underline decoration-dotted` bleibt SICHTBAR statt
    // nur bei Hover; `title` nennt amtliche Quelle + Tab-Wechsel (§8, wie bei den
    // übrigen externen Aktionen dieser Datei — AmtlichesPdf/«In neuem Reiter» tragen
    // ebenfalls ein `title` statt eines Icons je Einzel-Fundstelle, da ein Apparat
    // mehrere Zitate in einer dichten Zeile aneinanderreiht).
    // Ä117 (18.8.2026): Gedankenstrich «—», nicht «–». Der Leser mischte beide
    // Zeichen in derselben Rolle (hier, `NormPopover`); App-weit ist «—» der
    // Bestand (Benennungs-Glossar, Design-Grundlage Kap. 9). Der Halbgeviert-
    // strich bleibt dem BIS-Strich vorbehalten («Art. 1–10», Zeitbereich) —
    // zwei Rollen, zwei Zeichen, keine Mischung.
    return (
      <a key={i} href={url} target="_blank" rel="noopener noreferrer" title="Amtliche Fedlex-Quelle — öffnet in neuem Tab"
        className="text-brass-700 underline decoration-dotted underline-offset-2">{kinder}</a>
    );
  });
}

// Randtitel-Stufe einheitlich formatieren (Auftrag 6a, David 26.6.2026 «un-
// einheitliche Bold-Formatierung»). Zwei stabile Rollen statt der früheren
// Positions-Logik `i === marg.length-1`:
//   • Das BLATT (unterste gezeigte Stufe = die eigentliche Sachüberschrift des
//     Artikels) ist IMMER prominent — auch wenn es allein steht. Das ist der
//     Normalfall: ~83 % der Randtitel sind eine einzige Sachüberschrift (oft
//     ohne Aufzähler, z. B. «Gegenstand und Geltungsbereich»); die dürfen nicht
//     zu einem blassen Abschnittslabel verkümmern.
//   • Die darüberliegenden VORFAHREN sind ruhiger Kontext, einheitlich je
//     ABSOLUTER Gliederungstiefe (0 = Abschnitt «A.» uppercase, tiefer schlicht)
//     — so flippt kein Vorfahre mehr zwischen den Artikeln (Befund: «II. Hand-
//     lungsfähigkeit» mal fett, mal klein). Reine Darstellung (§3), zur Laufzeit
//     abgeleitet aus Delta-Offset + Position (kein Massen-Regen, F3).
export function margStufeStil(level: number, istBlatt: boolean): string {
  // Hängender-Einzug-Schutz (W2·5d G1 / DESIGN-REGLEMENT §N-4b
  // Randtitel-Hierarchie): mehrzeilige Randtitel («1. Im Allgemeinen») brechen sonst als
  // «1. Im / Allgemeinen» — die Fortsetzungszeile rückt via text-indent:-1em +
  // pl-[1em] auf die Titel-Startspalte ein (Fedlex-AVOID). Reine Darstellung (§3).
  const hang = '[text-indent:-1em] pl-[1em]';
  // S2 · Ä7 «Randtitel über Artikelnummer (Hierarchie)» + F3 = V2, Spalte
  // «Marginalie/Randtitel 0.8125 rem, Sans, ink-600» (David 17.8.2026 am
  // Bildbogen; die Aufnahme legte die V2-Regel über `.font-serif.leading-snug
  // > div`, also über GENAU diese drei Stufen — David hat sie so gesehen).
  //
  // DER BEFUND, gemessen am gebauten Stand: Artikelnummer und Blatt-Randtitel
  // liefen beide auf 16 px (`text-base`), die Nummer bold/ink-900, das Blatt
  // semibold/ink-800 — zwei fast gleich laute Stimmen übereinander, also keine
  // Hierarchie. Ä7 wird von der RANDTITEL-Seite gelöst, nicht durch Vergrössern
  // der Artikelnummer: V2 sagt ausdrücklich «Titelstufen unverändert», und die
  // Nummer auf die 20-px-Stufe `leser-art` der Grundlage Kap. 2.2 zu heben wäre
  // eine Änderung, die David am Bogen NICHT gesehen hat (§7). Ergebnis sind die
  // drei sichtbaren Stufen, die Grundlage Kap. 2.3 als Höchstzahl nennt:
  //   Artikelnummer 16 px bold ink-900  >  Blatt 13 px semibold ink-800
  //                                     >  Vorfahren 13 px regular ink-600.
  // `font-sans` überschreibt den Serif-Container des Randtitel-Blocks
  // (ArtikelLeser) — Zwei-Stimmen-Regel: Serif ist der Wortlaut, Sans das
  // Beiwerk (Grundlage Kap. 2.1).
  //
  // EINE ABWEICHUNG, offengelegt: das BLATT behält `text-ink-800` statt der
  // V2-Farbe ink-600. Das Blatt ist die Sachüberschrift des Artikels, und ein
  // datierter David-Auftrag (26.6.2026, oben im Kommentar) verlangt, dass sie
  // nicht «zu einem blassen Abschnittslabel verkümmert» — ~83 % aller Randtitel
  // sind genau dieser Fall. ink-800 gegen ink-600 ist eine Kontrast-ERHÖHUNG
  // (13.94 : 1 gegen 7.36 : 1, Grundlage Kap. 4), also nie ein A11y-Risiko; die
  // Hierarchie trägt hier das Gewicht, nicht die Farbe.
  // Stufe 0 gewinnt zugleich Kontrast: ink-500 → ink-600 (V2-Spalte).
  //
  // ── W2·24-R6/L17 · DER VERSAL-ZWEIG IST GESTRICHEN ────────────────────────
  // Bis hierher trug `level <= 0` zusätzlich `uppercase tracking-wide`. GEMESSEN
  // am gebauten Stand (Finder R5, 6.9.2026, über 1792 Randtitel: OR 641 · ZGB 664
  // · ZPO 403 · BS-640.100 84 · CISG 0): **0** Elemente mit `text-transform:
  // uppercase`, `letter-spacing` durchweg `normal` — der Zweig hat mit den
  // heutigen Daten nie gefeuert. Und feuern SOLL er auch nicht mehr: §5 des
  // Fahrplans nimmt Versalien und Tracking aus der Identität
  // («Overlines/Versal-Etiketten → normale kleine Grotesk-Zeilen»). Was nicht
  // scheitern kann, wird gestrichen statt bewacht (§17-Gegengewicht). Die Stufe
  // behält ihr `font-medium` — sie ist weiterhin die oberste Randtitel-Stufe,
  // nur ohne Versalien.
  // ── GB-2 (W2·24, Befund G2, 7.9.2026) · DIE VORFAHREN SIND KURSIVE LITERATA
  // GEMESSEN im ersten Bild, hell und dunkel, 1440 und 390: `Literata italic`
  // kam auf 8 von 9 Routen GAR NICHT vor, der Erlass-Leser trug zugleich nur
  // 2 Registerfarb-Traeger (Referenz «/»: 14). FAHRPLAN §5 nennt die kursive
  // Literata ausdruecklich als Akzent «an Begruessung und RANDTITELN».
  // Geaendert ist allein die KLASSENZEILE der Vorfahren-Stufen: `font-sans` →
  // `lc-randtitel` (index.css §GB-2: Literata kursiv + Registerfarbe der Route
  // ueber `data-reg`). Stufe, Groesse (`text-leser-rand` 13 px), Gewicht,
  // Einzug und Hierarchie bleiben Wort fuer Wort.
  // DAS BLATT BLEIBT SANS — ausdruecklich (§7, ein Beleg altert nicht): David
  // hat am Bildbogen 17.8.2026 die Spalte «Marginalie/Randtitel 0.8125 rem,
  // SANS» gewaehlt, und der Auftrag vom 26.6.2026 verlangt, dass die
  // Sachueberschrift nicht «zu einem blassen Abschnittslabel verkuemmert»;
  // ~83 % aller 1792 Randtitel sind Blaetter. Der Akzent kommt auf den 17 %
  // Vorfahren zurueck, ohne die datierte Entscheidung zu ueberschreiben — und
  // die Drei-Stufen-Hierarchie gewinnt sogar, weil die Stimmen sich jetzt
  // zusaetzlich in Schrift und Farbe unterscheiden.
  if (istBlatt) return `${hang} font-sans text-leser-rand font-semibold text-ink-800`;
  if (level <= 0) return `${hang} lc-randtitel text-leser-rand font-medium text-ink-600`;
  return `${hang} lc-randtitel text-leser-rand text-ink-600`;
}
