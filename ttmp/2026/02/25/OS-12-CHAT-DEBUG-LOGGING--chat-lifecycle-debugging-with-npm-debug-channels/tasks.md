# Tasks

## DONE

- [x] Create ticket workspace for chat debug channel instrumentation.
- [x] Add `debug` npm dependency to `@hypercard/engine`.
- [x] Add shared chat debug logger helper with a browser global controller (`window.__HC_DEBUG__`).
- [x] Add `useConversation` lifecycle and send-path debug logging with dependency-diff context.
- [x] Add a playbook document describing how to enable and use debug channels during investigation.

## TODO

- [ ] Extend the same debug-channel pattern to `ConversationManager` ref/disconnect scheduling paths if deeper reconnect tracing is needed.
