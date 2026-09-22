// ─── Zentrale Rechner-Registry — ABGELEITET aus dem Katalog ────────────────
//
// 22.9.2026 · W2·29-WERKBANK-TOR (FAHRPLAN-WERKBANK-UMBAU §3) · Bis hierher
// war diese Datei ein HANDREGISTER: für alle 20 gebauten Rechner standen
// Titel, Kategorie, Kurzbeschrieb, Normen und Status ein zweites Mal hier,
// neben denselben Angaben im Katalog (`startseiteConfig` → KARTEN). Das ist
// die dokumentierte §5-Verletzung aus `docs/INVENTAR-FUNKTIONEN.md` §7 N1 —
// und sie war schon auseinandergelaufen: `check:sediment` mass beim ersten
// Lauf 113 Abweichungen. Die Detailseite eines Rechners nannte ihre Kategorie
// «Obligationenrecht», die Katalogkarte desselben Rechners «Vertrag &
// Forderung (OR)»; bei `verjaehrung` wichen sogar die Norm-Chips ab
// (Registry: Art. 127/128/132 OR · Katalog: Art. 127–142 OR).
//
// SEITHER: der KATALOG ist die eine Quelle (§5). `CALCULATORS` entsteht beim
// Modul-Laden aus den Katalog-Karten und kann per Konstruktion nicht mehr
// abweichen. Die API (`Calculator`, `CALCULATORS`, `getCalculator`) bleibt
// unverändert, damit die 20 Rechner-Seiten nicht angefasst werden müssen.
//
// SICHTBARE FOLGE (deklariert und gewollt): Overline, Einleitung und
// Norm-Chips der Rechner-Köpfe zeigen künftig die KATALOG-Werte — z. B. die
// Overline «Zivilprozess (ZPO) & Bundesgericht» statt «Zivilprozess». Das ist
// Darstellung, keine Rechtslogik (§3); keine Engine, kein Golden und keine
// Frist ändert sich.
//
// FOLGE FÜR DEN TITEL-TEST: `src/tests/startseiteConfig.test.ts` prüft
// «Detailseiten-Titel = Katalog-Kartentitel». Diese Zusicherung ist damit
// tautologisch — sie kann nicht mehr scheitern. Der Test bleibt trotzdem
// unverändert stehen (§6.3: bei einem Umbau werden Tests nicht angepasst);
// wer ihn später abräumt, braucht einen eigenen, deklarierten Schritt. Die
// wirksame Wache ist seither `check:sediment` (c2): sie verbietet, dass hier
// je wieder ein Metadaten-Literal auftaucht.
//
// Normentreue: Die Norm-Chips sind die `label` der Katalog-Karte. Keine
// Artikelnummern erfinden — wer eine Norm ändern will, ändert die Karte.

import type { CalculatorCard, Status } from './startseiteConfigTypen';
import { KARTEN } from './startseiteKarten';

export interface Calculator {
  slug: string;            // URL: /rechner/<slug>
  /** Detailseiten-Titel = Katalog-Kartentitel — seit dem Umbau per Ableitung. */
  titel: string;
  kategorie: string;       // Overline; im Katalog das `rechtsgebiet` der Karte
  kurzbeschrieb: string;
  normen: string[];        // Chips – exakter Gesetzeswortlaut der Karten-Labels
  status: Status;
}

/**
 * Mehrere Katalog-Karten können sich EINE Rechner-Seite teilen (Deep-Link per
 * `#anker`). Für diese Slugs sagt die Tabelle, welche Karte den Seiten-Kopf
 * stellt — genau einmal, ausdrücklich und mit Grund. Jeder Eintrag 22.9.2026
 * gesetzt (W2·29-WERKBANK-TOR), keiner geraten:
 */
export const KANON_KARTE_JE_SLUG: Record<string, string> = {
  // /rechner/kuendigung ist die Arbeitsrechts-Seite; `lohnfortzahlung` ist ein
  // Abschnitt darauf (Deep-Link #lohnfortzahlung), kein eigener Kopf. Dieselbe
  // Zuordnung führt src/tests/startseiteConfig.test.ts seit 7.6.2026 von Hand.
  kuendigung: 'kuendigung-sperrfristen',
  // /rechner/zustaendigkeit trägt den Zivil-Rechtsweg als Default; die Sichten
  // SchKG und Straf (#schkg, #straf) überschreiben Kopf-Kategorie, -Beschrieb
  // und -Normen ohnehin selbst (HERO_JE_RECHTSWEG in RechnerZustaendigkeit,
  // reine Anzeige §3) — sie dürfen den Default darum nicht stellen.
  zustaendigkeit: 'zustaendigkeit',
};

/**
 * Slug einer Karte: der `href` ohne `/rechner/`-Präfix und ohne Deep-Link.
 * `undefined`, wenn die Karte keine gebaute Rechner-Seite ist.
 */
function slugVonKarte(karte: CalculatorCard): string | undefined {
  if (karte.modus !== 'rechner' || karte.status === 'geplant') return undefined;
  if (!karte.href?.startsWith('/rechner/')) return undefined;
  return karte.href.slice('/rechner/'.length).split('#')[0];
}

/**
 * Baut die Registry aus dem Katalog. Wirft beim Modul-Laden, wenn die
 * Kanon-Abbildung nicht mehr passt — eine Zuordnung, die still veraltet, wäre
 * genau die zweite Wahrheit, die dieser Umbau beseitigt.
 */
function ausKatalog(): Calculator[] {
  const proSlug = new Map<string, CalculatorCard[]>();
  for (const karte of Object.values(KARTEN)) {
    const slug = slugVonKarte(karte);
    if (!slug) continue;
    const liste = proSlug.get(slug);
    if (liste) liste.push(karte); else proSlug.set(slug, [karte]);
  }

  for (const slug of Object.keys(KANON_KARTE_JE_SLUG)) {
    if (!proSlug.has(slug)) {
      throw new Error(`calculators: KANON_KARTE_JE_SLUG führt «${slug}» — dazu gibt es keine aktive Katalog-Karte mehr.`);
    }
  }

  const aus: Calculator[] = [];
  for (const [slug, karten] of proSlug) {
    let karte = karten[0];
    if (karten.length > 1) {
      const gewaehlt = KANON_KARTE_JE_SLUG[slug];
      if (!gewaehlt) {
        throw new Error(`calculators: Slug «${slug}» wird von ${karten.length} Katalog-Karten geteilt (${karten.map((k) => k.id).join(', ')}) — Kanon-Abbildung fehlt.`);
      }
      const gefunden = karten.find((k) => k.id === gewaehlt);
      if (!gefunden) {
        throw new Error(`calculators: KANON_KARTE_JE_SLUG bildet «${slug}» auf «${gewaehlt}» ab — keine Karte dieses Slugs trägt diese ID.`);
      }
      karte = gefunden;
    }
    aus.push({
      slug,
      titel: karte.title,
      kategorie: karte.rechtsgebiet,
      kurzbeschrieb: karte.description,
      normen: karte.norms.map((n) => n.label),
      status: karte.status,
    });
  }
  return aus;
}

export const CALCULATORS: Calculator[] = ausKatalog();

export function getCalculator(slug: string): Calculator | undefined {
  return CALCULATORS.find((c) => c.slug === slug);
}
