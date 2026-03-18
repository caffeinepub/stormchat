import type { Conversation, Message, UserProfile } from "@/backend.d";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import {
  useGetAllUsers,
  useGetConversations,
  useGetMessages,
  useSendMessage,
} from "@/hooks/useQueries";
import type { Principal } from "@icp-sdk/core/principal";
import {
  ChevronLeft,
  MoreVertical,
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
  // Mobile view: 'list' shows sidebar, 'chat' shows chat panel
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useGetConversations(!!profile);
  const { data: messages = [] } = useGetMessages(
    selectedParty,
    !!profile && !!selectedParty,
  );
  const { data: allUsers = [] } = useGetAllUsers();
  const sendMessage = useSendMessage();

  const selfPrincipal = identity?.getPrincipal().toString() ?? "";

  // biome-ignore lint/correctness/useExhaustiveDependencies: ref.current is stable
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSelectConversation(conv: Conversation) {
    setSelectedParty(conv.otherParty);
    const userEntry = allUsers.find(
      ([p]) => p.toString() === conv.otherParty.toString(),
    );
    setSelectedProfile(userEntry ? userEntry[1] : null);
    setMobileView("chat");
  }

  function handleSelectNewChatUser(principal: Principal) {
    setSelectedParty(principal);
    const userEntry = allUsers.find(
      ([p]) => p.toString() === principal.toString(),
    );
    setSelectedProfile(userEntry ? userEntry[1] : null);
    setShowNewChat(false);
    setMobileView("chat");
  }

  function handleBackToList() {
    setMobileView("list");
    setSelectedParty(null);
    setSelectedProfile(null);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!messageText.trim() || !selectedParty) return;
    const text = messageText.trim();
    setMessageText("");
    try {
      await sendMessage.mutateAsync({
        recipient: selectedParty,
        content: text,
      });
    } catch {
      setMessageText(text);
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
          {/* Left Sidebar — hidden on mobile when chat is open */}
          <div
            className={`${
              mobileView === "chat" ? "hidden" : "flex"
            } md:flex w-full md:w-72 shrink-0 flex-col`}
            style={{ borderRight: "1px solid rgba(255,255,255,0.1)" }}
          >
            {/* Sidebar header */}
            <div
              className="flex items-center justify-between p-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
            >
              <span className="font-bold text-white text-base">StormChat</span>
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
                    border: "1px solid rgba(255,255,255,0.12)",
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
                  return (
                    <button
                      key={conv.otherParty.toString()}
                      type="button"
                      data-ocid={`messaging.conversation.item.${idx + 1}`}
                      onClick={() => handleSelectConversation(conv)}
                      className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                      style={{
                        background: isSelected
                          ? "rgba(58,134,198,0.2)"
                          : "transparent",
                        borderLeft: isSelected
                          ? "3px solid rgba(58,134,198,0.8)"
                          : "3px solid transparent",
                        minHeight: "64px",
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
                          style={{ background: "rgba(58,134,198,0.25)" }}
                        >
                          {contactProfile?.avatar ?? "👤"}
                        </div>
                        <span
                          className="absolute bottom-0 right-0 w-3 h-3 rounded-full"
                          style={{
                            background: "#22c55e",
                            border: "2px solid rgba(14,22,34,0.9)",
                          }}
                        />
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
              style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
            >
              <button
                type="button"
                data-ocid="messaging.new_chat.button"
                onClick={() => setShowNewChat(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(58,134,198,0.5), rgba(37,99,235,0.5))",
                  border: "1px solid rgba(58,134,198,0.4)",
                  minHeight: "44px",
                }}
              >
                <Plus className="w-4 h-4" /> New Chat
              </button>
            </div>
          </div>

          {/* Right chat panel — hidden on mobile when list is shown */}
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
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    {/* Back button — mobile only */}
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
                      style={{ background: "rgba(58,134,198,0.25)" }}
                    >
                      {selectedProfile?.avatar ?? "👤"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {selectedProfile?.displayName ?? "Unknown"}
                      </p>
                      <p className="text-xs text-green-400">Online</p>
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
                    {/* Close button — visible on desktop in chat view */}
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

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div
                      data-ocid="messaging.messages.empty_state"
                      className="flex items-center justify-center h-full"
                    >
                      <p className="text-blue-500 text-sm">
                        Send a message to start the conversation
                      </p>
                    </div>
                  ) : (
                    messages.map((msg: Message, idx: number) => {
                      const isOut = msg.sender.toString() === selfPrincipal;
                      return (
                        <div
                          key={`${msg.sender.toString()}-${String(msg.timestamp)}-${idx}`}
                          data-ocid={`messaging.message.item.${idx + 1}`}
                          className={`flex ${isOut ? "justify-end" : "justify-start"}`}
                        >
                          <div className="max-w-[80%] md:max-w-[70%]">
                            <div
                              className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                              style={{
                                background: isOut
                                  ? "oklch(0.63 0.15 155)"
                                  : "oklch(0.92 0.01 230)",
                                color: isOut ? "white" : "oklch(0.18 0.03 240)",
                                borderBottomRightRadius: isOut
                                  ? "4px"
                                  : undefined,
                                borderBottomLeftRadius: !isOut
                                  ? "4px"
                                  : undefined,
                              }}
                            >
                              {msg.content}
                            </div>
                            <p
                              className={`text-xs text-blue-500 mt-1 ${
                                isOut ? "text-right" : "text-left"
                              }`}
                            >
                              {formatTime(msg.timestamp)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Composer */}
                <form
                  onSubmit={handleSend}
                  className="flex items-center gap-2 md:gap-3 p-3 md:p-4 shrink-0"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <button
                    type="button"
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 hover:bg-white/10 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-blue-400" />
                  </button>
                  <input
                    data-ocid="messaging.message.input"
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message…"
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      fontSize: "16px",
                    }}
                  />
                  <button
                    data-ocid="messaging.message.send_button"
                    type="submit"
                    disabled={!messageText.trim() || sendMessage.isPending}
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-40"
                    style={{ background: "oklch(0.63 0.15 155)" }}
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </form>
              </>
            ) : (
              <div
                data-ocid="messaging.chat.empty_state"
                className="flex-1 flex items-center justify-center"
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
      style={{ background: "rgba(8,14,24,0.9)", backdropFilter: "blur(20px)" }}
    >
      <div
        className="flex-1 flex flex-col md:m-8 rounded-none md:rounded-2xl overflow-hidden"
        style={{
          background: "rgba(14,22,34,0.97)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
