'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { ProviderPrivateProfileDto } from '@local-service-marketplace/shared-types';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ApiClientError, apiClient } from '@/lib/api-client';
import { providerProfileSchema, type ProviderProfileFormValues } from '../schemas';
import { CertificationsEditor } from './certifications-editor';
import { LanguageSelector } from './language-selector';
import { QualificationsEditor } from './qualifications-editor';

interface ProviderProfileFormProps {
  initial?: ProviderPrivateProfileDto | null;
  submitLabel?: string;
  onSuccess?: (profile: ProviderPrivateProfileDto) => void;
}

function toFormValues(profile?: ProviderPrivateProfileDto | null): ProviderProfileFormValues {
  return {
    displayName: profile?.displayName ?? '',
    bio: profile?.bio ?? '',
    profilePhoto: profile?.profilePhoto ?? '',
    yearsOfExperience: profile?.yearsOfExperience ?? 0,
    qualifications:
      profile?.qualifications.map((row) => ({
        title: row.title,
        issuer: row.issuer,
        issueDate: row.issueDate,
        expiryDate: row.expiryDate ?? '',
        documentUrl: row.documentUrl ?? '',
      })) ?? [],
    certifications:
      profile?.certifications.map((row) => ({
        name: row.name,
        issuer: row.issuer,
        issueDate: row.issueDate ?? '',
        expiryDate: row.expiryDate ?? '',
        credentialId: row.credentialId ?? '',
        documentUrl: row.documentUrl ?? '',
      })) ?? [],
    languages:
      profile?.languages.map((row) => ({
        code: row.code,
        label: row.label,
        proficiency: row.proficiency ?? '',
      })) ?? [],
  };
}

export function ProviderProfileForm({
  initial,
  submitLabel = 'Save profile',
  onSuccess,
}: ProviderProfileFormProps): React.JSX.Element {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProviderProfileFormValues>({
    resolver: zodResolver(providerProfileSchema),
    defaultValues: toFormValues(initial),
  });

  const qualifications = useFieldArray({ control, name: 'qualifications' });
  const certifications = useFieldArray({ control, name: 'certifications' });
  const languages = useFieldArray({ control, name: 'languages' });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const profile = await apiClient.updateMyProvider({
        displayName: values.displayName,
        bio: values.bio || null,
        profilePhoto: values.profilePhoto || null,
        yearsOfExperience: values.yearsOfExperience,
        qualifications: values.qualifications.map((row) => ({
          title: row.title,
          issuer: row.issuer,
          issueDate: row.issueDate,
          expiryDate: row.expiryDate || null,
          documentUrl: row.documentUrl || null,
        })),
        certifications: values.certifications.map((row) => ({
          name: row.name,
          issuer: row.issuer,
          issueDate: row.issueDate || null,
          expiryDate: row.expiryDate || null,
          credentialId: row.credentialId || null,
          documentUrl: row.documentUrl || null,
        })),
        languages: values.languages.map((row) => ({
          code: row.code,
          label: row.label,
          proficiency: row.proficiency || null,
        })),
      });
      onSuccess?.(profile);
    } catch (error) {
      setFormError(
        error instanceof ApiClientError ? error.message : 'Unable to save provider profile.',
      );
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Profile</h2>
        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            aria-invalid={Boolean(errors.displayName)}
            {...register('displayName')}
          />
          {errors.displayName ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.displayName.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Biography</Label>
          <Textarea id="bio" aria-invalid={Boolean(errors.bio)} {...register('bio')} />
          {errors.bio ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.bio.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="yearsOfExperience">Years of experience</Label>
            <Input
              id="yearsOfExperience"
              type="number"
              min={0}
              max={80}
              aria-invalid={Boolean(errors.yearsOfExperience)}
              {...register('yearsOfExperience')}
            />
            {errors.yearsOfExperience ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.yearsOfExperience.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="profilePhoto">Profile photo URL</Label>
            <Input
              id="profilePhoto"
              type="url"
              placeholder="https://"
              aria-invalid={Boolean(errors.profilePhoto)}
              {...register('profilePhoto')}
            />
            {errors.profilePhoto ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.profilePhoto.message}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <QualificationsEditor
        fields={qualifications.fields}
        append={qualifications.append}
        remove={qualifications.remove}
        register={register}
        errors={errors}
      />

      <CertificationsEditor
        fields={certifications.fields}
        append={certifications.append}
        remove={certifications.remove}
        register={register}
        errors={errors}
      />

      <LanguageSelector
        fields={languages.fields}
        append={languages.append}
        remove={languages.remove}
        setValue={setValue}
        errors={errors}
      />

      {formError ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}
