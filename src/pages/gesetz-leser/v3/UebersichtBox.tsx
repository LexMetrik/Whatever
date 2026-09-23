import type { UebersichtsAngaben } from './uebersichtAngaben';
import type { RohdatenZeiger } from './rohdatenZeiger';

// ─── Übersichtsbox (FAHRPLAN-LESER-V3 Kap. 4b, Pos. 10) ──────────────────────
//
// Eine ZUGEKLAPPTE Zeile «▸ Übersicht SR 312.0 · 480 Artikel», die mit
// wegscrollt: wer im Gesetz liest, sucht dort die Gliederung, nicht die
// Metadaten — alles Weitere ist EINEN Klick entfernt und bleibt im DOM (§8,
// Ctrl+F/Screenreader). Natives `<details>`: Tastatur, `aria-expanded` und
// Zustand kommen vom Browser (Kap. 1 «Familiarity»). CLS (§15/2): zu hat die
// Box eine feste Zeilenhöhe; Aufklappen ist eine Nutzer-Geste.
//
// Gestalt (Neufassung 17.8.2026 nach David «orientiere dich an Fedlex»,
// Herleitung der Auswahl in `./uebersichtAngaben`): EINE Sans-Stimme, eine
// Label-Spalte fester Breite (`.lc-v3-steckbrief`), Werte linksbündig und
// UMBRECHEND statt gekappt, `lc-ziffern` an Daten und Zahlen, kein Kasten
// (Ä5, Kap. 8 Nr. 1), EINE Klappe (die zweite «Mehr»-Klappe fiel mit Ä72).
// `body-s` für Liste und Ruhezeile, `xs` für Links und §8-Feinschrift.
// Messreihen und Befunde (1)–(6) im Wortlaut:
// `git show c9fc15513:src/pages/gesetz-leser/v3/UebersichtBox.tsx`.
//
// W2·29-WERKBANK-LESER S2 (23.9.2026): auch die Früh-Ansichten (pdf-embed,
// nur-live-link) zeigen diese Box statt der gelöschten `parts/ErlassUebersicht`
// — dort `offen`, weil sie die einzige Metadaten-Fläche der Seite ist und die
// gelöschte Hülle ihre §8-Hinweise ohne Klick zeigte.

export function UebersichtBox({ angaben, rohdaten, offen }: {
  angaben: UebersichtsAngaben;
  /** W2·5m · Zeiger auf UNSEREN JSON-Schnappschuss (`./rohdatenZeiger.ts`) —
   *  eigene Prop, weil er der Weg zu unserem Artefakt ist, keine Angabe über
   *  den Erlass. Fehlt sie, bleibt die Box, was sie war. */
  rohdaten?: RohdatenZeiger | null;
  /** S2 · im Grundzustand aufgeklappt (Früh-Ansichten); Vorgabe zu. */
  offen?: boolean;
}) {
  // Ä81/Ä97: `warnung` und `vorbehalt` werden BEWUSST nicht gezeigt — «wie
  // aktuell» ist Titelblatt-Sache; es warnt auf jeder Breite vor dem ersten
  // Artikel, die Box liegt unter xl im Sheet. Ein zweiter Ruf an derselben
  // Falz macht die Warnung beiläufiger, nicht dringlicher (Kap. 1 Nr. 3).
  // Keine Warn-Zelle darf zurückkehren, ohne dass jemand das Titelblatt gegenprüft.
  const { ruhe, zeilen, links, hinweise } = angaben;
  return (
    <details data-v3-uebersicht className="group" open={offen}>
      <summary
        data-v3-uebersicht-zeile
        className="flex cursor-pointer list-none items-baseline gap-1.5 rounded-sm py-1 text-body-s leading-snug text-ink-600 transition-colors hover:text-brass-700 [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="shrink-0 text-ink-400 transition-transform group-open:rotate-90">▸</span>
        <span className="min-w-0">
          <span className="font-medium text-ink-700">Übersicht</span>{' '}
          {/* Ä70 · Sans mit Tabellenziffern statt Mono: zwei Schriftstimmen in
              einer Zeile waren der sichtbare Teil des Befunds. */}
          <span className="lc-ziffern [overflow-wrap:anywhere]">{ruhe}</span>
        </span>
      </summary>
      {/* `data-v3-uebersicht-inhalt` als Testanker statt einer Klassen-Kette:
          ein Wächter darf ein Element nicht über sein Aussehen suchen (H2). */}
      <div data-v3-uebersicht-inhalt className="lc-v3-steckbrief mt-1 pl-4 text-body-s leading-snug">
        {/* Begriff/Wert-Paare als `<dl>`, nicht als Tabelle; das Raster steht
            EINMAL in index.css (`.lc-v3-steckbrief`). Kein `truncate` (bis 284
            px stiller Textverlust je Zeile, gemessen 17.8.2026). */}
        {zeilen.length > 0 && (
          <dl data-v3-uebersicht-liste>
            {zeilen.map((z) => (
              <div key={z.id} data-v3-uebersicht-zeile-id={z.id}>
                <dt>{z.label}</dt>
                <dd className={z.ziffern ? 'lc-ziffern' : undefined}>{z.wert}</dd>
              </div>
            ))}
          </dl>
        )}
        {/* Amtliche Ziele als eigene Zeile unter der Liste — Fakten und
            Aktionen getrennt (Skizze 4e); «↗» folgt dem Ziel, «⬇» geht voran. */}
        {links.length > 0 && (
          <p data-v3-uebersicht-quellen className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs">
            {links.map((l) => (
              <a key={l.id} data-v3-uebersicht-link={l.id} href={l.href}
                target="_blank" rel="noopener noreferrer"
                className="text-brass-700">
                {l.zeichen === '↗'
                  ? <>{l.label} <span aria-hidden>↗</span></>
                  : <><span aria-hidden>{l.zeichen}</span> {l.label}</>}
              </a>
            ))}
          </p>
        )}
        {/* W2·5m · ROHDATEN (§7-Transparenz): EIGENE Zeile UNTER den amtlichen
            Zielen — oben die massgebliche Fassung, hier UNSERE Kopie davon;
            nebeneinander wäre offen, welcher Link das Gesetz ist. Kein
            `target="_blank"`: die Datei liegt auf dieser Seite. Der Stand sagt,
            welche Fassung in der Datei liegt (§7 Bst. a). */}
        {rohdaten && (
          <p data-v3-uebersicht-rohdaten className="mt-1 text-xs leading-snug text-ink-500">
            <a href={rohdaten.href} className="text-brass-700" download>
              <span aria-hidden>⬇</span> Rohdaten (JSON)
            </a>
            {rohdaten.stand && <> — <span className="lc-ziffern">{`Fassung ${rohdaten.stand}`}</span></>}
          </p>
        )}
        {/* §8: was die Anzeige über ihre EIGENEN Grenzen weiss; leer ⇒ kein
            Block («keine Einschränkungen» wäre nicht belegbar). */}
        {hinweise.length > 0 && (
          <ul data-v3-uebersicht-hinweise className="mt-2 space-y-1 pt-1 text-xs leading-snug text-ink-500">
            {hinweise.map((h) => <li key={h}>{h}</li>)}
          </ul>
        )}
      </div>
    </details>
  );
}
