import { lazyRetry, type VorwaermbareKomponente } from './lazyRetry';

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
// Sonderrouten standen bewusst EXPLIZIT im Routen-Baum und nicht hier — «/»
// und die Alt-Redirects (/pro, /fachpersonen, /rechner), der
// Fristenspiegel-Redirect (/rechner/fristenspiegel), der Stub (/rechner/:slug),
// die statischen Seiten (/methodik, /ueber, /kontakt, /datenschutz) und der
// NotFound-Catch-all (*), alle bewusst NICHT im Katalog. Seit dem
// QS-BASIS-Nachzug (15.9.2026) gilt das nur noch für die Redirects, die
// dynamischen Pfade und den Catch-all; die PRERENDERTEN statischen Seiten sind
// als STATISCHE_SEITENROUTEN hierher gezogen, weil `main.tsx` sie nachschlagen
// können muss (Begründung am Block unten).
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
  /** Die code-gesplittete Seite. Seit dem QS-BASIS-Nachzug (15.9.2026)
   *  vorwärmbar: `main.tsx` löst den Chunk der aktuellen Route VOR
   *  `hydrateRoot` auf, damit der prerenderte Inhalt hydriert statt ersetzt
   *  wird (Herleitung in `src/lazyRetry.ts`). */
  Comp: VorwaermbareKomponente;
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

