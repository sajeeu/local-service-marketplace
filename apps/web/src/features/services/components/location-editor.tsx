'use client';

import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ServiceFormValues } from '../schemas';

interface LocationEditorProps {
  control: Control<ServiceFormValues>;
  register: UseFormRegister<ServiceFormValues>;
  errors: FieldErrors<ServiceFormValues>;
}

export function LocationEditor({
  control,
  register,
  errors,
}: LocationEditorProps): React.JSX.Element {
  const { fields, append, remove } = useFieldArray({ control, name: 'locations' });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Locations</h3>
          <p className="text-sm text-muted-foreground">
            Where this service can be delivered. Geo-search comes later.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              type: 'ON_SITE',
              city: '',
              state: '',
              country: '',
              latitude: undefined,
              longitude: undefined,
              serviceRadius: undefined,
            })
          }
          disabled={fields.length >= 10}
        >
          Add location
        </Button>
      </div>

      <div className="space-y-6">
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-3 border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <Label htmlFor={`locations.${index}.type`}>Location type</Label>
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                Remove
              </Button>
            </div>
            <select
              id={`locations.${index}.type`}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register(`locations.${index}.type`)}
            >
              <option value="REMOTE">Remote</option>
              <option value="ON_SITE">On-site</option>
              <option value="CUSTOMER_LOCATION">Customer location</option>
              <option value="PROVIDER_LOCATION">Provider location</option>
            </select>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input placeholder="City" {...register(`locations.${index}.city`)} />
              <Input placeholder="State" {...register(`locations.${index}.state`)} />
              <Input placeholder="Country" {...register(`locations.${index}.country`)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                placeholder="Latitude"
                type="number"
                step="any"
                {...register(`locations.${index}.latitude`)}
              />
              <Input
                placeholder="Longitude"
                type="number"
                step="any"
                {...register(`locations.${index}.longitude`)}
              />
              <Input
                placeholder="Radius (km)"
                type="number"
                step="any"
                {...register(`locations.${index}.serviceRadius`)}
              />
            </div>
            {errors.locations?.[index]?.city?.message ? (
              <p className="text-sm text-destructive" role="alert">
                {String(errors.locations[index]?.city?.message)}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
