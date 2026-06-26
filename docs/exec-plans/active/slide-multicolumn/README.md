# Exec Plan: Slide Two-Column Layout

**Spec:** `docs/specs/slide-multicolumn/spec.md`
**Branch:** `feat/slide-multicolumn`
**Recommended model:** Sonnet (CSS multi-column + JS-Toggle)

## Ziel

Die Slide-View erhält ein optionales Zwei-Spalten-Layout: Wenn der Song-Inhalt die
Viewport-Höhe überschreitet, fließt er in eine zweite Spalte rechts weiter. Ein Toggle-Button
in der Controls-Leiste schaltet das Layout um; der Zustand wird in `localStorage` persistiert.

## Ticket-Übersicht

| Ticket | Beschreibung | Abhängigkeit | Status |
|---|---|---|---|
| TICKET-001 | CSS Zwei-Spalten-Layout + Toggle-Button in SlideView | — | TODO |
| TICKET-002 | localStorage-Persistenz des Column-Toggle-Zustands | TICKET-001 | TODO |

## Parallelisierung

Streng sequenziell: TICKET-001 → TICKET-002.

**Empfehlung:** Beide Tickets mit Sonnet im Vordergrund. TICKET-002 ist minimal (Haiku möglich).

## Hinweis zur Reihenfolge mit global-controls

Dieser Plan und `global-controls` teilen sich `SlideView.ts` und `styles/main.css`.
Empfohlene Reihenfolge: **global-controls zuerst fertigstellen**, dann slide-multicolumn
auf dem aktuellen `main` branchen — so gibt es keine Merge-Konflikte.

## Definition of Done

- [ ] TICKET-001 DONE
- [ ] TICKET-002 DONE
- [ ] `npm test` grün
- [ ] `npx tsc --noEmit` sauber
- [ ] Browser-Verifikation: langer Song fließt zweispaltig; Toggle bleibt beim Blättern erhalten; nach Reload ist der Zustand wiederhergestellt
- [ ] Merge nach `main`, Branch gelöscht
