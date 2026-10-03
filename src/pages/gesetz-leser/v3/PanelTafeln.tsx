import { useMemo, type ReactNode } from 'react';
import { useLocale } from '../../../components/locale';
import { datumAnzeige } from '../../../components/rechtsprechung/format';
import { aufhebungFuerRegister } from '../../../lib/normtext/aufhebungen';
import { revisionFuerToken, type ArtikelRevision, type RevisionShard } from '../../../lib/verzahnung/artikel-revisionen';
import type { ArtikelHistorie } from '../../../lib/normtext/historie-parse';
import type { HistorieShard } from '../../../lib/normtext/historie-laden';
import { artikelLeerstellenStatus } from '../../../lib/normtext/darstellung';
import type { BotschaftBezug } from '../../../lib/materialien/botschaften';
import { PanelAenderungen } from './PanelAenderungen';
import { BotschaftZeile, PanelMaterialien } from './PanelMaterialien';
import { PanelErlaeuterungen } from './PanelErlaeuterungen';
import { ordneErlaeuterungen } from './erlaeuterungModell';
import { PanelWerkzeuge } from './PanelWerkzeuge';
import { useArtikelRevisionShard, useErlaeuterungen, useMaterialien, useRevisionen, type Geladen } from './panelKontextLaden';
import type { PanelReiter } from './panelModell';
import { bestimmungDativ, type BestimmungsWort } from './erlassWortlaut';
import { useArtikelMaterialien } from '../artikelMaterialienLaden';
import { werkzeugeAmArtikel } from '../randNotizWerkzeuge';
import { ArtikelErlaeuterung, ArtikelWerkzeug, BlattArtikelGruppe, BlattFassung, ErlassStandZeile, ErlassTeil, type BlattArtikel } from './BlattArtikel';
import { botschaftenZumArtikel } from './blattMaterialien';
import { werkzeugAnsicht } from './werkzeugModell';

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
//
// ── JEDER REITER ZUERST ZUM ARTIKEL (Auftrag 24.9.2026) ─────────────────────
// Davids Meldung «erlassblatt scrollt nicht mit wenn sich artikel verändert»
// (Beispiel KVG): nur «Entscheide» folgte dem Scroll-Spy, die übrigen Reiter
// zeigten den ganzen Erlass. Seither trägt JEDER Reiter oben den Teil zum
// aktiven Artikel (derselbe Bezug wie «Entscheide», `panelBezug`) und darunter
// den erlassweiten Teil ZUGEKLAPPT (`ErlassTeil`, «Standard ist nur der
// Artikelteil offen»). Ohne Artikelbezug steht ehrlich «Zu Art. N nichts
// erfasst.» (§8). «Materialien» nennt die Botschaften, auf die eine Änderung
// des Artikels verweist (`./blattMaterialien`, ELI-Identität).

/**
 * Bug-Check #1045 (24.9.2026, Code-Ableitung — kein Repro-Artikel im
 * Bund-Korpus: für JEDES `proArtikel`-Token deckt `public/normtext/historie/`
 * ebenfalls ein Ereignis, siehe Suchkommando in `leser-blatt-reiter-s6.test.tsx`).
 * `historie-generieren.ts` und `extrahiere-artikel-revisionen.ts` klassifizieren
 * dieselbe Fussnoten-Prosa NICHT zwingend gleich — divergieren sie künftig
 * (kein Historie-Ereignis, aber ein Revisions-Beleg), zeigte `BlattFassung`
 * nichts UND die Leerstellen-Zeile («Zu Art. N nichts erfasst») blieb
 * unterdrückt (`ohneFassung` prüft `!artRev`) — eine stille Leerstelle (§8).
 * Diese Funktion liefert dann den Beleg, den `PanelAenderungen`
 * (`data-v3-panel-aenderung-artikelstand`) ohnehin schon zugeklappt zeigt, hier
 * aber SICHTBAR im Artikelteil.
 */
export function artRevFassungFallback(
  historie: ArtikelHistorie | undefined,
  artRev: ArtikelRevision | null | undefined,
): ArtikelRevision | undefined {
  return historie?.ereignisse.length ? undefined : (artRev ?? undefined);
}

