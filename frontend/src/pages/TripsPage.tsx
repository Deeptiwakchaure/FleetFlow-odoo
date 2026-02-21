import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnDef } from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { money } from '../lib/format';
import { driverService } from '../services/drivers';
import { tripService } from '../services/trips';
import { vehicleService } from '../services/vehicles';
import { useAuthStore } from '../store/auth.store';
import { useRealtimeStore } from '../store/realtime.store';
import type { Driver, Trip, TripStatus, Vehicle } from '../types';

const schema = z.object({
  vehicleId: z.coerce.number().int().positive(),
  driverId: z.coerce.number().int().positive(),
  cargoWeight: z.coerce.number().positive(),
  origin: z.string().min(2),
  destination: z.string().min(2),
  revenue: z.coerce.number().min(0),
  status: z.enum(['DRAFT', 'DISPATCHED']).default('DRAFT')
});

type FormValues = z.infer<typeof schema>;

export const TripsPage = () => {
  const user = useAuthStore((s) => s.user);
  const tick = useRealtimeStore((s) => s.tick);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicleId: 0,
      driverId: 0,
      origin: '',
      destination: '',
      status: 'DRAFT'
    }
  });

  const canDispatch = user?.role === 'DISPATCHER';

  const load = async () => {
    try {
      const [tripRows, vehicleRows, driverRows] = await Promise.all([
        tripService.list(),
        vehicleService.available(),
        driverService.available()
      ]);
      setTrips(tripRows);
      setVehicles(vehicleRows);
      setDrivers(driverRows);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load trip data');
    }
  };

  useEffect(() => {
    load();
  }, [tick]);

  const filteredTrips = useMemo(() => {
    const term = search.toLowerCase();
    return trips.filter((trip) =>
      [trip.vehicle.name, trip.driver.name, trip.origin, trip.destination, trip.status]
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }, [search, trips]);

  const transition = async (tripId: number, status: TripStatus) => {
    if (status === 'COMPLETED') {
      const entered = window.prompt('Enter end odometer');
      if (!entered) return;
      await tripService.transition(tripId, status, Number(entered));
    } else {
      await tripService.transition(tripId, status);
    }
    load();
  };

  const columns = useMemo<ColumnDef<Trip>[]>(
    () => [
      { header: 'Trip #', accessorKey: 'id' },
      { header: 'Vehicle', cell: ({ row }) => row.original.vehicle.name },
      { header: 'Driver', cell: ({ row }) => row.original.driver.name },
      { header: 'Route', cell: ({ row }) => `${row.original.origin} -> ${row.original.destination}` },
      { header: 'Cargo', cell: ({ row }) => `${row.original.cargoWeight.toLocaleString()} kg` },
      { header: 'Revenue', cell: ({ row }) => money(row.original.revenue) },
      { header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      {
        header: 'Actions',
        cell: ({ row }) =>
          canDispatch ? (
            <div className="flex flex-wrap gap-2">
              {row.original.status !== 'DISPATCHED' ? (
                <Button variant="secondary" onClick={() => transition(row.original.id, 'DISPATCHED')}>
                  Dispatch
                </Button>
              ) : null}
              {row.original.status === 'DISPATCHED' ? (
                <Button onClick={() => transition(row.original.id, 'COMPLETED')}>Complete</Button>
              ) : null}
              {row.original.status !== 'COMPLETED' && row.original.status !== 'CANCELLED' ? (
                <Button variant="danger" onClick={() => transition(row.original.id, 'CANCELLED')}>
                  Cancel
                </Button>
              ) : null}
            </div>
          ) : null
      }
    ],
    [canDispatch]
  );

  const submit = form.handleSubmit(async (values) => {
    await tripService.create(values);
    form.reset({
      vehicleId: 0,
      driverId: 0,
      origin: '',
      destination: '',
      status: 'DRAFT'
    });
    load();
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Trip Dispatcher</h2>
      {canDispatch ? (
        <Card title="Create Trip">
          <form className="grid gap-3 md:grid-cols-2" onSubmit={submit}>
            <Select {...form.register('vehicleId')}>
              <option value={0}>Select available vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name} ({vehicle.licensePlate})
                </option>
              ))}
            </Select>
            <Select {...form.register('driverId')}>
              <option value={0}>Select on-duty driver</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name} ({driver.licenseNumber})
                </option>
              ))}
            </Select>
            <Input type="number" step="0.01" placeholder="Cargo Weight (kg)" {...form.register('cargoWeight')} />
            <Input type="number" step="0.01" placeholder="Revenue" {...form.register('revenue')} />
            <Input placeholder="Origin" {...form.register('origin')} />
            <Input placeholder="Destination" {...form.register('destination')} />
            <Select {...form.register('status')}>
              <option value="DRAFT">DRAFT</option>
              <option value="DISPATCHED">DISPATCHED</option>
            </Select>
            <div className="md:col-span-2">
              <Button type="submit">Create Trip</Button>
            </div>
          </form>
        </Card>
      ) : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <DataTable columns={columns} data={filteredTrips} search={search} onSearch={setSearch} />
    </div>
  );
};
