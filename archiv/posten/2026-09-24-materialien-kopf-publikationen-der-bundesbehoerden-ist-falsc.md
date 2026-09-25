<!-- @posten
dach: W2·29-WERKBANK-REST
titel: /materialien-Kopf «Publikationen der Bundesbehörden» ist falsch; /abdeckung «amtliche Ressourcen» mischt Gattungen
anlass: Nebenfund U12/U11/U10, Session 24.9.2026 abends (Notiz 2026-09-24-start-nachtraege)
-->

Materialien.tsx:78 nennt STARTSEITE_ZAEHLER.materialien (1'683) «Publikationen der Bundesbehörden», darunter aber 117 GR-BS-Geschäfte (kantonal) und die Gesetzgebungs-Materialien; seo.ts:116 beschreibt nur Soft-Law. Seit U12 (#1068) gibt es die Teilzähler materialienGesetzgebung/materialienErlaeuterungen — Kopf, SEO-Text und /abdeckung (zaehler-eine-quelle.test.tsx:50 «amtliche Ressourcen») auf die Hausbegriffe Materialien = Gesetzgebung, Erläuterungen = Verwaltungspraxis umstellen.

**Erledigt 2026-09-25:** REST S2 (6fd9619a8 + ee455bf14): Kopf /materialien, seo.ts Titel+Beschreibung, /abdeckung, Fehlseite auf Materialien (Gesetzgebung)/Erläuterungen (Verwaltungspraxis); Bug-Check Sonnet bestanden
