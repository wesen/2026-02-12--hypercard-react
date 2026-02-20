import {
  extractArtifactUpsertFromSem,
  registerRuntimeCard,
  type ProjectionPipelineAdapter,
  upsertArtifact,
} from '@hypercard/engine';

export function createInventoryArtifactProjectionAdapter(): ProjectionPipelineAdapter {
  return {
    onEnvelope({ dispatch, envelope }) {
      const type = envelope.event?.type;
      const data = envelope.event?.data ?? {};
      const artifactUpdate = extractArtifactUpsertFromSem(type, data);
      if (!artifactUpdate) return;

      dispatch(upsertArtifact(artifactUpdate));
      if (artifactUpdate.runtimeCardId && artifactUpdate.runtimeCardCode) {
        registerRuntimeCard(artifactUpdate.runtimeCardId, artifactUpdate.runtimeCardCode);
      }
    },
  };
}
