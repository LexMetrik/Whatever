import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SeitenKopf } from '../components/layout/SeitenKopf';
import { STARTSEITE_ZAEHLER as Z } from '../data/startseiteZaehler.generated';

// ─── Seite «Was ist durchsuchbar» — Korpus-Abdeckung (UI-NAV S3/E1) ─────────
//
// §8-Offenlegung, was die LexMetrik-Suche wirklich durchsucht — aus den ohnehin
// vorhandenen Registern abgeleitet (kein Zweit-Index, K10; reine Ableitung §3,
// keine Rechtslogik). Deckt gezielt den in der Praxis-Linse benannten Kantons-/
// Rechtsprechungs-Blindflug: kantonale Erlasse liegen im Reader im Volltext,
// sind aber (Suchindex Bund-only, §11.5) nur nach Titel durchsuchbar; die
// Fusszeile der Suche verlinkt hierher.
//
// A1-FUNDAMENT (7.10.2026, Entscheid David «suche zurückfahren. nur noch nach
// gesetzen und werkzeugen suchen lassen. separat für entscheide», Wortsuche «Ja,
// nur über Server»): die Hauptsuche findet Gesetze und Werkzeuge lokal; den
// Wortlaut der Gesetzestexte (Bund UND Kantone) durchsucht ausschliesslich der
// Suchdienst; Entscheide haben eine eigene Suche. Der Browser-Artikelindex ist
// entfallen — die Texte unten sagen den neuen Zuschnitt und seine Grenzen (§8).
//
// W2·29-WERKBANK-KATALOGE K5 (23.9.2026, Board «Unter-Abdeckung», Richtung):
// je Bestand EINE Zeile mit Haarlinie — links Registerstrich, Titel und Zahl,
// rechts die Prosa; die Grenzen der Suche als abgesetzte Zeile auf `--well`
// statt Hinweis-Kasten. Links in Tinte mit Registerkante statt Messing (F0.2).
//
// K5 · EINE ZÄHLQUELLE (§5/§8, deklariert): bis hierher zählte die Seite zur
// Laufzeit aus drei Manifesten mit eigener Regel — gemessen 23.9.2026 6'345
// «Entscheide» (inkl. 1'252 Verweis-Einträge), wo /rechtsprechung und die
// Startseite 5'093 sagen. Jetzt stehen hier dieselben Zahlen wie überall
// (`STARTSEITE_ZAEHLER`, `gen:zaehler`, Drift-Tor `check:zaehler`); die
// Verweise sind eine eigene, benannte Zahl aus derselben Quelle, nie addiert.
// Beweis: `src/tests/zaehler-eine-quelle.test.tsx`.

const nf = (n: number) => n.toLocaleString('de-CH');

/** Eine Bestandszeile: Registerstrich · Titel · Zahl | Prosa. */
function Bestand({ reg, titel, zahl, einheit, children }: {
  reg: 'g' | 'r' | 'm'; titel: string; zahl: ReactNode; einheit: string; children: ReactNode;
}) {
  return (
    <section className="ab-bestand" data-reg={reg}>
      <div>
        <span aria-hidden className="ab-strich" />
        <h2 className="text-ink-900">{titel}</h2>
        <p className="num mt-2 font-serif text-h1 font-normal leading-none text-ink-900">{zahl}</p>
        <p className="mt-1 text-xs text-ink-500">{einheit}</p>
      </div>
      <div className="max-w-reading space-y-3 font-serif leading-relaxed text-ink-800">{children}</div>
    </section>
  );
}

