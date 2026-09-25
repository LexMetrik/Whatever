// ═══ «… wird geladen …» — EIN Baustein (W3-7, Audit 25.9.2026) ═══════════════
//
// GEMESSEN (`grep -rn "scale-rule max-w-\[200px\]" src`): dieselbe Ablesekante
// («scale-rule») + eine Zeile Text stand als SIEBEN Kopien in sechs Dateien
// (`layout/RouteHuelle`, `pages/gesetz-leser/inhalt-ansichten` ×2,
// `pages/EntscheidLeser`, `pages/MaterialLeser`, `pages/Materialien`,
// `pages/Gesetze`) — ohne `role="status"`, ein Screenreader erfuhr vom
// Ladezustand nur zufällig aus dem DOM-Text, nie als Ankündigung. Dieser
// Baustein trägt NUR das Wiederkehrende (Ablesekante + Text + `role`); der
// äussere Rahmen (Seitenhöhe, Pane-Bewusstsein, Overlay-Positionierung über
// einem iframe) bleibt beim Aufrufer — die drei Stellen meinen verschiedene
// Flächen (Route, Erlasstext, eingebettetes PDF), keine gemeinsame Geometrie.
//
// Nur die WHITELIST-Stellen dieses Bau-Schritts (Route, gesetz-leser) sind
// hierauf umgestellt; die vier übrigen Fundstellen liegen ausserhalb der
// Fläche dieses Schritts und sind unverändert (Nebenfund, Rückgabe).
// NACHTRAG W2·29-WERKBANK-REST S2 (25.9.2026): `pages/Materialien`,
// `pages/MaterialLeser` (und die Deckungsseite, die eine Textzeile ohne
// Ablesekante trug) nutzen jetzt diesen Baustein; offen sind
// `pages/EntscheidLeser` (REST S1) und `pages/Gesetze`.
// NACHTRAG REST S5b (25.9.2026): `pages/Gesetze` umgestellt, dazu die dem
// ersten grep entgangene Kopie `pages/Rechtsprechung` (Klassenfolge
// «scale-rule mx-auto max-w-[200px]»). Nachmessung
// `grep -rn "scale-rule" src/pages src/components`: Markup nur noch hier.
export function Ladeanzeige({ text, className = '' }: {
  /** Der sichtbare UND per `role="status"` angekündigte Text («Wird geladen …»). */
  text: string;
  /** Klassen des äusseren Rahmens (Höhe, Abstand) — Sache des Aufrufers. */
  className?: string;
}) {
  return (
    <div role="status" className={`text-center space-y-3 ${className}`}>
      <div className="scale-rule max-w-[200px] mx-auto" aria-hidden />
      <p className="text-body-s text-ink-500">{text}</p>
    </div>
  );
}
