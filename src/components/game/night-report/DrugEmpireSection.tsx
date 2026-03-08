import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { DRUG_EMPIRE_IMAGES } from '@/assets/items/index';

interface DrugEmpireSectionProps {
  report: any;
  drugRiskDelay: number;
}

export function DrugEmpireSection({ report, drugRiskDelay }: DrugEmpireSectionProps) {
  if (!report.drugEmpireRiskEvent) return null;

  const riskType = report.drugEmpireRiskEvent.type;
  const isPositive = riskType === 'big_harvest';
  const borderClr = isPositive ? 'border-emerald' : 'border-blood';
  const titleClr = isPositive ? 'text-emerald' : 'text-blood';
  const riskImageMap: Record<string, string> = {
    lab_raid: DRUG_EMPIRE_IMAGES.lab_raid,
    dea_investigation: DRUG_EMPIRE_IMAGES.dea_investigation,
    contaminated_batch: DRUG_EMPIRE_IMAGES.contaminated,
    rival_sabotage: DRUG_EMPIRE_IMAGES.rival_sabotage,
    big_harvest: DRUG_EMPIRE_IMAGES.big_harvest,
  };
  const bannerImg = riskImageMap[riskType];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: drugRiskDelay, type: 'spring', stiffness: 400 }}
      className={`border ${borderClr} rounded-lg overflow-hidden`}
    >
      {bannerImg && (
        <div className="relative h-16 overflow-hidden">
          <img src={bannerImg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
        </div>
      )}
      <div className="p-3 flex items-center gap-2">
        <AlertTriangle size={16} className={`${titleClr} flex-shrink-0`} />
        <div>
          <p className={`text-xs font-bold ${titleClr}`}>
            {report.drugEmpireRiskEvent.title}
          </p>
          <p className="text-[0.6rem] text-muted-foreground">{report.drugEmpireRiskEvent.desc}</p>
        </div>
      </div>
    </motion.div>
  );
}
