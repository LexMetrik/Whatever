<!-- @posten
dach: W2·30-RL-W2A
titel: kuendigungsfrist.ts:59 probezeitEnde bei Beginn 30./31.: date-fns-Rundung liefert 27.2. statt 28.2.
anlass: RL-16-GP-Nebenfund, 24.9.2026
-->

date-fns kürzt den Monat, dann −1 Tag → 27.2. bei Beginn am 30./31.; 28.2. wäre vertretbar, zu prüfen. Dazu: kuendigungsfrist.ts:~140 GAV-Verkürzung auf 0 Monate → Beendigung am Zugangstag, Randfall ungetestet. RL-16 nicht vor HN-18 landen (golden-outputs.ts-Abhängigkeit, siehe Session-Notizen).
