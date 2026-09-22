// ═══ W2·19-GLIEDERUNG · S5 — F2: Auto-Zuklappen der Gliederung ═══════════════
//
// Bau-Spec: fahrplaene/FAHRPLAN-W2-19-SEITENLEISTE.md §3.6, §9-S5.
//
// WAS DIESES MODUL ENTSCHEIDET. Welche automatisch geöffneten Äste des
// Gliederungsbaums beim Weiterlesen wieder zugehen dürfen — und wie viel
// Scroll-Höhe dabei OBERHALB des Sichtbands verschwindet, also um wie viel
// `scrollTop` gegenzuhalten hat, damit die sichtbaren Zeilen stillstehen.
// Reine Messung + Entscheidung, kein State, kein React: das macht die Regel
// prüfbar und hält `inhalt-hooks.tsx` unter der §6.6-Schwelle.
//
// ── WAS VORHER GALT UND WARUM ES KEIN VERSEHEN WAR ───────────────────────────
// Der bisherige Wächter liess einen Ast nur zuklappen, wenn er GANZ UNTERHALB
// des Sichtbandes lag (`r.top >= contRect.bottom`). Er stammt aus der
// A9-CLS-Forensik vom 19.7.2026 (BEFUND 3) und war die richtige Antwort auf
// einen echten, gemessenen Schaden: kollabiert ein Ast OBERHALB der sichtbaren
// Zeilen, rückt der gesamte sichtbare Inhalt darunter nach oben — auf dem
// 2-vCPU-Runner riss genau das das CLS-Budget (gemeldetes `li` 248×195→0×0 als
// Kind eines solchen Oberhalb-Astes). Die damalige Lösung war bewusst
// konservativ: lieber gar nicht zuklappen als sichtbar springen.
//
// ── WAS SIE GEKOSTET HAT ─────────────────────────────────────────────────────
// Beim Vorwärtslesen liegen die verlassenen Äste IMMER oberhalb. Die Bedingung
// konnte also praktisch nie zutreffen — gemessen (Perf-Diagnose 8.8.2026, U4):
// NULL Zuklapp-Ereignisse in jedem Lauf, der Baum wuchs monoton von 18 auf 140
// sichtbare Zeilen (+330 % Höhe). Daraus folgte U5, Davids «sie springt
// komisch»: der wachsende Baum schob den aktiven Eintrag aus dem Sichtband, der
// Mitscroll-Nudge musste immer weiter nachfassen (Sprung-Sätze 777 px Median,
// bis 8 524 px). Der Wächter hat also nicht ein Problem gelöst, sondern zwei
// gegeneinander getauscht.
//
// ── WAS JETZT GILT ───────────────────────────────────────────────────────────
// Zugeklappt wird richtungsunabhängig — ober- UND unterhalb —, aber nie ein
// Ast, der das Sichtband BERÜHRT:
//   · UNTERHALB: sein Kollaps bewegt ausschliesslich off-screen-Inhalt. Nichts
//     zu kompensieren (Verhalten wie bisher).
//   · OBERHALB: der Kollaps zieht den sichtbaren Inhalt nach oben. Genau um
//     diese Höhe nimmt der Aufrufer `scrollTop` im SELBEN Frame vor dem Paint
//     zurück — die sichtbaren Zeilen stehen dann still.
//   · IM BAND: bleibt offen. Hier gäbe es nichts zu kompensieren, weil der Ast
//     SELBST sichtbar ist und sein Verschwinden ein echter Sprung wäre (§15.2).
//     Für diesen Fall behält der 19.7.-Wächter recht und bleibt in Kraft.
//
// ── FALLBACK, DEKLARIERT (Spec §3.6) ─────────────────────────────────────────
// Geht die Kompensation auf dem gedrosselten Runner reproduzierbar nicht auf,
// wird NICHT an ihr nachjustiert, sondern die Oberhalb-Richtung wieder
// abgeschaltet (`F2_OBERHALB = false`, eine Zeile) — dann gilt exakt der
// 19.7.-Zustand. Nie ein springender Baum.
//
// ── NACHTRAG 9.8.2026: DIE ANDERE RICHTUNG (AUFklappen) ──────────────────────
// Dieses Modul heisst nach dem Zuklappen, führt seit Davids Entscheid (a) vom
// 9.8.2026 aber die Regel für BEIDE Richtungen — «wann darf sich das Akkordeon
// von selbst bewegen» ist EINE Frage, und zwei Häuser für eine Frage sind ein
// §5-Duplikat. Die Zuklapp-Regel selbst bleibt davon unberührt (s. u.).

