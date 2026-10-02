<!-- @posten
dach: W2·17-UI-BEFUNDE
titel: BG-06: geteilter Layout-Link ?p= überschreibt die eigenen gespeicherten Split-Panes dauerhaft (mittel, Datenverlust)
anlass: Abschluss Session «Gesetzesleser Funktionen inventarisieren» 2.10.2026 (Station E)
-->

Speicher `lexmetrik-panes=["/gesetze/bund/ZGB","/gesetze/bund/StGB"]`; Link `/gesetze/bund/OR?p=/gesetze/bund/BV` öffnen, Reload → Speicher `["/gesetze/bund/BV"]`, ZGB/StGB-Panes verloren. Ursache: usePaneLayout.ts:66-71 (Seed gewinnt) + :121 (Effekt schreibt den Seed sofort). Vorschlag: Seed nicht persistieren, solange der Nutzer nichts am Layout ändert, oder alten Satz als Rückweg ablegen. Beleg: Finder Bug G7–G12 2.10.2026, Notiz 2026-10-02-finder-bug-g.md.
