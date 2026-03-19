import type { Conversation, Message, UserProfile } from "@/backend.d";
import { loadConfig } from "@/config";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import {
  decodeFileMessage,
  encodeFileMessage,
  useGetAllUsers,
  useGetConversations,
  useGetMessages,
  useGetTypingStatus,
  useGetUserStatuses,
  useMarkAsRead,
  useSendMessage,
  useSetOnlineStatus,
  useSetTyping,
} from "@/hooks/useQueries";
import { StorageClient } from "@/utils/StorageClient";
import { HttpAgent } from "@icp-sdk/core/agent";
import type { Principal } from "@icp-sdk/core/principal";
import {
  ChevronLeft,
  Download,
  ImageIcon,
  Loader2,
  MoreVertical,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
  Video,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import NewChatModal from "./NewChatModal";
import ProfileSetup from "./ProfileSetup";

// Extend Message with optional isRead field from backend
type MessageWithRead = Message & { isRead?: boolean; _optimistic?: boolean };

function formatTime(ts: bigint) {
  const ms = Number(ts / 1000000n);
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatConvTime(ts: bigint) {
  const ms = Number(ts / 1000000n);
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatLastSeen(nanoTs: bigint): string {
  const ms = Number(nanoTs / 1_000_000n);
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "offline";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 60_000) return "just now";
  if (d.toDateString() === now.toDateString()) {
    return `last seen ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  return `last seen ${d.toLocaleDateString([], { month: "short", day: "numeric" })}`;
}

function FileMessageBubble({
  fileUrl,
  filename,
}: { fileUrl: string; filename: string }) {
  const looksLikeImage = /\.(jpe?g|png|gif|webp|svg|bmp|avif)($|\?)/i.test(
    filename,
  );

  if (looksLikeImage) {
    return (
      <a href={fileUrl} target="_blank" rel="noreferrer">
        <img
          src={fileUrl}
          alt={filename}
          className="rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
          style={{ maxWidth: "200px", maxHeight: "200px" }}
        />
      </a>
    );
  }

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 text-sm underline underline-offset-2 hover:opacity-80 transition-opacity"
    >
      <Download className="w-4 h-4 shrink-0" />
      <span className="truncate max-w-[160px]">{filename}</span>
    </a>
  );
}

/** Read receipt ticks shown under outgoing messages */
function ReadTick({
  isRead,
  isOptimistic,
}: { isRead?: boolean; isOptimistic?: boolean }) {
  if (isOptimistic || !isRead) {
    return (
      <span
        style={{
          fontSize: "11px",
          color: "rgba(180,210,180,0.7)",
          letterSpacing: "-1px",
          fontWeight: 700,
          lineHeight: 1,
        }}
        aria-label="Sent"
        title="Sent"
      >
        ✓
      </span>
    );
  }
  return (
    <span
      style={{
        fontSize: "11px",
        color: "#60b4ff",
        letterSpacing: "-1px",
        fontWeight: 700,
        lineHeight: 1,
      }}
      aria-label="Seen"
      title="Seen"
    >
      ✓✓
    </span>
  );
}

interface MessagingOverlayProps {
  onClose: () => void;
  callerProfile: UserProfile | null;
}

export default function MessagingOverlay({
  onClose,
  callerProfile,
}: MessagingOverlayProps) {
  const { identity } = useInternetIdentity();
  const [profile, setProfile] = useState<UserProfile | null>(callerProfile);
  const [selectedParty, setSelectedParty] = useState<Principal | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(
    null,
  );
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [storageClient, setStorageClient] = useState<StorageClient | null>(
    null,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: conversations = [] } = useGetConversations(!!profile);
  const { data: messages = [] } = useGetMessages(
    selectedParty,
    !!profile && !!selectedParty,
  );
  const { data: allUsers = [] } = useGetAllUsers();
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();
  const setOnlineStatus = useSetOnlineStatus();
  const setTyping = useSetTyping();

  // Fetch typing status for selected party
  const { data: isPartnerTyping = false } = useGetTypingStatus(
    selectedParty,
    !!profile && !!selectedParty,
  );

  // Fetch statuses for selected party (for online/last seen in header)
  const selectedPartyArr: Principal[] = selectedParty ? [selectedParty] : [];
  const { data: selectedPartyStatuses = [] } = useGetUserStatuses(
    selectedPartyArr,
    !!profile && !!selectedParty,
  );

  // Fetch statuses for all conversation participants (for sidebar dots)
  const conversationPrincipals: Principal[] = conversations.map(
    (c) => c.otherParty,
  );
  const { data: allConvStatuses = [] } = useGetUserStatuses(
    conversationPrincipals,
    !!profile && conversationPrincipals.length > 0,
  );

  const selfPrincipal = identity?.getPrincipal().toString() ?? "";

  // Helper: get UserStatus for a principal
  function getStatusFor(
    statuses: Array<[Principal, { isOnline: boolean; lastSeen: bigint }]>,
    principal: Principal,
  ) {
    const entry = statuses.find(([p]) => p.toString() === principal.toString());
    return entry ? entry[1] : null;
  }

  // Heartbeat: mark self as online every 30s while profile is set
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally runs only when profile presence changes
  useEffect(() => {
    if (!profile) return;
    setOnlineStatus.mutate(true);
    const interval = setInterval(() => {
      setOnlineStatus.mutate(true);
    }, 30_000);
    return () => {
      clearInterval(interval);
      setOnlineStatus.mutate(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!profile]);

  useEffect(() => {
    if (callerProfile && !profile) {
      setProfile(callerProfile);
    }
  }, [callerProfile, profile]);

  useEffect(() => {
    let cancelled = false;
    loadConfig().then((config) => {
      if (cancelled) return;
      const agent = new HttpAgent({
        host: config.backend_host,
        identity: identity ?? undefined,
      });
      const client = new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
      setStorageClient(client);
    });
    return () => {
      cancelled = true;
    };
  }, [identity]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: ref.current is stable
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: markAsRead.mutate is stable reference
  useEffect(() => {
    if (selectedParty && messages.length > 0) {
      markAsRead.mutate(selectedParty);
    }
  }, [selectedParty, messages.length]);

  function handleSelectConversation(conv: Conversation) {
    setSelectedParty(conv.otherParty);
    const userEntry = allUsers.find(
      ([p]) => p.toString() === conv.otherParty.toString(),
    );
    setSelectedProfile(userEntry ? userEntry[1] : null);
    setMobileView("chat");
    markAsRead.mutate(conv.otherParty);
  }

  function handleSelectNewChatUser(principal: Principal) {
    setSelectedParty(principal);
    const userEntry = allUsers.find(
      ([p]) => p.toString() === principal.toString(),
    );
    setSelectedProfile(userEntry ? userEntry[1] : null);
    setShowNewChat(false);
    setMobileView("chat");
    markAsRead.mutate(principal);
  }

  function handleBackToList() {
    setMobileView("list");
    setSelectedParty(null);
    setSelectedProfile(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setAttachedFile(file);
    e.target.value = "";
  }

  function handleMessageInput(e: React.ChangeEvent<HTMLInputElement>) {
    setMessageText(e.target.value);
    if (!selectedParty) return;

    // Signal typing = true
    setTyping.mutate({ recipient: selectedParty, isTyping: true });

    // Debounce: after 1500ms idle, signal typing = false
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (selectedParty) {
        setTyping.mutate({ recipient: selectedParty, isTyping: false });
      }
    }, 1500);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if ((!messageText.trim() && !attachedFile) || !selectedParty) return;

    // Stop typing indicator immediately on send
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTyping.mutate({ recipient: selectedParty, isTyping: false });

    let content = messageText.trim();

    if (attachedFile) {
      if (!storageClient) return;
      setIsUploading(true);
      try {
        const bytes = new Uint8Array(await attachedFile.arrayBuffer());
        const { hash } = await storageClient.putFile(bytes);
        const fileUrl = await storageClient.getDirectURL(hash);
        content = encodeFileMessage(fileUrl, attachedFile.name);
      } catch (err) {
        console.error("Upload failed", err);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
      setAttachedFile(null);
    }

    setMessageText("");
    try {
      await sendMessage.mutateAsync({
        recipient: selectedParty,
        content,
      });
    } catch {
      if (!attachedFile) setMessageText(content);
    }
  }

  const filteredConversations = conversations.filter((c) => {
    if (!search) return true;
    const userEntry = allUsers.find(
      ([p]) => p.toString() === c.otherParty.toString(),
    );
    return userEntry?.[1]?.displayName
      ?.toLowerCase()
      .includes(search.toLowerCase());
  });

  const isSending = isUploading;

  // Determine chat header status text
  const selectedPartyStatus = selectedParty
    ? getStatusFor(selectedPartyStatuses, selectedParty)
    : null;

  let headerStatusText = "Online";
  let headerStatusStyle: React.CSSProperties = {
    color: "#4ade80",
    textShadow: "0 0 8px rgba(74,222,128,0.5)",
  };

  if (isPartnerTyping) {
    headerStatusText = "typing...";
    headerStatusStyle = { color: "#86efac" };
  } else if (selectedPartyStatus) {
    if (selectedPartyStatus.isOnline) {
      headerStatusText = "Online";
      headerStatusStyle = {
        color: "#4ade80",
        textShadow: "0 0 8px rgba(74,222,128,0.5)",
      };
    } else {
      headerStatusText = formatLastSeen(selectedPartyStatus.lastSeen);
      headerStatusStyle = { color: "#60a5fa" };
    }
  }

  if (!profile) {
    return (
      <OverlayShell onClose={onClose}>
        <ProfileSetup onComplete={(p) => setProfile(p)} />
      </OverlayShell>
    );
  }

  return (
    <>
      <OverlayShell onClose={onClose}>
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <div
            className={`${
              mobileView === "chat" ? "hidden" : "flex"
            } md:flex w-full md:w-72 shrink-0 flex-col`}
            style={{
              borderRight: "1px solid rgba(100,150,255,0.12)",
              background:
                "linear-gradient(180deg, rgba(20,35,60,0.98), rgba(10,18,32,0.98))",
            }}
          >
            {/* Sidebar header */}
            <div
              className="flex items-center justify-between p-4"
              style={{
                borderBottom: "1px solid rgba(100,150,255,0.12)",
                background:
                  "linear-gradient(180deg, rgba(25,42,72,0.6), transparent)",
              }}
            >
              <span
                className="font-bold text-base"
                style={{
                  color: "rgba(220,235,255,0.95)",
                  textShadow: "0 0 20px rgba(100,160,255,0.3)",
                }}
              >
                Storm
              </span>
              <button
                type="button"
                data-ocid="messaging.close_button"
                onClick={onClose}
                className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-blue-300" />
              </button>
            </div>

            {/* Search */}
            <div
              className="p-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-400" />
                <input
                  data-ocid="messaging.search_input"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations"
                  className="w-full pl-8 pr-3 py-2 rounded-lg text-sm text-white placeholder:text-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(100,150,255,0.18)",
                    fontSize: "16px",
                  }}
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div
                  data-ocid="messaging.conversations.empty_state"
                  className="p-6 text-center"
                >
                  <p className="text-blue-400 text-sm">No conversations yet</p>
                  <p className="text-blue-500 text-xs mt-1">
                    Start a new chat below
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv, idx) => {
                  const userEntry = allUsers.find(
                    ([p]) => p.toString() === conv.otherParty.toString(),
                  );
                  const contactProfile = userEntry?.[1];
                  const isSelected =
                    selectedParty?.toString() === conv.otherParty.toString();
                  const convStatus = getStatusFor(
                    allConvStatuses,
                    conv.otherParty,
                  );
                  const isOnline = convStatus?.isOnline ?? false;
                  return (
                    <button
                      key={conv.otherParty.toString()}
                      type="button"
                      data-ocid={`messaging.conversation.item.${idx + 1}`}
                      onClick={() => handleSelectConversation(conv)}
                      className="w-full flex items-center gap-3 px-4 py-3 transition-all text-left"
                      style={{
                        background: isSelected
                          ? "rgba(59,130,246,0.25)"
                          : "transparent",
                        borderLeft: isSelected
                          ? "3px solid rgba(99,179,237,0.9)"
                          : "3px solid transparent",
                        minHeight: "64px",
                        boxShadow: isSelected
                          ? "inset 0 0 20px rgba(59,130,246,0.08)"
                          : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected)
                          (e.currentTarget as HTMLElement).style.background =
                            "rgba(255,255,255,0.05)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected)
                          (e.currentTarget as HTMLElement).style.background =
                            "transparent";
                      }}
                    >
                      <div className="relative shrink-0">
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
                          style={{ background: "rgba(37,99,235,0.3)" }}
                        >
                          {contactProfile?.avatar ?? "👤"}
                        </div>
                        {isOnline && (
                          <span
                            className="absolute bottom-0 right-0 w-3 h-3 rounded-full"
                            style={{
                              background: "#22c55e",
                              border: "2px solid rgba(14,22,34,0.9)",
                              boxShadow: "0 0 8px #22c55e",
                            }}
                          />
                        )}
                        {!isOnline && convStatus && (
                          <span
                            className="absolute bottom-0 right-0 w-3 h-3 rounded-full"
                            style={{
                              background: "#6b7280",
                              border: "2px solid rgba(14,22,34,0.9)",
                            }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-semibold text-white truncate">
                            {contactProfile?.displayName ?? "Unknown"}
                          </span>
                          <span className="text-xs text-blue-500 ml-1 shrink-0">
                            {formatConvTime(conv.lastMessageTimestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-blue-400 truncate mt-0.5">
                          {conv.lastMessagePreview}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* New chat button */}
            <div
              className="p-3"
              style={{ borderTop: "1px solid rgba(100,150,255,0.12)" }}
            >
              <button
                type="button"
                data-ocid="messaging.new_chat.button"
                onClick={() => setShowNewChat(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
                style={{
                  background: "linear-gradient(90deg, #1e40af, #2563eb)",
                  border: "1px solid rgba(59,130,246,0.4)",
                  boxShadow: "0 4px 20px rgba(37,99,235,0.4)",
                  minHeight: "44px",
                }}
              >
                <Plus className="w-4 h-4" /> New Chat
              </button>
            </div>
          </div>

          {/* Right chat panel */}
          <div
            className={`${
              mobileView === "list" ? "hidden" : "flex"
            } md:flex flex-1 flex-col min-w-0`}
          >
            {selectedParty ? (
              <>
                {/* Chat header */}
                <div
                  className="flex items-center justify-between px-3 md:px-5 py-3 shrink-0"
                  style={{
                    borderBottom: "1px solid rgba(100,150,255,0.12)",
                    background:
                      "linear-gradient(180deg, rgba(15,28,55,0.95) 0%, rgba(10,20,40,0.8) 100%)",
                  }}
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <button
                      type="button"
                      data-ocid="messaging.back.button"
                      onClick={handleBackToList}
                      className="md:hidden w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors -ml-1"
                      aria-label="Back to conversations"
                    >
                      <ChevronLeft className="w-6 h-6 text-blue-300" />
                    </button>
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0"
                      style={{ background: "rgba(37,99,235,0.3)" }}
                    >
                      {selectedProfile?.avatar ?? "👤"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {selectedProfile?.displayName ?? "Unknown"}
                      </p>
                      <p
                        className="text-xs font-medium"
                        style={headerStatusStyle}
                      >
                        {headerStatusText}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2">
                    <button
                      type="button"
                      className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      <Video className="w-4 h-4 text-blue-300" />
                    </button>
                    <button
                      type="button"
                      className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      <Phone className="w-4 h-4 text-blue-300" />
                    </button>
                    <button
                      type="button"
                      className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-blue-300" />
                    </button>
                    <button
                      type="button"
                      data-ocid="messaging.chat.close_button"
                      onClick={onClose}
                      className="hidden md:flex w-10 h-10 rounded-full items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      <X className="w-4 h-4 text-blue-300" />
                    </button>
                  </div>
                </div>

                {/* Messages area with wallpaper */}
                <div
                  className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3"
                  style={{
                    backgroundImage:
                      "url(/assets/uploads/IMG_20260318_225325_285-1.jpg)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  {messages.length === 0 ? (
                    <div
                      data-ocid="messaging.messages.empty_state"
                      className="flex items-center justify-center h-full"
                    >
                      <p className="text-blue-300 text-sm">
                        Send a message to start the conversation
                      </p>
                    </div>
                  ) : (
                    (messages as MessageWithRead[]).map((msg, idx) => {
                      const isOut = msg.sender.toString() === selfPrincipal;
                      const fileData = decodeFileMessage(msg.content);
                      const isOptimistic =
                        msg._optimistic === true ||
                        (isOut && msg.isRead === undefined);
                      return (
                        <div
                          key={`${msg.sender.toString()}-${String(msg.timestamp)}-${idx}`}
                          data-ocid={`messaging.message.item.${idx + 1}`}
                          className={`flex ${
                            isOut ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div className="max-w-[80%] md:max-w-[70%]">
                            <div
                              className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                              style={{
                                background: isOut
                                  ? "rgba(30, 80, 45, 0.9)"
                                  : "rgba(15, 30, 55, 0.9)",
                                color: isOut
                                  ? "rgba(220, 255, 230, 0.95)"
                                  : "rgba(200, 225, 255, 0.95)",
                                borderBottomRightRadius: isOut
                                  ? "4px"
                                  : undefined,
                                borderBottomLeftRadius: !isOut
                                  ? "4px"
                                  : undefined,
                                boxShadow: isOut
                                  ? "0 2px 12px rgba(0,80,30,0.3)"
                                  : "0 2px 12px rgba(0,20,60,0.3)",
                              }}
                            >
                              {fileData ? (
                                <FileMessageBubble
                                  fileUrl={fileData.url}
                                  filename={fileData.filename}
                                />
                              ) : (
                                msg.content
                              )}
                            </div>
                            <div
                              className={`flex items-center gap-1 mt-1 ${
                                isOut ? "justify-end" : "justify-start"
                              }`}
                            >
                              <p className="text-xs text-blue-400">
                                {formatTime(msg.timestamp)}
                              </p>
                              {isOut && (
                                <ReadTick
                                  isRead={msg.isRead}
                                  isOptimistic={isOptimistic}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Composer */}
                <div
                  className="shrink-0"
                  style={{
                    borderTop: "1px solid rgba(100,150,255,0.12)",
                    background: "rgba(10,18,32,0.95)",
                  }}
                >
                  {/* File attachment preview */}
                  {attachedFile && (
                    <div className="flex items-center gap-2 px-3 md:px-4 pt-2.5 pb-1">
                      <div
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-white"
                        style={{
                          background: "rgba(37,99,235,0.2)",
                          border: "1px solid rgba(59,130,246,0.4)",
                        }}
                      >
                        {attachedFile.type.startsWith("image/") ? (
                          <ImageIcon className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                        ) : (
                          <Paperclip className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                        )}
                        <span className="truncate max-w-[180px]">
                          {attachedFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAttachedFile(null)}
                          className="ml-1 hover:text-red-400 transition-colors"
                          aria-label="Remove attachment"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  <form
                    onSubmit={handleSend}
                    className="flex items-center gap-2 md:gap-3 p-3 md:p-4"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 hover:bg-white/10 transition-colors"
                      aria-label="Attach file"
                    >
                      <Paperclip className="w-4 h-4 text-blue-400" />
                    </button>
                    <input
                      data-ocid="messaging.message.input"
                      type="text"
                      value={messageText}
                      onChange={handleMessageInput}
                      placeholder={
                        attachedFile ? "Add a caption…" : "Type a message…"
                      }
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-blue-500 focus:outline-none"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(100,150,255,0.18)",
                        fontSize: "16px",
                        outline: "none",
                      }}
                    />
                    <button
                      data-ocid="messaging.message.send_button"
                      type="submit"
                      disabled={
                        (!messageText.trim() && !attachedFile) || isSending
                      }
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-40 hover:brightness-110"
                      style={{
                        background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
                        boxShadow: "0 4px 14px rgba(37,99,235,0.45)",
                      }}
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div
                data-ocid="messaging.chat.empty_state"
                className="flex-1 flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(10,22,45,1) 0%, rgba(13,31,60,1) 40%, rgba(14,34,64,1) 70%, rgba(8,16,32,1) 100%)",
                }}
              >
                <div className="text-center">
                  <p className="text-5xl mb-4">⛈️</p>
                  <p className="text-white font-semibold">
                    Select a conversation
                  </p>
                  <p className="text-blue-400 text-sm mt-1">
                    or start a new chat
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </OverlayShell>

      {showNewChat && (
        <NewChatModal
          users={allUsers}
          selfPrincipal={selfPrincipal}
          onSelect={handleSelectNewChatUser}
          onClose={() => setShowNewChat(false)}
        />
      )}
    </>
  );
}

function OverlayShell({
  children,
  onClose,
}: { children: React.ReactNode; onClose: () => void }) {
  void onClose;
  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch messaging-overlay-enter"
      data-ocid="messaging.modal"
      style={{ background: "rgba(6,10,20,0.92)", backdropFilter: "blur(24px)" }}
    >
      <div
        className="flex-1 flex flex-col md:m-8 rounded-none md:rounded-2xl overflow-hidden"
        style={{
          background: "rgba(12,20,36,0.98)",
          border: "1px solid rgba(100,150,255,0.14)",
          boxShadow:
            "0 24px 80px rgba(0,0,0,0.7), 0 0 60px rgba(30,60,120,0.2)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
