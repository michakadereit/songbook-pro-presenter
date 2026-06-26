# Exec Plan: Global Controls (Suche + Transpose)

**Spec:** `docs/specs/global-controls/spec.md`
**Branch:** `feat/global-controls`
**Recommended model:** Sonnet (API-Refactoring + State-Wiring)

## Ziel

Suchfeld und Transpose-Regler aus SlideView und EagleView herauslösen und in den
ViewSwitcher heben. Nach Abschluss dieses Plans halten beide Views keine eigenen
Controls mehr für Suche/Transpose; der Zustand wird global synchron gehalten.

## Ticket-Übersicht

| Ticket | Beschreibung | Abhängigkeit | Status |
|---|---|---|---|
| TICKET-001 | Global Controls DOM + CSS im ViewSwitcher | — | TODO |
| TICKET-002 | EagleView: interne Controls entfernen, externes State-API | TICKET-001 | TODO |
| TICKET-003 | SlideView: Suche entfernen, Transpose-Support + externes State-API | TICKET-001 | TODO |
| TICKET-004 | ViewSwitcher: globale Controls mit Views verdrahten | TICKET-002, TICKET-003 | TODO |

## Parallelisierung

```
TICKET-001
    ├── TICKET-002 (EagleView)
    └── TICKET-003 (SlideView)   ← können parallel laufen, teilen sich main.css
                                    → sicherheitshalber sequenziell (CSS-Konflikte)
         └── TICKET-004 (Wire)
```

Empfehlung: **001 → 002 → 003 → 004** (sequenziell, alle Sonnet im Vordergrund).

## Definition of Done

- [ ] TICKET-001 DONE
- [ ] TICKET-002 DONE
- [ ] TICKET-003 DONE
- [ ] TICKET-004 DONE
- [ ] `npm test` grün (kein neuer failing Test)
- [ ] `npx tsc --noEmit` sauber
- [ ] Browser-Verifikation: Suche und Transpose bleiben beim View-Wechsel erhalten
- [ ] Merge nach `main`, Branch gelöscht
