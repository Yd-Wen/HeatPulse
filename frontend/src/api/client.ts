import axios from 'axios';
import type { Keyword, Hotspot, Stats, ScanStatus } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Keywords
export const keywordsApi = {
  getAll: () => api.get<Keyword[]>('/keywords').then((res) => res.data),
  create: (keyword: string, category?: string) =>
    api.post<Keyword>('/keywords', { keyword, category }).then((res) => res.data),
  update: (id: number, data: Partial<Keyword>) =>
    api.patch<Keyword>(`/keywords/${id}`, data).then((res) => res.data),
  delete: (id: number) => api.delete(`/keywords/${id}`),
};

// Hotspots
export const hotspotsApi = {
  getAll: (params?: { limit?: number; offset?: number; keyword_id?: number }) =>
    api.get<{ data: Hotspot[]; pagination: any }>('/hotspots', { params })
      .then((res) => res.data.data),
  getById: (id: number) =>
    api.get<Hotspot>(`/hotspots/${id}`).then((res) => res.data),
  markAsRead: (id: number) =>
    api.post(`/hotspots/${id}/read`).then((res) => res.data),
  delete: (id: number) =>
    api.delete(`/hotspots/${id}`).then((res) => res.data),
};

// Scan
export const scanApi = {
  trigger: (keywordIds?: number[], sources?: string[]) =>
    api.post('/scan/trigger', { keyword_ids: keywordIds, sources }).then((res) => res.data),
  getStatus: () => api.get<ScanStatus>('/scan/status').then((res) => res.data),
};

// Stats
export const statsApi = {
  get: () => api.get<Stats>('/stats').then((res) => res.data),
};

export default api;
