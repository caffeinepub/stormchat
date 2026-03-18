import type { UserProfile } from "@/backend.d";
import FooterSection from "@/components/FooterSection";
import ForecastSection from "@/components/ForecastSection";
import MessagingOverlay from "@/components/MessagingOverlay";
import NavBar from "@/components/NavBar";
import WeatherHero from "@/components/WeatherHero";
import { Toaster } from "@/components/ui/sonner";
import { useGetCallerProfile } from "@/hooks/useQueries";
import { useState } from "react";

export default function App() {
  return (
    <>
      <AppContent />
      <Toaster />
    </>
  );
}

function AppContent() {
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [cachedProfile, setCachedProfile] = useState<UserProfile | null>(null);
  const { data: callerProfile } = useGetCallerProfile();

  function handleUnlocked() {
    setCachedProfile(callerProfile ?? null);
    setMessagingOpen(true);
  }

  return (
    <div className="min-h-screen">
      <NavBar onUnlocked={handleUnlocked} />

      <main>
        <WeatherHero />
        <ForecastSection />
      </main>

      <FooterSection />

      {messagingOpen && (
        <MessagingOverlay
          onClose={() => setMessagingOpen(false)}
          callerProfile={callerProfile ?? cachedProfile}
        />
      )}
    </div>
  );
}
