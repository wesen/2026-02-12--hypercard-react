export {
  streamingChatSlice,
  streamingChatReducer,
  addMessage,
  startStreaming,
  appendStreamToken,
  finishStreaming,
  streamError,
  resetConversation,
  setActiveConversation,
  nextMessageId,
  selectActiveConversationId,
  selectActiveConversation,
  selectActiveMessages,
  selectIsStreaming,
  selectStreamingMessageId,
  selectChatError,
  type ChatState,
  type Conversation,
  type StreamingChatStateSlice,
} from './chatSlice';

export {
  startCompletion,
  connectStream,
  type ChatCompletionRequest,
  type ChatCompletionResponse,
  type StreamToken,
  type StreamHandlers,
} from './chatApi';

export {
  useChatStream,
  type UseChatStreamOptions,
  type UseChatStreamReturn,
} from './useChatStream';

export {
  fakeStream,
  type FakeStreamConfig,
} from './mocks/fakeStreamService';

export {
  defaultResponseMatcher,
  tokenize,
  type FakeResponse,
  type ResponseMatcher,
} from './mocks/fakeResponses';
