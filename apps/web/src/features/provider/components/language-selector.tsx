'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { LANGUAGE_OPTIONS, type ProviderProfileFormValues } from '../schemas';
import type {
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormSetValue,
  FieldErrors,
} from 'react-hook-form';

interface LanguageSelectorProps {
  fields: FieldArrayWithId<ProviderProfileFormValues, 'languages', 'id'>[];
  append: UseFieldArrayAppend<ProviderProfileFormValues, 'languages'>;
  remove: UseFieldArrayRemove;
  setValue: UseFormSetValue<ProviderProfileFormValues>;
  errors: FieldErrors<ProviderProfileFormValues>;
}

export function LanguageSelector({
  fields,
  append,
  remove,
  setValue,
  errors,
}: LanguageSelectorProps): React.JSX.Element {
  const selectedCodes = new Set(fields.map((field) => field.code.toLowerCase()));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Languages</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const next = LANGUAGE_OPTIONS.find((opt) => !selectedCodes.has(opt.code));
            if (next) {
              append({ code: next.code, label: next.label, proficiency: '' });
            }
          }}
          disabled={selectedCodes.size >= LANGUAGE_OPTIONS.length}
        >
          Add language
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">No languages selected yet.</p>
      ) : null}

      {fields.map((field, index) => (
        <div key={field.id} className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row">
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor={`language-${index}`}>Language</Label>
            <Select
              id={`language-${index}`}
              value={field.code}
              aria-invalid={Boolean(errors.languages?.[index]?.code)}
              onChange={(event) => {
                const code = event.target.value;
                const option = LANGUAGE_OPTIONS.find((item) => item.code === code);
                setValue(`languages.${index}.code`, code, { shouldValidate: true });
                setValue(`languages.${index}.label`, option?.label ?? code, {
                  shouldValidate: true,
                });
              }}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option
                  key={option.code}
                  value={option.code}
                  disabled={selectedCodes.has(option.code) && option.code !== field.code}
                >
                  {option.label}
                </option>
              ))}
            </Select>
            {errors.languages?.[index]?.code ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.languages[index]?.code?.message}
              </p>
            ) : null}
          </div>
          <div className="flex items-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
              Remove
            </Button>
          </div>
        </div>
      ))}
    </section>
  );
}
