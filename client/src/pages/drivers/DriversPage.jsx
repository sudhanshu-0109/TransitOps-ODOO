import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Plus, Shield, AlertTriangle, UserCheck, UserX, Clock } from 'lucide-react';

import { driverService } from '@/services/driverService';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import DataTable from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DRIVER_CATEGORIES, ROLES } from '@/constants/roles';
import { formatDate } from '@/utils/formatters';

const driverSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  licenseNo: z.string().min(1, 'License number is required'),
  category: z.enum(['LMV', 'HMV'], { required_error: 'Category is required' }),
  licenseExpiry: z.string().min(1, 'License expiry is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  safetyScore: z.coerce.number().min(0).max(100).optional(),
});

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available', icon: UserCheck },
  { value: 'OFF_DUTY', label: 'Off Duty', icon: Clock },
  { value: 'SUSPENDED', label: 'Suspended', icon: UserX },
];

export const DriversPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canWrite = usePermission([ROLES.ADMIN, ROLES.SAFETY_OFFICER]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [statusDialog, setStatusDialog] = useState(null);

  const debouncedSearch = useDebounce(search, 400);
  const { page, limit, setPage, totalPages } = usePagination({ total: 0, initialLimit: 10 });

  const { data, isLoading } = useQuery({
    queryKey: ['drivers', { page, limit, search: debouncedSearch, status: statusFilter }],
    queryFn: () => driverService.getAll({ page, limit, search: debouncedSearch, status: statusFilter || undefined }),
    keepPreviousData: true,
  });

  const drivers = data?.data || [];
  const total = data?.total || 0;

  const form = useForm({ resolver: zodResolver(driverSchema) });

  const createMutation = useMutation({
    mutationFn: (data) => editingDriver ? driverService.update(editingDriver.id, data) : driverService.create(data),
    onSuccess: () => {
      toast.success(editingDriver ? 'Driver updated successfully' : 'Driver added successfully');
      queryClient.invalidateQueries(['drivers']);
      setDialogOpen(false);
      setEditingDriver(null);
      form.reset();
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to save driver'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => driverService.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Driver status updated');
      queryClient.invalidateQueries(['drivers']);
      setStatusDialog(null);
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to update status'),
  });

  const openAdd = () => {
    form.reset({ name: '', licenseNo: '', category: '', licenseExpiry: '', phone: '', email: '', safetyScore: 100 });
    setEditingDriver(null);
    setDialogOpen(true);
  };

  const openEdit = (driver) => {
    form.reset({
      name: driver.name,
      licenseNo: driver.licenseNo,
      category: driver.category,
      licenseExpiry: driver.licenseExpiry?.split('T')[0] || '',
      phone: driver.phone,
      email: driver.email || '',
      safetyScore: driver.safetyScore,
    });
    setEditingDriver(driver);
    setDialogOpen(true);
  };

  const isExpired = (expiry) => expiry && new Date(expiry) < new Date();

  const columns = [
    {
      key: 'name',
      label: 'Driver',
      render: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.phone}</p>
        </div>
      ),
    },
    { key: 'licenseNo', label: 'License No' },
    { key: 'category', label: 'Category' },
    {
      key: 'licenseExpiry',
      label: 'Expiry',
      render: (row) => (
        <span className={isExpired(row.licenseExpiry) ? 'text-destructive font-semibold flex items-center gap-1' : ''}>
          {isExpired(row.licenseExpiry) && <AlertTriangle className="h-3 w-3" />}
          {formatDate(row.licenseExpiry)}
        </span>
      ),
    },
    {
      key: 'safetyScore',
      label: 'Safety Score',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${row.safetyScore}%`,
                background: row.safetyScore >= 80 ? '#2E7D5B' : row.safetyScore >= 50 ? '#E8A33D' : '#B3261E',
              }}
            />
          </div>
          <span className="text-sm font-medium">{row.safetyScore}</span>
        </div>
      ),
    },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          {canWrite && (
            <>
              <Button size="sm" variant="outline" onClick={() => openEdit(row)}>Edit</Button>
              <Select
                value={row.status}
                onValueChange={(status) => setStatusDialog({ id: row.id, status, name: row.name })}
                disabled={row.status === 'ON_TRIP'}
              >
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <h1 className="text-2xl font-bold tracking-tight">Drivers & Safety</h1>
          <p className="text-muted-foreground">Manage driver profiles, licenses, and safety records</p>
        </div>
        {canWrite && (
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Add Driver
          </Button>
        )}
      </div>

      {/* Warning Banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
        <Shield className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
        <span className="text-destructive font-medium">
          Drivers with an expired license or Suspended status cannot be assigned to trips.
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search by name or license..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="ON_TRIP">On Trip</SelectItem>
            <SelectItem value="OFF_DUTY">Off Duty</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={drivers}
            isLoading={isLoading}
            emptyMessage="No drivers found. Add your first driver to get started."
            page={page}
            totalPages={Math.max(1, Math.ceil(total / limit))}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingDriver(null); form.reset(); } }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">Full Name</label>
                <Input {...form.register('name')} placeholder="e.g. Ramesh Kumar" />
                {form.formState.errors.name && <p className="text-xs text-destructive mt-1">{form.formState.errors.name.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">License No</label>
                <Input {...form.register('licenseNo')} placeholder="DL-XXXXXXXXXX" />
                {form.formState.errors.licenseNo && <p className="text-xs text-destructive mt-1">{form.formState.errors.licenseNo.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <Select onValueChange={(v) => form.setValue('category', v)} defaultValue={form.watch('category')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DRIVER_CATEGORIES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.category && <p className="text-xs text-destructive mt-1">{form.formState.errors.category.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">License Expiry</label>
                <Input type="date" {...form.register('licenseExpiry')} />
                {form.formState.errors.licenseExpiry && <p className="text-xs text-destructive mt-1">{form.formState.errors.licenseExpiry.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Phone</label>
                <Input {...form.register('phone')} placeholder="+91 9876543210" />
                {form.formState.errors.phone && <p className="text-xs text-destructive mt-1">{form.formState.errors.phone.message}</p>}
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">Email (optional)</label>
                <Input type="email" {...form.register('email')} placeholder="driver@example.com" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Safety Score (0–100)</label>
                <Input type="number" min="0" max="100" {...form.register('safetyScore')} placeholder="100" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : editingDriver ? 'Update Driver' : 'Add Driver'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Status Confirmation Dialog */}
      <Dialog open={!!statusDialog} onOpenChange={() => setStatusDialog(null)}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Change Driver Status</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Set <strong>{statusDialog?.name}</strong> status to{' '}
            <strong>{statusDialog?.status}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog(null)}>Cancel</Button>
            <Button
              onClick={() => statusMutation.mutate({ id: statusDialog.id, status: statusDialog.status })}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending ? 'Updating...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
