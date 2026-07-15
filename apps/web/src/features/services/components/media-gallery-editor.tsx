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
import { Select } from '@/components/ui/select';
import type { ServiceFormValues } from '../schemas';

interface MediaGalleryEditorProps {
  control: Control<ServiceFormValues>;
  register: UseFormRegister<ServiceFormValues>;
  errors: FieldErrors<ServiceFormValues>;
}

export function MediaGalleryEditor({
  control,
  register,
  errors,
}: MediaGalleryEditorProps): React.JSX.Element {
  const { fields, append, remove } = useFieldArray({ control, name: 'media' });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Media</h3>
          <p className="text-sm text-muted-foreground">
            Add image or video URLs. Storage providers (Cloudinary / S3) will plug in later.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ type: 'IMAGE', url: '', altText: '', sortOrder: fields.length })}
          disabled={fields.length >= 20}
        >
          Add media
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">No media added yet.</p>
      ) : null}

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="grid gap-3 border-b border-border pb-4 sm:grid-cols-12">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`media.${index}.type`}>Type</Label>
              <Select id={`media.${index}.type`} {...register(`media.${index}.type`)}>
                <option value="IMAGE">Image</option>
                <option value="VIDEO">Video</option>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-5">
              <Label htmlFor={`media.${index}.url`}>URL</Label>
              <Input id={`media.${index}.url`} {...register(`media.${index}.url`)} />
              {errors.media?.[index]?.url?.message ? (
                <p className="text-sm text-destructive" role="alert">
                  {String(errors.media[index]?.url?.message)}
                </p>
              ) : null}
            </div>
            <div className="space-y-2 sm:col-span-4">
              <Label htmlFor={`media.${index}.altText`}>Alt text</Label>
              <Input id={`media.${index}.altText`} {...register(`media.${index}.altText`)} />
            </div>
            <div className="flex items-end sm:col-span-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
