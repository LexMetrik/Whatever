/**
 * check:normkeys — Sichtbarkeits-Tor der normKeys-Abdeckung (W2·6-NKEY c).
 *
 * ANLASS. Die Verzahnung Rechtsprechung ↔ Gesetz hängt an genau einer
 * Zuordnung: Gesetzes-Abkürzung im Urteil → Register-key. Was diese Zuordnung
 * NICHT trifft, verschwindet lautlos — kein Fehler, kein Log, nur ein Leitfall,
 * der beim Artikel nie erscheint. Der Anlassfall der Bau-Einheit: BGE 152 III 137
 * nennt das IPRG 68-mal, die frühere Hand-Whitelist kannte es nicht, und niemand
 * hätte es je bemerkt. Für stilles Verwerfen gilt CLAUDE.md §6.7 — dieses Tor
 * macht die Lücke messbar, statt sie zu vermuten.
 *
 * WAS GEMESSEN WIRD. Über den committeten Korpus (`ladeBestandSnapshots`) werden
 * je Snapshot dieselben Kandidaten-Token gebildet, die auch der Produktpfad
 * bildet (§5 — keine zweite Zerlegung, sonst misst das Tor etwas anderes als es
 * prüfen soll):
 *   (a) statutes-Pfad   — Trailing-Token je Roh-Zeile aus `zitierteNormen`,
 *                         über `abkVonStatut` (dieselbe Funktion, die
 *                         `statutesZuNormKeys` benutzt);
 *   (b) Fliesstext-Pfad — `ref.gesetz` aus
 *                         `extrahiereStatutRefs(fliesstextOhneApparat(snap))`;
 *                         also derselbe um die Zitier-Apparat-Spannen bereinigte
 *                         Text, den auch `normKeysVonSnapshot` liest (R3).
 * Jedes Token wird mit `normalisiereAbk` normalisiert und einer von drei Klassen
 * zugeordnet: GEMAPPT (`normKeyFuerAbk` ≠ null), AUSGESCHLOSSEN (steht in
 * `ABK_AUSSCHLUSS` — bewusste Lücke, zählt NICHT als ungemappt, wird aber
 * sichtbar ausgewiesen) oder UNGEMAPPT.
 *
 * SCHWELLE = 20 SNAPSHOTS, datenbasiert (Messung 28.7.2026, 5'093 Snapshots).
 * Häufigkeit ist bewusst die SNAPSHOT-Frequenz (in wie vielen Entscheiden kommt
 * das Token vor), nicht die Zahl der Nennungen: ein einziges Urteil, das «LTF»
 * 60-mal zitiert, ist ein Fall, kein Muster — die Nennungs-Zählung würde von
 * solchen Ausreissern dominiert. Verteilung der ungemappten Token nach
 * Snapshot-Frequenz: ≥3 → 312, ≥5 → 177, ≥10 → 92, ≥15 → 58, ≥20 → 46,
 * ≥30 → 33, ≥50 → 19. Die Kurve hat keinen natürlichen Knick; 20 (≈0.4 % des
 * Korpus) ist die Grenze, ab der eine Abkürzung systematisch auftritt statt
 * vereinzelt, und sie ist die Grenze, bis zu der JEDER Ignore-Eintrag unten
 * einzeln am Korpus-Beleg verifiziert werden konnte. Das ist der Preis der
 * Regel «kein Eintrag ohne geprüfte Begründung» (§7): lieber eine höhere
 * Schwelle mit einer Handvoll belegter Einträge als eine tiefere mit geratenen. Ein
 * Absenken auf 10 ist möglich, seit die FR/IT-Amtskürzel gemappt sind (die
 * Restliste ist klein genug zum Verifizieren) — es bleibt aber ein EIGENER
 * Schritt: jedes Token zwischen 10 und 20 will einzeln am Korpus belegt sein,
 * bevor es in die Ignore-Tabelle darf.
 *
 * DAS TOR WAR BEI SEINER EINFÜHRUNG ROT, UND DAS WAR KORREKT (§6.7). Über der
 * Schwelle standen 34 französische und italienische AMTSKÜRZEL desselben
 * Bundesrechts (LTF/CST/COST = BGG/BV, CP/CPP/CPC/CC/CO, LP/LEF, CEDH/CEDU …).
 * Sie waren keine Lücke im Register, sondern eine fehlende Alias-Ebene; sie
 * gehörten darum ausdrücklich NICHT in die Ignore-Tabelle, sondern in die
 * Rot-Liste. Ein Tor, das man grün macht, indem man die offene Arbeit in seine
 * Ausnahmeliste schreibt, hätte den Zweck verfehlt.
 *
 * W2·6-NKEY Baustein b (amtliche Fedlex-Kürzel als generiertes Alias-Artefakt)
 * hat sie abgeräumt: gemessen am selben Korpus stieg die gemappte Quote von
 * 76.8 % auf 93.6 % der Nennungen, und die Rot-Liste ab 20 Snapshots schrumpfte
 * von 46 auf 12 deklarierte Ignore-Einträge (Messung 28.7.2026, 5'093
 * Snapshots). Alle 34 Token wurden GEMAPPT, keines wurde ignoriert — der
 * Unterschied ist der ganze Punkt dieses Tors.
 * Stand nach Linse 2 (gleicher Korpus): 93.7 %, 11 Ignore-Einträge — 'BGE' ist
 * entfallen, weil `abkVonStatut` das Token seither gar nicht mehr erzeugt.
 *
 * ── WAS DIESES TOR NICHT KANN (Linse 2, 28.7.2026 — bitte nicht wegkürzen) ───
 *
 * Es misst ABDECKUNG, nicht RICHTIGKEIT. Ein Token zählt als «gemappt», sobald
 * `normKeyFuerAbk` irgendeinen Register-key liefert — ob es der RICHTIGE ist,
 * prüft hier nichts. Das ist keine theoretische Einschränkung: eine FALSCH-
 * Zuordnung hebt die Quote sogar, das Tor wird von ihr also GRÜNER, nicht röter.
 * Der belegte Fall war die Trunkierung akzentuierter Kürzel — «LPMéd»
 * (Medizinalberufegesetz SR 811.11) wurde zu 'LPM' verkürzt und traf damit das
 * amtliche fr/it-Kürzel des Markenschutzgesetzes (SR 232.11): 16 Nennungen in
 * 5 BGE, alle als «gemappt» gezählt, alle falsch. Geschlossen wurde das an der
 * Wortgrenze des Extraktors (`CODE_ENDE` in zitat-extraktion.ts), nicht hier.
 *
 * Der Angriffskanal ist damit zu, die STRUKTURELLE Grenze bleibt: dieses Tor
 * kann eine Fehlzuordnung grundsätzlich nicht sehen. Dafür zuständig sind die
 * adversariale Gegenprüfung auf dem Risikopfad und die fachliche Abnahme (§7) —
 * nicht eine Zahl in dieser Ausgabe. Wer die Quote als Qualitätsmass liest,
 * liest sie falsch: sie sagt «wie viel wurde zugeordnet», nie «wie viel wurde
 * richtig zugeordnet».
 *
 * ── DIE RICHTUNGS-UMKEHR, ausdrücklich (Gegenprüfung R3, Befund 3) ───────────
 *
 * Der vorstehende Absatz sagt, das Tor könne eine Fehlzuordnung nicht SEHEN. Das
 * ist noch zu freundlich formuliert, und die Untertreibung ist gefährlich, weil
 * sie zur falschen Lesart einlädt. Die Wirkung ist nicht neutral, sondern
 * GEGENLÄUFIG:
 *
 *   Eine gemappte PHANTOM-Nennung HEBT die Quote.
 *
 * Ein Artikel, der ausschliesslich im Literaturnachweis eines Kommentars steht
 * («… Ein Kommentar zu Art. 261bis StGB und Art. 171c MStG, 2007»), erzeugt ein
 * Token, das `normKeyFuerAbk` sauber auflöst. Er zählt hier als GEMAPPT, im
 * Zähler wie im Nenner — obwohl das Gericht die Norm nirgends anwendet. Je mehr
 * Literatur ein Entscheid zitiert, desto besser sieht dieses Tor aus. Wer die
 * Quote maximieren wollte, müsste die Zitat-Erkennung LOCKERER machen, nicht
 * genauer. Das ist die Umkehrung dessen, was ein Qualitätsmass tun müsste.
 *
 * Daraus folgen zwei Dinge, beide bewusst:
 *  · Die Literatur-Kontext-Regel (`ohneLiteraturApparat`) senkt die Quote
 *    tendenziell — und das ist ein FORTSCHRITT, kein Rückschritt. Ein Sinken
 *    dieser Zahl darf niemals als Regression gelesen werden; die Ausgabe weist
 *    darum die Zahl der entfernten Zitier-Apparat-Spannen mit aus.
 *  · Dieses Tor bleibt ein ABDECKUNGS-Tor. Die Qualität der ZUORDNUNG sichern
 *    die adversariale Gegenprüfung und die fachliche Abnahme (§7), nicht diese
 *    Prozentzahl. Ein grünes check:normkeys sagt: «fast jedes gebildete Token
 *    fand einen Register-key» — nicht «die Zuordnungen sind richtig», und schon
 *    gar nicht «die Zitate sind echte Rechtsanwendung».
 *
 * ── ZWEITE STRUKTURELLE GRENZE: DIE AUFLÖSUNG (Gegenprüfung R1/B3, 28.7.2026) ─
 *
 * Dieses Tor misst ausschliesslich die ERLASS-Ebene — Klassen und Quote zählen
 * `ref.gesetz`, also das Kürzel. Die ARTIKEL-Ebene (`proNormArtikel`, die Shards)
 * liegt UNTERHALB seiner Auflösung: ob ein Snapshot dem Erlass StGB zugeordnet
 * wird, sieht es; ob dabei der Artikel-Schlüssel «179septies» entsteht oder
 * verloren geht, sieht es nicht.
 *
 * Das ist keine akademische Grenze. Die beiden Befunde der Gegenprüfung R1 lagen
 * genau dort: die bei «sexies» abgebrochene Ordinal-Serie und der fehlende frz.
 * Absatz-Marker «par.». Beide sind für dieses Tor sogar DOPPELT unsichtbar —
 * erstens, weil sie Artikel-Schlüssel betreffen, und zweitens, weil ein nicht
 * tokenisiertes Zitat gar kein Kandidaten-Token erzeugt und damit weder in der
 * Rot-Liste noch im NENNER der Quote auftaucht (dieselbe Blindheit wie bei den
 * unerreichbaren Alias-Formen, oben). Eine Nennung, die der Extraktor nicht
 * bildet, macht die Quote nicht schlechter, sondern blinder.
 *
 * Daraus folgt AUSDRÜCKLICH KEINE neue Rot-Bedingung hier. Ein Tor, das die
 * Artikel-Ebene prüfen wollte, bräuchte einen Soll-Bestand je Artikel — den gibt
 * es nicht, und ein geratener wäre schlimmer als keiner (§6.7). Zuständig für
 * diese Fehlerklasse ist und bleibt die adversariale Gegenprüfung (§7). Der
 * Absatz steht hier, damit niemand aus einem grünen check:normkeys schliesst,
 * die Artikel-Zuordnung sei geprüft.
 *
 * Offline, deterministisch (§2): liest nur committete Artefakte, sortiert jede
 * Ausgabe, kein Netz, kein Datums-Zugriff in der Prüflogik.
 * Aufruf: vite-node scripts/normtext/check-normkeys-abdeckung.ts
 */
