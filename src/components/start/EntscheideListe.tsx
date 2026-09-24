import { Link } from 'react-router-dom';
import { STARTSEITE_ZAEHLER } from '../../data/startseiteZaehler.generated';
import { usePaneKlasse } from '../layout/PaneKontext';
import { ohneDatumsSuffix } from './entscheidZitierung';
import { Datum } from '../ui/Datum';

// ─── Jüngste Entscheide im Korpus (W2·24-R3, vormals NewsHeader) ────────────
//
// EHRLICHER TITEL (W2·23-STARTSEITE-V4 §3 #6, §8, WÖRTLICH beibehalten): der
// Streifen hiess «Neues vom Bundesgericht». Er zeigt aber, was IM KORPUS am
// jüngsten ist — und der endet je nach Register-Lauf Monate zurück. «Neues»
// versprach damit Aktualität, die die Daten nicht tragen. Der Titel sagt, was
// wirklich gezeigt wird. Das Referenzbild schreibt «in der Sammlung»; der
// §8-Wortlaut «im Korpus» bleibt, weil er die Scope-Aussage trägt.
//
// W2·24-R3 (DEKLARIERTE Darstellungsänderung, keine Datenänderung): aus dem
// waagrecht scrollenden Kartenstreifen ist die LISTE des Referenzbildes
// geworden — Datum · Zitierung · Gebiet/Regeste. Damit entfallen die
// Blätter-Knöpfe, das Snap-Scrolling und die Scrollstand-Affordanz
// (`lc-scrollrand-x`, LM-061): eine Liste verbirgt nichts, es gibt keinen
// Scrollstand mehr, über den sie Auskunft geben könnte (§17-Gegengewicht:
// gestrichen statt bewacht). Die DATUMS-GRUPPIERUNG (J4) bleibt — das Datum
// steht einmal je Gruppe, nicht auf jeder Zeile.
//
// Die frühere `<KorpusStand />`-Zeile am Fuss ist hier ENTFALLEN: seit R2 trägt
// die Ausgabe-Zeile der Titelblatt-Krone (`layout/Topbar.tsx`, `AusgabeZeile`)
// denselben Baustein auf jeder Seite. Auf «/» stand er damit zweimal (§5).
//
// Datenpfad seit S3-Nebenfund (23.9.2026): build-time-Projektion aus dem
// Register (kein Client-Fetch mehr, §15 — Herleitung unten bei `news`),
// neueste zuerst. Keine Live-Augmentierung (verifizierter API-Vertrag nötig,
// §1/§7). MAX 6 (Kostprobe, kein Archiv, «Alle Entscheide →» führt zur
// Vollsicht) ist die Kappung `MAX_NEUESTE` im Generator, nicht mehr hier.

const nf = (n: number) => n.toLocaleString('de-CH');

// A-3 (R9-2, 6.9.2026): Hier stand ein SECHSTER byte-gleicher Datums-Formatierer
// («ISO → DD.MM.YYYY» per Regex). Genau diese Streuung hat `ui/Datum.tsx` in
// Welle B eingesammelt — Formatierung UND Ziffern-Auszeichnung gehören zusammen,
// sonst läuft das eine ohne das andere weiter (die Herleitung steht dort im
// Wortlaut). Der Aufruf unten benutzt jetzt den Baustein; er bringt `.lc-ziffern`
// mit (Ziffernrolle ohne erzwungene Mono-Familie) und ersetzt damit auch das
// lokale `.num`, das hier Monospace erzwang, wo der Kanon keine Familie wechselt.
// Format der Anzeige unverändert («17.06.2026»), Nicht-ISO bleibt stehen (§8).

/** Ein Eintrag der Mini-Projektion (`gen-startseite-zaehler.ts`, S3-Nebenfund) —
 *  Gebiet und Norm-Kürzel sind dort bereits aufgelöst, hier reine Darstellung. */
type NeuesterEintrag = (typeof STARTSEITE_ZAEHLER)['neuesteEntscheide'][number];

