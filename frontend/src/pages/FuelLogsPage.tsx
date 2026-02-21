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
import { fuelService } from '../services/fuel';
import { vehicleService } from '../services/vehicles';
import { useAuthStore } from '../store/auth.store';
import { useRealtimeStore } from '../store/realtime.store';
import type { FuelLog, Vehicle } from '../types';

const schema = z.object({
  vehicleId: z.coerce.number().int().positive(),
  liters: z.coerce.number().positive(),
  cost: z.coerce.number().positive(),
  odometer: z.coerce.number().min(0),
  date: z.string().min(1)
});

type FormValues = z.infer<typeof schema>;

export const FuelLogsPage = () => {
  const user = useAuthStore((s) => s.user);
  const tick = useRealtimeStore((s) => s.tick);
  const canCreate = user?.role === 'MANAGER' || user?.role === 'DISPATCHER';
  const [rows, setRows] = useState<FuelLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicleId: 0,
      date: new Date().toISOString().slice(0, 10)
    }
  });

  const load = async () => {
    try {
      const [logs, allVehicles] = await Promise.all([fuelService.list(), vehicleService.list()]);
      setRows(logs);
      setVehicles(allVehicles);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load fuel logs');
    }
  };

  useEffect(() => {
    load();
  }, [tick]);

  const costPerKmByLogId = useMemo(() => {
    const grouped = new Map<number, FuelLog[]>();
    rows.forEach((log) => {
      const curr = grouped.get(log.vehicleId) || [];
      curr.push(log);
      grouped.set(log.vehicleId, curr);
    });

    const result = new Map<number, number>();
    grouped.forEach((vehicleLogs) => {
      const sorted = [...vehicleLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      sorted.forEach((log, index) => {
        if (index === 0) {
          result.set(log.id, 0);
          return;
        }
        const prev = sorted[index - 1];
        const distance = Math.max(1, log.odometer - prev.odometer);
        result.set(log.id, log.cost / distance);
      });
    });
    return result;
  }, [rows]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return rows.filter((row) =>
      [row.vehicle.name, row.vehicle.licensePlate, row.date].join(' ').toLowerCase().includes(term)
    );
  }, [rows, search]);

  const columns = useMemo<ColumnDef<FuelLog>[]>(
    () => [
      { header: 'Log #', accessorKey: 'id' },
      { header: 'Vehicle', cell: ({ row }) => row.original.vehicle.name },
      { header: 'Liters', cell: ({ row }) => row.original.liters.toFixed(2) },
      { header: 'Cost', cell: ({ row }) => money(row.original.cost) },
      { header: 'Odometer', cell: ({ row }) => row.original.odometer.toLocaleString() },
      {
        header: 'Cost / km',
        cell: ({ row }) => money(costPerKmByLogId.get(row.original.id) || 0)
      },
      { header: 'Date', cell: ({ row }) => shortDate(row.original.date) },
      {
        header: 'Actions',
        cell: ({ row }) =>
          canCreate ? (
            <Button variant="danger" onClick={() => fuelService.remove(row.original.id).then(load)}>
              Delete
            </Button>
          ) : null
      }
    ],
    [canCreate, costPerKmByLogId]
  );

  const submit = form.handleSubmit(async (values) => {
    await fuelService.create(values);
    form.reset({
      vehicleId: 0,
      date: new Date().toISOString().slice(0, 10)
    });
    load();
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Fuel Logs</h2>
      {canCreate ? (
        <Card title="Add Fuel Log">
          <form className="grid gap-3 md:grid-cols-2" onSubmit={submit}>
            <Select {...form.register('vehicleId')}>
              <option value={0}>Select vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name} ({vehicle.licensePlate})
                </option>
              ))}
            </Select>
            <Input type="number" step="0.01" placeholder="Liters" {...form.register('liters')} />
            <Input type="number" step="0.01" placeholder="Cost" {...form.register('cost')} />
            <Input type="number" step="0.01" placeholder="Odometer" {...form.register('odometer')} />
            <Input type="date" {...form.register('date')} />
            <div className="md:col-span-2">
              <Button type="submit">Create Fuel Log</Button>
            </div>
          </form>
        </Card>
      ) : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <DataTable columns={columns} data={filtered} search={search} onSearch={setSearch} />
    </div>
  );
};
