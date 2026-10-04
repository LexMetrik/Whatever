<!-- @posten
dach: QS-AUTOMATIK
titel: fedlex-frische.yml schaltet gh pr merge --auto auf dem Re-Pin-PR (Risikopfad)
anlass: Session-Notizen 2026-10-01
-->

nur durch Merge-Schutz-Required gehalten; Hook tor-schutz.py blockt ausserdem `gh pr merge --disable-auto` (Muster zu breit). Wurzel: Workflow ohne --auto bei Risikopfad-Diff, Hook lässt --disable-auto durch.
