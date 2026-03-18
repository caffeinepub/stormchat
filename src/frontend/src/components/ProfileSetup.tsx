import type { UserProfile } from "@/backend.d";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useSaveProfile } from "@/hooks/useQueries";
import { LogIn } from "lucide-react";
import { useState } from "react";

const EMOJIS = ["🌩️", "⛈️", "🌤️", "🌈", "🌊", "❄️", "🌙", "☀️"];

interface ProfileSetupProps {
  onComplete: (profile: UserProfile) => void;
}

export default function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const { identity, login, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState(EMOJIS[0]);
  const [error, setError] = useState("");
  const saveProfile = useSaveProfile();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) {
      setError("Please enter a display name");
      return;
    }
    setError("");
    const profile: UserProfile = { displayName: displayName.trim(), avatar };
    try {
      await saveProfile.mutateAsync(profile);
      onComplete(profile);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Failed to save profile";
      setError(msg);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        data-ocid="profile.setup.panel"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <h2 className="text-xl font-bold text-white mb-1">
          Set up your profile
        </h2>
        <p className="text-sm text-blue-300 mb-6">
          Choose how you'll appear in chats
        </p>

        {!isAuthenticated ? (
          <div className="space-y-4">
            <p className="text-sm text-blue-200">
              You need to sign in with Internet Identity before setting up your
              profile.
            </p>
            <button
              type="button"
              data-ocid="profile.login.button"
              onClick={login}
              disabled={isLoggingIn || isInitializing}
              className="w-full py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(90deg, #3A86C6, #2563eb)" }}
            >
              <LogIn className="w-4 h-4" />
              {isLoggingIn ? "Signing in…" : "Sign in with Internet Identity"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <p className="text-xs text-blue-300 font-medium mb-2">
                Choose avatar
              </p>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    data-ocid="profile.avatar.toggle"
                    onClick={() => setAvatar(emoji)}
                    className="w-10 h-10 rounded-xl text-xl transition-all"
                    style={{
                      background:
                        avatar === emoji
                          ? "rgba(58,134,198,0.5)"
                          : "rgba(255,255,255,0.08)",
                      border:
                        avatar === emoji
                          ? "2px solid rgba(100,170,240,0.8)"
                          : "2px solid transparent",
                      transform: avatar === emoji ? "scale(1.1)" : "scale(1)",
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="profile-display-name"
                className="text-xs text-blue-300 font-medium mb-2 block"
              >
                Display name
              </label>
              <input
                id="profile-display-name"
                data-ocid="profile.name.input"
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setError("");
                }}
                placeholder="Your name"
                maxLength={30}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              />
              {error && (
                <p
                  data-ocid="profile.name.error_state"
                  className="mt-1.5 text-xs text-red-400 break-words"
                >
                  {error}
                </p>
              )}
            </div>

            <button
              data-ocid="profile.setup.submit_button"
              type="submit"
              disabled={saveProfile.isPending}
              className="w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(90deg, #3A86C6, #2563eb)" }}
            >
              {saveProfile.isPending ? "Saving…" : "Start Chatting"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
