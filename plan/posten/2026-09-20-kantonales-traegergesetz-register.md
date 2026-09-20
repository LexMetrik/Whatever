<!-- @posten
dach: W2·20-VERWEIS-SCHAERFE
titel: Kantonales Trägergesetz-Register
anlass: Phase 2, Folge aus #864
-->

  - [ ] **Kantonales Trägergesetz-Register** *(Phase 2, Folge aus #864)* — 19 kantonale Vollzugsverordnungen (AR u. a., HuV → HuG) verlieren mit #864 den falschen Self-Link, bekommen aber keinen richtigen: die Ingress-Auswertung gibt es nur für den Bund (nur dort tragen die Struktur-Sidecars den Ingress). Kein Link ist besser als ein falscher (§1) — der Nachzug ist ein eigener Schritt. Dazu die **12. Handkopie der Suffix-Reihe**: `KantonNormText.tsx:49` (`RE_PARAGRAF`) trägt nur `(?:bis|ter)?`, darum bleiben SO-614.11 § 115septies…undecies unverlinkt (Kanton-Grammatik auf `ART_SUFFIXE` ziehen).
