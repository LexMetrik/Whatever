import { gattungVon } from '../../lib/materialien/gattung';
import { MASSGEBLICH_SATZ } from '../../lib/benennung';
import type { DoktypId } from '../../lib/materialien/typen';

// ─── W2·29-WERKBANK-REST S5c · §8-Hinweis JE GATTUNG (Entscheid David 25.9.2026)
//
// Posten 25.9.2026 «MaterialLeser.tsx:165 Hinweisbox sagt auch bei Botschaften
// …»: der Material-Leser sagte für JEDEN Eintrag «Behördenpublikation, kein
// Gesetzesrang. Verwaltungsverordnungen (Kreisschreiben, …) binden die
// Verwaltung intern …» — bei einer Botschaft des Bundesrates, einer
// Vernehmlassung oder einem Ratschlag an den Grossen Rat ist das die falsche
// Gattung. Davids Entscheid: «ja, je Gattung».
//
// Die Gattung kommt aus der EINEN Zuordnung `lib/materialien/gattung.gattungVon`
// (§5) — dieselbe, die die Teilzähler `materialienGesetzgebung` /
// `materialienErlaeuterungen` und die Leser-Reiter speist. Keine eigene Liste.
//
// Wortlaut Erläuterungen: unverändert der bisherige Satz (Verwaltungspraxis).
// Wortlaut Gesetzgebung: Gattung + Rang, dazu EIN Satz zur Rolle ohne
// Quellenbehauptung (geht in die Gegenprüfung, §7/§8).
export function GattungsHinweis({ doktyp }: { doktyp: DoktypId }) {
  if (gattungVon(doktyp) === 'materialien') {
    return (
      <p data-gattung="materialien">
        <strong>Gesetzgebungsmaterial, kein Gesetzesrang.</strong> Es dokumentiert das
        Gesetzgebungsverfahren und kann bei der Auslegung eines Erlasses beigezogen werden,
        namentlich bei der historischen Auslegung.
        {' '}{MASSGEBLICH_SATZ} Maschinell erfasst, fachlich noch nicht
        geprüft.
      </p>
    );
  }
  return (
    <p data-gattung="erlaeuterungen">
      <strong>Behördenpublikation, kein Gesetzesrang.</strong> Verwaltungsverordnungen
      (Kreisschreiben, Wegleitungen, Leitfäden u.&nbsp;a.) binden die Verwaltung intern und
      sind faktisch praxisleitend, aber für Gerichte und Private nicht direkt verbindlich.
      {' '}{MASSGEBLICH_SATZ} Maschinell erfasst, fachlich noch nicht
      geprüft.
    </p>
  );
}
