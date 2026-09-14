// Reine Darstellungs-Normalisierungen (§3 — Wortlaut wird NICHT verändert,
// nur Extraktions-Artefakte für die Anzeige getrennt). Hier ausgelagert, damit
// sowohl die Render-Komponente (ArtikelBody) als auch die Lesesicht
// (GesetzLeser, Download-Text) dieselbe Wahrheit teilen — und damit der
// react-refresh-Lint (nur Komponenten-Exporte je Datei) grün bleibt.

// Änderungs-/Quellenhistorie, die der Fedlex-Snapshot für aufgehobene/eingefügte
// und Bereichs-Artikel (z. B. OR 40g, 274–274g, ArG 21) FÄLSCHLICH in den
// Wortlaut-Block mischt. Signatur: die hochgestellte Fussnoten-Nummer steht im
// Text VERDOPPELT («… 25 25 Eingefügt durch …», «53 53 Fassung gemäss …»),
// gefolgt von einem Historie-Schlüsselwort. Davor steht entweder echter Wortlaut
// (in-Kraft-Artikel mit angehängter Fussnote) ODER nur ein geleakter Label-Rest
// («g», «– 274 g», «und 34» — kein echtes Wort). Eng getriggert (verdoppelte
// IDENTISCHE Nummer + Stichwort), damit echter Normtext nie zerschnitten wird.
// Die abgetrennte Historie selbst gehört an den Artikelfuss (dort ohnehin als
// amtliche Sidecar-Fussnote vorhanden); fehlt die Sidecar-Fussnote, dient sie
// als Rückfall.
const HISTORIE_STICHWORT =
  'Aufgehoben|Eingefügt|Fassung gemäss|Ursprünglich|Tritt|Siehe auch|In Kraft|Berichtigt|Bereinigt';
// Starke Änderungs-Stichwörter: die leiten IMMER eine Fussnoten-/Historie-Notiz ein,
// nie echten Normtext-Inhalt → dort genügt ein Zwei-Nummern-Präfix (Fussnoten-Ref +
// Definitionsnummer, oft VERSCHIEDEN, z.B. «337 336 Aufgehoben durch …»).
const HISTORIE_STARK = 'Aufgehoben|Eingefügt|Fassung gemäss';
// (a) gleiche Doppelnummer «131 131 <Stichwort>» (alle Stichwörter, konservativ);
// (b) zwei beliebige Nummern «337 336 <starkes Stichwort>» (deckt verschiedene
//     Fussnoten-Ref/Def-Nummern, ohne weiche Stichwörter wie «Tritt» falsch zu greifen).
const HISTORIE_RE = new RegExp(
  `(\\d{1,3})\\s+\\1\\s+(?=(?:${HISTORIE_STICHWORT})\\b)` +
  `|(?:\\d{1,3}\\s+){1,3}(?=(?:${HISTORIE_STARK})\\b)`,
);

export function trenneAenderungshistorie(text: string): { wortlaut: string; historie: string | null } {
  const m = text.match(HISTORIE_RE);
  if (!m || m.index == null) return { wortlaut: text, historie: null };
  const davor = text.slice(0, m.index).trim();
  const historie = text.slice(m.index + m[0].length).trim() || null;
  // Echter Wortlaut trägt mindestens ein Wort (≥4 Buchstaben); ein geleakter
  // Label-Rest («g», «und 34», «– 274 g») nicht → verwerfen (Ganzkörper-Fall).
  const istWortlaut = /[A-Za-zÀ-ÿ]{4,}/.test(davor);
  return { wortlaut: istWortlaut ? davor : '', historie };
}

