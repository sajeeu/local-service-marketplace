'use client';

import type { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import type { ServiceFormValues } from '../schemas';

interface PricingEditorProps {
  control: Control<ServiceFormValues>;
  errors: FieldErrors<ServiceFormValues>;
  pricingModel: ServiceFormValues['pricingModel'];
}

export function PricingEditor({
  control,
  errors,
  pricingModel,
}: PricingEditorProps): React.JSX.Element {
  const quoteRequired = pricingModel === 'QUOTE_REQUIRED';

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="space-y-2 sm:col-span-1">
        <Label htmlFor="pricingModel">Pricing model</Label>
        <Controller
          control={control}
          name="pricingModel"
          render={({ field }) => (
            <Select id="pricingModel" value={field.value} onChange={field.onChange}>
              <option value="FIXED">Fixed</option>
              <option value="HOURLY">Hourly</option>
              <option value="DAILY">Daily</option>
              <option value="QUOTE_REQUIRED">Quote required</option>
            </Select>
          )}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="basePrice">Base price</Label>
        <Controller
          control={control}
          name="basePrice"
          render={({ field }) => (
            <Input
              id="basePrice"
              type="number"
              min={0}
              step="0.01"
              disabled={quoteRequired}
              value={field.value === undefined || field.value === null ? '' : String(field.value)}
              onChange={(event) =>
                field.onChange(event.target.value === '' ? undefined : Number(event.target.value))
              }
            />
          )}
        />
        {errors.basePrice?.message ? (
          <p className="text-sm text-destructive" role="alert">
            {String(errors.basePrice.message)}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <Controller
          control={control}
          name="currency"
          render={({ field }) => (
            <Input id="currency" maxLength={3} {...field} value={field.value.toUpperCase()} />
          )}
        />
      </div>
    </div>
  );
}
