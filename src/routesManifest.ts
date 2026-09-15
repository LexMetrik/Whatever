import { type ComponentType, type LazyExoticComponent } from 'react';
import { lazyRetry } from './lazyRetry';

// ─── Datengetriebenes Routen-Register (FAHRPLAN-FUNDAMENT-UMBAU Thema B) ─────
//
// Die Pfad→Lazy-Komponente-Zuordnung lebt EINMAL hier, statt als zweite
// Pfad-Existenz-Quelle neben dem Katalog (startseiteConfig.ts) in App.tsx zu
// stehen (§5-Heilung). App.tsx leitet seine Karten-<Route>s per .map daraus
// ab; src/tests/routenManifest.test.ts gatet die Pfadmenge gegen
// katalogRouten() (= den Katalog) in beide Richtungen — neue Karte ohne
// Manifest-Eintrag (oder umgekehrt) bricht die Suite.
//
// Reines Daten-Modul (kein JSX, keine benannten Komponenten-Consts → kein
// react-refresh-Konflikt): die Lazy-Komponente steht inline als `Comp`.
// App.tsx baut daraus das Element (<r.Comp />).
//
// Sonderrouten bleiben bewusst EXPLIZIT in App.tsx und stehen nicht hier:
// «/» und die Alt-Redirects (/pro, /fachpersonen, /rechner), der
// Fristenspiegel-Redirect (/rechner/fristenspiegel), der Stub (/rechner/:slug),
// die statischen Seiten (/methodik, /ueber, /kontakt, /datenschutz) und der
// NotFound-Catch-all (*) — alle bewusst NICHT im Katalog.
//
// §6.4: Code-Splitting unverändert — jeder Eintrag ist ein eigener STATISCHER
// import() (nur Ladezeitpunkt, keine Logik). KEINE Pfad→Name-Auto-Ableitung:
// die Zuordnung ist nicht aus dem href ableitbar (Gegenbeispiele
// /rechner/betreibungskosten→RechnerGebvKosten, /rechner/bgg-fristen→
// RechnerBgerRechtsweg, /vorlagen/schlichtungsgesuch-bs→…SchlichtungsgesuchBs,
// /vorlagen/nichtbekanntgabe-betreibung→…Nichtbekanntgabe) und wird darum
// explizit gepflegt — ein dynamischer Glob-Import lüde sonst stumm die falsche
// Seite (§1-nah) und zerbräche das je-Seite-Splitting.

export interface RoutenEintrag {
  pfad: string;
  Comp: LazyExoticComponent<ComponentType>;
}

/** Karten-Routen: Pfad ↔ Lazy-Seite. Reihenfolge wie zuvor in App.tsx
 *  (Rechner, dann Vorlagen). Der Stub /rechner/:slug bleibt in App.tsx NACH
 *  dem .map platziert; react-router v6 rankt konkrete vor dynamischen Pfaden. */
