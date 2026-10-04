<!-- @posten
dach: QS-KORPUS
titel: BS-Datum: Stichprobe pruefeBs unabhaengig vom Import machen, check:bs-entscheide gegen den Kopf
anlass: Gegenpruefung #1303, 4.10.2026
-->

pruefeBs (scripts/rechtsprechung/wochenlauf-kern.ts) nutzt dieselbe Regel waehleBsDatum wie der Import und ist damit nicht unabhaengig (§6.7): ein Regelfehler wuerde beidseitig durchgehen. Zweiter, regelfreier Leser noetig (z. B. Titel/Datum direkt aus dem Deckblatt-Text ohne Plausibilitaetslogik). Ausserdem vergleicht check:bs-entscheide datum nicht mit dem Kopf: ein falsches Datum unter 60 Tagen faellt nur bei Register-Abweichung auf; Rohdokumente liegen im Tor nicht vor, daher z. B. Kopf-Datum als Provenienzfeld ablegen oder das Tor auf Stichprobe-gegen-Netz verlagern. Rektifikat-Titel werden seit R1 gelesen (nicht uebernommen); ohne lesbaren Kopf bleiben 11 Dokumente (z. B. UV.2023.44, Rektifikat-Vermerk ausserhalb des Titel-Absatzes).

Nachtrag Delta-Gegenpruefung #1303 (R2, 4.10.2026): check:bs-entscheide erzwingt den Verdachts-Hinweis nicht — die Probe «datumKopfAbweichend aus SB.2021.107 geloescht» bleibt gruen. Das Tor soll aus dem Rohdokument das Kopf-Datum ziehen (oder es als Provenienzfeld im Snapshot tragen) und die Pflicht beider Hinweisfelder durchsetzen: Kopf gelesen und ≠ Portal ⇒ datum = Kopf + datumPortal, oder Verdacht/Rektifikat ⇒ datum = Portal + datumKopfAbweichend.
