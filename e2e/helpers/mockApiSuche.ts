import type { Page } from '@playwright/test'

// ── DIE SERVER-SUCHE IM BROWSER-TEST ─────────────────────────────────────────
// A1-FUNDAMENT (7.10.2026, Entscheid David «Ja, nur über Server»): die Wortsuche im
// Gesetzestext läuft ausschliesslich über `/api/suche` (Turso). Der Browser lädt
// keinen Artikel-Volltextindex mehr. `vite preview` (das Ziel dieser Specs) kennt
// die Funktion nicht — der Aufruf fiele auf den SPA-Rückfall (HTML statt JSON) und
// die Seite zeigte zu Recht «Volltextsuche derzeit nicht verfügbar». Specs, die
// Volltext-TREFFER prüfen, stellen darum die Antwort des Servers hier nach: die
// FORM ist die der echten Funktion (scripts/datenhaltung/suche-kern.ts
// `SucheAntwort<ArtikelTreffer>`), der Inhalt ein deterministisches Fixture.
//
// KEIN Ersatz für die Server-Suche selbst: ihre Treffergüte (FTS, Rang) prüfen
// scripts/datenhaltung/suche*.test.ts und der Prod-Smoke (`pruefeApiSuche`).

/** Der Server kennt je Abfrage höchstens 50 Treffer (MAX_LIMIT in suche-kern.ts). */
const SERVER_MAX = 50
/** Gesamtzahl, die das Fixture dem Client meldet (mehr als ein Server-Fenster). */
export const FIXTURE_GESAMT = 120

interface Ausgabe { status: number; body: unknown }

/** `OR 253 ff.` — die mietrechtlichen Kernartikel, wie sie der Server bei «Miete»
 *  an die Spitze stellt (topische Stufung, K2): OR 253 zuerst. */
function fixtureAntwort(limit: number, stand: string | undefined): Ausgabe {
  const n = Math.min(limit, SERVER_MAX)
  const treffer = Array.from({ length: n }, (_, i) => {
    const nr = String(253 + i)
    return {
      id: `art:OR:${nr}`,
      titel: `Art. ${nr} OR`,
      snippet: `… Die [Miete] ist der Vertrag, bei dem … (Fixture ${nr}) …`,
      fundstelle: { erlass: 'OR', artikel: nr, quelleUrl: `https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_${nr}`, ebene: 'bund' },
    }
  })
  return {
    status: 200,
    body: { artikel: { treffer, gesamt: FIXTURE_GESAMT, naechsteSeite: n < FIXTURE_GESAMT ? n : null }, ...(stand ? { stand } : {}) },
  }
}

export interface MockOptionen {
  /** Antwortstatus-Modus: 'treffer' (Default), 'leer' (0 Treffer), 'ausfall' (HTTP 503). */
  modus?: 'treffer' | 'leer' | 'ausfall'
  /** ISO-Zeitstempel für `stand` (Suchindex-Stand), Default 2026-10-05. */
  stand?: string
}

/**
 * Hängt die Server-Suche für diese Seite ein. Gibt die Liste der gesehenen Aufrufe
 * (vollständige URLs) zurück, damit Specs Zahl und Form der Abfragen prüfen können
 * (z. B. `typ=artikel`, kein Fetch ohne Eingabe).
 */
export async function mockApiSuche(page: Page, opt: MockOptionen = {}): Promise<string[]> {
  const aufrufe: string[] = []
  const stand = opt.stand ?? '2026-10-05T04:17:09.123Z'
  await page.route('**/api/suche?**', async (route) => {
    const url = new URL(route.request().url())
    aufrufe.push(url.pathname + url.search)
    const modus = opt.modus ?? 'treffer'
    if (modus === 'ausfall') {
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ fehler: 'Suche über die Masse noch nicht aktiviert' }) })
      return
    }
    if (modus === 'leer') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ artikel: { treffer: [], gesamt: 0, naechsteSeite: null }, stand }) })
      return
    }
    const a = fixtureAntwort(Number(url.searchParams.get('limit') ?? 20), stand)
    await route.fulfill({ status: a.status, contentType: 'application/json', body: JSON.stringify(a.body) })
  })
  return aufrufe
}
