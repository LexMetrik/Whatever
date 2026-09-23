<!-- @posten
dach: W2·17-UI-BEFUNDE
titel: Profil-Vorbefüllung bei Kündigung Mieter/Vertrag ausgeschaltet
anlass: W2·29-WERKBANK-VORLAGEN V2a-Nebenfund 23.9.2026
-->

VorlageKuendigungMieter und VorlageKuendigungVertrag setzen profilPrefill:false (Ist-Zustand übernommen); die übrigen Absender-Vorlagen füllen Name/Adresse aus dem Profil. Einschalten wäre eine Verhaltensänderung — prüfen, ob die Abweichung einen Grund hat.

Nachgemessen 23.9.2026: 13 Seiten setzen `profilPrefill: false` (u. a. KuendigungArbeitgeber, Verträge, Vorsorge); betroffen sind nur jene mit `absenderName`/`absenderAdresse` im Schema — zuerst diese Liste bilden.
