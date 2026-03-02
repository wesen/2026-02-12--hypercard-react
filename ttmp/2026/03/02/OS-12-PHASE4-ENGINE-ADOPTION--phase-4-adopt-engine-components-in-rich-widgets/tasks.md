# Tasks — OS-12-PHASE4-ENGINE-ADOPTION

## Replace Hand-Rolled Radio Buttons

- [x] Replace GameFinder gf-radio/gf-radio-dot with engine RadioButton
- [x] Replace DeepResearch dr-radio/dr-radio-dot with engine RadioButton
- [x] Replace StreamLauncher sl-radio/sl-radio-dot with engine RadioButton

## Additional Engine Adoption

- [x] Evaluate and optionally add Btn to MacRepl (skipped — already uses Btn)
- [x] Evaluate ControlRoom for engine component opportunities (skipped — patterns don't align)

## Cleanup

- [x] Remove orphaned radio CSS rules from game-finder.css, deep-research.css, stream-launcher.css
- [x] Remove orphaned data-part constants from parts.ts

## Verification

- [x] RadioButton visual parity with ChartView's usage
- [x] All radio selection logic works correctly
- [x] TypeScript check passes (no new errors)
- [x] Diary updated, changelog updated, docmgr doctor passes