// Randtitel/Marginalien («A. Abschluss des Vertrages», «I. Übereinstimmende
// Willensäusserung», «1. Im Allgemeinen») für die Lesesicht aufbereiten: den
// strukturellen Aufzähler (A./I./1.) strippen, die übergeordneten Stufen als
// Oberzeilen (Versalien-Anzeige übernimmt das CSS), die unterste Stufe als
// eigentlichen Sachtitel. Rein Darstellung (§3).
// Aufzähler-Lauf am Anfang eines Randtitels: einzeln («A.», «1.», «2a.», «1bis.»)
// ODER kombiniert («II. und III.», «I. bis III.») — plus der nachfolgende Titel.
// Der Ziffer-Zweig deckt Misch-Aufzähler (Ziffer + Buchstabe UND/ODER lat. Suffix:
// «2a.», «3a.», «1bis.», «5ter.») ab — sonst blieb der Aufzähler stehen (OR 128a
// «2a. Zwanzig Jahre», StGB 355d «5ter. …» hebelte istLeererTitel aus, Gegen-
// prüfungs-Befund 1). Suffix-Alternation identisch zu ART_INTERN (NormText) /
// ABS_SUFFIX (unten) — bei Erweiterung SYNCHRON halten.
const ENUM = '(?:[A-Za-z]{1,4}|\\d{1,3}(?:[a-z])?(?:bis|ter|quater|quinquies|sexies)?)\\.';
const ENUM_RUN = new RegExp(`^(${ENUM}(?:\\s*(?:und|bis|[–-])\\s*${ENUM})*)\\s+(.*)$`);
// Aufgehobene Artikel tragen als «Titel» nur das Auslassungszeichen «…» — das
// ist keine echte Sachüberschrift und darf NICHT als Heading erscheinen.
const istLeererTitel = (t: string) => !t || /^[….]+$/.test(t.trim());

// Den Marker (Aufzähler) einer Randtitel-Stufe vom Sachtitel trennen — für die
// Leer-Prüfung (aufgehobene Stufe «c. …»). Reine Darstellung (§3).
function randtitelSachtitel(stufe: string): string {
  const m = stufe.match(ENUM_RUN);
  return (m ? m[2] : stufe).trim();
}

// Randtitel-Kette eines Artikels in Knoten zerlegen (Auftrag 6b, David
// 26.6.2026 «Buchstaben-/Randtitel-Ebenen einklappbar, analog Fedlex»):
//   • `ahnen` = die übergeordneten, von mehreren Artikeln GETEILTEN Gruppierungen
//     («A. Persönlichkeit im Allgemeinen» → «II. Handlungsfähigkeit» …). Diese
//     werden im Reader zu echten, einklappbaren Gliederungs-Knoten promotet
//     (baueGliederungsbaum) — MIT Aufzähler im Label (Fedlex-Anzeige).
//   • `blatt` = die unterste, artikel-EIGENE Sachüberschrift; sie bleibt die
//     Überschrift des Artikels selbst (kein eigener Knoten), damit nicht jeder
//     einzelne Randtitel (≈83 % sind eine einzige Sachüberschrift) zu einer
//     eigenen 1-Artikel-Sektion verkümmert.
// Das Blatt wird POSITIONSWEISE bestimmt (letzte Stufe der Kette), nicht über die
// gefilterte Liste: trägt die letzte Stufe nur ein Auslassungszeichen («c. …»,
// aufgehobene Sachüberschrift), hat der Artikel KEINE eigene Überschrift (blatt =
// null) und die darüber liegende, geteilte Stufe bleibt ein Ahnen-Knoten — sonst
// risse ein aufgehobener Artikel aus seiner Gruppe und doppelte deren Titel.
export function randtitelKnoten(marginalie: string[]): { ahnen: string[]; blatt: string | null } {
  const raw = marginalie.map((s) => s.trim());
  if (raw.length === 0) return { ahnen: [], blatt: null };
  const letzte = raw[raw.length - 1];
  // Blatt = die artikel-EIGENE Sachüberschrift = die letzte Stufe NUR, wenn sie
  // KEINEN strukturellen Aufzähler trägt (reine Sachüberschrift, ≈83 % der Fälle,
  // z. B. «Gegenstand»). Trägt die letzte Stufe einen Aufzähler (A./I./1. =
  // Gliederungs-Gruppierung), gehört sie in die TOC (ahnen) — AUCH wenn sie nur
  // einen Artikel deckt (Auftrag David 28.6.2026: lückenlose Gliederung, die
  // ZGB-Einleitung muss A–E vollständig zeigen; bisher fielen Blatt-Gruppierungen
  // ohne eigene Unterstufe wie «A.», «D.» aus dem Baum → löchrige Folge B,C,E).
  // Leeres «…» (aufgehobene Sachüberschrift) ist nie Blatt.
  const hatAufzaehler = ENUM_RUN.test(letzte);
  const blattLeer = istLeererTitel(randtitelSachtitel(letzte));
  const blatt = (hatAufzaehler || blattLeer) ? null : letzte;
  const ahnenRoh = blatt ? raw.slice(0, -1) : raw;
  // Leere Zwischenstufen («…») nie als Knoten zeigen (reine Darstellung, §3).
  const ahnen = ahnenRoh.filter((s) => !istLeererTitel(randtitelSachtitel(s)));
  return { ahnen, blatt };
}

