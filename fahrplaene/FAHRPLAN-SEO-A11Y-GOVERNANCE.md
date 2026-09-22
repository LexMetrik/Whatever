# FAHRPLAN — Webseite verbessern mit SEO / A11y / Skill-Governance (Stand 25.6.2026)
<!-- @lagebild name: SEO & Barrierefreiheit · zweck: Auffindbarkeit in Suchmaschinen und Zugänglichkeit, mit Regeln statt Einzelfixes. -->

**Heimat: ROADMAP-Schritt `SEO-A11Y`.**

## §0 · Zweck

Detailquelle zu `SEO-A11Y` — LexMetrik bei Schweizer Rechtsanfragen besser
auffindbar und zugänglicher machen als `fedlex.admin.ch`/`entscheidsuche.ch`.
Bis 1.12.2026 priorisiert dieser Fahrplan alles, was **ohne Davids Fachzeit**
umsetzbar ist (Technik-/Struktur-/Verifikations-Layer); inhaltliche Rechts-
aussagen bleiben `TODO(David)`-Gerüst bis zur Abnahme-Welle.

> Read-only erstellt. Andere Agenten arbeiten parallel im Repo `/Users/david/Developer/LexMetrik` — dieser Fahrplan ändert nichts, er ist Ablage-Dokument. Empfohlener Ablageort: neuer `FAHRPLAN-SEO-A11Y-GOVERNANCE.md` (dockt thematisch an `FAHRPLAN-LERNPHASE-2026.md` Strang B = Verifikations-/Infrastruktur an). Überschneidet sich nur mit `FAHRPLAN-RECHTSPRECHUNG.md` (W1.1 revidiert dessen Annahme „nicht prerenderbar" — siehe §9), dupliziert sonst keinen der 24 Root-Fahrpläne.

## §4 · SEO-Strang (Detail)
*(Bau-Spec des ROADMAP-Schritts `SEO-A11Y`, zusammen mit §5; §-Sigel nachgezogen 30.8.2026.)*

**Verifizierter IST-Stand (read-only):** `src/lib/seo.ts` → `SITE_URL = 'https://lexmetrik.vercel.app'`, `metaFuerPfad()` gibt für alle Detailpfade `null`, `jsonLdFuerPfad()` nur WebSite/Organization (`/`) + WebApplication (Karten), Kommentar Z.~132 „KEINE FAQPage: keine FAQ-Inhalte". `scripts/prerender.ts` → hartes Tor `ERWARTETE_ROUTEN = 56`, Sitemap bewusst ohne lastmod, `app.html` mit `robots: noindex`. `vercel.json` → `cleanUrls:true`, `trailingSlash:false`, Rewrite `/(.*) → /app`, CSP `script-src 'self'` (JSON-LD muss `ld+json` bleiben); `Cache-Control` existiert **nur** unter `/assets/(.*)`, **nicht** unter `/normtext/*` (dort nur X-Frame-Options/CSP) und gar kein Block für `/rechtsprechung/*`. **Mengen verifiziert in den Registern:** 1460 Erlasse total → 1449 `snapshot` (218 bund + 1231 kantonal), 9 `nur-live-link`, 2 `pdf-embed`; 370 Entscheide total, alle `bestand:snapshot` (340 `bger` + 30 kantonale Gerichte). **= 1819 indexierbare Detail-URLs.** Register-Felder reichen für Legislation-JSON-LD + Meta **vollständig aus** (`key, ebene, kanton, kuerzel, titel, sr, rechtsgebiet, status, stand, quelleUrl, fassungsToken, artikelAnzahl` bzw. `gericht, gerichtName, nummer, bgeReferenz, datum, zitierung, sachgebiet, normKeys, bestand, quelleUrl`) — **Strukturwerte nichts zu erfinden; kuratierte Texte/Geltungsaussagen = `TODO(David)`.**

**Abhängigkeiten:**
1. **W1.0** (Werkzeug-Beschaffung/Klärung) vor jedem Dispatch.
2. **W1.1** ist Voraussetzung für W1.2/W1.3/W1.4/W1.5 und W2.1 — ohne prerenderte Detail-URLs greifen Meta/JSON-LD/lastmod/Backlinks ins Leere.
3. Innerhalb W1: W1.1+W1.4+W1.5 zusammen (Sitemap+Stubschutz), dann W1.2+W1.3 (pro-URL-Meta/Schema). W1.9/W1.10/W1.11/W1.12 unabhängig parallel.
4. **W3.4 (Domain) erst nach W1-Indexaufbau** (GSC-Property mitziehen).
5. **W3.1/W3.2-Gerüst** technisch in W1 mitbaubar (`TODO(David)`), Inhalt erst ab 1.12.2026.

**Build-Skalierungs-Gate (Annahme, vor W1.1-Rollout messen):** Prerender ist nur mit 56 Routen erprobt; bei 1819 Routen Laufzeit + `dist/`-Grösse messen (Sub-Agent fährt Prerender mit wachsender Routenzahl, Schwelle in `scripts/gate.sh`). **OOM ist bei statischem render-then-replace unwahrscheinlich** (kein SSR) — das reale Risiko ist Prerender-**Laufzeit** (jede Route lädt JSON + rendert) und `dist/`-Volumen, **nicht** Build-Timeout als Blocker. Erst wenn die Messung tatsächlich auffällige Laufzeit zeigt: `council-review` zu „voll-statisch vs. gestaffelt Top-N" — bei nur 1819 Routen vermutlich kein echter Tradeoff, also nicht vorschnell auslösen.

**Erfolgsmessung (autonom prüfbar):** `dist/sitemap-gesetze.xml`-`<loc>`-Count == Anzahl `status:snapshot`-Erlasse (1449); `curl` einer Detail-URL zeigt befülltes `#root` + korrekte `<title>` **ohne** `robots:noindex`; Google **Rich Results Test** je Reader-Typ fehlerfrei; `npm run gate` grün; nach Deploy via **der in W1.12 eingerichteten GSC-Property** Indexabdeckung-Sprung (56 → >1000). Ohne W1.12 ist die GSC-Messung nicht durchführbar.

## §5 · A11y-Strang (Detail)
*(Teil der Bau-Spec von `SEO-A11Y`.)*

**Leitprinzip:** Der gesamte A11y-Strang (Welle 1+2) ist Darstellungs-/Test-Layer, braucht **keine** juristische Fachzeit → Strang B der `FAHRPLAN-LERNPHASE-2026.md`. Verifikation läuft über das **vorhandene** Playwright-Setup (`@axe-core/playwright` ist bereits Dependency) — kein neues Tooling, kein MCP-Screenshot (Memory-Regel „Werkzeuge zuerst prüfen"). Einzige David-Berührung: bewusste Marken-/Design-Entscheide (W3.5/W3.6) und der fr/it-Inhaltsentscheid (W3.7); die reine `lang`-Mechanik (W2.4) ist autonom.

**Konkrete Bugs/Lücken (verifiziert im Befund):**
- **W1.6 Karten-Fokus — ERLEDIGT (Beleg `SchweizKarte.tsx:150-172`, nachgemessen 21.9.2026; Zeile bleibt als Historie stehen):** `SchweizKarte.tsx`-Pfade `className="outline-none"` (Z.67) überschreiben globalen `:focus-visible` (`index.css` Z.~131) → Fix via `focus-visible:stroke-brass-700` + erhöhte `strokeWidth`, Verifikation Screenshot hell **und** dunkel, Indikator-Kontrast ≥ 3:1, `aria-label`/`aria-pressed` (Z.64–66) bleiben angesagt. **Eng begrenzt (1 Komponente) → Wirkung „mittel" relativ zum 1819-Seiten-Haupthebel.**
- **W1.7 Tor-Löcher:** ungetestet sind genau die komplexesten Widgets (Lesemodus-Dialog mit Fokusfalle, mobile `role=dialog`-Schublade, Karte). Neue `test()`-Blöcke analog `axePruefen()`, Gate bleibt critical/serious, moderate/minor als Anhang.
- **W2.2 Tabellen — ERLEDIGT (Beleg `ArtikelTabellen.tsx:94-172`, nachgemessen 21.9.2026; Zeile bleibt als Historie stehen):** `MehrspaltigeTabelle`/`TarifTabelle`/`StaffelTabelle` als `<span>`-`display:table` → Screenreader liest Fliesstext, Spaltenkopf-Bezug „Streitwert→Gebühr" verloren. Fix verhaltensneutral, Golden-Tests sichern sichtbaren Output, `browser_snapshot` prüft Accessibility-Tree. **SEO-Doppelnutzen.**

**SEO-Doppelnutzen (Koordination mit §4, gemeinsame Single Source, keine Doppelarbeit):** echte Tabellen-Semantik (W2.2) → besseres Google-Tabellenverständnis; saubere Heading-Hierarchie (W1.8) → Dokumentstruktur-Signal; Landmarks (`Shell.tsx` bereits gut) beim Detail-Prerender mitziehen; `lang` (W2.4) + hreflang (W3.7) = identische Infrastruktur. **A11y-Tor und Prerender-Drift-Tor gemeinsam erweitern**, damit jede neue prerenderte Reader-Route automatisch durch axe läuft.


---

## §12 · Auffindbarkeits-Basis (`SEO-BASIS`) — Entscheid David D5, 3.9.2026

Heimat des Roadmap-Schritts **`SEO-BASIS`**. Bewusst **kein** SEO-Ausbau: der
Dach-Schritt `SEO-A11Y` bleibt geparkt (Blocker `zielbild-gesetzesleser`), hier
entsteht nur die technische Basis, ohne die Google die prerenderten Seiten gar
nicht erst vollständig sieht.

**Anlass (Repo-Fakt, geprüft 3.9.2026):** Es gibt **keine Sitemap** — weder
`public/sitemap*` noch ein Generator-Skript. Ohne sie hängt die Indexierung am
Zufall des Crawlers; das ist der billigste Hebel auf den Nordstern
«von Juristen gern genutzte Website». Beleg und Einordnung:
[FAHRPLAN-FREMDAGENTEN.md](FAHRPLAN-FREMDAGENTEN.md) §7.

**Nullbefund 4.9.2026 (Sonnet-Bauer, vor dem Bau geprüft — §0 Ziff. 3a):** Der Anlass ist
falsch. Die Sitemap existiert seit 11.6.2026 (Commit a29fbe6c2), als Index mit 4 Teil-Sitemaps
seit 1.9.2026 (#612): Generator inline in `scripts/prerender.ts` (~Z. 463–504), Ausgabe
`dist/sitemap.xml` + `dist/robots.txt` (8280 URLs), `SITE_URL` aus `src/lib/seo.ts`,
Vollständigkeits-Drift-Check im Build, Prod-Smoke `scripts/betrieb/prod-smoke.ts` Z. 119–124,
Tests `src/tests/seo.test.ts`. Ein zweiter Generator hätte die Sitemap auf 62 Katalog-Routen
verkleinert — bewusst NICHT gebaut (§5). **Damit sind die Ziele 1 und 2 unten bereits erfüllt;
offen ist nur Ziel 3, die Search-Console-Verifikation (Davids Handgriff, kein Bau).** Schritt
`SEO-BASIS` ⇒ `done` (4.9.2026).

**Ziel (drei Teile):**

1. **Deterministischer Sitemap-Generator** aus dem Prerender-Manifest — dieselbe
   Eingabe erzeugt dieselbe `sitemap.xml` (§2). Keine Handpflege, keine zweite
   Route-Liste neben dem Manifest (§5); `lastmod` aus einer im Repo vorhandenen,
   reproduzierbaren Grösse, nie aus `Date.now()`.
2. **`robots.txt`** mit Verweis auf die Sitemap.
3. **Search-Console-Verifikation durch David** (Domain-Bestätigung, Sitemap
   einreichen) — gratis, kein Google-Cloud-Konto, keine Nutzerdaten.

**Grenzen:** keine Keyword-Arbeit, keine Meta-Text-Kampagne, kein
`Legislation`-JSON-LD (kein Google-Rich-Result belegt), kein Analytics. Was über
diese drei Teile hinausgeht, gehört in `SEO-A11Y` und bleibt geparkt.

**Fertig:** `sitemap.xml` und `robots.txt` liegen im Build, der Generator läuft
im Prerender-Schritt mit, ein Tor oder Test hält die Deckungsgleichheit
Manifest ↔ Sitemap fest, und David hat die Domain in der Search Console
bestätigt.

---

## Archivierte Abschnitte *(Plan-Neuschnitt 29.8.2026)*

9 Abschnitt(e) dieser Datei sind wörtlich nach
[`archiv/fahrplaene/FAHRPLAN-SEO-A11Y-GOVERNANCE.md`](../archiv/fahrplaene/FAHRPLAN-SEO-A11Y-GOVERNANCE.md) ausgelagert — sie tragen keine offene
ROADMAP-Bindung mehr. Titel:

- 1. Kurz-Kontext & Nordstern
- 2. IST-Stand kompakt
- 3. Drei Massnahmen-Wellen (priorisiert)
- 6. Skill-Governance & Self-Audit-Rhythmus
- 7. Arbeits-Playbook (Trigger-Sätze)
- 8. Risiken & Kollisions-Hinweise
- 9. Einordnung zu bestehenden FAHRPLAN-*.md (keine Dopplung)
- 10. Nachträge aus dem Optimierungs-Research 12.7.2026 (`FAHRPLAN-OPTIMIERUNG-2026-07.md` O-5)
- 11. Intake G-PRERENDER — Prerender-String-Builder ist verlustbehaftet (David 17.7.2026)
