// ─── Deckungs-Sicht: «was wir nicht haben» (W2·6c, §11.5) ────────────────────
//
// EINE Quelle für die Form der ausgelieferten Datei
// `public/materialien/deckungs-sicht.json` (§5): der Generator
// (`scripts/entstehung/deckung-projektion.ts`) baut GEGEN diese Typen, das Tor
// `check:entstehung` rechnet sie nach, die Seite `/materialien/deckung` liest
// sie. Stünde die Form zweimal da, könnte eine Seite Felder anzeigen, die der
// Generator längst anders füllt.
//
// §3 Schichtentrennung: Typen, reine Auszählungen, Lazy-Loader — keine UI,
// keine Rechtslogik. Alles hier ist ARITHMETIK über gegatete Artefakte; die
// Einordnung dessen, was die Zahlen bedeuten, steht als Text auf der Seite.

/** Versionierte Bauart — eine geänderte Ableitungsregel entsteht als `/2`
 *  DANEBEN, nie durch Editieren (Muster der Synopse-Normprofile). */
export const DECKUNG_PROFIL = 'entstehung-deckung/1';

/** Eine Ebene des Bestandes: «haben» von «gesamt», mit Stand und Quelle.
 *
 *  `gesamt: null` ist KEIN Schönheitsfehler, sondern die ehrlichste Aussage,
 *  die wir über manche Ebene treffen können (§8): für die Parlaments-Geschäfte
 *  und die Basler Verfahrensketten kennen wir den erfassten Bestand, aber nicht
 *  die Grundgesamtheit — «385 von 385» wäre eine erfundene Vollständigkeit.
 *  Die Seite schreibt dort «nicht erhoben» statt einer Zahl. */
export interface DeckungEbene {
  haben: number;
  gesamt: number | null;
  /** Stand- bzw. Abrufdatum der Quelle (ISO, §7a). */
  stand: string;
  /** Amtliche Quelle in Worten (§7b). */
  quelle: string;
}

/** Eine Zeile der Erlass-Liste. Jedes Feld ist eine Auszählung, kein Urteil. */
export interface DeckungErlassZeile {
  titel: string;
  sr?: string;
  /** Distinkte oc-Fundstellen in den Artikel-Fussnoten. 0 = keine — dann ist
   *  die Deckungsquote NICHT definiert und wird auch nicht angezeigt. */
  ocFussnoten: number;
  /** davon in der Fedlex-Änderungsliste des Erlasses vorhanden. */
  ocGetroffen: number;
  /** Änderungen in der Entstehungs-Projektion (E3). */
  aenderungen: number;
  /** davon an eine ERFASSTE Botschaft gebunden. */
  mitBotschaft: number;
  /** Ab hier existiert ein Synopse-Fenster (E5); fehlt es, gibt es für diesen
   *  Erlass keinen Fassungsvergleich. */
  fensterAb?: string;
  schritte?: number;
  altBloecke?: number;
  ohneEreignis?: number;
  /** Fussnoten-Ereignisse ohne beobachtete Textänderung (Gegenrichtung). */
  konflikte?: number;
  /** Als «Quelle unvollständig» gebuchte Alt-Blöcke. */
  quellLuecken?: number;
}

export interface DeckungProjektion {
  profil: typeof DECKUNG_PROFIL;
  staende: {
    deckung: string;
    entstehung: string;
    synopse: string;
    curia: string;
    provenienz: string;
    normtext: string;
  };
  ebenen: {
    anker: DeckungEbene;
    curia: DeckungEbene;
    /** Materialien mit erfasster Verfahrenskette, Bund. */
    verfahrenBund: DeckungEbene;
    /** dieselbe Klasse für Basel-Stadt (Grosser Rat). */
    verfahrenBs: DeckungEbene;
    /** Kanten Geschäft→Erlass: amtlich belegt vs. maschinell abgeleitet. Die
     *  maschinellen sind fachlich NICHT geprüft und werden so angezeigt (§8). */
    bsKanten: { amtlich: number; maschinell: number };
    zh: DeckungEbene;
  };
  erlasse: Record<string, DeckungErlassZeile>;
}

// ── Reine Auszählungen über die geladene Sicht ───────────────────────────────

/** Summen über die Erlass-Liste. Die Seite rechnet NIRGENDS selbst — jede
 *  angezeigte Gesamtzahl kommt von hier, damit der Unit-Test genau eine Stelle
 *  gegen die Zeilen prüfen kann. */
export interface DeckungSummen {
  erlasse: number;
  ocFussnoten: number;
  ocGetroffen: number;
  aenderungen: number;
  mitBotschaft: number;
  /** Erlasse mit Synopse-Fenster. */
  mitFenster: number;
  schritte: number;
  altBloecke: number;
  ohneEreignis: number;
  konflikte: number;
  quellLuecken: number;
  /** Erlasse, bei denen keine einzige Fussnoten-Fundstelle getroffen wurde
   *  (und die mindestens eine haben) — die 0-%-Fälle. */
  ohneTreffer: number;
  /** Erlasse ganz ohne oc-Fundstelle (Quote nicht definiert). */
  ohneFundstelle: number;
}

