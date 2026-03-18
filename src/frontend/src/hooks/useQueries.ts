import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserProfile } from "../backend.d";
import { useActor } from "./useActor";

export function useGetCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[Principal, UserProfile]>>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetConversations(enabled: boolean) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getConversations();
    },
    enabled: !!actor && !isFetching && enabled,
    refetchInterval: enabled ? 5000 : false,
  });
}

export function useGetMessages(
  conversationWith: Principal | null,
  enabled: boolean,
) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["messages", conversationWith?.toString()],
    queryFn: async () => {
      if (!actor || !conversationWith) return [];
      return actor.getMessages(conversationWith);
    },
    enabled: !!actor && !isFetching && !!conversationWith && enabled,
    refetchInterval: enabled && conversationWith ? 3000 : false,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("No actor");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      recipient,
      content,
    }: { recipient: Principal; content: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.sendMessage(recipient, content);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.recipient.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useVerifySecret() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (secret: string) => {
      if (!actor) throw new Error("No actor");
      return actor.verifySecret(secret);
    },
  });
}

export function useGetUserProfile(principal: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getUserProfile(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}
