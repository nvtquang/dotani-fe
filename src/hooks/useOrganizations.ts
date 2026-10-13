import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { organizationService } from '../services/organizationService';
import type { OrganizationUnitFormValues } from '../types/organization';

export const organizationKeys = {
  all: ['organizations'] as const,
  public: ['organizations', 'public'] as const,
  detail: (id: string) => ['organizations', 'detail', id] as const,
  members: (id: string) => ['organizations', 'detail', id, 'members'] as const,
};

export const useOrganizations = (enabled = true) =>
  useQuery({
    queryKey: organizationKeys.all,
    queryFn: organizationService.list,
    enabled,
    staleTime: 5 * 60_000,
  });

export const usePublicOrganizations = () =>
  useQuery({
    queryKey: organizationKeys.public,
    queryFn: organizationService.publicBranches,
  });

export const useOrganization = (id: string) =>
  useQuery({
    queryKey: organizationKeys.detail(id),
    queryFn: () => organizationService.findById(id),
    enabled: Boolean(id),
  });

export const useOrganizationMembers = (id: string) =>
  useQuery({
    queryKey: organizationKeys.members(id),
    queryFn: () => organizationService.members(id),
    enabled: Boolean(id),
  });

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: OrganizationUnitFormValues) => organizationService.create(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: organizationKeys.all }),
  });
};

export const useUpdateOrganization = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: OrganizationUnitFormValues) => organizationService.update(id, values),
    onSuccess: (organization) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
      queryClient.setQueryData(organizationKeys.detail(id), organization);
    },
  });
};

export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => organizationService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: organizationKeys.all }),
  });
};
