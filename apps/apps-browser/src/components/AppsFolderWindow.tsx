import { useGetAppsQuery } from '../api/appsApi';
import { sortApps, computeSummaryStats } from '../domain/sorting';
import { AppIcon } from './AppIcon';
import './AppsFolderWindow.css';

export interface AppsFolderWindowProps {
  onSelectApp?: (appId: string) => void;
  onOpenApp?: (appId: string) => void;
}

function StatusSummary({ stats }: { stats: ReturnType<typeof computeSummaryStats> }) {
  const hasUnhealthy = stats.unhealthy > 0;
  return (
    <span
      data-part="apps-folder-status"
      data-variant={hasUnhealthy ? 'warning' : undefined}
    >
      {stats.mounted} apps &middot;{' '}
      {hasUnhealthy
        ? `\u26A0 ${stats.unhealthy} unhealthy`
        : `${stats.healthy} healthy`}
      {' '}&middot; {stats.required} required
    </span>
  );
}

export function AppsFolderWindow({ onSelectApp, onOpenApp }: AppsFolderWindowProps) {
  const { data: apps, isLoading, isError, refetch } = useGetAppsQuery();

  if (isLoading) {
    return (
      <div data-part="apps-folder">
        <div data-part="apps-folder-message">Loading apps&hellip;</div>
      </div>
    );
  }

  if (isError || !apps) {
    return (
      <div data-part="apps-folder">
        <div data-part="apps-folder-message" data-variant="error">
          Failed to load apps.
        </div>
      </div>
    );
  }

  const sorted = sortApps(apps);
  const stats = computeSummaryStats(apps);

  return (
    <div data-part="apps-folder">
      <div data-part="apps-folder-toolbar">
        <StatusSummary stats={stats} />
        <button
          type="button"
          data-part="apps-folder-refresh"
          onClick={() => refetch()}
          aria-label="Refresh"
        >
          &#x27F3;
        </button>
      </div>
      <div data-part="apps-folder-grid">
        {sorted.map((app) => (
          <AppIcon
            key={app.app_id}
            app={app}
            onClick={() => onSelectApp?.(app.app_id)}
            onDoubleClick={() => onOpenApp?.(app.app_id)}
          />
        ))}
      </div>
    </div>
  );
}