// M11 (Verweis-Popover-Bezeichnung, W2·5b): die artikel-EIGENE Sachüberschrift
// aus der Marginalie — das LETZTE Glied, Aufzähler (A./1./…) gestrippt. Anders
// als randtitelKnoten.blatt, das aufzähler-tragende Blätter der Gliederung (TOC)
// zuschlägt (blatt=null), liefert dies IMMER die Sachüberschrift des Artikels:
// «2. Nachträge» → «Nachträge» (SchKG Art. 113, gegen die Fedlex-Konsolidierung
// belegt). Leeres/aufgehobenes «…» → null (§7/§8: nichts fabrizieren). Reine
// Darstellung (§3); das Popover hängt sie als «Art. N ERLASS – <Sachtitel>» an.
export function artikelSachtitel(marginalie: string[]): string | null {
  if (marginalie.length === 0) return null;
  const titel = randtitelSachtitel(marginalie[marginalie.length - 1].trim());
  return istLeererTitel(titel) ? null : titel;
}

// Absatznummern mit lat. Suffix («1bis», «2ter») wurden bei der Extraktion teils
// NICHT ins absatz-Feld übernommen, sondern stehen am Textanfang («1bis Wurde …»),
// oder nur das Suffix leckte aus dem Feld («absatz=1», Text «bis Erfordert …»).
// Rekonstruiert die Marke für die hängende Darstellung (§3) — OHNE je das echte
// Wort «bis/ter» am Satzanfang («bis zum Ablauf …») zu strippen: der geleakte
// Suffix wird vom Absatz-Beginn (Grossbuchstabe) gefolgt.
const ABS_SUFFIX = '(?:bis|ter|quater|quinquies|sexies)';

// S6 (BS-Audit 23.6.2026) — Absatz-Marker vereinheitlichen (§3, reine Darstellung).
// LexWork-Quellen liefern den Absatz-Designator uneinheitlich: «1.», «10.»,
// «Ziff. 2.1.», «1. II». Für die hängende Absatznummer-Darstellung wird daraus
// eine schlichte Nummer gemacht:
//   - führendes «Ziff.»/«Ziffer» wird entfernt («Ziff. 2.1.» → «2.1»);
//   - ein einzelner abschliessender Punkt fällt weg («1.» → «1», «2.1.» → «2.1»);
//   - bei «<Nr>. <nicht-numerischer Rest>» («1. II», «1. IIa») bleibt die
//     schlichte Absatznummer «1» übrig (der römische/alphabetische Teil ist eine
//     Unter-Gliederung, keine Absatznummer).
// NICHT-numerische Marker («-», «2-4») werden NICHT zu einer Nummer verbogen —
// sie bleiben verbatim erhalten (§7: nichts fabrizieren; §1: keine falsche Zahl).
const NUMMER_RE = /^\d+(?:\.\d+)*$/;
export function normalisiereAbsatzNummer(absatz: string): string {
  let s = absatz.trim();
  // «Ziff.»/«Ziffer» (auch mit Doppelpunkt/Leerraum) am Anfang entfernen.
  s = s.replace(/^Ziff(?:er|\.)?\s*/i, '').trim();
  // Reine (hierarchische) Nummer mit abschliessendem Punkt: «1.»/«2.1.» → ohne Punkt.
  const mDot = s.match(/^(\d+(?:\.\d+)*)\.$/);
  if (mDot) return mDot[1];
  // bereits schlicht numerisch (inkl. «2.1») → unverändert.
  if (NUMMER_RE.test(s)) return s;
  // «<Nr>. <nicht-numerischer Rest>» («1. II»): schlichte Absatznummer = führende Nr.
  const mNumDotRest = s.match(/^(\d+)\.\s+\S/);
  if (mNumDotRest) return mNumDotRest[1];
  // alles andere (nicht-numerisch: «-», «2-4», bis/ter-Suffix-Formen) verbatim.
  return s;
}

