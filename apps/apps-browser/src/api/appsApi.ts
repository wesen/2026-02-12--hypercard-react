import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { AppsManifestResponse, ModuleReflectionDocument, ReflectionResult } from '../domain/types';

export const appsApi = createApi({
  reducerPath: 'appsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '' }),
  tagTypes: ['AppsList', 'Reflection'],
  endpoints: (builder) => ({
    getApps: builder.query<import('../domain/types').AppManifestDocument[], void>({
      query: () => '/api/os/apps',
      providesTags: ['AppsList'],
      transformResponse: (response: AppsManifestResponse) => response.apps ?? [],
    }),

    getReflection: builder.query<ReflectionResult, string>({
      query: (appId) => ({
        url: `/api/os/apps/${appId}/reflection`,
        validateStatus: (response) => response.status === 200 || response.status === 501,
      }),
      providesTags: (_result, _error, appId) => [{ type: 'Reflection', id: appId }],
      transformResponse: (response: ModuleReflectionDocument | string, meta): ReflectionResult => {
        const status = (meta as { response?: { status: number } })?.response?.status;
        if (status === 501) {
          return { _unsupported: true, app_id: '' };
        }
        return response as ModuleReflectionDocument;
      },
    }),

    getSchemaDocument: builder.query<unknown, string>({
      query: (schemaUrl) => ({
        url: schemaUrl,
        responseHandler: async (response) => {
          const contentType = response.headers.get('content-type') ?? '';
          if (contentType.includes('application/json')) {
            return response.json();
          }
          return response.text();
        },
      }),
    }),
  }),
});

export const { useGetAppsQuery, useGetReflectionQuery, useLazyGetSchemaDocumentQuery } = appsApi;
