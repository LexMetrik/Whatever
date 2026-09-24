<!-- @posten
dach: QS-KORPUS
titel: Gliederungsbaum: Knoten-Merge ohne Adjazenz-Bedingung
anlass: Fahrplan-Eintrag fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md §4, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

- [ ] **Gliederungsbaum: Knoten-Merge ohne Adjazenz-Bedingung** *(§9-Bug-Check 31.8.2026, Fund 3 — Vorbestand)* — `browse.ts` verschmilzt «letzter Knoten dieser Ebene + gleiches Label» auch über dazwischenliegende Direktartikel hinweg: `SG-811.1` rendert § 251bis direkt nach § 248bis (beide Marginalie «2. Straflose Selbstanzeige»), vor §§ 249–251. Wurzel-Fix: Adjazenz-Bedingung beim Merge; betrifft TOC + Lesespalte gleichermassen.

*Dach abweichend vom verlinkenden Schritt `W2·18-FEHLERBUCH`: Risikopfad (`src/lib/normtext/browse.ts:346`, `istRisikoPfad()`); W2·18-Regel «Risikopfad-Funde gehören NICHT hierher, sondern in den passenden Risiko-Dach-Schritt».*

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (§4, vormals Z. 195) — dort steht jetzt ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
