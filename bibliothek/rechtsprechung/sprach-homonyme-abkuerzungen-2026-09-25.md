# Sprach-Homonyme bei amtlichen Erlass-Kürzeln (25.9.2026)

**Anlass:** Nach-Verdikt zu e3f874779 (PR #1099) und Posten «Sprachgebundene Alias-Auflösung»
(QS-KORPUS). Die Totalsperre von «AIMP» nahm bund/bstger/RR_2026_46 (it, Rechtshilfe) sein IRSG.

## Quelle und Stand

Fedlex-SPARQL `https://fedlex.data.admin.ch/sparqlendpoint`, Prädikat `jolux:titleShort` über
alle `jolux:ConsolidationAbstract`, Abruf 25.9.2026 (Abfrage: Kürzel IN AIMP/OCP/OS/…).

| Kürzel | DEU | FRA | ITA | Regel im Code |
|---|---|---|---|---|
| AIMP | — | SR 172.056.5 (IVöB) | SR 351.1 (IRSG) | sprachgebunden: nur it → IRSG |
| OCP | — | SR 832.104 (VKL) | SR 922.01 (JSV) | sprachgebunden: nur fr → VKL |
| OS | — | SR 961.011 (AVO) + SR 961.05 | SR 961.011 + SR 961.05 | total gesperrt (Homonym in derselben Sprache; Korpus nur «OS LCart» = SVKG, SR 251.5) |

## Regel (deterministisch)

`SPRACH_HOMONYME` in `scripts/normtext/entscheide-mapping.ts`: die Fedlex-Alias-Zeile
{sr, sprache, abk} löst nur in Text dieser Sprache auf. Sprache je Textstück
(`sprachStueckeVon`): Regeste-Sprachfassung = deren `sprache`; Body/Auszug = `snap.sprache`,
ausser `spracheAusBody` widerspricht (dann keine); flache Regeste und Roh-statutes nur bei
einsprachigen Nicht-BGE (bei BGE mischt OCL die drei Regeste-Sprachen, Beleg 147_II_264: it-BGE
mit «Art. 8 Abs. 1 AIMP» aus der FR-Regeste = IVöB). Nicht eindeutig ⇒ kein Key.

## Korpus-Messung (25.9.2026, 5'386 Snapshots, 28 mit AIMP/OCP/OS)

Wirkung des Remaps: +IRSG an RR_2026_46 und RR_2026_97 (bstger, it); sonst keine normKeys-Änderung.
Die IT-Regeste-«AIMP» der Rechtshilfe-BGE (146_IV_36, 150_IV_201 u.a.) trugen IRSG bereits über
IRSG/EIMP. Beschaffungs-BGE (152_II_211, 152_II_325, 151_II_81, 150_II_105, 151_I_113) bleiben ohne IRSG.

## Geltung, Pflege, Abnahme

Pflege: neues sprachübergreifendes Kürzel ⇒ Fedlex-SPARQL-Beleg + Eintrag in `SPRACH_HOMONYME`
(oder `ABK_AUSSCHLUSS`, wenn es innerhalb einer Sprache mehrdeutig ist). Nebenfund: die
voilaj-Kanonisierung `scripts/datenhaltung/erlass-kanon.ts` führt «AIMP» sprachungebunden bei IRSG.
Abnahme David: offen.
