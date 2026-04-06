export default function PlatformNav({ active }) {
  // Preserve ?client= parameter when switching platforms
  const clientParam = new URLSearchParams(window.location.search).get("client");
  const qs = clientParam ? `?client=${clientParam}` : "";

  const tabs = [
    { id: "meta",   label: "Meta",       href: `/dashboard${qs}`,        emoji: "📘", soon: false },
    { id: "google", label: "Google Ads", href: `/dashboard/google${qs}`, emoji: "🔵", soon: false },
    { id: "gmb",    label: "Meu Negócio",href: `/dashboard/gmb${qs}`,    emoji: "📍", soon: false },
    { id: "guide",  label: "Guia",       href: "/guide",                  emoji: "📖", soon: true },
  ];

  return (
    <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 overflow-x-auto whitespace-nowrap no-scrollbar max-w-[calc(100vw-180px)] sm:max-w-none">
      {tabs.map((tab) =>
        tab.id === active ? (
          <div
            key={tab.id}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-200 shrink-0"
          >
            <span>{tab.emoji}</span>
            <span className="hidden xs:inline sm:inline">{tab.label}</span>
          </div>
        ) : (
          <a
            key={tab.id}
            href={tab.href}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
          >
            <span>{tab.emoji}</span>
            <span className="hidden xs:inline sm:inline">{tab.label}</span>
            {tab.soon && (
              <span className="hidden sm:inline text-[9px] bg-zinc-700 text-zinc-400 rounded px-1">em breve</span>
            )}
          </a>
        )
      )}
    </div>
  );
}
