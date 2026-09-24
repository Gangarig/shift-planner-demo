# Prägler Schichtplaner — einfache Bedienungsanleitung

Geprüft am 17. September 2026

## Was die Anwendung kann

Der Prägler Schichtplaner verwaltet den Arbeitsplan eines Unternehmens von Montag bis Freitag. Die Anwendung ersetzt den Papierplan durch einen gemeinsamen Wochenplan und behält dabei die vertraute Aufteilung nach Arbeitsplatz und Wochentag bei.

Planungsverantwortliche können mehrere Beschäftigte einem Arbeitsplatz zuordnen, Einsätze verschieben, Arbeitszeiten und Notizen eintragen, Stammarbeitsplätze automatisch befüllen, Betriebsurlaub festlegen, einen fertigen Wochenplan veröffentlichen, teilen und im A4-Querformat drucken. Beschäftigte sehen den gesamten veröffentlichten Plan, können ihn aber nicht verändern.

## Berechtigungen

| Rolle         | Berechtigungen                                                                                                                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mitarbeiter   | Sieht den gesamten veröffentlichten Wochenplan, das eigene Dashboard, eigene Anträge und Lohnzettel. Kann Urlaub oder Abwesenheit beantragen und Nachweise hochladen.                               |
| Manager       | Verwaltet Pläne, Beschäftigte, Arbeitsplätze, Tagesnotizen, Status und Stammarbeitsplätze. Kann Wochen veröffentlichen, teilen und drucken.                                                         |
| Administrator | Hat Manager-Rechte sowie Zugriff auf Betriebsurlaub, Einstellungen, Exporte und die schreibgeschützte Personalverrechnungsübersicht.                                                                |
| Buchhaltung   | Prüft Nachweise, genehmigt oder lehnt Anträge ab, erfasst Überstunden und lädt private Lohnzettel hoch. Darf den Arbeitsplan nicht verändern.                                                       |
| Eigentümer    | Hat vollständigen Planungs- und Einstellungszugriff, verwaltet Einladungen und Benutzerkonten und sieht die geschützte Änderungshistorie. Die Freigabe von Anträgen bleibt Aufgabe der Buchhaltung. |

## Erste Einrichtung

1. Der Eigentümer öffnet **Team & Zugriff**, wählt **Person einladen**, legt die Rolle fest und verbindet das Benutzerkonto mit dem passenden Mitarbeiterdatensatz.
2. Die eingeladene Person öffnet den Link aus der E-Mail, legt ein Passwort fest und meldet sich an.
3. Ein Manager, Administrator oder Eigentümer legt Arbeitsplätze und Beschäftigte an und wählt bei Bedarf den Stammarbeitsplatz jeder Person.
4. Unter **Planer** wird die Woche gewählt. Danach können Stammarbeitsplätze automatisch befüllt oder Einsätze manuell eingetragen werden.
5. Mit **Woche veröffentlichen** wird der Plan für das gesamte Team sichtbar und eine Benachrichtigung versendet.

## So funktioniert die Wochenplanung

- Eine Person im Team-Bereich auswählen und anschließend auf die gewünschte Zelle klicken oder die Person in die Zelle ziehen.
- An einem Arbeitsplatz dürfen am selben Tag mehrere Personen eingetragen sein.
- Eine Person darf pro Tag nur einem Arbeitsplatz zugeordnet sein. Oberfläche und Datenbank verhindern Doppelbuchungen.
- Ein bestehender Einsatz kann per Drag-and-drop verschoben werden. Eine manuelle Einteilung hat Vorrang vor dem Stammarbeitsplatz.
- **Stammarbeitsplätze befüllen** ergänzt fehlende Arbeitstage. Manuelle Einteilungen werden nicht überschrieben.
- Durch Anklicken eines Einsatzes können Person, Beginn, Ende und Übergabenotiz bearbeitet werden.
- Eine Tagesnotiz gilt für den gesamten Tag und erscheint oben in der jeweiligen Spalte.
- Eine erneute Veröffentlichung erzeugt eine neue Version des Wochenplans und informiert das Team.

Auch eine vollständig geschlossene oder leere Woche kann veröffentlicht werden, beispielsweise während Betriebsurlaub oder einer Feiertagswoche.

## Urlaub, Krankenstand und Verfügbarkeit

Der allgemeine Mitarbeiterstatus kann Verfügbar, Verspätet, Krank, Urlaub oder Inaktiv sein. Genehmigte, datumsbezogene Abwesenheiten sind genauer und sperren ausschließlich die betroffenen Tage.

Wenn die Buchhaltung einen Urlaubs- oder Krankenstandsantrag genehmigt, wird die datumsbezogene Abwesenheit angelegt. Bestehende, widersprüchliche Einsätze werden für diese Tage entfernt. Der Planer aktualisiert sich sofort, zeigt die Abwesenheit im Team-Bereich an und verhindert neue Einteilungen. Zusätzlich lehnt die Datenbank einen widersprüchlichen Eintrag ab.