/**
 * Nachlauf-Fenster in Pfadwechseln: ein automatisch geöffneter Zweig bleibt so
 * lange offen, bis die Leseposition ihn um so viele distinkte Pfadwechsel hinter
 * sich gelassen hat. Verhindert das sichtbare Auf-/Zuklappen beim Hin-und-Her
 * (PageUp nach PageDown).
 *
 * GEMESSEN und bei 6 BELASSEN (die Bau-Spec §3.6 nennt ebenfalls 6). Das
 * Perf-Dossier schlug 6→2–3 vor, um den Baum auf ~39 Zeilen zu drücken. Am
 * gebauten Stand nachgemessen (OR, 4× CPU-Drossel, 60 × 1200 px Dokument-Scroll,
 * 1440×900; «Zeilen» = wirklich gerenderte `li`, seit dem Unmount deckungsgleich
 * mit dem, was der Nutzer sieht):
 *   Nachlauf 6 → max 96 … 110 Zeilen (4 Läufe)
 *   Nachlauf 3 → max 73 …  81 Zeilen (2 Läufe)
 * Der schnellere Nachlauf kauft also rund 25 Zeilen. Er kauft sie NICHT billiger:
 * der CLS-Anteil im [data-toc] streut in dieser Messreihe über ALLE geprüften
 * Varianten zwischen 0.060 und 0.27 — auch beim Vorzustand ohne jedes Zuklappen
 * (1bbb00e26) lag ein Lauf bei 0.060. Die Streuung ist damit so gross wie der
 * Unterschied, den sie zeigen soll; §0-3: dann IST die Messung das Ergebnis und
 * nicht das Feature. Ohne belegten Vorteil bleibt der Spec-Wert stehen, statt
 * einen Alt-Entscheid auf ein Rauschen hin zu kippen.
 * Der Dossier-Zielwert ~39 war eine Projektion, keine Messung, und wird von
 * keiner der beiden Einstellungen erreicht — das gehört so gesagt (§8). Das
 * eigentliche Ziel ist trotzdem erfüllt: statt monoton auf 140+ zu wachsen
 * (U4: NULL Zuklapp-Ereignisse je Lauf), bleibt der Baum beschränkt, und die
 * DOM-Last im Baum fällt von 20 389 auf ~1 300–1 500 Knoten.
 *
 * NACHTRAG 13.8.2026 (W2·18-FEHLERBUCH, §9-Bug-Check F4): Die Zahlen oben sind
 * VOR der Artikel-Ebene gemessen und bleiben als Provenienz stehen. Seither
 * kann ein aufgeklappter Ast zusätzlich seine Artikel-Zeilen tragen. Korpusweit
 * nachgemessen (alle 1458 Snapshots, 11 294 Knoten mit Artikel-Kindern):
 * Median 3 · p90 8 · Maximum 49 Artikel-Zeilen je Träger-Knoten. Ein
 * Zuklapp-Ereignis hängt damit im Regelfall eine Handvoll Zeilen mehr aus als
 * 2026-08; die Grössenordnung der Messreihe oben ändert sich nicht, der
 * Ausreisser-Fall (49) ist die neue Obergrenze für die Kompensations-Rechnung.
 */
export const AUTO_ZU_NACHLAUF = 6;

