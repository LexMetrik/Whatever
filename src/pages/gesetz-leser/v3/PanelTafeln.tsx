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
import { bestimmungDativ, type BestimmungsWort } from './erlassWortlaut';
import { useArtikelMaterialien } from '../artikelMaterialienLaden';
import { werkzeugeAmArtikel } from '../randNotizWerkzeuge';
import { ArtikelErlaeuterung, ArtikelWerkzeug, BlattArtikelGruppe, BlattFassung, type BlattArtikel } from './BlattArtikel';

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
//
// ── S6 W1f (Entscheid David 24.9.2026) · DER ARTIKEL OBEN IN DREI REITERN ──
// Mit der Funktionszeile am Artikelende fällt ihre artikelscharfe Auskunft ins
// Blatt (Herleitung und Tabelle in `./BlattArtikel`): «Änderungen» trägt oben
// die Fassung des aktiven Artikels, «Erläuterungen» und «Werkzeuge» oben seine
// eigene Gruppe vor der erlassweiten Liste. Die Materialien-Liste je Artikel
// lädt über dieselbe Hook und dasselbe Gate wie bisher an der Zeile — ihr
// modulweiter Promise-Cache verhindert einen zweiten Fetch.

export interface PanelTafeln {
  tafeln: Readonly<Record<Exclude<PanelReiter, 'entscheide'>, ReactNode>>;
  /** Der Artikel-Revisions-Shard — geteilt mit der Tafel «Entscheide». */
  artikelRevisionen: Geladen<RevisionShard | null>;
}

export function usePanelTafeln({ erlassKey, laden, quelleUrl, ebene, stichtag, aktArtikel, artikelLabel, blatt, normZitat, wort }: {
  erlassKey: string | undefined;
  /** `zustand.jeGeoeffnet` — das Gate (Herleitung in `./panelKontextLaden`). */
  laden: boolean;
  quelleUrl: string;
  ebene: 'bund' | 'kanton';
  stichtag: string | null;
  aktArtikel: string | null;
  artikelLabel: string | null;
  /** S6 W1f · Eintrag und Historie des aktiven Artikels (`./BlattArtikel`). */
  blatt: BlattArtikel | null;
  /** Kurz-Zitat des aktiven Artikels («Art. 41 OR») und sein Zähl-Substantiv. */
  normZitat: string;
  wort: BestimmungsWort;
}): PanelTafeln {
  const { locale } = useLocale();
  const revisionen = useRevisionen(erlassKey, laden);
  const artikelRevisionen = useArtikelRevisionShard(erlassKey, laden);
  const materialien = useMaterialien(erlassKey, laden, locale);
  const erlaeuterungen = useErlaeuterungen(erlassKey, laden);
  const artikelMaterialien = useArtikelMaterialien(erlassKey, laden);

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
  const token = blatt?.eintrag.artikel ?? null;
  const artMat = token ? artikelMaterialien(token) ?? [] : [];
  const artWz = token ? werkzeugeAmArtikel(erlassKey, token) : [];
  const zu = `Zu ${artikelLabel ?? bestimmungDativ(wort)}`;

  return {
    artikelRevisionen,
    tafeln: {
      aenderungen: (
        <>
          <BlattFassung artikel={blatt} erlassKey={erlassKey} zitat={normZitat} wort={wort} />
          <PanelAenderungen stand={revisionen} quelleUrl={quelleUrl} stichtag={stichtag} ebene={ebene}
            aufhebung={aufhebung} botschaftNachKey={botschaftNachKey} artikel={artikel} locale={locale} />
        </>
      ),
      materialien: (
        <PanelMaterialien stand={materialien} ebene={ebene} locale={locale} aenderungNachBotschaft={aenderungNachBotschaft} />
      ),
      erlaeuterungen: (
        <>
          <BlattArtikelGruppe titel={zu} zahl={artMat.length} daten="erlaeuterungen">
            {artMat.map((m) => <ArtikelErlaeuterung key={m.key} m={m} />)}
          </BlattArtikelGruppe>
          <PanelErlaeuterungen stand={erlaeuterungen} revisionShard={artikelRevisionen.wert} ebene={ebene} />
        </>
      ),
      werkzeuge: (
        <>
          <BlattArtikelGruppe titel={zu} zahl={artWz.length} daten="werkzeuge">
            {artWz.map((w) => <ArtikelWerkzeug key={w.id} w={w} />)}
          </BlattArtikelGruppe>
          <PanelWerkzeuge erlassKey={erlassKey ?? ''} />
        </>
      ),
    },
  };
}
