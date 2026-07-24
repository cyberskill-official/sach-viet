# Implementation plan

1. Add shared locale catalogs and lookup helpers for Vietnamese and English.
2. Add theme validation and a small client-side theme provider that writes one documented preference key.
3. Add portal metadata, accent colors, navigation, and server-side access checks that call the Task 2 session helpers.
4. Add a shared portal shell and generic portal route group without business data or workflows.
5. Add shared data-table primitives with localized labels and empty state.
6. Add theme tokens and reduced-motion CSS.
7. Extend static verification and Node tests, then run all configured gates.
