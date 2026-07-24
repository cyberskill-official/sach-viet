# Implementation plan

1. Add employee dashboard reads derived from existing order, support, goods-request, and pending vendor-application rows.
2. Persist homepage `home_sections` with employee or administrator write access.
3. Add retail order-queue reads for `employee_b2c` and `admin` without customer secrets.
4. Wire signed-session routes, tests, and a source verifier.
