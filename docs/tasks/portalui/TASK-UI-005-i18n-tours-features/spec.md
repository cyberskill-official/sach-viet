---
id: TASK-UI-005
title: "i18n default EN, Joyride tours, Features catalog"
template: task@1
type: feature
module: portalui
author: "@cursor"
department: engineering
status: ready_to_review
entered_via: plan
priority: p1
created_at: "2026-08-21T06:00:00Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-UI-004
source_ref:
  - docs/ops/i18n-tours-features-2026-08-21.md
provenance:
  - "plan: i18n_tours_features_a8b6a696"
---

# Task

## Summary

Default locale English, LocaleProvider with `sv_locale`, bilingual catalogs for B2C/auth/portal chrome, React Joyride tours with `008_user_tour_progress` + `/api/account/tours`, and `/features` catalog aligned to interim DECs. <!-- authority: llm-explicit -->

## Scope

### In scope

- i18n infra + dictionaries; tours; Features page; unit/Playwright updates; ops doc; migration 008. <!-- authority: llm-explicit -->

### Out of scope

- URL path prefixes; email template i18n; live PV3/Zalo/tax>0; inventing DEC rates; Production merge without HITL. <!-- authority: llm-explicit -->

## Success Metrics

Primary: EN default storefront; Features shows available vs upcoming per DEC; tours skip/resume without a11y traps; tests green. <!-- authority: llm-explicit -->
