import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Fuel, Receipt, DollarSign } from 'lucide-react';

import { fuelService } from '@/services/fuelService';
import { vehicleService } from '@/services/vehicleService';
import { tripService } from '@/services/tripService';
import { usePermission } from '@/hooks/usePermission';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ROLES, EXPENSE_TYPES } from '@/constants/roles';
import { formatCurrency, formatDate } from '@/utils/formatters';

const fuelLogSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  tripId: z.string().optional(),
  liters: z.coerce.number().positive('Must be positive'),
  cost: z.coerce.number().nonnegative('Must be non-negative'),
  fuelStation: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
});

const expenseSchema = z.object({
  vehicleId: z.string().optional(),
  tripId: z.string().optional(),
  expenseType: z.string().min(1, 'Type is required'),
  amount: z.coerce.number().positive('Must be positive'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
});

const today = new Date().toISOString().split('T')[0];

export const FuelExpensesPage = () => {
  const queryClient = useQueryClient();
  const canWrite = usePermission([ROLES.ADMIN, ROLES.FINANCIAL_ANALYST]);

  const fuelForm = useForm({ resolver: zodResolver(fuelLogSchema), defaultValues: { date: today } });
  const expenseForm = useForm({ resolver: zodResolver(expenseSchema), defaultValues: { date: today } });

  const { data: fuelData, isLoading: fuelLoading } = useQuery({
    queryKey: ['fuel-logs'],
    queryFn: () => fuelService.getLogs({ limit: 50 }),
  });
  const fuelLogs = fuelData?.data || [];

  const { data: expenseData, isLoading: expenseLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => fuelService.getExpenses({ limit: 50 }),
  });
  const expenses = expenseData?.data || [];

  const { data: totalsData } = useQuery({
    queryKey: ['expense-totals'],
    queryFn: () => fuelService.getTotals(),
  });
  const totals = totalsData?.data || {};

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles', 'all'],
    queryFn: () => vehicleService.getAll({ limit: 200 }),
  });
  const vehicles = vehiclesData?.data || [];

  const { data: tripsData } = useQuery({
    queryKey: ['trips', 'recent'],
    queryFn: () => tripService.getAll({ limit: 50 }),
  });
  const trips = tripsData?.data || [];

  const createFuelMutation = useMutation({
    mutationFn: (data) => fuelService.createLog(data),
    onSuccess: () => {
      toast.success('Fuel log added');
      queryClient.invalidateQueries(['fuel-logs']);
      queryClient.invalidateQueries(['expense-totals']);
      fuelForm.reset({ date: today });
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to log fuel'),
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data) => fuelService.createExpense(data),
    onSuccess: () => {
      toast.success('Expense added');
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['expense-totals']);
      expenseForm.reset({ date: today });
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to add expense'),
  });

  const fuelColumns = [
    { key: 'vehicle', label: 'Vehicle', render: (r) => r.vehicle?.registrationNo || '—' },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
    { key: 'liters', label: 'Liters', render: (r) => `${Number(r.liters).toFixed(1)} L` },
    { key: 'cost', label: 'Cost', render: (r) => formatCurrency(r.cost) },
    { key: 'fuelStation', label: 'Station', render: (r) => r.fuelStation || '—' },
    { key: 'trip', label: 'Trip', render: (r) => r.trip?.tripNo || '—' },
  ];

  const expenseColumns = [
    { key: 'expenseType', label: 'Type', render: (r) => EXPENSE_TYPES.find(e => e.value === r.expenseType)?.label || r.expenseType },
    { key: 'amount', label: 'Amount', render: (r) => formatCurrency(r.amount) },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
    { key: 'vehicle', label: 'Vehicle', render: (r) => r.vehicle?.registrationNo || '—' },
    { key: 'trip', label: 'Trip', render: (r) => r.trip?.tripNo || '—' },
    { key: 'description', label: 'Description', render: (r) => r.description || '—' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6 max-w-[1600px] mx-auto"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fuel & Expenses</h1>
        <p className="text-muted-foreground">Track fuel consumption and operational expenses</p>
      </div>

      {/* Total Operational Cost Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Fuel Cost', value: totals.totalFuel, icon: Fuel, color: 'text-amber-600' },
          { label: 'Total Other Expenses', value: totals.totalExpenses, icon: Receipt, color: 'text-blue-600' },
          { label: 'Total Operational Cost', value: (parseFloat(totals.totalFuel || 0) + parseFloat(totals.totalExpenses || 0) + parseFloat(totals.totalMaintenance || 0)), icon: DollarSign, color: 'text-green-600', highlight: true },
        ].map(({ label, value, icon: Icon, color, highlight }) => (
          <Card key={label} className={highlight ? 'border-primary/40 bg-primary/5' : ''}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold">{formatCurrency(value || 0)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FUEL LOGS */}
        <div className="space-y-4">
          {canWrite && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Fuel className="h-4 w-4" /> Log Fuel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={fuelForm.handleSubmit((d) => createFuelMutation.mutate(d))} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-sm font-medium mb-1 block">Vehicle</label>
                      <Select onValueChange={(v) => fuelForm.setValue('vehicleId', v)}>
                        <SelectTrigger><SelectValue placeholder="Select vehicle..." /></SelectTrigger>
                        <SelectContent>
                          {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.registrationNo} — {v.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {fuelForm.formState.errors.vehicleId && <p className="text-xs text-destructive mt-0.5">{fuelForm.formState.errors.vehicleId.message}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Liters</label>
                      <Input type="number" step="0.1" {...fuelForm.register('liters')} placeholder="45.5" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Cost (₹)</label>
                      <Input type="number" {...fuelForm.register('cost')} placeholder="3500" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Date</label>
                      <Input type="date" {...fuelForm.register('date')} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Fuel Station</label>
                      <Input {...fuelForm.register('fuelStation')} placeholder="HPCL, NH-48" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium mb-1 block">Link to Trip (optional)</label>
                      <Select onValueChange={(v) => fuelForm.setValue('tripId', v === 'none' ? undefined : v)}>
                        <SelectTrigger><SelectValue placeholder="No trip linked" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No trip</SelectItem>
                          {trips.map(t => <SelectItem key={t.id} value={t.id}>{t.tripNo} — {t.source} → {t.destination}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" disabled={createFuelMutation.isPending} className="w-full">
                    {createFuelMutation.isPending ? 'Logging...' : 'Log Fuel'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader><CardTitle className="text-base">Fuel Log History</CardTitle></CardHeader>
            <CardContent className="p-0">
              <DataTable columns={fuelColumns} data={fuelLogs} isLoading={fuelLoading} emptyMessage="No fuel logs yet." />
            </CardContent>
          </Card>
        </div>

        {/* EXPENSES */}
        <div className="space-y-4">
          {canWrite && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Receipt className="h-4 w-4" /> Add Expense
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={expenseForm.handleSubmit((d) => createExpenseMutation.mutate(d))} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Expense Type</label>
                      <Select onValueChange={(v) => expenseForm.setValue('expenseType', v)}>
                        <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                        <SelectContent>
                          {EXPENSE_TYPES.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {expenseForm.formState.errors.expenseType && <p className="text-xs text-destructive mt-0.5">{expenseForm.formState.errors.expenseType.message}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Amount (₹)</label>
                      <Input type="number" {...expenseForm.register('amount')} placeholder="1500" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Date</label>
                      <Input type="date" {...expenseForm.register('date')} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Vehicle (optional)</label>
                      <Select onValueChange={(v) => expenseForm.setValue('vehicleId', v === 'none' ? undefined : v)}>
                        <SelectTrigger><SelectValue placeholder="No vehicle" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No vehicle</SelectItem>
                          {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.registrationNo}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium mb-1 block">Description (optional)</label>
                      <Input {...expenseForm.register('description')} placeholder="e.g. Toll charges NH-48" />
                    </div>
                  </div>
                  <Button type="submit" disabled={createExpenseMutation.isPending} className="w-full">
                    {createExpenseMutation.isPending ? 'Adding...' : 'Add Expense'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader><CardTitle className="text-base">Expense History</CardTitle></CardHeader>
            <CardContent className="p-0">
              <DataTable columns={expenseColumns} data={expenses} isLoading={expenseLoading} emptyMessage="No expenses yet." />
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};
