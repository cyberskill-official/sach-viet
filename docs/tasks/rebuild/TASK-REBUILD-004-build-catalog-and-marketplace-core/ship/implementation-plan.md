# Implementation plan

1. Add a SQLite catalog repository for categories, products, media, variants, and vendor offers.
2. Keep product facts separate from offer price, list price, and stock in the schema and write validation.
3. Implement a category-level primary-offer function that selects active, in-stock offers by lowest decimal USD price and then stable vendor ID.
4. Add public catalog read routes and a session-protected vendor offer write route that uses the Task 2 ownership helper.
5. Extend Node tests and static verification, then run all configured gates.
