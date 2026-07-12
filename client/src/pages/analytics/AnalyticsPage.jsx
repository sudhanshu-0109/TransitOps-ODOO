import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Activity, DollarSign, Target, Download } from 'lucide-react';
import { toast } from 'sonner';

import { analyticsService } from '@/services/analyticsService';
import KpiCard from '@/components/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/formatters';

const CHART_COLORS = ['#E8A33D', '#2E7D5B', '#B3261E', '#3B82F6', '#8B5CF6'];

const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export const AnalyticsPage = () => {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => analyticsService.get(),
    staleTime: 2 * 60 * 1000,
  });

  const analytics = analyticsData?.data || {};

  const handleExportCSV = async () => {
    try {
      const blob = await analyticsService.exportCSV();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transitops-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported successfully');
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  const kpis = [
    {
      title: 'Fuel Efficiency',
      value: analytics.fuelEfficiency ? `${Number(analytics.fuelEfficiency).toFixed(1)} km/l` : '—',
      subtitle: 'Average across completed trips',
      icon: Activity,
      delay: 0,
    },
    {
      title: 'Fleet Utilization',
      value: analytics.fleetUtilization ? `${Number(analytics.fleetUtilization).toFixed(1)}%` : '—',
      subtitle: 'Vehicles currently ON_TRIP',
      icon: Target,
      delay: 0.1,
    },
    {
      title: 'Operational Cost',
      value: formatCurrency(analytics.totalOperationalCost || 0),
      subtitle: 'Fuel + Maintenance + Expenses',
      icon: DollarSign,
      delay: 0.2,
    },
    {
      title: 'Average ROI',
      value: analytics.avgRoi ? `${Number(analytics.avgRoi).toFixed(1)}%` : '—',
      subtitle: '(Revenue − Cost) / Acquisition',
      icon: TrendingUp,
      delay: 0.3,
    },
  ];

  const monthlyRevenue = analytics.monthlyRevenue || [];
  const costliest = analytics.costliestVehicles || [];
  const maintenanceByMonth = analytics.maintenanceByMonth || [];
  const expenseBreakdown = analytics.expenseBreakdown || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6 max-w-[1600px] mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Fleet performance insights and financial overview</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
          : kpis.map(({ title, value, subtitle, icon, delay }) => (
              <KpiCard key={title} title={title} value={value} subtitle={subtitle} icon={icon} delay={delay} />
            ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Revenue (₹)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-52" /> : monthlyRevenue.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">No revenue data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={monthlyRevenue}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip formatter={(v) => formatCurrency(v)} />} />
                  <Bar dataKey="revenue" fill="#E8A33D" radius={[4, 4, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Costliest Vehicles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Costliest Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-52" /> : costliest.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">No cost data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={costliest} layout="vertical">
                  <XAxis type="number" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="registrationNo" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip content={<CustomTooltip formatter={(v) => formatCurrency(v)} />} />
                  <Bar dataKey="totalCost" fill="#B3261E" radius={[0, 4, 4, 0]} name="Total Cost" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Maintenance Frequency */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Maintenance Events by Month</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-52" /> : maintenanceByMonth.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">No maintenance data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={maintenanceByMonth}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="count" stroke="#2E7D5B" strokeWidth={2} dot={{ r: 4, fill: '#2E7D5B' }} name="Events" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expense Breakdown by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-52" /> : expenseBreakdown.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">No expense data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={expenseBreakdown} dataKey="total" nameKey="expenseType" cx="50%" cy="50%" outerRadius={80} label={({ expenseType, percent }) => `${expenseType} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {expenseBreakdown.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip formatter={(v) => formatCurrency(v)} />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Formula Footnote */}
      <Card className="border-muted bg-muted/30">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground font-mono">
            <strong>Formulas:</strong>{' '}
            Fuel Efficiency = actualDistanceKm / fuelUsedLiters &nbsp;|&nbsp;
            Fleet Utilization = ON_TRIP vehicles / total active vehicles &nbsp;|&nbsp;
            ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};
