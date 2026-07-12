import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Shield, Check, Minus } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const RBAC_MATRIX = [
  { module: 'Dashboard',      admin: 'full', fleet: 'full', dispatch: 'full', safety: 'view', analyst: 'view' },
  { module: 'Fleet (Vehicles)', admin: 'full', fleet: 'full', dispatch: 'view', safety: '—',    analyst: 'view' },
  { module: 'Drivers',        admin: 'full', fleet: '—',    dispatch: 'view', safety: 'full', analyst: '—'   },
  { module: 'Trips',          admin: 'full', fleet: '—',    dispatch: 'full', safety: '—',    analyst: 'view' },
  { module: 'Maintenance',    admin: 'full', fleet: 'full', dispatch: '—',    safety: '—',    analyst: 'view' },
  { module: 'Fuel & Expenses', admin: 'full', fleet: '—',   dispatch: '—',    safety: '—',    analyst: 'full' },
  { module: 'Analytics',      admin: 'full', fleet: 'full', dispatch: '—',    safety: '—',    analyst: 'full' },
  { module: 'Settings / RBAC', admin: 'full', fleet: '—',  dispatch: '—',    safety: '—',    analyst: '—'   },
];

const ROLE_LABELS = ['Admin', 'Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'];
const ROLE_KEYS = ['admin', 'fleet', 'dispatch', 'safety', 'analyst'];

const AccessCell = ({ value }) => {
  if (value === '—') return <Minus className="h-4 w-4 text-muted-foreground mx-auto" />;
  if (value === 'full') return (
    <div className="flex items-center justify-center">
      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
        <Check className="h-3.5 w-3.5" /> Full
      </span>
    </div>
  );
  return (
    <div className="flex items-center justify-center">
      <span className="text-xs font-medium text-muted-foreground border border-border rounded px-1.5 py-0.5">View</span>
    </div>
  );
};

export const SettingsPage = () => {
  const [settings, setSettings] = useState({
    depotName: 'TransitOps HQ',
    currency: 'INR',
    distanceUnit: 'km',
  });

  useEffect(() => {
    const saved = localStorage.getItem('transitops-settings');
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const handleSave = () => {
    localStorage.setItem('transitops-settings', JSON.stringify(settings));
    toast.success('Settings saved');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6 max-w-[1000px] mx-auto"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings & RBAC</h1>
        <p className="text-muted-foreground">Configure platform preferences and review access permissions</p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">General Settings</CardTitle>
          <CardDescription>Platform-wide configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Depot / Organization Name</label>
              <Input
                value={settings.depotName}
                onChange={(e) => setSettings(s => ({ ...s, depotName: e.target.value }))}
                placeholder="e.g. TransitOps HQ"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Currency</label>
              <Select value={settings.currency} onValueChange={(v) => setSettings(s => ({ ...s, currency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">₹ Indian Rupee (INR)</SelectItem>
                  <SelectItem value="USD">$ US Dollar (USD)</SelectItem>
                  <SelectItem value="EUR">€ Euro (EUR)</SelectItem>
                  <SelectItem value="GBP">£ British Pound (GBP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Distance Unit</label>
              <Select value={settings.distanceUnit} onValueChange={(v) => setSettings(s => ({ ...s, distanceUnit: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="km">Kilometers (km)</SelectItem>
                  <SelectItem value="mi">Miles (mi)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" /> Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* RBAC Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" /> Role-Based Access Control
          </CardTitle>
          <CardDescription>
            Access permissions per role — Full CRUD (✓), View-only, or No Access (—)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 pr-4 font-semibold text-muted-foreground w-40">Module</th>
                  {ROLE_LABELS.map(r => (
                    <th key={r} className="text-center py-3 px-2 font-semibold text-xs text-muted-foreground">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RBAC_MATRIX.map(({ module, ...roles }, i) => (
                  <tr key={module} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-muted/20' : ''}`}>
                    <td className="py-3 pr-4 font-medium text-foreground">{module}</td>
                    {ROLE_KEYS.map(key => (
                      <td key={key} className="py-3 px-2 text-center">
                        <AccessCell value={roles[key]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Role assignments are managed server-side and enforced on every API route. Contact your system administrator to change user roles.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};
