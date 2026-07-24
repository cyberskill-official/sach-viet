# Code review

## Clause check

- Employee dashboard from existing records → `getEmployeeDashboard`
- Home-config persistence → `home_sections` + `upsertHomeSection` / `listHomeSections`
- Retail order queue for `employee_b2c`/`admin` → `listRetailOrders`
- Signed-session route wiring → employee/retail routes use `readSession` and server-side repository calls
- No fulfillment / returns / refund / settlement invented → out-of-scope enforced by API surface and read-only retail orders
- Safe events → home-section events omit secrets

## Verdict

Pass. Ready for review acceptance under session operator pre-approval.
