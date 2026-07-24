# Implementation plan

1. Add admin-managed payout and payout-item persistence with explicit USD amounts.
2. Enforce vendor or administrator access for incoming order reads, payout history, and dashboard summary.
3. Reject foreign order items and duplicate payout-item links without inventing settlement formulas.
4. Add signed-session routes, tests, and a source verifier.
