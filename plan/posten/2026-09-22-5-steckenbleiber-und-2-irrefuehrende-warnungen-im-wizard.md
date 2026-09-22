<!-- @posten
dach: QS-CODE-PROP
titel: 5 Steckenbleiber und 2 irreführende Warnungen im Wizard
anlass: Recherche-Session 21./22.9.2026, per Skript bewiesen; Risikopfad, darum nicht ins Fehlerbuch
-->

Kein Geist, aber dieselbe Wurzel-Familie — **Nutzer steckt fest** (gemeinsame Regel: ein deaktiviertes oder ausgeblendetes Bedienelement darf keinen Wert festhalten, der ein Tor sperrt):
  - Mietvertrag `mietvertrag.ts:318` (Konkurrenzschutz-Blocker ohne `!wohnung`).
  - Handelsreisendenvertrag `handelsreisendenvertrag.ts:100`/`:101` (Delkredere-Blocker ohne `NUR_EXPERTE`).
  - Schlichtungsgesuch BS `:297` + Seite `:389` (Checkbox `disabled` bei `checked`).
  - Schlichtungsgesuch BS `:312` + Seite `:473` (`antragEntscheid` bleibt gesetzt bei Betrag > 2000).
  - Klage ordentlich `klageOrdentlich.ts:185` (ohne `!a.klagebewilligungVorhanden`; Nachbarstellen `:322`/`:357` haben den Guard).
**Irreführende Warnungen:** Vollmacht `vollmacht.ts:162,168,174,181` (`bereiche[]` ohne Typ-Guard) · Testament `testament.ts:84` (Scheidungs-Warnung ohne `zivilstand`-Guard).
Vorbilder, die es richtig machen: `kuendigungArbeitgeber.ts:76-79`, `kuendigungArbeitnehmer.ts:71-73`, Seite Schlichtungsgesuch `:366`. Risikopfad (Gates/Rechtslogik) → Gegenprüfung, nicht ins Fehlerbuch. Detail: `bibliothek/recherche/legal-design-und-korrektheits-recherche-2026-09-21.md` Ziff. 5.
