import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Plus, Search, Eye, Pencil, Archive } from 'lucide-react';

import { vehicleService } from '@/services/vehicleService';
import { usePermission } from '@/hooks/usePermission';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import DataTable from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDistance } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ROLES, VEHICLE_TYPES } from '@/constants/roles';

const vehicleSchema = z.object({
  registrationNo: z.string().min(1, 'Registration number is required'),
  name: z.string().min(1, 'Name is required'),
  model: z.string().min(1, 'Model is required'),
  type: z.string().min(1, 'Type is required'),
  capacityKg: z.coerce.number().positive('Must be positive'),
  acquisitionCost: z.coerce.number().nonnegative('Must be non-negative'),
  odometer: z.coerce.number().nonnegative().optional(),
});

export const FleetPage = () => {
  const queryClient = useQueryClient();
  const canEdit = usePermission([ROLES.ADMIN, ROLES.FLEET_MANAGER]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [viewVehicle, setViewVehicle] = useState(null);
  const [retireDialog, setRetireDialog] = useState(null);

  const debouncedSearch = useDebounce(search, 400);
  const { page, limit, setPage } = usePagination({ initialLimit: 10 });

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', { page, limit, search: debouncedSearch, status: statusFilter }],
    queryFn: () => vehicleService.getAll({ page, limit, search: debouncedSearch, status: statusFilter || undefined }),
    keepPreviousData: true,
  });

  const vehicles = data?.data || [];
  const total = data?.pagination?.total || data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const form = useForm({ resolver: zodResolver(vehicleSchema) });

  const saveMutation = useMutation({
    mutationFn: (d) => editingVehicle ? vehicleService.update(editingVehicle.id, d) : vehicleService.create(d),
    onSuccess: () => {
      toast.success(editingVehicle ? 'Vehicle updated' : 'Vehicle added');
      queryClient.invalidateQueries(['vehicles']);
      setDialogOpen(false);
      setEditingVehicle(null);
      form.reset();
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to save vehicle'),
  });

  const retireMutation = useMutation({
    mutationFn: (id) => vehicleService.retire(id),
    onSuccess: () => {
      toast.success('Vehicle retired');
      queryClient.invalidateQueries(['vehicles']);
      setRetireDialog(null);
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Cannot retire vehicle'),
  });

  const openAdd = () => {
    form.reset({ registrationNo: '', name: '', model: '', type: '', capacityKg: '', acquisitionCost: '', odometer: 0 });
    setEditingVehicle(null);
    setDialogOpen(true);
  };

  const openEdit = (v) => {
    form.reset({
      registrationNo: v.registrationNo,
      name: v.name,
      model: v.model,
      type: v.type,
      capacityKg: Number(v.capacityKg),
      acquisitionCost: Number(v.acquisitionCost),
      odometer: Number(v.odometer),
    });
    setEditingVehicle(v);
    setDialogOpen(true);
  };

  const columns = [
    { key: 'registrationNo', label: 'Reg. No', render: (r) => <span className="font-mono font-semibold">{r.registrationNo}</span> },
    {
      key: 'name', label: 'Name / Model',
      render: (r) => <div><p className="font-medium">{r.name}</p><p className="text-xs text-muted-foreground">{r.model}</p></div>,
    },
    { key: 'type', label: 'Type', render: (r) => <span className="capitalize">{r.type}</span> },
    { key: 'capacityKg', label: 'Capacity', render: (r) => `${Number(r.capacityKg).toLocaleString()} kg` },
    { key: 'odometer', label: 'Odometer', render: (r) => formatDistance(r.odometer) },
    { key: 'acquisitionCost', label: 'Acq. Cost', render: (r) => formatCurrency(r.acquisitionCost) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', label: '',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => setViewVehicle(r)} title="View details">
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {canEdit && (
            <>
              <Button variant="ghost" size="sm" onClick={() => openEdit(r)} title="Edit" disabled={r.status === 'RETIRED'}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {r.status !== 'RETIRED' && (
                <Button variant="ghost" size="sm" onClick={() => setRetireDialog(r)} title="Retire" className="text-destructive hover:text-destructive">
                  <Archive className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )}
        </div>
      ),
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fleet Management</h1>
          <p className="text-muted-foreground">Manage vehicles, track status, and monitor utilization.</p>
        </div>
        {canEdit && (
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Add Vehicle
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reg. no or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="ON_TRIP">On Trip</SelectItem>
            <SelectItem value="IN_SHOP">In Shop</SelectItem>
            <SelectItem value="RETIRED">Retired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={vehicles}
            isLoading={isLoading}
            emptyMessage="No vehicles found. Add your first vehicle to get started."
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditingVehicle(null); form.reset(); } }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">Registration Number</label>
                <Input {...form.register('registrationNo')} placeholder="MH-01-AB-1234" disabled={!!editingVehicle} />
                {form.formState.errors.registrationNo && <p className="text-xs text-destructive mt-1">{form.formState.errors.registrationNo.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Vehicle Name / Callsign</label>
                <Input {...form.register('name')} placeholder="Thunder 01" />
                {form.formState.errors.name && <p className="text-xs text-destructive mt-1">{form.formState.errors.name.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Model</label>
                <Input {...form.register('model')} placeholder="Tata Ace" />
                {form.formState.errors.model && <p className="text-xs text-destructive mt-1">{form.formState.errors.model.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Type</label>
                <Select onValueChange={(v) => form.setValue('type', v)} defaultValue={form.watch('type')}>
                  <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.type && <p className="text-xs text-destructive mt-1">{form.formState.errors.type.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Capacity (kg)</label>
                <Input type="number" {...form.register('capacityKg')} placeholder="1000" />
                {form.formState.errors.capacityKg && <p className="text-xs text-destructive mt-1">{form.formState.errors.capacityKg.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Acquisition Cost (₹)</label>
                <Input type="number" {...form.register('acquisitionCost')} placeholder="1500000" />
                {form.formState.errors.acquisitionCost && <p className="text-xs text-destructive mt-1">{form.formState.errors.acquisitionCost.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Current Odometer (km)</label>
                <Input type="number" {...form.register('odometer')} placeholder="0" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewVehicle} onOpenChange={() => setViewVehicle(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Vehicle Details</DialogTitle>
          </DialogHeader>
          {viewVehicle && (
            <div className="space-y-3 text-sm">
              {[
                ['Registration No', viewVehicle.registrationNo],
                ['Name', viewVehicle.name],
                ['Model', viewVehicle.model],
                ['Type', viewVehicle.type],
                ['Capacity', `${Number(viewVehicle.capacityKg).toLocaleString()} kg`],
                ['Odometer', formatDistance(viewVehicle.odometer)],
                ['Acquisition Cost', formatCurrency(viewVehicle.acquisitionCost)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={viewVehicle.status} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewVehicle(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Retire Confirmation */}
      <Dialog open={!!retireDialog} onOpenChange={() => setRetireDialog(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader><DialogTitle>Retire Vehicle</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Permanently retire <strong>{retireDialog?.registrationNo}</strong>? This action cannot be undone.
            The vehicle will be removed from the active fleet.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRetireDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => retireMutation.mutate(retireDialog.id)} disabled={retireMutation.isPending}>
              {retireMutation.isPending ? 'Retiring...' : 'Retire Vehicle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
