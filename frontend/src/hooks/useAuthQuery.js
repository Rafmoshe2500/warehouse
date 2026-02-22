import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import authService from '../api/services/authService';
import { QUERY_KEYS } from '../lib/queryKeys';

export const useAuthQuery = () => {
    const queryClient = useQueryClient();
    
    // Extract token immediately (lazy init to run once)
    const [hashedToken] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('hashedToken');
    });

    // 1. Domain Login Handshake (Runs automatically if hashedToken exists)
    const domainLoginQuery = useQuery({
        queryKey: ['auth', 'domain-handshake', hashedToken],
        queryFn: async () => {
            const response = await authService.domainLogin(hashedToken);
            return response;
        },
        enabled: !!hashedToken, // Only run if token is in URL
        retry: false,
        staleTime: Infinity, // Run once per token
        gcTime: 0, // Don't persist this special query
    });

    // Effect to invalidate user query after successful handshake
    useEffect(() => {
        if (domainLoginQuery.isSuccess && hashedToken) {
            // Invalidate user query to ensure we fetch the fresh user data from server
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.user });
        }
    }, [domainLoginQuery.isSuccess, hashedToken, queryClient]);

    // 2. User Data Query (The Main Auth State)
    // Dependencies: Wait for domain login if we have a token
    const shouldFetchUser = !hashedToken || (hashedToken && domainLoginQuery.isSuccess) || (hashedToken && domainLoginQuery.isError);

    const {
        data: user,
        isLoading: isUserLoading,
        error,
        isError
    } = useQuery({
        queryKey: QUERY_KEYS.auth.user,
        queryFn: async () => {
            try {
                return await authService.getMe();
            } catch (err) {
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    return null;
                }
                throw err;
            }
        },
        enabled: shouldFetchUser,
        retry: false,
        staleTime: 1000 * 60 * 15,
        refetchOnWindowFocus: false,
    });

    // Calculate aggregated loading state
    const isLoading = (!!hashedToken && domainLoginQuery.isLoading) || isUserLoading;

    // 3. Login Mutation (Manual)
    const loginMutation = useMutation({
        mutationFn: ({ username, password }) => authService.login(username, password),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.user });
        },
    });

    // 4. Logout Mutation
    const logoutMutation = useMutation({
        mutationFn: () => authService.logout(),
        onSuccess: () => {
            queryClient.setQueryData(QUERY_KEYS.auth.user, null);
            queryClient.removeQueries({ queryKey: QUERY_KEYS.items.all });
            queryClient.removeQueries({ queryKey: QUERY_KEYS.users.all });
            queryClient.removeQueries({ queryKey: QUERY_KEYS.logs.list });
        },
    });

    return {
        user: user || null,
        isAuthenticated: !!user,
        isLoading,
        error: isError ? error : (domainLoginQuery.error || null),
        
        login: loginMutation.mutateAsync,
        // domainLogin is now automatic, but we expose manual triggering if ever needed (rare)
        logout: logoutMutation.mutateAsync,
        
        isLoggingIn: loginMutation.isPending,
        isLoggingOut: logoutMutation.isPending,
    };
};
