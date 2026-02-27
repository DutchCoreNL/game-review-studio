interface BackButtonProps {
  onClick: () => void;
  label?: string;
}

export function BackButton({ onClick, label = 'TERUG NAAR KAART' }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full mt-3 py-2 rounded text-xs font-semibold bg-muted border border-border text-muted-foreground hover:border-gold/40 transition-colors"
    >
      ← {label}
    </button>
  );
}
