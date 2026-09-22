<!-- @posten
dach: SEO-A11Y
titel: Texte vor dem Live-Gang (David)
anlass: Messung 21.9.2026; sammelt alle Rechtstexte, die vor einem Live-Gang fehlen
wartet-auf: david
-->

WARTET AUF DAVID — sechs Punkte, alle sein Handschritt bzw. sein Entscheid, keiner davon Bau:
  - **Impressum** fehlt ganz (keine Route; `Ueber.tsx:96-104` nennt nur Name und LinkedIn). Art. 3 Abs. 1 lit. s UWG — Anwendbarkeit bei Unentgeltlichkeit unklar.
  - **Datenschutzerklärung**: Platzhalter «Verantwortlicher» (`Datenschutz.tsx:34`) und Platzhalter Vercel/USA (`:98-99`).
  - **entscheidsuche-Übermittlung offenlegen**: `src/lib/rechtsprechung/livesuche.ts:109` schickt den Suchbegriff an entscheidsuche.ch (Opt-in) — in `Datenschutz.tsx` heute nicht genannt (grep leer). Die drei weiteren Abflüsse (zefix, geo.admin, `/api/fehler`) mitprüfen.
  - **Vercel-DPF-Status** klären: privacyshield.gov führt «Inactive» seit 2022, Vercel gibt das Gegenteil an.
  - **Nutzungsbedingungen** fehlen.
  - **Art. 45c FMG**: Hinweis auf `localStorage`.
*Reichweite (eigene Domain, Search Console, Linklisten) ist **zurückgestellt** — Entscheid David 21.9.2026 «ich will noch nicht live gehen sodass ich gefunden werde»; «so lassen fürs erste» (kein noindex, kein Passwortschutz).*
Detail und weitere ungeprüfte Punkte (Gerichtsbesetzung im Korpus, Terms der Quellen, Marke, BGFA/PrHG): `bibliothek/recherche/legal-design-und-korrektheits-recherche-2026-09-21.md` Ziff. 15.
