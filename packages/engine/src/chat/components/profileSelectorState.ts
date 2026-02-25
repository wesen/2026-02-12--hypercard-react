import type { ChatProfileListItem } from '../runtime/profileTypes';

function normalize(value: string | null | undefined): string {
  return String(value ?? '').trim();
}

export function resolveProfileSelectorValue(
  profiles: ChatProfileListItem[],
  currentProfile: string | null | undefined
): string {
  const defaultProfileSlug = normalize(
    profiles.find((profile) => profile.is_default)?.slug
  );
  const availableProfileSlugs = new Set(
    profiles.map((profile) => normalize(profile.slug)).filter((slug) => slug.length > 0)
  );
  const selected = normalize(currentProfile);
  if (selected && availableProfileSlugs.has(selected)) {
    return selected;
  }
  return defaultProfileSlug;
}

export function resolveProfileSelectionChange(
  nextProfileRaw: string,
  defaultProfileSlug: string
): string | null {
  const nextProfile = normalize(nextProfileRaw);
  if (nextProfile.length > 0) {
    return nextProfile;
  }
  const fallback = normalize(defaultProfileSlug);
  return fallback.length > 0 ? fallback : null;
}
