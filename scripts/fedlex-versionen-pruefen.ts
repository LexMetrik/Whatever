// ─── Fedlex-Versions-Monitoring: erkennen, wenn gepinnte Stände veralten ────
//
// fedlex-cache.sh prüft nur, ob die GEPINNTEN Konsolidierungen abrufbar sind
// und die Pflicht-Anker enthalten — es erkennt NICHT, wenn Fedlex eine
// neuere (oder angekündigte künftige) Konsolidierung publiziert hat.
// Dieses Skript schliesst die Lücke per SPARQL (amtlicher Endpoint):
//
//   je gepinntem ELI alle jolux:Consolidation-Daten (dateApplicability)
//   → neueste GELTENDE Konsolidierung (≤ heute)  vs.  gepinnter Stand
//   → ANGEKÜNDIGTE künftige Fassungen (> heute) als Vorwarnung
//   → GANZ-AUFHEBUNG des Erlasses (jolux:dateNoLongerInForce, Abstract-Ebene):
//     ≤ heute ⇒ Erlass ausser Kraft, Snapshot nicht mehr geltend (ROT);
//     > heute ⇒ Ablösung angekündigt (WARN). (G-AUFH: Aufhebungs-Blindheit)
//     AUSNAHME: ist die Aufhebung in src/lib/normtext/aufhebungen.ts ANERKANNT
//     (bewusst historisch geführt), wird der Repeal LIVE gegen das amtliche
//     dateNoLongerInForce verifiziert und zu einem ehrlichen OK gehoben — ein
//     UNDEKLARIERTER Repeal bleibt ROT (§8-ehrlich).
//
// SSoT §5: Die Liste der Gesetze/Pins wird aus scripts/fedlex-cache.sh
// geparst — sie wird hier NICHT dupliziert.
//
//   npm run check:fedlex-versionen
//
// Exit 1 → mindestens ein Pin ist ÜBERHOLT (neuere geltende Konsolidierung
//          existiert) ODER der Erlass ist ganz AUFGEHOBEN (ohne anerkannte
//          Deklaration bzw. mit widersprüchlicher Deklaration): Caches neu
//          pinnen bzw. Snapshot entfernen/ersetzen oder aufhebungen.ts
//          nachführen, Anker/Wortlaute neu verifizieren (§7), Quellen-Register
//          nachführen.
// Exit 0 → alle Pins aktuell; künftige Fassungen/Aufhebungen nur als HINWEIS;
//          anerkannte Aufhebungen als ehrliches OK «bewusst historisch».
// Exit 2 → Endpoint/Netz-Fehler (keine Aussage möglich) — NUR wenn kein Rot-Befund vorliegt:
//          Drift (1) hat Vorrang vor «keine Aussage» (2), `verbindeExits` (drift-logik.ts).
//          Netzfehler = NetzFehler aus netzFetch (fetch-Wurf, Timeout, 429/5xx, Abbruch beim
//          Lesen). Struktur-/Programmfehler (leere Pin-Liste, 4xx, HTML statt JSON, Parse- und
//          Code-Fehler) sind KEIN Netzausfall ⇒ Exit 1 (Gegenprüfung Runde 2, 5.10.2026).
//
// --kanonik-textvergleich (nur im Normen-Monitor, `check:netz:kette`; Entscheid David
// 5.10.2026 «wichtig ist gesetzestext»): ein nicht-kanonischer Pin wird gegen die kanonische
// Revision TEXTUELL verglichen (Tags weg, Leerraum normiert). Gleicher Text ⇒ nur HINWEIS
// (Fedlex hat nur das Markup neu publiziert, z. B. OR html-2→3 am 5.10.2026: 36 Diff-Zeilen,
// alle <i>→<span class="man-link-no-link">; fedlex-frische.yml re-pint das von selbst);
// anderer Text ⇒ ROT wie bisher; Abruf scheitert am Netz ⇒ «keine Aussage» (Exit 2, nur
// ohne Rot-Befund). OHNE Flag bleibt jeder
// nicht-kanonische Pin ROT — darauf baut die Selbstheilung in fedlex-frische.yml
// («Arbiter rot ⇒ repin-kanonik»).
// SSoT §5: die Pin-Liste wird aus scripts/fedlex-cache.sh geparst — die
// Parse-Logik liegt einmal in scripts/fedlex-pins.ts (auch vom Gegenprüfungs-Tor genutzt).
import { lesePins, lesePinsVoll, type Pin } from './fedlex-pins';
import { loeseHtmlManifeste } from './fedlex-manifest';
import { PDF_EMBED_QUELLEN } from '../src/lib/normtext/pdf-embed.ts';
import { anerkannteAufhebungNachEli } from '../src/lib/normtext/aufhebungen.ts';
import { istWiederholbarerStatus } from './normtext/netz-retry';
import { verbindeExits } from './normtext/drift-logik';

