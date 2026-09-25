import { BEGRUENDUNG_VORBEHALT } from '../lib/begruendung';
import { KopierButton } from './vorlagen/ui';

// ─── «Für die Rechtsschrift»-Absatz — geteilter Baustein (FAHRPLAN-PRAXIS 2.2) ─
// Zeigt den kopierfertigen Begründungs-Absatz (lib/begruendung.ts) und
// kopiert ihn mit einem Klick. Reine Darstellung (§3). Die EINE Aufrufstelle
// pro Form ist BegruendungSlot (B2-0); diese Komponente rendert den fertigen
// Text. Copy-Mechanik: der geteilte KopierButton (R2-E/F1-10, intern
// useKopieren aus B2-1); Vorbehalt: lib-Konstante (§5/§8).

export function BegruendungAbsatz({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <details className="lc-card p-4">
      <summary className="cursor-pointer text-body-s font-medium text-ink-700">
        Für die Rechtsschrift — kopierfertiger Begründungs-Absatz
      </summary>
      {/* QS-UI 8b (B2 «gesetzte Lesespalte»): Beide Absätze liefen über die volle
          Kartenbreite — gemessen 876 px gegen die 640-px-Lesespalte (`max-w-reading`,
          40rem), auf allen 14 Rechner-Flächen, die diesen geteilten Baustein
          rendern. B2 verbietet volle Fensterbreite für Fliesstext ausdrücklich; und
          gerade DIESER Absatz wird gelesen, bevor er in die Rechtsschrift wandert.
          Reine Breitenbegrenzung: Wortlaut und Kopier-Inhalt bleiben unberührt
          (der Text kommt unverändert aus `lib/begruendung.ts`, §5). */}
      <p className="mt-3 text-body-s text-ink-900 leading-relaxed bg-paper-sunken rounded-md p-3 select-all max-w-reading-s">
        {text}
      </p>
      <KopierButton text={text} gegenstand="Absatz" className="lc-btn-outline lc-btn-sm mt-3" />
      <p className="text-xs text-ink-500 mt-2 max-w-reading">
        {BEGRUENDUNG_VORBEHALT}
      </p>
    </details>
  );
}
