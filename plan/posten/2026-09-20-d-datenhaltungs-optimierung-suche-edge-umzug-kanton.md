<!-- @posten
dach: QS-BASIS
titel: (d) Datenhaltungs-Optimierung — Suche-Edge-Umzug Kanton
-->

  - [~] **(d) Datenhaltungs-Optimierung — Suche-Edge-Umzug Kanton** (31. ✅ Teilerfolge K0–K3 wörtlich: ROADMAP-CHRONIK.md, Umschichtung 8.9.2026 (Landung).
    **VOR DEM MERGE (Landungs-Protokoll aus F1):** «Turso-Serving-Sync» per `workflow_dispatch` auf dem Branch fahren, **bevor** gemergt wird — Sync und Deploy hängen am selben Push und warten nicht aufeinander. Messreihe und Herleitung: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (6).
    **Offen:** K4 (Suchindex-Budgetzeile — fremde Datei, Parallel-Session) · **K3-Scharfschaltung = David-Entscheid** (§8: kantonale Treffer kämen dann nur noch online; Ersparnis 4.26 MiB gzip = 45.2 %) · Gegenprüfung der Fix-Runde.
    **Folgepunkte aus F2 und dem Nebenbefund** — eigene Schritte, bewusst nicht in der Fix-Runde gebaut; Wortlaut: [FAHRPLAN-BASIS-AUSBAU.md](fahrplaene/FAHRPLAN-BASIS-AUSBAU.md) §2, Abschnitt «Restposten aus ROADMAP.md».

**Nachzug 24.9.2026** (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET): 2 Fahrplan-Einträge derselben Sorge sind hier im Wortlaut aufgenommen; im Fahrplan steht an ihrer Stelle je ein Zeiger hierher. Nichts gekürzt.

Die «Folgepunkte aus F2 und dem Nebenbefund», auf die dieser Posten oben verweist (Fahrplan BASIS-AUSBAU §2, «Restposten aus ROADMAP.md»), stehen seit 24.9.2026 hier; im Fahrplan steht je ein Zeiger hierher.

### 1 · Präfix-Parität des Edge-Weges *(aus `fahrplaene/FAHRPLAN-BASIS-AUSBAU.md`, §2, Restposten aus ROADMAP.md, vormals Z. 208)*

    - [ ] **Präfix-Parität des Edge-Weges** — der Client findet «Verjähr» (FlexSearch `tokenize: 'forward'`), der DB-Weg nicht. FTS5 könnte es (`"Verjähr"*`), aber Angleichen ist eine Recall-, RANG- und Latenz-Änderung auf jeder Query (GP-Messung 31.8.: Präfix hebt z. B. bei «Eigentum» OR 261/ZGB 200 via Marginalien-startsWith auf Stufe 0/Seite 1 — Rang-/Golden-Prüfung MIT budgetieren): lokal, warm, n=3 Median «Eigentum» 15,6 → 107,1 ms bei 658 → 1502 Treffern (6,9x), über Turso-HTTP ungemessen obendrauf. Braucht eigene Messung am Edge und eigene Gegenprüfung.

### 2 · Umlaut-Faltung ae/oe/ue *(aus `fahrplaene/FAHRPLAN-BASIS-AUSBAU.md`, §2, Restposten aus ROADMAP.md, vormals Z. 209)*

    - [ ] **Umlaut-Faltung ae/oe/ue** — «Verjaehrung» findet nichts, «Verjahrung» findet alle 259. `remove_diacritics 2` faltet ä→a, aber niemand faltet ae→ä. Betrifft **beide** Wege gleich (der Client strippt NFKD-Diakritika), ist also keine Edge-Lücke, sondern eine gemeinsame; ein Fix müsste beide Indizes zusammen ändern und braucht linguistische Sorgfalt («Aeroplan», «Israel», «Praesidium»).