// ─── Statische Seitenrouten: EINE Quelle für Baum UND Vorwärmen ────────────
//
// WARUM SIE SEIT DEM QS-BASIS-NACHZUG (15.9.2026) HIER STEHEN und nicht mehr
// als vierzehn einzelne `<Route>`-Zeilen in `RouteSwitch.tsx`:
// `main.tsx` muss den Seiten-Chunk der aktuellen Route VOR `hydrateRoot`
// auflösen, sonst suspendiert die Route und der prerenderte Inhalt wird
// ersetzt statt übernommen (Herleitung und Messung in `src/lazyRetry.ts`).
// Dafür braucht es eine Pfad→Seite-Tabelle, die man NACHSCHLAGEN kann — und
// zwar genau die, aus der auch der Routen-Baum entsteht; eine zweite,
// danebenstehende Vorwärm-Liste wäre eine still driftende zweite Wahrheit
// (§5), mit dem kaum bemerkbaren Schaden, dass eine einzelne Seite wieder
// ersetzt statt hydriert wird. Der Baum selbst ist unverändert: `RouteSwitch`
// rendert diese Einträge per `.map` an derselben Stelle, an der die Zeilen
// standen, und react-router v6 rankt konkrete Pfade vor dynamischen (dieselbe
// Zusage, auf die sich das ROUTEN_MANIFEST-.map und der Stub `/rechner/:slug`
// schon bisher stützen).
//
// Diese vierzehn Pfade sind die statischen Seiten, die `scripts/prerender.ts`
// schreibt (`lib/seo` → `STATISCHE_SEITEN`); zusammen mit den fünfzig
// Karten-Routen oben sind sie die 64 Routen, die `main.tsx` hydriert.
// NICHT hier (und bewusst weiter als eigene `<Route>` in `RouteSwitch.tsx`):
// die Redirect-Routen (/pro, /fachpersonen, /recherche, /international,
// /rechner/fristenspiegel), die dynamischen Pfade (/rechner/:slug,
// /gesetze/:ebene(/:key), /rechtsprechung/:key, /materialien/:key) und der
// Catch-all — nichts davon wird prerendert, nichts davon ist vorzuwärmen.
export const STATISCHE_SEITENROUTEN: RoutenEintrag[] = [
  { pfad: '/', Comp: lazyRetry(() => import('./pages/Startseite').then((m) => ({ default: m.Startseite }))) },
  // Rubrik-Übersichten (UI-Welle): /rechner und /vorlagen lösen die frühere
  // /recherche-Such-Seite ab — eigene Browse-Übersichten analog /gesetze; die
  // Suche lebt seither im Header-Dropdown.
  { pfad: '/rechner', Comp: lazyRetry(() => import('./pages/RechnerUebersicht').then((m) => ({ default: m.RechnerUebersicht }))) },
  { pfad: '/vorlagen', Comp: lazyRetry(() => import('./pages/VorlagenUebersicht').then((m) => ({ default: m.VorlagenUebersicht }))) },
  // Rubrik V «Gesetze» (browsbare Rechtssammlung) — eigenständige Nav-Sektion,
  // KEINE Katalog-Oberkategorie (oberkategorien.ts unberührt). Die Lesesicht
  // /gesetze/:ebene/:key ist client-lazy und steht im Baum, nicht hier.
  { pfad: '/gesetze', Comp: lazyRetry(() => import('./pages/Gesetze').then((m) => ({ default: m.Gesetze }))) },
  // Rubrik VI «Rechtsprechung» (Bundesgerichtsentscheide) — analog zu Gesetze:
  // Übersicht prerendert, Reader /rechtsprechung/:key client-lazy.
  { pfad: '/rechtsprechung', Comp: lazyRetry(() => import('./pages/Rechtsprechung').then((m) => ({ default: m.Rechtsprechung }))) },
  // Rubrik «Materialien»: amtliche Ressourcen / Soft-Law (Kreisschreiben,
  // Wegleitungen, Leitfäden …) — alle nur-live-link (amtliche Quelle), kein
  // Volltext-Snapshot. Detail /materialien/:key steht im Baum.
  { pfad: '/materialien', Comp: lazyRetry(() => import('./pages/Materialien').then((m) => ({ default: m.Materialien }))) },
  // W2·6c-DECKUNGS-SEITE (§11.5): «was wir nicht haben» — die Deckungs-Seite
  // der Entstehungsgeschichte. Konkreter Pfad UNTER /materialien; weil alle
  // Material-Schlüssel versal sind, kann der kleingeschriebene ihn auch
  // inhaltlich nicht verschatten (Tor: routenManifest-Test).
  { pfad: '/materialien/deckung', Comp: lazyRetry(() => import('./pages/MaterialienDeckung').then((m) => ({ default: m.MaterialienDeckung }))) },
  { pfad: '/methodik', Comp: lazyRetry(() => import('./pages/Methodik').then((m) => ({ default: m.Methodik }))) },
  { pfad: '/ueber', Comp: lazyRetry(() => import('./pages/Ueber').then((m) => ({ default: m.Ueber }))) },
  { pfad: '/kontakt', Comp: lazyRetry(() => import('./pages/Kontakt').then((m) => ({ default: m.Kontakt }))) },
  { pfad: '/datenschutz', Comp: lazyRetry(() => import('./pages/Datenschutz').then((m) => ({ default: m.Datenschutz }))) },
  { pfad: '/einstellungen', Comp: lazyRetry(() => import('./pages/Einstellungen').then((m) => ({ default: m.Einstellungen }))) },
  // UI-NAV S3/E1: Korpus-Abdeckungsseite «Was ist drin» (Suche-Fusszeile verlinkt hierher).
  { pfad: '/abdeckung', Comp: lazyRetry(() => import('./pages/Abdeckung').then((m) => ({ default: m.Abdeckung }))) },
  // UI-NAV S5: Volltext-Ergebnisseite (?q=) — macht die im Dropdown gekappten
  // Treffer zugänglich (bes. die Gesetzestext-Gruppe). Additiv zum A5/A6-Dropdown.
  { pfad: '/suche', Comp: lazyRetry(() => import('./pages/Suche').then((m) => ({ default: m.Suche }))) },
];

/** Adress-Vergleich ohne den Schlusstrich (`/rechner/x/` == `/rechner/x`) —
 *  wortgleich zu `main.tsx`, das denselben Vergleich am Prerender-Marker
 *  führt. */
const ohneSchlusstrich = (p: string) => (p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p);

/**
 * Den Seiten-Chunk dieses Pfades anfordern — für `main.tsx` VOR `hydrateRoot`.
 * Unbekannter Pfad (Detailseite, Redirect, 404) → `undefined`: dann gibt es
 * nichts vorzuwärmen, und der Aufrufer startet ohne Warten.
 */
export function vorwaermenFuerPfad(pfad: string): Promise<unknown> | undefined {
  const gesucht = ohneSchlusstrich(pfad);
  const eintrag = STATISCHE_SEITENROUTEN.find((r) => r.pfad === gesucht)
    ?? ROUTEN_MANIFEST.find((r) => r.pfad === gesucht);
  return eintrag?.Comp.vorwaermen();
}
