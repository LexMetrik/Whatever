<!-- @posten
dach: W2·30-RL-W3
titel: Fristenspiegel Zahlungsbefehl: RV-Ende im Kontext schkg — «frühestens» nicht voll richtungssicher
-->

Fristenspiegel Zahlungsbefehl: RV-Ende im Kontext schkg — «frühestens» nicht voll richtungssicher

Anlass: Zusammenführung Paket 5, 25.9.2026. Das Ende der Rechtsvorschlagsfrist rechnet mit Kontext schkg (früher). NE, Zustellung 15.3.2027: Ende 7.4., bei Zählung Ostermontag 8.4.; Spiegel zeigt «frühestens 8.4.», richtungssicher wäre 9.4. Warnung aus dem RV-Lauf nennt beide Daten. Fix: Kontext-Parameter in berechneSchkgFrist (src/lib/fristenspiegel/zahlungsbefehl.ts ~:62). Ebenda: zustellHinweis (A-Post Plus, allgemeineFrist.ts ~:495) evtl. Hinweis «gilt nur für ZPO-Zustellungen».
