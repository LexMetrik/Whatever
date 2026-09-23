// scripts/entstehung/entstehung-projektion.ts — die REINE Ableitung der
// Entstehungs-Projektion (FAHRPLAN-MATERIALIEN-VERZAHNUNG §11.4/§11.6, E3).
//
// Warum die Projektion existiert und was sie NICHT tut: `src/lib/entstehung/
// projektion.ts` (Kopf). Hier steht nur, WIE sie gebaut wird — als reine
// Funktion ohne Datei-/Netz-Zugriff, damit der Generator (`-run.ts`), das Tor
// (`check-entstehung.ts`) und der Unit-Test DIESELBE Rechnung fahren (§5) und
// der Determinismus-Wächter überhaupt etwas zu vergleichen hat (§11.6 (5)).
//
// §2 Determinismus: kein `Date.now()`, keine Heuristik, keine Reihenfolge aus
// einem Verzeichnis-Listing — jedes Ergebnis ist nach Schlüssel sortiert.

import type {
  EntstehungAenderung, EntstehungBotschaft, EntstehungProjektion,
} from '../../src/lib/entstehung/projektion.ts';
import { PROJEKTION_PROFIL, ocKurzform } from '../../src/lib/entstehung/projektion.ts';

/** Der Ausschnitt des Historie-Shards, den die Ableitung liest. */
export interface HistorieQuelle {
  artikel: Record<string, { ereignisse?: Array<{ quellen?: Array<{ url?: string | null }> }> }>;
}

/** Der Ausschnitt des Revisions-Sidecars, den die Ableitung liest. */
export interface RevisionsQuelle {
  abgerufen?: string;
  revisionen?: Array<{
    art?: string;
    ocUri?: string;
    titelDe?: string;
    roFundstelle?: string;
    dateEntryInForce?: string;
    /** Alle Etappen eines gestaffelt in Kraft gesetzten Erlasses (S6-D1, aufsteigend). */
    etappen?: string[];
    botschaftKey?: string;
    quelleUrl?: string;
  }>;
}

/** Der Ausschnitt der Botschaften-Quelle, den die Ableitung liest. */
export interface BotschaftQuelle {
  key: string;
  titel: string;
  nummer?: string;
  quelleUrl: string;
  stand: string;
  ereignisse?: EntstehungBotschaft['ereignisse'];
}

/** Alle oc-Kurzformen, die in der Fassungshistorie dieses Erlasses vorkommen.
 *
 *  DAS ist der Zuschnitt der Projektion: was am Artikel nie als Fussnote
 *  auftaucht, kann die Karte auch nie brauchen. Ohne diesen Filter trüge die
 *  Datei die komplette Revisionsliste des Erlasses mit (bis 132 KB) — für eine
 *  Karte, die je Klick höchstens eine Handvoll Ereignisse zeigt (§15). */
export function ocsAusHistorie(h: HistorieQuelle): Set<string> {
  const menge = new Set<string>();
  for (const eintrag of Object.values(h.artikel ?? {})) {
    for (const e of eintrag.ereignisse ?? []) {
      for (const q of e.quellen ?? []) {
        const oc = ocKurzform(q.url);
        if (oc) menge.add(oc);
      }
    }
  }
  return menge;
}

/** Nach Schlüssel sortiertes Objekt (stabile Byte-Folge, §2). */
function sortiert<T>(paare: Array<readonly [string, T]>): Record<string, T> {
  const o: Record<string, T> = {};
  for (const [k, v] of [...paare].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))) o[k] = v;
  return o;
}

/**
 * Baut die Projektion EINES Erlasses. `null` = nichts abzuleiten (keine
 * Änderung dieses Erlasses kommt in seiner eigenen Historie vor) ⇒ es wird
 * keine Datei geschrieben, und die Karte fällt auf «keine erfassten Angaben»
 * zurück (§8 — eine leere Datei wäre eine Zusage ohne Inhalt).
 */
