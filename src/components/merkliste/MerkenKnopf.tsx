import { merkRoute, schalteMerkung } from '../../lib/merkliste';
import { useGemerkt } from './useMerkliste';
import { sageKopiertAn } from '../ui/kopierAnsage';

// «Merken» an einer Stelle (Artikel im Leser). Der Knopf kennt Route und Titel von
// aussen; ob die Stelle gemerkt ist, sagt die Merkliste (EINE Quelle, §5). Die
// Ansage geht über dieselbe Live-Region wie «Zitat kopiert» (`ui/kopierAnsage`).
//
// EHRLICH BEI GESPERRTEM SPEICHER (§8): schreibt der Browser nicht, bleibt der
// Knopf auf «Merken» und die Ansage sagt es — kein «✓ gemerkt» ohne Wirkung.
export function MerkenKnopf({ pfad, anker, titel, klasse }: {
  /** Pfad des Erlasses/Entscheids ohne Anker (`/gesetze/bund/OR`). */
  pfad: string;
  /** Anker roh, ohne `#` (`art-336c`) — oder weglassen für die ganze Seite. */
  anker?: string;
  /** Anzeigename der Stelle («Art. 336c OR»). */
  titel: string;
  klasse: string;
}) {
  const route = merkRoute(pfad, anker);
  const gemerkt = useGemerkt(route);
  if (!route) return null;
  const klick = () => {
    const vorher = gemerkt;
    // Date.now() ist in der Darstellungsschicht erlaubt (nicht in src/lib, §2): reine Anzeige-Metadaten.
    const danach = schalteMerkung({ route, titel, zeit: Date.now() });
    if (danach === vorher) sageKopiertAn('Merkliste nicht gespeichert: der Browser lässt keinen Speicher zu');
    else sageKopiertAn(danach ? `${titel} gemerkt` : `${titel} aus der Merkliste entfernt`);
  };
  return (
    <button type="button" onClick={klick} aria-pressed={gemerkt}
      className={`lc-btn-mini ${klasse}`}
      aria-label={gemerkt ? `${titel} aus der Merkliste entfernen` : `${titel} merken`}
      title="Auf diesem Gerät merken (Merkliste)">{gemerkt ? '✓ gemerkt' : 'Merken'}</button>
  );
}
