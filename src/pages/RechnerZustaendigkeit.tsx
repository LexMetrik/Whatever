import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { useNavigate, useLocation } from 'react-router-dom';
import { ZustaendigkeitForm } from '../components/forms/ZustaendigkeitForm';
import { BekannteFehlerRahmen } from '../components/BekannterFehler';
import { RechnerKopf } from '../components/layout/RechnerKopf';
import { getCalculator } from '../lib/calculators';
import type { Rechtsweg } from '../lib/zustaendigkeit';

// Zuständigkeitsrechner unter /rechner/zustaendigkeit (Phase 3 des Auftrags
// ZUSTAENDIGKEIT-AUFTRAG.md). Pflicht-Disclaimer prominent in der Form.
//
// Hero je Rechtsweg (Fix 6.6.2026, Befund David): Der Kopf zeigte unabhängig
// vom gewählten Rechtsweg immer die ZPO-Chips der Registry — Kategorie,
// Beschrieb und Norm-Chips folgen jetzt der Auswahl (reine Anzeige, §3/§5:
// die Zivil-Werte bleiben einzig in der Registry gepflegt).
const HERO_JE_RECHTSWEG: Record<Exclude<Rechtsweg, 'zivil' | 'verwaltung'>, {
  titel: string; kategorie: string; kurzbeschrieb: string; normen: string[];
}> = {
  schkg: {
    // S-3 Struktur-Umbau 10.6.2026: Titel folgt der Rechtsweg-Karte
    // (Registry-Titel = Zivil-Default «Zuständigkeit Zivilprozess»).
    titel: 'Zuständigkeit Vollstreckung (SchKG)',
    kategorie: 'SchKG',
    kurzbeschrieb:
      'Betreibungsort, zuständige Stelle (Betreibungsamt, Gericht oder Aufsichtsbehörde) und Fristen je '
      + 'Anliegen — von der Einleitung der Betreibung bis zur Beschwerde gegen das Amt.',
    normen: ['Art. 46–55 SchKG', 'Art. 84 SchKG', 'Art. 272 SchKG', 'Art. 17 SchKG'],
  },
  straf: {
    titel: 'Zuständigkeit Strafverfahren',
    kategorie: 'Strafprozess',
    kurzbeschrieb:
      'Örtlicher Gerichtsstand und zuständige Strafbehörde (Art. 31–42 StPO), Anzeige-Fahrplan sowie das '
      + 'statthafte Rechtsmittel mit Fristen (Art. 379 ff. StPO).',
    normen: ['Art. 31–42 StPO', 'Art. 301 StPO', 'Art. 379 ff. StPO'],
  },
};

// Hash-Anker der Katalog-Split-Karten (schkg-/straf-zustaendigkeit, 6.6.2026)
// → Rechtsweg-Vorauswahl, Muster wie RechnerKuendigung (#lohnfortzahlung).
/** Karten-id je Rechtsweg für den Warnhinweis (`lib/bekannteFehler`). */
const WERKZEUG_JE_RECHTSWEG: Record<Rechtsweg, string> = {
  zivil: 'zustaendigkeit',
  verwaltung: 'zustaendigkeit',
  schkg: 'schkg-zustaendigkeit',
  straf: 'straf-zustaendigkeit',
};

const HASH_WEG: Record<string, Rechtsweg> = {
  '#schkg': 'schkg',
  '#straf': 'straf',
};

export function RechnerZustaendigkeit() {
  const calc = getCalculator('zustaendigkeit')!;
  const { hash, pathname, search } = useLocation();
  const navigate = useNavigate();
  const [rechtsweg, setRechtsweg] = useState<Rechtsweg>(HASH_WEG[hash] ?? 'zivil');
  // Bug-Check 10.6.2026 (HOCH): Der Rechtsweg-Wechsel schreibt den Hash in
  // die URL — die Teilen-Links der SchKG-/Straf-Sichten funktionieren nur
  // mit #schkg/#straf (LinkTeilenButton kopiert pathname+query+HASH; ohne
  // Hash landete der Empfänger auf dem Zivil-Default und sah die geteilten
  // s-/t-Parameter nie).
  const wegWechsel = (w: Rechtsweg) => {
    setRechtsweg(w);
    const ziel = w === 'schkg' ? '#schkg' : w === 'straf' ? '#straf' : '';
    if (ziel !== hash) navigate({ pathname, search, hash: ziel }, { replace: true });
  };

  // Hash-Navigation bei bereits gemounteter Seite (z. B. «Verwandte Rechner») —
  // Sync während des Renderns statt im Effect (React-Pattern «adjusting state»).
  const [letzterHash, setLetzterHash] = useState(hash);
  if (hash !== letzterHash) {
    setLetzterHash(hash);
    if (HASH_WEG[hash]) setRechtsweg(HASH_WEG[hash]);
  }

  const hero = rechtsweg === 'schkg' || rechtsweg === 'straf' ? HERO_JE_RECHTSWEG[rechtsweg] : null;
  return (
    <div className="space-y-6">
      <RechnerKopf
        calc={calc}
        titelOverride={hero?.titel}
        kategorieOverride={hero?.kategorie}
        kurzbeschriebOverride={hero?.kurzbeschrieb}
        normenOverride={hero?.normen}
      />
      <Card>
        {/* WARNHINWEIS: Karte je Rechtsweg (zivil/verwaltung → zustaendigkeit). */}
        <BekannteFehlerRahmen werkzeug={WERKZEUG_JE_RECHTSWEG[rechtsweg]}>
          <ZustaendigkeitForm onRechtswegChange={wegWechsel} rechtswegVorwahl={HASH_WEG[hash]} />
        </BekannteFehlerRahmen>
      </Card>
    </div>
  );
}
