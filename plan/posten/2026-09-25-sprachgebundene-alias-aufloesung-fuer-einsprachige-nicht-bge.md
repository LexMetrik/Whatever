<!-- @posten
dach: QS-KORPUS
titel: Sprachgebundene Alias-Auflösung für einsprachige Nicht-BGE-Entscheide
anlass: Nach-Verdikt zu e3f874779 (PR #1099)
-->

25.9.2026: Die Sperre von «AIMP» (ITA = IRSG, FRA = IVöB) nimmt bund/bstger/RR_2026_46 (it, Rechtshilfe) das richtige IRSG — der Entscheid nennt das IRSG nur als «AIMP». Bei BGE ist eine sprachgebundene Auflösung nicht sauber (trilinguale Regeste im selben Snapshot), bei einsprachigen eidg./kantonalen Entscheiden wäre sie es (Sprache aus dem Body). Fix: Alias je Sprache nur in Snapshots dieser Body-Sprache auflösen, für BGE je Regeste-Sprachfassung; dann AIMP/OCP/OS entsperren wo eindeutig. Zweiter Fund derselben Einheit: der Band-Nachzug bildet normKeys nur aus statutes (scripts/normtext/adapter-entscheide.ts ~Z. 732), der Remap zusätzlich aus dem Fliesstext — Nachzug und Remap angleichen.
