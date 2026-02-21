import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnDef } from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { DataTable } from '../components/DataTable';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { money, shortDate } from '../lib/format';
import { maintenanceService } from '../services/maintenance';
import { vehicleService } from '../services/vehicles';
import { useAuthStore } from '../store/auth.store';
import { useRealtimeStore } from '../store/realtime.store';
import type { ServiceLog, Vehicle } from '../types';

const schema = z.object({
  vehicleId: z.coerce.number().int().positive(),
  description: z.string().min(3),
  cost: z.coerce.number().positive(),
  date: z.string().min(1)
});

type FormValues = z.infer<typeof schema>;

export const MaintenancePage = () => {
  const user = useAuthStore((s) => s.user);
  const tick = useRealtimeStore((s) => s.tick);
  const canCreate = user?.role === 'MANAGER' || user?.role === 'SAFETY';
  const [rows, setRows] = useState<ServiceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleFilter, setVehicleFilter] = useState<number | ''>('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicleId: 0,
      description: '',
      date: new Date().toISOString().slice(0, 10)
    }
  });

  const load = async () => {
    try {
      const [logs, allVehicles] = await Promise.all([
        maintenanceService.list(vehicleFilter === '' ? undefined : Number(vehicleFilter)),
        vehicleService.list()
      ]);
      setRows(logs);
      setVehicles(allVehicles);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load maintenance logs');
    }
  };

  useEffect(() => {
    load();
  }, [tick, vehicleFilter]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return rows.filter((row) =>
      [row.vehicle.name, row.description, row.vehicle.licensePlate].join(' ').toLowerCase().includes(term)
    );
  }, [rows, search]);

  const columns = useMemo<ColumnDef<ServiceLog>[]>(
    () => [
      { header: 'Log #', accessorKey: 'id' },
      { header: 'Vehicle', cell: ({ row }) => row.original.vehicle.name },
      { header: 'Description', accessorKey: 'description' },
      { header: 'Cost', cell: ({ row }) => money(row.original.cost) },
      { header: 'Date', cell: ({ row }) => shortDate(row.original.date) },
      {
        header: 'Actions',
        cell: ({ row }) =>
          canCreate ? (
            <Button variant="danger" onClick={() => maintenanceService.remove(row.original.id).then(load)}>
              Delete
            </Button>
          ) : null
      }
    ],
    [canCreate]
  );

  const submit = form.handleSubmit(async (values) => {
    await maintenanceService.create({
      vehicleId: values.vehicleId,
      description: values.description,
      cost: values.cost,
      date: values.date
    });
    form.reset({
      vehicleId: 0,
      description: '',
      date: new Date().toISOString().slice(0, 10)
    });
    load();
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Maintenance Logs</h2>

      {canCreate ? (
        <Card title="Add Service Log">
          <form className="grid gap-3 md:grid-cols-2" onSubmit={submit}>
            <Select {...form.register('vehicleId')}>
              <option value={0}>Select vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name} ({vehicle.licensePlate})
                </option>
              ))}
            </Select>
            <Input placeholder="Description" {...form.register('description')} />
            <Input type="number" step="0.01" placeholder="Cost" {...form.register('cost')} />
            <Input type="date" {...form.register('date')} />
            <div className="md:col-span-2">
              <Button type="submit">Create Service Log</Button>
            </div>
          </form>
        </Card>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <Select value={vehicleFilter === '' ? '' : String(vehicleFilter)} onChange={(e) => setVehicleFilter(e.target.value ? Number(e.target.value) : '')}>
          <option value="">All vehicles</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.name}
            </option>
          ))}
        </Select>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <DataTable columns={columns} data={filtered} search={search} onSearch={setSearch} />
    </div>
  );
};
