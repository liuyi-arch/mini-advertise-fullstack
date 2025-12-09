import type { Ad, FormConfig } from './types';

const API_BASE_URL = '/api';

// Helper function to handle fetch requests
async function fetchData<T>(endpoint: string, options: RequestInit = {}): Promise<{ data: T }> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const responseData = await response.json();

  if (!response.ok || !responseData.success) {
    const error = new Error(responseData.message || 'Something went wrong');
    throw error;
  }

  // 直接返回后端数据中的 data 字段
  return { data: responseData.data };
}

// Form configuration service
export const formService = {
  getConfig: () => fetchData<FormConfig>('/form-config'),
};

// Advertisements service
export const adService = {
  getAll: () => fetchData<Ad[]>('/ads'),
  getById: (id: number) => fetchData<Ad>(`/ads/${id}`),
  create: (ad: Omit<Ad, 'id'>) => 
    fetchData<Ad>('/ads', {
      method: 'POST',
      body: JSON.stringify(ad),
    }),
  update: (id: number, ad: Partial<Ad>) =>
    fetchData<Ad>(`/ads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ad),
    }),
  delete: (id: number) =>
    fetchData<{ success: boolean }>(`/ads/${id}`, {
      method: 'DELETE',
    }),
  incrementClick: (id: number) =>
    fetchData<{ success: boolean }>(`/ads/${id}/click`, {
      method: 'POST',
    }),
};