import { ladeBestandSnapshots } from './entscheide-schreiben';
import {
  ABK_ALIAS_AUSGESCHLOSSEN,
  ABK_ALIAS_NOTIZEN,
  ABK_AUSSCHLUSS,
  ABK_KOLLISIONEN,
  abkVonStatut,
  ERLASS_FASSUNGS_REIHEN,
  fliesstextOhneApparat,
  fliesstextVon,
  literaturSpannen,
  LITERATUR_MARKER,
  normKeyFuerAbk,
  normalisiereAbk,
  gerichtsKuerzelKey,
} from './entscheide-mapping';
import { ABK_ALIASE } from '../../src/lib/normtext/abk-aliase.generated';
import {
  extrahiereStatutRefs, extrahiereStatutRefsMitAnzahl, INVALID_LAW_CODES,
} from '../../src/lib/rechtsprechung/zitat-extraktion';
import { vergleiche } from './vergleich';

/** Snapshot-Frequenz, ab der ein ungemapptes Token das Tor rot macht. */
const SCHWELLE = 20;

type Grund = 'kantonal' | 'ausserhalb-korpus' | 'rauschen' | 'aufgehoben';

interface IgnoreEintrag {
  grund: Grund;
  kommentar: string;
  /**
   * SR-Nummer, wenn das Token nachweislich einen BUNDES-Erlass bezeichnet, der
   * (noch) nicht im ERLASS_REGISTER steht. Nur solche Einträge erscheinen unten
   * als KORPUS-KANDIDATEN — die Liste ist damit deklariert und nicht geraten.
   */
  srNummer?: string;
}

/**
 * Ungemappte Token über der Schwelle, deren Nicht-Zuordnung BEGRÜNDET ist.
 *
 * Jeder Eintrag ist am Korpus-Beleg verifiziert (§7) — die Belegstelle steht im
 * Kommentar. «Kommt oft vor» ist keine Begründung; die Frage, die ein Eintrag
 * beantworten muss, lautet: warum ist es RICHTIG, dass dieses Zitat keinen
 * Register-key bekommt?
 *
 * KEINE FR/IT-Amtskürzel hier (siehe Kopf): die sind offene Arbeit, keine
 * Ausnahme.
 */
