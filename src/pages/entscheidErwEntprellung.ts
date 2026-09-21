import { useEffect, useRef, useState } from 'react';

// ── §15 · DER ENTPRELL-HOOK VON `ErwBereich` (`entscheidErwBereich.tsx`) ────
//
// EIGENE DATEI (21.9.2026, `react-refresh/only-export-components`): der Hook
// exportiert keine Komponente, `ErwBereich` daneben schon — ein File-Export
// mit beidem bricht Fast Refresh. Reiner Zustands-Hook, unverändert aus dem
// Rumpf von `ErwBereich` herausgelöst (§6.3: keine bestehende Zusicherung
// ändert sich, nur der Ort). Herleitung der 0-ms/200-ms-Regel und der
// Nachträge 21.9.2026 (Falsifikation der §8-Zusage, Mess-Nachtrag zur
// Hervorhebung): `entscheidErwBereich.tsx`, oberhalb von `ErwBereich`.
// `src/tests/entscheid-erw-entprellung.test.tsx` prüft ihn direkt mit
// Fake-Timern, statt die ganze Komponente zu montieren.
export function useSucheGewertet(suche: string): string {
  const gewertetRef = useRef('');
  const [sucheGewertet, setSucheGewertet] = useState('');
  useEffect(() => {
    const sofort = suche.trim() === '' || gewertetRef.current.trim() === '';
    const id = window.setTimeout(() => {
      gewertetRef.current = suche;
      setSucheGewertet(suche);
    }, sofort ? 0 : 200);
    return () => window.clearTimeout(id);
  }, [suche]);
  return sucheGewertet;
}
