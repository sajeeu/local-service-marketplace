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

interface CertificationsEditorProps {
  fields: FieldArrayWithId<ProviderProfileFormValues, 'certifications', 'id'>[];
  append: UseFieldArrayAppend<ProviderProfileFormValues, 'certifications'>;
  remove: UseFieldArrayRemove;
  register: UseFormRegister<ProviderProfileFormValues>;
  errors: FieldErrors<ProviderProfileFormValues>;
}

export function CertificationsEditor({
  fields,
  append,
  remove,
  register,
  errors,
}: CertificationsEditorProps): React.JSX.Element {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Certifications</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              name: '',
              issuer: '',
              issueDate: '',
              expiryDate: '',
              credentialId: '',
              documentUrl: '',
            })
          }
        >
          Add certification
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">No certifications added yet.</p>
      ) : null}

      {fields.map((field, index) => (
        <div key={field.id} className="space-y-3 border-t border-border pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`cert-name-${index}`}>Name</Label>
              <Input
                id={`cert-name-${index}`}
                aria-invalid={Boolean(errors.certifications?.[index]?.name)}
                {...register(`certifications.${index}.name`)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`cert-issuer-${index}`}>Issuer</Label>
              <Input id={`cert-issuer-${index}`} {...register(`certifications.${index}.issuer`)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`cert-issue-${index}`}>Issue date</Label>
              <Input
                id={`cert-issue-${index}`}
                type="date"
                {...register(`certifications.${index}.issueDate`)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`cert-expiry-${index}`}>Expiry date</Label>
              <Input
                id={`cert-expiry-${index}`}
                type="date"
                {...register(`certifications.${index}.expiryDate`)}
              />
              {errors.certifications?.[index]?.expiryDate ? (
                <p className="text-sm text-destructive" role="alert">
                  {errors.certifications[index]?.expiryDate?.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`cert-cred-${index}`}>Credential ID</Label>
              <Input
                id={`cert-cred-${index}`}
                {...register(`certifications.${index}.credentialId`)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`cert-doc-${index}`}>Document URL</Label>
              <Input
                id={`cert-doc-${index}`}
                type="url"
                placeholder="https://"
                {...register(`certifications.${index}.documentUrl`)}
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