// ─── W2·27-BUND-FERTIG P5 (1.10.2026) · «Erlass in Kraft seit …» am Artikel ─────
//
// Ein Artikel ohne Historie-Ereignis und ohne Revisions-Beleg sagte im Reiter
// «Änderungen» nur «Zu Art. N nichts erfasst.» — bei den Staatsverträgen (CISG,
// LugÜ, HZÜ …) ist das der Normalfall, und die Leerzeile liest sich wie «es gab
// nie etwas», wo die Quelle schlicht keine Fussnoten führt. Die Zeile darunter
// nennt, was amtlich BELEGT ist: das Ur-Inkrafttreten des ERLASSES (Fedlex
// `dateEntryInForce` am Abstract, `public/normtext/inkrafttreten.json`, am
// 1.10.2026 für alle 28 Staatsverträge live gegen SPARQL gleich).
//
// WORTLAUT BEWUSST ERLASS-BEZOGEN: nie «Artikel gilt seit» und nie «keine
// Änderung» (§8). Bei LugÜ fehlen Anhang-Fussnoten (W2·5l M13), bei CMR Daten —
// «keine Änderung» wäre eine unbelegte Behauptung; «für die Schweiz» ebenso, weil
// nicht für jeden Vertrag belegt ist, ob Fedlex dort das Landes- oder das
// völkerrechtliche Datum führt (§7). Das Datum gehört dem Erlass, nie dem Artikel.
//
// UMFANG IST EIN SCHALTER — Entscheid David 2.10.2026 (Chat, «ja» auf Empfehlung):
// ALLE Bund-Artikel, nicht nur Staatsverträge (SR 0.*). Davor (1.10.2026,
// Orchestrator, bis David entscheidet) war er ENG auf `0.*`. Die EBENE wird
// ausdrücklich geprüft, nicht nur die SR-Form (Bug-Check #1253): ein Kanton-Erlass
// trägt eine SR-artige Nummer («SAR 291.150», «BGS 211.1»), und das Register führt
// `inkraftSeit` heute nur am Bund — der Schalter darf sich aber nicht auf dieses
// Datenloch verlassen. Die vier Bedingungen in `erlassStandFuerArtikel` gelten
// unverändert für jeden Umfang (kein Ereignis/artRev, Historie fertig, lebender
// Wortlaut, Residuum-Gate, ISO-Datum).
//
// NACHZUG 3.10.2026 (#1288, Auftrag Orchestrator): die Zeile steht NUR bei
// `inkraftGestaffelt === false` und nie an `annex_*`/`disp_*` — für ALLE Bund-Erlasse
// inklusive der schon live gezeigten Staatsverträge (SR 0.*), im selben Schalter.
// Grund (§8): bei gestaffelt in Kraft gesetzten Erlassen und bei Anhängen/Schluss-
// bestimmungen kann das Ur-Inkrafttreten des Erlasses für den einzelnen Teil falsch
// sein (Begründung: bibliothek/normtext/inkrafttreten-gestaffelt-signale-2026-10-02.md).

/**
 * Teile eines Erlasses, die nie ein eigenes «Erlass in Kraft seit» tragen: Anhänge, Schluss-/Übergangsbestimmungen
 * und (Bug-Check #1263, 3.10.2026) bei Staatsverträgen Geltungsbereich (`scope_*`) sowie Vorbehalte/Erklärungen
 * (`decl_*`) — Fedlex führt dort eigene, spätere Daten (UNO-Pakt II SR 0.103.2 decl_u2 «am 27. März 2017
 * wirksam geworden» bei Vertrag 18.9.1992; KRK SR 0.107 scope_u3, Änderung für CH 18.11.2002 bei Vertrag 26.3.1997).
 */
const TEIL_OHNE_ERLASSSTAND = /^(annex|disp|scope|decl)_/;

