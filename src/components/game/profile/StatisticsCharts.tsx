import { useGame } from '@/contexts/GameContext';
import { SectionHeader } from '../ui/SectionHeader';
import { BarChart3, TrendingUp, Swords, Dices } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';

export function StatisticsCharts() {
  const { state } = useGame();
  const stats = state.stats;

  // Income sources pie chart. The non-casino slice was labelled "Handel", but it is
  // everything: klussen, rackets, the fence and the market.
  const incomePie = [
    { name: 'Werk & rackets', value: Math.max(0, stats.totalEarned - stats.casinoWon), color: 'hsl(var(--emerald))' },
    { name: 'Casino', value: stats.casinoWon, color: 'hsl(var(--gold))' },
  ].filter(d => d.value > 0);

  // Spending pie chart
  const spendPie = [
    { name: 'Uitgaven', value: stats.totalSpent, color: 'hsl(var(--blood))' },
    { name: 'Casino Verlies', value: stats.casinoLost, color: 'hsl(var(--game-purple))' },
  ].filter(d => d.value > 0);

  // Missions are retired, so the old "Missie Succes" ring and "Gevechtsrecord" pie were
  // permanently 0/0. What the player actually does is finish klussen and answer
  // incidents, so those are the two numbers now.
  const jobs = stats.jobsCompleted || 0;
  const incidents = stats.incidentsFought || 0;
  const doneTotal = jobs + incidents;

  // Income history bar chart
  const incomeHistory = state.incomeHistory || [];
  const recentHistory = incomeHistory.slice(-14).map((val, i) => ({
    day: `D${state.day - incomeHistory.length + i + incomeHistory.length - 13}`,
    income: val,
  }));

  const doneData = [
    { name: 'Klussen', value: jobs, fill: 'hsl(var(--emerald))' },
    { name: 'Incidenten', value: incidents, fill: 'hsl(var(--blood))' },
  ];

  return (
    <>
      <SectionHeader title="Statistieken Dashboard" icon={<BarChart3 size={12} />} />

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="game-card text-center p-2">
          <div className="text-lg font-bold text-gold">{stats.daysPlayed}</div>
          <div className="text-[0.45rem] text-muted-foreground uppercase">Dagen</div>
        </div>
        <div className="game-card text-center p-2">
          <div className="text-lg font-bold text-emerald">{jobs}</div>
          <div className="text-[0.45rem] text-muted-foreground uppercase">Klussen</div>
        </div>
        <div className="game-card text-center p-2">
          <div className="text-lg font-bold text-ice">{stats.tradesCompleted}</div>
          <div className="text-[0.45rem] text-muted-foreground uppercase">Trades</div>
        </div>
      </div>

      {/* Income vs Spending */}
      <div className="game-card mb-4">
        <h4 className="text-[0.6rem] font-bold text-gold uppercase tracking-wider mb-2 flex items-center gap-1">
          <TrendingUp size={10} /> Inkomen vs Uitgaven
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[0.45rem] text-muted-foreground uppercase">Inkomsten</span>
            {incomePie.length > 0 ? (
              <ResponsiveContainer width="100%" height={80}>
                <PieChart>
                  <Pie data={incomePie} dataKey="value" cx="50%" cy="50%" innerRadius={15} outerRadius={30} strokeWidth={0}>
                    {incomePie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '4px', fontSize: '0.55rem' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-20 flex items-center justify-center text-[0.5rem] text-muted-foreground">Geen data</div>}
          </div>
          <div>
            <span className="text-[0.45rem] text-muted-foreground uppercase">Uitgaven</span>
            {spendPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={80}>
                <PieChart>
                  <Pie data={spendPie} dataKey="value" cx="50%" cy="50%" innerRadius={15} outerRadius={30} strokeWidth={0}>
                    {spendPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '4px', fontSize: '0.55rem' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-20 flex items-center justify-center text-[0.5rem] text-muted-foreground">Geen data</div>}
          </div>
        </div>
        <div className="flex gap-3 text-[0.45rem] mt-1 justify-center">
          {incomePie.map(d => (
            <span key={d.name} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
              {d.name}: €{d.value.toLocaleString()}
            </span>
          ))}
        </div>
      </div>

      {/* Income History */}
      {recentHistory.length > 2 && (
        <div className="game-card mb-4">
          <h4 className="text-[0.6rem] font-bold text-gold uppercase tracking-wider mb-2 flex items-center gap-1">
            <BarChart3 size={10} /> Dagelijks Inkomen (14d)
          </h4>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={recentHistory}>
              <XAxis dataKey="day" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={35} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
              <Bar dataKey="income" fill="hsl(var(--emerald))" radius={[2, 2, 0, 0]} />
              <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '4px', fontSize: '0.55rem' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* What you have actually done */}
      <div className="game-card mb-4">
        <h4 className="text-[0.6rem] font-bold text-gold uppercase tracking-wider mb-2 flex items-center gap-1">
          <Swords size={10} /> Op je naam
        </h4>
        {doneTotal > 0 ? (
          <div className="flex items-center gap-3">
            <ResponsiveContainer width={80} height={80}>
              <PieChart>
                <Pie data={doneData} dataKey="value" cx="50%" cy="50%" innerRadius={20} outerRadius={35} strokeWidth={0}>
                  {doneData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-[0.55rem]">
                <span className="text-emerald font-bold">Klussen afgerond</span>
                <span className="font-bold">{jobs}</span>
              </div>
              <div className="flex justify-between text-[0.55rem]">
                <span className="text-blood font-bold">Incidenten aangepakt</span>
                <span className="font-bold">{incidents}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[0.5rem] text-muted-foreground text-center py-3">Nog niks op je naam. Draai een klus.</p>
        )}
      </div>
    </>
  );
}
