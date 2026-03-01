import { useGetAppsQuery } from '../api/appsApi';
import type { AppsSummaryStats } from '../domain/sorting';
import { computeSummaryStats, hasUnhealthyRequired, sortApps } from '../domain/sorting';
import type { AppManifestDocument } from '../domain/types';
import './HealthDashboardWindow.css';

export interface HealthDashboardWindowProps {
  onClickModule?: (appId: string) => void;
}

function DegradedBanner({ apps }: { apps: AppManifestDocument[] }) {
  if (!hasUnhealthyRequired(apps)) return null;
  const count = apps.filter((a) => a.required && !a.healthy).length;
  return (
    <div data-part="degraded-banner">
      {'\u26A0'} System degraded &mdash; {count} required module{count > 1 ? 's' : ''} unhealthy
    </div>
  );
}

function SummaryCards({ stats, hasUnhealthyReq }: { stats: AppsSummaryStats; hasUnhealthyReq: boolean }) {
  const hasDegraded = stats.unhealthy > 0;
  return (
    <div data-part="summary-cards">
      <div data-part="summary-card">
        <div data-part="summary-card-value">{stats.mounted}</div>
        <div data-part="summary-card-label">mounted</div>
      </div>
      <div data-part="summary-card" data-variant={hasDegraded ? 'warning' : undefined}>
        <div data-part="summary-card-value">
          {hasDegraded && '\u26A0 '}
          {stats.healthy}
        </div>
        <div data-part="summary-card-label">healthy</div>
        {hasDegraded && <div data-part="summary-card-subtitle">of {stats.mounted}</div>}
      </div>
      <div data-part="summary-card" data-variant={hasUnhealthyReq ? 'warning' : undefined}>
        <div data-part="summary-card-value">
          {hasUnhealthyReq && '\u26A0 '}
          {hasUnhealthyReq ? stats.unhealthy : stats.required}
        </div>
        <div data-part="summary-card-label">{hasUnhealthyReq ? 'required unhealthy' : 'required'}</div>
      </div>
    </div>
  );
}

function HealthModuleRow({ app, onClick }: { app: AppManifestDocument; onClick?: () => void }) {
  const healthy = app.healthy !== false;
  return (
    <div
      data-part="health-module-row"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick?.();
      }}
    >
      <div data-part="health-module-row-main">
        <span data-part="health-module-health" data-variant={healthy ? 'healthy' : 'unhealthy'}>
          {healthy ? '\u25CF' : '\u25CB'}
        </span>
        <span data-part="health-module-name">{app.name}</span>
        <span data-part="health-module-status" data-variant={healthy ? undefined : 'unhealthy'}>
          {healthy ? 'healthy' : 'UNHEALTHY'}
        </span>
        <span data-part="health-module-badges">
          {app.required && <span title="Required">{'\u25C8'} required</span>}
          {app.reflection?.available && <span title="Reflective"> {'\u2605'} reflective</span>}
        </span>
        <span data-part="health-module-url">/api/apps/{app.app_id}/</span>
      </div>
      {!healthy && app.health_error && (
        <div data-part="health-module-error">
          {app.health_error}
          {app.required && (
            <div data-part="health-module-error-footer">This is a required module. System may be degraded.</div>
          )}
        </div>
      )}
    </div>
  );
}

export function HealthDashboardWindow({ onClickModule }: HealthDashboardWindowProps) {
  const { data: apps, isLoading, refetch } = useGetAppsQuery();

  if (isLoading || !apps) {
    return (
      <div data-part="health-dashboard">
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777' }}>
          Loading&hellip;
        </div>
      </div>
    );
  }

  const sorted = sortApps(apps);
  const stats = computeSummaryStats(apps);
  const unhealthyReq = hasUnhealthyRequired(apps);

  return (
    <div data-part="health-dashboard">
      <div data-part="health-dashboard-toolbar">
        <button type="button" data-part="apps-folder-refresh" onClick={() => refetch()} aria-label="Refresh">
          &#x27F3;
        </button>
      </div>
      <div data-part="health-dashboard-body">
        <DegradedBanner apps={apps} />
        <SummaryCards stats={stats} hasUnhealthyReq={unhealthyReq} />
        <div data-part="health-module-list">
          <div data-part="health-module-list-header">Modules</div>
          {sorted.map((app) => (
            <HealthModuleRow key={app.app_id} app={app} onClick={() => onClickModule?.(app.app_id)} />
          ))}
        </div>
      </div>
    </div>
  );
}