/** Aufeinanderfolgende Einträge gleichen Datums zu einer Gruppe bündeln (J4).
 *
 *  Die Liste ist nach Datum absteigend sortiert (Buildzeit-`nachDatum`, s.
 *  Generator), gleiche Daten stehen also zusammen. Das Datum trägt die GRUPPE
 *  einmal, statt dasselbe «07.08.2026» auf drei Zeilen zu wiederholen. Rein
 *  darstellend (§3), keine Umsortierung — die Reihenfolge der Einträge bleibt
 *  exakt die der Quelle. */
function nachDatumGruppiert(liste: NeuesterEintrag[]): { datum: string; eintraege: NeuesterEintrag[] }[] {
  const gruppen: { datum: string; eintraege: NeuesterEintrag[] }[] = [];
  for (const eintrag of liste) {
    const letzte = gruppen[gruppen.length - 1];
    if (letzte && letzte.datum === eintrag.datum) letzte.eintraege.push(eintrag);
    else gruppen.push({ datum: eintrag.datum, eintraege: [eintrag] });
  }
  return gruppen;
}

export function EntscheideListe() {
  const pk = usePaneKlasse();

  // W2·29-WERKBANK-START S1: das Modul ist fest auf der Seite (David 23.9.2026
  // «neuste entscheide sollen nicht weg»; der Modul-Baukasten mit `an` ist
  // gestrichen).
  //
  // S3-NEBENFUND (23.9.2026, gemessen): hier stand bis dahin ein `useEffect`,
  // das nach der Hydration `ladeEntscheidManifest()` lud — also das 9,4-MB-
  // Rechtsprechungs-Register (§15-Verstoss) — für SECHS Zeilen. Die Auswahl
  // (Bundesgericht, keine Verweise, neueste zuerst, bis zu drei Norm-Kürzel je
  // Zeile) läuft jetzt UNVERÄNDERT, aber zur BUILDZEIT im Generator
  // (`scripts/gen-startseite-zaehler.ts`, dieselbe `nachDatum`/`normLabel`-
  // Logik aus `lib/rechtsprechung/browse.ts`, §10) — `STARTSEITE_ZAEHLER.
  // neuesteEntscheide` ist bereits die fertige Mini-Projektion. Kein Fetch,
  // kein Ladezustand mehr nötig: die Daten stehen synchron im Bundle, wie alle
  // übrigen Zähler dieser Datei (Datenstand = Build, §2/§5).
  const news = STARTSEITE_ZAEHLER.neuesteEntscheide;

  // DEFINITIV LEER (leeres Register): Vollkollaps, kein Titel, keine
  // Platzreservierung (§8) — im Betrieb kommt das nicht vor (`check:entscheide`
  // hält eine Mindestzahl), bleibt aber die ehrliche Antwort auf einen leeren
  // Bestand statt einer erfundenen Liste.
  if (news.length === 0) return null;

  return (
    <>
      <ul className="min-h-modul-news">
        {nachDatumGruppiert(news).map((g) => (
          <li key={g.datum} className={`grid items-baseline gap-x-4 border-t border-rule-soft py-1.5 ${pk(
            'sm:grid-cols-[5.5rem_minmax(0,1fr)]', '@lg/pane:grid-cols-[5.5rem_minmax(0,1fr)]',
          )}`}>
            <Datum iso={g.datum} className="block font-sans text-xs text-ink-500" />
            <div className="grid gap-y-1">
              {g.eintraege.map((e) => (
                /* Spaltenbreite GEMESSEN, nicht geschätzt (6.9.2026, Preview
                   @1440): die kanonische Zitierung lautet «BGer 1C_733/2025 vom
                   17. Juni 2026» und misst 14 px Grotesk rund 250 px. Bei
                   9.5 rem brach jede Zeile um. Gekürzt wird die Zitierung NICHT
                   (§8 — sie ist die Fundstelle), die Spalte wird breit.
                   NACHTRAG R3-Nachzug (6.9.2026, Befund R3-F4): das
                   DATUMS-SUFFIX fällt jetzt weg — es stand doppelt (Spalte +
                   Zitierung), s. `ohneDatumsSuffix` oben. Die Messung darüber
                   bleibt als Beleg stehen; die 16-rem-Spalte behält damit
                   Reserve für längere Geschäftsnummern (§2b). */
                <p key={e.key} className={`grid items-baseline gap-x-4 ${pk(
                  'sm:grid-cols-[16rem_minmax(0,1fr)]', '@2xl/pane:grid-cols-[16rem_minmax(0,1fr)]',
                )}`}>
                  {/* A2-6 (R9-2): dieselbe Fachgrösse «Zitierung/Aktenzeichen» trug
                      an zwei von drei Stellen `.num` (Leser-Kopf `EntscheidLeser.tsx:671`,
                      Karte `EntscheidKarte.tsx:128/141`) und hier an der dritten nicht —
                      also ohne Tabellenziffern. `.num` ist hier der Kanon, nicht
                      `.lc-ziffern`: die Zitierung IST das Aktenzeichen, und für
                      Aktenzeichen ist die Mono-Stimme ausdrücklich vorgesehen
                      (Herleitung im Kopf von `ui/Datum.tsx`). */}
                  <Link to={`/rechtsprechung/${encodeURIComponent(e.key)}`}
                    className="num font-sans font-medium text-body-s text-ink-900 no-underline hover:text-reg-r hover:underline">
                    {ohneDatumsSuffix(e.zitierung)}
                  </Link>
                  {/* Beschreibung: amtliche Kurz-Regeste, sonst die im Entscheid
                      angewandten Kernnormen aus dem Korpus (§8: belegte Angabe,
                      kein generiertes Résumé). Das Rechtsgebiet ist das
                      DETERMINISTISCH erfasste `sachgebiet` — dasselbe Feld, das
                      Liste, Karte und Sachgebiets-Rail benutzen (§5). */}
                  <span className="font-serif text-body-s text-ink-600">
                    {/* C1-1 (R9-2): dieselbe Aussage trug zwei Bauformen — auf der
                        Karte den Badge `.lc-badge lc-badge-ok` (`EntscheidKarte.tsx:52`),
                        hier einen Fettdruck-Satzanfang mit Punkt. Kanon ist der Badge
                        (verbreitetere Form, und die Marke ist ein Status, kein Satz).
                        Das WORT bleibt «Leitentscheid» — kein ★, kein Icon (Prüfer-
                        Verdikt D23-F4: eine Marke, die nur ein Zeichen ist, sagt
                        nichts). Der Satzpunkt entfällt mit dem Satz. */}
                    {e.leitentscheid && <><span className="lc-badge lc-badge-ok">Leitentscheid</span>{' '}</>}
                    <span data-gebiet={e.gebiet}>{e.gebiet}</span>
                    {e.regesteKurz
                      ? <> · {e.regesteKurz}</>
                      : e.normen.length > 0 && <> · angewandt: {e.normen.join(', ')}</>}
                  </span>
                </p>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 max-w-reading font-sans text-xs leading-relaxed text-ink-500">
        {/* «Alle Entscheide →» stand bis R10 als Kopf-Zusatz neben dem Titel; die
            Kopfzeile des Pults trägt nur noch den Schalter, der Verweis wandert
            in die Fuss-Zeile. Ziel und Wortlaut unverändert. */}
        {nf(STARTSEITE_ZAEHLER.rechtsprechungVolltext)} Entscheide im Volltext —{' '}
        <Link to="/rechtsprechung" className="underline hover:text-reg-r">alle Entscheide</Link>.
        Ein Artikel zeigt die Entscheide und Materialien, die ihn anwenden — ein Entscheid
        die Normen, auf denen er beruht; soweit die Bezüge im Korpus erfasst sind.
      </p>
    </>
  );
}
