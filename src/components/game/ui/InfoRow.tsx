interface InfoRowProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  valueClass?: string;
}

export function InfoRow({ label, value, icon, valueClass }: InfoRowProps) {
  return (
    <div className="flex justify-between items-center text-xs bg-muted/50 rounded px-2.5 py-1.5">
      <span className="text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className={`font-bold ${valueClass || 'text-foreground'}`}>{value}</span>
    </div>
  );
}
