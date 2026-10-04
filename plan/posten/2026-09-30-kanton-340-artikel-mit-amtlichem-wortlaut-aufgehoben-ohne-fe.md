<!-- @posten
dach: W2·27-BUND-FERTIG
titel: Kanton: 340 Artikel mit amtlichem Wortlaut «Aufgehoben» ohne Feld
anlass: Session-Notizen 2026-09-30
-->

Statuszeile «kein Text im Snapshot», Körper «aufgehoben» (ArtikelLeser.tsx:393, darstellung.ts:414); Kommentar ArtikelBody.tsx:247 stimmt für sie nicht (GP #1201 A4, tief).

Bewertet P2 (1.10.2026, Bau-Agent): NICHT gebaut — Fachentscheid David. Messung (`python3 …/p2-messung.py` über public/normtext/{bund,kanton}/*.json, Artikel ohne Feld aufgehoben/gegenstandslos): 340 Artikel bestehen ganz nur aus dem Wortlaut «Aufgehoben», alle ZH-Kanton (Bund 0, gemischt 0); 141 Kanton + 80 Bund nur «…». Der Posten-Titel nennt das «amtlichen Wortlaut» — für ZH stimmt das nicht: `scripts/normtext/adapter-zh-pdf.ts` (:450/:574/:697/:815) setzt «Aufgehoben» selbst, wenn ein §-Kopf/eine Ziffer ohne jeden Text gedruckt ist (`zh-tor-regeln.ts` PLATZHALTER: «steht so in KEINEM PDF», keine Fussnoten-Schranke im Code). Damit kippt die Prämisse der Nachzug-Auflage A1 («Quelle, nicht Platzhalter») und der Test `leser-leerstellen-w2-27.test.tsx` («Wer das ändern will, braucht einen Beleg, dass der Adapter das Wort nie aus einem Extraktionsrest erzeugt») bleibt unerfüllt. Optionen: (A) Statuszeile → «aufgehoben» — braucht den Beleg je Artikel; (B) Körper → «kein Text im Snapshot» wie die Statuszeile — konservativ, aber der Leser verliert eine meist richtige Auskunft; (C) Wurzel: ZH-Adapter setzt `aufgehoben: true`, wenn die Fussnote «Aufgehoben durch …» gedruckt ist, und lässt sonst «…»/leer — dann stimmen Körper und Statuszeile von selbst (Korpus-Paket, Kaskade). Empfehlung: C, bis dahin nichts ändern. Nur der falsche Kommentar in ArtikelBody.tsx ist berichtigt.