export function baueProjektion(
  erlass: string,
  historie: HistorieQuelle,
  revisionen: RevisionsQuelle | null,
  botschaften: ReadonlyMap<string, BotschaftQuelle>,
  ankerKeys: ReadonlySet<string>,
): EntstehungProjektion | null {
  const gesucht = ocsAusHistorie(historie);
  if (gesucht.size === 0 || !revisionen) return null;

  const aenderungen: Array<readonly [string, EntstehungAenderung]> = [];
  const gebrauchteBotschaften = new Set<string>();
  // Erste Nennung gewinnt: das Sidecar führt seine Revisionen absteigend nach
  // Inkrafttreten, und derselbe oc kann als `aenderung` UND als
  // `sammelerlass-marker` auftauchen. Ein zweiter Eintrag darf den ersten nie
  // still überschreiben (§8) — er trüge dieselbe Fundstelle mit weniger Inhalt.
  const gesehen = new Set<string>();
  for (const r of revisionen.revisionen ?? []) {
    const oc = ocKurzform(r.ocUri);
    if (!oc || !gesucht.has(oc) || gesehen.has(oc)) continue;
    gesehen.add(oc);
    const a: EntstehungAenderung = {
      // §7c: der Live-Link kommt aus dem Sidecar; nur wenn er dort fehlt, wird
      // er aus der amtlichen oc-Kurzform gebildet — dieselbe Form, die Fedlex
      // selbst ausliefert (`/eli/<oc>/de`), nie eine geratene Adresse.
      url: r.quelleUrl ?? `https://www.fedlex.admin.ch/eli/${oc}/de`,
    };
    if (r.titelDe) a.titel = r.titelDe;
    if (r.roFundstelle) a.as = r.roFundstelle;
    // S6-D1 (23.9.2026): ein gestaffelter Erlass steht je Etappe im Sidecar, absteigend —
    // die erste Nennung ist die SPÄTESTE Etappe. «inkraft» bleibt das erste Inkrafttreten.
    if (r.dateEntryInForce) a.inkraft = r.etappen?.[0] ?? r.dateEntryInForce;
    if (r.botschaftKey && botschaften.has(r.botschaftKey)) {
      a.botschaft = r.botschaftKey;
      gebrauchteBotschaften.add(r.botschaftKey);
    }
    aenderungen.push([oc, a]);
  }
  if (aenderungen.length === 0) return null;

  const bs: Array<readonly [string, EntstehungBotschaft]> = [];
  for (const key of gebrauchteBotschaften) {
    const q = botschaften.get(key);
    if (!q) continue;
    const b: EntstehungBotschaft = { titel: q.titel, url: q.quelleUrl, stand: q.stand };
    if (q.nummer) b.nummer = q.nummer;
    if (ankerKeys.has(key)) b.anker = true;
    if (q.ereignisse && q.ereignisse.length > 0) b.ereignisse = q.ereignisse;
    bs.push([key, b]);
  }

  return {
    erlass,
    profil: PROJEKTION_PROFIL,
    // §7a: das Abrufdatum der Erhebung, aus der Titel und Botschafts-Bindung
    // stammen — die Karte zeigt es an, statt Aktualität zu behaupten (§8).
    abgerufen: revisionen.abgerufen ?? '',
    aenderungen: sortiert(aenderungen),
    botschaften: sortiert(bs),
  };
}

/**
 * Serialisierung = die ausgelieferte Byte-Folge (Determinismus-Vergleich).
 *
 * KOMPAKT seit 23.9.2026 (S6-D1, W2·29-WERKBANK-LESER): die Revisions-Sidecars führen seit
 * Pfad (c) auch Sammel-/Mantelerlasse anderer SR; damit lösen 3899 statt ~1660 Fussnoten-oc
 * auf, und die Projektion wuchs eingerückt auf 1920,8 KB über den Deckel 1536 KB
 * (check:entstehung). Gemessen: dieselben Daten kompakt 1426,5 KB. Nutzlast statt Deckel
 * (§15); Logikverlust-Bewertung: keiner — nur Leerraum, Inhalt und Schlüsselreihenfolge
 * byte-identisch geparst.
 */
export function serialisiereProjektion(p: EntstehungProjektion): string {
  return JSON.stringify(p) + '\n';
}

/** Verzeichnis der ausgelieferten Projektionen. */
export const PROJEKTION_DIR = 'public/materialien/entstehung';
