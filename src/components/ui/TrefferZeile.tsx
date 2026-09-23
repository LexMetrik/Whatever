import type { ReactNode } from 'react';

// ─── TrefferZeile: EINE Treffer-/Werkzeug-Zeile (C-4, 31.8.2026) ─────────────
//
// W2·19-DESIGN-KONSISTENZ · Runde 2, Paket C. Befund C-4 der Finder-Welle: die
// Anwendung zeigte dieselbe Inhaltsklasse — «anklickbare Zeile mit Titel,
// zweiter Zeile, Marke und Pfeil» — in zwei Bauformen:
//   · `components/Katalog.tsx::ListenZeile`      (Rechner-/Vorlagen-Register)
//   · `components/suche/SuchResultate.tsx::ZeileInhalt` (Such-Panel + /suche)
// Beide sind auf DIESEN Baustein gezogen; die Kopien sind gelöscht, nicht
// angeglichen (§5/§10). Der BEHÄLTER bleibt je Fläche (Karte vs. Streifen,
// `<Link>`/`<li>`/`<div>`) — er trägt nur die gemeinsame Flex-Geometrie
// `TREFFER_ZEILE_RAHMEN`, damit der Gruppen-Hover an EINEM Namen hängt.
//
// Aufgelöste Divergenzen (C-4): Untertitel `body-s` (12 px ist Etiketten-,
// nicht Satzgrösse), Kappung `line-clamp-2` (ein abgeschnittenes Sub-Label
// verliert Information, §8; der Schalter `subWrap` entfiel), EIN statischer
// Pfeil ohne Motion (F8), Titel-Hover an beiden Flächen.
//
// W2·29-WERKBANK-KATALOGE K1 (23.9.2026): Token-Tausch auf die Werkbank,
// Messing raus. Titel-Hover als Unterstrich (vorher `brass-800`, von `ink-900`
// kaum zu unterscheiden: #1D1B17 gegen #25231F), Untertitel `ink-600` (Board),
// Pfeil ruhig in `ink-500`. Verhalten, Slots und Kappung unverändert.
//
// Bewusst NICHT vereinheitlicht (declared, mit Grund): die Titel-Kappung. Im
// Such-Panel ist die Zeile ein STREIFEN fester Höhe — die Kappung ab `sm` hält
// die Panel-Höhe stabil (§15.2/CLS, Herleitung in `SuchResultate.tsx`); in den
// Katalog-Karten darf der Titel umbrechen, weil eine gekappte Werkzeug-
// Bezeichnung Information verlöre (§8). Dafür trägt der Baustein `streifen`.
//
// Reine Darstellung (§3): keine Logik, keine Datenkenntnis.

/** Flex-Geometrie + Gruppen-Name der Zeile. Der Behälter je Fläche komponiert
 *  seine eigene Optik (Karte/Streifen) DARÜBER — der Gruppen-Name muss der
 *  gleiche sein, sonst greift der Titel-Hover nicht. */
export const TREFFER_ZEILE_RAHMEN = 'group/treffer flex items-center gap-3 min-w-0';

export function TrefferZeile({ titel, untertitel, meta, marke, pfeil = '→', streifen }: {
  titel: ReactNode;
  /** Zweite Zeile (Sub-Label, Rechtsgebiet, Snippet) — höchstens zwei Zeilen. */
  untertitel?: ReactNode;
  /** A3-3 (R3-β, 31.8.2026) · dritte Zeile: die HERKUNFT des Treffers (Gericht/
   *  Kanton · Datum · Aktenzeichen). Additiv aufgenommen für die Live-Suche
   *  (entscheidsuche.ch), deren Zeile diese Angaben führt — ein Entscheid ohne
   *  seine Fundstelle ist keine Fundstelle (§8). Der Slot bringt seine Anatomie
   *  mit (Micro-Grad, umbrechende Reihe), damit sie nicht wieder je Fläche
   *  entsteht; der Aufrufer gibt nur die Glieder. */
  meta?: ReactNode;
  /** Badges/Status-Marken vor dem Pfeil (0…n). */
  marke?: ReactNode;
  /** `↵` = «Enter springt» (Norm-Sprung der Suche); `↗` = führt aus der App
   *  hinaus (amtliche Fremdquelle, dieselbe Glyphe wie an den Quell-Links);
   *  `null` = nicht anklickbar. */
  /*  D9 (David 6.9.2026, «kein →»): `false` = die Zeile IST anklickbar, trägt
   *  aber kein Pfeil-Zeichen. Im Such-Panel war der Pfeil an jeder einzelnen
   *  Zeile das «Pfeil-Muster», das David gerügt hat — die Klickbarkeit sagt
   *  dort die Hover-Fläche und die Listbox-Semantik. `null` bleibt, was es war:
   *  gar nicht anklickbar (dann fällt auch das Hover-Signal weg). */
  pfeil?: '→' | '↵' | '↗' | null | false;
  /** Zeile in einem Streifen fester Höhe (Such-Panel): Titel ab `sm` gekappt. */
  streifen?: boolean;
}) {
  // Kein Hover-Signal an einer Zeile, die gar nicht klickbar ist (`pfeil={null}`,
  // z. B. eine geplante Katalog-Karte): dort lässt auch die zentrale
  // `.lc-card`-Regel den Rahmen in Ruhe, weil das Element kein `<a>`/`<button>`
  // ist. Ein tintender Titel wäre dann ein Versprechen ohne Ziel.
  const klickbar = pfeil !== null;
  return (
    <>
      <span className="min-w-0 flex-1">
        <span className={`block lc-wortumbruch text-body-s font-medium leading-snug text-ink-900${
          klickbar ? ' underline-offset-2 group-hover/treffer:underline' : ''}${
          streifen ? ' max-sm:line-clamp-2 sm:truncate' : ''}`}>{titel}</span>
        {untertitel !== undefined && untertitel !== null && untertitel !== '' && (
          <span className="block lc-wortumbruch line-clamp-2 text-body-s leading-snug text-ink-600">{untertitel}</span>
        )}
        {meta && (
          <span className="mt-1 flex flex-wrap items-center gap-x-2 text-micro text-ink-500">{meta}</span>
        )}
      </span>
      {marke && <span className="flex items-center gap-2 shrink-0">{marke}</span>}
      {pfeil && <span aria-hidden className="shrink-0 leading-none text-ink-500">{pfeil}</span>}
    </>
  );
}
