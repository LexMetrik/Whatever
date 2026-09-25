<!-- @posten
dach: QS-KORPUS
titel: datenhaltung:doppellauf schreibt fest nach /tmp/e1-doppellauf
anlass: Session-Notizen 2026-09-25
-->

Die Sandbox des Doppellaufs liegt fest unter `/tmp/e1-doppellauf` (wird gelöscht und neu geschrieben). Parallel laufende Prüfer oder Sessions stören sich dort gegenseitig, und Prüfaufträge verbieten Schreiben unter /tmp. Fix: Sandbox-Pfad per Argument oder Umgebungsvariable setzbar, Standard in ein eindeutiges Temp-Verzeichnis je Lauf (§17). Gefunden in der Gegenprüfung HN-04 am 25.9.2026 (der Prüfer lenkte den Pfad dafür vorübergehend um).