export function Abdeckung() {
  return (
    <div className="space-y-6">
      <SeitenKopf overline="Suche" titel="Was ist durchsuchbar" />

      <p className="max-w-reading font-serif text-body-l leading-relaxed text-ink-800">
        Die Suche oben durchsucht den unten aufgeführten Bestand. Massgeblich bleibt immer die
        amtliche Fassung — jeder Erlass und jeder Entscheid trägt Stand und Live-Link zur Quelle.
        Was noch fehlt, wird hier ehrlich benannt statt weggeglättet.
      </p>

      <div className="space-y-6">
        <Bestand reg="g" titel="Gesetze" zahl={nf(Z.gesetzeVolltext)} einheit="Erlasse im Volltext">
          <p>
            <strong className="font-semibold text-ink-900">{nf(Z.gesetzeBundesrechtVolltext)} Bundeserlasse</strong> und{' '}
            <strong className="font-semibold text-ink-900">{nf(Z.gesetzeInternationalVolltext)} Staatsverträge</strong> liegen im
            Reader im Volltext vor, ebenso die{' '}
            <strong className="font-semibold text-ink-900">{nf(Z.gesetzeKantonVolltext)} kantonalen Erlasse</strong>.
            Die Suche findet Erlasse lokal <em>nach Titel, Kürzel und SR-Nummer</em>{' '}
            und springt bei «OR 257d» direkt zum Artikel. Den <em>Wortlaut</em> der Artikel — Bund wie Kantone —
            durchsucht die Online-Suche auf unserem Suchdienst; in der Trefferliste steht, wie aktuell dessen
            Suchindex ist. Ohne Verbindung, oder wenn der Dienst nicht antwortet, meldet die Suche «Volltextsuche
            derzeit nicht verfügbar»; Gesetze und Werkzeuge bleiben dann weiter auffindbar. Innerhalb eines
            Erlasses sucht das Feld im Reader weiterhin lokal im Wortlaut. Über{' '}
            <Link to="/gesetze" className="ab-link">Gesetze</Link>{' '}
            sind alle browse- und lesbar.
          </p>
        </Bestand>

        <Bestand reg="r" titel="Rechtsprechung" zahl={nf(Z.rechtsprechungVolltext)}
          einheit={`Entscheide im Volltext, davon ${nf(Z.rechtsprechungLeitentscheide)} BGE`}>
          <p>
            Im Bestand sind <strong className="font-semibold text-ink-900">{nf(Z.rechtsprechungVolltext)} Entscheide</strong>,
            davon <strong className="font-semibold text-ink-900">{nf(Z.rechtsprechungLeitentscheide)} amtliche Leitentscheide (BGE)</strong> mit
            Regeste. Entscheide stehen nicht in der Hauptsuche — sie haben ihre eigene Suche auf der Seite
            Rechtsprechung, zu der die Hauptsuche mit dem Suchbegriff verlinkt. Ein BGE-Zitat («BGE 152 I 65»)
            springt aus der Suche weiterhin direkt in den Entscheid; ist es nicht im Bestand, verweist die Suche
            ehrlich auf die amtliche Fassung beim Bundesgericht.
            Daten: OpenCaseLaw — massgeblich bleibt die amtliche Fassung. Keine Rechtsberatung.
          </p>
          <p>
            Nicht mitgezählt sind <strong className="font-semibold text-ink-900">{nf(Z.rechtsprechungVollurteilVerweise)} Verweis-Einträge</strong>:
            das vollständige Urteil des Bundesgerichts zu einem BGE steht als eigener Eintrag in der
            Liste und führt in den Leitentscheid — es ist kein weiterer Entscheid.
          </p>
          <p className="font-sans text-body-s">
            <Link to="/rechtsprechung" className="ab-link">Zur Rechtsprechung →</Link>
          </p>
        </Bestand>

        {/* REST S2 (Posten «Materialien-Kopf», 25.9.2026): «amtliche Ressourcen»
            warf zwei Gattungen zusammen und nannte nur die Verwaltungspraxis.
            Jetzt die Hausbegriffe mit den Teilzählern (U12/#1068) — Summe
            weiter `Z.materialien`, Wortlaut wie Startseite und /materialien. */}
        <Bestand reg="m" titel="Materialien" zahl={nf(Z.materialien)} einheit="Materialien und Erläuterungen">
          <p>
            <strong className="font-semibold text-ink-900">{nf(Z.materialienGesetzgebung)} Materialien (Gesetzgebung)</strong>{' '}
            — Botschaften, Vernehmlassungen, kantonale Parlamentsgeschäfte — und{' '}
            <strong className="font-semibold text-ink-900">{nf(Z.materialienErlaeuterungen)} Erläuterungen (Verwaltungspraxis)</strong>{' '}
            — Kreisschreiben, Leitfäden, Wegleitungen, Rundschreiben; faktisches Soft-Law ohne
            Gesetzesrang. Jeder Eintrag bibliografisch, mit Live-Link zur amtlichen Fassung.
          </p>
        </Bestand>

        <section className="ab-bestand ab-grenzen">
          <div>
            <span aria-hidden className="ab-strich" />
            <p className="lc-overline">Grenzen der Suche</p>
          </div>
          <p className="max-w-reading font-serif leading-relaxed text-ink-800">
            Die Wortsuche im Gesetzestext läuft nur über den Suchdienst und findet ganze Wörter — keine
            Wortanfänge («Verjähr») und keine Synonyme. Entscheide durchsucht die Hauptsuche nicht; kantonale
            Erlasse und nicht-amtliche Entscheide sind zudem über Titel bzw. Metadaten auffindbar, nicht über jeden
            Wortlaut. Diese Abdeckung wächst — bis dahin wird die Grenze offengelegt, nicht kaschiert.
          </p>
        </section>
      </div>
    </div>
  );
}
