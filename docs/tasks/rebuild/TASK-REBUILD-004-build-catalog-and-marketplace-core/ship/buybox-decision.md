# Buy-box decision

For this catalog core, the primary offer is the active, in-stock offer with the lowest decimal USD price. If offers have the same price, the lexically smallest vendor ID wins. The source requires a deterministic category-level rule but does not define a tie-breaker, so this rule is an explicit implementation default. The primary-offer function is isolated so a later task can introduce category-specific pricing policies without moving price or stock onto products.
