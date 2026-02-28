import { useGetAppsQuery } from '../api/appsApi';
import { GetInfoWindow, type GetInfoWindowProps } from './GetInfoWindow';

export interface GetInfoWindowByAppIdProps extends Omit<GetInfoWindowProps, 'app'> {
  appId: string;
}

export function GetInfoWindowByAppId({ appId, ...rest }: GetInfoWindowByAppIdProps) {
  const { data: apps } = useGetAppsQuery();
  const app = apps?.find((a) => a.app_id === appId);

  if (!app) {
    return (
      <div style={{ padding: 16, fontFamily: 'var(--hc-font-family)', color: '#777' }}>
        Loading module info&hellip;
      </div>
    );
  }

  return <GetInfoWindow app={app} {...rest} />;
}
