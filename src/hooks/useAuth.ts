"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { LOGIN_PATH } from "@/const";
import { apiGet } from "@/lib/api-client";
import { logout as logoutAction } from "@/lib/server/actions/auth";

type User = {
  id: number;
  email: string;
  name: string | null;
  role: string;
};

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = LOGIN_PATH } = options ?? {};
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: user, isLoading, error, refetch } = useQuery<User | null>({
    queryKey: ["auth", "me"],
    queryFn: () => apiGet<User | null>("/api/auth/me"),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const logout = useCallback(async () => {
    await logoutAction();
    queryClient.invalidateQueries();
    router.push(redirectPath);
  }, [queryClient, router, redirectPath]);

  useEffect(() => {
    if (redirectOnUnauthenticated && !isLoading && !user) {
      if (window.location.pathname !== redirectPath) {
        router.push(redirectPath);
      }
    }
  }, [redirectOnUnauthenticated, isLoading, user, router, redirectPath]);

  return useMemo(
    () => ({
      user: user ?? null,
      isAuthenticated: !!user,
      isLoading,
      error,
      logout,
      refresh: refetch,
    }),
    [user, isLoading, error, logout, refetch],
  );
}
