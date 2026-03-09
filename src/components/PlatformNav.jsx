export default function PlatformNav({ active }) {
  const tabs = [
    { id: "meta", label: "Meta", href: "/dashboard", emoji: "📘" },
    { id: "google", label: "Google", href: "/dashboard/google", emoji: "🔵" },
    { id: "guide", label: "Guia", href: "/guide", emoji: "📖" },
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
          </a>
        )
      )}
    </div>
  );
}
