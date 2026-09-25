// Seite «Methodik» – vertiefte Fassung; die Kurzfassung («So rechnet LexMetrik»)
// auf der Startseite bleibt davon unberührt.
import { SeitenKopf } from '../components/layout/SeitenKopf';
import { MetaAbschnitt } from '../components/layout/MetaAbschnitt';
import { VerfallUebersicht } from '../components/VerfallUebersicht';

const ABSCHNITTE: { titel: string; text: string }[] = [
  {
    titel: 'Deterministisch gerechnet statt KI-geschätzt',
    text:
      'LexMetrik ist kein Chatbot und kein Sprachmodell. Hinter jedem Rechner stehen fest ' +
      'programmierte Regeln, die direkt aus Gesetz und Rechtsprechung abgeleitet sind. Daraus folgt ' +
      'unmittelbar: Gleiche Eingaben ergeben immer dasselbe Ergebnis – heute, morgen und bei der ' +
      'nächsten Person. Keine Wahrscheinlichkeiten, keine Tagesform, keine «wahrscheinlichste Antwort».',
  },
  {
    titel: 'Jeder Schritt liegt offen',
    text:
      'Ein Ergebnis ohne Rechenweg ist für die juristische Arbeit wertlos. LexMetrik zeigt deshalb ' +
      'nicht nur das Resultat, sondern jeden Zwischenschritt: welcher Fristbeginn angesetzt wurde, ' +
      'welche Gerichts- oder Betreibungsferien einberechnet oder übersprungen wurden, welche ' +
      'Wochenend- oder Feiertagsregel gegriffen hat. Jeder Schritt ist einer konkreten Norm ' +
      'zugeordnet, und jede angewandte Norm ist direkt mit dem amtlichen Gesetzestext auf Fedlex ' +
      'verlinkt. Der vollständige Rechenweg lässt sich als PDF-Bericht ausgeben.',
  },
  {
    titel: 'Strittige Rechtsfragen werden offengelegt, nicht versteckt',
    text:
      'Nicht jede Rechtsfrage ist eindeutig geklärt. Wo Lehre und Rechtsprechung uneins sind oder ' +
      'eine Minderheitsmeinung vertretbar bleibt, entscheidet LexMetrik das nicht stillschweigend ' +
      'zugunsten einer Lesart. Solche Punkte werden ausgewiesen und kurz erläutert, damit die für ' +
      'den konkreten Fall massgebliche Auffassung selbst gewählt werden kann.',
  },
  {
    titel: 'Geprüft oder In Vorbereitung',
    text:
      'Ein Rechner erscheint erst dann als «geprüft» – mit Normverweisen und Direktlinks —, wenn die ' +
      'zugrunde liegenden Regeln vollständig verifiziert sind. Rechner in Arbeit werden als ' +
      '«In Vorbereitung» gekennzeichnet und ohne Normangaben gezeigt. Kantonale Skalen und ' +
      'Gerichtspraxis sind als solche markiert und vor dem Produktiveinsatz zu prüfen ' +
      '(Verifikations-Vorbehalt).',
  },
  {
    titel: 'Wie Vorlagen entstehen',
    text:
      'Vorlagen entstehen nicht durch generierten Text, sondern durch regelbasierte Zusammenstellung ' +
      'fester, juristisch vorformulierter Textbausteine – ohne Sprachmodell, ohne Wahrscheinlichkeiten. ' +
      'Gleiche Eingaben ergeben dasselbe Dokument. Jeder aufgenommene Baustein wird im Bausteinprotokoll ' +
      'mit seinem Auslöser und, sofern einschlägig, seiner Norm offengelegt; streitige oder optionale ' +
      'Auslegungen werden angezeigt statt still aufgelöst. Vor jedem Download erklärt ein nicht ' +
      'überspringbares Form-Gate die massgeblichen Formvorschriften – etwa Eigenhändigkeit oder ' +
      'öffentliche Beurkundung – und was zu tun ist, damit das Dokument gültig wird. Das Ergebnis ' +
      'ist ein Entwurf zur Orientierung, kein verbindliches Dokument.',
  },
  {
    titel: 'Ihre Daten bleiben bei Ihnen',
    text:
      'Alle Berechnungen und Zusammenstellungen laufen vollständig im Browser. Eingaben werden weder ' +
      'an einen Server gesendet noch gespeichert – relevant insbesondere mit Blick auf das Berufsgeheimnis.',
  },
];

export function Methodik() {
  // Responsive-Audit D3: die Seite lief bei 2560 als eine schmale max-w-reading-
  // Einzelspalte → mit der 69-zeiligen Pflege-Liste (VerfallUebersicht) wurde sie
  // ~10 470 px hoch bei viel totem Rechtsraum. Jetzt trägt der Fliesstext weiter
  // die Lesespalte (max-w-reading, §13.2), aber die Daten-Kachelliste darf die
  // Inhaltsbreite in mehreren Spalten nutzen (siehe VerfallUebersicht) — die
  // Höhe sinkt deutlich, der Prosa-Lesekomfort bleibt.
  return (
    <div className="space-y-10">
      <SeitenKopf overline="Methodik" titel="Wie LexMetrik rechnet" />

      <div className="space-y-8">
        {/* W2·29-WERKBANK-REST S3: die Abschnitts-Hülle kommt aus
            `layout/MetaAbschnitt` (eine Quelle mit /ueber und /datenschutz). */}
        {ABSCHNITTE.map((a) => (
          <MetaAbschnitt key={a.titel} titel={a.titel}><p>{a.text}</p></MetaAbschnitt>
        ))}

        <VerfallUebersicht />

        <section className="lc-notice">
          <p className="lc-overline mb-1">Grenzen</p>
          <p className="text-body-s text-ink-600 max-w-reading-s">
            LexMetrik liefert automatisierte Orientierungsberechnungen und Dokument-Entwürfe,
            keine Rechtsberatung. Massgeblich sind Gesetz, GAV, Vertrag und der konkrete
            Sachverhalt. Für die Wahrung einer Frist und die Einhaltung von Formvorschriften
            im Einzelfall ist allein die nutzende Person verantwortlich.
          </p>
        </section>
      </div>
    </div>
  );
}
