import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  kontextSync, kontextEntscheide, kontextSoftLaw, mischeMaterialien, normenFuer,
  type KontextTyp, type EntscheidRef, type MaterialBezug, type ArtikelKontextAnsicht,
} from '../../lib/kontext';
import { ladeLeitfallShard, artikelProEntscheid } from '../../lib/rechtsprechung/norm-index';
import { artikelWerkzeugGruppen } from '../../lib/normtext/werkzeuge';
import { botschaftenFuer, type BotschaftBezug } from '../../lib/materialien/botschaften';
import { revisionenFuerNorm, type RevisionAnsicht, type RevisionBezug } from '../../lib/normtext/revisionen';
import { vernehmlassungenFuer, VERNEHMLASSUNG_STATUS_LABEL, type VernehmlassungBezug } from '../../lib/materialien/vernehmlassungen';
import { AMTLICHE_FASSUNG_NOMEN } from '../../lib/benennung';
import { datumCh } from '../../lib/normtext/erlassKopfText';
import { AbrufFehler } from '../ui/AbrufFehler';
import { TitelRueckfallZeile } from './TitelRueckfallZeile';
import { Datum } from '../ui/Datum';
import { GruppenKopf } from '../ui/GruppenKopf';
import { Leerzustand } from '../ui/Leerzustand';
import { useLocale, fedlexLokalisiert } from '../locale';
import { usePaneSteuerung } from '../layout/usePaneLayout';
import { KantenChip } from '../verzahnung/KantenChip';
import { StatusBadge } from '../verzahnung/StatusBadge';
import { ZeichenLegende } from '../verzahnung/ZeichenLegende';
import { ArtikelKontextZeilen } from './ArtikelKontextGruppe';
import { RevisionenGruppe } from './RevisionenGruppe';
// §6.6-Split (9.8.2026): die geteilte Gruppen-Hülle lebt daneben; der
// Re-Export hält den bisherigen Import-Pfad `./KontextPanel` für alle
// Bestands-Aufrufer stabil (§6 Ziff. 3 — kein Test wird angefasst).
import { KontextGruppe } from './KontextGruppe';
export { KontextGruppe } from './KontextGruppe';
import {
  ladeRevisionShard, revisionFuerToken, klassifiziereFassungsBezug, entscheidDatum,
  revisionDetailText, type RevisionShard,
} from '../../lib/verzahnung/artikel-revisionen';

// ─── Einheitliches «Kontext»-Panel (B3) ─────────────────────────────────────
//
// EIN wiederverwendbares Panel für alle drei Korpus-Reader (Gesetz, Entscheid,
// Material). Es zeigt die fremden Korpora, die über die `normKeys` der Quelle
// verknüpft sind: Norm → Entscheide/Materialien/Werkzeuge; Entscheid →
// Normen/Materialien/Werkzeuge; Material → Normen/Entscheide/Werkzeuge. Reine
// Darstellung (§3) — Auflösung liegt in lib/kontext.ts. Verknüpfungen sind
// maschinell über zitierte Normen — §8 ehrlich gekennzeichnet, keine
// redaktionelle Auswahl. Voller Zustands-Bogen inkl. ruhigem Leerzustand (§13/F4).
//
// V1.2 (W2·7-VZUI, FAHRPLAN-VERZAHNUNG-UI §1.4): die bestehende `Gruppe`-Hülle
// trägt drei Pflicht-Props — Richtungs-Label als lc-overline (Beziehungstyp als
// TEXT, nie Farbe: «Wendet an» / «Wird zitiert von» / «Legt aus»), Zähler und
// kontexttyp-spezifischen Hinweis (Zähler-Formel «n erfasste …», Grammatik-Regel
// 6). BEWUSST kein Registry-Refactor (§0-3a): die vier JSX-Blöcke bleiben; die
// Registry kommt in V2 mit dem fünften (asynchronen) Gruppentyp.
// Erweiterungspunkt V2: Gruppe «Wird zitiert von» am Entscheid (Edge-Query auf
// zitat_kanten) dockt hier als weiterer JSX-Block an.

const MAX_ENTSCHEIDE = 8;
const MAX_MATERIALIEN = 8;
const MAX_BOTSCHAFTEN = 8;
const MAX_VERNEHMLASSUNGEN = 8;

// LM-168 (W2·17-UI-BEFUNDE B6, K-15): Anzeige-Absicherung gegen mitten im Wort
// abgeschnittene Regeste-Kurztexte (unter dem pdf-embed-PDF beobachtet, z. B.
// «… im Anwendungsbe…»). Ursache war `kuerzeRegeste` (src/lib/rechtsprechung/
// register.ts) — dort seit diesem Batch wortgrenzen-sicher (§5 SSoT). Das
// bereits generierte `public/rechtsprechung/register.json` trägt die alten,
// mitten im Wort geschnittenen Kurztexte aber weiter (Regenerierung ist ein
// Daten-/Build-Schritt über scripts/normtext/, ausserhalb dieses reinen
// UI-Batches — TABU/Risikopfad, siehe Rückgabe). Bis zum nächsten Daten-Build
// schneidet diese Anzeige-Sicherung darum ausnahmsweise noch einmal nach: nur
// wenn eine Ellipse vorliegt UND der Rückschritt zur letzten Wortgrenze klein
// bleibt (≤ 20 % der Länge) — ein bereits sauber geschnittener Text wird nicht
// unnötig kürzer gemacht.
function absicherWortgrenze(kurz: string): string {
  if (!kurz.endsWith('…')) return kurz;
  const ohneEllipse = kurz.slice(0, -1);
  if (ohneEllipse.length === 0 || ohneEllipse.endsWith(' ')) return kurz;
  const grenze = ohneEllipse.lastIndexOf(' ');
  if (grenze <= 0) return kurz;
  const ruecksprung = ohneEllipse.length - grenze;
  if (ruecksprung > ohneEllipse.length * 0.2) return kurz;
  return ohneEllipse.slice(0, grenze).trimEnd() + '…';
}

/** Korpus-Artikel-Token → Anzeige ('20_a' → '20a'). */
function anzeigeArtikel(token: string): string {
  return token.replace(/_/g, '');
}

// B-3-NACHZUG (R2-A, 31.8.2026): hier stand `kurzDatum` — die SECHSTE
// byte-gleiche Kopie von `datumCh` (dieselbe Regex, dieselbe Rückgabe). Sie war
// der Runde-1-Zählung entgangen, weil sie unter eigenem Namen lief. Die vier
// JSX-Stellen laufen jetzt über den geteilten `<Datum>`-Baustein (Format UND
// Stimme in einer Hand); die eine Stelle, die einen STRING braucht (der
// Vernehmlassungs-Status im Chip), zieht `datumCh` direkt. Das `.num` fällt
// dabei weg: die Mono-Stimme bleibt SR-Nummer und Aktenzeichen vorbehalten
// (Design-Grundlage Kap. 2.1, Herleitung in `components/ui/Datum.tsx`).