export function summiere(p: DeckungProjektion): DeckungSummen {
  const s: DeckungSummen = {
    erlasse: 0, ocFussnoten: 0, ocGetroffen: 0, aenderungen: 0, mitBotschaft: 0,
    mitFenster: 0, schritte: 0, altBloecke: 0, ohneEreignis: 0, konflikte: 0,
    quellLuecken: 0, ohneTreffer: 0, ohneFundstelle: 0,
  };
  for (const z of Object.values(p.erlasse)) {
    s.erlasse += 1;
    s.ocFussnoten += z.ocFussnoten;
    s.ocGetroffen += z.ocGetroffen;
    s.aenderungen += z.aenderungen;
    s.mitBotschaft += z.mitBotschaft;
    if (z.ocFussnoten === 0) s.ohneFundstelle += 1;
    else if (z.ocGetroffen === 0) s.ohneTreffer += 1;
    if (z.altBloecke === undefined) continue;
    s.mitFenster += 1;
    s.schritte += z.schritte ?? 0;
    s.altBloecke += z.altBloecke;
    s.ohneEreignis += z.ohneEreignis ?? 0;
    s.konflikte += z.konflikte ?? 0;
    s.quellLuecken += z.quellLuecken ?? 0;
  }
  return s;
}

/** Deckungsquote 0..1 — `null`, wenn es keine Fundstelle gibt, gegen die sich
 *  messen liesse. Eine Quote aus 0/0 wäre eine erfundene Zahl (§8). */
export function quote(z: Pick<DeckungErlassZeile, 'ocFussnoten' | 'ocGetroffen'>): number | null {
  return z.ocFussnoten === 0 ? null : z.ocGetroffen / z.ocFussnoten;
}

export type DeckungSpalte = 'erlass' | 'quote' | 'ocFussnoten' | 'aenderungen' | 'altBloecke' | 'ohneEreignis';
export type DeckungRichtung = 'auf' | 'ab';

/** Eine Zeile samt ihrem Schlüssel — die Liste sortiert Paare, nicht Objekte. */
export interface DeckungZeile extends DeckungErlassZeile { key: string }

export function zeilen(p: DeckungProjektion): DeckungZeile[] {
  return Object.entries(p.erlasse).map(([key, z]) => ({ key, ...z }));
}

/**
 * Sortiert die Erlass-Liste — deterministisch bis zur letzten Zeile.
 *
 * ZWEITSCHLÜSSEL IST IMMER DER ERLASS-KEY: ohne ihn hinge die Reihenfolge
 * gleicher Werte (z. B. die 20 Erlasse mit Quote 0) an der Einfüge-Ordnung und
 * spränge bei jedem Klick anders — ein Nutzer läse das als Datenwechsel.
 *
 * `null`-Quoten (keine Fundstelle) stehen IMMER am Ende, in beiden Richtungen:
 * «nicht messbar» ist weder der beste noch der schlechteste Wert.
 */
export function sortiere(
  liste: readonly DeckungZeile[], spalte: DeckungSpalte, richtung: DeckungRichtung,
): DeckungZeile[] {
  const vz = richtung === 'auf' ? 1 : -1;
  const zahl = (z: DeckungZeile): number | null => {
    switch (spalte) {
      case 'quote': return quote(z);
      case 'ocFussnoten': return z.ocFussnoten;
      case 'aenderungen': return z.aenderungen;
      case 'altBloecke': return z.altBloecke ?? null;
      case 'ohneEreignis': return z.ohneEreignis ?? null;
      default: return null;
    }
  };
  return [...liste].sort((a, b) => {
    if (spalte !== 'erlass') {
      const x = zahl(a);
      const y = zahl(b);
      if (x === null && y !== null) return 1;
      if (y === null && x !== null) return -1;
      if (x !== null && y !== null && x !== y) return (x - y) * vz;
    } else if (a.key !== b.key) {
      return a.key.localeCompare(b.key, 'de-CH') * vz;
    }
    return a.key.localeCompare(b.key, 'de-CH');
  });
}

// ── Lazy-Loader: EIN Fetch, nur auf der Deckungs-Seite ───────────────────────
// Bauart byte-gleich zu `entstehung/projektion.ts` (§5): 404 = nichts da (kein
// Fehler, still), ein transienter Fehler wird NICHT dauerhaft als null gecacht.
// Kein Modul ausserhalb der Seite ruft das hier auf — die Materialien-Übersicht
// und die Artikel-Karte verlinken die Seite, sie laden sie nicht mit.

const DECKUNG_URL = '/materialien/deckungs-sicht.json';

let laufend: Promise<DeckungProjektion | null> | null = null;

export function ladeDeckungProjektion(): Promise<DeckungProjektion | null> {
  if (laufend) return laufend;
  laufend = (async () => {
    try {
      const res = await fetch(DECKUNG_URL);
      if (res.status === 404) return null;
      if (!res.ok) { laufend = null; return null; }
      return (await res.json()) as DeckungProjektion;
    } catch {
      laufend = null;
      return null;
    }
  })();
  return laufend;
}
