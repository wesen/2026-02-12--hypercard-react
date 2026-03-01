import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setCurrentProfile } from './profileApi';
import { chatProfilesSlice } from '../state/profileSlice';

export interface UseSetProfileOptions {
  scopeKey?: string;
}

export function useSetProfile(basePrefix = '', options: UseSetProfileOptions = {}) {
  const dispatch = useDispatch();
  const scopeKey = String(options.scopeKey ?? '').trim() || undefined;

  return useCallback(
    async (profile: string | null, registry?: string | null) => {
      const normalized = String(profile ?? '').trim();
      if (!normalized) {
        dispatch(
          chatProfilesSlice.actions.setSelectedProfile({
            profile: null,
            registry: registry ?? undefined,
            scopeKey,
          })
        );
        return;
      }
      dispatch(chatProfilesSlice.actions.setProfileError(null));
      try {
        const payload = await setCurrentProfile(normalized, { basePrefix });
        const serverSlug = String(payload.slug ?? payload.profile ?? normalized).trim() || normalized;
        dispatch(
          chatProfilesSlice.actions.setSelectedProfile({
            profile: serverSlug,
            registry: registry ?? undefined,
            scopeKey,
          })
        );
      } catch (err) {
        dispatch(
          chatProfilesSlice.actions.setProfileError(
            err instanceof Error ? err.message : String(err)
          )
        );
      }
    },
    [basePrefix, dispatch, scopeKey]
  );
}