const ENDPOINT = 'https://fedlex.data.admin.ch/sparqlendpoint';
const FILESTORE = 'https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli';

/** Sichtbarer Text einer Fedlex-HTML-Manifestation: Tags weg, Leerraum normiert. */
export function sichtbarerText(html: string): string {
  return html
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** URL des gepinnten html-N, wie fedlex-cache.sh sie baut (n=0 ⇒ Alias ohne Suffix). */
export function gepinnteHtmlUrl(p: { eli: string; konsKompakt: string; n: number }): string {
  const pfad = p.eli.replace(/\//g, '-');
  const basis = `${FILESTORE}/${p.eli}/${p.konsKompakt}/de/html/fedlex-data-admin-ch-eli-${pfad}-${p.konsKompakt}-de-html`;
  return p.n === 0 ? `${basis}.html` : `${basis}-${p.n}.html`;
}

/** Quelle nicht erreichbar — keine Aussage (Exit 2). Alles andere, was wirft, ist Exit 1. */
export class NetzFehler extends Error {}

const meldung = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/**
 * fetch-Hülle mit Netz-Klassifikation an EINER Stelle (Befund 2, Gegenprüfung 5.10.2026):
 * Wurf von fetch (DNS, Verbindung, Timeout/Abort) und wiederholbare Status (429/5xx,
 * istWiederholbarerStatus aus netz-retry.ts) ⇒ NetzFehler. Der Body wird gepuffert, damit ein
 * Abbruch beim Lesen ebenfalls als NetzFehler gilt. 4xx, HTML statt JSON und Parse-Fehler
 * bleiben gewöhnliche Fehler ⇒ Exit 1 (löst sich nicht von selbst).
 */
export function netzFetch(fetchImpl: typeof fetch): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    let res: Response;
    try {
      res = await fetchImpl(input, init);
    } catch (e) {
      throw new NetzFehler(`${url}: ${meldung(e)}`);
    }
    if (istWiederholbarerStatus(res.status)) throw new NetzFehler(`HTTP ${res.status} auf ${url}`);
    let body: ArrayBuffer;
    try {
      body = await res.arrayBuffer();
    } catch (e) {
      throw new NetzFehler(`${url}: Abbruch beim Lesen (${meldung(e)})`);
    }
    return new Response([204, 205, 304].includes(res.status) ? null : body, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    });
  }) as typeof fetch;
}