/**
 * DER Umfangs-Schalter (ein einziger, auch für SR 0.*): nennt dieser Artikel den
 * Erlass-Stand? Nur wenn ALLE gelten (fail-closed, §8):
 *  · Bund mit SR-Nummer;
 *  · der Erlass trägt `inkraftGestaffelt === false` AUSDRÜCKLICH — `true` (einzelne
 *    Teile früher/später in Kraft) und ein FEHLENDES Feld zählen als gestaffelt, weil
 *    das Ur-Inkrafttreten des Erlasses dann für den einzelnen Teil falsch sein kann
 *    (`BrowseErlass.inkraftGestaffelt`, Register-Projektion W2·27-BUND-FERTIG 2.10.2026);
 *  · der Artikel-Token ist kein Anhang und keine Schluss-/Übergangsbestimmung
 *    (`annex_*`, `disp_*`) und kein Geltungsbereich/Vorbehalt/Erklärung eines Staatsvertrags
 *    (`scope_*`, `decl_*`): diese Teile treten oft später als der Erlass in Kraft.
 */
export function erlassStandErlaubt({ ebene, sr, gestaffelt, token }: {
  ebene: 'bund' | 'kanton' | null | undefined; sr: string | null | undefined;
  gestaffelt: boolean | null | undefined; token: string | null | undefined;
}): boolean {
  return ebene === 'bund' && typeof sr === 'string' && sr.trim() !== '' && gestaffelt === false
    && typeof token === 'string' && token !== '' && !TEIL_OHNE_ERLASSSTAND.test(token);
}

export interface ErlassStandEingang {
  /** Ebene des Erlasses — der Umfangs-Schalter gilt nur für `'bund'`. */
  ebene: 'bund' | 'kanton' | null | undefined;
  /** SR-Nummer des Erlasses (`BrowseErlass.sr`) — für den Umfangs-Schalter. */
  erlassSr: string | null | undefined;
  /** `BrowseErlass.inkraftSeit` (ISO) — Quelle Fedlex, kein Wert = ehrlich leer. */
  inkraftSeit: string | null | undefined;
  /** `BrowseErlass.inkraftGestaffelt` — nur `false` lässt die Zeile zu, fehlend = gestaffelt. */
  inkraftGestaffelt: boolean | null | undefined;
  blatt: BlattArtikel | null;
  artRev: ArtikelRevision | null | undefined;
  /** Artikel-Revisions-Shard geladen? Sonst ist «kein Beleg» noch keine Antwort. */
  revisionenFertig: boolean;
  /** Historie-Shard geladen? Sonst blitzte die Zeile an Artikeln MIT Ereignis auf. */
  historieFertig: boolean;
  /** `null` = kein Shard (die meisten Staatsverträge) bzw. nicht erreichbar. */
  historieShard: HistorieShard | null;
}

/**
 * Das Datum (ISO), das die Zeile «Erlass in Kraft seit …» trägt — oder
 * `undefined`, wenn sie nicht steht. Alle Bedingungen müssen gelten (rein, §2):
 *  a) KEIN Beleg am Artikel: weder Historie-Ereignis noch Revisions-Beleg
 *     (dieselbe Bedingung wie `ohneFassung` — die Zeile ergänzt die Leerzeile);
 *  b) beide Quellen GELADEN (nie «nichts» vor «geladen»);
 *  c) der Artikel ist lebender Wortlaut: nicht aufgehoben, nicht gegenstandslos,
 *     keine ungeklärte Leerstelle — kein «Erlass in Kraft» über eine Leerstelle;
 *  d) KEINE ungeparste Fussnote (`residuum`): die Fussnote ist da, die Grammatik
 *     hat sie nicht als Ereignis erkannt — der Artikel könnte geändert sein, und
 *     über seinen Ur-Stand wollen wir dann nichts aussagen (§8).
 */