export function absatzMarke(absatz: string | null, text: string): { marke: string | null; rest: string } {
  if (absatz == null) {
    const m = text.match(new RegExp(`^(\\d+${ABS_SUFFIX})\\s+`));
    return m ? { marke: m[1], rest: text.slice(m[0].length) } : { marke: null, rest: text };
  }
  // S6: Designator vor der Verwendung vereinheitlichen.
  const norm = normalisiereAbsatzNummer(absatz);
  const m = text.match(new RegExp(`^(${ABS_SUFFIX})\\s+(?=[A-ZÄÖÜ])`));
  return m ? { marke: norm + m[1], rest: text.slice(m[0].length) } : { marke: norm, rest: text };
}

// Schweizer Tausender-Apostrophe für die Betrag-Spalte der TarifTabelle (§1: nur
// Gruppierung, kein Zeichen geändert; §3: reine Darstellung). Verwendet den
// geraden Apostroph U+0027 — konsistent mit dem Zeichen, das die Fedlex-/LexWork-
// Snapshots selbst schreiben (z. B. «10'000» in BS-154.810.json, geprüft 22.6.2026).
//
// Zwei Pässe:
// 1. Leerzeichen-getrennte Tausender-Gruppen (ZH-PDF-Stil): «5 000» → «5'000»,
//    «1 250» → «1'250», «106 400» → «106'400». Wiederholt bis stabil (Ketten:
//    «1 234 567» → «1 234'567» → «1'234'567»). Nur wenn linke Seite eine oder
//    mehrere Ziffern UND die rechte Seite exakt 3 Ziffern ist, und darauf eine
//    Nicht-Ziffer oder Stringende folgt. Leerzeichen vor Buchstaben («10 Mio.»)
//    und normale Worttrennungen («mind. aber Fr. 100») werden NICHT angefasst
//    (die 3-Ziffern-Bedingung + (?=\D|$) schützt zuverlässig).
// 2. Zusammenhängende ≥4-stellige Ziffernfolgen (SG-/Bund-Stil, kein Leerzeichen):
//    «2000» → «2'000», «50000» → «50'000». Bereits gruppierte Zahlen («2'000»)
//    bleiben unberührt (Apostroph unterbricht den \d{4,}-Match).
export function gruppiereTausender(s: string): string {
  // Pass 0: Bereichs-Strich-Artefakt aus der PDF-Extraktion glätten — ein an die
  // linke Zahl geklebter Halbgeviert-/Geviertstrich mit Leerzeichen vor der
  // rechten Zahl («65– 250» → «65–250», «250– 420» → «250–420»). Nur Ziffer-
  // Strich-Leerzeichen-Ziffer; ein Strich mit Leerzeichen auf BEIDEN Seiten
  // («5 – 7») bleibt unberührt. Reine Darstellung (§3), keine Ziffer geändert.
  let r = s.replace(/(\d[–—])\s+(\d)/g, '$1$2');
  // Pass 1: Leerzeichen-getrennte Tausender (ZH-PDF) — wiederholen bis stabil.
  let prev: string;
  do {
    prev = r;
    r = r.replace(/(\d)\s(\d{3})(?=\D|$)/g, "$1'$2");
  } while (r !== prev);
  // Pass 2: zusammenhängende ≥4-stellige Läufe (SG/Bund-Stil).
  return r.replace(/\d{4,}/g, (n) => n.replace(/\B(?=(\d{3})+(?!\d))/g, "'"));
}

