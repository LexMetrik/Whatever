import { Fragment } from 'react';
import { parseISO, isSameDay, isWithinInterval } from 'date-fns';
import type { Kanton } from '../types/legal';
import { stillstandsperiodeFuer, istArbeitsfreierTag } from '../data/zpoFeiertage';

// Grafische Fristen-Antwort: Monatsraster mit durchgehendem Fristband und
// runden Markern für Ereignis / Fristbeginn / Fristende.
//
// Darstellungs-Überarbeitung 7.6.2026 (Auftrag David, reine Optik — Band-
// und Marker-SEMANTIK unverändert): Almanach-Monatsköpfe (Display-Schrift +
// Messing-Jahr über Haarlinie), Fristende als «eingekreister» Termin
// (Doppelring, Fristenkontrollbuch-Geste), Gerichtsstillstand als feine
// Schraffur statt Vollband, ···-Trenner zwischen nicht angrenzenden
// Monaten, Sa/So-Spaltenköpfe abgeschwächt, Kanton der Feiertage offen
// in der Legende (§8).

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const WTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

type Props = {
  ereignisISO: string;
  // aQuoISO (erster mitzählender Tag) optional: der Schnellrechner/Startseiten-
  // Kalender kennt ihn nur im «keine Ferien»-Regime. Fehlt er, spannt das Band
  // vom Ereignistag zum Fristende und es gibt keinen Fristbeginn-Marker.
  aQuoISO?: string;
  adQuemISO: string;
  kanton: Kanton;
  stillstandAktiv: boolean;
  // Explizite Stillstand-Perioden (regimeneutral, ISO inkl.): wenn gesetzt,
  // ersetzen sie die interne ZPO-Gerichtsferien-Berechnung — so kann der
  // Startseiten-Kalender SchKG-/andere Ferienregimes korrekt schraffieren.
  // Fehlt der Prop, gilt unverändert die ZPO-interne Berechnung (Default für
  // die sechs Fristen-Formulare — byte-gleiches Verhalten).
  stillstandPerioden?: { vonISO: string; bisISO: string }[];
  feiertage?: boolean;                 // Sa/So/Feiertage abschwächen (default true)
  // kompakt: Startseiten-Schnellrechner-Variante (Auftrag David 25.6.2026) —
  // NUR die relevanten Wochen (Ereignis→Fristende-Band + Marker) statt voller
  // Monate, schmalere Tiles (Monate nebeneinander), engere Abstände. Opt-in;
  // ohne den Prop unverändertes Verhalten für die sechs Fristen-Formulare.
  kompakt?: boolean;
  // band: Beschriftung der Messing-Fläche in der Legende — Standard
  // «laufende Frist»; abweichend, wo das Band keine Frist ist (z. B.
  // Lohnfortzahlung: bezahlter Zeitraum).
  labels?: { ereignis: string; aquo: string; adquem: string; band?: string };
};