/**
 * Ruhefenster des Auto-AUFklapps in Millisekunden (Entscheid David 9.8.2026,
 * Punkt (a)): der spy-getriebene Aufklapp des aktiven Zweigs feuert erst, wenn
 * seit dem letzten Scroll-Ereignis des Dokuments so lange nichts mehr passiert
 * ist. Er bewegt den Baum damit NICHT mehr mitten im Scrollen.
 *
 * WARUM DAS DEN ZIELKONFLIKT AN DER WURZEL LÖST. Der Aufklapp reisst beim ersten
 * Artikelwechsel den ganzen Aktiv-Pfad in EINEM Commit auf (~21 Zeilen, ~780 px)
 * — und zwar INNERHALB des Sichtbands des `[data-toc]`-Scrollers, weshalb kein
 * Scroll-Ausgleich hilft (anders als beim Zuklappen oberhalb, s. o.). Damit
 * stand Auftrag K (David 26.6.2026, «Zweig automatisch aufklappen») gegen den
 * a33-Kontrakt «Lese-Scroll = CLS 0»: der Shift trat in 8/8 Sonden-Läufen auf
 * (bitgleich 0.0504), und ob er als unerwartet ZÄHLTE, entschied allein
 * Chromiums 500-ms-`hadRecentInput`-Fenster — daher die 2–4/20-Flake-Rate, die
 * die Nullprobe gegen main als ÄLTER als W2·19 ausgewiesen hat (Dossier
 * bibliothek/betrieb/a33-lesescroll-cls-altflake-2026-08-09.md).
 * Wartet der Aufklapp auf Scroll-Ruhe, entsteht das Wachstum nicht mehr während
 * des Scrollens: es gibt keinen Shift mehr, den ein Zeitfenster zufällig
 * verwerfen oder zählen könnte. Der Konflikt ist damit aufgelöst, nicht
 * abgemildert — und zwar über das VERHALTEN, wie es die Diagnose als einzigen
 * Weg benannt hatte.
 *
 * WERT 200 ms: David hat 150–300 ms vorgegeben. 200 ist der Wert, den der
 * (a)-Block ohnehin schon als Trailing-Entprellung trägt (F3, 16.7.2026) — eine
 * zweite, abweichende Zahl daneben wäre eine Quelle mehr, die driften kann.
 *
 * WAS SICH NICHT ÄNDERT: das Auto-ZUklappen (F2/S5, oben) — weder seine Regel
 * noch sein Takt. Der Nachlauf-Tick (`AUTO_ZU_NACHLAUF`) wird beim Warten auf
 * Ruhe ausdrücklich NICHT weitergezählt, sonst alterten die Äste im Leerlauf und
 * das Zuklappen käme früher als bisher.
 */
export const AUTO_AUF_RUHE_MS = 200;

/**
 * Ruht der Dokument-Scroll? Rein und zeitfrei (§2): der Aufrufer reicht beide
 * Zeitpunkte herein, damit die Regel ohne Uhr prüfbar ist. `letzterScrollMs = 0`
 * heisst «seit dem Aufsetzen des Beobachters kein Scroll» und gilt als Ruhe —
 * sonst bliebe der Zweig beim Einstieg über einen Deep-Link ewig zu.
 */
export function scrollRuht(letzterScrollMs: number, jetztMs: number): boolean {
  return letzterScrollMs === 0 || jetztMs - letzterScrollMs >= AUTO_AUF_RUHE_MS;
}