// Tausender-Gruppierung NUR in Geld-Kontext (Fliesstext, §3, FIX 2 — 22.6.2026).
//
// Zweck: In normalem Artikel-Fliesstext («Fr. 12 000» im ZH-PDF) werden Beträge
// mit ZH-PDF-Leerzeichen-Tausendertrenner dargestellt. Diese sollen in der Anzeige
// zum Schweizer Apostroph werden («Fr. 12'000»). ABER: bloss «gruppiereTausender»
// anzuwenden würde z. B. ein Jahreszahl «2011» → «2'011» verunstalten, weil
// gruppiereTausender auf ALLE Zahlen ≥ 4 Stellen wirkt.
//
// Lösung: NUR nach einem Währungs-Marker (Fr., CHF) ODER vor «Franken» gruppieren.
// Alle anderen Zahlen (Jahrezahlen, §-Nummern, Prozentzahlen) bleiben unberührt.
//
// Regeln (§1: kein Ziffernwert geändert; §3: reine Darstellung):
//   1. (Fr\.|CHF)\s*(\d[…\d  '']*\d) → Betrag hinter Marker gruppieren.
//   2. (\d[…\d  '']*\d)\s+Franken → Betrag vor «Franken» gruppieren.
//   Idempotent: bereits «12'000» bleibt «12'000». «Fr. 500» (3 Stellen) bleibt.
//   «2011» allein: KEIN Marker → unverändert. «§ 1234»: kein Fr./Franken → unverändert.
//
// Implementierung:
//   gruppiereEineZahl(s) ruft gruppiereTausender auf einen einzelnen Ziffern-String.
//   Die Regex matcht nur den Zahlen-Teil des Musters und ersetzt ihn.
function gruppiereEineZahl(zahl: string): string {
  return gruppiereTausender(zahl);
}

export function gruppiereBetraege(text: string): string {
  // Pass 1: Nach Fr. oder CHF: «Fr. 12 000» → «Fr. 12'000»,
  //         «CHF 12 000» → «CHF 12'000», «Fr. 500» → «Fr. 500» (3 Stellen, unverändert).
  // Leerzeichen zwischen Marker und Zahl optional (Fr.1000 kommt auch vor).
  let r = text.replace(
    /(Fr\.|CHF)(\s*)(\d[\d\s'']*\d|\d)/g,
    (_, marker, sp, zahl) => `${marker}${sp}${gruppiereEineZahl(zahl)}`,
  );
  // Pass 2: Vor «Franken»: «12 000 Franken» → «12'000 Franken».
  r = r.replace(
    /(\d[\d\s'']*\d|\d)(\s+)(Franken)\b/g,
    (_, zahl, sp, wort) => `${gruppiereEineZahl(zahl)}${sp}${wort}`,
  );
  return r;
}

// Bereichs-Artikel («Art. 226a226d», «Art. 6770») trägt im Snapshot zwei
// zusammengeklebte Artikelnummern ohne Halbgeviert. Aus der Artikel-id
// (z. B. «226_a_226_d», «67_70») das Halbgeviert rekonstruieren. IDs mit nur
// EINER Nummer (Buchstaben-Suffix «40_g», Einzelartikel «335_c») bleiben unberührt.
export function labelMitBereich(label: string, id: string): string {
  if (/[–-]/.test(label)) return label;
  // M13: Schlusstitel-/UeB-Token («disp_u1_art_31_32») beginnen mit Buchstaben.
  // Ihr Label ist bereits generatorseitig korrekt gesetzt (artikelLabel über den
  // reinen Suffix, inkl. Bereich «Art. 31–32»); die heuristische Bereichs-
  // Rekonstruktion aus dem Token würde hier nur Müll erzeugen → früh raus.
  if (!/^\d/.test(id)) return label;
  const toks = id.split('_');
  const numPos = toks.map((t, i) => (/^\d+$/.test(t) ? i : -1)).filter((i) => i >= 0);
  if (numPos.length < 2) return label;
  const p2 = numPos[1];
  const g1 = toks.slice(0, p2).join('');
  const g2 = toks.slice(p2).join('');
  const prefix = label.match(/^(Art\.|§)/)?.[1] ?? 'Art.';
  return `${prefix} ${g1}–${g2}`;
}

