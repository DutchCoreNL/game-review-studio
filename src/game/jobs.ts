// Local jobs system — a legit day-job for steady income + a perk. Fully client-side.

export interface JobDef {
  id: string;
  name: string;
  salary: number;
  reqLevel: number;
  reqStat?: { stat: 'muscle' | 'brains' | 'charm'; value: number };
}

export interface PlayerJobState {
  currentJob: string;
  daysWorked: number;
  promotion: number; // derived: floor(daysWorked / 10)
  lastWorkedDay: number; // game day the player last worked (0 = never)
}

// Kept in sync with the JOBS list shown in JobsView.tsx (salary/reqs are the source of truth
// for pay and gating).
export const JOBS: JobDef[] = [
  { id: 'barman', name: 'Barman', salary: 1500, reqLevel: 1 },
  { id: 'taxichauffeur', name: 'Taxichauffeur', salary: 2500, reqLevel: 2 },
  { id: 'beveiliger', name: 'Beveiliger', salary: 4000, reqLevel: 4, reqStat: { stat: 'muscle', value: 5 } },
  { id: 'monteur', name: 'Automonteur', salary: 5000, reqLevel: 5, reqStat: { stat: 'brains', value: 4 } },
  { id: 'boekhouder', name: 'Boekhouder', salary: 7000, reqLevel: 7, reqStat: { stat: 'brains', value: 8 } },
  { id: 'advocaat', name: 'Advocaat', salary: 10000, reqLevel: 10, reqStat: { stat: 'brains', value: 12 } },
  { id: 'arts', name: 'Arts', salary: 12000, reqLevel: 12, reqStat: { stat: 'brains', value: 15 } },
  { id: 'makelaar', name: 'Vastgoedmakelaar', salary: 15000, reqLevel: 15, reqStat: { stat: 'charm', value: 12 } },
];

export function getJobDef(id: string | null | undefined): JobDef | undefined {
  return id ? JOBS.find(j => j.id === id) : undefined;
}

/** Salary scaled by promotion level (+20% per promotion). */
export function getJobSalary(job: JobDef, promotion: number): number {
  return Math.floor(job.salary * (1 + promotion * 0.2));
}
