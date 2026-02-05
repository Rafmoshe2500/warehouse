import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import groupService from '../api/services/groupService';
import { QUERY_KEYS } from '../lib/queryKeys';

export const useGroups = () => {
    const queryClient = useQueryClient();

    // 1. Fetch Groups
    const {
        data: groupsData,
        isLoading: loading,
        error,
        refetch
    } = useQuery({
        queryKey: QUERY_KEYS.groups.all,
        queryFn: async () => {
            const response = await groupService.getGroups();
            return response.groups || [];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // 2. Create Group Mutation
    const createGroupMutation = useMutation({
        mutationFn: (groupData) => groupService.createGroup(groupData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups.all });
        }
    });

    // 3. Update Group Mutation
    const updateGroupMutation = useMutation({
        mutationFn: ({ id, data }) => groupService.updateGroup(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups.all });
        }
    });

    // 4. Delete Group Mutation
    const deleteGroupMutation = useMutation({
        mutationFn: ({ id, reason }) => groupService.deleteGroup(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups.all });
        }
    });

    return {
        groups: groupsData || [],
        loading,
        error,
        refetch,
        createGroup: createGroupMutation.mutateAsync,
        updateGroup: updateGroupMutation.mutateAsync,
        deleteGroup: deleteGroupMutation.mutateAsync,
        isCreating: createGroupMutation.isPending,
        isUpdating: updateGroupMutation.isPending,
        isDeleting: deleteGroupMutation.isPending
    };
};
