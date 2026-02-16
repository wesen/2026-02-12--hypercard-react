import type { ArtifactRecord } from './artifactsSlice';

interface ArtifactsStateShape {
  byId: Record<string, ArtifactRecord>;
}

interface ArtifactsStateSlice {
  artifacts: ArtifactsStateShape;
}

export const selectArtifactsById = (state: ArtifactsStateSlice) => state.artifacts.byId;

export const selectArtifactById = (state: ArtifactsStateSlice, artifactId: string): ArtifactRecord | undefined =>
  state.artifacts.byId[artifactId];
