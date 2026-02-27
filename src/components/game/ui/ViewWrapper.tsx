import { ReactNode } from 'react';

interface ViewWrapperProps {
  bg: string;
  children: ReactNode;
}

export function ViewWrapper({ bg, children }: ViewWrapperProps) {
  return (
    <div className="relative min-h-[70vh] -mx-3 -mt-2 px-3 lg:px-4 pt-2">
      <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30 pointer-events-none" />
      <div className="relative z-10 lg:max-w-[900px] lg:mx-auto">
        {children}
      </div>
    </div>
  );
}
