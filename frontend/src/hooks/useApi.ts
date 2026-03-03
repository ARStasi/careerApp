import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

// Generic hooks for CRUD operations
export function useList<T>(key: string, url: string) {
  return useQuery<T[]>({
    queryKey: [key],
    queryFn: () => api.get(url).then((r) => r.data),
  });
}

export function useGet<T>(key: string[], url: string, enabled = true) {
  return useQuery<T>({
    queryKey: key,
    queryFn: () => api.get(url).then((r) => r.data),
    enabled,
  });
}

export function useCreate<T>(url: string, invalidateKeys: string[]) {
  const qc = useQueryClient();
  return useMutation<T, Error, Partial<T>>({
    mutationFn: (data) => api.post(url, data).then((r) => r.data),
    onSuccess: () => {
      invalidateKeys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    },
  });
}

export function useUpdate<T>(url: string, invalidateKeys: string[]) {
  const qc = useQueryClient();
  return useMutation<T, Error, Partial<T>>({
    mutationFn: (data) => api.put(url, data).then((r) => r.data),
    onSuccess: () => {
      invalidateKeys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    },
  });
}

export function useDelete(url: string, invalidateKeys: string[]) {
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => api.delete(url).then(() => undefined),
    onSuccess: () => {
      invalidateKeys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    },
  });
}
