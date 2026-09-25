<!-- @posten
dach: QS-KORPUS
titel: 200-Fehlerseite (Incapsula) landet dauerhaft im clir-Cache, ohne gezählt zu werden
anlass: Prüfer-Nebenfund #1120, quittiert 25.9.2026
-->

Liefert bger.ch/search.bger.ch statt des Urteils eine Incapsula-200-Fehlerseite (JS-Challenge), akzeptiert der clir-Cache (clir-regeste.ts) den 200er als Treffer und speichert ihn dauerhaft — der Fehlerfall wird nirgends gezählt oder gemeldet. Wurzel-Fix: Inhalts-Marker-Gate wie bs-client.ts es für BS bereits hat (Status + Content-Type + Mindestlänge + Marker) statt reinem HTTP-Status; ein erkannter Fehlerinhalt darf nicht gecacht werden. Vorbestand, kein neuer Vorfall dieser Session — Fundstelle Prüfer-Bericht #1120.
