import { useDashboard } from '@/hooks/useDashboard';
import KpiCard from '@/components/KpiCard';
import { Truck, Map, Users, Wrench, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const VEHICLE_STATUS_COLORS = {
  AVAILABLE: '#2E7D5B',
  ON_TRIP: '#E8A33D',
  IN_SHOP: '#3B82F6',
  RETIRED: '#8A8A85',
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-2 shadow-lg text-xs">
      <p className="font-medium">{payload[0].name}: {payload[0].value}</p>
    </div>
  );
};

export const DashboardPage = () => {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 max-w-[1600px] mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64" /><Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const { kpis, recentTrips = [], upcomingMaintenance = [], expiringLicenses = [] } = data || {};

  // Prepare vehicle status chart data
  const vehicleStatusData = [
    { name: 'Available', value: kpis?.availableVehicles || 0 },
    { name: 'On Trip', value: kpis?.activeTrips || 0 },
    { name: 'In Shop', value: kpis?.vehiclesInMaintenance || 0 },
  ].filter(d => d.value > 0);

  const vehicleStatusColors = ['#2E7D5B', '#E8A33D', '#3B82F6'];

  // Prepare trip status chart data
  const tripStatusData = [
    { name: 'Active', value: kpis?.activeTrips || 0, fill: '#E8A33D' },
    { name: 'Pending', value: kpis?.pendingTrips || 0, fill: '#3B82F6' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6 max-w-[1600px] mx-auto"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Fleet operations overview</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard title="Active Vehicles" value={kpis?.activeVehicles ?? '—'} icon={Truck} delay={0} />
        <KpiCard title="Available" value={kpis?.availableVehicles ?? '—'} icon={CheckCircle2} delay={0.05} />
        <KpiCard title="In Maintenance" value={kpis?.vehiclesInMaintenance ?? '—'} icon={Wrench} delay={0.1} />
        <KpiCard title="Active Trips" value={kpis?.activeTrips ?? '—'} icon={Map} delay={0.15} />
        <KpiCard title="Pending Trips" value={kpis?.pendingTrips ?? '—'} icon={Clock} delay={0.2} />
        <KpiCard title="Fleet Utilization" value={`${kpis?.fleetUtilization ?? 0}%`} icon={Users} delay={0.25} />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Vehicle Status Donut */}
        <Card>
          <CardHeader><CardTitle className="text-base">Vehicle Status Distribution</CardTitle></CardHeader>
          <CardContent>
            {vehicleStatusData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No vehicle data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={vehicleStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {vehicleStatusData.map((_, i) => (
                      <Cell key={i} fill={vehicleStatusColors[i]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(val) => <span className="text-xs">{val}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Trips Overview Bar */}
        <Card>
          <CardHeader><CardTitle className="text-base">Active vs Pending Trips</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tripStatusData} barSize={48}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {tripStatusData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Trips */}
        <Card className="lg:col-span-4">
          <CardHeader><CardTitle className="text-base">Recent Trips</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTrips.length === 0 ? (
                <p className="text-sm text-muted-foreground">No trips yet.</p>
              ) : recentTrips.map((trip) => (
                <div key={trip.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                  <div className="space-y-0.5">
                    <span className="font-mono text-sm font-bold text-primary">{trip.tripNo}</span>
                    <p className="text-sm font-medium">{trip.source} → {trip.destination}</p>
                    <p className="text-xs text-muted-foreground">
                      {trip.vehicle?.registrationNo || 'No vehicle'} · {trip.driver?.name || 'No driver'}
                    </p>
                  </div>
                  <StatusBadge status={trip.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="lg:col-span-3 space-y-4">
          {/* Upcoming Maintenance */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wrench className="h-4 w-4" /> Upcoming Maintenance</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingMaintenance.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active maintenance.</p>
                ) : upcomingMaintenance.map((m) => (
                  <div key={m.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{m.vehicle?.registrationNo}</p>
                      <p className="text-xs text-muted-foreground">{m.title}</p>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{formatDate(m.startDate)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Expiring Licenses */}
          <Card className="border-l-4 border-l-destructive">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" /> Expiring Licenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expiringLicenses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No licenses expiring in 30 days.</p>
                ) : expiringLicenses.map((d) => (
                  <div key={d.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.licenseNo}</p>
                    </div>
                    <span className="text-xs font-medium text-destructive">{formatDate(d.licenseExpiry)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};
