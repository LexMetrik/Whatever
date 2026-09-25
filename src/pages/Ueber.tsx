import { Link } from 'react-router-dom';
import { SeitenKopf } from '../components/layout/SeitenKopf';
import { MetaAbschnitt } from '../components/layout/MetaAbschnitt';

// Seite «Über» – Entstehungsgeschichte, Grundsätze und ehrliche Grenzen.
export function Ueber() {
  return (
    <div className="space-y-10">
      {/* W2·31-BILDSCHIRMBREITE B12 (25.9.2026): kein Deckel mehr am Seiten-
          Container. Er trug `max-w-reading` samt Titelband — die Seite stand als
          640-px-Spalte links im 1120-px-Rahmen (Rand @1920 424 links / 856
          rechts). Jetzt spannt das Band den Rahmen wie auf /methodik,
          /abdeckung, /einstellungen und der Fehlerseite; der Fliesstext trägt
          seinen Deckel am Textelement (`MetaAbschnitt`: reading-s). */}
      <SeitenKopf overline="Über" titel="Über LexMetrik" />

      {/* B1b (W2·31-BILDSCHIRMBREITE, 25.9.2026): eigener Deckel `reading-s`
          HIER statt am äusseren Seiten-Container (`max-w-reading`, der auch
          Titel/Struktur trägt) — Deckel am Textelement, nie am Rahmen (§Step C). */}
      <div className="space-y-4 text-body-s text-ink-600 leading-relaxed max-w-reading-s">
        <p>Die Idee zu LexMetrik kam mir bei der Vorbereitung auf die Anwaltsprüfung in Basel-Stadt.</p>
        <p>
          Wie viele habe ich dabei auch KI-Tools genutzt. Für das Verständnis schwieriger Fragen
          waren sie oft hilfreich. Bei den Fristberechnungen dagegen, die im Grunde nur saubere
          Regelanwendung sind, konnte ich mich nicht auf sie verlassen: Mal wurde der Fristbeginn
          verschoben, mal eine Gerichtsferienperiode übergangen, mal ein Datum genannt, das schlicht
          nicht stimmte – jedes Mal mit grosser Selbstsicherheit.
        </p>
        <p>
          Das hat mich überrascht, denn eine Frist kennt kein Ermessen. Sie ergibt sich aus dem
          Gesetz und einigen Entscheiden, und am Ende steht ein einziges richtiges Datum. Wer es
          verpasst, verliert das Recht. Eine solche Berechnung darf nicht von der Tagesform eines
          Sprachmodells abhängen – sie muss verlässlich sein und sich überprüfen lassen.
        </p>
      </div>

      {/* W2·29-WERKBANK-REST S3: die Zwischentitel standen in einer eigenen
          Stimme (`font-medium`, ohne Display-Schnitt) mitten im Fliesstext;
          jetzt dieselbe Abschnitts-Hülle wie /methodik und /datenschutz. */}
      <MetaAbschnitt titel="Was LexMetrik heute ist">
        <p>
          Aus dem Fristenrechner ist eine Arbeitsplattform für Schweizer Recht geworden – gedacht
          als Taschenmesser für den juristischen Alltag:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <span className="text-ink-900">Werkzeuge</span>, die Fristen, Beträge und Quoten nach
            festen Regeln berechnen und Rechtsdokumente aus strukturierten Textbausteinen
            zusammenstellen – jeder Rechenschritt wird angezeigt und ist mit der Norm belegt.
          </li>
          <li>
            <span className="text-ink-900">Gesetzestexte</span> des Bundes und der Kantone im
            Volltext – jede Bestimmung mit Link auf die geltende amtliche Fassung; die
            gespeicherten Texte werden automatisch gegen die Quelle abgeglichen, damit keine
            veraltete Fassung stehen bleibt.
          </li>
          <li>
            <span className="text-ink-900">Rechtsprechung und Materialien</span> – Leitentscheide
            und Gesetzgebungsunterlagen aus amtlichen Quellen, durchsuchbar neben den Normen.
          </li>
        </ul>
      </MetaAbschnitt>

      <MetaAbschnitt titel="Wonach LexMetrik gebaut ist">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <span className="text-ink-900">Feste Regeln statt Schätzung.</span> Dieselbe Eingabe
            führt immer zum selben Ergebnis. In den Berechnungen rechnet kein Sprachmodell mit –
            nirgends.
          </li>
          <li>
            <span className="text-ink-900">Jede Angabe belegt.</span> Rechtswerte tragen die Norm,
            den Link auf die geltende amtliche Fassung und den Stand. Massgeblich ist immer die
            amtliche Fassung, nie die Kopie.
          </li>
          <li>
            <span className="text-ink-900">Nur amtliche, urheberrechtsfreie Quellen.</span> Keine
            Kommentarliteratur, keine Inhalte unklarer Herkunft.
          </li>
          <li>
            <span className="text-ink-900">Ehrlicher Prüfstand.</span> Jeder Inhalt deklariert
            offen, wie weit er geprüft ist; Unsicherheiten und offene Punkte werden angezeigt
            statt geglättet.
          </li>
        </ul>
        <p>
          Offen gesagt wird auch, wie gebaut wird: LexMetrik entsteht mit Hilfe von KI – aber
          gegen strenge, maschinelle Prüfungen. Jede Rechtsregel ist testgesichert, und kein Umbau
          gelangt in den Betrieb, ohne zu beweisen, dass er kein Ergebnis verändert hat. Die KI
          hilft beim Bauen; gerechnet wird ohne sie.
        </p>
        <p>
          Die juristische Prüfung nimmt LexMetrik niemandem ab, und es ersetzt keine
          Rechtsberatung. Aber es liefert eine Grundlage, die sich in Minuten kontrollieren lässt.
          Was in welcher Tiefe abgedeckt ist, zeigt die Seite{' '}
          <Link to="/abdeckung" className="text-brass-700 underline hover:text-brass-600">Abdeckung</Link>,
          die Arbeitsweise im Detail die Seite{' '}
          <Link to="/methodik" className="text-brass-700 underline hover:text-brass-600">Methodik</Link>.
        </p>
        <p>
          LexMetrik bleibt in Entwicklung. Rückmeldungen sind willkommen – besonders dann, wenn
          etwas nicht stimmt:{' '}
          <Link to="/kontakt" className="text-brass-700 underline hover:text-brass-600">Kontakt</Link>.
        </p>
        {/* Signatur – externe Verlinkung wie übrige externe Links (neues Tab) */}
        <p className="pt-2">
          <a
            href="https://www.linkedin.com/in/david-graf-a5667624b/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium"
          >
            David Graf
          </a>
        </p>
      </MetaAbschnitt>
    </div>
  );
}