const IGNORE: Record<string, IgnoreEintrag> = {
  // ── kantonal ──────────────────────────────────────────────────────────────
  VRPG: {
    grund: 'kantonal',
    kommentar:
      'Gesetz über die Verwaltungsrechtspflege — kantonaler Erlass (BE: BSG 155.21; '
      + 'gleichlautend AG/TG/AR). Belege ausschliesslich aus kantonalen Entscheiden, '
      + 'z.B. kanton/BE/be_verwaltungsgericht/200202645 «Art. 79 Abs. 1 VRPG», '
      + '«Art. 32 Abs. 2 VRPG». Ein Bundes-key wäre hier schlicht falsch (§1).',
  },

  // ── ausserhalb des Korpus (EU-Recht / Bundeserlass ohne Register-Eintrag) ──
  RL: {
    grund: 'ausserhalb-korpus',
    kommentar:
      'Abgeschnittener Rest von «RL 2008/115/EG» (EU-Rückführungsrichtlinie) — der '
      + 'Extraktor endet vor der Zahlenkennung. Beleg kanton/BS/bs_appellationsgericht/'
      + 'AUS.2026.55: «… soweit diese mit der gebotenen Sorgfalt vorangetrieben werden '
      + '(vgl. Art. 15 Abs. 1 RL 2008/115/EG)». EU-Recht ist kein Schweizer Erlass und '
      + 'gehört nicht ins ERLASS_REGISTER.',
  },
  SIS: {
    grund: 'ausserhalb-korpus',
    kommentar:
      'Abgeschnittener Rest von «SIS-II-Verordnung» ((EG) Nr. 1987/2006) — der '
      + 'Extraktor bricht am Bindestrich ab. Beleg kanton/BS/bs_appellationsgericht/'
      + 'SB.2024.39: «Damit wird dem in Art. 21 SIS-II-Verordnung verankerten '
      + 'Verhältnismässigkeitsprinzip Rechnung getragen.» EU-Recht, kein Schweizer '
      + 'Erlass. (Die schweizerische N-SIS-Verordnung SR 362.0 ist ein ANDERER Erlass '
      + 'und wird in denselben Entscheiden ausgeschrieben zitiert.)',
  },
  VO: {
    grund: 'ausserhalb-korpus',
    kommentar:
      'Abgeschnittener Rest von «VO (Nr.) 883/2004» (EU-Verordnung zur Koordinierung '
      + 'der Systeme der sozialen Sicherheit). Belege: bund/bge/151_V_315 «Art. 11 '
      + 'Abs. 3 lit. e VO 883/2004»; kanton/BS/bs_sozialversicherungsgericht/KV.2024.4 '
      + '«gemäss Art. 11 VO Nr. 883/2004 in Verbindung mit Art. 23 VO Nr. 883/2004». '
      + 'EU-Recht; daneben Restnutzung als blosses Wort «Verordnung» ohne Erlass-'
      + 'Identität — in beiden Lesarten nicht zuordenbar.',
  },
  BZP: {
    grund: 'ausserhalb-korpus',
    srNummer: '273',
    kommentar:
      'Bundesgesetz vom 4. Dezember 1947 über den Bundeszivilprozess (BZP), SR 273 — '
      + 'echter Bundeserlass, aber (noch) NICHT im ERLASS_REGISTER. Beleg amtlich im '
      + 'Korpus: bund/bge/148_I_33 «… Bestimmungen des Bundesgesetzes vom 4. Dezember '
      + '1947 über den Bundeszivilprozess (BZP; SR 273)». Darum Korpus-Kandidat, nicht '
      + 'Rauschen: die Lücke schliesst man durch Aufnahme des Erlasses, nicht durch '
      + 'ein Alias.',
  },
  WG: {
    grund: 'ausserhalb-korpus',
    srNummer: '514.54',
    kommentar:
      'Waffengesetz (WG), SR 514.54 — echter Bundeserlass, (noch) nicht im '
      + 'ERLASS_REGISTER. Beleg im Korpus: public/normtext/struktur/kanton/AR-524.2 '
      + 'zitiert «Waffengesetz (WG; SR 514.54)»; Anwendungsfälle z.B. bund/bge/'
      + '152_IV_107 «Art. 33 Abs. 1 lit. a WG». Korpus-Kandidat.',
  },

  // ── aufgehobenes / abgelöstes Recht ───────────────────────────────────────
  OG: {
    grund: 'aufgehoben',
    kommentar:
      'Bundesgesetz vom 16. Dezember 1943 über die Organisation der Bundesrechtspflege '
      + '(OG) — aufgehoben per 1.1.2007 durch das BGG. Beleg amtlich in unserem eigenen '
      + 'Snapshot public/normtext/bund/BGG.json (Aufhebung bisherigen Rechts): '
      + '«… über die Organisation der Bundesrechtspflege wird aufgehoben.» Die Zitate '
      + 'sind altrechtliche Verweise (bund/bge/151_II_657 «Art. 87 Abs. 1 OG»); ein '
      + 'Link auf geltendes Recht gäbe es nicht (§7: massgeblich ist die geltende Fassung).',
  },
  AUG: {
    grund: 'aufgehoben',
    kommentar:
      'Bundesgesetz über die Ausländerinnen und Ausländer (AuG), SR 142.20 — die '
      + 'Bezeichnung ist per 1.1.2019 durch AIG abgelöst (gleiche SR-Nummer). Beleg '
      + 'aus dem Korpus: «… Ausländergesetzes (AuG; seit 1. Januar 2019 Ausländer- und '
      + 'Integrationsgesetz, AIG, SR 142.20) …». Eine Zuordnung AuG → AIG wäre '
      + 'vertretbar, ist aber eine FACHLICHE Entscheidung über altrechtliche Zitate '
      + '(die zitierte Fassung ist nicht die geltende) und kein Register-Fakt — bis '
      + 'zum Entscheid darüber bewusst ungemappt (§7/§8).',
  },
  ABV: {
    grund: 'aufgehoben',
    kommentar:
      '«aBV» = Bundesverfassung vom 29. Mai 1874, abgelöst durch die BV vom 18.4.1999. '
      + 'Belege bund/bge/151_I_314: «Art. 27 Abs. 3 aBV», «seit dem Inkrafttreten von '
      + 'Art. 4 Abs. 2 aBV». Die Artikel-Nummern sind NICHT deckungsgleich mit der '
      + 'geltenden BV — ein Mapping auf BV zeigte auf den falschen Artikel (§1).',
  },
  ASTGB: {
    grund: 'aufgehoben',
    kommentar:
      '«aStGB» = die im Tatzeitpunkt geltende ältere Fassung des StGB (lex mitior, '
      + 'Art. 2 Abs. 2 StGB), kein eigener Erlass. Belege kanton/BS/bs_appellations'
      + 'gericht/SB.2024.69 «Art. 285 Ziff. 1 aStGB», bund/bge/152_IV_14 «Art. 259 '
      + 'Abs. 1 aStGB». Der Snapshot führt nur die GELTENDE Fassung; die «Ziff.»-'
      + 'Gliederung der Alt-Fassung existiert dort nicht mehr — ein Mapping auf StGB '
      + 'verlinkte auf einen anderen Normtext als den zitierten (§7).',
  },

  // ── Rauschen (Extraktions-Artefakt, kein Erlass) ──────────────────────────
  //
  // GESTRICHEN (Linse 2, 28.7.2026): der Eintrag 'BGE'. Er deckte das Artefakt
  // der Roh-Drittextraktion ab — Zeilen der Form «Art. 127 BGE» (bund/bge/
  // 152_II_98, neben korrektem «Art. 127 Abs. 2 CST» derselben Liste), 51
  // Nennungen in 50 Snapshots, ausschliesslich statutes-Pfad. Seit `abkVonStatut`
  // dieselbe Sperrliste `INVALID_LAW_CODES` anwendet wie der Fliesstext-Pfad
  // (dort stand 'BGE' längst), entsteht der Kandidat gar nicht mehr: das Token
  // erscheint in dieser Erhebung mit 0 Snapshots. Eine Ausnahme für etwas, das
  // nicht mehr auftreten kann, ist genau die «tote Regel», die Prüfung (2) unten
  // rot meldet — darum entfernt statt mitgeschleppt.
  BVV: {
    grund: 'rauschen',
    kommentar:
      'Abgeschnittene Form von «BVV 2»/«BVV 3» (Verordnungen zur beruflichen Vorsorge). '
      + 'Der Fliesstext-Extraktor liest die Ziffer nach dem Leerzeichen nicht mit — die '
      + 'in entscheide-mapping.ts (normalisiereAbk) dokumentierte und bewusst offen '
      + 'gelassene Ziffern-Lücke. Belege: bund/bge/151_V_343 «Art. 60b Abs. 1 BVV», '
      + 'kanton/BS/…/BV.2023.16 «Art. 1k lit. a BVV» (beides BVV 2). Ein Mapping auf '
      + '«BVV» wäre eine Wahl zwischen zwei verschiedenen Erlassen, also Raten (§1); '
      + 'gedeckt bleibt die Nennung über den statutes-Pfad, der die Ziffer trägt.',
  },
};