export function erlassStandFuerArtikel(a: ErlassStandEingang): string | undefined {
  const { ebene, erlassSr, inkraftSeit } = a;
  if (!a.blatt || !erlassStandErlaubt({ ebene, sr: erlassSr, gestaffelt: a.inkraftGestaffelt, token: a.blatt.eintrag.artikel })) return undefined;
  if (!inkraftSeit || !/^\d{4}-\d{2}-\d{2}$/.test(inkraftSeit)) return undefined;
  if (!a.revisionenFertig || !a.historieFertig || a.artRev) return undefined;
  const { eintrag, historie } = a.blatt;
  if (historie?.ereignisse.length || historie?.aufgehobenSeit || historie?.gegenstandslos) return undefined;
  if (artikelLeerstellenStatus(eintrag.bloecke, eintrag.aufgehoben, eintrag.gegenstandslos) !== 'lebt') return undefined;
  if (a.historieShard?.residuum.some((r) => r.token === eintrag.artikel)) return undefined;
  return inkraftSeit;
}

export interface PanelTafeln {
  tafeln: Readonly<Record<Exclude<PanelReiter, 'entscheide'>, ReactNode>>;
  /** Der Artikel-Revisions-Shard — geteilt mit der Tafel «Entscheide». */
  artikelRevisionen: Geladen<RevisionShard | null>;
}

