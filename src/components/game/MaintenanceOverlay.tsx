import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';

interface MaintenanceOverlayProps {
  message?: string | null;
}

export function MaintenanceOverlay({ message }: MaintenanceOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm flex items-center justify-center"
    >
      <div className="text-center px-6 max-w-md">
        <motion.div
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-block mb-4"
        >
          <Wrench size={48} className="text-gold" />
        </motion.div>
        <h2 className="text-xl font-black text-foreground mb-2 uppercase tracking-wider">
          Onderhoudsmodus
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {message || 'Het spel is tijdelijk offline voor onderhoud. We zijn zo snel mogelijk terug!'}
        </p>
        <motion.div
          className="flex items-center justify-center gap-1.5"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-gold" />
          <div className="w-1.5 h-1.5 rounded-full bg-gold" />
          <div className="w-1.5 h-1.5 rounded-full bg-gold" />
        </motion.div>
      </div>
    </motion.div>
  );
}