// ── Erhebung ────────────────────────────────────────────────────────────────

interface TokenZahl {
  token: string;
  /** Nennungen im statutes-Pfad (Roh-Zeilen aus zitierteNormen). */
  statutes: number;
  /** Nennungen im Fliesstext-Pfad (Refs aus extrahiereStatutRefs). */
  fliesstext: number;
  /** Snapshots ausserhalb des Bundesgerichts mit diesem Token (GERICHTS_KUERZEL gelten dort nicht). */
  ausserhalbBger?: number;
  /** Anzahl SNAPSHOTS, in denen das Token vorkommt — die Häufigkeit des Tors. */
  snapshots: number;
}

function erhebe(snaps: readonly ReturnType<typeof ladeBestandSnapshots>[number][]): Map<string, TokenZahl> {
  const zahlen = new Map<string, TokenZahl>();
  const hole = (token: string): TokenZahl => {
    let z = zahlen.get(token);
    if (!z) { z = { token, statutes: 0, fliesstext: 0, snapshots: 0 }; zahlen.set(token, z); }
    return z;
  };

  for (const snap of snaps) {
    const imSnapshot = new Set<string>();
    for (const zeile of snap.zitierteNormen ?? []) {
      const abk = abkVonStatut(zeile);
      if (!abk) continue;
      const token = normalisiereAbk(abk);
      if (!token) continue;
      hole(token).statutes += 1;
      imSnapshot.add(token);
    }
    // BEREINIGTER Text (Gegenprüfung R3): das Tor MUSS dieselben Kandidaten-Token
    // bilden wie der Produktpfad (§5). Läse es hier den rohen Fliesstext, stünden
    // Kürzel im Nenner, die `normKeysVonSnapshot` gar nicht mehr sieht — das Tor
    // misste dann etwas, das es nicht prüft.
    for (const ref of extrahiereStatutRefs(fliesstextOhneApparat(snap))) {
      const token = normalisiereAbk(ref.gesetz);
      if (!token) continue;
      hole(token).fliesstext += 1;
      imSnapshot.add(token);
    }
    for (const token of imSnapshot) {
      const z = hole(token);
      z.snapshots += 1;
      if (snap.gerichtstyp !== 'bundesgericht') z.ausserhalbBger = (z.ausserhalbBger ?? 0) + 1;
    }
  }
  return zahlen;
}

function prozent(teil: number, ganz: number): string {
  return ganz === 0 ? '—' : `${((teil / ganz) * 100).toFixed(1)} %`;
}

/** Kommaliste auf `breite` Zeichen umbrechen (rein, reihenfolgetreu). */
function umbreche(eintraege: readonly string[], breite: number): string[] {
  const zeilen: string[] = [];
  let aktuell = '';
  for (const e of eintraege) {
    const stueck = aktuell === '' ? e : `${aktuell}, ${e}`;
    if (stueck.length > breite && aktuell !== '') { zeilen.push(aktuell); aktuell = e; }
    else aktuell = stueck;
  }
  if (aktuell !== '') zeilen.push(aktuell);
  return zeilen;
}

