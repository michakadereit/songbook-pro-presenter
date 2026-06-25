# TICKET-003 — View-Umschalter (App-Shell)

> Plan: [SlideView](./README.md) · Spec ACs: AC6, AC7

## Ziel

Ein Umschalter in der App-Shell, der zwischen Slide- und Eagle-Ansicht wechselt — mit
denselben geladenen Songdaten, ohne Reload, und mit sauberem Aufräumen der alten View.

## Abhängigkeiten

TICKET-001 (`mountSlideView` inkl. Dispose). EagleView existiert bereits.

## Deliverables

- `src/main.ts` umbauen zur kleinen View-Shell:
  - Hält den geladenen `SongSet` in einer Variable.
  - Ein Umschalt-Control (z.B. zwei Buttons/Tabs „Slide" | „Eagle"), sichtbar sobald ein
    Set geladen ist; markiert die aktive View.
  - `showView(mode)`:
    - räumt die aktuelle View auf (Slide: gespeicherte `dispose()` aufrufen; Eagle:
      Container leeren),
    - mountet die gewählte View in den `#songs`-Container,
    - merkt sich den aktuellen Modus + (bei Slide) die Dispose-Funktion.
  - Standard-View nach dem Laden: **Slide**.
- Falls nötig: `mountEagleView` Aufruf bleibt unverändert (gibt void zurück); nur die Shell
  kümmert sich ums Aufräumen (Container leeren).
- Optional kleines CSS für die Tab-Leiste (bestehende Tokens).

## Acceptance Criteria

- AC6: Mit geladenem Set wechselt Klick auf „Eagle" zur Eagle-Ansicht (`.eagle-grid` im
  DOM) und „Slide" zurück zur Slide-Ansicht (genau eine Slide) — gleiche Songdaten, ohne
  erneutes Parsen/Laden.
- AC7: Nach Wechsel Slide→Eagle verändert `ArrowRight` (keydown) die Eagle-Ansicht NICHT
  (der Slide-Keyboard-Listener wurde via Dispose entfernt).
- Tests: entweder in `src/main`-naher Testdatei oder als integrativer Test, der die Shell-
  Logik prüft (Set laden simulieren → showView('eagle') → `.eagle-grid` da; showView('slide')
  → genau eine Slide; nach Wechsel kein aktiver Slide-Listener). Mindestens AC6/AC7 abdecken.
  Falls die Shell-Verdrahtung schwer isoliert testbar ist, eine kleine reine `createAppShell`-
  Funktion extrahieren und diese testen.
- Browser-Verifikation: Umschalten funktioniert sichtbar ohne Reload.

## Out of Scope

- Persistenz des gewählten Modus über Reloads.
- Gemeinsamer globaler Transpose/Suche über beide Views (spätere Vereinheitlichung).