Verspätungen und Arzt- oder Krankenhausbesuche dienen als Information. Ein bestehender Arbeitseinsatz kann deshalb im Plan stehen bleiben.

## Stammarbeitsplätze und manuelle Änderungen

Ein Stammarbeitsplatz ist der übliche Einsatzort einer Person. Mathi kann beispielsweise **BÜRO** und Edi **ARBEITSPLATZ HALLE** als Stammarbeitsplatz erhalten.

Wenn Mathi am Mittwoch manuell einem anderen Arbeitsplatz zugeordnet wird, bleibt diese manuelle Einteilung bestehen. Das spätere automatische Befüllen verschiebt Mathi an diesem Tag nicht zurück.

## Anträge, Nachweise, Überstunden und Lohnzettel

Beschäftigte öffnen **Abwesenheit & Lohnzettel**, um Urlaub, Krankenstand, einen Arzt- oder Krankenhausbesuch oder eine sonstige Abwesenheit zu beantragen. Zu einem offenen Antrag können PDF-, JPG- oder PNG-Nachweise bis 10 MB hochgeladen werden.

Die Buchhaltung prüft alle beigefügten Dokumente und genehmigt oder lehnt anschließend den Antrag ab. Nicht geprüfte Dokumente verhindern eine Genehmigung. Die Buchhaltung erfasst außerdem monatliche Überstunden und lädt den privaten Lohnzettel jeder Person hoch. Beschäftigte können nur ihre eigenen privaten Unterlagen sehen. Eigentümer und Administratoren erhalten eine schreibgeschützte Übersicht.

Die Anwendung speichert die Unterlagen, führt aber keine Lohnberechnung durch.

## Feiertage und Betriebsurlaub

Gesetzliche österreichische Feiertage werden automatisch berechnet und als geschlossene, leere Spalten dargestellt. An diesen Tagen sind keine Einteilungen möglich.

Eigentümer und Administratoren können unter Einstellungen einen Zeitraum als **Betriebsurlaub** anlegen. Die betroffenen Tage erscheinen geschlossen. Der darunterliegende Plan bleibt gespeichert und erscheint wieder, wenn der Betriebsurlaub entfernt wird.

## Teilen, Drucken, Export und Änderungshistorie

- **Wochenplan teilen** verwendet auf dem Smartphone das Teilen-Menü und bietet einen WhatsApp-kompatiblen Ersatzweg.
- **A4 drucken** erzeugt den gesamten Plan im Querformat mit weißem Hintergrund und schwarzer Schrift.
- Unter Einstellungen können der ausgewählte Wochenplan und die Mitarbeiterliste als CSV exportiert werden.
- Der Eigentümer kann die geschützte Änderungshistorie ansehen und die Daten eines Jahres als CSV exportieren. Ältere Audit-Einträge werden automatisch entfernt.

## Benutzerkonten verwalten

Nur der Eigentümer verwaltet Benutzerkonten. Er kann Rollen ändern, ein Konto mit einem Mitarbeiterdatensatz verbinden, den Zugriff sperren, eine offene Einladung löschen oder ein bestehendes Benutzerkonto löschen. Danach kann dieselbe E-Mail-Adresse erneut eingeladen werden.

Benutzerkonto und Mitarbeiterdatensatz sind getrennt. Das Löschen eines Benutzerkontos erhält Mitarbeiterdaten, Planhistorie, Anträge und Dokumente. Das separate Löschen eines Mitarbeiterdatensatzes ist endgültig und entfernt dessen Einteilungen.

## Stand der Bereitstellung

Die aktuelle Version ist für einen kontrollierten Pilotbetrieb in einem einzelnen Unternehmen vorgesehen. Geschützte Seiten, rollenbasierte Datenbankregeln, privater Dokumentenspeicher, Änderungshistorie, Planungsregeln, automatische Tests und automatische Bereitstellung sind vorhanden.

Vor dem normalen Betrieb mit echten Beschäftigtendaten sind noch die produktive E-Mail-Zustellung, die endgültige Domain und die Auth-Weiterleitungsadressen, ein getestetes Sicherungs- und Wiederherstellungsverfahren, Datenschutz- und Aufbewahrungsinformationen, eine Support-Zuständigkeit sowie ein angemeldeter Test auf den verwendeten Smartphones und Computern erforderlich. Der Supabase-Schutz gegen bekannte kompromittierte Passwörter benötigt einen kostenpflichtigen Tarif. Im kostenlosen Tarif bleiben die Mindestlänge von zehn Zeichen und der geschützte Passwortwechsel aktiv.