/**
 * Aliase, die der FLIESSTEXT-Extraktor strukturell nie erzeugen kann (Linse 2).
 *
 * Der Extraktor liest nur `[A-Z][A-Z0-9]{1,11}[ÄÖÜ]?` als Gesetzes-Code, und er
 * verwirft danach über Gross-Regel und Sperrliste weiter. Eine amtliche
 * Abkürzung, die daran scheitert — «BVV 2», «BüG», «GwV-FINMA» —, kann im
 * Fliesstext-Pfad nie nachgeschlagen werden. Im statutes-Pfad bleibt sie
 * wirksam, weil `abkVonStatut` das Roh-Token samt Akzent liest.
 *
 * Ausgewiesen wird das, sonst wächst die Liste still, und niemand merkt, dass
 * ein Erlass im Fliesstext nur über eine ANDERE Sprachfassung gefunden wird
 * (SR 812.212.21 etwa nur über das it-Kürzel «OM», nie über das fr-«OMéd»).
 * Genau diese Asymmetrie wollte man wissen, bevor man aus einer Abdeckungs-
 * Quote Schlüsse zieht (§8).
 *
 * ERMITTELT MIT DEM ECHTEN EXTRAKTOR, nicht per Zeichen-Heuristik (§5): das
 * Alias wird in ein Minimal-Zitat gesetzt und geprüft, ob dabei sein eigener
 * normalisierter Token herauskommt. Ändert sich die Reichweite des Extraktors,
 * ändert sich diese Liste automatisch mit — eine nachgebaute Regel täte das
 * nicht und driftete weg.
 *
 * URSACHE JE EINTRAG (Linse 3, 28.7.2026). Die frühere Doku nannte «Akzent oder
 * Leerzeichen». Am Bestand sind es FÜNF Ursachen, und die Zuschreibung ist
 * nicht die naheliegende: Das Muster läuft case-insensitiv (`i`-Flag), medial
 * kleingeschriebene ASCII-Buchstaben sind also KEIN Hindernis — «Lferr»
 * scheitert nicht am Muster, sondern an der Gross-Regel (genau ein
 * Grossbuchstabe bei Länge > 3). Die Reihenfolge unten spiegelt die Reihenfolge,
 * in der der Extraktor selbst verwirft: Form → Gross-Regel → Sperrliste.
 * Verteilung 28.7.2026 (62 Einträge): Leerzeichen 32 · Trennzeichen 17 ·
 * Akzent/Umlaut im Wortinnern 9 · Gross-Regel 3 · Sperrliste 1 («LA», das
 * amtliche fr-Kürzel des Luftfahrtgesetzes — es steht als frz. Artikel «la» in
 * INVALID_LAW_CODES, obwohl `normKeyFuerAbk('LA')` auf LFG zeigt; die
 * Falsch-Positiv-Vermeidung gewinnt hier bewusst gegen den Treffer).
 */
type UnerreichbarGrund =
  | 'Leerzeichen'
  | 'Trennzeichen kappt den Code'
  | 'Akzent/Umlaut im Wortinnern'
  | 'nur 1 Grossbuchstabe bei Länge > 3'
  | 'Sperrliste INVALID_LAW_CODES'
  | 'unbekannt';

interface UnerreichbaresAlias {
  abk: string;
  sr: string;
  sprache: string;
  grund: UnerreichbarGrund;
}

/**
 * Nicht-ASCII-Probe OHNE Regex (ESLint `no-control-regex`): die frühere Fassung
 * schrieb `/[^\x00-\x7F]/`, und ein Kontrollzeichen in einer Regex ist fast immer
 * ein Tippfehler — die Regel unterscheidet den Absichtsfall nicht. Verhalten
 * identisch: der Zeichenklassen-Ausschluss traf genau die Code-Units > 127,
 * dasselbe prüft die Schleife (Code-Unit-Ebene wie die Regex ohne `u`-Flag).
 */
function hatNichtAscii(s: string): boolean {
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) > 0x7f) return true;
  return false;
}

/** Erste greifende Verwerf-Ursache, in der Reihenfolge des Extraktors. */
function unerreichbarGrund(abk: string): UnerreichbarGrund {
  if (/\s/.test(abk)) return 'Leerzeichen';
  // Ein Nicht-ASCII-Buchstabe ist nur als END-Umlaut zulässig (GESETZ_CODE).
  if (hatNichtAscii(abk.replace(/[ÄÖÜ]$/, ''))) return 'Akzent/Umlaut im Wortinnern';
  // Bindestrich/Punkt: der Code endet dort, der Rest fällt ab («GwV-FINMA» → 'GWV').
  if (/[^A-Za-z0-9]/.test(abk)) return 'Trennzeichen kappt den Code';
  if ((abk.match(/[A-ZÄÖÜ]/g) ?? []).length <= 1 && abk.length > 3) {
    return 'nur 1 Grossbuchstabe bei Länge > 3';
  }
  if (INVALID_LAW_CODES.has(abk.toUpperCase())) return 'Sperrliste INVALID_LAW_CODES';
  return 'unbekannt';
}

function unerreichbareAliase(): UnerreichbaresAlias[] {
  const raus: UnerreichbaresAlias[] = [];
  for (const a of ABK_ALIASE) {
    const ziel = normalisiereAbk(a.abk);
    if (!ziel) continue;
    const refs = extrahiereStatutRefs(`Art. 1 ${a.abk}`);
    if (refs.some((r) => normalisiereAbk(r.gesetz) === ziel)) continue;
    raus.push({ abk: a.abk, sr: a.sr, sprache: a.sprache, grund: unerreichbarGrund(a.abk) });
  }
  return raus.sort((x, y) => vergleiche(x.abk, y.abk) || vergleiche(x.sr, y.sr));
}

/** Roh-Häufigkeit einer unerreichbaren Alias-Form im Korpus. */
interface UnerreichbarZahl {
  abk: string;
  grund: UnerreichbarGrund;
  /** Identitäts-Treffer der Form im Korpus-Text (Wortgrenze, kein Substring). */
  roh: number;
  /** Treffer, die der Extraktor als ARTIKEL-Zitat gelesen hätte — die Fehlmenge. */
  zitate: number;
  /** Snapshots, in denen die Form vorkommt. */
  snapshots: number;
}

/**
 * WIE VIEL FEHLT DEM NENNER (Linse 3, 28.7.2026 — bitte nicht wegkürzen).
 *
 * Die Quote oben misst Token, die der Extraktor GEBILDET hat. Eine unerreichbare
 * Alias-Form bildet gar kein Token: ihre Nennungen sind weder gemappt noch
 * ungemappt, sie stehen überhaupt nicht im Nenner. Die Quote wird von dieser
 * Lücke also nicht schlechter, sondern BLIND — und eine Kennzahl, deren
 * Blindfleck man nicht beziffert, liest sich besser als sie ist (§8).
 *
 * Zwei Zahlen je Form, weil sie Verschiedenes sagen:
 *   · `roh`    — Identitäts-Treffer der Form (Wortgrenze `(?<![A-Za-z0-9À-ɏ])…`,
 *                nie Substring, §7) über zitierteNormen + Fliesstext. OBERGRENZE:
 *                darin steckt jede Nennung, auch die blosse Erwähnung im Text.
 *   · `zitate` — davon die, die der Extraktor als Artikel-Zitat gelesen HÄTTE.
 *                Gemessen mit dem ECHTEN Extraktor (§5), nicht nachgebaut: die
 *                Form wird im Korpus-Text durch einen erreichbaren Platzhalter
 *                ersetzt und `extrahiereStatutRefs` erneut gefahren. Das ist die
 *                Zahl, die dem Nenner tatsächlich fehlt.
 *
 * Rein und deterministisch: nur committete Snapshots, sortierte Ausgabe.
 */