export const ROUTEN_MANIFEST: RoutenEintrag[] = [
  // Rechner
  { pfad: '/rechner/kuendigung', Comp: lazyRetry(() => import('./pages/RechnerKuendigung').then((m) => ({ default: m.RechnerKuendigung }))) },
  { pfad: '/rechner/zpo-fristen', Comp: lazyRetry(() => import('./pages/RechnerZpo').then((m) => ({ default: m.RechnerZpo }))) },
  { pfad: '/rechner/verzugszins', Comp: lazyRetry(() => import('./pages/RechnerVerzugszins').then((m) => ({ default: m.RechnerVerzugszins }))) },
  { pfad: '/rechner/gerichtszitat', Comp: lazyRetry(() => import('./pages/RechnerGerichtszitat').then((m) => ({ default: m.RechnerGerichtszitat }))) },
  { pfad: '/rechner/verjaehrung-board', Comp: lazyRetry(() => import('./pages/RechnerVerjaehrungBoard').then((m) => ({ default: m.RechnerVerjaehrungBoard }))) },
  { pfad: '/rechner/inkasso-strecke', Comp: lazyRetry(() => import('./pages/RechnerInkassoStrecke').then((m) => ({ default: m.RechnerInkassoStrecke }))) },
  { pfad: '/rechner/schkg-fristen', Comp: lazyRetry(() => import('./pages/RechnerSchkg').then((m) => ({ default: m.RechnerSchkg }))) },
  { pfad: '/rechner/erbteilung', Comp: lazyRetry(() => import('./pages/RechnerErbteilung').then((m) => ({ default: m.RechnerErbteilung }))) },
  { pfad: '/rechner/erb-fristen', Comp: lazyRetry(() => import('./pages/RechnerErbFristen').then((m) => ({ default: m.RechnerErbFristen }))) },
  { pfad: '/rechner/mietrecht', Comp: lazyRetry(() => import('./pages/RechnerMietrecht').then((m) => ({ default: m.RechnerMietrecht }))) },
  { pfad: '/rechner/verjaehrung', Comp: lazyRetry(() => import('./pages/RechnerVerjaehrung').then((m) => ({ default: m.RechnerVerjaehrung }))) },
  { pfad: '/rechner/gewaehrleistung', Comp: lazyRetry(() => import('./pages/RechnerGewaehrleistung').then((m) => ({ default: m.RechnerGewaehrleistung }))) },
  { pfad: '/rechner/tagerechner', Comp: lazyRetry(() => import('./pages/RechnerTagerechner').then((m) => ({ default: m.RechnerTagerechner }))) },
  { pfad: '/rechner/teuerung', Comp: lazyRetry(() => import('./pages/RechnerTeuerung').then((m) => ({ default: m.RechnerTeuerung }))) },
  { pfad: '/rechner/zustaendigkeit', Comp: lazyRetry(() => import('./pages/RechnerZustaendigkeit').then((m) => ({ default: m.RechnerZustaendigkeit }))) },
  { pfad: '/rechner/streitwert', Comp: lazyRetry(() => import('./pages/RechnerStreitwert').then((m) => ({ default: m.RechnerStreitwert }))) },
  { pfad: '/rechner/betreibungskosten', Comp: lazyRetry(() => import('./pages/RechnerGebvKosten').then((m) => ({ default: m.RechnerGebvKosten }))) },
  { pfad: '/rechner/prozesskosten', Comp: lazyRetry(() => import('./pages/RechnerProzesskosten').then((m) => ({ default: m.RechnerProzesskosten }))) },
  { pfad: '/rechner/notariat-grundbuch', Comp: lazyRetry(() => import('./pages/RechnerNotariatGrundbuch').then((m) => ({ default: m.RechnerNotariatGrundbuch }))) },
  { pfad: '/rechner/bgg-fristen', Comp: lazyRetry(() => import('./pages/RechnerBgerRechtsweg').then((m) => ({ default: m.RechnerBgerRechtsweg }))) },
  // Vorlagen
  { pfad: '/vorlagen/testament', Comp: lazyRetry(() => import('./pages/VorlageTestament').then((m) => ({ default: m.VorlageTestament }))) },
  { pfad: '/vorlagen/patientenverfuegung', Comp: lazyRetry(() => import('./pages/VorlagePatientenverfuegung').then((m) => ({ default: m.VorlagePatientenverfuegung }))) },
  { pfad: '/vorlagen/vorsorgeauftrag', Comp: lazyRetry(() => import('./pages/VorlageVorsorgeauftrag').then((m) => ({ default: m.VorlageVorsorgeauftrag }))) },
  { pfad: '/vorlagen/schlichtungsgesuch-bs', Comp: lazyRetry(() => import('./pages/VorlageSchlichtungsgesuchBs').then((m) => ({ default: m.VorlageSchlichtungsgesuchBs }))) },
  { pfad: '/vorlagen/arbeitsvertrag', Comp: lazyRetry(() => import('./pages/VorlageArbeitsvertrag').then((m) => ({ default: m.VorlageArbeitsvertrag }))) },
  { pfad: '/vorlagen/mietvertrag', Comp: lazyRetry(() => import('./pages/VorlageMietvertrag').then((m) => ({ default: m.VorlageMietvertrag }))) },
  { pfad: '/vorlagen/auftrag', Comp: lazyRetry(() => import('./pages/VorlageAuftrag').then((m) => ({ default: m.VorlageAuftrag }))) },
  { pfad: '/vorlagen/werkvertrag', Comp: lazyRetry(() => import('./pages/VorlageWerkvertrag').then((m) => ({ default: m.VorlageWerkvertrag }))) },
  { pfad: '/vorlagen/nda', Comp: lazyRetry(() => import('./pages/VorlageNda').then((m) => ({ default: m.VorlageNda }))) },
  { pfad: '/vorlagen/konkubinat', Comp: lazyRetry(() => import('./pages/VorlageKonkubinat').then((m) => ({ default: m.VorlageKonkubinat }))) },
  { pfad: '/vorlagen/vollmacht', Comp: lazyRetry(() => import('./pages/VorlageVollmacht').then((m) => ({ default: m.VorlageVollmacht }))) },
  { pfad: '/vorlagen/klage-vereinfacht', Comp: lazyRetry(() => import('./pages/VorlageKlageVereinfacht').then((m) => ({ default: m.VorlageKlageVereinfacht }))) },
  { pfad: '/vorlagen/klage-ordentlich', Comp: lazyRetry(() => import('./pages/VorlageKlageOrdentlich').then((m) => ({ default: m.VorlageKlageOrdentlich }))) },
  { pfad: '/vorlagen/kuendigung-arbeitnehmer', Comp: lazyRetry(() => import('./pages/VorlageKuendigungArbeitnehmer').then((m) => ({ default: m.VorlageKuendigungArbeitnehmer }))) },
  { pfad: '/vorlagen/kuendigung-arbeitgeber', Comp: lazyRetry(() => import('./pages/VorlageKuendigungArbeitgeber').then((m) => ({ default: m.VorlageKuendigungArbeitgeber }))) },
  { pfad: '/vorlagen/kuendigung-mieter', Comp: lazyRetry(() => import('./pages/VorlageKuendigungMieter').then((m) => ({ default: m.VorlageKuendigungMieter }))) },
  { pfad: '/vorlagen/kuendigung-vertrag', Comp: lazyRetry(() => import('./pages/VorlageKuendigungVertrag').then((m) => ({ default: m.VorlageKuendigungVertrag }))) },
  { pfad: '/vorlagen/kuendigung-vermieter', Comp: lazyRetry(() => import('./pages/VorlageKuendigungVermieter').then((m) => ({ default: m.VorlageKuendigungVermieter }))) },
  { pfad: '/vorlagen/mahnung', Comp: lazyRetry(() => import('./pages/VorlageMahnung').then((m) => ({ default: m.VorlageMahnung }))) },
  { pfad: '/vorlagen/rubrum', Comp: lazyRetry(() => import('./pages/VorlageRubrum').then((m) => ({ default: m.VorlageRubrum }))) },
  { pfad: '/vorlagen/verjaehrungsverzicht', Comp: lazyRetry(() => import('./pages/VorlageVerjaehrungsverzicht').then((m) => ({ default: m.VorlageVerjaehrungsverzicht }))) },
  { pfad: '/vorlagen/forderungsabtretung', Comp: lazyRetry(() => import('./pages/VorlageForderungsabtretung').then((m) => ({ default: m.VorlageForderungsabtretung }))) },
  { pfad: '/vorlagen/fristerstreckung', Comp: lazyRetry(() => import('./pages/VorlageFristerstreckung').then((m) => ({ default: m.VorlageFristerstreckung }))) },
  { pfad: '/vorlagen/nichtbekanntgabe-betreibung', Comp: lazyRetry(() => import('./pages/VorlageNichtbekanntgabe').then((m) => ({ default: m.VorlageNichtbekanntgabe }))) },
  { pfad: '/vorlagen/scheidungsklage', Comp: lazyRetry(() => import('./pages/VorlageScheidungsklage').then((m) => ({ default: m.VorlageScheidungsklage }))) },
  { pfad: '/vorlagen/scheidungsbegehren-gemeinsam', Comp: lazyRetry(() => import('./pages/VorlageScheidungsbegehren').then((m) => ({ default: m.VorlageScheidungsbegehren }))) },
  { pfad: '/vorlagen/eheschutzgesuch', Comp: lazyRetry(() => import('./pages/VorlageEheschutzgesuch').then((m) => ({ default: m.VorlageEheschutzgesuch }))) },
  { pfad: '/vorlagen/gmbh-gruendung', Comp: lazyRetry(() => import('./pages/VorlageGmbhGruendung').then((m) => ({ default: m.VorlageGmbhGruendung }))) },
  { pfad: '/vorlagen/ag-gruendung', Comp: lazyRetry(() => import('./pages/VorlageAgGruendung').then((m) => ({ default: m.VorlageAgGruendung }))) },
  { pfad: '/vorlagen/kapitalerhoehung', Comp: lazyRetry(() => import('./pages/VorlageKapitalerhoehung').then((m) => ({ default: m.VorlageKapitalerhoehung }))) },
];
