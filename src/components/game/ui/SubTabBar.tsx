import { ReactNode, useRef, useEffect, useState, useCallback } from 'react';

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, [checkScroll]);

  // Auto-scroll active tab into view
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeBtn = el.querySelector(`[data-tab-id="${active}"]`) as HTMLElement | null;
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [active]);

  return (
    <div className="relative mb-4 mt-1">
      {/* Left fade */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      )}
      {/* Right fade */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      )}

      <div ref={scrollRef} className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex-shrink-0 py-2 px-3 rounded text-[0.55rem] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
              active === tab.id
                ? 'bg-gold/15 border border-gold text-gold'
                : 'bg-muted border border-border text-muted-foreground'
            }`}
          >
            {tab.icon} {tab.label}
            {typeof tab.badge === 'number' && tab.badge > 0 && active !== tab.id && (
              <span className="w-4 h-4 bg-blood text-primary-foreground rounded-full text-[0.4rem] font-bold flex items-center justify-center ml-0.5">
                {tab.badge}
              </span>
            )}
            {tab.badge === true && active !== tab.id && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gold rounded-full animate-pulse" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
