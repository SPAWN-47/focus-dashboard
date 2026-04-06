export default function PlatformNav({ active }) {
  // Preserve ?client= parameter when switching platforms
  const clientParam = new URLSearchParams(window.location.search).get("client");
  const qs = clientParam ? `?client=${clientParam}` : "";

  const tabs = [
    { id: "meta",   label: "Meta Ads",   href: `/dashboard${qs}`,        emoji: "📘", soon: false },
    { id: "google", label: "Google Ads", href: `/dashboard/google${qs}`, emoji: "🔵", soon: false },
    { id: "gmb",    label: "Meu Negócio",href: `/dashboard/gmb${qs}`,    emoji: "📍", soon: false },
    { id: "guide",  label: "Guia",       href: "/guide",                  emoji: "📖", soon: true },
  ];

  return (
    <div className="flex items-center gap-0.5 bg-zinc-900 border border-zinc-800 rounded-xl p-1 overflow-x-auto whitespace-nowrap no-scrollbar max-w-[calc(100vw-160px)] sm:max-w-none">
      {tabs.map((tab) =>
        tab.id === active ? (
          /* Active tab — always shows emoji + label */
          <div
            key={tab.id}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 border border-zinc-700 shrink-0"
            style={{ color: "#C9F80D" }}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </div>
        ) : (
          /* Inactive — mobile: only emoji; sm+: emoji + label */
          <a
            key={tab.id}
            href={tab.href}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors shrink-0"
          >
            <span>{tab.emoji}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.soon && (
              <span className="hidden sm:inline text-[9px] bg-zinc-700 text-zinc-400 rounded px-1">em breve</span>
            )}
          </a>
        )
      )}
    </div>
  );
}
