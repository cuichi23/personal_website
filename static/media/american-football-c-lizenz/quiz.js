/* Interactive quizzes for the "American Football: C-Lizenz" page.
 *
 * One file, two widgets sharing one engine:
 *   #clizenz-quiz    -- mock written exam for the Trainer-C license (text questions)
 *   #formation-quiz  -- identify offensive/defensive formations from SVG sketches
 *
 * Sources for the license questions: AFVD Rahmenrichtlinien 2023, AFVS
 * Rahmenrichtlinie Trainer-C, LSB Sachsen Grundlehrgang material. Formation
 * sketches follow standard American coaching conventions (offense = circles,
 * defense = crosses, offense drawn below the line of scrimmage). */
(function () {
  "use strict";

  // ======================================================== C-Lizenz questions

  var LICENSE_QUESTIONS = [
    // --- Sportorganisation / Haus des Sports --------------------------------
    { c: "Sportorganisation",
      q: "Was bildet das Dach im „Drei-Säulen-Haus des deutschen Sports“?",
      a: ["Der Deutsche Olympische Sportbund (DOSB)",
          "Das Bundesministerium des Innern (BMI)",
          "Der Deutsche Fußball-Bund (DFB)",
          "Die Landessportbünde"],
      k: 0,
      e: "Der DOSB ist die Dachorganisation des deutschen Sports (Sportselbstverwaltung). Präsidium (ehrenamtlich) und Vorstand (hauptamtlich) sind seine Organe." },
    { c: "Sportorganisation",
      q: "Welche drei Säulen tragen das Haus des Sports?",
      a: ["Landessportbünde – Spitzenverbände – Sportverbände mit besonderer Aufgabenstellung",
          "Bundesregierung – Landesregierungen – Kommunalverwaltungen",
          "Breitensport – Leistungssport – Gesundheits- und Rehabilitationssport",
          "Sportvereine – Sportfachverbände – kommunale Sportämter"],
      k: 0,
      e: "Die drei Säulen: 16 Landessportbünde, die Spitzenverbände (38 olympische + 28 nichtolympische, darunter die Landesfachverbände) und 20 Sportverbände mit besonderer Aufgabenstellung. Bund/Länder/Kommunen sind die öffentliche Sportverwaltung, nicht das Haus des Sports." },
    { c: "Sportorganisation",
      q: "Was bildet das Fundament des Hauses des Sports?",
      a: ["Die Sportvereine",
          "Die Kreissportbünde",
          "Die Sportstätten",
          "Die ehrenamtlichen Helfer"],
      k: 0,
      e: "Die rund 86.000 Sportvereine sind das Fundament – auf ihnen baut die gesamte Sportselbstverwaltung auf." },
    { c: "Sportorganisation",
      q: "Wer gehört zur öffentlichen Sportverwaltung auf Landesebene?",
      a: ["Das zuständige Ministerium (z. B. Innen-, Kultus- oder Sozialministerium)",
          "Der Landessportbund",
          "Der Landesfachverband",
          "Der Stadtsportbund"],
      k: 0,
      e: "Öffentliche Sportverwaltung: Bund (Bundeskanzleramt – Staatsministerin für Sport und Ehrenamt, bis 2025 das BMI), Land (Ministerium), Kommune (Sportamt/Eigenbetrieb Sportstätten). Landessportbund und Fachverbände gehören zur Sportselbstverwaltung." },
    { c: "Sportorganisation",
      q: "Welche Rolle hat der American Football Verband Deutschland (AFVD) im organisierten Sport?",
      a: ["Spitzenverband (Bundesfachverband) für American Football, Flag Football und Cheerleading",
          "Sportverband mit besonderer Aufgabenstellung",
          "Landesfachverband",
          "Kommerzieller Ligabetreiber ohne Verbandsstatus"],
      k: 0,
      e: "Der AFVD ist der Spitzenverband. Der American Football Verband Sachsen (AFVS) ist der zugehörige Landesfachverband, der die Trainer-C-Ausbildung in Sachsen trägt." },
    { c: "Sportorganisation",
      q: "Wie viele Mitgliedschaften zählt der DOSB ungefähr?",
      a: ["Rund 29 Millionen in über 86.000 Vereinen",
          "Rund 8 Millionen in 20.000 Vereinen",
          "Rund 50 Millionen in 150.000 Vereinen",
          "Rund 3 Millionen in 10.000 Vereinen"],
      k: 0,
      e: "Der DOSB vertritt 103 Mitgliedsorganisationen mit rund 29,3 Millionen Mitgliedschaften in mehr als 86.000 Vereinen; rund 500.000 Personen haben eine DOSB-Lizenz." },

    // --- Lizenz & Ausbildung ------------------------------------------------
    { c: "Lizenz & Ausbildung",
      q: "Wie viele Lerneinheiten (LE) umfasst die Ausbildung zum Trainer C mindestens?",
      a: ["120 LE zu je 45 Minuten",
          "60 LE zu je 45 Minuten",
          "90 LE zu je 60 Minuten",
          "30 LE zu je 45 Minuten"],
      k: 0,
      e: "Trainer C Leistungssport: mindestens 120 LE à 45 Minuten. In Sachsen: 30 UE sportartübergreifender Grundlehrgang (LSB/KSB) + 90 UE sportartbezogene Ausbildung beim AFVS." },
    { c: "Lizenz & Ausbildung",
      q: "Wie ist die sportartbezogene Trainer-C-Ausbildung in Sachsen organisiert?",
      a: ["90 UE in fünf Wochenendkursen",
          "90 UE als zweiwöchiger Blockkurs",
          "120 UE als reines Online-Studium",
          "60 UE an drei Wochenenden"],
      k: 0,
      e: "Die 90 UE werden in fünf Wochenendkursen vermittelt; ein Selbststudienanteil von maximal 30 UE ist in der Lizenzstufe C zulässig." },
    { c: "Lizenz & Ausbildung",
      q: "Woraus besteht die Lernerfolgskontrolle der Trainer-C-Ausbildung?",
      a: ["Schriftliche Klausur (2 UE) und praktische Prüfung (2 UE)",
          "Nur eine mündliche Prüfung",
          "Nur Anwesenheitspflicht, keine Prüfung",
          "Hausarbeit von 20 Seiten"],
      k: 0,
      e: "Zwei Prüfungen: Theorie als schriftliche Klausur (2 UE) und eine praktische Prüfung (2 UE), z. B. eine Lehrprobe. Geprüft wird nur, was in der Ausbildung vermittelt wurde; die Bestehenskriterien werden zu Beginn offengelegt." },
    { c: "Lizenz & Ausbildung",
      q: "Welche Voraussetzung gehört NICHT zur Zulassung der Trainer-C-Ausbildung im AFVS?",
      a: ["Abgeschlossenes Sportstudium",
          "Anmeldung durch einen Verein",
          "Teilnahme am sportartübergreifenden Grundlehrgang",
          "Nachweis eines Erste-Hilfe-Kurses"],
      k: 0,
      e: "Zulassung im AFVS: Vollendung des 16. Lebensjahres, Anmeldung durch einen Verein, Grundlehrgang-Nachweis und ein 16-stündiger Erste-Hilfe-Kurs. Ein Studium ist nicht erforderlich." },
    { c: "Lizenz & Ausbildung",
      q: "Wie alt darf der Erste-Hilfe-Nachweis zum Zeitpunkt der Lizenzierung höchstens sein?",
      a: ["Zwei Jahre", "Ein Jahr", "Fünf Jahre", "Es gibt keine Frist"],
      k: 0,
      e: "Der Erste-Hilfe-Kurs darf zum Zeitpunkt der Lizenzierung nicht älter als zwei Jahre sein (AFVS: 16 Stunden; die AFVD-Rahmenrichtlinien verlangen mindestens 9 Stunden)." },
    { c: "Lizenz & Ausbildung",
      q: "Wie lange ist die Trainer-C-Lizenz (1. Lizenzstufe) gültig?",
      a: ["Vier Jahre ab Ausstellungsdatum",
          "Zwei Jahre ab Ausstellungsdatum",
          "Unbegrenzt",
          "Ein Jahr, dann jährliche Verlängerung"],
      k: 0,
      e: "1. und 2. Lizenzstufe: vier Jahre; 3. Lizenzstufe (A): zwei Jahre. Die Gültigkeit beginnt mit dem Ausstellungsdatum." },
    { c: "Lizenz & Ausbildung",
      q: "Wie wird eine gültige Trainer-C-Lizenz verlängert?",
      a: ["Fortbildung von mindestens 15 LE innerhalb der Gültigkeitsdauer",
          "Erneute komplette Prüfung",
          "Formloser Antrag beim Verein",
          "Zahlung einer Verlängerungsgebühr ohne Fortbildung"],
      k: 0,
      e: "Mindestens 15 LE Fortbildung in der höchsten erworbenen Lizenzstufe. Der Erwerb einer höheren Lizenzstufe verlängert die niedrigere automatisch mit (gilt für C, B und A)." },
    { c: "Lizenz & Ausbildung",
      q: "Die C-Lizenz ist seit mehr als vier Jahren abgelaufen. Was nun?",
      a: ["Die gesamte Ausbildung muss wiederholt werden",
          "Eine Fortbildung mit 15 LE genügt",
          "Die Lizenz lebt automatisch wieder auf",
          "Nur die praktische Prüfung muss wiederholt werden"],
      k: 0,
      e: "Im 1. Jahr nach Ablauf: 15 LE Fortbildung; im 2./3. Jahr: 30 LE. Bei Überschreitung um mehr als vier Jahre muss die gesamte Ausbildung wiederholt werden." },
    { c: "Lizenz & Ausbildung",
      q: "Aus welchem Grund kann der AFVD eine Lizenz entziehen?",
      a: ["Verstoß gegen Satzung oder Ehrenkodex für Trainer",
          "Wechsel des Vereins",
          "Längere Verletzungspause",
          "Kritik an Schiedsrichterentscheidungen"],
      k: 0,
      e: "Lizenzentzug ist möglich bei Verstößen gegen die Satzung des AFVD, gegen ethisch-moralische Grundsätze (Ehrenkodex) oder bei Verhalten, das ihn oder sie als Trainer unwürdig erscheinen lässt." },

    // --- Recht & Aufsicht ---------------------------------------------------
    { c: "Recht & Aufsicht",
      q: "Was regelt § 832 BGB?",
      a: ["Die Haftung des Aufsichtspflichtigen für Schäden, die der Beaufsichtigte Dritten zufügt",
          "Das Mindestalter für die Mitgliedschaft in Sportvereinen",
          "Die Pflicht der Vereine, eine Sporthaftpflichtversicherung abzuschließen",
          "Das Hausrecht des Vereins in kommunalen Sportstätten"],
      k: 0,
      e: "§ 832 BGB: Wer kraft Gesetzes (oder Vertrags) aufsichtspflichtig ist, haftet für Schäden, die die beaufsichtigte Person Dritten zufügt – außer er weist nach, dass er seiner Aufsichtspflicht genügt hat." },
    { c: "Recht & Aufsicht",
      q: "Ab welchem Alter sind Kinder nach § 828 BGB grundsätzlich deliktsfähig?",
      a: ["Ab dem vollendeten 7. Lebensjahr (bedingt, nach Einsichtsfähigkeit)",
          "Ab Geburt",
          "Ab dem 14. Lebensjahr",
          "Erst ab dem 18. Lebensjahr"],
      k: 0,
      e: "Unter 7 Jahren: nicht verantwortlich. Zwischen 7 und 18: verantwortlich nur bei entsprechender Einsichtsfähigkeit. Deshalb wiegt die Aufsichtspflicht bei jüngeren Gruppen schwerer." },
    { c: "Recht & Aufsicht",
      q: "Welche Folgen kann die Verletzung der Aufsichtspflicht haben?",
      a: ["Zivilrechtliche (Schadensersatz) und strafrechtliche Haftung",
          "Nur eine Verwarnung durch den Verein",
          "Nur den Verlust der Lizenz",
          "Keine, da der Verein immer haftet"],
      k: 0,
      e: "Beides ist möglich: zivilrechtlich Schadensersatz (§§ 823, 832 BGB), strafrechtlich z. B. fahrlässige Körperverletzung. Die Sportversicherung des Vereins (z. B. ARAG über den LSB) deckt nur zivilrechtliche Risiken im Rahmen der Bedingungen." },
    { c: "Recht & Aufsicht",
      q: "Was gehört VOR Beginn der Übungsstunde zur Aufsichtspflicht?",
      a: ["Sportstätte und Geräte auf Gefahrenquellen prüfen",
          "Die Eltern schriftlich informieren",
          "Ein Protokoll an den Verband senden",
          "Nichts – Aufsicht beginnt erst mit dem Anpfiff"],
      k: 0,
      e: "Zur Aufsichtspflicht gehören: Gefahren ermitteln und beseitigen, belehren und warnen, überwachen und notfalls eingreifen – die Prüfung von Platz und Geräten steht am Anfang jeder Stunde." },
    { c: "Recht & Aufsicht",
      q: "Wer benötigt ein erweitertes Führungszeugnis?",
      a: ["Alle, die beruflich oder ehrenamtlich mit Kindern und Jugendlichen arbeiten",
          "Nur hauptamtliche Trainer im bezahlten Leistungssport",
          "Nur Vorstandsmitglieder mit Finanz- und Personalverantwortung",
          "Nur Cheftrainer der ersten Mannschaft im Profisport"],
      k: 0,
      e: "Das erweiterte Führungszeugnis enthält alle kinder- und jugendschutzrelevanten Verurteilungen, ist für Ehrenamtliche kostenfrei und ein Baustein der Prävention sexualisierter Gewalt im Verein – zusammen mit Ehrenkodex und Schutzkonzept." },

    // --- Sportbiologie ------------------------------------------------------
    { c: "Sportbiologie",
      q: "Wie wird Energie bei maximalen Belastungen unter ca. 10 Sekunden bereitgestellt (z. B. ein Sprint-Play)?",
      a: ["Anaerob-alaktazid über ATP- und Kreatinphosphat-Speicher",
          "Aerob über Fettverbrennung",
          "Anaerob-laktazid über Glykolyse mit Laktatbildung",
          "Ausschließlich über Glykogen aus der Leber"],
      k: 0,
      e: "Kurze Maximalbelastungen laufen über die ATP/KP-Speicher (anaerob-alaktazid). Längere intensive Belastungen (ca. 20 s bis 2 min): anaerob-laktazid; lange moderate Belastungen: aerob." },
    { c: "Sportbiologie",
      q: "Bei welcher Arbeitsweise spannt der Muskel an, ohne seine Länge zu ändern?",
      a: ["Isometrisch (statisch)", "Konzentrisch", "Exzentrisch", "Isokinetisch"],
      k: 0,
      e: "Isometrisch = Haltearbeit (z. B. Block halten), konzentrisch = überwindend (Muskel verkürzt sich), exzentrisch = nachgebend (Muskel verlängert sich unter Spannung, z. B. Abbremsen)." },
    { c: "Sportbiologie",
      q: "Wofür steht die PECH-Regel bei der Erstversorgung von Sportverletzungen?",
      a: ["Pause – Eis – Compression – Hochlagern",
          "Prüfen – Erste Hilfe – Checken – Helfen",
          "Pause – Essen – Coolen – Heimgehen",
          "Pressen – Entlasten – Kühlen – Hoffen"],
      k: 0,
      e: "Sofortmaßnahmen bei stumpfen Verletzungen: Pause (Belastung stoppen), Eis (kühlen), Compression (Druckverband), Hochlagern. Bei Verdacht auf Gehirnerschütterung: raus aus dem Spiel, ärztliche Abklärung." },
    { c: "Sportbiologie",
      q: "Wie reagiert das Herz-Kreislauf-System auf regelmäßiges Ausdauertraining?",
      a: ["Schlagvolumen steigt, Ruhepuls sinkt",
          "Schlagvolumen sinkt, Ruhepuls steigt",
          "Beides bleibt unverändert",
          "Nur der Blutdruck steigt dauerhaft"],
      k: 0,
      e: "Typische Anpassungen: größeres Schlagvolumen, niedrigere Ruheherzfrequenz, bessere Kapillarisierung der Muskulatur – der Körper arbeitet ökonomischer." },

    // --- Trainingslehre -----------------------------------------------------
    { c: "Trainingslehre",
      q: "Was beschreibt das Prinzip der Superkompensation?",
      a: ["Nach Belastung und Erholung steigt die Leistungsfähigkeit über das Ausgangsniveau",
          "Mehr Training führt immer zu mehr Leistung",
          "Pausen sind für den Trainingserfolg unwichtig",
          "Die Leistung fällt nach jedem Training dauerhaft ab"],
      k: 0,
      e: "Reihenfolge: Belastung → Ermüdung → Erholung → überschießende Anpassung. Setzt der nächste Reiz im richtigen Moment an, steigt die Leistung; zu früh oder zu spät verpufft der Effekt." },
    { c: "Trainingslehre",
      q: "Welche fünf motorischen Grundfähigkeiten unterscheidet die Trainingslehre?",
      a: ["Kraft, Schnelligkeit, Ausdauer, Beweglichkeit, Koordination",
          "Kraft, Mut, Technik, Taktik, Kondition",
          "Sprinten, Springen, Werfen, Fangen, Blocken",
          "Ausdauer, Disziplin, Teamgeist, Härte, Wille"],
      k: 0,
      e: "Die konditionellen Fähigkeiten Kraft, Schnelligkeit und Ausdauer, dazu Beweglichkeit (eine Mischform) und die koordinativen Fähigkeiten. Football-Training spricht alle fünf gezielt an." },
    { c: "Trainingslehre",
      q: "Wie wird ein Trainingsjahr klassisch periodisiert?",
      a: ["Vorbereitungs-, Wettkampf- und Übergangsperiode",
          "Sommer- und Winterpause",
          "Hin- und Rückrunde",
          "Camp, Saison, Playoffs"],
      k: 0,
      e: "Periodisierung strukturiert den langfristigen Leistungsaufbau: Vorbereitungsperiode (Grundlagen, Umfang), Wettkampfperiode (Intensität, Spielleistung halten), Übergangsperiode (aktive Erholung)." },
    { c: "Trainingslehre",
      q: "Was verlangt das Trainingsprinzip der progressiven Belastungssteigerung?",
      a: ["Belastungen allmählich steigern, sobald sich der Körper angepasst hat",
          "Jede Woche das Trainingsvolumen verdoppeln",
          "Immer mit maximaler Intensität trainieren",
          "Die Belastung konstant halten"],
      k: 0,
      e: "Gleichbleibende Reize verlieren ihre Wirkung. Belastung wird über Umfang, dann Dichte, dann Intensität gesteigert – altersgerecht und an die Entwicklung angepasst." },

    // --- Pädagogik & Gruppe -------------------------------------------
    { c: "Pädagogik & Gruppe",
      q: "In welcher Reihenfolge durchläuft eine Gruppe die fünf Gruppenphasen?",
      a: ["Forming – Storming – Norming – Performing – Adjourning",
          "Storming – Forming – Performing – Norming – Adjourning",
          "Norming – Forming – Storming – Adjourning – Performing",
          "Forming – Norming – Storming – Performing – Adjourning"],
      k: 0,
      e: "Orientierungsphase (Forming), Machtkampf-/Rollenklärungsphase (Storming), Vertrautheits-/Wir-Phase (Norming), Differenzierungsphase (Performing), Ablösungsphase (Adjourning). Phasen können stagnieren oder zurückfallen." },
    { c: "Pädagogik & Gruppe",
      q: "Wie verhält sich der Trainer konstruktiv in der Storming-Phase?",
      a: ["Gruppenregeln erarbeiten und Konflikte neutral moderieren",
          "Partei für die Stärkeren ergreifen",
          "Die Gruppe sich selbst überlassen",
          "Alle Konflikte sofort mit Strafen unterbinden"],
      k: 0,
      e: "In der Storming-Phase werden Rollen ausgekämpft. Der Trainer beobachtet, bremst dominante Mitglieder, ermutigt ruhige, trennt Beziehungs- und Sachebene und vermittelt neutral. Personalwechsel verlängert diese Phase." },
    { c: "Pädagogik & Gruppe",
      q: "In welcher Phase nimmt sich die Gruppenleitung bewusst zurück und wird zum Berater?",
      a: ["Performing (Differenzierungsphase)",
          "Forming (Orientierungsphase)",
          "Storming (Machtkampfphase)",
          "Adjourning (Ablösungsphase)"],
      k: 0,
      e: "In der Performing-Phase („goldene Zeit“) trägt die Gruppe sich selbst: der Trainer koordiniert, gibt Impulse und unterstützt, statt im Mittelpunkt zu stehen." },
    { c: "Pädagogik & Gruppe",
      q: "Kennenlernspiele und das Klären erster Regeln gehören in welche Gruppenphase?",
      a: ["Forming (Fremdheits- und Orientierungsphase)",
          "Performing",
          "Adjourning",
          "Norming"],
      k: 0,
      e: "In der Forming-Phase sind die Mitglieder unsicher und orientieren sich am Übungsleiter: Rahmenbedingungen klären, Sicherheit bieten, Kennenlernspiele, beobachten, Geduld haben." },

    // --- Methodik & Didaktik ------------------------------------------------
    { c: "Methodik & Didaktik",
      q: "Welche methodische Grundregel gilt für die Vermittlung neuer Bewegungen?",
      a: ["Vom Leichten zum Schweren, vom Einfachen zum Komplexen, vom Bekannten zum Unbekannten",
          "Vom Schweren zum Leichten, damit der Rest einfach wirkt",
          "Immer die Wettkampfform zuerst",
          "Theorie vor jeder Praxis"],
      k: 0,
      e: "Die methodische Reihe baut Technik schrittweise auf – im Football z. B. Footwork ohne Ball, dann mit Ball, dann gegen passiven, zuletzt gegen aktiven Widerstand." },
    { c: "Methodik & Didaktik",
      q: "Wie ist eine Übungsstunde klassisch aufgebaut?",
      a: ["Einstimmung/Aufwärmen – Hauptteil – Ausklang",
          "Hauptteil – Pause – Hauptteil",
          "Theorie – Praxis – Theorie",
          "Aufwärmen – Abschlussspiel – Krafttraining"],
      k: 0,
      e: "Dreiteilung: Einstimmung (physisch und mental vorbereiten, Verletzungen vorbeugen), Hauptteil (Schwerpunkt der Stunde), Ausklang (abwärmen, reflektieren). Planung, Durchführung und Auswertung gehören zusammen." },
    { c: "Methodik & Didaktik",
      q: "Was ist beim Training mit Kindern grundsätzlich zu beachten?",
      a: ["Belastung an die körperliche und geistige Entwicklungsstufe anpassen – Kinder sind keine kleinen Erwachsenen",
          "Das Erwachsenentraining mit geringeren Gewichten eins zu eins kopieren",
          "Möglichst früh maximale Kraftbelastungen setzen, um Talente zu formen",
          "Pausen möglichst kurz halten, um Trainingszeit zu sparen"],
      k: 0,
      e: "Umfang, Übungszeit, Pausengestaltung und Wiederholungen müssen alters- und entwicklungsgerecht sein; spielerische Formen und vielseitige Grundausbildung stehen vor früher Spezialisierung." },

    // --- American Football --------------------------------------------------
    { c: "American Football",
      q: "Welche Positionsgruppe gehört NICHT zur Technikschulung der Trainer-C-Ausbildung?",
      a: ["Libero",
          "Line",
          "Runningbacks",
          "Kicker, Punter, Holder"],
      k: 0,
      e: "Die Technikschulung (15 UE) umfasst Line, Defense Backs, Linebacker, Quarterbacks/Wide Receiver, Runningbacks sowie Kicker/Punter/Holder. Der Libero ist eine Volleyball-Position." },
    { c: "American Football",
      q: "In welche drei Bereiche gliedert sich das Taktiktraining?",
      a: ["Offense, Defense, Special Teams",
          "Angriff, Abwehr, Konter",
          "Run Game, Pass Game, Blitz",
          "Huddle, Audible, Snap"],
      k: 0,
      e: "Das Taktiktraining (10 UE) behandelt alle drei Phasen des Spiels: Offense, Defense und Special Teams." },
    { c: "American Football",
      q: "Was regelt die Bundesspielordnung des AFVD?",
      a: ["Den bundesweiten Spiel- und Wettkampfbetrieb",
          "Die Vereinsbeiträge",
          "Die NFL-Transferregeln",
          "Die Stadionordnung der Kommunen"],
      k: 0,
      e: "Bundesspielordnung und Wettkampfordnung des AFVD regeln den Ligabetrieb (z. B. German Football League), Spielberechtigungen und Wettkampfbedingungen – Pflichtstoff im Modul Organisation/Regelwerk (5 UE)." },
    { c: "American Football",
      q: "Welches Handlungsfeld hat ein Trainer C Leistungssport?",
      a: ["Grundlagentraining und Talentsichtung auf der unteren Ebene des Leistungssports",
          "Cheftrainer-Tätigkeit in der höchsten Bundesliga",
          "Ausschließlich Verwaltungsaufgaben im Verband",
          "Nur Betreuung des Krafttrainings"],
      k: 0,
      e: "Trainer C: Planung, Organisation, Durchführung und Steuerung des Grundlagentrainings für Anfänger und Fortgeschrittene, dazu Talentsichtung, -förderung und -bindung auf Vereinsebene." },
    { c: "American Football",
      q: "Warum gehören Antidopingrichtlinien und Ehrenkodex zur C-Ausbildung?",
      a: ["Trainer tragen Verantwortung für sauberen Sport und das Kindeswohl und verpflichten sich auf beides",
          "Sie sind nur für Profisportler und deren Betreuerstab relevant",
          "Sie betreffen ausschließlich Mannschaftsärzte und Physiotherapeuten",
          "Sie sind freiwillige Zusatzlektüre ohne jede Prüfungsrelevanz"],
      k: 0,
      e: "Die vereins- und verbandsbezogenen Inhalte der Rahmenrichtlinien nennen Antidopingrichtlinien und Ehrenkodex ausdrücklich; Verstöße gegen den Ehrenkodex können zum Lizenzentzug führen." },
  ];

  // ========================================================== Formation sketches
  //
  // Coordinates live in a 360x220 viewBox; the line of scrimmage sits at
  // y = 110. Offense (circles, center as square) is drawn below the line,
  // defense (crosses) above, following the usual coaching-board convention.
  // Horizontal scale is roughly 8 px per yard.

  var LOS_Y = 110;

  function offensiveLine() {
    return [[132, 122], [156, 122], [180, 122, "c"], [204, 122], [228, 122]];
  }

  // Faded reference offense shown under every defensive front: 11 personnel
  // with the tight end right (X split left, slot left, Z right off the line).
  var REFERENCE_OFFENSE = offensiveLine().concat([
    [252, 122],        // TE
    [36, 122],         // X
    [92, 134],         // slot
    [310, 134],        // Z
    [180, 136],        // QB under center
    [180, 174],        // RB
  ]);

  var OFFENSE_FORMATIONS = {
    "I-Formation": offensiveLine().concat([
      [252, 122],      // TE
      [36, 122],       // X on the line
      [324, 134],      // Z (flanker) off the line
      [180, 136],      // QB under center
      [180, 166],      // FB
      [180, 190],      // HB
    ]),
    "Singleback": offensiveLine().concat([
      [252, 122],      // TE
      [36, 122],       // X
      [92, 134],       // slot
      [324, 134],      // Z
      [180, 136],      // QB under center
      [180, 178],      // single deep back
    ]),
    "Shotgun Spread (2x2)": offensiveLine().concat([
      [36, 122],       // X
      [92, 134],       // slot left
      [324, 122],      // Z on the line
      [268, 134],      // slot right
      [180, 176],      // QB in the gun
      [216, 176],      // RB beside the QB
    ]),
    "Pistol": offensiveLine().concat([
      [252, 122],      // TE
      [36, 122],       // X
      [92, 134],       // slot
      [324, 134],      // Z
      [180, 164],      // QB ~4 yards deep
      [180, 190],      // RB directly behind the QB
    ]),
    "Trips Right (3x1)": offensiveLine().concat([
      [36, 122],       // single receiver left
      [240, 134],      // trips: inside off
      [282, 122],      // trips: middle on the line
      [324, 134],      // trips: outside off
      [180, 176],      // QB in the gun
      [146, 176],      // RB beside the QB
    ]),
    "Empty (3x2)": offensiveLine().concat([
      [30, 122],       // outside left on the line
      [72, 134],
      [112, 134],
      [268, 134],
      [324, 122],      // outside right on the line
      [180, 176],      // QB alone in the gun
    ]),
  };

  var DEFENSE_FORMATIONS = {
    "4-3": [
      [118, 100], [166, 100], [214, 100], [266, 100],    // DE, 1-tech, 3-tech, DE
      [128, 72], [180, 72], [232, 72],                   // Will, Mike, Sam
      [36, 92], [316, 92],                               // CBs
      [120, 36], [240, 36],                              // safeties
    ],
    "3-4": [
      [124, 100], [180, 100], [236, 100],                // 5-tech, nose, 5-tech
      [100, 90], [266, 90],                              // edge OLBs
      [152, 70], [208, 70],                              // ILBs
      [36, 92], [316, 92],                               // CBs
      [120, 36], [240, 36],                              // safeties
    ],
    "Nickel (4-2-5)": [
      [118, 100], [166, 100], [214, 100], [266, 100],
      [160, 72], [204, 72],                              // two LBs
      [92, 86],                                          // nickel over the slot
      [36, 92], [316, 92],
      [120, 36], [240, 36],
    ],
    "Dime (4-1-6)": [
      [118, 100], [166, 100], [214, 100], [266, 100],
      [180, 72],                                         // lone LB
      [92, 86], [252, 86],                               // nickel + dime backs on the slot/TE
      [36, 92], [316, 92],
      [120, 36], [240, 36],
    ],
    "3-3-5": [
      [132, 100], [180, 100], [228, 100],
      [136, 72], [180, 72], [224, 72],
      [84, 84], [280, 84],                               // overhangs
      [36, 92], [316, 92],
      [180, 32],                                         // single high safety
    ],
    "Goal Line (6-2)": [
      [116, 100], [142, 100], [168, 100], [194, 100], [220, 100], [246, 100],
      [158, 72], [202, 72],
      [48, 88], [308, 88],
      [180, 46],
    ],
  };

  var FORMATION_QUESTIONS = [
    { c: "Offense", f: "I-Formation",
      e: "Quarterback unter dem Center, Fullback und Halfback in einer Linie dahinter (21 personnel: 2 Backs, 1 Tight End). Klassische Downhill-Run-Formation." },
    { c: "Offense", f: "Singleback",
      e: "Quarterback unter dem Center, nur EIN Back tief hinter ihm, dazu Tight End und drei Receiver (11 personnel). Ausgewogen für Lauf und Pass." },
    { c: "Offense", f: "Shotgun Spread (2x2)",
      e: "Quarterback steht etwa fünf Yards tief (Shotgun), der Back NEBEN ihm, zwei Receiver pro Seite. Passlastige Spread-Formation." },
    { c: "Offense", f: "Pistol",
      e: "Quarterback nur etwa vier Yards tief, der Back direkt HINTER ihm (nicht daneben) – das unterscheidet Pistol von Shotgun und erhält das Downhill-Laufspiel." },
    { c: "Offense", f: "Trips Right (3x1)",
      e: "Drei Receiver auf einer Seite (Trips), ein einzelner Receiver auf der anderen. Zwingt die Defense, ihre Coverage zur Trips-Seite zu verschieben." },
    { c: "Offense", f: "Empty (3x2)",
      e: "Kein Back im Backfield – der Quarterback steht allein im Shotgun, fünf Receiver sind verteilt. Maximale Breite, aber keine Hilfe in der Pass Protection." },
    { c: "Defense", f: "4-3",
      e: "Vier Down-Linemen und drei Linebacker (Will, Mike, Sam), dahinter vier Defensive Backs. Klassische Base-Front gegen den Lauf." },
    { c: "Defense", f: "3-4",
      e: "Drei Down-Linemen – Nose Tackle direkt über dem Center, zwei 5-Technique-Ends – und vier Linebacker, davon zwei am Edge. Flexibel im Pass Rush." },
    { c: "Defense", f: "Nickel (4-2-5)",
      e: "Fünf Defensive Backs: Der fünfte (Nickel) steht über dem Slot-Receiver, dafür nur zwei Linebacker. Standardantwort auf 11 personnel." },
    { c: "Defense", f: "Dime (4-1-6)",
      e: "Sechs Defensive Backs und nur noch EIN Linebacker. Klares Passing-Down-Paket, z. B. bei 3rd & long." },
    { c: "Defense", f: "3-3-5",
      e: "Drei Linemen, drei Linebacker, fünf Defensive Backs mit zwei Overhang-Spielern – ein flexibler Stack-Look, beliebt gegen Spread-Offenses." },
    { c: "Defense", f: "Goal Line (6-2)",
      e: "Sechs Down-Linemen dicht an dicht, zwei Linebacker, nur drei Defensive Backs – maximale Masse an der Line, typisch in Goal-Line-Situationen." },
  ];

  var SVG_NS = "http://www.w3.org/2000/svg";

  function svgEl(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    for (var key in attrs) node.setAttribute(key, attrs[key]);
    return node;
  }

  function drawPlayers(svg, players, className) {
    players.forEach(function (p) {
      var x = p[0], y = p[1];
      if (className === "clqf__def") {
        var g = svgEl("g", { "class": className });
        g.appendChild(svgEl("line", { x1: x - 5, y1: y - 5, x2: x + 5, y2: y + 5 }));
        g.appendChild(svgEl("line", { x1: x - 5, y1: y + 5, x2: x + 5, y2: y - 5 }));
        svg.appendChild(g);
      } else if (p[2] === "c") {
        svg.appendChild(svgEl("rect",
          { x: x - 5.5, y: y - 5.5, width: 11, height: 11, "class": className }));
      } else {
        svg.appendChild(svgEl("circle", { cx: x, cy: y, r: 6, "class": className }));
      }
    });
  }

  function buildSketch(item) {
    var svg = svgEl("svg", {
      viewBox: "0 0 360 220", "class": "clqf",
      role: "img", "aria-label": "Formationsskizze",
    });
    svg.appendChild(svgEl("line",
      { x1: 8, y1: LOS_Y, x2: 352, y2: LOS_Y, "class": "clqf__los" }));
    if (item.c === "Defense") {
      drawPlayers(svg, REFERENCE_OFFENSE, "clqf__ghost");
      drawPlayers(svg, DEFENSE_FORMATIONS[item.f], "clqf__def");
    } else {
      drawPlayers(svg, OFFENSE_FORMATIONS[item.f], "clqf__off");
    }
    return svg;
  }

  // Turn a formation entry into a regular quiz question with three wrong
  // names drawn from the same side of the ball.
  function formationQuestions() {
    return FORMATION_QUESTIONS.map(function (item) {
      var pool = Object.keys(item.c === "Defense" ? DEFENSE_FORMATIONS : OFFENSE_FORMATIONS)
        .filter(function (name) { return name !== item.f; });
      var wrong = shuffled(pool).slice(0, 3);
      return {
        c: item.c,
        q: item.c === "Defense"
          ? "Welche Defensiv-Front zeigt die Skizze? (Offense grau angedeutet)"
          : "Welche Offense-Formation zeigt die Skizze?",
        a: [item.f].concat(wrong),
        k: 0,
        e: item.e,
        sketch: item,
      };
    });
  }

  // ================================================================== Engine

  var PASS_THRESHOLD = 0.75;

  var CSS = [
    ".clq{border:1px solid var(--muted,#999);border-radius:10px;padding:1.2rem 1.3rem;margin:1.5rem 0;background:var(--surface,#fff)}",
    ".clq__intro{margin:0 0 0.8rem}",
    ".clq__cats{display:flex;flex-wrap:wrap;gap:0.4rem;margin:0 0 1rem}",
    ".clq__cat{border:1px solid var(--muted,#999);background:transparent;color:var(--ink,#222);border-radius:999px;padding:0.3rem 0.8rem;font:inherit;font-size:0.85em;cursor:pointer}",
    ".clq__cat:hover{border-color:var(--accent,#b4620e)}",
    ".clq__progress{font-size:0.85em;color:var(--muted,#666);margin:0 0 0.5rem}",
    ".clq__bar{height:4px;background:var(--accent-wash,#eee);border-radius:2px;margin:0 0 1rem;overflow:hidden}",
    ".clq__bar span{display:block;height:100%;background:var(--accent,#b4620e);transition:width 0.3s}",
    ".clq__q{font-weight:600;margin:0 0 0.9rem}",
    ".clq__opts{display:grid;gap:0.5rem;margin:0}",
    ".clq__opt{text-align:left;border:1px solid var(--muted,#999);border-radius:8px;background:transparent;color:var(--ink,#222);padding:0.6rem 0.8rem;font:inherit;cursor:pointer;line-height:1.4}",
    ".clq__opt:hover:not(:disabled){border-color:var(--accent,#b4620e)}",
    ".clq__opt:disabled{cursor:default;opacity:0.75}",
    ".clq__opt--right{border-color:#1e8e3e;box-shadow:inset 0 0 0 1px #1e8e3e;opacity:1!important}",
    ".clq__opt--wrong{border-color:#c5221f;box-shadow:inset 0 0 0 1px #c5221f;opacity:1!important}",
    ".clq__feedback{border-left:4px solid var(--accent,#b4620e);background:var(--accent-wash,#f7ead9);border-radius:0 8px 8px 0;padding:0.7rem 0.9rem;margin:0.9rem 0 0;font-size:0.92em}",
    ".clq__feedback strong{display:block;margin-bottom:0.25rem}",
    ".clq__next{margin-top:1rem;border:none;border-radius:8px;background:var(--accent,#b4620e);color:#fff;padding:0.55rem 1.2rem;font:inherit;font-weight:600;cursor:pointer}",
    ".clq__next:hover{background:var(--accent-lift,#8f4c09)}",
    ".clq__score{font-size:1.15em;font-weight:600;margin:0 0 0.8rem}",
    ".clq__table{width:100%;border-collapse:collapse;font-size:0.9em;margin:0 0 1rem}",
    ".clq__table td,.clq__table th{padding:0.35rem 0.5rem;border-bottom:1px solid var(--accent-wash,#eee);text-align:left}",
    ".clq__table td:last-child,.clq__table th:last-child{text-align:right}",
    ".clqf{display:block;max-width:24rem;margin:0 auto 1rem;background:var(--accent-wash,#f7ead9);border-radius:8px}",
    ".clqf__los{stroke:var(--muted,#888);stroke-width:1.5;stroke-dasharray:6 4}",
    ".clqf__off{fill:var(--accent,#b4620e);stroke:none}",
    ".clqf__def line{stroke:var(--link,#3e3170);stroke-width:2.6;stroke-linecap:round}",
    ".clqf__ghost{fill:none;stroke:var(--muted,#888);stroke-width:1.3;opacity:0.45}",
    "rect.clqf__ghost,circle.clqf__ghost{fill:none}",
  ].join("\n");

  function shuffled(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
    }
    return copy;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function categoriesOf(questions) {
    var seen = [];
    questions.forEach(function (q) {
      if (seen.indexOf(q.c) < 0) seen.push(q.c);
    });
    return seen;
  }

  function Quiz(mount, questions, introText) {
    this.mount = mount;
    this.questions = questions;
    this.introText = introText;
    mount.classList.add("clq");
    this.renderStart();
  }

  Quiz.prototype.renderStart = function () {
    var self = this;
    this.mount.textContent = "";
    this.mount.appendChild(el("p", "clq__intro", this.introText));

    var row = el("div", "clq__cats");
    var names = ["Alle Themen"].concat(categoriesOf(this.questions));
    names.forEach(function (name, i) {
      var btn = el("button", "clq__cat", name);
      btn.type = "button";
      btn.addEventListener("click", function () {
        self.start(i === 0 ? null : name);
      });
      row.appendChild(btn);
    });
    this.mount.appendChild(row);
  };

  Quiz.prototype.start = function (filter) {
    this.filter = filter;
    var pool = filter
      ? this.questions.filter(function (q) { return q.c === filter; })
      : this.questions;
    this.deck = shuffled(pool);
    this.index = 0;
    this.right = 0;
    this.byCategory = {};
    this.renderQuestion();
  };

  Quiz.prototype.renderQuestion = function () {
    var self = this;
    var item = this.deck[this.index];
    this.mount.textContent = "";

    this.mount.appendChild(el("p", "clq__progress",
      (this.filter || "Alle Themen") + " · Frage " + (this.index + 1)
      + " von " + this.deck.length));

    var bar = el("div", "clq__bar");
    var fill = el("span");
    fill.style.width = (100 * this.index / this.deck.length) + "%";
    bar.appendChild(fill);
    this.mount.appendChild(bar);

    if (item.sketch) this.mount.appendChild(buildSketch(item.sketch));
    this.mount.appendChild(el("p", "clq__q", item.q));

    var order = shuffled(item.a.map(function (_, i) { return i; }));
    var opts = el("div", "clq__opts");
    order.forEach(function (optionIndex) {
      var btn = el("button", "clq__opt", item.a[optionIndex]);
      btn.type = "button";
      btn.addEventListener("click", function () {
        self.answer(item, optionIndex, opts, btn);
      });
      opts.appendChild(btn);
    });
    this.mount.appendChild(opts);

    var live = el("div");
    live.setAttribute("aria-live", "polite");
    this.mount.appendChild(live);
    this.live = live;
  };

  Quiz.prototype.answer = function (item, chosen, opts, chosenBtn) {
    var self = this;
    var correct = chosen === item.k;
    if (correct) this.right++;
    var stats = this.byCategory[item.c] || (this.byCategory[item.c] = { right: 0, total: 0 });
    stats.total++;
    if (correct) stats.right++;

    Array.prototype.forEach.call(opts.children, function (btn) {
      btn.disabled = true;
      if (btn.textContent === item.a[item.k]) btn.classList.add("clq__opt--right");
    });
    if (!correct) chosenBtn.classList.add("clq__opt--wrong");

    var box = el("div", "clq__feedback");
    box.appendChild(el("strong", null, correct ? "Richtig!" : "Leider falsch."));
    box.appendChild(document.createTextNode(item.e));
    this.live.appendChild(box);

    var last = this.index + 1 >= this.deck.length;
    var next = el("button", "clq__next", last ? "Zur Auswertung" : "Nächste Frage");
    next.type = "button";
    next.addEventListener("click", function () {
      self.index++;
      if (last) self.renderSummary(); else self.renderQuestion();
    });
    this.live.appendChild(next);
    next.focus();
  };

  Quiz.prototype.renderSummary = function () {
    var self = this;
    this.mount.textContent = "";
    var ratio = this.right / this.deck.length;
    var verdict = ratio >= PASS_THRESHOLD
      ? "Bestanden – damit kannst du in die Prüfung gehen."
      : "Noch nicht sicher genug – die Erklärungen nennen jeweils den Stoff zum Nachlesen.";
    this.mount.appendChild(el("p", "clq__score",
      "Ergebnis: " + this.right + " von " + this.deck.length + " richtig ("
      + Math.round(100 * ratio) + " %). " + verdict));

    var table = el("table", "clq__table");
    var head = el("tr");
    head.appendChild(el("th", null, "Themenbereich"));
    head.appendChild(el("th", null, "Richtig"));
    table.appendChild(head);
    Object.keys(this.byCategory).forEach(function (cat) {
      var stats = self.byCategory[cat];
      var row = el("tr");
      row.appendChild(el("td", null, cat));
      row.appendChild(el("td", null, stats.right + " / " + stats.total));
      table.appendChild(row);
    });
    this.mount.appendChild(table);

    var again = el("button", "clq__next", "Neue Runde");
    again.type = "button";
    again.addEventListener("click", function () { self.renderStart(); });
    this.mount.appendChild(again);
  };

  function init() {
    var examMount = document.getElementById("clizenz-quiz");
    var formationMount = document.getElementById("formation-quiz");
    if (!examMount && !formationMount) return;

    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    if (examMount) {
      new Quiz(examMount, LICENSE_QUESTIONS,
        "Wähle einen Themenbereich oder starte die komplette Probeklausur ("
        + LICENSE_QUESTIONS.length + " Fragen). Jede Frage hat genau eine richtige "
        + "Antwort; nach jeder Antwort folgt eine kurze Erklärung.");
    }
    if (formationMount) {
      new Quiz(formationMount, formationQuestions(),
        "Erkenne die Formation anhand der Skizze: Kreise = Offense (Quadrat = Center), "
        + "Kreuze = Defense, gestrichelte Linie = Line of Scrimmage. Die graue "
        + "Offense in den Defense-Skizzen ist nur eine räumliche Referenz. "
        + "Wähle Offense, Defense oder beides.");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
