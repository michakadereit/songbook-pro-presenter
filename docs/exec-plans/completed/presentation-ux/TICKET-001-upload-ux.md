# TICKET-001 — Upload-UX (zentriert → versteckt)

> Plan: [Presentation-UX](./README.md) · Spec ACs: AC1, AC2

## Ziel

Vor dem Laden stehen die beiden Upload-Eingänge zentriert im Viewport; nach erfolgreichem
Laden eines Sets verschwinden sie.

## Abhängigkeiten

Keine. Erstes Ticket.

## Deliverables

- `src/main.ts`: die beiden Eingänge (`.sbp` + OnSong-Ordner) in einen Container
  `.uploader` (oder bestehende `.dropzone` umbauen) packen, der per CSS horizontal +
  vertikal im Viewport zentriert ist (solange kein Set geladen).
- Nach erfolgreichem `loadSet(...)`: dem Wurzel/Body eine Klasse setzen (z.B.
  `document.body.classList.add('has-set')` oder `app.dataset.loaded = 'true'`), die den
  Upload-Container via CSS ausblendet (`display: none`) und den View-Bereich freigibt.
- `styles/main.css`: Zentrierung (z.B. `.uploader { min-height: 100dvh; display: grid;
  place-items: center; }`) und Ausblend-Regel (`.has-set .uploader { display: none; }`).
- Fehlerfall (Parse-Fehler) lässt den Uploader sichtbar (kein `has-set`); Statusmeldung
  weiterhin sichtbar.

## Acceptance Criteria

- AC1: Vor dem Laden ist ein `.uploader` mit beiden Eingängen vorhanden und (per CSS)
  zentriert; kein View gemountet.
- AC2: Nach erfolgreichem Laden trägt die Wurzel die „geladen"-Markierung, sodass der
  Uploader ausgeblendet ist (computed `display:none` bzw. Markerklasse gesetzt) und der
  View-Container befüllt ist.
- Test: jsdom-Test, der den geladenen Zustand simuliert (z.B. die Hilfsfunktion, die die
  Markerklasse setzt) und prüft, dass die Markierung gesetzt wird. CSS-Zentrierung wird im
  Browser verifiziert.
- Bestehende Tests grün, `tsc` sauber.

## Out of Scope

- Theme/Vollbild (TICKET-002). „Set wechseln" ohne Reload.
