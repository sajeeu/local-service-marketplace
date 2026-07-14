'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ProviderProfileFormValues } from '../schemas';
import type {
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormRegister,
  FieldErrors,
} from 'react-hook-form';

interface QualificationsEditorProps {
  fields: FieldArrayWithId<ProviderProfileFormValues, 'qualifications', 'id'>[];
  append: UseFieldArrayAppend<ProviderProfileFormValues, 'qualifications'>;
  remove: UseFieldArrayRemove;
  register: UseFormRegister<ProviderProfileFormValues>;
  errors: FieldErrors<ProviderProfileFormValues>;
}

export function QualificationsEditor({
  fields,
  append,
  remove,
  register,
  errors,
}: QualificationsEditorProps): React.JSX.Element {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Qualifications</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              title: '',
              issuer: '',
              issueDate: '',
              expiryDate: '',
              documentUrl: '',
            })
          }
        >
          Add qualification
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">No qualifications added yet.</p>
      ) : null}

      {fields.map((field, index) => (
        <div key={field.id} className="space-y-3 border-t border-border pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`qual-title-${index}`}>Title</Label>
              <Input
                id={`qual-title-${index}`}
                aria-invalid={Boolean(errors.qualifications?.[index]?.title)}
                {...register(`qualifications.${index}.title`)}
              />
              {errors.qualifications?.[index]?.title ? (
                <p className="text-sm text-destructive" role="alert">
                  {errors.qualifications[index]?.title?.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`qual-issuer-${index}`}>Issuer</Label>
              <Input
                id={`qual-issuer-${index}`}
                aria-invalid={Boolean(errors.qualifications?.[index]?.issuer)}
                {...register(`qualifications.${index}.issuer`)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`qual-issue-${index}`}>Issue date</Label>
              <Input
                id={`qual-issue-${index}`}
                type="date"
                {...register(`qualifications.${index}.issueDate`)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`qual-expiry-${index}`}>Expiry date</Label>
              <Input
                id={`qual-expiry-${index}`}
                type="date"
                {...register(`qualifications.${index}.expiryDate`)}
              />
              {errors.qualifications?.[index]?.expiryDate ? (
                <p className="text-sm text-destructive" role="alert">
                  {errors.qualifications[index]?.expiryDate?.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`qual-doc-${index}`}>Document URL</Label>
              <Input
                id={`qual-doc-${index}`}
                type="url"
                placeholder="https://"
                {...register(`qualifications.${index}.documentUrl`)}
              />
            </div>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
            Remove
          </Button>
        </div>
      ))}
    </section>
  );
}
