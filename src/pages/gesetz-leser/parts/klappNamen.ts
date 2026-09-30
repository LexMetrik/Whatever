// ═══ Eindeutige Klapp-Namen für den Gliederungsbaum ═══════════════════════
//
// QS-UI-Nachzug zu PR #683/#685 (fahrplaene/FAHRPLAN-UI-QUALITAET.md §2.4).
// Der Chevron-Knopf jeder klappbaren Zeile trägt seit PR #685 einen
// KONSTANTEN, an SICH eindeutigen Namen («Titel» auf- und zuklappen statt
// Auf-/Einklappen) — das löst die WECHSELNDE Doppel-Aussage (§0-Beispiel dort),
// aber NICHT den Fall, dass zwei VERSCHIEDENE Zeilen denselben Titel tragen:
// belegt an GEBV_HREG, wo die synthetische Anhang-Wurzel und die amtliche
// Anhang-Sektion beide «Anhänge» heissen (WCAG 4.1.2 gleicher Name, 2.4.6
// Zweck aus dem Namen nicht unterscheidbar).
//
// Reine Ableitung aus dem bereits vorhandenen Modell-Baum (§3: Darstellung,
// keine neue Fach-Entscheidung) — nur WAS sich schon aus `GliederungsKnoten[]`
// ergibt (Titel, Eltern-Titel), nichts Neues wird erfunden.

import type { GliederungsKnoten } from '../gliederungsModell';

/** Voller Anzeigetext einer Zeile: Titel plus, wenn zutreffend, das
 *  Aufgehoben-Signal — dieselbe Definition wie `title`/`aria-label` der
 *  Sprung-Zeile in SektionBaumTOC.tsx (§5: eine Stelle, kein Zweitrechner). */
export function vollText(k: GliederungsKnoten): string {
  return [k.label, zustandsWort(k)].filter(Boolean).join(' — ');
}

/** W2·27 (30.9.2026, Nachzug A2): das Zustandswort einer Baum-/Index-Zeile aus den Datenfeldern —
 *  `aufgehoben` bzw. amtlich `gegenstandslos` (eigenes Wort, nie «aufgehoben», §1/§8); fehlen
 *  beide, `''` (kein Wort ohne Beleg). EINE Quelle für das SICHTBARE Wort und den zugänglichen
 *  Namen (title/aria-label) — WCAG 2.5.3 «Label in Name»: was man liest, steht im Namen (§5). */
export function zustandsWort(z: { aufgehoben?: boolean; gegenstandslos?: boolean }): string {
  return z.aufgehoben ? 'aufgehoben' : z.gegenstandslos ? 'gegenstandslos' : '';
}

/**
 * Kontext-Zusatz je Zeilen-Id, NUR für Zeilen mit Chevron (`kinder.length > 0`)
 * — nur ein Chevron trägt «… auf- und zuklappen», nur dort kann ein
 * gleichnamiger zweiter Knopf entstehen. Gesetzt wird ein Eintrag NUR, wenn
 * derselbe Titel im Baum mehr als einmal als Chevron-Zeile vorkommt; sonst
 * bleibt der Name unverändert (Auftrag: «sonst unverändert»).
 *
 * DISAMBIGUIERUNG: der nächste ELTERN-Titel, der vom eigenen abweicht — «eine
 * Chevron-Zeile namens X (Y)» dort, wo Y der nächste andersnamige Vorfahre ist.
 * REST-DOPPLUNG (David-Entscheid 5.9.2026, #689, FAHRPLAN-UI-QUALITAET.md §2.5):
 * der EINE-Eltern-Schritt löst nicht jeden Fall — in OR/ZGB kommt derselbe
 * nächste abweichende Eltern-Titel selbst mehrfach vor (z. B. «A. Begriff und
 * Geltungsbereich» zweimal, je mit eigenem «II. Geltungsbereich»-Kind), und im
 * GEBV_HREG-Fall gibt es gar keinen abweichenden Ahnen (Wurzel und Kind heissen
 * beide «Anhänge»). Statt der dafür nötigen Rekursion bis zur Wurzel (David
 * entscheidet: kein Modell-Fix in `gliederungsModell.ts`) ist der Fallback ein
 * Vorkommen-Zähler («1. Vorkommen» / «2. Vorkommen» …), gezählt je
 * RESTgruppe — also nur unter den Einträgen, die auch nach dem Eltern-Schritt
 * noch denselben resultierenden Namen trügen (gleicher abweichender Ahn, oder
 * beide ohne einen).
 */
export function berechneKlappKontext(wurzeln: GliederungsKnoten[]): Map<string, string> {
  interface ChevronEintrag { id: string; titel: string; ahnenTitel: string[] }
  const eintraege: ChevronEintrag[] = [];

  const sammle = (k: GliederungsKnoten, ahnenTitel: string[]): void => {
    const titel = vollText(k);
    if (k.kinder.length > 0) eintraege.push({ id: k.id, titel, ahnenTitel });
    const naechsteAhnen = [titel, ...ahnenTitel];
    for (const kind of k.kinder) sammle(kind, naechsteAhnen);
  };
  for (const w of wurzeln) sammle(w, []);

  const gruppen = new Map<string, ChevronEintrag[]>();
  for (const e of eintraege) {
    const liste = gruppen.get(e.titel);
    if (liste) liste.push(e); else gruppen.set(e.titel, [e]);
  }

  const KEIN_AHN = ' kein-ahn'; // interner Schlüssel, nie ein echter Titel
  const kontext = new Map<string, string>();
  for (const liste of gruppen.values()) {
    if (liste.length < 2) continue; // eindeutig — Auftrag: «sonst unverändert»

    // Erster Schritt: nächster abweichender Eltern-Titel je Eintrag.
    const kandidaten = liste.map((e) => ({
      e,
      ahn: e.ahnenTitel.find((a) => a !== e.titel),
    }));

    // Zweiter Schritt: je resultierendem Namen gruppieren — nur ein EINDEUTIGER
    // abweichender Ahn löst die Dopplung; alles andere (derselbe Ahn mehrfach,
    // oder gar keiner) bleibt Restgruppe mit Vorkommen-Zähler.
    const restGruppen = new Map<string, typeof kandidaten>();
    for (const k of kandidaten) {
      const schluessel = k.ahn ?? KEIN_AHN;
      const rest = restGruppen.get(schluessel);
      if (rest) rest.push(k); else restGruppen.set(schluessel, [k]);
    }
    for (const [schluessel, rest] of restGruppen) {
      if (schluessel !== KEIN_AHN && rest.length === 1) {
        kontext.set(rest[0].e.id, schluessel);
      } else {
        rest.forEach((k, i) => kontext.set(k.e.id, `${i + 1}. Vorkommen`));
      }
    }
  }
  return kontext;
}
