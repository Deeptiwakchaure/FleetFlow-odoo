import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnDef } from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { DataTable } from '../components/DataTable';
import { FormAlert } from '../components/ui/FormAlert';
import { FormField } from '../components/ui/FormField';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { money } from '../lib/format';
import { vehicleService } from '../services/vehicles';
import { useAuthStore } from '../store/auth.store';
import { useRealtimeStore } from '../store/realtime.store';
import type { Vehicle } from '../types';

const schema = z.object({
  name: z.string().min(2, 'Vehicle name is required'),
  model: z.string().min(2, 'Model is required'),
  licensePlate: z.string().min(4, 'License plate is required'),
  maxCapacityKg: z.coerce.number().positive('Max capacity must be greater than 0'),
  odometer: z.coerce.number().min(0, 'Odometer cannot be negative'),
  acquisitionCost: z.coerce.number().positive('Acquisition cost must be greater than 0'),
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
  const [formError, setFormError] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
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
    try {
      setFormError('');
      if (editing) {
        await vehicleService.update(editing.id, values);
      } else {
        await vehicleService.create(values);
      }
      setOpen(false);
      setEditing(null);
      form.reset({
        name: '',
        model: '',
        licensePlate: '',
        status: 'AVAILABLE'
      });
      load();
    } catch (submitError: any) {
      setFormError(submitError?.response?.data?.message || 'Unable to save vehicle. Please check the form values.');
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Vehicle Registry</h2>
        {canManage ? (
          <Button
            onClick={() => {
              setEditing(null);
              setFormError('');
              form.reset({
                name: '',
                model: '',
                licensePlate: '',
                status: 'AVAILABLE'
              });
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
          <FormField id="vehicle-name" label="Vehicle Name" required error={form.formState.errors.name?.message}>
            <Input
              id="vehicle-name"
              autoFocus
              placeholder="Enter vehicle name"
              invalid={!!form.formState.errors.name}
              {...form.register('name')}
            />
          </FormField>
          <FormField id="vehicle-model" label="Model" required error={form.formState.errors.model?.message}>
            <Input
              id="vehicle-model"
              placeholder="Enter vehicle model"
              invalid={!!form.formState.errors.model}
              {...form.register('model')}
            />
          </FormField>
          <FormField
            id="vehicle-license-plate"
            label="License Plate"
            required
            error={form.formState.errors.licensePlate?.message}
          >
            <Input
              id="vehicle-license-plate"
              placeholder="Enter unique license plate"
              invalid={!!form.formState.errors.licensePlate}
              {...form.register('licensePlate')}
            />
          </FormField>
          <FormField
            id="vehicle-max-capacity"
            label="Max Capacity (kg)"
            required
            error={form.formState.errors.maxCapacityKg?.message}
          >
            <Input
              id="vehicle-max-capacity"
              type="number"
              step="0.01"
              placeholder="e.g. 3500"
              invalid={!!form.formState.errors.maxCapacityKg}
              {...form.register('maxCapacityKg')}
            />
          </FormField>
          <FormField id="vehicle-odometer" label="Odometer (km)" required error={form.formState.errors.odometer?.message}>
            <Input
              id="vehicle-odometer"
              type="number"
              step="0.01"
              placeholder="e.g. 48210"
              invalid={!!form.formState.errors.odometer}
              {...form.register('odometer')}
            />
          </FormField>
          <FormField
            id="vehicle-acquisition-cost"
            label="Acquisition Cost (INR)"
            required
            error={form.formState.errors.acquisitionCost?.message}
          >
            <Input
              id="vehicle-acquisition-cost"
              type="number"
              step="0.01"
              placeholder="e.g. 1850000"
              invalid={!!form.formState.errors.acquisitionCost}
              {...form.register('acquisitionCost')}
            />
          </FormField>
          <FormField id="vehicle-status" label="Status" required error={form.formState.errors.status?.message}>
            <Select id="vehicle-status" invalid={!!form.formState.errors.status} {...form.register('status')}>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="ON_TRIP">ON_TRIP</option>
              <option value="IN_SHOP">IN_SHOP</option>
              <option value="RETIRED">RETIRED</option>
            </Select>
          </FormField>
          {formError ? <FormAlert tone="error" message={formError} /> : null}
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving...' : editing ? 'Save Changes' : 'Create Vehicle'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
