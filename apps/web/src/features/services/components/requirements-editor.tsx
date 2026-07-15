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

interface RequirementsEditorProps {
  control: Control<ServiceFormValues>;
  register: UseFormRegister<ServiceFormValues>;
  errors: FieldErrors<ServiceFormValues>;
}

export function RequirementsEditor({
  control,
  register,
  errors,
}: RequirementsEditorProps): React.JSX.Element {
  const { fields, append, remove } = useFieldArray({ control, name: 'requirements' });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Customer requirements</h3>
          <p className="text-sm text-muted-foreground">
            Tell customers what they need to prepare before the visit.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ description: '', isRequired: true, sortOrder: fields.length })}
          disabled={fields.length >= 30}
        >
          Add requirement
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex flex-wrap items-end gap-3 border-b border-border pb-4"
          >
            <div className="min-w-[240px] flex-1 space-y-2">
              <Label htmlFor={`requirements.${index}.description`}>Requirement</Label>
              <Input
                id={`requirements.${index}.description`}
                {...register(`requirements.${index}.description`)}
              />
              {errors.requirements?.[index]?.description?.message ? (
                <p className="text-sm text-destructive" role="alert">
                  {String(errors.requirements[index]?.description?.message)}
                </p>
              ) : null}
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" {...register(`requirements.${index}.isRequired`)} />
              Required
            </label>
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
              Remove
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
