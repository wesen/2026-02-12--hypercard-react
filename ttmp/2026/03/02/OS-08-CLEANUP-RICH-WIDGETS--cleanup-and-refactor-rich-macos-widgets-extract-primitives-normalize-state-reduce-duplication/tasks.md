# Tasks

## DONE

- [x] Analyze all 20 widgets for cleanup opportunities (5 parallel agents)
- [x] Write full widget-by-widget cleanup report (design doc)
- [x] Upload report to reMarkable

## TODO — Implementation (proposed phases from design doc)

### Phase 1: Bug Fixes
- [ ] Fix module-level mutable state in KanbanBoard, MacCalendar/types, SystemModeler
- [ ] Fix YouTubeRetro useMemo with Math.random()
- [ ] Fix MacRepl startTime useState → useRef
- [ ] Fix SystemModeler useEffect missing dependencies
- [ ] Remove dead state from DeepResearch (webSearch, academicOnly)
- [ ] Add devicePixelRatio to Oscilloscope and LogicAnalyzer canvas
- [ ] Add velocity threshold to GraphNavigator force simulation

### Phase 2: Extract Shared Primitives
- [ ] WidgetToolbar primitive (12 widgets)
- [ ] WidgetStatusBar primitive (14 widgets)
- [ ] ModalOverlay primitive (9 widgets)
- [ ] ProgressBar primitive (6 widgets)
- [ ] EmptyState primitive (7 widgets)
- [ ] SearchBar primitive (9 widgets)
- [ ] Separator primitive (7 widgets)

### Phase 3: Extract Specialized Primitives
- [ ] CrtDisplay primitive (Oscilloscope + LogicAnalyzer)
- [ ] LabeledSlider primitive (merge OscSlider + LaSlider)
- [ ] useAnimationLoop hook (3 widgets)
- [ ] CommandPalette primitive (MacCalc + MacCalendar)
- [ ] ButtonGroup primitive (3 widgets)

### Phase 4: Adopt Engine Components
- [ ] Replace hand-rolled radio buttons with engine RadioButton (GameFinder, DeepResearch, StreamLauncher)
- [ ] Add Btn to MacRepl

### Phase 5: Naming Standardization
- [ ] Standardize data-part prefixes to 2-3 char abbreviations
- [ ] Standardize RICH_PARTS import as P alias
- [ ] Migrate ControlRoom CSS to CSS variables

### Phase 6: State Restructuring
- [ ] MacCalc: 17 useState → useReducer groups
- [ ] Oscilloscope: 15 useState → channel config reducer
- [ ] RetroMusicPlayer: 15 useState → playback state reducer
- [ ] KanbanBoard: 14 useState → board state reducer
- [ ] MacCalendar: 14 useState → calendar state reducer
