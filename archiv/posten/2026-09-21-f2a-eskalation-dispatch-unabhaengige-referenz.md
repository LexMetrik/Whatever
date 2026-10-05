<!-- @posten
dach: QS-EFFIZIENZ
titel: F2a eskalieren — «unabhängige Referenz» als Dispatch-§0-Zeile für Tor-Bau
anlass: zweiter F2a-Beleg trotz Gegenmittel, PR #960 (Curia-Publikationen, 21.9.2026); Skill lehren Ziff. 5
-->

**Warum.** F2a («Tor validiert sich selbst») ist seit dem 21.9.2026 **zweimal** belegt. Das
Gegenmittel — «Wächter gegen unabhängige Referenz» — steht nur im Skill `lehren`, und den lädt
ein Bau-Agent nicht. Beim zweiten Beleg hat der `lex-daten`-Agent eine Kreuzprobe gebaut, die
dieselben sechs Felder über dieselben Normalisierer zählte wie der geprüfte Schlüssel; erst die
adversariale Gegenprüfung fand, dass beide Wege denselben Fehler machen (11 amtliche Zeilen
verschmolzen bei grünem Tor). Skill `lehren` Ziff. 5: zweimal trotz Gegenmittel ⇒ Form
eskalieren, Prosa → Dispatch.

**Was.** Eine §0-Zeile in den generierten Agent-Definitionen für Klassen, die Tore bauen
(`lex-daten`, `lex-bau`), sinngemäss:

> Baust du ein Tor oder eine Kreuzprobe, benenne vor dem ersten Commit die **Referenz** und
> ihre **Datenbasis**. Unabhängig ist nur eine andere Datenbasis (rohe Zeilenzahl der Quelle,
> Manifest, amtliche Zählung) — nie eine zweite Rechnung über dieselbe Feldliste oder
> denselben Normalisierer. Zeig, dass die Referenz den Fehler sieht, den das Tor fangen soll.

**Wie (F12 beachten).** Quelle ändern, nie die Projektion: die Agent-Definitionen unter
`.claude/agents/**` sind generiert (`scripts/dispatch-agents.ts` bzw. Dispatch-Template);
`check:dispatch-klausel` muss danach grün sein. Die Zeile kostet ~60 Token je Dispatch —
Netto-Prosa-Zuwachs ist damit begründet (zweiter Beleg), aber an anderer Stelle eine gleich
lange überholte Zeile zu streichen, ist nach §17-Gegengewicht Satz 1 der bessere Weg.

**Nicht als Tor lösbar:** «Unabhängigkeit» einer Referenz ist semantisch, kein Linter kann sie
entscheiden (vgl. Skill `lehren` «Bewusst NICHT geregelt», generisches Meta-Tor verworfen).
