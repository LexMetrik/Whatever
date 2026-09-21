<!-- @posten
dach: QS-KORPUS
titel: Curia: globaler Unter-Abruf ist unbewacht — Schrumpf-Schwelle je Shard fehlt
anlass: Auflage 5 der Gegenprüfung zu PR #960 (21.9.2026)
-->

**Die Lücke.** Das Tor aus PR #960 vergleicht je Geschäft die gespeicherte Publikationszahl gegen
`objectiveZeilen` — die rohe Zeilenzahl **derselben Antwort**. Liefert der Endpunkt einmal zu wenig
(Teil-Ausfall, stille Drosselung, Filter-Änderung auf der Gegenseite), **sinken beide Zahlen
gemeinsam** und das Tor bleibt grün. Der Vergleich erkennt zuverlässig, dass wir nicht verlieren,
was geliefert wurde — nicht, dass genug geliefert wurde.

Das ist kein Konstruktionsfehler des Tors (eine offline prüfbare Referenz kann nicht wissen, was der
Endpunkt hätte senden sollen), sondern eine zweite, fehlende Sicherung.

**Vorschlag: Schrumpf-Schwelle gegen den Vormonatsstand.** Der Zustandsträger
`bibliothek/register/curia-zustand.jsonl` führt je Geschäft bereits `publikationen` und
`objectiveZeilen`. Sinkt eine dieser Zahlen gegenüber dem letzten Lauf, wird der Lauf bzw. das Tor
**rot** — mit einer im Register begründeten Ausnahme für die Fälle, in denen die Amtsquelle
tatsächlich zurücknimmt (belegt: «`Objective` bekommt nachträglich neue Zeilen», R4 6.9.2026 — die
Gegenrichtung ist damit nicht ausgeschlossen).

**Offene Entwurfsfragen** (bewusst nicht vorentschieden): Schwelle je Shard oder erst ab einer
Gesamtabweichung? Gilt sie auch für `beschluesse`/`vorberatungen`, die heute ohnehin unbewacht sind
(siehe Posten `2026-09-21-curia-nachbarn-resolution-zaehler-select.md`)? Und wo wird die Ausnahme
geführt — im Zustandsträger oder in einer eigenen, datierten Registerdatei?

**Klasse:** `daten` (Risikopfad). Nicht dringend, aber es ist die einzige verbleibende Klasse
stillen Verlusts in dieser Etappe.