async function holeText(url: string, fetchImpl: typeof fetch): Promise<string> {
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(90_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} auf ${url}`);
  return sichtbarerText(await res.text());
}

// P1-b (QS-CURRENCY): die 'pdf-embed'-Erlasse (EMRK, NYÜ) waren im Versions-
// Monitoring strukturell blind — check:fedlex-versionen sah nur lesePins()
// (cache.sh). Zweite Quelle additiv aus PDF_EMBED_QUELLEN (trägt eli+kons als
// YYYYMMDD) in dieselbe SPARQL-Currency-Prüfung mergen; die Filestore-Integrität
// bleibt zusätzlich in check:pdf(-netz). lesePins()-Signatur unverändert
// (auch vom Gegenprüfungs-Tor genutzt).
function lesePdfEmbedPins(): Pin[] {
  return PDF_EMBED_QUELLEN.map((q) => ({
    name: `${q.key.toLowerCase()} [pdf-embed]`,
    eli: q.eli,
    kons: `${q.kons.slice(0, 4)}-${q.kons.slice(4, 6)}-${q.kons.slice(6, 8)}`,
  }));
}

// ─── SPARQL-Antwort → Befund je Erlass (reine, testbare Parse-Logik) ─────────
// G-AUFH: `noLonger` = jolux:dateNoLongerInForce auf der ConsolidationAbstract
// (Ganz-Aufhebung des Erlasses). Die OPTIONAL-Klausel liefert denselben
// noLonger-Wert auf jeder date-Zeile eines aufgehobenen Abstracts — wir halten
// das früheste Datum (defensiv; je Abstract sollte es eindeutig sein).
type SparqlBinding = {
  abstract: { value: string };
  date: { value: string };
  noLonger?: { value: string };
};
export type KonsBefund = { daten: string[]; noLonger: string | null };

export function parseKonsolidierungen(bindings: SparqlBinding[]): Map<string, KonsBefund> {
  const map = new Map<string, KonsBefund>();
  for (const b of bindings) {
    const eli = b.abstract.value.replace('https://fedlex.data.admin.ch/eli/', '');
    const befund = map.get(eli) ?? { daten: [], noLonger: null };
    befund.daten.push(b.date.value.slice(0, 10));
    if (b.noLonger?.value) {
      const nl = b.noLonger.value.slice(0, 10);
      if (befund.noLonger === null || nl < befund.noLonger) befund.noLonger = nl;
    }
    map.set(eli, befund);
  }
  for (const befund of map.values()) befund.daten.sort();
  return map;
}

async function frageKonsolidierungen(pins: Pin[], fetchImpl: typeof fetch): Promise<Map<string, KonsBefund>> {
  const werte = pins.map((p) => `<https://fedlex.data.admin.ch/eli/${p.eli}>`).join(' ');
  // G-AUFH: dateNoLongerInForce (Ganz-Aufhebung) additiv per OPTIONAL abfragen —
  // liegt auf der ConsolidationAbstract (?abstract), nicht auf der Consolidation.
  const query = `
PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
SELECT ?abstract ?date ?noLonger WHERE {
  VALUES ?abstract { ${werte} }
  ?c jolux:isMemberOf ?abstract ; jolux:dateApplicability ?date .
  OPTIONAL { ?abstract jolux:dateNoLongerInForce ?noLonger }
}`;
  const res = await fetchImpl(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/sparql-results+json',
    },
    body: `query=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error(`SPARQL-Endpoint antwortet ${res.status}`);
  const json = (await res.json()) as { results: { bindings: SparqlBinding[] } };
  return parseKonsolidierungen(json.results.bindings);
}

// ─── Entscheidungslogik je Pin (rein, testbar) ──────────────────────────────
// Reihenfolge/Wortlaut für nicht-aufgehobene Erlasse byte-gleich zum Altstand;
// die zwei Aufhebungs-Zweige (AUFGEHOBEN / AUFHEBUNG) sind additiv.
export type Verdikt =
  | { art: 'OK'; text: string }
  | { art: 'ÜBERHOLT'; text: string }
  | { art: 'HINWEIS'; text: string }
  | { art: 'AUFGEHOBEN'; text: string }
  | { art: 'AUFHEBUNG'; text: string }
  | { art: 'FEHLER'; text: string };

export function bewerte(
  pin: Pin,
  daten: string[] | undefined,
  noLonger: string | null,
  heute: string,
): Verdikt {
  if (!daten || daten.length === 0) {
    // Kein Treffer kann auch heissen: ELI-Schreibweise weicht ab → laut melden.
    return {
      art: 'FEHLER',
      text: `FEHLER     ${pin.name}: keine Konsolidierungen via SPARQL gefunden (ELI ${pin.eli} prüfen!)`,
    };
  }
  // ─── G-AUFH · Anerkannte Aufhebung (§8-ehrlich, PR #287) ───────────────────
  // Ein von Fedlex GANZ aufgehobener Erlass bleibt bei uns als HISTORISCHE
  // Fassung nutzbar (Juristinnen brauchen aufgehobene Fassungen), nie als
  // geltend. Ist die Aufhebung in aufhebungen.ts DEKLARIERT (anerkannt), wird
  // sie hier LIVE gegen das amtliche dateNoLongerInForce verifiziert und zu
  // einem ehrlichen OK gehoben — statt den Check für immer ROT zu halten:
  //   • Fedlex bestätigt die Aufhebung (noLonger ≤ heute) UND das Datum stimmt
  //     mit der Deklaration ⇒ OK «bewusst historisch geführt».
  //   • Fedlex bestätigt sie, aber das Datum weicht ab ⇒ ROT (Deklaration
  //     nachführen).
  //   • Fedlex bestätigt KEINE geltende Aufhebung (kein/künftiges noLonger) ⇒
  //     die Deklaration ist falsch (wir würden einen geltenden Erlass als
  //     aufgehoben zeigen) ⇒ ROT.
  // Ein UNDEKLARIERTER Repeal fällt durch auf die AUFGEHOBEN-Blindheitsprüfung
  // unten und bleibt ROT (Sinn von G-AUFH, PR #285).
  const anerkannt = anerkannteAufhebungNachEli(pin.eli);
  if (anerkannt) {
    const nf = anerkannt.nachfolger
      ? ` — Nachfolger SR ${anerkannt.nachfolger.sr} (${anerkannt.nachfolger.eli})`
      : '';
    if (noLonger && noLonger <= heute && noLonger === anerkannt.seit) {
      return {
        art: 'OK',
        text: `OK (aufgehoben) ${pin.name}: ${pin.eli} amtlich aufgehoben per ${noLonger}, bewusst als historische Fassung geführt${nf}.`,
      };
    }
    if (noLonger && noLonger <= heute) {
      return {
        art: 'AUFGEHOBEN',
        text: `AUFGEHOBEN ${pin.name}: Deklaration seit=${anerkannt.seit}, Fedlex dateNoLongerInForce=${noLonger} → Deklaration in aufhebungen.ts nachführen!`,
      };
    }
    return {
      art: 'AUFGEHOBEN',
      text: `AUFGEHOBEN ${pin.name}: als aufgehoben DEKLARIERT (seit ${anerkannt.seit}), aber Fedlex meldet KEINE geltende Aufhebung (${noLonger ?? 'kein noLonger'}) → Deklaration entfernen (Erlass geltend)!`,
    };
  }
  // G-AUFH: Ganz-Aufhebung hat VORRANG vor der Datums-Prüfung. Ein aufgehobener
  // Erlass ist nie „geltend geprüft", egal wie die dateApplicability-Daten liegen
  // — sonst bliebe er still als grün stehen (§7/§8-Verstoss).
  if (noLonger && noLonger <= heute) {
    return {
      art: 'AUFGEHOBEN',
      text: `AUFGEHOBEN ${pin.name}: Erlass (${pin.eli}) aufgehoben per ${noLonger} — Snapshot nicht mehr geltend, Massnahme nötig (Erlass entfernen/ersetzen, Verweise prüfen)!`,
    };
  }
  const geltend = daten.filter((d) => d <= heute);
  const kuenftig = daten.filter((d) => d > heute);
  const neuesteGeltende = geltend[geltend.length - 1] ?? '(keine)';

  if (neuesteGeltende > pin.kons) {
    return {
      art: 'ÜBERHOLT',
      text: `ÜBERHOLT   ${pin.name}: gepinnt ${pin.kons}, geltend ist ${neuesteGeltende} → neu pinnen + §7-Verifikation!`,
    };
  }
  // G-AUFH: künftige Ganz-Aufhebung ⇒ WARN-Vorwarnung mit Datum (blockiert nicht).
  if (noLonger && noLonger > heute) {
    return {
      art: 'AUFHEBUNG',
      text: `AUFHEBUNG  ${pin.name}: gepinnt ${pin.kons} (aktuell) — Erlass wird AUFGEHOBEN per ${noLonger} → Ablösung/Entfernung einplanen!`,
    };
  }
  if (kuenftig.length > 0) {
    return {
      art: 'HINWEIS',
      text: `HINWEIS    ${pin.name}: gepinnt ${pin.kons} (aktuell) — künftige Fassung(en) angekündigt: ${kuenftig.join(', ')}`,
    };
  }
  return {
    art: 'OK',
    text: `OK         ${pin.name}: gepinnt ${pin.kons} = neueste Konsolidierung`,
  };
}

// ─── Lauf ────────────────────────────────────────────────────────────────────
// Erst ALLE Pins prüfen, dann entscheiden (Befund 1, Gegenprüfung 5.10.2026): früher brach ein
// Netzfehler im Kanonik-Teil mit Exit 2 ab, BEVOR der Rot-Exit erreicht war — ein überholter
// Pin verschwand dann hinter dem Netz-Zettel. Jetzt zählt ein Netzfehler je Pin/Abfrage als
// «ohne Aussage», und am Ende entscheidet verbindeExits: Rot (1) vor Netz (2) vor Grün (0).
export type LaufOptionen = {
  /** Injizierbar für Tests; wird immer in netzFetch gehüllt. */
  fetchImpl?: typeof fetch;
  /** ISO-Datum; Default: heutiges Lokaldatum. */
  heute?: string;
  textvergleich?: boolean;
  /** Inhalt von fedlex-cache.sh (Tests); Default: die Datei. */
  shText?: string;
};

async function lauf(opt: LaufOptionen = {}): Promise<number> {
  const f = netzFetch(opt.fetchImpl ?? fetch);
  const cachePins = lesePins(opt.shText);
  if (cachePins.length === 0) {
    // Strukturfehler, kein Netzausfall (Befund 2): Exit 1, nie «keine Aussage».
    console.error('FEHLER: keine EINTRAEGE in scripts/fedlex-cache.sh gefunden (Format geändert?) — Strukturfehler, Exit 1.');
    return 1;
  }
  // cache.sh-Pins UND PDF-Embed-Pins gemeinsam prüfen (DoD: beide Pin-Quellen).
  const pins = [...cachePins, ...lesePdfEmbedPins()];

  const jetzt = new Date();
  const heute = opt.heute ?? `${jetzt.getFullYear()}-${String(jetzt.getMonth() + 1).padStart(2, '0')}-${String(jetzt.getDate()).padStart(2, '0')}`;

  let konsolidierungen: Map<string, KonsBefund>;
  try {
    konsolidierungen = await frageKonsolidierungen(pins, f);
  } catch (e) {
    if (!(e instanceof NetzFehler)) throw e; // Struktur-/Programmfehler ⇒ Exit 1 (Aufrufer)
    // Ohne Konsolidierungsdaten liegt noch KEIN Befund vor — reine Netzlage.
    console.error(`FEHLER: Fedlex-SPARQL nicht erreichbar (${e.message}) — keine Aussage möglich.`);
    return 2;
  }

  let ueberholt = 0;
  let angekuendigt = 0;
  let aufgehoben = 0;
  let aufhebungAngekuendigt = 0;
  let ohneAussage = 0; // Netzfehler NACH der Datums-Prüfung (Kanonik-Teil)

  console.log(`Fedlex-Versions-Monitoring: ${pins.length} gepinnte Gesetze (${cachePins.length} cache.sh + ${pins.length - cachePins.length} pdf-embed; heute: ${heute})\n`);
  for (const pin of pins) {
    const befund = konsolidierungen.get(pin.eli);
    const v = bewerte(pin, befund?.daten, befund?.noLonger ?? null, heute);
    console.log(v.text);
    if (v.art === 'FEHLER' || v.art === 'ÜBERHOLT') ueberholt++;
    else if (v.art === 'AUFGEHOBEN') aufgehoben++;
    else if (v.art === 'AUFHEBUNG') aufhebungAngekuendigt++;
    else if (v.art === 'HINWEIS') angekuendigt++;
  }

  // ─── P1-a/b Kanonik-Arbiter: gepinntes html-N == kanonische isExemplifiedBy ──
  // Der Datums-Check oben erkennt eine NEUERE Konsolidierung, aber NICHT, wenn ein
  // Pin auf einer nicht-kanonischen html-Manifestation (Alias-URL / veraltete
  // Revision) desselben Datums klebt (Querschnitts-Wurzel: Alt-Generations-Dumps
  // + Soft-404-Shells). Darum je cache.sh-Pin das kanonische html-N via
  // isExemplifiedBy auflösen und gegen das gepinnte n prüfen. Fedlex re-issued
  // dieselbe Konsolidierung (Fussnoten/Soft-Hyphen), das -N inkrementiert → ein
  // Pin unter der neuesten Revision ist die einzige treue Fassung (§7).
  const vollPins = lesePinsVoll(opt.shText);
  const textvergleich = opt.textvergleich ?? false;
  let unkanonisch = 0;
  let nurMarkup = 0;
  let manifeste: Awaited<ReturnType<typeof loeseHtmlManifeste>> | null = null;
  try {
    manifeste = await loeseHtmlManifeste(vollPins, f);
  } catch (e) {
    if (!(e instanceof NetzFehler)) throw e;
    console.error(`FEHLER: Kanonik-Auflösung nicht möglich (${e.message}) — Kanonik-Arbiter ohne Aussage.`);
    ohneAussage++;
  }
  if (manifeste) {
    console.log('\n── Kanonik-Arbiter (html-N vs. isExemplifiedBy) ──');
    for (const p of vollPins) {
      const b = manifeste.get(p.name);
      if (!b || b.n === null || !b.file) continue; // keine html-Manifestation → Alias+Sonde, s. cache.sh
      if (b.n !== p.n) {
        if (textvergleich) {
          let alt: string;
          let neu: string;
          try {
            [alt, neu] = [await holeText(gepinnteHtmlUrl(p), f), await holeText(b.file, f)];
          } catch (e) {
            // Nur ein NetzFehler ist «keine Aussage»; 4xx/Programmfehler ⇒ Exit 1 (Aufrufer).
            if (!(e instanceof NetzFehler)) throw e;
            console.log(`KEINE AUSSAGE ${p.name}: gepinnt html-${p.n}, kanonisch html-${b.n} — Textvergleich nicht möglich (${e.message}).`);
            ohneAussage++;
            continue;
          }
          if (alt === neu) {
            console.log(`HINWEIS    ${p.name}: gepinnt html-${p.n}, kanonisch html-${b.n} — sichtbarer Text GLEICH (${neu.length} Zeichen), nur Markup neu publiziert → fedlex-frische re-pinnt.`);
            nurMarkup++;
            continue;
          }
          console.log(`TEXT-DRIFT ${p.name}: html-${p.n} ≠ html-${b.n} im sichtbaren Text (${alt.length} vs. ${neu.length} Zeichen).`);
        }
        console.log(`NICHT-KANONISCH  ${p.name}: gepinnt html-${p.n}, kanonisch html-${b.n} (${b.file}) → re-pinnen (fedlex-repin-kanonik.ts) + regenerieren!`);
        unkanonisch++;
      }
    }
    if (unkanonisch === 0 && nurMarkup === 0 && ohneAussage === 0) console.log('Alle Pins docken an der kanonischen html-Manifestation (isExemplifiedBy).');
  }

  console.log('');
  const rot = ueberholt > 0 || unkanonisch > 0 || aufgehoben > 0;
  if (rot) {
    if (aufgehoben > 0) console.log(`${aufgehoben} Pin(s) AUFGEHOBEN — der Erlass ist ganz ausser Kraft bzw. die Aufhebungs-Deklaration stimmt nicht mit der amtlichen Quelle überein: Snapshot entfernen/ersetzen oder aufhebungen.ts nachführen (§7/§8).`);
    if (ueberholt > 0) console.log(`${ueberholt} Pin(s) überholt oder unauffindbar — Caches/Quellen-Register nachführen, betroffene Anker und Wortlaute neu verifizieren (§7).`);
    if (unkanonisch > 0) console.log(`${unkanonisch} Pin(s) nicht-kanonisch (html-N ≠ isExemplifiedBy) — Alias-/Alt-Revisions-Wurzel: re-pinnen + Snapshots/Struktur regenerieren.`);
  }
  if (ohneAussage > 0) {
    console.log(`${ohneAussage} Kanonik-Prüfung(en) ohne Aussage (Quelle nicht erreichbar)${rot ? ' — echter Befund hat Vorrang, Exit 1.' : ' — Exit 2.'}`);
  }
  const exit = verbindeExits([rot ? 1 : 0, ohneAussage > 0 ? 2 : 0]);
  if (exit !== 0) return exit;
  // G-AUFH: künftige Ganz-Aufhebung(en) sind eine Vorwarnung, blockieren nicht.
  if (aufhebungAngekuendigt > 0) {
    console.log(`${aufhebungAngekuendigt} Gesetz(e) mit ANGEKÜNDIGTER Ganz-Aufhebung — Ablösung/Entfernung im Verfallsregister/Gesetzgebungs-Monitoring einplanen.`);
  }
  if (angekuendigt > 0) {
    console.log(`Alle Pins aktuell. ${angekuendigt} Gesetz(e) mit ANGEKÜNDIGTEN künftigen Fassungen — Inkrafttreten im Verfallsregister/Gesetzgebungs-Monitoring einplanen.`);
  } else {
    console.log('Alle Pins aktuell, keine künftigen Fassungen angekündigt.');
  }
  return 0;
}

/** Exit-Code des Laufs: Struktur-/Programmfehler (alles ausser NetzFehler) ⇒ 1, nie 2 (Befund 2). */
export async function fuehreAus(opt: LaufOptionen = {}): Promise<number> {
  try {
    return await lauf(opt);
  } catch (e) {
    console.error(`FEHLER (Struktur/Programm, Exit 1): ${e instanceof Error ? (e.stack ?? e.message) : String(e)}`);
    return 1;
  }
}

if (!process.env.VITEST) {
  void fuehreAus({ textvergleich: process.argv.includes('--kanonik-textvergleich') }).then((code) => process.exit(code));
}
