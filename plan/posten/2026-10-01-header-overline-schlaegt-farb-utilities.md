<!-- @posten
dach: W2·19-DESIGN-KONSISTENZ
titel: Header-Overline schlägt Farb-Utilities
anlass: Session-Notizen 2026-10-01
-->

`.lc-route[data-reg] header .lc-overline` (index.css ~5096) überschreibt jede `text-warn/danger` an einer Overline im `<header>`; heute 0 Konsumenten (11 Bestand ausserhalb Bändern). Gleiche `:where(:not([class^="text-"]…))`-Klausel wie DK-16 nachziehen (P2-Nachzug #1222).