const PLATZHALTER = 'XQZALIAS';   // erreichbarer Code, kommt im Korpus nicht vor

function zaehleUnerreichbarImKorpus(
  aliase: readonly UnerreichbaresAlias[],
  snaps: readonly ReturnType<typeof ladeBestandSnapshots>[number][],
): { zahlen: UnerreichbarZahl[]; betroffeneSnapshots: number } {
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const grundVon = new Map(aliase.map((a) => [a.abk, a.grund]));
  const formen = [...grundVon.keys()].sort(vergleiche);
  if (formen.length === 0) return { zahlen: [], betroffeneSnapshots: 0 };
  // Sammel-Muster zuerst (ein Scan je Snapshot), Einzel-Muster nur bei Treffer.
  // Längere Formen voran, damit «OPP 2» nicht von «OPP» verdeckt wird.
  const sammel = new RegExp(
    `(?<![A-Za-z0-9À-ɏ])(?:${[...formen].sort((a, b) => b.length - a.length || vergleiche(a, b))
      .map(escape).join('|')})(?![A-Za-z0-9À-ɏ])`,
    'g',
  );
  const einzeln = new Map(
    formen.map((f) => [f, new RegExp(`(?<![A-Za-z0-9À-ɏ])${escape(f)}(?![A-Za-z0-9À-ɏ])`, 'g')]),
  );
  const acc = new Map(formen.map((f) => [f, { roh: 0, zitate: 0, snapshots: 0 }]));
  let betroffeneSnapshots = 0;
  for (const snap of snaps) {
    const text = (snap.zitierteNormen ?? []).join('\n') + '\n' + fliesstextOhneApparat(snap);
    const treffer = new Set(text.match(sammel) ?? []);
    if (treffer.size === 0) continue;
    betroffeneSnapshots += 1;
    for (const f of treffer) {
      const rx = einzeln.get(f);
      const a = acc.get(f);
      if (!rx || !a) continue;   // Sammel-Treffer ohne Einzel-Form: kann nicht sein
      a.roh += (text.match(rx) ?? []).length;
      a.snapshots += 1;
      a.zitate += extrahiereStatutRefs(text.replace(rx, PLATZHALTER))
        .filter((r) => r.gesetz === PLATZHALTER).length;
    }
  }
  const zahlen = [...acc.entries()]
    .filter(([, z]) => z.roh > 0)
    .map(([abk, z]) => ({ abk, grund: grundVon.get(abk)!, ...z }))
    .sort((x, y) => y.zitate - x.zitate || y.roh - x.roh || vergleiche(x.abk, y.abk));
  return { zahlen, betroffeneSnapshots };
}

