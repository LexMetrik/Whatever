<!-- @posten
dach: W3-RECHTSSTAND-WEICHE
titel: Verjährungsrevision 2020 als echte Weiche (David, fachlich)
wartet-auf: david
-->

  - [ ] **WARTET AUF DAVID (fachlich, §7):** Verjährungsrevision 2020 (relative Frist 1→3 J.) als echte Weiche statt Nutzerwarnung (`verjaehrung.ts:547`).

**Nachtrag 22.9.2026 — gemessen, nicht mehr nur vermutet** (BGE-Recherche der Recherche-Session;
Detail und Belegkette `bibliothek/recherche/legal-design-und-korrektheits-recherche-2026-09-21.md`
Ziff. 18.3):

`src/lib/verjaehrung.ts:71-109` trägt **nur die neuen Fristen**, ohne jede Datumsverzweigung; die
Warnung `:545` hängt **allein an `beginnRelativ`** (`:210`). Daraus entstehen belegt **falsche
Verdikte «nicht verjährt»** (Klasse K2):

  - Delikt, Kenntnis 1.3.2018 → Soll verjährt 1.3.2019, Engine sagt 1.3.2021.
  - Bereicherung, Kenntnis 1.9.2018 → dieselbe Klasse.
  - **Personenschaden, Verhalten 1.6.2005, Kenntnis 2021 → Engine rechnet absolut bis 2025, richtig
    wäre verjährt seit 2015 — und zwar OHNE WARNUNG**, weil nur `beginnAbsolut` vor 2020 liegt.
  - Der Fehler wandert über Unterbrechungsketten bis 2026 weiter.

Kandidat K3/K4 (Herleitung des Agenten, **nicht belegt**): `vertrag_person`, Pflichtverletzung 2015,
Kenntnis 2021 → Engine «verjährt 1.3.2024», altrechtlich Art. 127 bis 1.3.2025 (Art. 49 Abs. 2 SchlT
ZGB). Fehlalarm in der Gegenrichtung: die Warnung erscheint auch bei `ordentlich`, wo Art. 127
unverändert ist. Korrekt bleiben alle am 1.1.2020 noch laufenden Fristen (K1).

**Damit ist das der fünfte §1-Ort** neben den vier Geister-Orten unter `QS-CODE-PROP`. Die fünf
Regeln des Art. 49 SchlT ZGB sind belegt (BGE 148 II 73 E. 6.2.2; 9C_608/2024 E. 3.2; BBl 2014 268 f.;
4A_648/2024 E. 5.1; 9C_429/2022 E. 5.1.2/5.2; 5A_435/2025 E. 7.1.2; 4A_507/2020 E. 4.1). Zu
Art. 60 Abs. 1bis und Art. 128a OR gibt es in der Sache **keinen** BGer-Entscheid.

**Bleibt `wartet-auf: david`** — die Messung liefert die Grundlage, der fachliche Entscheid über die
Weiche (und über die Behandlung der K3/K4-Klasse) gehört David. Nicht drängen.
