// J3 · Gesetzesübersicht nach Rechtsgebieten (ROADMAP.md W2·10-UI-NAV, Idee
// David 16.8.2026, Vorbild dejure.org «Gesetze nach Rechtsgebieten»): auf dem
// neutralen G4-Landeplatz /gesetze die Bund-Erlasse je Rechtsgebiet gruppiert
// als dichte Spalten mit Kurztiteln — EIN gehaltvoller Default-Inhalt statt
// der leeren A–Z-Registerfläche (Cowork-Befund 19, 18.8.2026).
//
// SSoT (§5): dieselbe `rechtsgebiet`-Achse wie «Nach Sachgebiet» in der
// Rechtsprechung (`EntscheidSnapshot.sachgebiet: Rechtsgebiet`,
// `src/lib/normtext/register.ts` GEBIETE) — keine zweite Taxonomie. Die
// Gruppierung selbst ist reine, testbare Logik (`gruppiereNachRechtsgebiet`,
// `rechtsgebiet-gruppierung.ts` — bewusst NICHT in `src/lib/normtext/`, siehe
// Kopfkommentar dort); diese Datei ist ausschliesslich Darstellung (§3).
//
// Bewusst KEIN Akkordeon (anders als die bestehende `RechtsgebietSicht`
// unter dem Bund-Gliederungs-Umschalter, die als Praxisfelder-Karten +
// aufklappbares Grundgerüst dient): der dejure-Charakter verlangt sofort
// sichtbare, dichte Linklisten — kein Klick zum Aufklappen (§3.1, kein neuer
// Klick-Umweg für den Standardfall). Nur Bund: kantonale Erlasse tragen
// `rechtsgebiet` nur als Default, keine deklarierte Zweitklassifikation
// (§8 — vgl. Kommentar in `RechtsgebietSicht.tsx`); sie bleiben über den
// Kantone-Einstieg nach amtlicher Systematik erschlossen.
import { gruppiereNachRechtsgebiet } from './rechtsgebiet-gruppierung';
import { type BrowseErlass } from '../../lib/normtext/browse-typen';
import { ErlassTabelle } from '../../components/normtext/ErlassKarte';
import { GruppenKopf } from '../../components/ui/GruppenKopf';

export function RechtsgebietUebersicht({ erlasse }: { erlasse: BrowseErlass[] }) {
  const bund = erlasse.filter((e) => e.ebene === 'bund');
  const gruppen = gruppiereNachRechtsgebiet(bund);
  if (gruppen.length === 0) return null;

  return (
    <section id="rechtsgebiete-uebersicht" aria-labelledby="rechtsgebiete-kopf" className="lc-card p-5 space-y-5">
      <div className="space-y-1">
        <h2 id="rechtsgebiete-kopf" className="font-sans font-semibold text-ink-900 text-h3 tracking-tight">
          Gesetze nach Rechtsgebiet
        </h2>
        <p className="text-body-s text-ink-500 max-w-reading-s">
          Das Bundesrecht nach seiner Sach-Achse — derselben Einteilung wie die
          Rechtsprechung nach Sachgebiet. Kantonale Erlasse: über «Kantone» nach
          amtlicher Systematik.
        </p>
      </div>
      <div className="space-y-6">
        {gruppen.map((g) => (
          <div key={g.gebiet} className="space-y-2">
            <GruppenKopf titel={g.label} zahl={g.erlasse.length} />
            {/* D24 löst den L6-Restpunkt (Metazeilen fluchten): gemeinsame
                Spuren in `ui/ListenTabelle`, Titel auf zwei Zeilen gekappt. */}
            <ErlassTabelle erlasse={g.erlasse}
              beschriftung={`${g.label} — Kürzel, Titel, SR-Nummer`} />
          </div>
        ))}
      </div>
    </section>
  );
}
