<!-- @posten
dach: W2·29-WERKBANK-LESER
titel: Reiter Änderungen: Artikel mit Revisions-Eintrag, aber ohne Historie-Ereignisse zeigt weder Fassung noch «Zu Art. N nichts erfasst» (stille Leerstelle §8)
-->

Auflage Bug-Check #1045 (Sonnet, 24.9.2026), Code-Ableitung, nicht empirisch: src/pages/gesetz-leser/v3/PanelTafeln.tsx ~90 (ohneFassung): artRev truthy + blatt.historie.ereignisse leer ⇒ BlattFassung nicht gerendert (braucht ereignisse.length) und BlattArtikelGruppe unterdrückt (ohneFassung false, geladen false). Die Angabe «zuletzt geändert durch …» steckt dann nur im zugeklappten Erlassteil. Erst Repro-Artikel suchen (Shard artikel-revisionen mit Eintrag, historie ohne Ereignis), dann fix + Test.
