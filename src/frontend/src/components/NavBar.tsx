import { useActor } from "@/hooks/useActor";
import { useVerifySecret } from "@/hooks/useQueries";
import { Cloud, Lock, MoreVertical, Search, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface NavBarProps {
  onUnlocked: () => void;
}

export default function NavBar({ onUnlocked }: NavBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const accessInputId = "nav-access-code";
  const verifySecret = useVerifySecret();
  const { actor, isFetching } = useActor();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleAccessCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessCode.trim()) return;
    try {
      const valid = await verifySecret.mutateAsync(accessCode.trim());
      if (valid) {
        setMenuOpen(false);
        setAccessCode("");
        setError("");
        onUnlocked();
      } else {
        setError("Invalid access code");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Connection error";
      setError(msg);
    }
  }

  const isSubmitDisabled = verifySecret.isPending || isFetching || !actor;

  return (
    <header className="fixed top-0 left-0 right-0 z-40">
      <div
        style={{
          background:
            "linear-gradient(90deg, rgba(11,42,74,0.95) 0%, rgba(18,59,99,0.95) 100%)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <Cloud className="w-7 h-7 text-blue-300" />
            <span className="text-white font-bold text-lg tracking-tight">
              StormChat
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            {["Home", "Forecast", "Maps", "About"].map((link) => (
              <button
                key={link}
                type="button"
                data-ocid={`nav.${link.toLowerCase()}.link`}
                className="text-sm font-medium text-blue-100 hover:text-white transition-colors"
              >
                {link}
              </button>
            ))}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-blue-300 pointer-events-none" />
              <input
                data-ocid="nav.search_input"
                type="text"
                placeholder="Search City or Zip Code"
                className="pl-9 pr-4 py-1.5 rounded-full text-sm bg-white/10 border border-white/20 text-white placeholder:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 w-52"
              />
            </div>

            <button
              type="button"
              data-ocid="nav.sun_button"
              className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <Sun className="w-4 h-4 text-yellow-300" />
            </button>

            {/* Three-dot menu — secret entry */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                data-ocid="nav.menu_button"
                onClick={() => setMenuOpen((v) => !v)}
                className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-haspopup="true"
                aria-expanded={menuOpen}
              >
                <MoreVertical className="w-4 h-4 text-white" />
              </button>

              {menuOpen && (
                <div
                  data-ocid="nav.dropdown_menu"
                  className="absolute right-0 top-12 w-screen max-w-xs rounded-xl shadow-glass overflow-hidden"
                  style={{
                    background: "rgba(14,24,40,0.97)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  {["Settings", "Help", "About"].map((item) => (
                    <button
                      key={item}
                      type="button"
                      data-ocid={`nav.${item.toLowerCase()}.link`}
                      className="w-full text-left px-4 py-3 text-sm text-blue-100 hover:bg-white/10 transition-colors"
                      style={{ minHeight: "44px" }}
                    >
                      {item}
                    </button>
                  ))}
                  <div className="mx-3 my-1 border-t border-white/10" />
                  <div className="p-3">
                    <form onSubmit={handleAccessCodeSubmit}>
                      <label
                        htmlFor={accessInputId}
                        className="flex items-center gap-1.5 text-xs text-blue-300 mb-1.5"
                      >
                        <Lock className="w-3 h-3" /> Enter access code
                      </label>
                      <div className="flex gap-2">
                        <input
                          id={accessInputId}
                          data-ocid="nav.access_code.input"
                          type="password"
                          value={accessCode}
                          onChange={(e) => {
                            setAccessCode(e.target.value);
                            setError("");
                          }}
                          placeholder="Access code"
                          className="flex-1 px-3 py-2 rounded-lg text-sm bg-white/10 border border-white/20 text-white placeholder:text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                          style={{ fontSize: "16px" }}
                          autoComplete="off"
                        />
                        <button
                          data-ocid="nav.access_code.submit_button"
                          type="submit"
                          disabled={isSubmitDisabled}
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                          style={{ minHeight: "44px" }}
                        >
                          {isFetching
                            ? "Connecting..."
                            : verifySecret.isPending
                              ? "…"
                              : "Go"}
                        </button>
                      </div>
                      {error && (
                        <p
                          data-ocid="nav.access_code.error_state"
                          className="mt-1.5 text-xs text-red-400"
                        >
                          {error}
                        </p>
                      )}
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
