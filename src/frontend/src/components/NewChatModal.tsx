import type { UserProfile } from "@/backend.d";
import type { Principal } from "@icp-sdk/core/principal";
import { X } from "lucide-react";

interface NewChatModalProps {
  users: Array<[Principal, UserProfile]>;
  selfPrincipal: string;
  onSelect: (principal: Principal) => void;
  onClose: () => void;
}

export default function NewChatModal({
  users,
  selfPrincipal,
  onSelect,
  onClose,
}: NewChatModalProps) {
  const others = users.filter(([p]) => p.toString() !== selfPrincipal);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
    >
      <div
        data-ocid="new_chat.modal"
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "rgba(14,24,40,0.98)",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <h3 className="font-semibold text-white">New Chat</h3>
          <button
            type="button"
            data-ocid="new_chat.close_button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-blue-300" />
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {others.length === 0 ? (
            <p
              data-ocid="new_chat.empty_state"
              className="text-center text-blue-400 text-sm py-8"
            >
              No other users found yet
            </p>
          ) : (
            others.map(([principal, profile], idx) => (
              <button
                key={principal.toString()}
                type="button"
                data-ocid={`new_chat.user.item.${idx + 1}`}
                onClick={() => onSelect(principal)}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left"
                style={{ background: "transparent" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                  style={{ background: "rgba(58,134,198,0.3)" }}
                >
                  {profile.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {profile.displayName}
                  </p>
                  <p className="text-xs text-blue-400 truncate w-40">
                    {principal.toString().slice(0, 20)}…
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
