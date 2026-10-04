<!-- @posten
dach: W2·17-UI-BEFUNDE
titel: LeserTastatur.tsx: blaetternRef per useEffect nachgezogen ⇒ zwei ←/→ vor dem Render (Tastenwiederholung) können einen Schritt verlieren
anlass: Fund aus #1304 (Einzelmodus-Flake), Aufräum-Session 4.10.2026
-->

j/k sind mit angesprungenRef gelöst; ←/→ nicht. Reproduktion zuerst (§0 Ziff. 2): zwei Tastenevents in einem Tick, Erwartung zwei Schritte.
