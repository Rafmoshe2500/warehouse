import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminService from '../api/services/adminService';
import { QUERY_KEYS } from '../lib/queryKeys';

export const useUsers = () => {
    const queryClient = useQueryClient();

    // 1. Fetch Users
    const {
        data: usersData,
        isLoading: loading,
        error,
        refetch
    } = useQuery({
        queryKey: QUERY_KEYS.users.all,
        queryFn: async () => {
            const response = await adminService.getUsers();
            return response.users || [];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // 2. Create User Mutation
    const createUserMutation = useMutation({
        mutationFn: (userData) => adminService.createUser(userData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
        }
    });

    // 3. Update User Mutation
    const updateUserMutation = useMutation({
        mutationFn: ({ id, data }) => adminService.updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
        }
    });

    // 4. Delete User Mutation
    const deleteUserMutation = useMutation({
        mutationFn: ({ id, reason }) => adminService.deleteUser(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
        }
    });

    return {
        users: usersData || [],
        loading,
        error,
        refetch,
        createUser: createUserMutation.mutateAsync,
        updateUser: updateUserMutation.mutateAsync,
        deleteUser: deleteUserMutation.mutateAsync,
        isCreating: createUserMutation.isPending,
        isUpdating: updateUserMutation.isPending,
        isDeleting: deleteUserMutation.isPending
    };
};
