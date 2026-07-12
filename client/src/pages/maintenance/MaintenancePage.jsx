import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Wrench, Plus, CheckCircle, Info } from 'lucide-react';

import { maintenanceService } from '@/services/maintenanceService';
import { vehicleService } from '@/services/vehicleService';
import { usePermission } from '@/hooks/usePermission';
import DataTable from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ROLES, MAINTENANCE_TYPES } from '@/constants/roles';
import { formatCurrency, formatDate } from '@/utils/formatters';

const maintenanceSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  title: z.string().min(1, 'Title is required'),
  type: z.string().min(1, 'Service type is required'),
  cost: z.coerce.number().nonnegative('Cost must be non-negative'),
  startDate: z.string().min(1, 'Start date is required'),
  technician: z.string().optional(),
  notes: z.string().optional(),
});

export const MaintenancePage = () => {
  const queryClient = useQueryClient();
  const canWrite = usePermission([ROLES.ADMIN, ROLES.FLEET_MANAGER]);
  const [statusFilter, setStatusFilter] = useState('');
  const [closeDialog, setCloseDialog] = useState(null);

  const form = useForm({ resolver: zodResolver(maintenanceSchema) });

  const { data: maintenanceData, isLoading } = useQuery({
    queryKey: ['maintenance', statusFilter],
    queryFn: () => maintenanceService.getAll({ status: statusFilter || undefined, limit: 100 }),
  });
  const records = maintenanceData?.data || [];

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles', 'for-maintenance'],
    queryFn: () => vehicleService.getAll({ limit: 200 }),
  });
  // Only non-retired vehicles can have maintenance
  const vehicles = (vehiclesData?.data || []).filter(v => v.status !== 'RETIRED');

  const createMutation = useMutation({
    mutationFn: (data) => maintenanceService.create(data),
    onSuccess: () => {
      toast.success('Maintenance record created — vehicle moved to IN_SHOP');
      queryClient.invalidateQueries(['maintenance']);
      queryClient.invalidateQueries(['vehicles']);
      form.reset();
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to create record'),
  });

  const closeMutation = useMutation({
    mutationFn: (id) => maintenanceService.close(id),
    onSuccess: () => {
      toast.success('Maintenance closed — vehicle is now AVAILABLE');
      queryClient.invalidateQueries(['maintenance']);
      queryClient.invalidateQueries(['vehicles']);
      setCloseDialog(null);
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to close record'),
  });

  const columns = [
    {
      key: 'vehicle',
      label: 'Vehicle',
      render: (row) => (
        <div>
          <p className="font-medium">{row.vehicle?.registrationNo}</p>
          <p className="text-xs text-muted-foreground">{row.vehicle?.name}</p>
        </div>
      ),
    },
    { key: 'title', label: 'Title' },
    { key: 'type', label: 'Service Type' },
    { key: 'cost', label: 'Cost', render: (row) => formatCurrency(row.cost) },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'startDate', label: 'Start Date', render: (row) => formatDate(row.startDate) },
    { key: 'endDate', label: 'Closed Date', render: (row) => row.endDate ? formatDate(row.endDate) : '—' },
    { key: 'technician', label: 'Technician', render: (row) => row.technician || '—' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => canWrite && row.status === 'ACTIVE' ? (
        <Button size="sm" variant="outline" onClick={() => setCloseDialog(row)} className="gap-1">
          <CheckCircle className="h-3.5 w-3.5 text-green-600" /> Close
        </Button>
      ) : null,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6 max-w-[1600px] mx-auto"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
        <p className="text-muted-foreground">Log and manage vehicle service records</p>
      </div>

      {/* State Callout */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20 text-sm">
        <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <span className="text-foreground">
          Creating an <strong>Active</strong> maintenance record sets the vehicle to <strong>IN_SHOP</strong>.
          Closing a record (when not retired) restores it to <strong>AVAILABLE</strong>.
        </span>
      </div>

      {/* Log Service Record Form */}
      {canWrite && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="h-4 w-4" /> Log Service Record
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Vehicle</label>
                <Select onValueChange={(v) => form.setValue('vehicleId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.registrationNo} — {v.name} ({v.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.vehicleId && <p className="text-xs text-destructive mt-1">{form.formState.errors.vehicleId.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Title</label>
                <Input {...form.register('title')} placeholder="e.g. Major Service Q2" />
                {form.formState.errors.title && <p className="text-xs text-destructive mt-1">{form.formState.errors.title.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Service Type</label>
                <Select onValueChange={(v) => form.setValue('type', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MAINTENANCE_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.type && <p className="text-xs text-destructive mt-1">{form.formState.errors.type.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Cost (₹)</label>
                <Input type="number" {...form.register('cost')} placeholder="5000" />
                {form.formState.errors.cost && <p className="text-xs text-destructive mt-1">{form.formState.errors.cost.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Start Date</label>
                <Input type="date" {...form.register('startDate')} />
                {form.formState.errors.startDate && <p className="text-xs text-destructive mt-1">{form.formState.errors.startDate.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Technician (optional)</label>
                <Input {...form.register('technician')} placeholder="Tech name or workshop" />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="text-sm font-medium mb-1 block">Notes (optional)</label>
                <Input {...form.register('notes')} placeholder="Additional notes..." />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={createMutation.isPending} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {createMutation.isPending ? 'Creating...' : 'Log Service Record'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Service Log Table */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Service Log</h2>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Card>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={records}
              isLoading={isLoading}
              emptyMessage="No maintenance records yet."
            />
          </CardContent>
        </Card>
      </div>

      {/* Close Confirmation Dialog */}
      <Dialog open={!!closeDialog} onOpenChange={() => setCloseDialog(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Close Maintenance Record</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Close maintenance for <strong>{closeDialog?.vehicle?.registrationNo}</strong>?
            The vehicle will be restored to <strong>AVAILABLE</strong>.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialog(null)}>Cancel</Button>
            <Button onClick={() => closeMutation.mutate(closeDialog.id)} disabled={closeMutation.isPending} className="bg-green-600 hover:bg-green-700">
              {closeMutation.isPending ? 'Closing...' : 'Close Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
