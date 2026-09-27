export default function BudgetsPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-border bg-surface py-20 text-center">
      <p className="text-lg font-medium">Budgets are coming in the next phase</p>
      <p className="max-w-sm text-sm text-muted">
        Monthly category budgets with progress bars and 75% / 90% / exceeded warnings will land here next, built on
        top of the same transactions data you're already recording.
      </p>
    </div>
  );
}
