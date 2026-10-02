/**
 * Fedlex-Extraktor — <dl>-Aufzählungen (lit./Ziff.-Items, Marken, Trenner, Tiefe). Split aus
 * `extrahiere-fedlex.ts`, W2·27-BUND-FERTIG PR 0, 2.10.2026. Code und Kommentare unverändert
 * verschoben.
 */
import { dekodiereEntities } from '../html-entities.ts';
import { entferneTags } from './text.ts';
import { findeDlEnde, findeDdEnde } from './enden.ts';
import type { ArtikelText } from './typen.ts';

/**
 * Fortsetzungs-Tiefe (Befund 6, 26.7.2026): Items, die an einen Bild-Block
 * angehängt werden, setzen eine vom Formelbild unterbrochene Unterliste fort,
 * wenn ihre führenden Marken die Ziffern-Sequenz der Unterliste DIREKT
 * weiterzählen. Dann erben genau diese führenden Items die Tiefe des letzten
 * Items der unterbrochenen Liste. Deterministisch und eng begrenzt (§1/§2):
 * nur reine Ziffern-Marken, nur der unmittelbare Nachfolger (n → n+1), Abbruch
 * an der ersten Nicht-Nachfolger-Marke oder an bereits struktur-vertiefter
 * Position. Amtlicher Beleg: DBG SR 642.11 Art. 22 (PDF 1.1.2026 S. 17) und
 * STHG SR 642.14 Art. 7 (PDF 1.1.2025 S. 6/7) — Fortsetzungs-«2.» steht auf
 * der Ziffern-Einrückung, nicht auf der lit.-Ebene.
 */
export function ergaenzeFortsetzungsTiefe(
  bloecke: ArtikelText['bloecke'],
  items: Array<{ marke: string; text: string; tiefe?: number }>,
): void {
  // Die unterbrochene Liste = nächstvorheriger Block mit items.
  let vorItems: Array<{ marke: string; tiefe?: number }> | undefined;
  for (let k = bloecke.length - 1; k >= 0; k--) {
    const its = bloecke[k].items;
    if (its != null && its.length > 0) { vorItems = its; break; }
  }
  if (vorItems == null) return;
  const letztes = vorItems[vorItems.length - 1];
  if (letztes.tiefe == null || letztes.tiefe <= 0 || !/^\d+$/.test(letztes.marke)) return;
  let vorNr = parseInt(letztes.marke, 10);
  for (const it of items) {
    if (it.tiefe != null || !/^\d+$/.test(it.marke) || parseInt(it.marke, 10) !== vorNr + 1) break;
    it.tiefe = letztes.tiefe;
    vorNr += 1;
  }
}

