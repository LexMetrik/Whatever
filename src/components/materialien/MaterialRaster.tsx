import { useEffect, useRef, useState } from 'react';
import type { BrowseMaterial } from '../../lib/materialien/typen';
import { leseFenster, schreibeFenster } from '../ui/listenFenster';
import { WeitereKnopf } from '../ui/WeitereKnopf';
import { MaterialKarte } from './MaterialKarte';

// ─── Karten-Raster EINER Behörden-Gruppe mit DOM-Deckel (W2·31 P6) ──────────
//
// Befund (30.9.2026, gemessen am Build vor dem Fix, headless Chromium, 5
// Läufe, Preview): `/materialien` rendert alle 1'684 Register-Einträge als
// Karte — 78'552 px hoch @1920 (Skala 1), 443'031 px @375 (Skala 1.4), 17'158
// DOM-Knoten. Hausmuster der Register-Listen ist der DOM-Deckel
// (`pages/Rechtsprechung.tsx::LISTE_DECKEL`, dort 100 + «Weitere anzeigen»):
// je Behörde höchstens `MATERIAL_DECKEL` Karten, der Rest hängt am Knopf.
//
// Was NICHT gekürzt wird (§15, Logikverlust-Bewertung im PR): Bestand und
// Filter laufen über das ganze Register; der Gruppenkopf zählt die volle
// (gefilterte) Gruppe; der Knopf nennt die verborgene Restzahl. Jede Karte
// bleibt über den Filter (Titel, Nummer, Behörde, Dokumenttyp) und über die
// Detailseite `/materialien/:key` erreichbar; die Universal-Suche ist
// unberührt. Die Register-Seite ist kein Normtext (§15.1 unberührt, kein
// Ctrl+F-Vertrag über Normtext); der Prerender enthält keine Karten (0),
// SEO ist unberührt.
//
// Reine Darstellung (§3): die Menge kommt fertig gefiltert und sortiert aus
// `lib/materialien/browse.ts`; hier wird nur das Fenster gesetzt.
export const MATERIAL_DECKEL = 100;

// Harte Obergrenze eines WIEDERHERGESTELLTEN Fensters (wie `FENSTER_MAX` in
// `pages/Rechtsprechung.tsx`): sessionStorage ist schreibbar, ohne Schranke liesse
// sich ein beliebig grosses DOM erzwingen. 20 Stapel übersteigen die grösste Gruppe.
const FENSTER_MAX = MATERIAL_DECKEL * 20;

// `speicherKey` = die Behörde (eigenes Fenster je Gruppe). Die Sitzungs-Helfer
// sind die geteilten aus `ui/listenFenster` (§5, seit P10b; vorher in
// `rechtsprechung/zustand`): ein Fenster ist dort wie hier «[von, bis)» — hier
// immer ab 0, der Deckel wächst nur nach unten.
export function MaterialRaster({ materialien, klasse, speicherKey }: {
  materialien: BrowseMaterial[]; klasse: string; speicherKey: string;
}) {
  // B1 (Zweitprüfung #1185): das aufgeklappte Fenster kommt LAZY aus der Sitzung
  // zurück, schon im ersten Render — nach «zurück» aus einer Detailseite muss das
  // Dokument sofort wieder so hoch sein, sonst greift die Y-basierte
  // Scroll-Wiederherstellung (App.tsx) ins Leere (Muster `Rechtsprechung::Liste`).
  const schluessel = `materialien:${speicherKey}`;
  const [sichtbar, setSichtbar] = useState(
    () => leseFenster(schluessel, MATERIAL_DECKEL, FENSTER_MAX).bis);
  // Jeden Stand (auch das Zurücksetzen unten) festhalten: so stellt die Rückkehr
  // nie ein Fenster her, das ein Filterwechsel schon verworfen hat.
  useEffect(() => { schreibeFenster(schluessel, { von: 0, bis: sichtbar }); }, [schluessel, sichtbar]);
  // Filterwechsel = neue Menge (`gruppiereNachBehoerde` liefert je `gefiltert`
  // frische Arrays): das Fenster beginnt wieder beim Deckel. Zurücksetzen im
  // Render (wie `Rechtsprechung`), nicht im Effekt — sonst ein Frame mit dem
  // alten, womöglich sehr langen Fenster. Beim MOUNT greift es nicht (gleiche
  // Referenz): die wiederhergestellte Höhe überlebt die Rückkehr.
  const [vorherMenge, setVorherMenge] = useState(materialien);
  if (vorherMenge !== materialien) { setVorherMenge(materialien); setSichtbar(MATERIAL_DECKEL); }

  // Tastatur: der Knopf wandert mit dem Inhalt nach unten (oder verschwindet
  // beim letzten Stapel) — der Fokus geht auf die erste neue Karte, nicht ins
  // Leere. Der Knopf steht UNTER dem Raster, der Inhalt wächst nur nach unten
  // (CLS 0).
  const raster = useRef<HTMLDivElement>(null);
  const fokusAb = useRef<number | null>(null);
  useEffect(() => {
    if (fokusAb.current === null) return;
    const ziel = raster.current?.children[fokusAb.current] as HTMLElement | undefined;
    fokusAb.current = null;
    ziel?.focus({ preventScroll: true });
  }, [sichtbar]);

  const rest = materialien.length - sichtbar;
  return (
    <>
      <div ref={raster} className={klasse}>
        {materialien.slice(0, sichtbar).map((m) => <MaterialKarte key={m.key} m={m} />)}
      </div>
      {rest > 0 && (
        <WeitereKnopf
          rest={rest}
          mehr={() => { fokusAb.current = sichtbar; setSichtbar((n) => n + MATERIAL_DECKEL); }}
        />
      )}
    </>
  );
}
