---
id: TASK-PORTALUI-001
title: "Adopt CyberSkill Design with the Thủy identity"
template: task@1
type: feature
module: portalui
author: "@cursor"
department: engineering
status: done
priority: p0
created_at: "2026-07-25T02:51:00+07:00"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
target_release: ""
client_visible: false
depends_on:
  - TASK-REBUILD-003
source_ref:
  - operator request: "adapt @cyberskill/design for UI, with variant Thuỷ"
  - "@cyberskill/design@1.0.0 README.md"
  - "@cyberskill/design@1.0.0 docs/consuming.md"
  - "@cyberskill/design@1.0.0 tokens/elements.css"
provenance:
  - "registry discovery: npm view @cyberskill/design on 2026-07-25"
  - "operator_resolution: use the published package and Thủy default river identity"
---

# Task

## Summary

Install the published `@cyberskill/design@1.0.0` package, load its portable stylesheet globally, and make SachViet resolve the design system's light/dark theme and Thủy product identity without duplicating package tokens. <!-- authority: human-confirmed -->

## Problem

The shared web shell currently uses local zinc-style Tailwind tokens and treats glass as a theme, while the requested design system defines independent Theme × Element × Language axes and fixes liquid glass as the surface treatment. The UI cannot expand consistently until those contracts are reconciled. <!-- authority: llm-explicit -->

## Proposed Solution

Pin `@cyberskill/design@1.0.0`, import `@cyberskill/design/styles.css` before project overrides, set `data-cs-element="thuy"` on the root document, and preserve light/dark preference with a system-aware option. Use the default Thủy `river` variant by omitting `data-cs-variant`; package docs identify `river` as the default and `ocean`/`mist` as optional variants. Compose project UI with stable `.cs-*` classes and `--cs-*` role tokens rather than importing the package's browser-only ESM entry into server-rendered modules. <!-- authority: llm-explicit -->

## Alternatives Considered

Vendor a guessed local design package. Rejected because the official package is publicly installable and the operator explicitly required it. <!-- authority: human-confirmed -->

Import the ESM component entry throughout server components. Rejected because the published entry accesses `document`, side-loads a browser bundle, and can load React 18 from a CDN while this application runs React 19; CSS/classes are the package's documented static and production-compatible contract. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - every rendered route inherits the published Thủy role tokens and design-system typography/surface styles before this task reaches `done`. <!-- authority: human-confirmed -->

Guardrail - light and dark remain selectable and persisted, unknown preferences recover to light, focus visibility and reduced-motion behavior remain intact, and no project code redefines the elemental palette. <!-- authority: llm-explicit -->

## Scope

This task owns only the shared visual foundation needed by every subsequent portal screen. <!-- authority: llm-explicit -->

### In scope

- Pin and configure `@cyberskill/design@1.0.0`. <!-- authority: human-confirmed -->
- Apply `data-cs-element="thuy"` globally with default `river`, `lang`, and `data-theme`. <!-- authority: llm-explicit -->
- Replace shared shell zinc styling with design-system tokens/classes and bilingual labels. <!-- authority: human-confirmed -->
- Add source-level tests for root axes, package pinning, and valid theme normalization. <!-- authority: llm-explicit -->

### Out of scope

- Re-publishing, modifying, or redistributing the UNLICENSED design-system package. <!-- authority: llm-explicit -->
- Creating a fourth styling axis or a custom SachViet elemental palette. <!-- authority: llm-explicit -->
- Storefront and admin business workflows, which are owned by later portal UI tasks. <!-- authority: human-confirmed -->

## Dependencies

TASK-REBUILD-003 supplies the shared layout, theme provider, localization helpers, and portal shell. The npm registry and the published package supply the official styles and Thủy tokens. <!-- authority: llm-explicit -->

## AI Authorship Disclosure

- **Tools used:** Cursor inspected the registry package, README, consuming guide, exports, and elemental token source. <!-- authority: llm-explicit -->
- **Scope:** The task adopts documented package contracts and does not invent a local package API. <!-- authority: llm-explicit -->
- **Human review:** The operator selected `@cyberskill/design` and the Thủy identity and pre-approved routine lifecycle gates for this run. <!-- authority: human-confirmed -->
