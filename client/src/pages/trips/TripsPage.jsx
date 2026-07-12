import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Plus, Truck, User, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

import { tripService } from '@/services/tripService';
import { vehicleService } from '@/services/vehicleService';
import { driverService } from '@/services/driverService';
import { usePermission } from '@/hooks/usePermission';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ROLES } from '@/constants/roles';
import { formatCurrency, formatDate } from '@/utils/formatters';

const createTripSchema = z.object({
  source: z.string().min(1, 'Source is required'),
  destination: z.string().min(1, 'Destination is required'),
  vehicleId: z.string().min(1, 'Vehicle is required'),
  driverId: z.string().min(1, 'Driver is required'),
  cargoWeightKg: z.coerce.number().positive('Must be positive'),
  plannedDistanceKm: z.coerce.number().positive('Must be positive'),
  revenue: z.coerce.number().nonnegative().optional(),
});

const dispatchSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  driverId: z.string().min(1, 'Driver is required'),
  startOdometer: z.coerce.number().nonnegative('Required'),
});

const completeSchema = z.object({
  endOdometer: z.coerce.number().nonnegative('Required'),
  fuelUsedLiters: z.coerce.number().nonnegative().optional(),
  fuelCost: z.coerce.number().nonnegative().optional(),
  revenue: z.coerce.number().nonnegative().optional(),
});

const cancelSchema = z.object({
  cancelReason: z.string().min(1, 'Reason is required'),
});

const TRIP_STATUSES = ['DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'];

const statusColor = {
  DRAFT: 'border-l-amber-400',
  DISPATCHED: 'border-l-blue-500',
  COMPLETED: 'border-l-green-500',
  CANCELLED: 'border-l-red-500',
};

