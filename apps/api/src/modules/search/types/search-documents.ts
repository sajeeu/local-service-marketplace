export interface ServiceSearchDocument {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  pricingModel: string;
  basePrice: number | null;
  currency: string;
  providerId: string;
  providerDisplayName: string;
  providerVerificationStatus: string;
  rating: number;
  completedJobs: number;
  cities: string[];
  states: string[];
  countries: string[];
  _geo?: { lat: number; lng: number };
  serviceRadius: number | null;
  tags: string[];
  tagSlugs: string[];
  featured: boolean;
  instantBookingEnabled: boolean;
  createdAt: number;
  publishedAt: number | null;
  coverImageUrl: string | null;
}

export interface ProviderSearchDocument {
  id: string;
  displayName: string;
  bio: string;
  verificationStatus: string;
  averageRating: number;
  completedJobs: number;
  isActive: boolean;
  cities: string[];
  states: string[];
  countries: string[];
  profilePhoto: string | null;
  createdAt: number;
}
