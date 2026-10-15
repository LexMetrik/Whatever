// ═══ Namensnennung der BS-Grossrat-Materialien (CC BY 4.0) — EIN Baustein ════
//
// O-10 (FEHLERBESTAND, K-16-Nachzug): Titel, Nummern, Daten und Dokument-Links
// der Grossratsgeschäfte Basel-Stadt (`behoerde` «BS-GR») stammen aus den
// Datensätzen 100311/100313 auf data.bs.ch, Lizenz CC BY 4.0 (Metadatum
// `license`; Belegstelle bibliothek/materialien/2026-09-12-k16-bs-vormessung.md
// Ziff. 1). CC BY 4.0 Abschnitt 3(a)(1) verlangt Urheber, Lizenz mit Link,
// Link auf das Material und den Hinweis auf Änderungen. Urheber laut
// data.bs.ch-Metadaten beider Datensätze (abgerufen 15.10.2026, Feld
// `publisher`): «Parlamentsdienst des Grossen Rates» — nicht der Kanton.
// Der Baustein steht überall, wo solche Einträge mit ihren Daten gezeigt
// werden: Rubrik «Materialien» (Gruppe GR BS), Material-Detailseite, Reiter
// «Materialien» im Gesetz-Leser, Start-Blatt «Materialien». Reine Darstellung
// (§3); eine Wortlaut-Stelle (§5).
const LINK = 'underline underline-offset-2';

export function BsOgdNachweis() {
  return (
    <span data-quelle-bs-ogd="">
      Quelle: Parlamentsdienst des Grossen Rates Basel-Stadt, Datensätze{' '}
      <a href="https://data.bs.ch/explore/dataset/100311/" target="_blank" rel="noopener noreferrer" className={LINK}>100311</a> und{' '}
      <a href="https://data.bs.ch/explore/dataset/100313/" target="_blank" rel="noopener noreferrer" className={LINK}>100313</a>{' '}
      (data.bs.ch), Lizenz{' '}
      <a href="https://creativecommons.org/licenses/by/4.0/deed.de" target="_blank" rel="noopener noreferrer" className={LINK}>CC BY 4.0</a>;
      von LexMetrik ausgewählt und Erlassen zugeordnet.
    </span>
  );
}