/**
 * Fallback-Schalter (s. o.): `false` stellt exakt den 19.7.-Zustand her — es
 * klappen nur noch Äste GANZ UNTERHALB des Sichtbands zu.
 *
 * STEHT AUF `true`. Der Fallback wurde am 9.8.2026 kurzzeitig GEZOGEN und nach
 * einer Nullprobe wieder gelöst — die Begründung dafür ist lehrreich genug, um
 * sie hier zu behalten:
 *
 *  1. `leser-gliederung-a33` «A9 — Lese-Scroll unter CPU-Drossel» riss im vollen
 *     Vor-Merge-Lauf mit CLS 0.050354 (Budget 0.05); drei sichtbare Baumzeilen
 *     280×43 → 0×0. Isoliert 5/5 grün — der Fall braucht Parallel-Last.
 *  2. Sonde (231 protokollierte Entscheidungen): zum MESSZEITPUNKT lag in allen
 *     acht Geometrie-Urteilen KEINE Kind-Zeile im Band. Die Hypothese «der
 *     Wächter misst nur den Ast-Kopf» war damit widerlegt.
 *  3. `F2_OBERHALB = false` → erst 5/5 grün, dann 2/5 rot mit BIT-IDENTISCHEM
 *     Wert. Also nicht die Ursache; der erste Fünferlauf war Glück.
 *  4. Unmount zurückgebaut → 3/10 rot, gleiche Signatur. Auch nicht die Ursache.
 *  5. NULLPROBE gegen den Stand VOR dieser Slice (1bbb00e26, S4): 1/10 rot —
 *     gleiche drei Zeilen, gleicher Wert 0.06495/0.050354. Der Defekt ist ÄLTER
 *     als das Auto-Zuklappen und hat mit ihm nichts zu tun.
 * Konsequenz: der Schalter bleibt in der gebauten Stellung, weil kein Befund
 * gegen ihn spricht. Die Ursache des a33-Falls ist NICHT gefunden und ist als
 * eigener Befund gemeldet — sie liegt in S4 oder davor (die verschwindenden
 * Zeilen sind laut Herkunfts-Sonde TOP-LEVEL-Knoten sek-275/1052/1680/1782, und
 * die kann kein Ast-Kollaps entfernen).
 *
 * §0-3 in Reinform: vier Hypothesen, jede durch eine Messung widerlegt, und die
 * eine Messung, die alles entschieden hat, war die Nullprobe. Sie hätte am
 * Anfang stehen müssen, nicht am Ende.
 */
export const F2_OBERHALB = true;

/**
 * Sicherheitssaum um das Sichtband, in px (W2·19-GLIEDERUNG/S5, Nachtrag).
 *
 * ANLASS — ein roter a33-Lauf, keine Vermutung. Im vollen Vor-Merge-Lauf (520
 * Fälle parallel, 4× CPU-Drossel) riss «A9 — Lese-Scroll unter CPU-Drossel» mit
 * CLS 0.050354 gegen das Budget 0.05. Das Protokoll nannte drei
 * Gliederungszeilen bei y = 251 / 306 / 360, je 280×43 → 0×0: drei SICHTBARE
 * Zeilen wurden vom Auto-Zuklappen ausgehängt.
 *
 * WAS DIE MESSUNG SAGT (Sonde im gebauten Stand, OR, 4× Drossel, 110
 * Scroll-Schritte, jede Entscheidung protokolliert): 231 Entscheidungen, davon 8
 * mit Geometrie-Urteil — und in ALLEN acht lag zum MESSZEITPUNKT keine einzige
 * Kind-Zeile im Sichtband (`imBand: 0`; Ast-Unterkanten −199 … −876 px gegen eine
 * Bandoberkante von 123 px). Die naheliegende Erklärung «der Wächter misst nur
 * den Ast-Kopf statt der Ausdehnung des Teilbaums» ist damit WIDERLEGT: gemessen
 * wird der Kind-Container, und der spannt den ganzen gerenderten Teilbaum auf.
 *
 * WAS BLEIBT: zwischen Messen und Mutieren kann sich die Geometrie ändern. Der
 * Beschluss entsteht im 200-ms-Timer; die Mutation lief für den Fall «Ast
 * unterhalb» als GEWÖHNLICHES setState — React committet das später, unter Last
 * deutlich später, und inzwischen scrollt der Nutzer weiter und der
 * Mitscroll-Nudge verschiebt den Scroller. Ein Ast, der beim Messen sauber
 * ausserhalb lag, kann beim Aushängen im Band stehen. Darum zwei Änderungen:
 *   1. Beschluss und Mutation liegen jetzt IMMER im selben Frame (`flushSync`,
 *      s. inhalt-hooks) — nicht mehr nur dann, wenn kompensiert wird.
 *   2. Dieser Saum: ein Ast muss um mindestens eine Zeilenhöhe am Band VORBEI
 *      sein, nicht haarscharf daneben. 64 px ≈ 1½ Baumzeilen (gemessen 43 px) —
 *      genug für den Restweg eines Frames unter Drossel, wenig genug, dass das
 *      Zuklappen wirksam bleibt (in derselben Sonde lagen alle acht Fälle
 *      199–876 px daneben, also weit jenseits des Saums).
 * §15/§0-3: der Saum kostet im Zweifel ein paar nicht zugeklappte Äste — die
 * Alternative kostet einen sichtbaren Sprung. Die Richtung gibt die Spec vor
 * («nie ein springender Baum», §3.6).
 */