function main(): void {
  console.log('\n── Tor: normKeys-Abdeckung (Rechtsprechungs-Korpus → ERLASS_REGISTER) ───');

  const snaps = ladeBestandSnapshots();
  const snapshots = snaps.length;
  const zahlen = erhebe(snaps);
  const fehler: string[] = [];

  // Leerer Korpus ⇒ jede Quote wäre trivial «vollständig». Ein Tor, das durch
  // Wegfall seiner Datenquelle grün wird, ist genau der Fall aus §6.7.
  if (snapshots === 0 || zahlen.size === 0) {
    console.error(
      `  FEHLER: Korpus leer (${snapshots} Snapshots, ${zahlen.size} Token) — das Tor `
      + 'kann nichts messen. public/rechtsprechung/register.json prüfen.',
    );
    process.exit(1);
  }

  // ── Klassifikation ────────────────────────────────────────────────────────
  const alle = [...zahlen.values()].sort((a, b) => vergleiche(a.token, b.token));
  // GERICHTS_KUERZEL (entscheide-mapping.ts, QS-KORPUS 25.9.2026) wirken im
  // Produktpfad NUR in Bundesgerichts-Snapshots. Das Tor zählt ein solches Token
  // darum nur dann als gemappt, wenn es AUSSCHLIESSLICH dort vorkommt — eine
  // einzige kantonale/eidg. Nennung liesse es ungemappt (sie verschwände im
  // Produktpfad ja weiterhin lautlos, §6.7).
  const key = (z: TokenZahl): string | null =>
    normKeyFuerAbk(z.token)
    ?? (!z.ausserhalbBger ? gerichtsKuerzelKey(z.token, 'bundesgericht') : null);
  const gemappt = alle.filter((z) => key(z) !== null);
  const ausgeschlossen = alle.filter(
    (z) => key(z) === null && ABK_AUSSCHLUSS.has(z.token),
  );
  const ungemappt = alle.filter(
    (z) => key(z) === null && !ABK_AUSSCHLUSS.has(z.token),
  );

  const summe = (liste: TokenZahl[], feld: 'statutes' | 'fliesstext'): number =>
    liste.reduce((n, z) => n + z[feld], 0);

  const nStatutes = summe(alle, 'statutes');
  const nFliess = summe(alle, 'fliesstext');
  const nGesamt = nStatutes + nFliess;
  const gStatutes = summe(gemappt, 'statutes');
  const gFliess = summe(gemappt, 'fliesstext');

  // ── (1) Ungemappte Token über der Schwelle ohne Ignore-Eintrag ────────────
  const rot = ungemappt
    .filter((z) => z.snapshots >= SCHWELLE && !(z.token in IGNORE))
    .sort((a, b) => b.snapshots - a.snapshots || vergleiche(a.token, b.token));
  if (rot.length > 0) {
    fehler.push(
      `${rot.length} ungemappte(s) Token ab ${SCHWELLE} Snapshots ohne Ignore-Eintrag:\n`
      + rot.map((z) => `      ${z.token.padEnd(10)} ${String(z.snapshots).padStart(4)} Snapshots`
        + ` (${z.statutes} statutes / ${z.fliesstext} Fliesstext)`).join('\n')
      + '\n      → Entweder im ERLASS_REGISTER/Alias-Artefakt zuordenbar machen (dann wird\n'
      + '        das Zitat sichtbar), oder mit GEPRÜFTER Begründung in IGNORE eintragen\n'
      + '        (scripts/normtext/check-normkeys-abdeckung.ts). Kein Eintrag ohne Beleg.',
    );
  }

  // ── (2) Verrottete Ignore-Einträge ────────────────────────────────────────
  //
  // HYSTERESE (Linse 2, 28.7.2026). Die Verrottungs-Prüfung war «n < SCHWELLE ⇒
  // rot». Damit lag jeder Ignore-Eintrag, dessen Häufigkeit GENAU auf der
  // Schwelle sitzt, einen einzigen Snapshot vom grundlosen Rot entfernt: 'OG'
  // und 'VO' standen bei exakt 20 (Messung 28.7.2026). Ein einziger neu
  // aufgenommener oder ausgetauschter Entscheid — fachlich völlig folgenlos —
  // hätte das Tor rot gemacht und zum Streichen eines Eintrags aufgefordert,
  // dessen Begründung unverändert richtig ist. Ein Tor, das auf Rauschen
  // reagiert, wird abgeschaltet oder weggeklickt; dann fehlt es, wenn es zählt.
  //
  // Rot bleiben darum die beiden SCHARFEN Fälle, in denen der Eintrag
  // nachweislich gegenstandslos ist:
  //   • das Token mappt inzwischen  → die Ausnahme ist überholt, sie verdeckt
  //     jetzt ein echtes Mapping;
  //   • Häufigkeit == 0             → das Token kommt im Korpus GAR NICHT mehr
  //     vor, die Regel kann nie wieder greifen.
  // Der Zwischenbereich 1 … SCHWELLE-1 ist eine WARNUNG: der Eintrag ist unter
  // die Schwelle gerutscht, aber noch belegt. §6.7 bleibt gewahrt — das Tor kann
  // weiterhin scheitern, und zwar genau an den Fällen, an denen Scheitern etwas
  // bedeutet.
  const warnungen: string[] = [];
  for (const token of Object.keys(IGNORE).sort(vergleiche)) {
    const eintrag = IGNORE[token];
    if (normalisiereAbk(token) !== token) {
      fehler.push(
        `IGNORE-Schlüssel '${token}' ist nicht normalisiert (erwartet `
        + `'${normalisiereAbk(token)}') — der Eintrag könnte nie greifen.`,
      );
      continue;
    }
    if (normKeyFuerAbk(token) !== null) {
      fehler.push(
        `IGNORE '${token}' ist überholt: das Token mappt inzwischen auf `
        + `'${normKeyFuerAbk(token)}'. Eintrag streichen. (Grund war: ${eintrag.grund})`,
      );
      continue;
    }
    const n = zahlen.get(token)?.snapshots ?? 0;
    if (n === 0) {
      fehler.push(
        `IGNORE '${token}' ist tote Regel: das Token kommt im Korpus NICHT MEHR vor `
        + `(0 Snapshots). Eintrag streichen. (Grund war: ${eintrag.grund})`,
      );
    } else if (n < SCHWELLE) {
      warnungen.push(
        `IGNORE '${token}': nur noch ${n} Snapshot(s), Schwelle ${SCHWELLE} — der Eintrag `
        + `wird nicht mehr gebraucht, um das Tor grün zu halten. Kandidat zum Streichen `
        + `(kein Fehler: das Token ist weiter belegt). (Grund: ${eintrag.grund})`,
      );
    }
  }

  // ── (3) Abkürzungs-Kollisionen im abgeleiteten Mapping ───────────────────
  if (ABK_KOLLISIONEN.length > 0) {
    fehler.push(
      `${ABK_KOLLISIONEN.length} ABK_KOLLISION(EN): ${ABK_KOLLISIONEN.join(', ')}.\n`
      + '      Dieselbe normalisierte Abkürzung zeigt auf zwei Register-keys; das Mapping\n'
      + '      wird beidseitig verworfen — beide Erlasse verlieren ihre Zitate. Register-\n'
      + '      Einträge entzerren (src/lib/normtext/register.ts).',
    );
  }

  // ── (4) Aliase, die sich nicht auf einen Register-key auflösen ────────────
  // Das generierte Artefakt bindet über die SR-Nummer ans Register. Fällt ein
  // Erlass aus dem Register oder wird seine SR-Nummer doppelt belegt, werden
  // seine Aliase wirkungslos — und ein wirkungsloses Alias verhält sich exakt
  // wie ein nie erzeugtes, also unsichtbar (§6.7). Darum hier laut.
  if (ABK_ALIAS_NOTIZEN.length > 0) {
    fehler.push(
      `${ABK_ALIAS_NOTIZEN.length} Alias/Aliase des Artefakts lösen sich NICHT auf:\n`
      + ABK_ALIAS_NOTIZEN.map((n) => `      ${n}`).join('\n')
      + '\n      → Artefakt und Register sind auseinandergelaufen. Entweder neu ernten\n'
      + '        (npm run gen:abk-aliase -- --datum=$(date +%F)) oder die doppelt belegte\n'
      + '        SR-Nummer im ERLASS_REGISTER entzerren.',
    );
  }

  // ── Literatur-Verwurf, gezählt (§6.7) ─────────────────────────────────────
  let litSpannen = 0; let litNennungen = 0; let litSnapshots = 0;
  for (const snap of snaps) {
    const spannen = literaturSpannen(fliesstextVon(snap));
    if (spannen.length === 0) continue;
    litSnapshots += 1;
    litSpannen += spannen.length;
    for (const ref of extrahiereStatutRefsMitAnzahl(spannen.join('\n'))) litNennungen += ref.anzahl;
  }

  // ── Ausgabe ───────────────────────────────────────────────────────────────
  console.log(`  Snapshots:            ${snapshots}`);
  console.log(
    `  Nennungen gesamt:     ${nGesamt} — gemappt ${gStatutes + gFliess} `
    + `(${prozent(gStatutes + gFliess, nGesamt)})`,
  );
  console.log(
    `    davon statutes:     ${nStatutes} — gemappt ${gStatutes} (${prozent(gStatutes, nStatutes)})`,
  );
  console.log(
    `    davon Fliesstext:   ${nFliess} — gemappt ${gFliess} (${prozent(gFliess, nFliess)})`,
  );
  console.log(
    `  Token:                ${alle.length} — gemappt ${gemappt.length}, `
    + `ausgeschlossen ${ausgeschlossen.length}, ungemappt ${ungemappt.length}`,
  );
  console.log(
    `  Alias-Ebene (Fedlex): ${ABK_ALIASE.length} amtliche DE/FR/IT-Kürzel, `
    + `${ABK_ALIAS_NOTIZEN.length} nicht auflösbar`,
  );
  // Literatur-Kontext-Regel (Gegenprüfung R3): was der Produktpfad VOR der
  // Extraktion aus dem Text nimmt, wird hier gezählt ausgewiesen — sonst wäre der
  // Filter genau der stille Verwerfer, gegen den dieses Tor gebaut ist (§6.7).
  console.log(
    `  Literatur-Kontext-Regel: ${litSpannen} Zitier-Apparat-Spannen in `
    + `${litSnapshots} Snapshots entfernt, darin ${litNennungen} Roh-Nennungen `
    + `(${LITERATUR_MARKER.length} deklarierte Marker) — nicht im Nenner oben.`,
  );
  if (ABK_ALIAS_AUSGESCHLOSSEN.length > 0) {
    // Kein Fehler: die bewusst fortgeführte ABK_AUSSCHLUSS-Lücke, hier nur
    // benannt — eine Lücke, die niemand sieht, lässt sich nicht schliessen (§8).
    console.log(
      `  Alias auf ausgeschlossenen Erlass (bewusste Lücke, kein Fehler): `
      + ABK_ALIAS_AUSGESCHLOSSEN.join(', '),
    );
  }
  if (ERLASS_FASSUNGS_REIHEN.length > 0) {
    // INFORMATIV, kein Rot: SR-Slots mit einer deklarierten Fassungs-Abfolge
    // (Totalrevision). Für diese Kürzel greift die Kollisionsregel NICHT mehr
    // beidseitig — statt zu verwerfen wählt `normKeyFuerAbk` am Entscheiddatum
    // die damals geltende Fassung. Genau darum steht die Liste hier: sie ist
    // die Ausnahmeliste zur strengsten Regel dieses Mappings (§6.7).
    console.log(
      `  FASSUNGS-REIHEN (Kürzel datumsabhängig, keine Kollision): `
      + `${ERLASS_FASSUNGS_REIHEN.length}`,
    );
    for (const z of ERLASS_FASSUNGS_REIHEN) console.log(`    ${z}`);
  }
  // INFORMATIV, kein Rot: Aliase, die der Fliesstext-Extraktor strukturell nie
  // trifft. Im statutes-Pfad bleiben sie wirksam — sichtbar statt still
  // (Begründung bei `unerreichbareAliase`).
  const unerreichbar = unerreichbareAliase();
  console.log(
    `  Alias im FLIESSTEXT-Pfad strukturell unerreichbar (im statutes-Pfad wirksam): `
    + `${unerreichbar.length} von ${ABK_ALIASE.length}`,
  );
  // Kompakt umbrochen statt eine Zeile je Eintrag — die Liste ist Diagnose, kein
  // Befund, und ein Tor, dessen Ausgabe man scrollen muss, wird nicht gelesen.
  for (const zeile of umbreche(
    unerreichbar.map((u) => `${u.abk} (SR ${u.sr}, ${u.sprache})`), 92,
  )) console.log(`    ${zeile}`);
  const proGrund = new Map<UnerreichbarGrund, number>();
  for (const u of unerreichbar) proGrund.set(u.grund, (proGrund.get(u.grund) ?? 0) + 1);
  console.log(
    `    Ursachen: `
    + [...proGrund.entries()].sort((a, b) => b[1] - a[1] || vergleiche(a[0], b[0]))
      .map(([g, n]) => `${g} ${n}`).join(' · '),
  );

  // ── MESSGRENZE: was diesen Formen an Nennungen im Korpus entspricht ──────────
  //
  // EHRLICHE MESSGRENZE, kein Befund (§8): Diese Nennungen fehlen im NENNER der
  // Quote oben. Der Extraktor bildet für sie gar kein Token, sie zählen deshalb
  // weder als gemappt noch als ungemappt — die Quote ist an dieser Stelle nicht
  // schlechter, sondern blind. `Zitate` ist die Fehlmenge (mit dem echten
  // Extraktor gemessen), `roh` die Obergrenze aller Form-Nennungen.
  const { zahlen: unerreichbarKorpus, betroffeneSnapshots } =
    zaehleUnerreichbarImKorpus(unerreichbar, snaps);
  const summeZitate = unerreichbarKorpus.reduce((n, z) => n + z.zitate, 0);
  const summeRoh = unerreichbarKorpus.reduce((n, z) => n + z.roh, 0);
  console.log(
    `  Davon im Korpus belegt: ${unerreichbarKorpus.length} Form(en) in `
    + `${betroffeneSnapshots} Snapshot(s) — ${summeZitate} Artikel-Zitate fehlen dem `
    + `Quoten-Nenner (${summeRoh} Roh-Nennungen gesamt):`,
  );
  for (const z of unerreichbarKorpus) {
    console.log(
      `    ${z.abk.padEnd(14)} Zitate ${String(z.zitate).padStart(4)} · roh `
      + `${String(z.roh).padStart(5)} · ${String(z.snapshots).padStart(4)} Snapshots · ${z.grund}`,
    );
  }
  if (ausgeschlossen.length > 0) {
    console.log(
      '  AUSGESCHLOSSEN (bewusste Lücke, kein Fehler): '
      + ausgeschlossen
        .map((z) => `${z.token} (${z.snapshots})`)
        .join(', '),
    );
  }

  const top = [...ungemappt]
    .sort((a, b) => b.snapshots - a.snapshots || vergleiche(a.token, b.token))
    .slice(0, 20);
  console.log(`  Top-20 ungemappt (Snapshots · statutes/Fliesstext · Ignore-Grund):`);
  for (const z of top) {
    const g = IGNORE[z.token]?.grund ?? '—';
    console.log(
      `    ${z.token.padEnd(10)} ${String(z.snapshots).padStart(4)}  `
      + `${String(z.statutes).padStart(4)}/${String(z.fliesstext).padStart(5)}  ${g}`,
    );
  }

  // KORPUS-KANDIDATEN: ungemappte Token, die nachweislich einen Bundes-Erlass
  // mit SR-Nummer bezeichnen — Nebenprodukt der Messung und die eigentliche
  // Ausbau-Liste für das ERLASS_REGISTER.
  const kandidaten = Object.entries(IGNORE)
    .filter(([, e]) => e.srNummer)
    .map(([token, e]) => ({ token, sr: e.srNummer!, n: zahlen.get(token)?.snapshots ?? 0 }))
    .sort((a, b) => b.n - a.n || vergleiche(a.token, b.token));
  console.log(`  KORPUS-KANDIDATEN (Bund-SR-Erlasse ohne Register-Eintrag): ${kandidaten.length}`);
  for (const k of kandidaten) {
    console.log(`    ${k.token.padEnd(10)} SR ${k.sr.padEnd(10)} ${k.n} Snapshots`);
  }

  if (warnungen.length > 0) {
    console.warn(`\n  WARNUNG (kein Fehler) — ${warnungen.length} Ignore-Eintrag/-Einträge unter der Schwelle:`);
    for (const w of warnungen) console.warn(`    · ${w}`);
  }

  if (fehler.length > 0) {
    console.error(`\ncheck:normkeys ROT — ${fehler.length} Befund(e):`);
    for (const f of fehler) console.error(`  • ${f}`);
    console.error(
      '\nEin ungemapptes Zitat verschwindet lautlos: der Entscheid erscheint beim Artikel\n'
      + 'nie, und die Lücke meldet sonst niemand (§6.7).',
    );
    process.exit(1);
  }

  console.log(
    `check:normkeys OK — ${prozent(gStatutes + gFliess, nGesamt)} der Nennungen gemappt, `
    + `kein ungemapptes Token ab ${SCHWELLE} Snapshots ausserhalb der `
    + `${Object.keys(IGNORE).length} deklarierten Ignore-Einträge.`,
  );
}

main();
