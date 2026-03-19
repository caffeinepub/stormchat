import { Github, Instagram, Linkedin, Twitter } from "lucide-react";

export default function FooterSection() {
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const caffeineUrl = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`;

  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3A86C6"
              strokeWidth="2"
              role="img"
              aria-label="Storm cloud logo"
            >
              <title>Storm cloud logo</title>
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z" />
            </svg>
            <span className="font-bold text-gray-800">Storm</span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Real-time weather data and forecasts for cities around the world.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
            Quick Links
          </h4>
          <ul className="space-y-2">
            {["Home", "Forecast", "Weather Maps", "Historical Data"].map(
              (link) => (
                <li key={link}>
                  <button
                    type="button"
                    className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    {link}
                  </button>
                </li>
              ),
            )}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
            Legal
          </h4>
          <ul className="space-y-2">
            {[
              "Privacy Policy",
              "Terms of Service",
              "Cookie Policy",
              "Data Sources",
            ].map((link) => (
              <li key={link}>
                <button
                  type="button"
                  className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
                >
                  {link}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Connect */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
            Connect
          </h4>
          <div className="flex gap-3">
            {[
              { icon: <Twitter className="w-4 h-4" />, label: "Twitter" },
              { icon: <Github className="w-4 h-4" />, label: "GitHub" },
              { icon: <Instagram className="w-4 h-4" />, label: "Instagram" },
              { icon: <Linkedin className="w-4 h-4" />, label: "LinkedIn" },
            ].map(({ icon, label }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 py-4 px-4">
        <p className="text-center text-xs text-gray-400">
          © {year}. Built with ❤️ using{" "}
          <a
            href={caffeineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-600"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}
