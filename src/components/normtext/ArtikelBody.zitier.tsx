import React from 'react';
import { zitatMitAusweis, heuteIso } from '../../lib/format';
import type { AusweisBasis } from './ArtikelBody.helfer';
import { useKopieren } from '../useKopieren';

// Klickbare Zitat-Marke (Absatznummer oder lit./Ziff.). Kopiert die präzise
// Fundstelle; kurzes ✓ als Rückmeldung. Nur in der Lesesicht (zitierKontext).
// B-6 (QS-BASIS): liegt eine `ausweis`-Basis vor, wird beim Klick der Stand-
// Ausweis (Fassung + Abrufdatum + Permalink, §7 a–d) an die Fundstelle gehängt.
export function ZitierMarke({ zitat, ausweis, sup, klasse, children }: {
  zitat: string; ausweis?: AusweisBasis; sup?: boolean; klasse?: string; children: React.ReactNode;
}) {
  // R4-D (5.9.2026): hier stand eine SECHSTE handgebaute Kopier-Mechanik — und
  // mit 1200 ms die VIERTE Verweildauer, obwohl R3-α die Dauer schon
  // vereinheitlicht hatte. Der R3-α-Wächter sah sie nicht: sein Ausdruck sucht
  // `setKopiert(`, diese Stelle heisst `setOk(`. Ein Wächter, der an einem
  // Variablennamen hängt, bewacht den Namen, nicht die Sache (§6.7) — der
  // R4-D-Sweep geht darum über `clipboard.writeText`.
  const { kopiert: ok, kopieren } = useKopieren();
  const kopiere = () => {
    const text = ausweis && typeof window !== 'undefined'
      ? zitatMitAusweis(zitat, {
          fassung: ausweis.fassung,
          abruf: heuteIso(new Date()),
          permalink: `${window.location.origin}${ausweis.permalinkBasis}`,
        })
      : zitat;
    kopieren(text);
  };
  // DESIGN-D0: `text-brass-700/55` → `text-brass-700`. Die Deckkraft war seit je
  // ein No-op (Fund B4) — ausgeliefert wurde immer das volle brass-700 (5.41:1,
  // AA). Mit dem Wurzel-Fix hätte sie erstmals gegriffen und den Zitierknopf auf
  // 2.2:1 gedrückt (#b9a683 auf Papier), weit unter AA. Ein gedämpfter
  // Ruhezustand wäre eine neue Design-Entscheidung — die trifft nicht D0.
  const knopf = (
    <button type="button" onClick={kopiere} title={`${zitat} — kopieren`} aria-label={`${zitat} — kopieren`}
      className={`num lc-zitiermarke font-semibold cursor-pointer text-brass-700 hover:underline decoration-dotted underline-offset-2 ${klasse ?? ''}`}>
      {ok ? '✓' : children}
    </button>
  );
  return sup ? <sup className="mr-1">{knopf}</sup> : knopf;
}