/**
 * Zerlegt eine Fedlex-<dl>-Aufzählung in lit./Ziff.-Items — REKURSIV über
 * verschachtelte <dl> (lit.-Buchstabe → nummerierte Unterpunkte).
 *
 * Reale Struktur (SPIKE 16.6.2026, OR art_336/art_77):
 *   <dl><dt>a. </dt><dd>…Text;</dd><dt>b. </dt><dd>…</dd>…</dl>
 * Verschachtelt (MStG art_42, KVV art_30, MWSTV 126/127):
 *   <dl><dt>a. </dt><dd>Einleitung:<dl><dt>1. </dt><dd>…</dd>…</dl></dd>…</dl>
 * Die <dt>-Marke ist «a. », «1. » o.ä.; einzelne <dt> tragen einen
 * Fussnoten-<sup><a>…</a></sup> (z.B. «e.<sup><a>199</a></sup> »).
 *
 * marke = Buchstabe/Ziffer OHNE Punkt und ohne Fussnote ('a','b','17').
 * text  = bereinigter <dd>-Inhalt (Fussnoten-<sup> entfernt, Entities dekodiert);
 *         bei verschachteltem <dl> nur der Einleitungstext VOR der Unterliste.
 *
 * AUSGABE-MODELL (flach, abwärtskompatibel): Unterpunkte werden als weitere
 * Items NACH ihrem Eltern-Item in DOKUMENTREIHENFOLGE angehängt. Jedes Item
 * trägt eine EXPLIZITE `tiefe` (0 = direkte Liste des Absatzes, +1 je
 * verschachtelter <dl>). Damit muss die Lesesicht (ArtikelBody) die
 * Verschachtelung NICHT mehr aus den Marken-Typen RATEN — das Raten erzeugte
 * falsche Zitate, wenn Fedlex die übliche Reihenfolge umkehrt (Ziff. → lit.
 * statt lit. → Ziff.): die geratene Stufe entnestete die lit. fälschlich auf
 * Absatzebene und die Fundstelle wurde falsch (§1-Bug G8, M6 28.6.2026).
 *
 * `tiefe` wird NUR emittiert, wenn > 0 (verschachtelt). Top-Level-Items
 * (tiefe 0) bleiben byte-gleich zum bisherigen Modell {marke,text} → keine
 * unnötige Snapshot-Re-Segnung für nicht verschachtelte Erlasse; nur Artikel
 * MIT echter Verschachtelung brechen den Daten-Index (bewusst, §7).
 *
 * ── `trenner`: DER AMTLICHE MARKEN-TRENNER WIRD MITGEFÜHRT (#679, 12.9.2026) ──
 * Fedlex legt ZWEI verschiedene Dinge in dieselbe <dl><dt>-Struktur und
 * unterscheidet sie AM TRENNER hinter der Marke:
 *   «a. » / «1. » / «a) »  → Ordinalmarke einer echten Aufzählung (lit./Ziff.)
 *   «A: » / «BE: »         → LABEL (amtliche Kategorie, Kolonnen-/Legendenschlüssel)
 *   «BAS »                 → Label OHNE Trenner (Formelgrösse, AsylV 2 Art. 23)
 * Dieser Trenner ist amtliche Information; bis hierher verwarf ihn der Parser
 * (er diente nur intern zur Label-Erkennung) und die Lesesicht musste die Art
 * aus der Marken-SCHREIBWEISE raten («beginnt gross ⇒ Label»,
 * ArtikelBody.helfer.ts). Das Raten ist bei kleingeschriebenen Labels falsch
 * («für Witwen und Witwer:», UVG Art. 31) und erfindet bei «a)»/«BAS» einen
 * Punkt, den die amtliche Fassung nicht setzt. Wurzel (§5/§1): der Extraktor
 * führt den Trenner mit, Anzeige UND Zitat lesen ihn statt zu raten.
 *
 * Emittiert wird `trenner` NUR, wenn das Item NICHT der Normalfall
 * «kanonische Ordinalmarke + Punkt» ist (37 403 der 44 674 <dt> im gepinnten
 * Cache) — genau wie `tiefe` nur bei echter Verschachtelung erscheint. Damit
 * bleibt jedes bisher korrekte Item byte-gleich und nur die Artikel mit
 * abweichendem Trenner brechen den Daten-Index (bewusst, §7).
 * Werte: ':' (Label), ')' (Ordinalmarke mit Klammer), '.' (Punkt bei
 * NICHT-kanonischer Marke, z.B. «B. 1.» GFK Art. 1), '' (kein Trenner).
 */
