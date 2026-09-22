import { createContext, useContext, type ReactNode } from 'react';
import { verlaufLabel, type VerlaufManifeste } from '../../lib/verlaufLabel';

// Kontext + Helfer des Inhalts-Kopfs (Einzelansicht «analog Split-View»). Getrennt
// von der Komponente (InhaltsKopf.tsx), damit die Komponenten-Datei nur Komponenten
// exportiert (react-refresh). Reine Daten/Logik (§3).

export interface KopfDaten {
  /** Pfad-Aufteilung; letztes Element = aktuelle Seite. `to` fehlt → nicht klickbar. */
  breadcrumb: { label: string; to?: string }[];
  /** Stand TT.MM.JJJJ (nur wo sinnvoll, z. B. Gesetz). */
  stand?: string | null;
  /** Aktueller Artikel (nur Gesetz, live beim Scrollen), z. B. «Art. 5». */
  artikel?: string | null;
  /** A26 (David 11.7.2026): grundart-spezifisches Bedien-Element, das der Kopf
   *  RECHTS mitführt — beim Gesetzes-Volltext das «Ansicht»-Dropdown
   *  (Darstellungsoptionen), damit es immer sichtbar ist, während man im Gesetz
   *  ist. Der Reader meldet das fertige Element (Layer-Trennung: der Kopf in
   *  components/layout rendert es opak, ohne die Reader-Interna zu kennen); andere
   *  Inhaltstypen lassen es weg → kein Element. */
  ansichtSlot?: ReactNode;
  /** A35-Verlegung (David 19.7.2026): das In-Gesetz-Suchfeld, das der Kopf im rechten
   *  Bedien-Cluster (links vom «Ansicht»-Dropdown) mitführt — beim Gesetzes-Volltext-
   *  Leser in der EINZELansicht. Der Reader baut das fertige Element (er hält den
   *  Such-State/Highlight); der Kopf rendert es opak (Layer-Trennung wie `ansichtSlot`).
   *  Andere Inhaltstypen / der Split-View lassen es weg → kein Element. */
  sucheSlot?: ReactNode;
  /** ── A-2 (Auftrag David 17.8.2026) · DIE SEITE TRÄGT IHRE KOPFZEILE SELBST ──
   *
   *  «beachte dass wir jetzt oben einen header haben mit ähnlichem inhalt … und
   *  darunter … passe das entsprechend sinnvoll an» — zwei Leisten mit derselben
   *  Auskunft (Krume · Ort · Stand · ✕) übereinander. Gemessen 17.8.2026 @1440
   *  unter `?leser=v3`: ZWEI `nav`-Krumen, zwei ✕, 37 px App-Leiste zwischen
   *  Topbar und der Kopfzeile, die dasselbe schon sagt.
   *
   *  Meldet eine Inhaltsseite dieses Feld, dann sagt sie: **ich trage Krume,
   *  Ortsangabe und meine Aktionen selbst.** Wirkung:
   *   · Einzelansicht — `InhaltsKopf` rendert KEINE Leiste mehr (nur seine zwei
   *     Sprung-Rückmeldungen, die keinen Platz brauchen);
   *   · Split-View — `PaneKopf` gibt seinen Identitäts-Teil (Krume · Label ·
   *     Artikel · Stand) ab und behält NUR, was eine Inhaltsseite nicht tragen
   *     kann: Ziehgriff, Umsortieren, Hauptfenster, Teilen, Pane schliessen.
   *
   *  ERWEITERUNGSPUNKT, KEIN SONDERFALL (FL-1): hier steht nichts über den
   *  Gesetzes-Leser und nichts über ein Flag. `layout/**` erfährt aus dem
   *  Vertrag nur, WER die Kopfzeile trägt — nicht, welche Hülle gerade läuft.
   *  Wer das Feld nicht meldet (alle übrigen Inhaltsseiten), bekommt die Leiste
   *  unverändert (FL-4).
   *
   *  Wer es meldet, meldet die übrigen Felder NICHT mehr — auch `breadcrumb`
   *  nicht: sie hätten keinen Leser, und was niemand liest, wird nicht gepflegt
   *  (§17 Rückbau). Eine selbsttragende Seite meldet darum `breadcrumb: []`.
   *  Der Vorteil ist nicht die gesparte Zeile, sondern die Freiheit von den
   *  Daten: die Meldung ist ein KONSTANTER Satz und kann darum im ersten
   *  Render-Commit stehen, bevor irgendein Snapshot geladen ist — sonst rendert
   *  die Shell die Leiste und lässt sie danach zusammenfallen (Layout-Sprung
   *  §15.2; die Messung steht in `pages/GesetzLeser.tsx`,
   *  bis H5 (21.8.2026) `gesetz-leser/GesetzLeserV3.tsx`). */
  kopfzeileSelbst?: boolean;
}

// Melde-Funktion: Inhaltsseiten rufen sie (im Effect) mit ihren Kopfdaten bzw.
// null beim Verlassen. Default-No-op, falls kein Provider (Tests/SSR).
const InhaltsKopfContext = createContext<(d: KopfDaten | null) => void>(() => {});
export const InhaltsKopfMeldeProvider = InhaltsKopfContext.Provider;
export function useMeldeInhaltsKopf(): (d: KopfDaten | null) => void {
  return useContext(InhaltsKopfContext);
}

// Detail-Routen, die einen Kopf bekommen (eine GEÖFFNETE Engine/Gesetz/…), nicht
// Katalog-/Meta-Seiten (Start, /gesetze-Übersicht, Einstellungen …).
const INHALT_RE = /^\/(gesetze\/[^/]+\/[^/]+|rechner\/[^/]+|rechtsprechung\/[^/]+|materialien\/[^/]+|vorlagen\/[^/]+)/;
export function istInhaltsPfad(pfad: string): boolean {
  return INHALT_RE.test(pfad);
}

const SEKTION_LABEL: Record<string, string> = {
  gesetze: 'Gesetze', rechner: 'Rechner', vorlagen: 'Vorlagen',
  rechtsprechung: 'Rechtsprechung', materialien: 'Materialien',
};

// Fallback-Kopfdaten aus dem Pfad: Sektion (klickbar zur Übersicht) › Blatt-Label.
export function kopfVonPfad(pfad: string, manifeste: VerlaufManifeste): KopfDaten {
  const seg = pfad.split('?')[0].split('#')[0].split('/').filter(Boolean);
  const sektion = seg[0] ?? '';
  const breadcrumb: KopfDaten['breadcrumb'] = [];
  if (SEKTION_LABEL[sektion]) breadcrumb.push({ label: SEKTION_LABEL[sektion], to: `/${sektion}` });
  breadcrumb.push({ label: verlaufLabel(pfad, manifeste) });
  return { breadcrumb };
}
