import type {
  ProviderAvailabilityDto,
  ProviderCertificationDto,
  ProviderLanguageDto,
  ProviderListItemDto,
  ProviderPrivateProfileDto,
  ProviderPublicProfileDto,
  ProviderQualificationDto,
  ProviderVerificationDocumentMeta,
  ProviderVerificationDto,
  ProviderVerificationStatus,
} from '@local-service-marketplace/shared-types';
import type {
  Provider,
  ProviderAvailability,
  ProviderCertification,
  ProviderLanguage,
  ProviderQualification,
  ProviderVerification,
} from '@prisma/client';

export type ProviderWithRelations = Provider & {
  qualifications: ProviderQualification[];
  certifications: ProviderCertification[];
  languages: ProviderLanguage[];
  verifications: ProviderVerification[];
};

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function parseDocumentMetadata(value: unknown): ProviderVerificationDocumentMeta[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      filename: String(item.filename ?? ''),
      mimeType: String(item.mimeType ?? ''),
      sizeBytes: Number(item.sizeBytes ?? 0),
      url: typeof item.url === 'string' ? item.url : undefined,
    }));
}

export function toQualificationDto(row: ProviderQualification): ProviderQualificationDto {
  return {
    id: row.id,
    title: row.title,
    issuer: row.issuer,
    issueDate: toIsoDate(row.issueDate),
    expiryDate: row.expiryDate ? toIsoDate(row.expiryDate) : null,
    documentUrl: row.documentUrl,
  };
}

export function toCertificationDto(row: ProviderCertification): ProviderCertificationDto {
  return {
    id: row.id,
    name: row.name,
    issuer: row.issuer,
    issueDate: row.issueDate ? toIsoDate(row.issueDate) : null,
    expiryDate: row.expiryDate ? toIsoDate(row.expiryDate) : null,
    credentialId: row.credentialId,
    documentUrl: row.documentUrl,
  };
}

export function toLanguageDto(row: ProviderLanguage): ProviderLanguageDto {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    proficiency: row.proficiency,
  };
}

export function toAvailabilityDto(row: ProviderAvailability): ProviderAvailabilityDto {
  return {
    id: row.id,
    dayOfWeek: row.dayOfWeek,
    startTime: row.startTime,
    endTime: row.endTime,
    timezone: row.timezone,
  };
}

export function toVerificationDto(row: ProviderVerification): ProviderVerificationDto {
  return {
    id: row.id,
    status: row.status as ProviderVerificationStatus,
    submittedAt: row.submittedAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    rejectionReason: row.rejectionReason,
    documentMetadata: parseDocumentMetadata(row.documentMetadata),
  };
}

export function toPrivateProfileDto(provider: ProviderWithRelations): ProviderPrivateProfileDto {
  const verifications = [...provider.verifications].sort(
    (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime(),
  );

  return {
    id: provider.id,
    tenantId: provider.tenantId,
    userId: provider.userId,
    displayName: provider.displayName,
    bio: provider.bio,
    profilePhoto: provider.profilePhoto,
    yearsOfExperience: provider.yearsOfExperience,
    verificationStatus: provider.verificationStatus as ProviderVerificationStatus,
    averageRating: provider.averageRating,
    completedJobs: provider.completedJobs,
    responseRate: provider.responseRate,
    responseTime: provider.responseTime,
    isActive: provider.isActive,
    createdAt: provider.createdAt.toISOString(),
    updatedAt: provider.updatedAt.toISOString(),
    qualifications: provider.qualifications.map(toQualificationDto),
    certifications: provider.certifications.map(toCertificationDto),
    languages: provider.languages.map(toLanguageDto),
    verifications: verifications.map(toVerificationDto),
  };
}

export function toPublicProfileDto(provider: ProviderWithRelations): ProviderPublicProfileDto {
  return {
    id: provider.id,
    displayName: provider.displayName,
    bio: provider.bio,
    profilePhoto: provider.profilePhoto,
    yearsOfExperience: provider.yearsOfExperience,
    verificationStatus: provider.verificationStatus as ProviderVerificationStatus,
    averageRating: provider.averageRating,
    completedJobs: provider.completedJobs,
    responseRate: provider.responseRate,
    responseTime: provider.responseTime,
    languages: provider.languages.map((lang) => ({
      code: lang.code,
      label: lang.label,
      proficiency: lang.proficiency,
    })),
    qualifications: provider.qualifications.map((row) => ({
      title: row.title,
      issuer: row.issuer,
      issueDate: toIsoDate(row.issueDate),
      expiryDate: row.expiryDate ? toIsoDate(row.expiryDate) : null,
    })),
    certifications: provider.certifications.map((row) => ({
      name: row.name,
      issuer: row.issuer,
      issueDate: row.issueDate ? toIsoDate(row.issueDate) : null,
      expiryDate: row.expiryDate ? toIsoDate(row.expiryDate) : null,
    })),
  };
}

export function toListItemDto(provider: Provider): ProviderListItemDto {
  return {
    id: provider.id,
    userId: provider.userId,
    displayName: provider.displayName,
    verificationStatus: provider.verificationStatus as ProviderVerificationStatus,
    isActive: provider.isActive,
    yearsOfExperience: provider.yearsOfExperience,
    averageRating: provider.averageRating,
    completedJobs: provider.completedJobs,
    createdAt: provider.createdAt.toISOString(),
  };
}