export function parseDefinitionsListe(
  dlInner: string,
  tiefe = 0,
  // M13-Annex: nur im Anhang-Pfad die erweiterte Marken-Erkennung (mehrteilige
  // gepunktete Ziffern «1.1.1», beschreibende Legenden-Schlüssel). Der Haupttext-
  // /Schlusstitel-Pfad bleibt BYTE-GLEICH (default false) — die Anhang-Korrektur
  // re-segnet bewusst KEINE bestehenden Artikel-Snapshots (§6/§1; die identische
  // Garbling-Klasse im Haupttext — Staatsverträge i→ii, Abkürzungs-Legenden — ist
  // ein eigener, deklarierter Folgeschritt mit Artikel-Re-Bless).
  anhang = false,
  // Nur Anhang: Texte der hier an ihr Item gehängten Fortsetzungszeilen (→ ohneFortsetzungen).
  absorbiert?: string[],
): Array<{ marke: string; text: string; tiefe?: number; trenner?: string }> {
  const items: Array<{ marke: string; text: string; tiefe?: number; trenner?: string }> = [];
  // Iterativer Scan über die direkten <dt>…<dd>-Paare DIESER Ebene. Ein <dd>
  // kann eine verschachtelte <dl> enthalten; deren Ende wird balanciert bestimmt
  // (findeDlEnde), damit das <dd>-Ende nicht am inneren </dl> falsch erkannt wird.
  const dtRe = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>/gi;
  // Befund 6 (26.7.2026): Fedlex setzt bei bild-unterbrochenen Aufzählungen die
  // Fortsetzungs-Unterliste als ANONYME <dl> DIREKT in die <dl> («<dl><dl><dt>2.…»,
  // DBG art_22/STHG art_7 nach dem ersten Formelbild). Der reine dt/dd-Scan
  // flachte sie ab (Ziff. landete auf lit.-Ebene, amtliche Einrückung verloren —
  // PDF-Beleg: Ziffern-x-Position, nicht lit-x). Darum: liegt VOR dem nächsten
  // <dt> eine direkte Unter-<dl>, wird sie rekursiv eine Stufe tiefer zerlegt.
  const dlRe = /<dl\b[^>]*>/gi;
  let pos = 0;
  // Nur Anhang: Vorgänger = markiertes Item OHNE Unterliste. Hinter einem Item MIT Unterliste
  // mehrdeutig (FIDLEV Anh. 2 «Nicht zum Handel zugelassene Basiswerte:» ≠ lit. e) → Notiz.
  let hostOffen = false;
  while (pos < dlInner.length) {
    dtRe.lastIndex = pos;
    const m = dtRe.exec(dlInner);
    dlRe.lastIndex = pos;
    const d = dlRe.exec(dlInner);
    if (d && (m == null || d.index < m.index)) {
      // Anonyme direkte Unter-<dl> (nicht in einem <dd> — die konsumiert der
      // dt/dd-Zweig unten mitsamt seinem <dd>): rekursiv, eine Stufe tiefer.
      const anonEnde = findeDlEnde(dlInner, d.index);
      const anonInner = dlInner.slice(d.index + d[0].length, anonEnde - '</dl>'.length);
      for (const sub of parseDefinitionsListe(anonInner, tiefe + 1, anhang, absorbiert)) items.push(sub);
      hostOffen = false;
      pos = anonEnde;
      continue;
    }
    if (m == null) break;
    const ddStart = dtRe.lastIndex; // direkt nach dem <dd…>-Öffnungs-Tag
    // ── Ende dieses <dd> finden (balanciert über <dd>/</dd>) ──────────────
    const ddEnde = findeDdEnde(dlInner, ddStart);
    const ddRoh = dlInner.slice(ddStart, ddEnde);
    pos = ddEnde + '</dd>'.length; // hinter dieses </dd> springen

    // Verschachtelte <dl> in DIESEM <dd> abtrennen: Einleitungstext = vor der
    // Unterliste; die Unterliste wird rekursiv zerlegt und NACH dem Eltern-Item
    // eingehängt.
    const subDlIdx = ddRoh.search(/<dl\b[^>]*>/i);

    // Fussnoten-<sup><a>…</a></sup> aus der <dt>-Marke tilgen.
    const dtOhneFn = m[1].replace(/<sup[^>]*><a[\s\S]*?<\/a><\/sup>/gi, '');
    // Marke-Tags OHNE Leerzeichen strippen: das lat. Suffix steht als <sup>bis</sup>
    // direkt am Buchstaben («c<sup>bis</sup>»); entferneTags würde es zu «c bis»
    // trennen und die Regex unten verstümmelte es zu «c» (Bug-Audit 19.6.2026).
    // Innen-Leerraum normalisieren wie in entferneTags: Fedlex trennt mehrteilige
    // Marken mit zwei &nbsp; («B.&nbsp;&nbsp;1.», GFK Art. 1) — als Marke ist das
    // EIN Abstand, sonst trüge der Snapshot einen Doppelabstand im Zitat.
    const markeRoh = dekodiereEntities(dtOhneFn.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
    // ── Die Marke wird GELESEN, nicht nachnummeriert ─────────────────────────
    // «a.» / «17.» / «a)» → nackte Marke ohne Punkt/Klammer.
    // Bug-Audit 19.6.2026: lat. Suffix bis/ter/quater/quinquies erhalten (sonst
    // «cbis»→«c», «1bis»→«1b»). Suffix VOR optionalem Buchstaben (wie ABS-Regex).
    //
    // BEFUND QS-KORPUS 4.9.2026 (§1, Diskrepanz-Finder PR #650): Beide früheren
    // Regexe griffen als PRÄFIX-Match. Was nicht ins kanonische lit./Ziff.-Muster
    // passte, wurde damit auf dessen ERSTES Token GEKÜRZT statt gelesen — aus dem
    // amtlichen «BE:» wurde «b», aus «C1E:» «c», aus «ii)» «i», aus «asexies.»
    // «a», aus «BAS» «b». Zwei Folgen, beide fachlich falsch: die amtliche
    // Bezeichnung war weg (VZV Art. 3 zitiert «Kategorie BE», nicht «lit. b»),
    // und die gekürzten Marken kollidierten INNERHALB desselben Absatzes
    // (VZV Art. 3 Abs. 1: a,b,c,d,b,c,d — «B» und «BE» beide als «b»).
    //
    // Neue Regel, eine für beide Pfade:
    //  (1) Endet die <dt>-Marke auf ':', ist sie ein LABEL (amtliche Kategorie,
    //      Kolonnen-/Legenden-Schlüssel) — verbatim übernehmen, Grossschreibung
    //      erhalten. Empirisch (gepinnter Cache, 229 Bund-HTMLs, art_*-Körper):
    //      51 Vorkommen in genau 3 Erlassen — VZV (Ausweiskategorien A…D1E),
    //      VBB (B/F/G/V/W, «Kolonne 1»), UVG («für Witwen und Witwer») — und
    //      KEINE davon ist eine gewöhnliche lit.-Aufzählung. Fedlex trennt
    //      Ordinalmarken mit '.'/')' und Labels mit ':'.
    //  (2) Sonst nur dann normalisieren (klein schreiben), wenn die GANZE Marke
    //      — ohne den nachgestellten Trenner — eine kanonische Ordinalmarke ist.
    //      Trifft das nicht zu, bleibt die Marke verbatim stehen. Damit ist jede
    //      bisher korrekte Marke byte-gleich und keine wird mehr erfunden (§1/§6).
    // Die lat. Suffixe reichen bis `decies`: «asexies.»/«anovies.» (HMG Art. 9,
    // FINMA-GebV) wurden zuvor auf «a» gekürzt.
    // Der Anhang-Pfad behält seine mehrteiligen Ziffern «1.1.1»/«211.1»
    // (M13-Annex) — sie sind hier Teil des kanonischen Musters.
    const LAT_SUFFIX = 'bis|ter|quater|quinquies|sexies|septies|octies|novies|decies';
    const KANONISCHE_MARKE = anhang
      ? new RegExp(`^(?:[0-9]+(?:\\.[0-9]+)*(?:${LAT_SUFFIX})?[a-z]?|[a-z](?:${LAT_SUFFIX})?)$`, 'i')
      : new RegExp(`^(?:[0-9]+(?:${LAT_SUFFIX})?[a-z]?|[a-z](?:${LAT_SUFFIX})?)$`, 'i');
    // AMTLICHER TRENNER (#679, s. Funktions-Doku §`trenner`): das letzte Zeichen
    // der normalisierten <dt>-Marke, wenn es ein Fedlex-Marken-Trenner ist —
    // sonst '' (kein Trenner, z.B. «BAS»). markeRoh ist bereits getrimmt; das
    // `\s*$` deckt nur den theoretischen Rest ab. Die Label-Erkennung liest
    // jetzt DIESEN Wert (eine Stelle, §5) statt eine zweite Regex.
    const trenner = markeRoh.match(/([.):])\s*$/)?.[1] ?? '';
    const istLabel = trenner === ':';
    // Nachgestellten Trenner abstreifen — beim Label nur den ':' (der Rest ist
    // Bestandteil des Labels: «Kolonne 1»), sonst die Ordinal-Trenner.
    const markeKern = (
      istLabel ? markeRoh.replace(/\s*:\s*$/, '').trim() : markeRoh.replace(/[\s.)]+$/, '')
    )
      // EINE Schreibweise je Marke (§5): das lat. Suffix steht im Korpus als
      // «cbis» (Fedlex setzt «c<sup>bis</sup>»); BankG Art. 3 schreibt dieselbe
      // Marke als «c.<sup>bis</sup>» → «c.bis». Der Trennpunkt wird darum
      // eingezogen, sonst fände ein Zitat «lit. cbis» seine Fundstelle nicht.
      .replace(new RegExp(`^([a-z])\\.(${LAT_SUFFIX})$`, 'i'), '$1$2');
    const istKanonisch = !istLabel && KANONISCHE_MARKE.test(markeKern);
    let marke = istKanonisch ? markeKern.toLowerCase() : markeKern;
    // Emittiert wird der Trenner nur ABWEICHEND vom Normalfall «kanonische
    // Ordinalmarke + Punkt» — s. Funktions-Doku (§6/§7: bisher korrekte Items
    // bleiben byte-gleich). `undefined` = Normalfall, Feld fehlt im Snapshot.
    let trennerFeld: string | undefined =
      istKanonisch && trenner === '.' ? undefined : trenner;

    const ddVorListe = subDlIdx >= 0 ? ddRoh.slice(0, subDlIdx) : ddRoh;
    const ddOhneFn = ddVorListe.replace(/<sup[^>]*><a[\s\S]*?<\/a><\/sup>/gi, '');
    let text = entferneTags(ddOhneFn);

    // <dt>-EINGEBETTETER Text + LEERES <dd> (Fedlex-Sonderform, z.B. ZPO art_250
    // Ziff. 15, einige VStrR/StG/BV-Punkte): hier steht der Punkttext IM <dt>
    // hinter der Marke («<dt>15.<sup>fn</sup> Anordnung …</dt><dd></dd>») statt im
    // <dd>. Ohne Fallback ginge dieser Punkt stumm verloren (§1/§8). NUR greifen,
    // wenn das <dd> wirklich leer ist UND keine Unterliste vorliegt — sonst bleibt
    // alles byte-gleich (§6). Der Resttext nach der Marke wird tag-/fussnoten-
    // bereinigt übernommen.
    // Hier — und NUR hier — ist die Marke ein PRÄFIX des <dt> statt sein ganzer
    // Inhalt. Die Aufteilung greift deshalb nur bei leerem <dd> ohne Unterliste
    // UND nur, wenn das <dt> die Form «kanonische Marke + optionaler Trenner +
    // LEERRAUM + Text» hat. Ohne die Leerraum-Bedingung zerschnitte sie auch
    // marken-lose Legenden-Schlüssel («BAS» → «b» + «AS», ASYLV 2) — genau die
    // Kürzung, die oben abgestellt wurde (§1). Sie greift auch bei einem
    // Label-<dt> («4.3.1&nbsp;&nbsp;Name(n) des (der) Kläger(s):», LugÜ
    // Anhang V/VI): dort ist der Doppelpunkt Teil des Punkt-TEXTES, nicht
    // Marken-Trenner — ohne diesen Zweig verlöre der Anhang die Punkte stumm.
    if (!text && subDlIdx < 0 && !istKanonisch) {
      const KANON_QUELLE = anhang
        ? `[0-9]+(?:\\.[0-9]+)*(?:${LAT_SUFFIX})?[a-z]?|[a-z](?:${LAT_SUFFIX})?`
        : `[0-9]+(?:${LAT_SUFFIX})?[a-z]?|[a-z](?:${LAT_SUFFIX})?`;
      // Gruppe 2 = der Trenner DIESES Präfixes (#679). Hier ist die Marke ein
      // Präfix des <dt>, der Trenner steht also mitten im <dt>-Text und nicht
      // an seinem Ende — `trenner` von oben (Zeilen-Ende) wäre hier falsch.
      const praefix = markeRoh.match(new RegExp(`^(${KANON_QUELLE})\\s*([.)])?\\s+(?=\\S)`, 'i'));
      if (praefix) {
        // entferneTags: identische Bereinigung wie zuvor inline, aber inkl. N1-Fix
        // (Inline-Tags leerzeichenlos) — «14<i>a</i>» im <dt>-Text bleibt «14a».
        const dtTextRoh = entferneTags(dtOhneFn);
        const nachMarke = dtTextRoh
          .replace(new RegExp(`^(?:${KANON_QUELLE})\\s*[.)]?\\s*`, 'i'), '')
          .trim();
        if (nachMarke) {
          marke = praefix[1].toLowerCase();
          text = nachMarke;
          // Die Marke IST hier kanonisch (KANON_QUELLE) → Punkt = Normalfall
          // (Feld fehlt, byte-gleich); ')' oder kein Trenner wird emittiert.
          const pTrenner = praefix[2] ?? '';
          trennerFeld = pTrenner === '.' ? undefined : pTrenner;
        }
      }
    }

    // LEERES <dt> + Text-<dd> = Fortsetzungszeile des vorausgehenden Items
    // (Fedlex-Sonderform «<dt>a.</dt><dd>Label:</dd><dt></dt><dd>Beschreibung</dd>»,
    // z.B. SSV art_24: Signal-Namen im ersten <dd>, die verbindliche Beschreibung
    // im markenlosen Folge-<dd>). Ohne dies ging die Beschreibung stumm verloren,
    // weil ein markenloses Item unten verworfen wird (§1, Text-Adjazenz). An den
    // Text des letzten Items DIESER Ebene anhängen (Dokumentreihenfolge).
    // Anhang (W2·27, GP-Befund «Beilage» 30.9.2026): gleiche Regel, sonst steht die Zeile
    // lose VOR der Liste (VZV-Kat. B ohne Anhänger-Kombinationen); `absorbiert` →
    // markeloseNotizen-Abzug, keine Dublette. Strenger (hostOffen); Haupttext byte-gleich.
    // Nur bei vorhandenem Vorgänger-Item anhängen: ein FÜHRENDES markenloses <dd> (ohne Vorgänger) tritt im Haupttext
    // empirisch nicht auf (alle Haupt-Artikel-<dl> der betroffenen Erlasse starten
    // lettered/nummeriert; Fedlex-Chapeaus stehen als eigenes <p> vor der <dl>).
    // §6: greift nur bei zuvor VERLORENEM Text — additiv, keine Marke fabriziert.
    if (!marke && text && subDlIdx < 0 && (anhang ? hostOffen : items.length > 0)) {
      const vorheriges = items[items.length - 1];
      vorheriges.text = vorheriges.text ? `${vorheriges.text} ${text}` : text;
      absorbiert?.push(text);
    } else if (marke && (text || subDlIdx >= 0)) {
      // Eltern-Item: auch ohne eigenen Text aufnehmen, WENN eine Unterliste folgt
      // (sonst ginge die lit-Ebene verloren — der eigentliche Bug). Andernfalls
      // wie bisher nur bei Text (leere Items werden verworfen).
      // tiefe NUR setzen, wenn verschachtelt (>0) → Top-Level byte-gleich (§7).
      // trenner NUR bei Abweichung vom Normalfall (#679) — Schlüssel-REIHENFOLGE
      // marke,text,tiefe,trenner ist Teil der Byte-Gleichheit (JSON-Serialisierung).
      items.push({
        marke,
        text,
        ...(tiefe > 0 ? { tiefe } : {}),
        ...(trennerFeld !== undefined ? { trenner: trennerFeld } : {}),
      });
      hostOffen = subDlIdx < 0;
    } else if (marke || text || subDlIdx >= 0) {
      // Leeres Paar (VZV Anh. 4 Ziff. 5.4) ändert nichts; sonst Kette unterbrochen.
      hostOffen = false;
    }

    // Unterliste rekursiv anhängen (in Dokumentreihenfolge nach dem Eltern-Item),
    // eine Stufe tiefer — die Stufe wird explizit geführt, nicht geraten.
    if (subDlIdx >= 0) {
      const subEnde = findeDlEnde(ddRoh, subDlIdx);
      const subOpenLen = ddRoh.slice(subDlIdx).match(/^<dl\b[^>]*>/i)![0].length;
      const subInner = ddRoh.slice(subDlIdx + subOpenLen, subEnde - '</dl>'.length);
      for (const sub of parseDefinitionsListe(subInner, tiefe + 1, anhang, absorbiert)) items.push(sub);
    }
  }
  return items;
}