export const F2_SICHERHEITSSAUM = 64;

// Die Klapp-Karten-Schreiber `klappZeile` und `artikelSchluessel` (samt
// ihrer Herleitung B3 / CI-Rot 13.8.2026) wohnen seit W2·5m-LESER-V3 in
// ./klappKarte — dort, wo auch alle Öffner und Schliesser stehen (§5).
export { klappZeile } from './klappKarte';

/**
 * B8 (W2·19-Bug-Check; WCAG 2.4.3 «Fokus-Reihenfolge»): Rettet den
 * Tastatur-Fokus, BEVOR das Auto-Zuklappen einen Ast aushängt.
 *
 * BEFUND. Seit dem Unmount zugeklappter Äste (S5, F3) existiert ein
 * geschlossener Ast nicht mehr im DOM. Stand der Fokus auf einer Zeile IN
 * diesem Ast — der Normalfall für eine Tastatur-Nutzerin, die sich durch die
 * Gliederung arbeitet und dabei weiterliest —, verlor ihn der Browser
 * ersatzlos an `<body>`. Die nächste Tab-Taste begann wieder am Seitenanfang.
 * Der Zuklapp geschieht ohne Zutun der Nutzerin, sie kann ihm nicht zuvorkommen.
 *
 * WOHIN DER FOKUS WANDERT — korrigiert nach dem §9-Bug-Check 13.8.2026 (F3b).
 * Erste Fassung: auf die Elternzeile des schliessenden Astes. Das war ein
 * Fehler mit Folgewirkung: dieser Ast liegt per Konstruktion mindestens
 * F2_SICHERHEITSSAUM (64 px) AUSSERHALB des Sichtbands — seine Elternzeile ist
 * also praktisch nie sichtbar. `focus()` scrollt ein Element in den sichtbaren
 * Bereich; der Aufrufer liest unmittelbar danach `tocCont.scrollTop` als
 * Ausgangswert seiner Kompensation (inhalt-hooks) und hätte mit einer
 * Geometrie gerechnet, die der Fokus-Sprung gerade verschoben hat.
 * Jetzt: der Fokus geht auf die MARKEN-Zeile (`[data-toc-aktiv]`) — die
 * Leseposition der Nutzerin, per F5 immer genau einmal vorhanden und vom
 * Mitscroll-Nudge im Sichtband gehalten. Sie ist zugleich die sinnvollste
 * Antwort auf «wo bin ich jetzt»: derselbe Ort, den die Leiste ohnehin als
 * Standort ausweist. `preventScroll` allein wäre die schlechtere Wahl gewesen
 * — ein Fokus, den man nicht sieht, verletzt WCAG 2.4.7.
 * Fällt keine Marke an (Deep-Link vor der ersten Spy-Auswertung), bleibt die
 * Elternzeile der Ersatzweg: ein springender Scroller ist immer noch besser
 * als ein verlorener Fokus.
 *
 * WELCHER AST GEWINNT — F3a desselben Bug-Checks. Es wird der ÄUSSERSTE
 * schliessende Ast gesucht, nicht der erste in der Liste. `schliessen` kommt
 * aus einem Set in Einfüge-Reihenfolge; steht dort das Kind vor dem Elternteil
 * (real möglich, weil der Spy Äste in Lesereihenfolge einträgt), landete der
 * Fokus auf einer Zeile, die im SELBEN `flushSync` mit ausgehängt wird — der
 * Fehler, den die Funktion verhindern soll, nur eine Ebene höher.
 *
 * Gibt zurück, ob der Fokus verschoben wurde (für Tests und für den Aufrufer,
 * der sonst nichts weiter zu tun hat).
 */