function monatKey(d: Date) { return d.getFullYear() * 12 + d.getMonth(); }
// Deterministisches Klartext-Datum für die Screenreader-Zusammenfassung (E9).
const fmtDatum = (d: Date) => `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;

type BandStatus = 'frist' | 'still' | null;

export function FristenKalender({ ereignisISO, aQuoISO, adQuemISO, kanton, stillstandAktiv, stillstandPerioden, feiertage = true, labels, kompakt = false }: Props) {
  const L = labels ?? { ereignis: 'Ereignistag', aquo: 'Fristbeginn', adquem: 'Fristende' };
  const ereignis = parseISO(ereignisISO);
  const aQuo = aQuoISO ? parseISO(aQuoISO) : null;
  const adQuem = parseISO(adQuemISO);

  // Nur die Schlüssel-Monate zeigen (Ereignis / Fristbeginn / Fristende), dedupliziert.
  const keys = Array.from(new Set([monatKey(ereignis), ...(aQuo ? [monatKey(aQuo)] : []), monatKey(adQuem)])).sort((a, b) => a - b);
  const monate = keys.map((k) => new Date(Math.floor(k / 12), k % 12, 1));
  const luecken = keys.length > 1 && keys.some((k, i) => i > 0 && k - keys[i - 1] > 1);

  // Bandrand = Fristbeginn (sofern bekannt), sonst der Ereignistag.
  const bandRand = aQuo ?? ereignis;
  const fristStart = bandRand < adQuem ? bandRand : adQuem;
  const fristEnde = bandRand < adQuem ? adQuem : bandRand;

  // Stillstand: explizite Perioden (regimeneutral) haben Vorrang; sonst die
  // interne ZPO-Berechnung wie bisher (Default für die Fristen-Formulare).
  const istStill = (d: Date): boolean =>
    stillstandPerioden
      ? stillstandPerioden.some((p) => isWithinInterval(d, { start: parseISO(p.vonISO), end: parseISO(p.bisISO) }))
      : stillstandAktiv && stillstandsperiodeFuer(d) !== null;

  // Legende erklärt nur, was in den GEZEIGTEN Monaten wirklich vorkommt
  // (§8): der Stillstand kann ganz in einem ausgelassenen Zwischenmonat
  // liegen (z. B. Ostern zwischen Fristbeginn März und Fristende Mai) —
  // dann entfällt der Schraffur-Eintrag, statt Unsichtbares zu erklären.
  // Band-Ebene: NUR innerhalb des Frist-Zeitraums [fristStart..fristEnde] zeichnen.
  // Ein Gerichtsstillstand NACH dem Fristende (z. B. Sommer-Gerichtsferien 15.7.–
  // 15.8. bei einer am 6.7. endenden Frist) ist für DIESE Frist irrelevant und
  // wurde sonst fälschlich als «Gerichtsstillstand» gezeigt (Befund David
  // 25.6.2026: «Kalender immer noch nicht richtig»). Innerhalb des Zeitraums:
  // Stillstand-Tage schraffiert, übrige als laufende Frist.
  const bandStatus = (d: Date): BandStatus => {
    if (!isWithinInterval(d, { start: fristStart, end: fristEnde })) return null;
    return istStill(d) ? 'still' : 'frist';
  };

  // Legende erklärt nur, was wirklich GEZEICHNET wird (§8): ein Stillstand zählt
  // nur, wenn er IM Frist-Zeitraum liegt (sonst wird er gar nicht dargestellt).
  const stillstandSichtbar = monate.some((monat) => {
    const tage = new Date(monat.getFullYear(), monat.getMonth() + 1, 0).getDate();
    for (let t = 1; t <= tage; t++) {
      if (bandStatus(new Date(monat.getFullYear(), monat.getMonth(), t)) === 'still') return true;
    }
    return false;
  });

  // kompakt: ein Tag ist «relevant», wenn er ein Schlüsseltag ist oder im Band/
  // Stillstand liegt → nur Wochen mit relevanten Tagen werden gezeigt.
  const istRelevant = (d: Date): boolean =>
    bandStatus(d) !== null || isSameDay(d, ereignis) || (aQuo != null && isSameDay(d, aQuo)) || isSameDay(d, adQuem);

  // ── LM-190 (W2·17-UI-BEFUNDE/B18) · GLEICH HOHE MONATSBLÖCKE ───────────────
  // Der Wochen-Filter oben rechnet je Monat für sich. Bei einem Monatsübergang
  // stand darum ein Block mit EINER Woche neben einem mit fünf, und unter dem
  // kurzen klaffte eine grosse Leerfläche (Befund: «Juli eine Zeile, August
  // fünf»; nachgemessen 5.9.2026 @1440 auf `/` mit Ereignis 28.09./10 Tagen:
  // September-Raster 57 px hoch, Oktober-Raster 91 px).
  // Jetzt bekommen alle gezeigten Monate DIESELBE Zeilenzahl: das Fenster des
  // kürzeren wächst auf die Spanne des längsten — erst nach unten, dann nach
  // oben, immer innerhalb desselben Monats. Es kommen also nur echte Tage
  // dieses Monats dazu, nie fremde; die Bedeutung einer Zelle ist unverändert.
  // Reine Darstellung (§3) — Band, Marker und Legende rechnen weiter über den
  // vollen Monat (`stillstandSichtbar` oben scannt ohnehin alle Tage).
  const raster = monate.map((monat) => {
    const jahr = monat.getFullYear();
    const m = monat.getMonth();
    const anzahl = new Date(jahr, m + 1, 0).getDate();
    const offset = (new Date(jahr, m, 1).getDay() + 6) % 7; // Mo-first
    const alle: (Date | null)[] = [...Array(offset).fill(null), ...Array.from({ length: anzahl }, (_, i) => new Date(jahr, m, i + 1))];
    const wochen: (Date | null)[][] = [];
    for (let i = 0; i < alle.length; i += 7) wochen.push(alle.slice(i, i + 7));
    return wochen;
  });
  const fenster = raster.map((wochen) => {
    const treffer = wochen.map((w, i) => (w.some((d) => d && istRelevant(d)) ? i : -1)).filter((i) => i >= 0);
    return treffer.length > 0 ? { von: treffer[0], bis: treffer[treffer.length - 1] } : { von: 0, bis: wochen.length - 1 };
  });
  const spanne = Math.max(...fenster.map((f) => f.bis - f.von + 1));
  // `i % 7` bleibt weiter unten die Spalte: geschnitten wird auf GANZEN Wochen,
  // die Zellenzahl vor jedem Tag bleibt damit ein Vielfaches von 7.
  const zellenJeMonat = raster.map((wochen, idx) => {
    if (!kompakt) return wochen.flat();
    let { von, bis } = fenster[idx];
    while (bis - von + 1 < spanne && bis < wochen.length - 1) bis++;
    while (bis - von + 1 < spanne && von > 0) von--;
    return wochen.slice(von, bis + 1).flat();
  });

  return (
    // data-ansicht (QS-UI 8b): markiert eine ABGELEITETE Ansicht im Sinne von
    // DESIGN-REGLEMENT §R-4 Ziff. 3 — sie stellt dar, was die Engine
    // bereits entschieden hat, und steht darum immer NACH dem Verdikt. Das Tor
    // `e2e/qsui-hierarchie.e2e.ts` (I1) prüft gegen dieses Attribut. Vorher
    // erkannte es Ansichten nur an `table, svg`; dieser Kalender ist aus reinen
    // Divs gebaut und war für das Tor unsichtbar (§9-Bug-Check zu PR #440, B2).
    <div data-ansicht="fristenkalender" className={`lc-card lc-reveal ${kompakt ? 'p-3.5' : 'p-5'}`}>
      <div className={`flex flex-wrap items-baseline justify-between gap-x-4 ${kompakt ? 'mb-2.5' : 'mb-4'}`}>
        <p className="lc-overline">Fristenlauf</p>
        {/* Feiertage-Kopf entfernt (Auftrag David 25.6.2026): redundant zur
            Legende unten («arbeitsfreie Tage abgeschwächt (Sa/So/Feiertage
            {kanton})»). Die Abschwächung im Raster bleibt (feiertage-Prop). */}
      </div>
      {/* Die grafische Matrix transportiert ihre Bedeutung nur visuell (Farbe/
          Form/title) — für Screenreader aria-hidden und durch die sr-only-
          Zusammenfassung unten ersetzt (E9, WCAG 1.3.1/1.4.1). */}
      {/* kompakt (Startseiten-Schnellrechner): Monate zentriert + fraktional
          wachsend, damit der Kalender seine Karte ausfüllt statt links zu
          kleben (Befund David 26.6.2026 «füllt nicht alles aus»).
          Nicht-kompakt (sechs Fristen-Formulare) wuchs damals bewusst NICHT mit;
          seit LM-142 (4.9.2026) tut es das ebenfalls — Herleitung an der
          Breiten-Zeile unten. Die Ausrichtung bleibt getrennt: kompakt zentriert
          (Kachel), Formular linksbündig an der Feldkante. */}
      <div className={`flex flex-wrap items-start ${kompakt ? 'justify-center gap-x-6 gap-y-5' : 'gap-x-7 gap-y-6'}`} aria-hidden>
        {monate.map((monat, idx) => {
          const jahr = monat.getFullYear();
          const m = monat.getMonth();
          const anzahl = new Date(jahr, m + 1, 0).getDate();
          // kompakt: nur Wochen (7er-Zeilen) mit einem relevanten Tag zeigen
          // (Ereignis→Fristende-Band + Marker) → leere Vor-/Nachwochen entfallen,
          // in allen gezeigten Monaten aber gleich viele (LM-190, s. oben).
          const zellen: (Date | null)[] = zellenJeMonat[idx];
          // Nicht angrenzende Monate: ···-Trenner statt nahtlosem Anschluss
          // (die Fussnote unten bleibt als explizite Aussage bestehen).
          const trenner = idx > 0 && keys[idx] - keys[idx - 1] > 1;
          return (
            <Fragment key={`${jahr}-${m}`}>
              {trenner && (
                <div aria-hidden className="hidden sm:flex self-center px-0.5">
                  <span className="lc-overline tracking-[0.3em]">···</span>
                </div>
              )}
              {/* kompakt: die 17rem-Kappe hält MEHRERE Monate gleich breit; ein
                  EINZELNER (letzter) Monat darf per flex-1 die Karte füllen statt
                  gekappt-schmal zentriert zu bleiben (Auftrag David 1.7.2026 «füllt
                  die Karte» — behebt den bauartbedingten <55%-Füllgrad bei 1 Monat). */}
              {/* ── LM-142 (W2·17-UI-BEFUNDE/B16) · AUCH DER FORMULAR-KALENDER
                  FÜLLT SEINE KARTE. Nicht-kompakt stand auf der starren Breite
                  `w-[min(15.5rem,100%)]` (248 px). Gemessen 4.9.2026 @1440 auf
                  /rechner/schkg-fristen (Preview von origin/main): zwei Monate bei
                  366→614 und 642→890 in einer Karte, die von 345 bis 1351 läuft —
                  rechts blieben rund 440 px leer (ebenso /rechner/kuendigung und
                  /rechner/mietrecht).
                  Das ist DERSELBE Befund, den David am 26.6./1.7.2026 für den
                  kompakten Modus gemeldet hat («füllt nicht alles aus» / «füllt die
                  Karte»), und die Antwort steht schon daneben: fraktional wachsen
                  mit Mindest-Basis und Kappe. Der damalige Scope-Satz «Nicht-
                  kompakt bleibt byte-gleich» war eine Abgrenzung des damaligen
                  Auftrags, kein Befund gegen das Muster — er wird hier ausdrücklich
                  und begründet aufgehoben, nicht still (§0.2). Die Kappe liegt bei
                  22 rem statt 17 rem, weil dieser Modus die volle Tages-Matrix
                  zeigt (keine gefilterten Wochen) und die Zellen sonst nur mit-
                  wachsen, ohne dass eine Woche je in eine Zeile passt. */}
              <div className={kompakt ? `flex-1 basis-[12.5rem] ${monate.length > 1 ? 'max-w-[17rem]' : ''}` : 'flex-1 basis-[15.5rem] max-w-[22rem]'}>
                {/* Almanach-Monatskopf: Display-Name, Messing-Jahr, Haarlinie */}
                <p className="flex items-baseline justify-between gap-2 border-b border-line pb-1.5 mb-2">
                  <span className="font-display text-body-s font-semibold tracking-[-0.01em] text-ink-900">{MONATE[m]}</span>
                  <span className="lc-overline text-brass-700">{jahr}</span>
                </p>
                <div className="grid grid-cols-7 gap-x-0 gap-y-0.5 text-center">
                  {WTAGE.map((w) => (
                    <div key={w} className="lc-overline py-1">{w}</div>
                  ))}
                  {zellen.map((d, i) => {
                    if (!d) return <div key={i} />;
                    const isEreignis = isSameDay(d, ereignis);
                    const isAQuo = aQuo ? isSameDay(d, aQuo) : false;
                    const isAdQuem = isSameDay(d, adQuem);
                    const frei = feiertage && istArbeitsfreierTag(d, kanton);
                    const band = bandStatus(d);

                    // Bandenden abrunden: am Wochen-/Monatsrand und an Statuswechseln
                    const col = i % 7;
                    const vortag = new Date(jahr, m, d.getDate() - 1);
                    const folgetag = new Date(jahr, m, d.getDate() + 1);
                    const rundL = col === 0 || d.getDate() === 1 || bandStatus(vortag) !== band;
                    const rundR = col === 6 || d.getDate() === anzahl || bandStatus(folgetag) !== band;

                    // Marker-Ebene: runde Schlüsseltage über dem Band
                    // W3.6 (25.6.2026): frei-Tage ink-400→ink-500 für AA in beiden Modi (≥4.5:1)
                    // gegen --paper — das gilt aber nur AUSSERHALB des Bandes. LM-175
                    // (Fahrplan B5, §6): innerhalb der laufenden Frist liegt darunter
                    // `bg-brass-100`, im Dunkelmodus #2C2616 (sehr dunkel) statt #F1E8D6
                    // (hell) — ink-500 (#918D83) erreicht dort nur noch 4.54:1 (gemessen,
                    // computed styles), technisch AA, aber am Rand und «kaum lesbar»
                    // (Befund). ink-600 (#B2AEA4) hebt es auf 6.79:1, ohne die Sa/So-
                    // Abschwächung ausserhalb des Bandes (der dokumentierte 25.6.-Entscheid)
                    // anzutasten.
                    let marker = frei ? (band === 'frist' ? 'text-ink-600' : 'text-ink-500') : 'text-ink-700';
                    let title = frei ? 'arbeitsfrei (Sa/So/Feiertag)' : '';
                    // A3-6 (R3-α, 31.8.2026): DOPPEL-FAMILIE aufgelöst. Die Zelle mischte
                      // zwei Farbfamilien für EINE Aussage: die Füllung kam aus der
                      // Materialien-Kennfarbe `sage-500`, der Ring darüber aus der
                      // Zustands-Rolle (`.lc-termin-ring` → `--ok-solid`). Beide sind
                      // wertidentisch, aber nur eine ist hier gemeint: der ad-quem-Tag
                      // ist ein ZUSTAND («Frist endet»), kein Werkstoff.
                    // C2 (5.9.2026, Fund L6/Befund 2): `text-paper` flippt im
                    // Dunkelmodus auf fast-schwarz und mass gegen `--ok-solid`
                    // (bewusst thema-fest) nur 3.84:1 (< 4.5:1) — `text-auf-sage`
                    // ist die nicht flippende helle Tinte für diese Fläche.
                    if (isAdQuem) { marker = 'bg-ok-solid text-auf-sage font-semibold rounded-full lc-termin-ring'; title = L.adquem; }
                    // C2 (5.9.2026): `text-ink-900` flippt im Dunkelmodus auf
                    // hell und mass dort nur 3.84:1 gegen `bg-brass-500`
                    // (< 4.5:1, WCAG 1.4.3/F2) — `text-auf-gold` ist die nicht
                    // flippende Tinte für Text auf Gold-Füllung (D-1.8,
                    // `--auf-gold`, Beleg VerzugszinsTimeline.tsx).
                    // W2·29-WERKBANK-REST S3 (25.9.2026, Posten #918): `auf-gold`
                    // mass HELL nur 3.47:1 (axe 4.13; die Füllung ist hell ein
                    // mittleres Grau, keine helle Gold-Fläche mehr). `brass-500`
                    // flippt MIT dem Thema (hell dunkler, dunkel heller) — die
                    // Tinte muss darum ebenfalls flippen: `text-paper` (hell
                    // #FDFCFA auf #78746C 4.54:1, dunkel #1B1917 auf #949088
                    // 5.51:1). Damit trägt die Marke dieselbe Anatomie wie die
                    // Fristende-Marke daneben: helle Tagzahl auf voller Füllung.
                    // Wächter: `e2e/kontrast-fristmarker.e2e.ts`.
                    else if (isAQuo) { marker = 'bg-brass-500 text-paper font-semibold rounded-full'; title = L.aquo; }
                    // LM-190: Die Papier-Füllung des Ereignis-Rings deckte die LINKE
                    // Rundung des Fristbands zu — das Band schien erst am Folgetag
                    // zu beginnen, mit einer sichtbaren Kerbe davor (gemessen
                    // 5.9.2026 @1440 auf `/`, Element-Screenshot). Liegt Band
                    // darunter, bleibt der Ring jetzt durchsichtig und die Rundung
                    // läuft durch; ohne Band behält er seine Füllung, damit der
                    // Ring gegen die Kartenfläche eine geschlossene Kante hat.
                    else if (isEreignis) { marker = `border-2 border-ink-900 text-ink-900 font-semibold rounded-full ${band ? '' : 'bg-paper-raised'}`; title = L.ereignis; }
                    else if (band === 'still') { marker = 'text-warn-700'; title = 'Gerichtsstillstand'; }

                    return (
                      <div key={i} title={title} className={`relative flex items-center justify-center ${kompakt ? 'h-8' : 'h-9'}`}>
                        {band && (
                          <span aria-hidden className={`absolute inset-x-0 top-1/2 -translate-y-1/2 ${kompakt ? 'h-6' : 'h-7'} ${
                            band === 'still' ? 'lc-hatch-warn' : 'bg-brass-100'
                          } ${rundL ? 'rounded-l-full' : ''} ${rundR ? 'rounded-r-full' : ''}`} />
                        )}
                        <span className={`num relative flex items-center justify-center text-body-s ${kompakt ? 'w-7 h-7' : 'w-8 h-8'} ${marker}`}>
                          {d.getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>

      {/* Textgleichwertige Zusammenfassung für Screenreader (die Matrix oben
          ist aria-hidden). Datum deterministisch, keine Logik. */}
      <p className="sr-only">
        {`Fristenlauf: ${L.ereignis} am ${fmtDatum(ereignis)}, ${aQuo ? `${L.aquo} am ${fmtDatum(aQuo)}, ` : ''}${L.adquem} am ${fmtDatum(adQuem)}.${stillstandSichtbar ? ' Im Zeitraum liegt ein Gerichtsstillstand.' : ''}`}
      </p>

      {luecken && <p className="text-body-s text-ink-500 mt-3 italic">Dazwischenliegende Monate sind nicht dargestellt.</p>}

      {/* Legende — Überarbeitung 7.6.2026 (Auftrag David): zwei gelesene
          Gruppen statt einer ungegliederten Reihe — erst die drei
          Schlüsseltage (Kreis-Marker, chronologisch), nach der Haarlinie
          die Flächen (Band/Schraffur) und die abgeschwächten arbeitsfreien
          Tage. Muster sind Miniaturen der echten Zellen-Rezepte. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 pt-3 border-t border-line text-body-s text-ink-700">
        <span className="lc-overline">Legende</span>
        {ereignisISO !== aQuoISO && <Legende kreis="border-2 border-ink-900 bg-paper-raised" label={L.ereignis} />}
        {aQuoISO && <Legende kreis="bg-brass-500" label={L.aquo} />}
        <Legende kreis="bg-ok-solid lc-termin-ring" label={L.adquem} />
        <span aria-hidden className="hidden sm:inline-block h-4 w-px bg-line" />
        <Legende band="bg-brass-100" label={L.band ?? 'laufende Frist'} />
        {stillstandSichtbar && <Legende band="lc-hatch-warn" label="Gerichtsstillstand" />}
        {/* Arbeitsfreie Tage haben kein eigenes Zeichen im Raster (nur
            abgeschwächte Ziffern) — darum auch keines in der Legende: ein
            Text-Muster («Sa») las sich nach Zeilenumbruch als Wortfragment
            (Befund David 7.6.2026), ein grafisches gäbe es im Kalender
            nicht (§8). Der Eintrag erklärt die Behandlung und ist selbst
            abgeschwächt gesetzt. */}
        {feiertage && <span className="text-ink-500">arbeitsfreie Tage abgeschwächt (Sa/So/Feiertage {kanton})</span>}
      </div>
    </div>
  );
}

function Legende({ kreis, band, label }: { kreis?: string; band?: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      {kreis && <span aria-hidden className={`inline-block w-3.5 h-3.5 rounded-full shrink-0 ${kreis}`} />}
      {band && <span aria-hidden className={`inline-block w-7 h-3.5 rounded-full shrink-0 ${band}`} />}
      {label}
    </span>
  );
}
