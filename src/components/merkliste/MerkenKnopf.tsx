import { merkRoute, schalteMerkung } from '../../lib/merkliste';
import { merkAnsage } from './merkAnsage';
import { useGemerkt } from './useMerkliste';
import { sageKopiertAn } from '../ui/kopierAnsage';

// «Merken» an einer Stelle (Artikel im Leser). Der Knopf kennt Route und Titel von
// aussen; ob die Stelle gemerkt ist, sagt die Merkliste (EINE Quelle, §5). Die
// Ansage geht über dieselbe Live-Region wie «Zitat kopiert» (`ui/kopierAnsage`).
//
// EHRLICH (§8): schreibt der Browser nicht, bleibt der Knopf auf «Merken» und die Ansage
// sagt es; eine volle Liste (50) ist eine andere Ansage als ein gesperrter Speicher
// (`merkAnsage`). Kein «✓» ohne Wirkung.
//
// NAME (WCAG 2.5.3 «Label in Name»): der zugängliche Name ist FEST «Merken: <Titel>» und enthält
// den sichtbaren Text «Merken»; der Zustand steht nur in `aria-pressed` (und im ✓-Zeichen, das
// Screenreader überspringen). Ein wechselnder Name würde bei gedrücktem Knopf «gemerkt»
// doppelt melden («… aus der Merkliste entfernen, gedrückt»).
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
    // Date.now() ist in der Darstellungsschicht erlaubt (nicht in src/lib, §2): reine Anzeige-Metadaten.
    sageKopiertAn(merkAnsage(titel, schalteMerkung({ route, titel, zeit: Date.now() })));
  };
  return (
    <button type="button" onClick={klick} aria-pressed={gemerkt}
      className={`lc-btn-mini ${klasse}`}
      aria-label={`Merken: ${titel}`}
      title={gemerkt ? 'Gemerkt (Merkliste, nur auf diesem Gerät) — erneut klicken zum Entfernen' : 'Auf diesem Gerät merken (Merkliste)'}>
      {gemerkt && <span aria-hidden="true">✓ </span>}Merken
    </button>
  );
}