// Geteilter «⧉ daneben öffnen»-Knopf (Split-View B-2) — EINE Anatomie für alle
// Panel-Zeilen; Sichtbarkeit steuert der Aufrufer über das bestehende Gating
// `kannOeffnen && !istOffen` (≥lg + freie Kapazität, pane-sicher).
function DanebenKnopf({ ziel, label, oeffneDaneben, className = 'ml-1' }: {
  ziel: string; label: string; oeffneDaneben: (pfad: string) => void; className?: string;
}) {
  return (
    <button type="button" onClick={() => oeffneDaneben(ziel)}
      title={`${label} nebeneinander öffnen`} aria-label={`${label} nebeneinander öffnen`}
      className={`${className} inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-line text-ink-500 hover:text-brass-700 hover:border-brass-400 transition-colors`}>
      <span aria-hidden className="lc-griff-glyph">⧉</span>
    </button>
  );
}

export function KontextPanel({ typ, normKeys, zusatzGruppen, ohneNormen = false, artikelZitate, artikelKontext = null, variante = 'lesespalte' }: {
  typ: KontextTyp;
  normKeys: readonly string[];
  /** Reader-eigene Gruppen (KontextGruppe), VOR den Standard-Gruppen gerendert —
   *  V1.3: «Zitierte Normen»/«Zitierte Entscheide» des EntscheidLesers. */
  zusatzGruppen?: ReactNode;
  /** true: die Erlass-Gruppe entfällt (der Reader ersetzt sie artikelscharf —
   *  keine Doppel-Darstellung, FAHRPLAN-VERZAHNUNG-UI §2.2). */
  ohneNormen?: boolean;
  /** V1 (W2·10-UI-NAV): zitierte Norm-Strings des Entscheids — schaltet die
   *  «Passende Werkzeuge» artikelscharf (Rausch-Filter, #28). */
  artikelZitate?: readonly string[];
  /** W2·19-GLIEDERUNG/S7 (Bau-Spec §5.2): Wegweiser zum AKTIV GELESENEN Artikel
   *  des Gesetzes-Lesers — Praxis-Zahl, letzte Textänderung, ausgehende
   *  Verweise, Sprung zur Werkzeug-Gruppe.
   *
   *  EIGENE PROP, NICHT `artikelZitate` (Bau-Spec §5.2 ausdrücklich): jene
   *  speist laut `kontextSync` ausschliesslich `werkzeugeFuerZitate()`. Sie dem
   *  Spy-Artikel nachzuführen würde (1) die erlass-weite Werkzeugliste still
   *  verengen und (2) die Werkzeug-Gruppe bei JEDEM Artikelwechsel in der Höhe
   *  bewegen — mitten im E4-CLS-Messfenster.
   *
   *  HART GEGATET: die Gruppe rendert nur bei `typ === 'norm'` UND gesetzter
   *  Prop. `EntscheidLeser.tsx` rendert dieselbe Komponente mit `artikelZitate`
   *  und setzt diese Prop nie — beides zusammen schliesst ein Leck aus
   *  (Sonde: src/tests/kontext-artikel-s7.test.tsx). */
  artikelKontext?: ArtikelKontextAnsicht | null;
  /** E4/A32 (David 16.7.2026): 'seitenleiste' = kompakte Darstellung unterhalb
   *  der Gliederung in der TOC-Spalte des Gesetz-Readers. Zwei Unterschiede zur
   *  Standard-Lesespalten-Form (Markup dort byte-gleich unverändert):
   *  (a) enge Aussenmasse (der Spalten-Wrapper trägt Trenner/Abstand selbst);
   *  (b) §15.2-CLS-Gating: solange noch EINE async-Gruppe lädt, steht ein
   *  stabiler «wird geladen»-Platzhalter und die Gruppen erscheinen dann ALLE
   *  AUF EINMAL — unter dem Panel steht in der Spalte nichts, also verschiebt
   *  der Wechsel kein sichtbares Element (kein Layout-Springen in der sticky
   *  Gliederungsspalte). In der Lesespalte bleibt das bisherige gruppenweise
   *  Einwachsen (dort sitzt das Panel am Leseende, unterhalb des Folds). */
  variante?: 'lesespalte' | 'seitenleiste';
}) {
  // Synchron (in-Bundle) — billig + deterministisch, daher pro Render berechnet
  // statt memoisiert (kleine Register, kein O(n²); §6.4).
  const { normen, materialien, werkzeuge } = kontextSync(typ, normKeys, artikelZitate);
  // Richtung «Artikel → Werkzeug» (#38): am Gesetz-Reader (genau EIN Erlass) die
  // artikelscharfe Zuordnung «welcher Rechner gehört zu welchem Artikel». Ersetzt
  // dort die grobe Erlass-Werkzeugliste (keine Doppel-Darstellung, Dichte-Regel).
  const artikelGruppen = typ === 'norm' && normKeys.length === 1
    ? artikelWerkzeugGruppen(normKeys[0]) : [];
  const zeigeArtikelWerkzeuge = artikelGruppen.length > 0;
  // B-2 Verzahnung: Rechner direkt NEBEN dem Normtext öffnen (Split-View).
  // Nur ab lg + freier Pane-Kapazität sichtbar (Werkzeuge sind pane-sicher).
  const { oeffneDaneben, kannOeffnen, istOffen } = usePaneSteuerung();

  // Entscheide lazy aus dem Norm→Entscheid-Index. Stabiler Dep-Key über die
  // join-Signatur (Array-/Objekt-Identität wechselt sonst je Render). Das
  // Ergebnis trägt seinen eigenen Key → der Ladezustand wird daraus ABGELEITET
  // (kein synchrones setState im Effekt-Body, react-hooks-Regel; §6.4).
  const normKeysKey = normKeys.join(',');
  const [geladen, setGeladen] = useState<{ key: string; refs: EntscheidRef[] } | null>(null);
  useEffect(() => {
    if (typ === 'entscheid') return;   // Entscheid-Reader: keine Entscheid-Gruppe
    const keys = normKeysKey ? normKeysKey.split(',') : [];
    let lebt = true;
    kontextEntscheide(typ, keys).then((r) => { if (lebt) setGeladen({ key: normKeysKey, refs: r }); });
    return () => { lebt = false; };
  }, [typ, normKeysKey]);

  // Amtliche Materialien lazy aus den Kanten-Shards (E6a·M5): die kuratierten
  // In-Bundle-Materialien (kontextSync) decken nur die Alt-Einträge; die per
  // Adapter erfassten Behördenpublikationen (300+ Dokumente, artikelscharf) liegen
  // als erlass-lokale Shards und werden hier nachgeladen. Ergebnis trägt seinen
  // eigenen Key → Ladezustand abgeleitet (kein synchrones setState im Effekt-Body).
  const [softLawGeladen, setSoftLawGeladen] = useState<{ key: string; refs: MaterialBezug[] } | null>(null);
  useEffect(() => {
    if (typ === 'material') return; // Material-Reader IST das Material
    const keys = normKeysKey ? normKeysKey.split(',') : [];
    let lebt = true;
    kontextSoftLaw(typ, keys).then((r) => { if (lebt) setSoftLawGeladen({ key: normKeysKey, refs: r }); });
    return () => { lebt = false; };
  }, [typ, normKeysKey]);
  const softLaw: MaterialBezug[] =
    softLawGeladen && softLawGeladen.key === normKeysKey ? softLawGeladen.refs : [];

  // Entstehungsgeschichte (Paket 2, W2·6, Moat-Hebel 1 «Norm-Kontext-Bus»): die
  // Botschaften des Bundesrates zur Norm — Genese, semantisch VOR Anwendung/Auslegung.
  // Nur im Gesetz-Reader (typ==='norm'); auf Entscheid-/Material-Seiten wäre die Genese
  // zwei Schritte entfernt und würde die Sicht fluten. `null` = Manifest-Ladefehler
  // (Fetch-Fehler ≠ leer, Finding 15) → ehrlicher Fehlerzustand statt stillem «keine».
  const { locale } = useLocale();
  const [botGeladen, setBotGeladen] = useState<{ key: string; refs: BotschaftBezug[] | null } | null>(null);
  useEffect(() => {
    if (typ !== 'norm') return;
    const keys = normKeysKey ? normKeysKey.split(',') : [];
    let lebt = true;
    // `locale` mit in den Abruf: die FR/IT-Titel stehen seit dem 12.9.2026 in einer
    // eigenen Projektion (register-i18n.json) und werden nur für diese beiden Sprachen
    // geholt — der deutsche Lesefluss zieht sie nicht mehr mit (§15).
    botschaftenFuer(keys, locale).then((r) => { if (lebt) setBotGeladen({ key: normKeysKey, refs: r }); });
    return () => { lebt = false; };
  }, [typ, normKeysKey, locale]);
  const botAktuell = typ === 'norm' && botGeladen?.key === normKeysKey ? botGeladen : null;
  const botschaftenLaden = typ === 'norm' && !botAktuell;
  const botschaftenFehler = botAktuell?.refs === null;
  const botschaften: BotschaftBezug[] = botAktuell?.refs ?? [];
  // botschaftKey → Botschaft (aus den ohnehin geladenen Botschaften): der Revisions-
  // Verweis «Botschaft ansehen» ohne zweiten Fetch (§15, Moat-Hebel 1: ein Bus).
  const botschaftNachKey = new Map(botschaften.map((b) => [b.key, b]));

  // Änderungen / Revisionen (Paket 5, W2·6-REV, Moat-Hebel 1): die AS/RO-Änderungs-
  // erlasse zur Norm — die *tatsächliche* Änderung neben der *Absicht* (Botschaft),
  // an DERSELBEN norm-verankerten Stelle. Nur Gesetz-Reader. Lazy aus dem Sidecar.
  // `null` = Sidecar-Ladefehler (Fetch-Fehler ≠ leer, Finding 15).
  const [revGeladen, setRevGeladen] = useState<{ key: string; ans: RevisionAnsicht | null } | null>(null);
  useEffect(() => {
    if (typ !== 'norm') return;
    const keys = normKeysKey ? normKeysKey.split(',') : [];
    let lebt = true;
    revisionenFuerNorm(keys).then((ans) => { if (lebt) setRevGeladen({ key: normKeysKey, ans }); });
    return () => { lebt = false; };
  }, [typ, normKeysKey]);
  const revAktuell = typ === 'norm' && revGeladen?.key === normKeysKey ? revGeladen : null;
  const revLaden = typ === 'norm' && !revAktuell;
  const revFehler = revAktuell?.ans === null;
  const alleRevisionen: RevisionBezug[] = revAktuell?.ans?.revisionen ?? [];
  const revAenderungen = alleRevisionen.filter((r) => r.art === 'aenderung');
  const revMarker = alleRevisionen.filter((r) => r.art === 'sammelerlass-marker');

  // Gesetzgebung in Arbeit (Paket 3, W3·11, Moat-Hebel 1): laufende/abgeschlossene Vernehmlassungen
  // zur Norm — «was ändert sich», semantisch die Zukunft der Zeitachse (Botschaft=Genese →
  // AS=Änderung → Vernehmlassung=Ausblick). Nur Gesetz-Reader. `null` = Manifest-Ladefehler (§8).
  const [vernGeladen, setVernGeladen] = useState<{ key: string; refs: VernehmlassungBezug[] | null } | null>(null);
  useEffect(() => {
    if (typ !== 'norm') return;
    const keys = normKeysKey ? normKeysKey.split(',') : [];
    let lebt = true;
    vernehmlassungenFuer(keys, locale).then((r) => { if (lebt) setVernGeladen({ key: normKeysKey, refs: r }); });
    return () => { lebt = false; };
  }, [typ, normKeysKey, locale]);
  const vernAktuell = typ === 'norm' && vernGeladen?.key === normKeysKey ? vernGeladen : null;
  const vernehmlassungenLaden = typ === 'norm' && !vernAktuell;
  const vernehmlassungenFehler = vernAktuell?.refs === null;
  const vernehmlassungen: VernehmlassungBezug[] = vernAktuell?.refs ?? [];

  // «via Art. N»-Sublabels (V1.2, Magic Moment 5): nur im Gesetz-Reader (genau
  // EIN normKey) aus dem erlass-lokalen Shard invertiert — kein neuer Datenpfad,
  // derselbe Promise-Cache wie die LeitfallZeile (§5/§15.3). Kein Shard = keine
  // Sublabels (stiller, ehrlicher Ausfall).
  const einzelErlass = typ === 'norm' && normKeys.length === 1;
  const [artikelMap, setArtikelMap] = useState<{ key: string; map: Map<string, string> } | null>(null);
  useEffect(() => {
    if (!einzelErlass) return;
    let lebt = true;
    ladeLeitfallShard(normKeysKey).then((shard) => {
      if (lebt && shard) setArtikelMap({ key: normKeysKey, map: artikelProEntscheid(shard) });
    });
    return () => { lebt = false; };
  }, [einzelErlass, normKeysKey]);
  const viaArtikel: Map<string, string> | null =
    einzelErlass && artikelMap?.key === normKeysKey ? artikelMap.map : null;
  // §V1c: Revisions-Shard des EINEN Erlasses (Normrevisions-Ehrlichkeit) — lazy,
  // derselbe idle-Slot wie der Leitfall-Shard. Klassifiziert je Entscheid-Chip über
  // das «via Art. N»-Sublabel + das Entscheiddatum, ob die Norm SEIT dem Entscheid
  // revidiert wurde. Kein Sublabel = keine Klassifikation (still).
  const [revShard, setRevShard] = useState<{ key: string; shard: RevisionShard | null } | null>(null);
  useEffect(() => {
    if (!einzelErlass) return;
    let lebt = true;
    ladeRevisionShard(normKeysKey).then((shard) => { if (lebt) setRevShard({ key: normKeysKey, shard }); });
    return () => { lebt = false; };
  }, [einzelErlass, normKeysKey]);
  const revShardAktuell: RevisionShard | null =
    einzelErlass && revShard?.key === normKeysKey ? revShard.shard : null;
  // Kürzel des EINEN Erlasses — für den ?norm=-Fundstellen-Sprung im Ziel-Entscheid
  // (Auftrag David 3.7.2026: eingehende Entscheid-Links landen an der Erwägung).
  const eigenKuerzel = einzelErlass ? normenFuer(normKeys)[0]?.kuerzel ?? null : null;

  // Entscheid-Reader: leer (Selbst-Korpus). Sonst nur das zum AKTUELLEN Key
  // gehörende Resultat zeigen; ein veralteter/fehlender Treffer = «lädt».
  const entscheide: EntscheidRef[] | null =
    typ === 'entscheid' ? [] : (geladen && geladen.key === normKeysKey ? geladen.refs : null);

  const entscheideLaden = entscheide === null;
  const sichtbareEntscheide = entscheide ? entscheide.slice(0, MAX_ENTSCHEIDE) : [];
  const restEntscheide = entscheide ? Math.max(0, entscheide.length - MAX_ENTSCHEIDE) : 0;
  // Ziel für «alle Entscheide»: bei genau einer Norm vorgefiltert, sonst Übersicht.
  const alleEntscheideZiel = normKeys.length === 1
    ? `/rechtsprechung?norm=${encodeURIComponent(normKeys[0])}`
    : '/rechtsprechung';

  // Sync-kuratierte + async-Soft-Law-Materialien zu EINER Gruppe gemerged, dedupe
  // per key (bestehender kuratierter Eintrag gewinnt, §2.6). Max. 8 sichtbar.
  const alleMaterialien = mischeMaterialien(materialien, softLaw);
  // Solange die async-Materialien für den aktuellen Key noch laden, gilt das Panel
  // NICHT als leer (kein vorzeitiges Leerbild → kein Flash/CLS).
  const softLawLaden = typ !== 'material' && (!softLawGeladen || softLawGeladen.key !== normKeysKey);

  // S7: der Artikel-Kontext wird HIER gegatet — `typ === 'norm'` schliesst den
  // Entscheid-/Material-Reader aus, selbst wenn eine künftige Aufrufstelle die
  // Prop versehentlich setzte (Gürtel und Hosenträger, Bau-Spec §5.2).
  const artikelKtx = typ === 'norm' ? artikelKontext : null;

  // `istLeer` spricht über die QUERVERWEIS-Gruppen (Entscheide/Materialien/
  // Werkzeuge) — der Wegweiser steht seit dem CI-Befund ausserhalb und ist keine
  // solche Menge; er darf die Leer-Aussage darunter darum weder auslösen noch
  // unterdrücken.
  const hatSync = normen.length > 0 || alleMaterialien.length > 0 || werkzeuge.length > 0 || zeigeArtikelWerkzeuge;
  const istLeer = !zusatzGruppen && !hatSync && !entscheideLaden && !softLawLaden
    && !botschaftenLaden && !botschaftenFehler && botschaften.length === 0
    && !revLaden && !revFehler && alleRevisionen.length === 0
    && !vernehmlassungenLaden && !vernehmlassungenFehler && vernehmlassungen.length === 0
    && (entscheide?.length ?? 0) === 0;

  // E4/A32: Seitenleisten-CLS-Gating (§15.2) — erst rendern, wenn ALLE async-
  // Gruppen aufgelöst sind (eine Einblendung statt gruppenweisem Nachrücken).
  const seitenleiste = variante === 'seitenleiste';
  const laedtNoch = entscheideLaden || softLawLaden || botschaftenLaden
    || revLaden || vernehmlassungenLaden;
  // Verdeckt das Gating die Querverweis-Gruppen gerade? Der Wegweiser braucht
  // die Antwort, weil sein Werkzeug-Sprung auf eine dieser Gruppen zielt: ein
  // Knopf, dessen Ziel noch gar nicht im DOM steht, wäre ein toter Knopf
  // (§13/F4) — dieselbe Regel, die der Bug-Check als B4 aufgestellt hat.
  const gruppenVerdeckt = seitenleiste && laedtNoch;

  return (
    <section aria-labelledby="kontext-titel"
      className={seitenleiste ? 'space-y-4' : 'mt-12 border-t border-line pt-6 space-y-5 max-w-reading'}>
      {/* C-2/C-6/C-7-NACHZUG (R2-A, 31.8.2026): der Panel-Kopf zeichnete das
          Gruppenkopf-Rezept (Overline + Haarlinie) selbst nach. Jetzt der
          geteilte Baustein — Kopien werden gelöscht, nicht angeglichen (§5/§10).
          Einziger sichtbarer Unterschied: `items-baseline` → `items-center`,
          die Mehrheitsform, die der Baustein trägt (Herleitung dort). */}
      <GruppenKopf stufe={2} id="kontext-titel" titel="Kontext" />

      {/* W2·19-GLIEDERUNG/S7 — «Zu Art. X»: der Wegweiser zur Leseposition
          (Bau-Spec §5.2). Er beantwortet vier Fragen und springt für das Detail
          dorthin, wo es ohnehin steht: Artikelfuss (Praxis) bzw. Werkzeug-Gruppe
          weiter unten (§5 SSoT — nie eine zweite Liste derselben Sachen).

          AUSSERHALB DES LADE-GATINGS, und das ist ein Produkt-Entscheid mit
          Messbeleg (CI-Rot Shard 7/8, PR #479, 9.8.2026): der Wegweiser stand
          zuerst INNERHALB des `laedtNoch`-Zweigs. Der Seiten-Snapshot zum
          Fehlerzeitpunkt zeigt, was das heisst — die OR-Seite war nach 30 s
          vollständig da (Kopf, Gliederung, Erlass-Übersicht), aber das Panel
          stand unverändert auf «Kontext wird geladen …», weil einer der FÜNF
          async-Feeds (Entscheide · Soft-Law · Botschaften · Revisionen ·
          Vernehmlassungen) auf dem Runner so lange braucht.
          Fachlich hängt der Wegweiser an KEINEM dieser Feeds: er wird aus
          Daten gebaut, die der Leser ohnehin hält. Ihn hinter deren
          Alles-oder-nichts-Gating zu hängen, hiess auf jedem langsamen Gerät:
          minutenlang «wird geladen», obwohl die Auskunft sofort bereitsteht.
          Das war kein Test-, sondern ein Nutzer-Problem (§8).

          §15.2 bleibt gewahrt — im Gegenteil: der Block ist HÖHENFEST
          (`lc-artikelkontext`, vier Zeilen) und sein Titel einzeilig, er hat
          also von der ersten Zeichnung an seine Endhöhe. Was später einwächst,
          steht DARUNTER, und darunter steht im Scroller nichts (dasselbe
          Argument, das die E4-Geometrie schon trägt). */}
      {artikelKtx && (
        <KontextGruppe punkt="norm" rolle="wegweiser"
          titel={artikelKtx.label ? `Zu ${artikelKtx.label}` : 'Zur Leseposition'}>
          <div data-artikel-kontext className="lc-artikelkontext flex flex-col text-micro leading-snug text-ink-600">
            {!artikelKtx.token ? (
              <p className="truncate">Noch keine Leseposition erfasst.</p>
            ) : <ArtikelKontextZeilen k={artikelKtx} werkzeugZielBereit={zeigeArtikelWerkzeuge && !gruppenVerdeckt} />}
          </div>
        </KontextGruppe>
      )}

      {gruppenVerdeckt ? (
        <p className="text-body-s text-ink-500">Kontext wird geladen …</p>
      ) : istLeer ? (
        <Leerzustand art="bestand"
          text="Noch keine Querverweise zu Entscheiden, Materialien oder Werkzeugen erfasst." />
      ) : (
        <div className="space-y-5">
          {/* Reader-eigene Gruppen zuerst (V1.3: Entscheid-Richtungen am Fuss). */}
          {zusatzGruppen}

          {/* Entstehungsgeschichte — Botschaften des Bundesrates (Paket 2, W2·6,
              Moat-Hebel 1). Genese der Norm: semantisch VOR Anwendung (Entscheide) und
              Auslegung (Materialien). Nur Gesetz-Reader. §8: maschinell aus dem amtlichen
              Fedlex-Projekt-Graphen zugeordnet, massgeblich bleibt die amtliche Fassung
              (B-6-Nachzug R2-A, 31.8.2026 — Nomen aus `lib/benennung`). */}
          {(botschaftenFehler || botschaften.length > 0) && (
            <KontextGruppe titel="Entstehungsgeschichte" richtung="Botschaft des Bundesrates" punkt="material"
              anzahl={botschaften.length}
              hinweis={botschaftenFehler
                ? undefined
                : <><span className="num">{botschaften.length}</span> Botschaft{botschaften.length === 1 ? '' : 'en'} des Bundesrates — maschinell über den amtlichen Fedlex-Projekt-Graphen zugeordnet (ab ~2000), fachlich nicht geprüft; massgeblich bleibt {AMTLICHE_FASSUNG_NOMEN}.</>}>
              {/* F2-4: eine von vier Abruf-Fehler-Zeilen des Hauses, jetzt aus
                  `ui/AbrufFehler`. Der Link hiess «Fedlex» — der Name des
                  ANBIETERS statt des Ziels; Kanon ist «Amtliche Fassung ↗»
                  (Ä110/B-1, `ui/QuellLink`), der Schlusspunkt entfällt mit dem
                  Pfeil. Ton und Satzbau unverändert. */}
              {botschaftenFehler ? (
                <AbrufFehler gegenstand="Entstehungsgeschichte" href="https://www.fedlex.admin.ch" />
              ) : (
                <>
                  <ul className="flex flex-col gap-1.5">
                    {botschaften.slice(0, MAX_BOTSCHAFTEN).map((b) => {
                      const titel = (locale === 'fr' && b.titelFr) || (locale === 'it' && b.titelIt) || b.titel;
                      return (
                        <li key={b.key} className="text-body-s">
                          <a href={fedlexLokalisiert(b.quelleUrl, locale)} target="_blank" rel="noopener noreferrer"
                            className="no-underline hover:text-brass-700">
                            <Datum iso={b.stand} className="text-ink-500" />
                            {/* `lang="de"` nur im Rückfall (sonst spräche Vorlese-Software ihn fr/it). */}
                            {' — '}<span className="font-medium" {...(b.titelRueckfall ? { lang: 'de' } : {})}>{titel}</span>
                          </a>
                          {b.nummer && b.parlamentUrl && (
                            <>
                              {' '}
                              <a href={b.parlamentUrl} target="_blank" rel="noopener noreferrer"
                                title={`Geschäft ${b.nummer} auf parlament.ch (Curia Vista)`}
                                className="num text-micro text-ink-500 hover:text-brass-700">
                                · Nr. {b.nummer} ↗
                              </a>
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {botschaften.length > MAX_BOTSCHAFTEN && (
                    <p className="text-micro text-ink-500">
                      … und <span className="num">{botschaften.length - MAX_BOTSCHAFTEN}</span> weitere. Vollständige Liste über die amtliche Quelle (Fedlex).
                    </p>
                  )}
                  <TitelRueckfallZeile bezuege={botschaften} bereich="botschaften" />
                </>
              )}
            </KontextGruppe>
          )}

          {/* Änderungen / Revisionen — AS/RO-Änderungserlasse (Paket 5, W2·6-REV,
              Moat-Hebel 1). Die tatsächliche Änderung neben der Absicht (Botschaft),
              an derselben Stelle. §8: maschinell aus dem amtlichen Fedlex-Graphen;
              massgeblich bleibt die amtliche Sammlung.
              §6.6-Split (12.9.2026): die JSX-Darstellung lebt in `RevisionenGruppe`
              daneben (Begründung dort); Ladezustand/Filterung bleiben hier, weil
              `revLaden`/`revFehler`/`alleRevisionen` auch `laedtNoch`/`istLeer`
              speisen (§5, kein zweiter Zustands-Bus). */}
          {(revFehler || alleRevisionen.length > 0) && (
            <RevisionenGruppe revFehler={revFehler} revAenderungen={revAenderungen}
              revMarker={revMarker} botschaftNachKey={botschaftNachKey} locale={locale} />
          )}

          {/* Gesetzgebung in Arbeit — Vernehmlassungen (Paket 3, W3·11, Moat-Hebel 1).
              Der proaktive Teil der Zeitachse: was in diesem Rechtsgebiet gerade angehört
              wird / abgeschlossen ist. Nur Gesetz-Reader. §8: maschinell aus dem amtlichen
              Fedlex-Graphen zugeordnet (grob bei Mantelvorlagen), massgeblich bleibt die
              amtliche Fassung (B-6-Nachzug R2-A). Reichweite ~ab 2006. */}
          {(vernehmlassungenFehler || vernehmlassungen.length > 0) && (
            <KontextGruppe titel="Gesetzgebung in Arbeit" richtung="Vernehmlassung" punkt="material"
              anzahl={vernehmlassungen.length}
              hinweis={vernehmlassungenFehler
                ? undefined
                : <><span className="num">{vernehmlassungen.length}</span> Vernehmlassungsverfahren — maschinell über den amtlichen Fedlex-Gesetzgebungs-Graphen zugeordnet (Reichweite ab ~2006), fachlich nicht geprüft; die Zuordnung kann bei Mantelvorlagen grob sein, massgeblich bleibt {AMTLICHE_FASSUNG_NOMEN}.</>}>
              {/* F2-4, dritte Fundstelle (Begründung bei der ersten). */}
              {vernehmlassungenFehler ? (
                <AbrufFehler gegenstand="Gesetzgebung in Arbeit" href="https://www.fedlex.admin.ch" />
              ) : (
                <>
                  <ul className="flex flex-col gap-1.5">
                    {vernehmlassungen.slice(0, MAX_VERNEHMLASSUNGEN).map((v) => {
                      const titel = (locale === 'fr' && v.titelFr) || (locale === 'it' && v.titelIt) || v.titel;
                      const laeuft = v.status === 'laufend';
                      return (
                        <li key={v.key} className="text-body-s">
                          <a href={fedlexLokalisiert(v.quelleUrl, locale)} target="_blank" rel="noopener noreferrer"
                            className="no-underline hover:text-brass-700">
                            <span className={`lc-overline ${laeuft ? 'text-brass-700' : ''}`}>
                              {laeuft && v.fristEnde ? `läuft bis ${datumCh(v.fristEnde)}` : VERNEHMLASSUNG_STATUS_LABEL[v.status]}
                            </span>
                            {' — '}<span className="font-medium" {...(v.titelRueckfall ? { lang: 'de' } : {})}>{titel}</span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                  {vernehmlassungen.length > MAX_VERNEHMLASSUNGEN && (
                    <p className="text-micro text-ink-500">
                      … und <span className="num">{vernehmlassungen.length - MAX_VERNEHMLASSUNGEN}</span> weitere. Vollständige Liste über die amtliche Quelle (Fedlex).
                    </p>
                  )}
                  <TitelRueckfallZeile bezuege={vernehmlassungen} bereich="vernehmlassungen" />
                </>
              )}
            </KontextGruppe>
          )}

          {/* Normen (für Entscheid- und Material-Reader). */}
          {!ohneNormen && normen.length > 0 && (
            <KontextGruppe titel="Erlasse" richtung="Wendet an" punkt="norm" anzahl={normen.length}
              hinweis={<><span className="num">{normen.length}</span> erfasste Erlasse — aus den zitierten Normen der Quelle abgeleitet.</>}>
              <ul className="flex flex-wrap gap-2">
                {normen.map((n) => (
                  <li key={n.key} className="inline-flex items-center">
                    <KantenChip to={n.pfad} label={n.kuerzel} titel={n.titel} />
                    {kannOeffnen && !istOffen(n.pfad) && (
                      <DanebenKnopf ziel={n.pfad} label={n.kuerzel} oeffneDaneben={oeffneDaneben} />
                    )}
                  </li>
                ))}
              </ul>
            </KontextGruppe>
          )}

          {/* Entscheide (für Norm- und Material-Reader). */}
          {(entscheideLaden || (entscheide && entscheide.length > 0)) && (
            <KontextGruppe titel="Bundesgerichtsentscheide" richtung="Wird zitiert von" punkt="entscheid"
              anzahl={entscheide?.length ?? 0}
              hinweis={entscheideLaden ? undefined : typ === 'material'
                ? <><span className="num">{entscheide?.length ?? 0}</span> erfasste Entscheide — über die gemeinsam zitierten Erlasse zugeordnet: zwei Schritte entfernt, entsprechend unschärfer. Entscheide beziehen sich auf die im Entscheidzeitpunkt geltende Fassung.</>
                : <><span className="num">{entscheide?.length ?? 0}</span> erfasste Entscheide — maschinell aus den zitierten Normen zugeordnet, keine redaktionelle Präjudizienauswahl. Entscheide beziehen sich auf die im Entscheidzeitpunkt geltende Fassung.</>}>
              {entscheideLaden ? (
                <p className="text-body-s text-ink-500">Entscheide werden geladen …</p>
              ) : (
                <>
                  <ul className="flex flex-col gap-1.5">
                    {sichtbareEntscheide.map((r) => {
                      // Artikel-Sublabel + Fundstellen-Sprung (nur Gesetz-Reader,
                      // Shard vorhanden): «via Art. N» als EIN Zusatz am Eintrag,
                      // ?norm= lässt das Ziel zur Erwägungs-Fundstelle springen.
                      const artikel = viaArtikel?.get(r.key) ?? null;
                      const normZitat = artikel && eigenKuerzel ? `Art. ${artikel} ${eigenKuerzel}` : null;
                      const ziel = `/rechtsprechung/${encodeURIComponent(r.key)}${normZitat ? `?norm=${encodeURIComponent(normZitat)}` : ''}`;
                      // §V1c: revidiert nur, wenn ein «via Art. N» vorliegt (sonst
                      // kein Artikelbezug zum Klassifizieren) und der Entscheid VOR
                      // der letzten Textänderung dieses Artikels liegt.
                      const rev = artikel ? revisionFuerToken(revShardAktuell, artikel) : undefined;
                      const revidiert = artikel
                        && klassifiziereFassungsBezug(entscheidDatum(r.datum, r.gericht), rev) === 'revidiert'
                        ? (rev ?? null) : null;
                      return (
                        <li key={r.key} className="text-body-s">
                          <Link to={ziel} className="no-underline hover:text-brass-700">
                            <span className="font-medium">{r.zitierung}</span>
                            {r.leitcharakter === 'leitentscheid' && (
                              <StatusBadge praedikat="leitentscheid" variant="glyph" className="ml-1.5" />
                            )}
                            {revidiert && (
                              <StatusBadge praedikat="revidiert" variant="glyph" detail={revisionDetailText(revidiert)} className="ml-1.5" />
                            )}
                            {artikel && (
                              <span className="num text-micro text-ink-500"> · via Art. {artikel}</span>
                            )}
                          </Link>
                          {kannOeffnen && !istOffen(ziel) && (
                            <DanebenKnopf ziel={ziel} label={r.zitierung} oeffneDaneben={oeffneDaneben} className="ml-1 align-middle" />
                          )}
                          {/* LM-129 (B9, 4.9.2026): der Auszug lief als Fortsetzung DESSELBEN <a>
                              hinter der Zitierung her — das ⧉ landete dadurch mitten in der
                              dritten Zeile. Eigener Block: das ⧉ schliesst die kurze
                              Zitierungs-Zeile ab, und der Linkname trägt nicht mehr bis zu
                              240 Zeichen Regeste. Wortlaut unverändert (`absicherWortgrenze`);
                              nur der em-Strich entfällt, den der Umbruch ersetzt.
                              Messreihe: FAHRPLAN-UI-BEFUNDE §10 LM-129. */}
                          {r.regesteKurz && (
                            <span className="mt-0.5 block text-ink-500">{absicherWortgrenze(r.regesteKurz)}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {restEntscheide > 0 && (
                    <Link to={alleEntscheideZiel} className="text-body-s text-brass-700 hover:underline">
                      Alle <span className="num">{entscheide?.length}</span> erfassten Entscheide ansehen →
                    </Link>
                  )}
                  {/* LM-134 (B9, 4.9.2026): die ★ dieser Liste trugen ihre Erklärung nur
                      in aria-label/title (auf Touch tot). Wiederverwendet statt zweiter
                      Legende: `verzahnung/ZeichenLegende` — in B1/LM-050 für genau diese
                      Lücke gebaut, Texte aus GLYPH_LEGENDE (§5, dieselbe Quelle). Steht nur
                      bei sichtbarem ★ (§8), wie dort der ⧉-Eintrag an `kannOeffnen` hängt. */}
                  {sichtbareEntscheide.some((r) => r.leitcharakter === 'leitentscheid') && (
                    <ZeichenLegende />
                  )}
                </>
              )}
            </KontextGruppe>
          )}

          {/* Amtliche Materialien (Norm- + Entscheid-Reader): kuratierte In-Bundle-
              Einträge + async Soft-Law-Kanten (E6a·M5), EINE Gruppe, dedupe per key.
              W2·5d U-VERWEIS/A13 (David 5.7.2026, «klarere verweise zu den
              materialien sofern relevant»): ARTIKELSCHARFE Kanten prominent zuerst
              (Fundstellen-Sublabel «via Art. 21», Behörden-Kürzel, Dokument-Stand);
              reine ERLASS-EBENE-Kanten dezenter HINTER dem Zähler (<details>,
              tastatur-/CLS-fest wie RegesteBlock) — keine Chip-Wüste, Dichte-Regel
              bleibt. Staleness-Hinweis §2.4, «maschinell»-Badge nur bei Heuristik. */}
          {alleMaterialien.length > 0 && (() => {
            const artikelScharf = alleMaterialien.filter((m) => m.artikel || m.sublabel);
            const erlassEbene = alleMaterialien.filter((m) => !m.artikel && !m.sublabel);
            const sichtbarScharf = artikelScharf.slice(0, MAX_MATERIALIEN);
            const restScharf = artikelScharf.length - sichtbarScharf.length;
            const zeile = (m: MaterialBezug) => {
              // Staleness (§2.4): nur im Einzel-Erlass-Reader (Revisions-Shard geladen)
              // und nur bei artikelscharfem Bezug — Dokument-Stand vor der letzten
              // Textänderung des Artikels ⇒ Hinweis, nie ein «aktuell»-Siegel (R16).
              const rev = m.artikel ? revisionFuerToken(revShardAktuell, m.artikel) : undefined;
              const veraltet = !!m.artikel
                && klassifiziereFassungsBezug({ iso: m.stand, praezision: 'tag' }, rev) === 'revidiert';
              return (
                <li key={m.key} className="text-body-s">
                  <Link to={m.pfad} className="no-underline hover:text-brass-700">
                    <span className="text-ink-500">{m.behoerdeKuerzel} · {m.doktypLabel}{m.nummer ? ` ${m.nummer}` : ''}</span>
                    {' — '}<span className="font-medium">{m.titel}</span>
                    {m.sublabel && <span className="num text-micro font-normal text-ink-500"> · {m.sublabel}</span>}
                    <span className="text-micro text-ink-500"> · Stand <Datum iso={m.stand} /></span>
                    {m.herkunft === 'maschinell' && (
                      <StatusBadge praedikat="maschinell" className="ml-1.5 align-middle" />
                    )}
                  </Link>
                  {kannOeffnen && !istOffen(m.pfad) && (
                    <DanebenKnopf ziel={m.pfad} label={`${m.behoerdeKuerzel} ${m.doktypLabel}`} oeffneDaneben={oeffneDaneben} className="ml-1 align-middle" />
                  )}
                  {veraltet && m.artikel && (
                    <span className="block text-micro text-warn-700">
                      Dokument-Stand vor der letzten Änderung von Art. {anzeigeArtikel(m.artikel)}.
                    </span>
                  )}
                </li>
              );
            };
            return (
              <KontextGruppe titel="Amtliche Materialien" richtung="Legt aus" punkt="material" anzahl={alleMaterialien.length}
                hinweis={<><span className="num">{alleMaterialien.length}</span> erfasste Behördenpublikationen (Kreisschreiben, Wegleitungen, Leitfäden u. a.) — kein Gesetzesrang.</>}>
                {artikelScharf.length > 0 && (
                  <ul className="flex flex-col gap-1.5">{sichtbarScharf.map(zeile)}</ul>
                )}
                {restScharf > 0 && (
                  <Link to="/materialien" className="text-body-s text-brass-700 hover:underline">
                    Noch <span className="num">{restScharf}</span> weitere mit Artikel-Bezug · alle Materialien ansehen →
                  </Link>
                )}
                {erlassEbene.length > 0 && (
                  <details className="group">
                    <summary className="cursor-pointer list-none text-body-s text-ink-500 hover:text-brass-700 [&::-webkit-details-marker]:hidden">
                      <span aria-hidden className="mr-1 inline-block transition-transform group-open:rotate-90">›</span>
                      <span className="num">{erlassEbene.length}</span>
                      {erlassEbene.length === 1 ? ' Dokument' : ' Dokumente'} auf Erlass-Ebene (ohne Artikel-Bezug)
                    </summary>
                    <ul className="mt-1.5 flex flex-col gap-1.5 border-l border-line pl-3">
                      {erlassEbene.map(zeile)}
                    </ul>
                  </details>
                )}
              </KontextGruppe>
            );
          })()}

          {/* Richtung «Artikel → Werkzeug» (#38): am Gesetz-Reader die artikel-
              scharfe Zuordnung — welcher Rechner/welche Vorlage gehört zu welchem
              Artikel (Art. 127 OR → Verjährung). Ersetzt dort die grobe Erlass-
              Werkzeugliste. Jede Zeile trägt ihren Artikel-Bereich als Beleg. */}
          {zeigeArtikelWerkzeuge && (
            // S7: Sprungziel des Artikel-Kontexts («Rechner/Vorlagen zu Art. N ↓»)
            // — Promotion statt Zweitdarstellung (§5): der Wegweiser oben zeigt
            // hierher, die Liste bleibt die eine, die hier schon steht.
            <KontextGruppe id="kontext-werkzeuge" titel="Werkzeuge zu einzelnen Artikeln" anzahl={artikelGruppen.length}
              hinweis="Rechner und Vorlagen, die genau zu einem Artikel dieses Erlasses passen (eindeutige Zuordnungen; Zweifelsfälle bewusst ausgelassen).">
              <ul className="flex flex-col gap-2.5">
                {artikelGruppen.map((g) => (
                  <li key={`${g.von}-${g.bis}`} className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5">
                    <span className="num lc-overline shrink-0 text-ink-600" title={g.beleg}>{g.label}</span>
                    {g.werkzeuge.map((w) => (
                      <span key={w.id} className="inline-flex items-center">
                        {/* LM-152 (W2·17-UI-BEFUNDE-B4): in der schmalen `seitenleiste`
                            (TOC-Spalte, 256 px) zwang `whitespace-nowrap` lange
                            Werkzeug-Titel («Mietvertrag (Wohnen · Geschäft ·
                            Untermiete)») über die Spaltenbreite hinaus (374 px Inhalt
                            bei 245 px Sicht, gemessen) — horizontaler Überhang trotz
                            `flex-wrap` auf dem Eltern-`<li>`, weil das einzelne Chip-
                            Label selbst nicht umbrach. In `lesespalte` (breite
                            Hauptspalte) bleibt das bewährte Einzeilen-Chip erhalten. */}
                        <Link to={w.href}
                          className={`lc-chip no-underline hover:text-brass-700 hover:border-brass-400 ${seitenleiste ? '' : 'whitespace-nowrap'}`}>
                          <span className="text-ink-500 mr-1" aria-hidden>{w.modus === 'rechner' ? '⊞' : '▤'}</span>{w.titel}
                        </Link>
                        {kannOeffnen && !istOffen(w.href) && (
                          <DanebenKnopf ziel={w.href} label={w.titel} oeffneDaneben={oeffneDaneben} />
                        )}
                      </span>
                    ))}
                  </li>
                ))}
              </ul>
            </KontextGruppe>
          )}

          {/* Werkzeuge (Entscheid- und Material-Reader; am Gesetz-Reader nur, wenn
              keine artikelscharfen Gruppen vorliegen) — kein Zitat-Beziehungstyp,
              darum bewusst ohne Richtungs-Label. */}
          {!zeigeArtikelWerkzeuge && werkzeuge.length > 0 && (
            <KontextGruppe titel="Passende Werkzeuge" anzahl={werkzeuge.length}
              hinweis="Aus den verknüpften Normen abgeleitet (grobe Zuordnung, keine kuratierte Empfehlung).">
              {/* Mobil eine scrollbare Chip-Reihe, ab sm normaler Umbruch. LM-152:
                  `seitenleiste` erzwingt IMMER Umbruch (nie horizontal-scrollend) —
                  sonst ein zweiter Scroll-Richtungswechsel innerhalb der bereits
                  vertikal scrollenden 256-px-TOC-Spalte. */}
              <ul className={seitenleiste
                ? 'flex flex-wrap gap-2'
                // ── W2·18 Welle 3 Punkt 1, NEBENFUND (R8-Sweep 13.9.2026) ·
                //    DIE AFFORDANZ IST DIE GETEILTE, NICHT DER DÜNNE BALKEN ──
                // Der dritte Entscheid-Vertreter des Sweeps (`ag_gerichte_
                // HOR_2024_19`) hat diese Zeile zum ersten Mal in die Messung
                // gebracht: GEMESSEN @320 und @390 `scrollWidth 435` gegen
                // `clientWidth 280` bzw. `350` — Kategorie
                // `a-ueberlauf-ohne-scroller`. Gescrollt hat sie schon vorher
                // (`overflow-x: auto` + `[scrollbar-width:thin]`), aber ohne
                // die geteilte Affordanz `lc-scrollrand-x` (B8, 31.8.2026:
                // JEDER Scroller trägt sie) — und der Detektor verlangt genau
                // sie, weil ein dünner Balken auf Touch gar nicht erscheint.
                // `sm:bg-none`: ab `sm` steht `overflow-visible`, dort gäbe
                // der Verlauf eine Fortsetzung vor, die es nicht gibt (§8).
                : 'lc-scrollrand-x sm:bg-none flex gap-2 overflow-x-auto pb-1 -mb-1 sm:flex-wrap sm:overflow-visible sm:pb-0 sm:mb-0 [scrollbar-width:thin]'}>
                {werkzeuge.map((w) => (
                  <li key={w.id} className={seitenleiste ? 'inline-flex items-center' : 'shrink-0 inline-flex items-center'}>
                    {/* LM-152: dieselbe Umbruch-Ausnahme wie oben (Werkzeuge zu
                        einzelnen Artikeln) — `seitenleiste` bricht lange Titel um
                        statt die 256-px-TOC-Spalte horizontal zu überhängen; `shrink-0`
                        entfällt dort ebenfalls, sonst hielte das `<li>` seine
                        Inhaltsbreite gegen den Umbruch. */}
                    <Link to={w.href}
                      className={`lc-chip no-underline hover:text-brass-700 hover:border-brass-400 ${seitenleiste ? '' : 'whitespace-nowrap'}`}>
                      <span className="text-ink-500 mr-1" aria-hidden>{w.modus === 'rechner' ? '⊞' : '▤'}</span>{w.titel}
                    </Link>
                    {/* «daneben öffnen»: Norm bleibt links, Werkzeug erscheint
                        rechts im Split-View (B-2). Nur ab lg + freier Kapazität. */}
                    {kannOeffnen && !istOffen(w.href) && (
                      <DanebenKnopf ziel={w.href} label={w.titel} oeffneDaneben={oeffneDaneben} />
                    )}
                  </li>
                ))}
              </ul>
            </KontextGruppe>
          )}
        </div>
      )}
    </section>
  );
}