export const TripsPage = () => {
  const queryClient = useQueryClient();
  const canWrite = usePermission([ROLES.ADMIN, ROLES.DISPATCHER]);

  const [dispatchDialog, setDispatchDialog] = useState(null);
  const [completeDialog, setCompleteDialog] = useState(null);
  const [cancelDialog, setCancelDialog] = useState(null);

  // Fetch all data
  const { data: tripsData, isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: () => tripService.getAll({ limit: 100 }),
  });
  const trips = tripsData?.data || [];

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles', 'available'],
    queryFn: () => vehicleService.getAll({ status: 'AVAILABLE', limit: 100 }),
  });
  const availableVehicles = vehiclesData?.data || [];

  const { data: driversData } = useQuery({
    queryKey: ['drivers', 'available'],
    queryFn: () => driverService.getAll({ status: 'AVAILABLE', limit: 100 }),
  });
  const availableDrivers = driversData?.data || [];

  // Create form
  const createForm = useForm({ resolver: zodResolver(createTripSchema) });
  const selectedVehicleId = createForm.watch('vehicleId');
  const selectedVehicle = availableVehicles.find(v => v.id === selectedVehicleId);
  const cargoWeight = parseFloat(createForm.watch('cargoWeightKg') || 0);
  const capacityExceeded = selectedVehicle && cargoWeight > parseFloat(selectedVehicle.capacityKg);

  // Dispatch form
  const dispatchForm = useForm({ resolver: zodResolver(dispatchSchema) });
  // Complete form
  const completeForm = useForm({ resolver: zodResolver(completeSchema) });
  // Cancel form
  const cancelForm = useForm({ resolver: zodResolver(cancelSchema) });

  const invalidate = () => {
    queryClient.invalidateQueries(['trips']);
    queryClient.invalidateQueries(['vehicles', 'available']);
    queryClient.invalidateQueries(['drivers', 'available']);
  };

  const createMutation = useMutation({
    mutationFn: (data) => tripService.create(data),
    onSuccess: (res) => {
      toast.success(`Trip ${res.data?.tripNo} created`);
      createForm.reset();
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to create trip'),
  });

  const dispatchMutation = useMutation({
    mutationFn: ({ id, ...data }) => tripService.dispatch(id, data),
    onSuccess: () => { toast.success('Trip dispatched!'); setDispatchDialog(null); invalidate(); },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to dispatch'),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, ...data }) => tripService.complete(id, data),
    onSuccess: () => { toast.success('Trip completed!'); setCompleteDialog(null); invalidate(); },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to complete'),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, ...data }) => tripService.cancel(id, data),
    onSuccess: () => { toast.success('Trip cancelled'); setCancelDialog(null); invalidate(); },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to cancel'),
  });

  const tripsByStatus = TRIP_STATUSES.reduce((acc, s) => {
    acc[s] = trips.filter(t => t.status === s);
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6 max-w-[1600px] mx-auto"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trip Dispatcher</h1>
        <p className="text-muted-foreground">Create and manage fleet trips end-to-end</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* LEFT — Create Trip Form */}
        {canWrite && (
          <div className="xl:w-80 shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Create New Trip</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={createForm.handleSubmit((d) => {
                  if (capacityExceeded) return;
                  createMutation.mutate(d);
                })} className="space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Source</label>
                    <Input {...createForm.register('source')} placeholder="Mumbai" />
                    {createForm.formState.errors.source && <p className="text-xs text-destructive mt-0.5">{createForm.formState.errors.source.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Destination</label>
                    <Input {...createForm.register('destination')} placeholder="Pune" />
                    {createForm.formState.errors.destination && <p className="text-xs text-destructive mt-0.5">{createForm.formState.errors.destination.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Vehicle (Available only)</label>
                    <Select onValueChange={(v) => createForm.setValue('vehicleId', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVehicles.map(v => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.registrationNo} — {v.name} ({v.capacityKg} kg)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {createForm.formState.errors.vehicleId && <p className="text-xs text-destructive mt-0.5">{createForm.formState.errors.vehicleId.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Driver (Available only)</label>
                    <Select onValueChange={(v) => createForm.setValue('driverId', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select driver..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDrivers.map(d => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name} ({d.category})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {createForm.formState.errors.driverId && <p className="text-xs text-destructive mt-0.5">{createForm.formState.errors.driverId.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Cargo (kg)</label>
                      <Input type="number" {...createForm.register('cargoWeightKg')} placeholder="500" />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Distance (km)</label>
                      <Input type="number" {...createForm.register('plannedDistanceKm')} placeholder="200" />
                    </div>
                  </div>
                  {capacityExceeded && (
                    <div className="flex items-center gap-2 text-xs text-destructive font-medium p-2 bg-destructive/10 rounded">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Capacity exceeded by {(cargoWeight - parseFloat(selectedVehicle.capacityKg)).toFixed(0)} kg — dispatch blocked
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium mb-1 block">Expected Revenue (₹)</label>
                    <Input type="number" {...createForm.register('revenue')} placeholder="0" />
                  </div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending || capacityExceeded}>
                    {createMutation.isPending ? 'Creating...' : 'Create Trip'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* RIGHT — Trip Kanban Board */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {TRIP_STATUSES.map((status) => (
              <div key={status} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{status}</h3>
                  <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-medium">
                    {tripsByStatus[status].length}
                  </span>
                </div>
                <div className="space-y-2 min-h-[120px]">
                  {isLoading ? (
                    <div className="h-20 bg-muted rounded-lg animate-pulse" />
                  ) : tripsByStatus[status].length === 0 ? (
                    <div className="h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">No trips</p>
                    </div>
                  ) : (
                    tripsByStatus[status].map((trip) => (
                      <motion.div
                        key={trip.id}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`bg-card border border-border border-l-4 ${statusColor[trip.status]} rounded-lg p-3 space-y-2 shadow-sm`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-xs font-mono font-bold text-primary">{trip.tripNo}</span>
                          <StatusBadge status={trip.status} />
                        </div>
                        <div className="flex items-center gap-1 text-xs text-foreground font-medium">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {trip.source} → {trip.destination}
                        </div>
                        {trip.vehicle && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Truck className="h-3 w-3" />{trip.vehicle.registrationNo}
                          </div>
                        )}
                        {trip.driver && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />{trip.driver.name}
                          </div>
                        )}
                        {/* Actions */}
                        {canWrite && trip.status === 'DRAFT' && (
                          <div className="flex gap-1 pt-1">
                            <Button size="sm" className="h-7 text-xs flex-1" onClick={() => {
                              setDispatchDialog(trip);
                              dispatchForm.reset({
                                vehicleId: trip.vehicleId || '',
                                driverId: trip.driverId || '',
                                startOdometer: '',
                              });
                            }}>
                              <CheckCircle className="h-3 w-3 mr-1" /> Dispatch
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => {
                              setCancelDialog(trip);
                              cancelForm.reset();
                            }}>
                              <XCircle className="h-3 w-3 mr-1" /> Cancel
                            </Button>
                          </div>
                        )}
                        {canWrite && trip.status === 'DISPATCHED' && (
                          <div className="flex gap-1 pt-1">
                            <Button size="sm" className="h-7 text-xs flex-1 bg-green-600 hover:bg-green-700" onClick={() => {
                              setCompleteDialog(trip);
                              completeForm.reset({ endOdometer: '', fuelUsedLiters: '', revenue: trip.revenue || '' });
                            }}>
                              <CheckCircle className="h-3 w-3 mr-1" /> Complete
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => {
                              setCancelDialog(trip);
                              cancelForm.reset();
                            }}>
                              <XCircle className="h-3 w-3 mr-1" /> Cancel
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dispatch Dialog */}
      <Dialog open={!!dispatchDialog} onOpenChange={(o) => !o && setDispatchDialog(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Dispatch Trip {dispatchDialog?.tripNo}</DialogTitle>
          </DialogHeader>
          <form onSubmit={dispatchForm.handleSubmit((d) => dispatchMutation.mutate({ id: dispatchDialog.id, ...d }))} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Vehicle</label>
              <Select
                defaultValue={dispatchDialog?.vehicleId || ''}
                onValueChange={(v) => dispatchForm.setValue('vehicleId', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle..." />
                </SelectTrigger>
                <SelectContent>
                  {availableVehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.registrationNo} — {v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {dispatchForm.formState.errors.vehicleId && <p className="text-xs text-destructive mt-1">{dispatchForm.formState.errors.vehicleId.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Driver</label>
              <Select
                defaultValue={dispatchDialog?.driverId || ''}
                onValueChange={(v) => dispatchForm.setValue('driverId', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select driver..." />
                </SelectTrigger>
                <SelectContent>
                  {availableDrivers.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {dispatchForm.formState.errors.driverId && <p className="text-xs text-destructive mt-1">{dispatchForm.formState.errors.driverId.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Start Odometer (km)</label>
              <Input type="number" {...dispatchForm.register('startOdometer')} placeholder="e.g. 45000" />
              {dispatchForm.formState.errors.startOdometer && <p className="text-xs text-destructive mt-1">{dispatchForm.formState.errors.startOdometer.message}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDispatchDialog(null)}>Cancel</Button>
              <Button type="submit" disabled={dispatchMutation.isPending}>
                {dispatchMutation.isPending ? 'Dispatching...' : 'Dispatch'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={!!completeDialog} onOpenChange={(o) => !o && setCompleteDialog(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Complete Trip {completeDialog?.tripNo}</DialogTitle>
          </DialogHeader>
          <form onSubmit={completeForm.handleSubmit((d) => completeMutation.mutate({ id: completeDialog.id, ...d }))} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">End Odometer (km)</label>
              <Input type="number" {...completeForm.register('endOdometer')} placeholder="e.g. 45250" />
              {completeForm.formState.errors.endOdometer && <p className="text-xs text-destructive mt-1">{completeForm.formState.errors.endOdometer.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Fuel Used (L)</label>
                <Input type="number" step="0.1" {...completeForm.register('fuelUsedLiters')} placeholder="0" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Fuel Cost (₹)</label>
                <Input type="number" {...completeForm.register('fuelCost')} placeholder="0" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Actual Revenue (₹)</label>
              <Input type="number" {...completeForm.register('revenue')} placeholder="0" />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setCompleteDialog(null)}>Cancel</Button>
              <Button type="submit" disabled={completeMutation.isPending} className="bg-green-600 hover:bg-green-700">
                {completeMutation.isPending ? 'Completing...' : 'Mark Complete'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelDialog} onOpenChange={(o) => !o && setCancelDialog(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Cancel Trip {cancelDialog?.tripNo}</DialogTitle>
          </DialogHeader>
          <form onSubmit={cancelForm.handleSubmit((d) => cancelMutation.mutate({ id: cancelDialog.id, ...d }))} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Reason for Cancellation</label>
              <Input {...cancelForm.register('cancelReason')} placeholder="e.g. Vehicle went to shop" />
              {cancelForm.formState.errors.cancelReason && <p className="text-xs text-destructive mt-1">{cancelForm.formState.errors.cancelReason.message}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setCancelDialog(null)}>Back</Button>
              <Button type="submit" variant="destructive" disabled={cancelMutation.isPending}>
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Trip'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
