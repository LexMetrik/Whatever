<!-- @posten
dach: W2·27-BUND-FERTIG
titel: Befristete Fassungen «in Kraft vom X bis zum Y» (58 Fussnoten) werden als «Gilt seit X» gelesen, auch wenn Y verstrichen ist
-->

Befund P7 (1.10.2026, Messung: grep -E 'in Kraft vom [^;]{0,40}bis (zum )?[0-9]' über alle Fussnotentexte in public/normtext/struktur/bund = 58). TRIGGER_RE in src/lib/normtext/historie-parse.ts nimmt «in Kraft» + «vom» + Datum innerhalb von 30 Zeichen und ignoriert das Enddatum; das Ereignis (fassung/eingefuegt) trägt nur den Beginn, giltSeit rückt auf X. Ist die Frist abgelaufen (Beispiel AIG Art. 72, Covid-19-Test bis 30. Juni 2024, dort jetzt durch #53 abgefangen, weil der Körper «…» ist) oder liegt sie in der Zukunft, sagt «Gilt seit X» etwas Falsches bzw. Unvollständiges (§8). Zu klären vor dem Bau (Datenmodell-/Anzeige-Entscheid): Feld «bis» am Ereignis, Anzeige «Gilt vom X bis Y» bzw. «befristet bis Y», und was mit giltSeit bei abgelaufener Frist passiert. Betroffen: historie-parse.ts (TRIGGER_RE/datumAusSegment), Historie-Shards, fassungsEtikett.ts. Kein Datum raten (§7): Enddatum steht amtlich in der Fussnote.