export function retteFokusVorZuklapp(tocCont: HTMLElement | null, schliessen: string[]): boolean {
  if (!tocCont || schliessen.length === 0) return false;
  const aktiv = tocCont.ownerDocument?.activeElement as HTMLElement | null;
  // Kein Fokus in der Leiste ⇒ nichts zu retten. Insbesondere NICHT blind
  // fokussieren: dem Mausleser den Fokus in die Gliederung zu setzen wäre eine
  // Bewegung, die niemand angefordert hat.
  if (!aktiv || !tocCont.contains(aktiv)) return false;

  // F3a: alle Äste sammeln, die den Fokus enthalten, und den äussersten nehmen —
  // der ist es, der die anderen mit aushängt.
  const betroffen: { zeile: HTMLElement; ast: HTMLElement }[] = [];
  for (const id of schliessen) {
    const zeile = zeileZu(tocCont, id);
    const ast = zeile ? astVon(zeile) : null;
    // `continue`, nicht `return`: ein Ast ohne Treffer sagt nichts über die
    // übrigen (F3c — der frühere `return false` brach die Suche ab).
    if (!zeile || !ast || !ast.contains(aktiv)) continue;
    betroffen.push({ zeile, ast });
  }
  if (betroffen.length === 0) return false;
  const aeusserster = betroffen.find((a) => !betroffen.some((b) => b !== a && b.ast.contains(a.zeile)))
    ?? betroffen[0];

  // F3b: die sichtbare Marken-Zeile schlägt die (off-screen liegende) Elternzeile.
  const marke = tocCont.querySelector('[data-toc-aktiv]') as HTMLElement | null;
  // P8-NACHZUG (W2·24-R6c): die Sprung-Zeile ist seither ein `<a href="#art-…">`,
  // wo sie eine Adresse hat, und nur sonst noch ein `<button>` — der Selektor
  // muss BEIDE treffen, sonst fände die Fokus-Rettung ihr Ziel nicht mehr und
  // der Fokus fiele wieder an `<body>` (WCAG 2.4.3). Der Chevron daneben bleibt
  // ein Knopf und ist der zweite Ersatzweg.
  const ersatz = (aeusserster.zeile.querySelector(':scope > div > :is(a, button)[title]')
    ?? aeusserster.zeile.querySelector(':scope > div > button[aria-expanded]')) as HTMLElement | null;
  const ziel = marke ?? ersatz;
  if (!ziel || ziel === aktiv) return false;
  ziel.focus();
  return true;
}

export interface ZuklappPlan {
  /** Ids, deren Ast zugeklappt werden darf (Reihenfolge unerheblich). */
  schliessen: string[];
  /** Höhe in px, die OBERHALB der Sichtband-Oberkante verschwindet. */
  kompensation: number;
}

/** Id → gerenderte Zeile. `data-sektion-ids~="…"` trifft auch die INNEREN Stufen
 *  einer verdichteten Einzelkind-Kette (S3/S4): sie haben kein eigenes Element,
 *  werden aber von der Zeile getragen, die sie zeigt. */
function zeileZu(tocCont: HTMLElement, id: string): HTMLElement | null {
  // `CSS.escape` nur, wo es existiert — dasselbe Muster wie `findeArt`
  // (berechnungen.ts). Ohne diese Klammer wirft das Modul in jeder Umgebung ohne
  // `CSS`-Global, und genau daran ist der erste Lauf des Unit-Tors gescheitert
  // (§6.7: das Tor hat beim ersten Mal etwas gefunden). Die `sek-N`-Ids brauchen
  // die Maskierung nicht; sie steht für den Fall, dass die Id-Vergabe je ändert.
  const sicher = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(id) : id;
  return tocCont.querySelector(`[data-sektion-ids~="${sicher}"]`);
}

/** Der KIND-Container einer Zeile — das, was beim Zuklappen verschwindet. Die
 *  Zeile selbst bleibt stehen; gemessen wird darum nie sie, sondern ihr Ast. */
function astVon(el: HTMLElement): HTMLElement | null {
  return el.querySelector(':scope > div.grid');
}

type Lage = 'oben' | 'unten' | null;

/**
 * Plant den Zuklapp-Durchgang. Mutiert NICHTS — der Aufrufer führt die
 * Buchhaltung (Auto-Set, Ticks) und den State-Update aus.
 */
