export default function PlatformNav({ active }) {
  const tabs = [
    { id: "meta",   label: "Meta",       href: "/dashboard",       emoji: "📘", soon: false },
    { id: "google", label: "Google Ads", href: "/dashboard/google", emoji: "🔵", soon: true },
    { id: "gmb",    label: "Meu Negócio",href: "/dashboard/gmb",   emoji: "📍", soon: false },
    { id: "guide",  label: "Guia",       href: "/guide",            emoji: "📖", soon: true },
  ];

  return (
    <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
      {tabs.map((tab) =>
        tab.id === active ? (
          <div
            key={tab.id}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-200"
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </div>
        ) : (
          <a
            key={tab.id}
            href={tab.href}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
            {tab.soon && (
              <span className="text-[9px] bg-zinc-700 text-zinc-400 rounded px-1">em breve</span>
            )}
          </a>
        )
      )}
    </div>
  );
}
