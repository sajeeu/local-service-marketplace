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
import { Textarea } from '@/components/ui/textarea';
import type { ServiceFormValues } from '../schemas';

interface FaqEditorProps {
  control: Control<ServiceFormValues>;
  register: UseFormRegister<ServiceFormValues>;
  errors: FieldErrors<ServiceFormValues>;
}

export function FaqEditor({ control, register, errors }: FaqEditorProps): React.JSX.Element {
  const { fields, append, remove } = useFieldArray({ control, name: 'faqs' });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">FAQs</h3>
          <p className="text-sm text-muted-foreground">Answer common customer questions.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ question: '', answer: '', sortOrder: fields.length })}
          disabled={fields.length >= 30}
        >
          Add FAQ
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-3 border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <Label htmlFor={`faqs.${index}.question`}>Question</Label>
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                Remove
              </Button>
            </div>
            <Input id={`faqs.${index}.question`} {...register(`faqs.${index}.question`)} />
            {errors.faqs?.[index]?.question?.message ? (
              <p className="text-sm text-destructive" role="alert">
                {String(errors.faqs[index]?.question?.message)}
              </p>
            ) : null}
            <Label htmlFor={`faqs.${index}.answer`}>Answer</Label>
            <Textarea id={`faqs.${index}.answer`} rows={3} {...register(`faqs.${index}.answer`)} />
            {errors.faqs?.[index]?.answer?.message ? (
              <p className="text-sm text-destructive" role="alert">
                {String(errors.faqs[index]?.answer?.message)}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
