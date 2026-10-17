export default function Footer() {
  return (
    <footer className="border-t border-[var(--qs-border)] py-4 px-6">
      <div className="flex items-center justify-between text-xs text-[var(--qs-text-muted)]">
        <span>
          Built with{" "}
          <span className="text-[var(--qs-accent)]">♦</span>{" "}
          QuerySense © {new Date().getFullYear()}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--qs-success)]" />
          All systems operational
        </span>
      </div>
    </footer>
  );
}
