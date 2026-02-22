# Tasks

## TODO

- [x] Close legacy tickets per user request (HC-01, HC-55) and record closure notes
- [x] Add backend timeline projection for `hypercard.widget.error` as canonical widget timeline kind
- [x] Update timeline remap logic so widget/card remappers propagate error state when present
- [x] Add/adjust Go tests for widget error projection
- [x] Add/adjust TS tests for widget error remap behavior
- [x] Run targeted validation commands and record outcomes in diary/changelog
- [x] Mark HC-56 status according to workflow after fix lands

## DONE

- [x] Created ticket HC-56-LITTLE-BUGS
- [x] Added analysis doc for `hypercard.widget.error` handling gap
- [x] Added analysis doc for widget open/edit behavior and hydration artifact projection gap
- [x] Added diary doc scaffold
- [x] Fixed widget `Edit` action to open code editor instead of reusing `Open` behavior
- [x] Fixed artifact projection middleware to process `timeline.mergeSnapshot`
