<!-- @posten
dach: QS-KORPUS
titel: fremdDefinierteKeys berücksichtigt GERICHTS_KUERZEL nicht
anlass: PR #1099
-->

25.9.2026: Die Sperre einer im Entscheid anders definierten Abkürzung (fremdDefinierteKeys, scripts/normtext/entscheide-mapping.ts) nutzt nur die amtliche Alias-Zuordnung, nicht die neue Tabelle GERICHTS_KUERZEL (scripts/normtext/gerichts-kuerzel.ts). Definiert ein BGE «CV» einmal anders, würde CV→VRK nicht gesperrt. Heute 0 Fälle (Nach-Verdikt #1099). Fix: GERICHTS_KUERZEL in fremdDefinierteKeys einbeziehen + Test.