export function usePanelTafeln({ erlassKey, laden, quelleUrl, ebene, stichtag, aktArtikel, artikelLabel, blatt, normZitat, wort, erlassSr, inkraftSeit, inkraftGestaffelt, historie }: {
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
  /** P5 · SR-Nummer und Ur-Inkrafttreten des Erlasses (Register) — Zeile «Erlass in Kraft seit …». */
  erlassSr?: string | null;
  inkraftSeit?: string | null;
  inkraftGestaffelt?: boolean | null;
  /** P5 · B1 (1.10.2026): der Historie-Shard des LESERS (`inhalt-zustand`, Leerlauf-
   *  Fetch) samt Bereitschaft — dieselbe Quelle, aus der `blatt.historie` stammt.
   *  Ein eigener Panel-Lader meldete «geladen», solange `blatt.historie` noch
   *  `undefined` war, und liess «Erlass in Kraft seit»/«nichts erfasst» an Artikeln
   *  MIT Ereignis aufblitzen. `wert: null` = kein Shard ODER Netzfehler (der Lader
   *  unterscheidet beides nicht, `lib/normtext/historie-laden`). */
  historie: Geladen<HistorieShard | null>;
}): PanelTafeln {
  const { locale } = useLocale();
  const revisionen = useRevisionen(erlassKey, laden);
  const artikelRevisionen = useArtikelRevisionShard(erlassKey, laden);
  const materialien = useMaterialien(erlassKey, laden, locale);
  const erlaeuterungen = useErlaeuterungen(erlassKey, laden);
  // W3-5 (Audit 25.9.2026): `unsicher` = das Manifest (`/materialien/register.json`)
  // konnte nicht geladen werden — dann ist eine leere `artMat` kein «nichts
  // erfasst», sondern derselbe Ausfall, den die Erläuterungen-Tafel gleich
  // darunter als Fehlermeldung zeigt. W3-5-Rest (30.9.2026): `unsicher` gilt
  // ebenso, wenn nur der Kanten-Shard scheiterte — dann zeigt keine andere Tafel
  // den Ausfall, die Artikel-Gruppe sagt ihn selbst (mit «Erneut laden»);
  // beim Manifest-Ausfall bleibt sie ausgeblendet (die Tafel meldet ihn schon).
  // ERGÄNZUNG 30.9.2026 (#1181, derselbe Tag, später): der Satz «dann zeigt keine
  // andere Tafel den Ausfall» gilt seither nur noch für zugeklappte Reiter — die
  // Tafel «Erläuterungen» zeigt bei aufgeklapptem Reiter ihre EIGENE Fehlerzeile
  // (`PanelErlaeuterungen`, Shard-Ausfall ⇒ «Ein Teil der behördlichen
  // Erläuterungen …»). Der Ausfall steht dann zweimal, an zwei verschiedenen
  // Stellen (am Artikel, im Erlass-Teil) — gewollt, beide tragen «Erneut laden»
  // und heilen einander über `beiKantenShardErholt`.
  const [artikelMaterialien, artikelMaterialienUnsicher, artikelMaterialienErneut, artikelShardFehler] = useArtikelMaterialien(erlassKey, laden);

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
  const artMat = token ? artikelMaterialien(token) : [];
  const artWz = token ? werkzeugeAmArtikel(erlassKey, token) : [];
  const zu = `Zu ${artikelLabel ?? bestimmungDativ(wort)}`;
  const artBot = botschaftenZumArtikel(materialien.wert?.botschaften, blatt?.historie);
  const mat = materialien.wert;
  const matZahl = mat ? (mat.botschaften?.length ?? 0) + (mat.vernehmlassungen?.length ?? 0) + (mat.kanton?.length ?? 0) : null;
  // «Änderungen» ohne jeden Beleg am Artikel: weder Fassungshistorie noch ein
  // Eintrag im Artikel-Revisions-Shard — erst dann ist «nichts» eine Antwort.
  // B1: erst wenn BEIDE Quellen geladen sind — die Historie kommt vom Leser, nicht
  // vom Panel-Lader (`historie.fertig`), sonst blitzte die Leerzeile an Artikeln
  // mit Ereignis kurz auf.
  const ohneFassung = !blatt?.historie?.ereignisse.length && artikelRevisionen.fertig && historie.fertig && !artRev;
  const artRevOhneHistorie = artRevFassungFallback(blatt?.historie, artRev);
  const erlassStand = erlassStandFuerArtikel({
    ebene, erlassSr, inkraftSeit, inkraftGestaffelt, blatt, artRev, revisionenFertig: artikelRevisionen.fertig,
    historieFertig: historie.fertig, historieShard: historie.wert,
  });
  // W3-4 (Audit 25.9.2026): für KEINEN Kanton liegen Änderungsdaten vor (0 von
  // 231 Sidecars kantonal, Beleg in `PanelAenderungen`) — das ist eine Auskunft
  // über den ERLASS, nicht über den einzelnen Paragrafen. «Zu § 44 nichts
  // erfasst.» (die artikelscharfe Leerzeile unten) suggerierte aber genau das:
  // eine Prüfung DIESES Paragrafen, die nie stattfand. Dieselbe Bedingung wie
  // in `PanelAenderungen` (`stand.wert === null && ebene === 'kanton'`).
  const aenderungenAmKantonNichtErfasst = ebene === 'kanton' && revisionen.fertig && revisionen.wert === null;
  // Ist der ganze Erlass leer, sagt das die Tafel selbst — ein zweites «Zu Art. N
  // nichts erfasst.» darüber wäre dieselbe Auskunft zweimal (Artikel ⊂ Erlass).
  // W3-3 (Audit 25.9.2026): EINE Zählweise für den Reiter — die gruppierte
  // (wie der Gruppenkopf in `PanelErlaeuterungen` sie zeigt), nicht die rohe
  // Listenlänge. Eine artikelweise Wegleitung (z. B. ArG, «SECO · Wegleitung,
  // artikelweise») zählt in der Rohliste einmal je Artikel — 76 Zeilen, aber
  // 6 tatsächliche Dokumente/Reihen; die Klappzeile «Alle Erläuterungen des
  // Erlasses» nannte bisher die rohe Zahl und widersprach dem Gruppenkopf (§5).
  const erlZahl = erlaeuterungen.wert ? ordneErlaeuterungen(erlaeuterungen.wert.liste).length : null;
  const wzZahl = erlassKey ? werkzeugAnsicht(erlassKey).verfuegbar.length : null;

  return {
    artikelRevisionen,
    tafeln: {
      aenderungen: (
        <>
          <BlattFassung artikel={blatt} erlassKey={erlassKey} zitat={normZitat} wort={wort} />
          {artRevOhneHistorie && (
            <p data-v3-blatt-fassung-revision={token} className="px-3 pt-2 text-body-s text-ink-700">
              {normZitat} zuletzt geändert{artRevOhneHistorie.as ? ` durch ${artRevOhneHistorie.as}` : ''}, in Kraft seit {datumAnzeige(artRevOhneHistorie.iso)}.
            </p>
          )}
          <BlattArtikelGruppe titel={zu} zahl={0} daten="aenderungen" token={token}
            geladen={ohneFassung && !aenderungenAmKantonNichtErfasst}>{null}</BlattArtikelGruppe>
          {erlassStand && token && <ErlassStandZeile iso={erlassStand} token={token} />}
          {/* W3-4: `zahl={0}` statt `null` erzwingt bei `ErlassTeil` den
              UNGEKLAPPTEN Pfad («Null im ganzen Erlass: keine Klappzeile») —
              der ehrliche Leerzustand aus `PanelAenderungen` steht dann sofort
              sichtbar, wie bei Materialien/Erläuterungen/Werkzeuge am Kanton. */}
          <ErlassTeil was="Änderungen"
            zahl={aenderungenAmKantonNichtErfasst ? 0 : (revisionen.wert?.revisionen.length ?? null)} daten="aenderungen">
            <PanelAenderungen stand={revisionen} quelleUrl={quelleUrl} stichtag={stichtag} ebene={ebene}
              aufhebung={aufhebung} botschaftNachKey={botschaftNachKey} artikel={artikel} locale={locale} />
          </ErlassTeil>
        </>
      ),
      materialien: (
        <>
          {token && materialien.fertig && matZahl !== 0 && (
            // Befund Bau W1f (#1045, 24.9.2026): der Artikelteil fand nur
            // Register-Botschaften mit Fussnoten-Treffer (z. B. BGBM Art. 2 ohne
            // BBl 2022 2651) — ehrlich offenlegen statt wegglätten (§8), Zuordnung
            // bleibt unverändert (Ausbau über Geschäftsdaten: separater Schritt).
            <p data-v3-blatt-materialien-hinweis={token} className="px-3 pb-1 pt-0.5 text-micro leading-snug text-ink-500">
              Nur Botschaften, die eine Fussnote dieses Artikels nennt — bei Leerstelle lohnt ein Blick in «Alle Materialien des Erlasses» unten.
            </p>
          )}
          <BlattArtikelGruppe titel={zu} zahl={artBot.length} daten="materialien" token={token} geladen={materialien.fertig && matZahl !== 0}>
            {artBot.map((b) => <BotschaftZeile key={b.key} b={b} aenderung={aenderungNachBotschaft.get(b.key)} locale={locale} />)}
          </BlattArtikelGruppe>
          <ErlassTeil was="Materialien" zahl={matZahl} daten="materialien">
            <PanelMaterialien stand={materialien} ebene={ebene} locale={locale} aenderungNachBotschaft={aenderungNachBotschaft} />
          </ErlassTeil>
        </>
      ),
      erlaeuterungen: (
        <>
          <BlattArtikelGruppe titel={zu} zahl={artMat?.length ?? 0} daten="erlaeuterungen" token={token}
            geladen={artMat !== undefined && erlZahl !== 0 && !artikelMaterialienUnsicher}
            ladefehler={artikelShardFehler ? { gegenstand: `Erläuterungen ${zu.replace(/^Zu /, 'zu ')}`, onErneut: artikelMaterialienErneut } : undefined}>
            {(artMat ?? []).map((m) => <ArtikelErlaeuterung key={m.key} m={m} />)}
          </BlattArtikelGruppe>
          <ErlassTeil was="Erläuterungen" zahl={erlZahl} daten="erlaeuterungen">
            <PanelErlaeuterungen stand={erlaeuterungen} revisionShard={artikelRevisionen.wert} ebene={ebene} />
          </ErlassTeil>
        </>
      ),
      werkzeuge: (
        <>
          <BlattArtikelGruppe titel={zu} zahl={artWz.length} daten="werkzeuge" token={token} geladen={wzZahl !== 0}>
            {artWz.map((w) => <ArtikelWerkzeug key={w.id} w={w} />)}
          </BlattArtikelGruppe>
          <ErlassTeil was="Werkzeuge" zahl={wzZahl} daten="werkzeuge">
            <PanelWerkzeuge erlassKey={erlassKey ?? ''} />
          </ErlassTeil>
        </>
      ),
    },
  };
}
