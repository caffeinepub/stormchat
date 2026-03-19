import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Message, UserProfile, UserStatus } from "../backend.d";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useGetCallerProfile() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  return useQuery<UserProfile | null>({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
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

// File messages are encoded in content as JSON: {"_f":"<url>","_n":"<filename>"}
export function encodeFileMessage(url: string, filename: string): string {
  return JSON.stringify({ _f: url, _n: filename });
}

export function decodeFileMessage(
  content: string,
): { url: string; filename: string } | null {
  if (!content.startsWith('{"_f"')) return null;
  try {
    const parsed = JSON.parse(content);
    if (parsed._f && parsed._n) return { url: parsed._f, filename: parsed._n };
  } catch {
    // not a file message
  }
  return null;
}

export function useSendMessage() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      recipient,
      content,
    }: { recipient: Principal; content: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.sendMessage(recipient, content);
    },
    onMutate: async ({ recipient, content }) => {
      await queryClient.cancelQueries({
        queryKey: ["messages", recipient.toString()],
      });
      const previousMessages = queryClient.getQueryData<Message[]>([
        "messages",
        recipient.toString(),
      ]);
      const senderPrincipal = identity?.getPrincipal();
      if (senderPrincipal) {
        const optimisticMessage: Message = {
          sender: senderPrincipal,
          recipient,
          timestamp: BigInt(Date.now()) * 1_000_000n,
          content,
          isRead: false,
        };
        queryClient.setQueryData<Message[]>(
          ["messages", recipient.toString()],
          [...(previousMessages ?? []), optimisticMessage],
        );
      }
      return { previousMessages };
    },
    onError: (_err, variables, context) => {
      if (context?.previousMessages !== undefined) {
        queryClient.setQueryData(
          ["messages", variables.recipient.toString()],
          context.previousMessages,
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.recipient.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useMarkAsRead() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (sender: Principal) => {
      if (!actor) throw new Error("No actor");
      return actor.markAsRead(sender);
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

export function useGetTypingStatus(from: Principal | null, enabled: boolean) {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["typingStatus", from?.toString()],
    queryFn: async () => {
      if (!actor || !from) return false;
      return actor.getTypingStatus(from);
    },
    enabled: !!actor && !isFetching && !!from && enabled,
    refetchInterval: enabled && from ? 2000 : false,
  });
}

export function useGetUserStatuses(users: Principal[], enabled: boolean) {
  const { actor, isFetching } = useActor();
  const key = users.map((u) => u.toString()).join(",");
  return useQuery<Array<[Principal, UserStatus]>>({
    queryKey: ["userStatuses", key],
    queryFn: async () => {
      if (!actor || users.length === 0) return [];
      return actor.getUserStatuses(users);
    },
    enabled: !!actor && !isFetching && users.length > 0 && enabled,
    refetchInterval: enabled && users.length > 0 ? 10000 : false,
  });
}

export function useSetOnlineStatus() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (isOnline: boolean) => {
      if (!actor) return;
      await actor.setOnlineStatus(isOnline);
    },
    onError: () => {
      // silent fail
    },
  });
}

export function useSetTyping() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      recipient,
      isTyping,
    }: { recipient: Principal; isTyping: boolean }) => {
      if (!actor) return;
      await actor.setTyping(recipient, isTyping);
    },
    onError: () => {
      // silent fail
    },
  });
}