// «aufgehoben»: faithful-Snapshot trägt für aufgehobene Stellen (§7) entweder «…»
// oder ein nacktes «Aufgehoben» → einheitlich gedämpftes «aufgehoben». Gilt für
// Absätze UND Items. Echte Sätze mit «aufgehoben» (Art. 57 ZGB) bleiben unberührt.
export function istAufgehoben(text: string): boolean {
  const t = text.trim();
  if (t === '') return false;
  if (/^[….\s]*$/.test(t)) return true;
  const ohneBereich = t.replace(/^(?:(?:und|et|bis|[–-]|\d+)\s+)+/i, '');
  return /^aufgehoben\.?$/i.test(ohneBereich);
}

/** Ist der GANZE Artikel aufgehoben (kein lebender Wortlaut, keine Items)? Dann
 *  zeigt der Reader ihn dezent + standardmässig eingeklappt (Auftrag David:
 *  aufgehobene Artikel «nicht so präsent», aufklappbar).
 *
 *  G-AUFH-ART Runde 2 (Gegenprüfung 27.7.2026) — Prioritäten-Reihenfolge FEST:
 *  (1) Tabelle/Mehrspaltig = LEBENDER Inhalt, IMMER zuerst geprüft und schlägt
 *      ALLES andere (auch `markiert`). Der Adapter markiert heute nie einen
 *      Tabellen-tragenden Artikel (keinRealerInhalt in adapter-lexwork.ts
 *      schliesst das aus), aber diese Funktion darf sich nicht auf diese
 *      Adapter-Invariante verlassen — sonst kehrt sich die bewusst gesetzte
 *      Schutzlogik (Bug-Fix 26.6.2026: 389 Tarif-Artikel) im Ernstfall um.
 *  (2) `markiert` (NormSnapshot.aufgehoben, amtlich VERIFIZIERtes Adapter-
 *      Signal) entscheidet SOFORT, wenn (1) nicht bereits negativ entschieden
 *      hat.
 *  (3) fehlt `markiert`, fällt die Funktion auf die TEXT-Heuristik zurück —
 *      bestehendes Verhalten unverändert (§6 Byte-Gleichheit für alle Daten
 *      ohne das Feld).
 *
 *  W2·27 (14.9.2026) — STATUS DER STUFE (3): Für den BUND ist sie seit der
 *  Regeneration kein Wahrheitsträger mehr, sondern nur noch ein WÄCHTER-SIGNAL.
 *  1 277 Bund-Artikel tragen `aufgehoben` neu aus dem AMTLICHEN Signal der
 *  Fedlex-Fussnote (scripts/normtext/aufhebung-signal.ts); jeder Artikel, den
 *  Stufe (3) allein für aufgehoben hält, ist eine UNGEKLÄRTE LEERSTELLE und
 *  wird von `npm run check:leerstellen` gezählt (Bund 98, Kanton 481 —
 *  Basislinie 14.9.2026; Zuwachs ⇒ rot).
 *  Die Stufe BLEIBT trotzdem stehen, aus zwei Gründen: (a) 481 kantonale
 *  Artikel hängen noch an ihr — sie zu entfernen änderte die Kantons-
 *  Darstellung, was Phase 2 vorbehalten ist; (b) für die 98 Bund-Restfälle ist
 *  «eingeklappt anzeigen» das bisherige, geprüfte Verhalten — es unbegründet
 *  umzuwerfen wäre eine fachliche Änderung ohne Beleg (§1/§6.3). */
export function artikelGanzAufgehoben(
  bloecke: { text: string; items?: { text: string }[]; tabelle?: unknown[]; mehrspaltig?: { zeilen: unknown[] } }[],
  markiert?: boolean,
): boolean {
  const hatTabelle = bloecke.some(
    (b) => (b.tabelle?.length ?? 0) > 0 || (b.mehrspaltig?.zeilen.length ?? 0) > 0,
  );
  if (hatTabelle) return false;
  if (markiert) return true;
  if (!bloecke.length) return false;
  return bloecke.every((b) => {
    const items = b.items ?? [];
    // Lebender Einleitungstext (Lead) mit nur aufgehobenen Items ist NICHT ganz tot.
    const leadTot = !b.text.trim() || istAufgehoben(b.text);
    if (items.length) return leadTot && items.every((it) => it.text.trim() === '' || istAufgehoben(it.text));
    return leadTot;
  });
}
