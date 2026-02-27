import { ReactNode } from 'react';

export interface SubTab<T extends string = string> {
  id: T;
  label: string;
  icon?: ReactNode;
  badge?: number | boolean;
}

interface SubTabBarProps {
  tabs: SubTab<string>[];
  active: string;
  onChange: (id: string) => void;
}

export function SubTabBar({ tabs, active, onChange }: SubTabBarProps) {
  return (
    <div className="flex gap-1.5 mb-4 mt-1 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative flex-shrink-0 py-2 px-3 rounded text-[0.55rem] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
            active === tab.id
              ? 'bg-gold/15 border border-gold text-gold'
              : 'bg-muted border border-border text-muted-foreground'
          }`}
        >
          {tab.icon} {tab.label}
          {/* Numeric badge */}
          {typeof tab.badge === 'number' && tab.badge > 0 && active !== tab.id && (
            <span className="w-4 h-4 bg-blood text-primary-foreground rounded-full text-[0.4rem] font-bold flex items-center justify-center ml-0.5">
              {tab.badge}
            </span>
          )}
          {/* Boolean dot badge */}
          {tab.badge === true && active !== tab.id && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gold rounded-full animate-pulse" />
          )}
        </button>
      ))}
    </div>
  );
}
