# CDS lock — Sách Việt · Thủy · ocean

**Task:** `TASK-UI-003` (Wave 0 CDS platform chrome).

Sách Việt consumes `@cyberskill/design` with:

- `data-cs-element="thuy"`
- `data-cs-variant="ocean"`

on the root `<html>` in `app/web/src/app/layout.tsx`.

`app/web/src/app/globals.css` is a Tailwind token bridge only (`--background` / `--foreground` / accent aliases → `--cs-*`). Do not redefine elemental accent colors there.

Auth and forbidden pages (`/login`, `/register`, `/forgot`, `/reset`, `/forbidden`) use CDS primitives (`.cs-surface-*`, `.cs-button`, `.cs-field__*`, `.cs-alert`, `.cs-eyebrow`) so first-run chrome matches storefront and `portal-shell.tsx`.

Ocean tokens ship in `@cyberskill/design` ≥ 1.0.0 (`tokens/elements.css`). No package bump was required for Wave 0. Prefer registering this product row in the design package `docs/products.md` when that repo is next updated; until then this note is the in-repo lock.
