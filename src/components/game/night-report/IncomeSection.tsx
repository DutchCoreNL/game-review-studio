import { TrendingUp, Factory, Sparkles, Crosshair, Leaf, Diamond, FlaskConical, Truck, Gem } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedReportRow } from './AnimatedReportRow';
import { AMMO_TYPE_LABELS } from '@/game/constants';

interface IncomeSectionProps {
  report: any;
  delays: {
    district: number;
    business: number;
    washed: number;
    lab: number;
    ammoFactory: number;
    villaWiet: number;
    villaCoke: number;
    villaLab: number;
    drugDealer: number;
    drugNox: number;
  };
}

export function IncomeSection({ report, delays }: IncomeSectionProps) {
  return (
    <>
      {report.districtIncome > 0 && (
        <AnimatedReportRow icon={<TrendingUp size={14} />} label="District Inkomen" value={report.districtIncome} prefix="€" positive color="text-emerald" delay={delays.district} />
      )}
      {report.businessIncome > 0 && (
        <AnimatedReportRow icon={<Factory size={14} />} label="Bedrijf Inkomen" value={report.businessIncome} prefix="€" positive color="text-emerald" delay={delays.business} />
      )}
      {report.totalWashed > 0 && (
        <AnimatedReportRow icon={<Sparkles size={14} />} label="Witgewassen" value={report.totalWashed} prefix="€" color="text-gold" delay={delays.washed} />
      )}
      {report.labYield > 0 && (
        <AnimatedReportRow icon={<Factory size={14} />} label="Lab Productie" value={report.labYield} prefix="" suffix=" Synthetica" positive color="text-game-purple" delay={delays.lab} />
      )}

      {report.ammoFactoryProduction && report.ammoFactoryProduction > 0 && (
        <AnimatedReportRow icon={<Crosshair size={14} />} label={`Kogelfabriek (${report.ammoFactoryType ? AMMO_TYPE_LABELS[report.ammoFactoryType]?.label : 'kogels'})`} value={report.ammoFactoryProduction} prefix="+" suffix={` ${report.ammoFactoryType ? AMMO_TYPE_LABELS[report.ammoFactoryType]?.label : 'kogels'}`} positive color="text-blood" delay={delays.ammoFactory} />
      )}

      {report.villaWietProduced && report.villaWietProduced > 0 && (
        <AnimatedReportRow icon={<Leaf size={14} />} label="Wietplantage" value={report.villaWietProduced} prefix="+" suffix=" drugs" positive color="text-emerald" delay={delays.villaWiet} />
      )}
      {report.villaCokeProduced && report.villaCokeProduced > 0 && (
        <AnimatedReportRow icon={<Diamond size={14} />} label="Coke Lab" value={report.villaCokeProduced} prefix="+" suffix=" Puur Wit" positive color="text-game-purple" delay={delays.villaCoke} />
      )}
      {report.villaLabProduced && report.villaLabProduced > 0 && (
        <AnimatedReportRow icon={<FlaskConical size={14} />} label="Villa Lab" value={report.villaLabProduced} prefix="+" suffix=" Synthetica" positive color="text-blood" delay={delays.villaLab} />
      )}

      {/* Crafting output */}
      {report.craftingOutput && report.craftingOutput.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delays.villaLab + 0.15, duration: 0.35 }}
          className="border border-game-purple/30 rounded-lg p-3 bg-[hsl(var(--game-purple)/0.06)]"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <FlaskConical size={14} className="text-game-purple" />
            <span className="text-xs font-bold text-game-purple uppercase tracking-wider">Crafting Productie</span>
          </div>
          <div className="space-y-1">
            {report.craftingOutput.map((craft: any, i: number) => (
              <div key={i} className="flex justify-between text-[0.6rem]">
                <span className="text-muted-foreground">{craft.icon} {craft.recipeName}</span>
                <span className="text-game-purple font-bold">+{craft.outputAmount} {craft.outputGood} (≈€{craft.estimatedValue.toLocaleString()})</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {report.drugEmpireDealerIncome && report.drugEmpireDealerIncome > 0 && (
        <AnimatedReportRow icon={<Truck size={14} />} label="Dealer Netwerk" value={report.drugEmpireDealerIncome} prefix="€" positive color="text-emerald" delay={delays.drugDealer} />
      )}
      {report.drugEmpireNoxCrystal && report.drugEmpireNoxCrystal > 0 && (
        <AnimatedReportRow icon={<Gem size={14} />} label="NoxCrystal Geproduceerd" value={report.drugEmpireNoxCrystal} prefix="+" suffix=" kristallen" positive color="text-game-purple" delay={delays.drugNox} />
      )}
    </>
  );
}
