import { useMemo, type ReactNode } from 'react';
import { useLocale } from '../../../components/locale';
import { aufhebungFuerRegister } from '../../../lib/normtext/aufhebungen';
import { revisionFuerToken, type RevisionShard } from '../../../lib/verzahnung/artikel-revisionen';
import type { BotschaftBezug } from '../../../lib/materialien/botschaften';
import { PanelAenderungen } from './PanelAenderungen';
import { PanelMaterialien } from './PanelMaterialien';
import { PanelErlaeuterungen } from './PanelErlaeuterungen';
import { PanelWerkzeuge } from './PanelWerkzeuge';
import { useArtikelRevisionShard, useErlaeuterungen, useMaterialien, useRevisionen, type Geladen } from './panelKontextLaden';
import type { PanelReiter } from './panelModell';

// ─── Die vier ERLASS-weiten Tafeln des Blatts (S6, 23.9.2026) ───────────────
//
// Laden und Verdrahten der Reiter Änderungen · Materialien · Erläuterungen ·
// Werkzeuge an EINER Stelle. Stand bis hierher in `LeserPanelZone.tsx`; mit dem
// fünften Reiter und den Querverweisen zwischen den Tafeln (Botschaft ↔
// Änderungserlass, Artikel-Revision ↔ Änderungszeile) wäre die Zone über den
// Datei-Deckel gewachsen — und sie soll ANORDNEN, nicht verdrahten (§3).
// «Entscheide» bleibt in der Zone: die Tafel hängt an den Bezugs-Facetten, die
// die Zone ohnehin hält.
//
// ── QUERVERWEISE OHNE ZWEITEN FETCH (§15) ───────────────────────────────────
// Die Tafeln lesen einander nur aus Daten, die ohnehin geladen sind: der
// Reiter «Änderungen» nennt die Botschaft eines Änderungserlasses aus der
// Botschaften-Liste des Reiters «Materialien» (`botschaftKey`, nur bei belegtem
// Match) — und «Materialien» nennt umgekehrt den Änderungserlass, zu dem eine
// Botschaft geführt hat. Beide Listen kommen aus demselben Gate (Panel war
// offen), keine zusätzliche Anfrage.

export interface PanelTafeln {
  tafeln: Readonly<Record<Exclude<PanelReiter, 'entscheide'>, ReactNode>>;
  /** Der Artikel-Revisions-Shard — geteilt mit der Tafel «Entscheide». */
  artikelRevisionen: Geladen<RevisionShard | null>;
}

export function usePanelTafeln({ erlassKey, laden, quelleUrl, ebene, stichtag, aktArtikel, artikelLabel }: {
  erlassKey: string | undefined;
  /** `zustand.jeGeoeffnet` — das Gate (Herleitung in `./panelKontextLaden`). */
  laden: boolean;
  quelleUrl: string;
  ebene: 'bund' | 'kanton';
  stichtag: string | null;
  aktArtikel: string | null;
  artikelLabel: string | null;
}): PanelTafeln {
  const { locale } = useLocale();
  const revisionen = useRevisionen(erlassKey, laden);
  const artikelRevisionen = useArtikelRevisionShard(erlassKey, laden);
  const materialien = useMaterialien(erlassKey, laden, locale);
  const erlaeuterungen = useErlaeuterungen(erlassKey, laden);

  const botschaftNachKey = useMemo(() => new Map<string, BotschaftBezug>(
    (materialien.wert?.botschaften ?? []).map((b) => [b.key, b]),
  ), [materialien.wert]);
  const aenderungNachBotschaft = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of revisionen.wert?.revisionen ?? []) {
      if (r.botschaftKey && r.roFundstelle && !m.has(r.botschaftKey)) m.set(r.botschaftKey, r.roFundstelle);
    }
    return m;
  }, [revisionen.wert]);

  const artRev = aktArtikel ? revisionFuerToken(artikelRevisionen.wert, aktArtikel) : undefined;
  const artikel = artRev && artikelLabel ? { label: artikelLabel, revision: artRev } : null;
  const aufhebung = erlassKey ? aufhebungFuerRegister(erlassKey) : undefined;

  return {
    artikelRevisionen,
    tafeln: {
      aenderungen: (
        <PanelAenderungen stand={revisionen} quelleUrl={quelleUrl} stichtag={stichtag} ebene={ebene}
          aufhebung={aufhebung} botschaftNachKey={botschaftNachKey} artikel={artikel} locale={locale} />
      ),
      materialien: (
        <PanelMaterialien stand={materialien} ebene={ebene} locale={locale} aenderungNachBotschaft={aenderungNachBotschaft} />
      ),
      erlaeuterungen: <PanelErlaeuterungen stand={erlaeuterungen} revisionShard={artikelRevisionen.wert} ebene={ebene} />,
      werkzeuge: <PanelWerkzeuge erlassKey={erlassKey ?? ''} />,
    },
  };
}
