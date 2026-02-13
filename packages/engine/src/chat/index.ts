export {
  type ChatCompletionRequest,
  type ChatCompletionResponse,
  connectStream,
  type StreamHandlers,
  type StreamToken,
  startCompletion,
} from './chatApi';
export {
  addMessage,
  appendStreamToken,
  type ChatState,
  type Conversation,
  finishStreaming,
  nextMessageId,
  resetConversation,
  type StreamingChatStateSlice,
  selectActiveConversation,
  selectActiveConversationId,
  selectActiveMessages,
  selectChatError,
  selectIsStreaming,
  selectStreamingMessageId,
  setActiveConversation,
  startStreaming,
  streamError,
  streamingChatReducer,
  streamingChatSlice,
} from './chatSlice';
export {
  defaultResponseMatcher,
  type FakeResponse,
  type ResponseMatcher,
  tokenize,
} from './mocks/fakeResponses';

export {
  type FakeStreamConfig,
  fakeStream,
} from './mocks/fakeStreamService';
export {
  type UseChatStreamOptions,
  type UseChatStreamReturn,
  useChatStream,
} from './useChatStream';
