# Tasks

## Assessment + Planning

- [x] Audit Storybook source aggregation, story metadata taxonomy, and file-layout mismatches against package structure
- [x] Write detailed assessment + cleanup plan document covering information architecture, story title policy, file reorg, config updates, addon hygiene, and rollout gates
- [x] Relate key Storybook and story files to the assessment document
- [x] Upload assessment bundle to reMarkable and verify remote path

## Proposed Cleanup Execution Plan (For Follow-Up Implementation)

- [x] Introduce canonical Storybook IA policy aligned to monorepo package structure (`Apps/*`, `Packages/*`)
- [x] Normalize all story titles to canonical prefix and naming style (hard cutover, no compatibility aliases)
- [x] Reorganize app story files from flat `src/stories` buckets to feature-aligned directories matching runtime package boundaries
- [x] Split oversized monolithic story files into focused scenario files (especially `ChatWindow` and desktop/windowing stories)
- [x] Move Storybook config ownership to explicit workspace-level location or formalize inventory-hosted-global ownership with strict docs and lint checks
- [x] Align Storybook addons/dependencies with active usage (remove unused addons or wire them intentionally)
- [x] Add validation scripts/CI checks for story title taxonomy drift and story placement drift
- [x] Write maintainer docs for adding stories, selecting title prefixes, and deciding package placement
