// ═══ Namensnennung der BS-Grossrat-Materialien (CC BY 4.0) — EIN Baustein ════
//
// O-10 (FEHLERBESTAND, K-16-Nachzug): Titel, Nummern, Daten und Dokument-Links
// der Grossratsgeschäfte Basel-Stadt (`behoerde` «BS-GR») stammen aus den
// Datensätzen 100311/100313 auf data.bs.ch, Lizenz CC BY 4.0 (Metadatum
// `license`; Belegstelle bibliothek/materialien/2026-09-12-k16-bs-vormessung.md
// Ziff. 1). CC BY verlangt die Nennung der Quelle und der Lizenz mit Link.
// Der Baustein steht überall, wo solche Einträge gezeigt werden:
// Rubrik «Materialien» (Gruppe GR BS), Material-Detailseite, Reiter «Materialien»
// im Gesetz-Leser. Reine Darstellung (§3); eine Wortlaut-Stelle (§5).
const LINK = 'underline underline-offset-2';

export function BsOgdNachweis() {
  return (
    <span data-quelle-bs-ogd="">
      Quelle: <a href="https://www.bs.ch/" target="_blank" rel="noopener noreferrer" className={LINK}>Kanton Basel-Stadt</a>,{' '}
      <a href="https://data.bs.ch/" target="_blank" rel="noopener noreferrer" className={LINK}>data.bs.ch</a>, Lizenz{' '}
      <a href="https://creativecommons.org/licenses/by/4.0/deed.de" target="_blank" rel="noopener noreferrer" className={LINK}>CC BY 4.0</a>.
    </span>
  );
}
