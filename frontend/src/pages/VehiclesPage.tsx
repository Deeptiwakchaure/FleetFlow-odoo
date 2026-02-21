import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnDef } from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { DataTable } from '../components/DataTable';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { StatusBadge } from '../components/ui/Badge';
import { money } from '../lib/format';
import { vehicleService } from '../services/vehicles';
import { useAuthStore } from '../store/auth.store';
import { useRealtimeStore } from '../store/realtime.store';
import type { Vehicle } from '../types';

const schema = z.object({
  name: z.string().min(2),
  model: z.string().min(2),
  licensePlate: z.string().min(4),
  maxCapacityKg: z.coerce.number().positive(),
  odometer: z.coerce.number().min(0),
  acquisitionCost: z.coerce.number().positive(),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']).default('AVAILABLE')
});

type FormValues = z.infer<typeof schema>;

export const VehiclesPage = () => {
  const user = useAuthStore((s) => s.user);
  const tick = useRealtimeStore((s) => s.tick);
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [error, setError] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      model: '',
      licensePlate: '',
      status: 'AVAILABLE'
    }
  });

  const canManage = user?.role === 'MANAGER';

  const load = () => vehicleService.list().then(setRows).catch((err) => setError(err?.response?.data?.message));

  useEffect(() => {
    load();
  }, [tick]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return rows.filter((v) =>
      [v.name, v.model, v.licensePlate, v.status].some((value) => value.toLowerCase().includes(term))
    );
  }, [rows, search]);

  const columns = useMemo<ColumnDef<Vehicle>[]>(
    () => [
      { header: 'Name', accessorKey: 'name' },
      { header: 'Model', accessorKey: 'model' },
      { header: 'Plate', accessorKey: 'licensePlate' },
      {
        header: 'Capacity',
        cell: ({ row }) => `${row.original.maxCapacityKg.toLocaleString()} kg`
      },
      {
        header: 'Acquisition',
        cell: ({ row }) => money(row.original.acquisitionCost)
      },
      {
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />
      },
      {
        header: 'Actions',
        cell: ({ row }) =>
          canManage ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(row.original);
                  form.reset({
                    ...row.original
                  });
                  setOpen(true);
                }}
              >
                Edit
              </Button>
              <Button variant="secondary" onClick={() => vehicleService.retire(row.original.id).then(load)}>
                Retire
              </Button>
              <Button variant="danger" onClick={() => vehicleService.remove(row.original.id).then(load)}>
                Delete
              </Button>
            </div>
          ) : null
      }
    ],
    [canManage, form]
  );

  const submit = form.handleSubmit(async (values) => {
    if (editing) {
      await vehicleService.update(editing.id, values);
    } else {
      await vehicleService.create(values);
    }
    setOpen(false);
    setEditing(null);
    form.reset();
    load();
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Vehicle Registry</h2>
        {canManage ? (
          <Button
            onClick={() => {
              setEditing(null);
              form.reset();
              setOpen(true);
            }}
          >
            Add Vehicle
          </Button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <DataTable columns={columns} data={filtered} search={search} onSearch={setSearch} />

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? `Edit ${editing.name}` : 'Add Vehicle'}
      >
        <form className="space-y-3" onSubmit={submit}>
          <Input placeholder="Vehicle Name" {...form.register('name')} />
          <Input placeholder="Model" {...form.register('model')} />
          <Input placeholder="License Plate" {...form.register('licensePlate')} />
          <Input type="number" step="0.01" placeholder="Max Capacity (kg)" {...form.register('maxCapacityKg')} />
          <Input type="number" step="0.01" placeholder="Odometer" {...form.register('odometer')} />
          <Input
            type="number"
            step="0.01"
            placeholder="Acquisition Cost"
            {...form.register('acquisitionCost')}
          />
          <Select {...form.register('status')}>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="ON_TRIP">ON_TRIP</option>
            <option value="IN_SHOP">IN_SHOP</option>
            <option value="RETIRED">RETIRED</option>
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editing ? 'Save' : 'Create'}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