export function planeZuklappen(opts: {
  tocCont: HTMLElement | null;
  /** Automatisch geöffnete Ast-Ids (Kandidatenmenge). */
  auto: Iterable<string>;
  /** Ids des AKTIVEN Pfads — die bleiben offen. */
  aktivIds: string[];
  /** Monotoner Pfadwechsel-Zähler und die letzte Aktiv-Runde je Ast. */
  tick: number;
  ticks: Map<string, number>;
  nachlauf?: number;
  oberhalbErlaubt?: boolean;
  /** Sicherheitssaum um das Sichtband (px), s. F2_SICHERHEITSSAUM. */
  saum?: number;
}): ZuklappPlan {
  const { tocCont, auto, aktivIds, tick, ticks } = opts;
  const nachlauf = opts.nachlauf ?? AUTO_ZU_NACHLAUF;
  const oberhalb = opts.oberhalbErlaubt ?? F2_OBERHALB;
  const saum = opts.saum ?? F2_SICHERHEITSSAUM;
  const leer: ZuklappPlan = { schliessen: [], kompensation: 0 };
  if (!tocCont) return leer; // kein Container ⇒ nichts anfassen (keine Blind-Aktion)
  const contRect = tocCont.getBoundingClientRect();

  const lageVon = (ast: HTMLElement): Lage => {
    const r = ast.getBoundingClientRect();
    if (r.height === 0) return null;
    // Der Saum weitet das Sichtband nach beiden Seiten: nicht «gerade eben
    // draussen» zählt, sondern «mit Abstand draussen» (Herleitung bei
    // F2_SICHERHEITSSAUM — ein roter a33-Lauf mit drei ausgehängten SICHTBAREN
    // Zeilen). Ohne den Saum entscheidet der letzte Pixel, und der überlebt den
    // Weg von der Messung bis zur Mutation unter Last nicht zuverlässig.
    if (r.top >= contRect.bottom + saum) return 'unten';
    if (oberhalb && r.bottom <= contRect.top - saum) return 'oben';
    return null; // berührt das Sichtband (samt Saum) ⇒ offen lassen
  };

  const schliessen: string[] = [];
  const obenAeste: HTMLElement[] = [];
  for (const id of auto) {
    if (aktivIds.includes(id)) continue; // im aktiven Pfad → offen halten
    if (tick - (ticks.get(id) ?? 0) <= nachlauf) continue; // noch im Nachlauf-Fenster
    const el = zeileZu(tocCont, id);
    if (!el) continue; // nicht gerendert (z. B. selbst in einem zugeklappten Ast)
    const ast = astVon(el);
    if (!ast) continue; // kein offener Kind-Container ⇒ nichts zu schliessen
    const lage = lageVon(ast);
    if (lage === null) continue;
    if (lage === 'oben') obenAeste.push(ast);
    schliessen.push(id);
  }
  // NUR die ÄUSSERSTEN kollabierenden Äste zählen: klappen ein Ast und sein
  // eigener Unterast im selben Durchgang zu, steckt die Höhe des Unterastes
  // bereits in der des Oberastes. Summierte man beide, überkompensierte der
  // Scroll und der Baum spränge in die andere Richtung — derselbe Schaden, nur
  // mit umgekehrtem Vorzeichen.
  // B1 (Bug-Check 9.8.2026, HOCH): erst DEDUPLIZIEREN, dann summieren. Eine
  // verdichtete Einzelkind-Kette trägt alle ihre Ids an DERSELBEN Zeile — steht
  // mehr als eine davon im Auto-Set, liefert `zeileZu` für jede dasselbe
  // Element, und `obenAeste` enthielt denselben Ast mehrfach. Der
  // Verschachtelungs-Filter unten fängt das NICHT ab: er vergleicht `b !== a`,
  // und bei identischer Referenz ist das falsch, beide bleiben stehen. Die Höhe
  // wäre n-fach in die Kompensation eingegangen und der Baum in die
  // GEGENRICHTUNG gesprungen — schlimmer als gar keine Korrektur. Betroffen
  // sind genau die Erlasse mit Ketten (ZGB, BS-211.100, BS-640.100).
  const einmalig = [...new Set(obenAeste)];
  const kompensation = einmalig
    .filter((a) => !einmalig.some((b) => b !== a && b.contains(a)))
    .reduce((n, a) => n + a.getBoundingClientRect().height, 0);
  return { schliessen, kompensation };
}
