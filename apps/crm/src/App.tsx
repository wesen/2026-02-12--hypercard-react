import {
  ChatSidebar,
  HyperCardShell,
  StandardDebugPane,
  useChatStream,
  useStandardDebugHooks,
} from '@hypercard/engine';
import { crmSharedActions, crmSharedSelectors } from './app/cardRuntime';
import { crmResponseMatcher } from './chat/crmChatResponses';
import { CRM_STACK } from './domain/stack';

const snapshotSelector = (state: any) => ({
  navigation: state.navigation,
  contacts: state.contacts,
  companies: state.companies,
  deals: state.deals,
  activities: state.activities,
  streamingChat: state.streamingChat,
  runtime: state.hypercardRuntime,
});

export function App() {
  const debugHooks = useStandardDebugHooks();
  const chat = useChatStream({ responseMatcher: crmResponseMatcher });

  return (
    <HyperCardShell
      stack={CRM_STACK}
      sharedSelectors={crmSharedSelectors}
      sharedActions={crmSharedActions}
      debugHooks={debugHooks}
      layoutMode="debugPane"
      renderDebugPane={() => (
        <div style={{ display: 'flex', height: '100%' }}>
          <ChatSidebar
            messages={chat.messages}
            isStreaming={chat.isStreaming}
            onSend={chat.send}
            onCancel={chat.cancel}
            suggestions={['Show open deals', 'Who are my VIPs?', 'Pipeline summary', 'Recent activities']}
            title="CRM Assistant"
            placeholder="Ask about contacts, deals, pipeline…"
            footer={<span>Model: fake-gpt-4 · Streaming</span>}
          />
          <div style={{ flex: '0 0 auto', height: '100%' }}>
            <StandardDebugPane title="CRM Debug" snapshotSelector={snapshotSelector} />
          </div>
        </div>
      )}
      navShortcuts={[
        { card: 'home', icon: '🏠' },
        { card: 'contacts', icon: '👤' },
        { card: 'companies', icon: '🏢' },
        { card: 'deals', icon: '💰' },
        { card: 'pipeline', icon: '📊' },
        { card: 'activityLog', icon: '📝' },
      ]}
    />
  );
}
