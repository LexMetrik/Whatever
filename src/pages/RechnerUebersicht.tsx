import { useMemo, useState } from 'react';
import { KATALOG_KARTEN } from '../lib/startseiteConfig';
import { OBERKATEGORIEN } from '../lib/oberkategorien';
import { KategorieSektion } from '../components/Katalog';
import { kartenDerKategorie } from '../lib/katalogKategorie';
import { kartePasst, LEERER_FILTER } from '../lib/katalogSuche';
import { KatalogHinweis } from '../components/KatalogHinweis';
import { MassgebendeGesetze } from '../components/normtext/MassgebendeGesetze';
import { SeitenKopf } from '../components/layout/SeitenKopf';
import { EntwurfLegende } from '../components/EntwurfLegende';
import { Leerzustand } from '../components/ui/Leerzustand';
import { ZweiachsigerEinstieg } from '../components/ZweiachsigerEinstieg';
import { Zeiterfassung } from './rechner-teile/Zeiterfassung';
import { STARTSEITE_ZAEHLER } from '../data/startseiteZaehler.generated';

// ─── Rechner-Übersicht (/rechner) — UI-Welle, Ersatz für /recherche ─────────
//
// Eigene Rubrik-Übersicht analog zu /gesetze und /vorlagen (Auftrag David):
// die drei Rechner-Oberkategorien (Zuständigkeiten · Fristen · Gebühren) je als
// vollständige Sektion auf EINER Seite — alle Werkzeuge direkt browsbar, ohne
// Deckblatt-Zwischenklick. Reine Wiederverwendung der bestehenden
// KategorieSektion-Register (§3/§5); die Suche lebt im Header-Dropdown.
const RECHNER_KATEGORIEN = OBERKATEGORIEN.filter((k) => k.id !== 'vorlagen');

export function RechnerUebersicht() {
  // W2·10-UI-NAV/N0d·W4: lokaler Sofort-Filter über die bestehende Katalog-
  // Struktur (kartePasst — dieselbe getestete Treffer-Logik wie die Kopfsuche,
  // §5). Leerer Filter = unveränderte Ansicht (byte-gleich); bei aktivem Filter
  // werden nur die Kategorien mit Treffern gezeigt und die «In Vorbereitung»-
  // Accordions geöffnet. Rein clientseitig, keine Rechenlogik.
  const [filter, setFilter] = useState('');
  const q = filter.trim();
  const karten = useMemo(
    () => (q === '' ? KATALOG_KARTEN : KATALOG_KARTEN.filter((k) => kartePasst(k, { ...LEERER_FILTER, suche: q }))),
    [q],
  );
  const kategorien = useMemo(
    () => (q === '' ? RECHNER_KATEGORIEN : RECHNER_KATEGORIEN.filter((kat) => kartenDerKategorie(karten, kat.id).length > 0)),
    [karten, q],
  );
  const gefiltert = q !== '';

  return (
    <div className="space-y-6">
      {/* D22 Ziff. 4 · DIE ABSTÄNDE DER ÜBERSICHT SIND GEDECKELT.
          Gemessen (Playwright, Preview, 6.9.2026, @1440/@1160/@1024/@390):
          die grösste senkrechte Leerfläche zwischen zwei Inhaltsblöcken lag
          auf den fünf Übersichten bei 64/49/57/74/56 px. Das Budget ist
          48 px — der Seitenrhythmus geht darum von `space-y-8` (32) auf
          `space-y-6` (24). Nur Abstand, kein Inhalt, keine Reihenfolge. */}
      {/* D11/D22 (David 6.9.2026) — Kopf-Regel für ALLE fünf Übersichten,
          Herleitung in `components/layout/SeitenKopf.tsx`: H1 = Bereichsname
          wie im Reiter, DARUNTER die Ausgabe-Zeile aus dem Register — keine
          Overline, keine halbe Haarlinie, kein Erklär-Absatz. */}
      <SeitenKopf
        titel="Rechner"
        ausgabe={`${STARTSEITE_ZAEHLER.rechner} Rechner nach Rechtsgebiet und nach Aufgabe`}
      />

      {/* D22 Ziff. 2 — EINE Filterzeile über die volle Inhaltsbreite (Label über
          Feld), gleiche Anatomie wie auf /gesetze und /materialien. Das
          `aria-label` ist entfallen: der sichtbare Text IST der zugängliche
          Name (WCAG 2.5.3), zwei Namen für dasselbe Feld sind einer zu viel. */}
      <div className="ub-filter">
        <label htmlFor="rechner-filter" className="lc-overline">Filtern</label>
        <input id="rechner-filter" type="search" value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Titel, Rechtsgebiet oder Norm …"
          className="lc-input h-9 py-0 text-body-s w-full" />
        <EntwurfLegende />
      </div>

      {!gefiltert && <ZweiachsigerEinstieg />}

      {kategorien.map((kat) => (
        <KategorieSektion key={kat.id} kat={kat} karten={kartenDerKategorie(karten, kat.id)} alleOffen={gefiltert} />
      ))}

      {gefiltert && kategorien.length === 0 && (
        <div className="py-6">
          {/* D-7 (R3-α, 31.8.2026): handgezeichneter Absatz + eigener Knopf →
              der EINE Baustein; Wortlaut und Wirkung unverändert. */}
          <Leerzustand art="filter" text={`Kein Rechner für «${q}» gefunden.`}
            weiterweg={{ text: 'Filter zurücksetzen', onKlick: () => setFilter('') }} />
        </div>
      )}

      {/* Werkzeuge/Kontext nur in der ungefilterten Vollansicht — im Filter-Modus
          zählt die knappe Trefferliste. */}
      {!gefiltert && (
        <>
          {/* Werkzeuge: die Zeiterfassung wohnt seit Startseite V3 (§3) hier unten
              statt auf der Startseite — Komponente unverändert, gleiche Selbst-
              Höhe wie zuvor (CLS-neutral). */}
          <section className="space-y-2.5" aria-labelledby="werkzeuge-titel">
            <h2 id="werkzeuge-titel" className="lc-overline">Werkzeuge</h2>
            <Zeiterfassung />
          </section>

          <MassgebendeGesetze modus="rechner" />
          <KatalogHinweis />
        </>
      )}
    </div>
  );
}
