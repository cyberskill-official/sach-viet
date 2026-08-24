export function DataTable({
  labels,
  rows,
}: {
  labels: { empty: string; previous: string; next: string };
  rows: Array<{ id: string; label: string }>;
}) {
  return (
    <section className="mt-6">
      <div className="sv-glass-card overflow-hidden rounded-2xl">
        {rows.length ? (
          <ul>
            {rows.map((row) => (
              <li className="border-b border-border/60 px-4 py-3 last:border-0" key={row.id}>
                {row.label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-8 text-sm text-muted">{labels.empty}</p>
        )}
      </div>
      <div className="mt-3 flex justify-between gap-3 text-sm text-muted">
        <button type="button" className="cs-button cs-button--ghost min-h-11">
          {labels.previous}
        </button>
        <button type="button" className="cs-button cs-button--ghost min-h-11">
          {labels.next}
        </button>
      </div>
    </section>
  );
}
