import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowDown,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  Check,
  CheckCheck,
  Circle,
  ChevronDown,
  DollarSign,
  Instagram,
  LayoutGrid,
  Layers,
  Linkedin,
  Link2,
  Lock,
  Mail,
  Maximize2,
  MessageSquare,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  Play,
  Plus,
  RefreshCw,
  Send,
  Shield,
  ShieldCheck,
  ShoppingBag,
  SmilePlus,
  Star,
  Target,
  TrendingUp,
  Users,
  Video,
  Zap,
} from "lucide-react";

const updateSpotlightPosition = (event) => {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
};

function PortfolioVisual({ project }) {
  if (project.visualImage) {
    return (
      <img
        src={project.visualImage}
        alt={`Preview visual de ${project.title}`}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div className="h-full w-full bg-zinc-900" />
  );
}

export default function FocusPageBelowFold({
  FadeInUp,
  Typewriter,
  FocusPageLogo,
  WhatsAppIcon,
  services,
  nichesLine1,
  nichesLine2,
  galleryRow1,
  galleryRow2,
  portfolio,
  testimonials,
  plans,
  steps,
  faqs,
  activeProject,
  setActiveProject,
  activeStep,
  setActiveStep,
  openFaq,
  setOpenFaq,
}) {
  return (
    <>
      <div className="w-full bg-violet-950/20 border-y border-violet-900/30 py-4 overflow-hidden flex items-center relative z-10">
        <div className="animate-marquee whitespace-nowrap flex gap-12 text-sm md:text-base font-semibold text-violet-500/60 uppercase tracking-widest">
          {[...Array(10)].map((_, i) => (
            <React.Fragment key={`serv-1-${i}`}>
              <span>IA no WhatsApp</span> <span className="w-1.5 h-1.5 rounded-full bg-violet-500/50" />
              <span>Atendimento 24/7</span> <span className="w-1.5 h-1.5 rounded-full bg-violet-500/50" />
              <span>Triagem de Leads</span> <span className="w-1.5 h-1.5 rounded-full bg-violet-500/50" />
              <span>Redução de Custos</span> <span className="w-1.5 h-1.5 rounded-full bg-violet-500/50" />
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div className="section-render-opt bg-zinc-900/60 border-y border-zinc-800/60 py-8 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-y md:divide-y-0 md:divide-x divide-zinc-800/60">
            {[
              { icon: MessageSquare, value: "500+",  label: "atendimentos/dia",  iconClass: "text-violet-400",  bg: "bg-violet-500/10" },
              { icon: Zap,           value: "<5s",   label: "tempo de resposta", iconClass: "text-amber-400",   bg: "bg-amber-500/10"  },
              { icon: Star,          value: "98%",   label: "taxa de satisfação",iconClass: "text-emerald-400", bg: "bg-emerald-500/10"},
              { icon: Building2,     value: "60+",   label: "negócios atendidos",iconClass: "text-blue-400",    bg: "bg-blue-500/10"   },
            ].map(({ icon: Icon, value, label, iconClass, bg }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="flex flex-col sm:flex-row items-center sm:items-center gap-3 px-6 py-4 group"
              >
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${iconClass}`} />
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-2xl font-black text-white tracking-tight leading-none">{value}</div>
                  <div className="text-xs text-zinc-500 mt-0.5 font-medium">{label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <section id="servicos" className="section-render-opt py-24 max-w-7xl mx-auto px-6 relative">
        <FadeInUp className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-semibold uppercase tracking-widest mb-4">
            <Zap className="h-3 w-3" />
            O que a IA faz por você
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">
            Estrutura de Atendimento <span className="text-gradient-animate">com IA</span>
          </h2>
          <p className="text-zinc-400 mt-4 max-w-2xl mx-auto text-base">
            Cada automação resolve um gargalo real. Juntas, elas transformam o atendimento em uma máquina que nunca para.
          </p>
        </FadeInUp>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((srv, idx) => {
            const colors = {
              violet: { border: "border-violet-500/20 hover:border-violet-500/50", iconBg: "bg-violet-500/10 border-violet-500/30", iconText: "text-violet-400", num: "text-violet-500/10", glow: "from-violet-500/5 to-violet-500/0", check: "text-violet-400", checkBg: "bg-violet-500/15" },
              cyan:   { border: "border-cyan-500/20 hover:border-cyan-500/50",     iconBg: "bg-cyan-500/10 border-cyan-500/30",     iconText: "text-cyan-400",   num: "text-cyan-500/10",   glow: "from-cyan-500/5 to-cyan-500/0",   check: "text-cyan-400",   checkBg: "bg-cyan-500/15"   },
              emerald:{ border: "border-emerald-500/20 hover:border-emerald-500/50",iconBg: "bg-emerald-500/10 border-emerald-500/30",iconText: "text-emerald-400",num: "text-emerald-500/10",glow: "from-emerald-500/5 to-emerald-500/0",check: "text-emerald-400",checkBg: "bg-emerald-500/15"},
              rose:   { border: "border-rose-500/20 hover:border-rose-500/50",     iconBg: "bg-rose-500/10 border-rose-500/30",     iconText: "text-rose-400",   num: "text-rose-500/10",   glow: "from-rose-500/5 to-rose-500/0",   check: "text-rose-400",   checkBg: "bg-rose-500/15"   },
              amber:  { border: "border-amber-500/20 hover:border-amber-500/50",   iconBg: "bg-amber-500/10 border-amber-500/30",   iconText: "text-amber-400",  num: "text-amber-500/10",  glow: "from-amber-500/5 to-amber-500/0",  check: "text-amber-400",  checkBg: "bg-amber-500/15"  },
              sky:    { border: "border-sky-500/20 hover:border-sky-500/50",       iconBg: "bg-sky-500/10 border-sky-500/30",       iconText: "text-sky-400",    num: "text-sky-500/10",    glow: "from-sky-500/5 to-sky-500/0",    check: "text-sky-400",    checkBg: "bg-sky-500/15"    },
            };
            const c = colors[srv.color] || colors.violet;
            return (
              <FadeInUp key={idx} delay={idx * 0.08}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`group h-full p-7 rounded-2xl bg-zinc-900/40 border transition-all duration-300 relative overflow-hidden ${c.border}`}
                >
                  {/* Subtle glow bg */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${c.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  {/* Header row: icon + number */}
                  <div className="relative z-10 flex items-start justify-between mb-5">
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${c.iconBg} ${c.iconText} group-hover:scale-110 transition-transform duration-300`}>
                      <srv.icon className="h-5 w-5" />
                    </div>
                    <span className={`text-5xl font-black leading-none select-none ${c.num}`}>
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Title + desc */}
                  <h3 className="relative z-10 text-base font-bold mb-2 text-zinc-100">{srv.title}</h3>
                  <p className="relative z-10 text-sm text-zinc-400 leading-relaxed mb-5">{srv.desc}</p>

                  {/* Feature bullets */}
                  <ul className="relative z-10 space-y-2">
                    {(srv.features || []).map((feat, fi) => (
                      <li key={fi} className="flex items-start gap-2.5 text-xs text-zinc-400">
                        <span className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${c.checkBg}`}>
                          <Check className={`h-2.5 w-2.5 ${c.check}`} />
                        </span>
                        {feat}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </FadeInUp>
            );
          })}
        </div>
      </section>

      <section className="section-render-opt py-20 bg-zinc-950 relative overflow-hidden border-y border-white/5 flex flex-col items-center justify-center pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-violet-500/5 blur-[100px] pointer-events-none" />

        <FadeInUp className="text-center mb-16 relative z-10 px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-300 flex flex-wrap justify-center items-center gap-2">
            IA treinada para atender <Typewriter words={["sua clínica.", "seu escritório.", "sua loja.", "seu negócio local."]} className="text-violet-500" />
          </h2>
        </FadeInUp>

        <div className="absolute inset-y-0 left-0 w-16 md:w-48 bg-gradient-to-r from-zinc-950 to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-16 md:w-48 bg-gradient-to-l from-zinc-950 to-transparent z-10" />

        <div className="relative w-full md:w-[110vw] flex flex-col gap-5 -rotate-2 transform-gpu md:left-1/2 md:-translate-x-1/2">
          <div className="w-full bg-zinc-900/80 border-y border-zinc-800 py-4 flex overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="animate-marquee flex gap-8 md:gap-12 text-xs md:text-sm font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">
              {[...Array(5)].map((_, i) => (
                <React.Fragment key={`nicho1-${i}`}>
                  {nichesLine1.map((nicho, idx) => (
                    <React.Fragment key={idx}>
                      <span>{nicho}</span> <span className="w-1.5 h-1.5 rounded-full bg-violet-500/30 self-center" />
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="w-full bg-violet-950/30 border-y border-violet-900/40 py-4 flex overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="animate-marquee-reverse flex gap-8 md:gap-12 text-xs md:text-sm font-bold text-violet-500/70 uppercase tracking-widest whitespace-nowrap">
              {[...Array(5)].map((_, i) => (
                <React.Fragment key={`nicho2-${i}`}>
                  {nichesLine2.map((nicho, idx) => (
                    <React.Fragment key={idx}>
                      <span>{nicho}</span> <span className="w-1.5 h-1.5 rounded-full bg-zinc-600/50 self-center" />
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── INTEGRAÇÕES ── */}
      <section className="section-render-opt py-20 bg-zinc-950 relative overflow-hidden">
        {/* Fade masks laterais */}
        <div className="absolute inset-y-0 left-0 w-20 md:w-40 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 md:w-40 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

        {/* Header */}
        <FadeInUp className="text-center mb-12 px-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-semibold uppercase tracking-widest mb-4">
            <Link2 className="h-3 w-3" />
            Conecta com tudo
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white">
            Integra com as ferramentas{" "}
            <span className="text-gradient-animate">que você já usa</span>
          </h2>
          <p className="text-zinc-400 mt-3 text-sm max-w-lg mx-auto">
            A IA da ChatFocus se conecta nativamente com os principais apps e plataformas do mercado.
          </p>
        </FadeInUp>

        {/* Linha 1 — esquerda */}
        <div className="flex overflow-hidden mb-3">
          <div className="animate-marquee flex gap-3 pr-3 shrink-0">
            {[
              { Icon: MessageSquare, name: "WhatsApp",      iconClass: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              { Icon: Instagram,     name: "Instagram",     iconClass: "text-pink-400",    bg: "bg-pink-500/10",    border: "border-pink-500/20"    },
              { Icon: Calendar,      name: "Google Cal",    iconClass: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20"    },
              { Icon: Mail,          name: "Gmail",         iconClass: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20"     },
              { Icon: Send,          name: "Telegram",      iconClass: "text-sky-400",     bg: "bg-sky-500/10",     border: "border-sky-500/20"     },
              { Icon: ShoppingBag,   name: "Shopify",       iconClass: "text-green-400",   bg: "bg-green-500/10",   border: "border-green-500/20"   },
              { Icon: MessageSquare, name: "WhatsApp",      iconClass: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              { Icon: Instagram,     name: "Instagram",     iconClass: "text-pink-400",    bg: "bg-pink-500/10",    border: "border-pink-500/20"    },
              { Icon: Calendar,      name: "Google Cal",    iconClass: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20"    },
              { Icon: Mail,          name: "Gmail",         iconClass: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20"     },
              { Icon: Send,          name: "Telegram",      iconClass: "text-sky-400",     bg: "bg-sky-500/10",     border: "border-sky-500/20"     },
              { Icon: ShoppingBag,   name: "Shopify",       iconClass: "text-green-400",   bg: "bg-green-500/10",   border: "border-green-500/20"   },
            ].map(({ Icon, name, iconClass, bg, border }, i) => (
              <div
                key={`int-row1-${i}`}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${border} ${bg} shrink-0 whitespace-nowrap`}
              >
                <div className="w-7 h-7 rounded-lg bg-zinc-900/80 flex items-center justify-center shrink-0">
                  <Icon className={`h-3.5 w-3.5 ${iconClass}`} />
                </div>
                <span className="text-xs text-zinc-300 font-medium">{name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Linha 2 — direita */}
        <div className="flex overflow-hidden">
          <div className="animate-marquee-reverse flex gap-3 pr-3 shrink-0">
            {[
              { Icon: LayoutGrid, name: "Google Sheets", iconClass: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              { Icon: Layers,     name: "HubSpot",       iconClass: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/20"  },
              { Icon: BookOpen,   name: "Notion",        iconClass: "text-zinc-200",    bg: "bg-zinc-700/30",    border: "border-zinc-700/50"    },
              { Icon: Zap,        name: "Zapier",        iconClass: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20"   },
              { Icon: Building2,  name: "CRM / ERP",     iconClass: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/20"  },
              { Icon: Plus,       name: "+300 mais",     iconClass: "text-zinc-400",    bg: "bg-zinc-800/60",    border: "border-zinc-700/40"    },
              { Icon: LayoutGrid, name: "Google Sheets", iconClass: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              { Icon: Layers,     name: "HubSpot",       iconClass: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/20"  },
              { Icon: BookOpen,   name: "Notion",        iconClass: "text-zinc-200",    bg: "bg-zinc-700/30",    border: "border-zinc-700/50"    },
              { Icon: Zap,        name: "Zapier",        iconClass: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20"   },
              { Icon: Building2,  name: "CRM / ERP",     iconClass: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/20"  },
              { Icon: Plus,       name: "+300 mais",     iconClass: "text-zinc-400",    bg: "bg-zinc-800/60",    border: "border-zinc-700/40"    },
            ].map(({ Icon, name, iconClass, bg, border }, i) => (
              <div
                key={`int-row2-${i}`}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${border} ${bg} shrink-0 whitespace-nowrap`}
              >
                <div className="w-7 h-7 rounded-lg bg-zinc-900/80 flex items-center justify-center shrink-0">
                  <Icon className={`h-3.5 w-3.5 ${iconClass}`} />
                </div>
                <span className="text-xs text-zinc-300 font-medium">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-render-opt py-12 bg-zinc-950 relative overflow-hidden flex flex-col gap-4 border-b border-zinc-900">
        <div className="absolute inset-y-0 left-0 w-24 md:w-64 bg-gradient-to-r from-zinc-950 to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 md:w-64 bg-gradient-to-l from-zinc-950 to-transparent z-20 pointer-events-none" />

        <div className="animate-marquee-cinema flex gap-4 pr-4">
          {[...Array(4)].map((_, i) => (
            <React.Fragment key={`cine1-${i}`}>
              {galleryRow1.map((img, idx) => (
                <div
                  key={`img1-${i}-${idx}`}
                  className="w-48 sm:w-64 md:w-80 shrink-0 aspect-video rounded-xl overflow-hidden relative border border-white/5 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 hover:border-violet-500/50 transition-all duration-500 hover:scale-[1.02] hover:z-30 hover:shadow-[0_0_30px_rgba(139,92,246,0.2)] cursor-crosshair group"
                >
                  <img src={img} alt="Amostra de Interface" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" decoding="async" fetchPriority="low" />
                  <div className="absolute inset-0 bg-violet-500/10 mix-blend-overlay pointer-events-none group-hover:opacity-0 transition-opacity" />
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>

        <div className="animate-marquee-cinema-reverse flex gap-4 pr-4">
          {[...Array(4)].map((_, i) => (
            <React.Fragment key={`cine2-${i}`}>
              {galleryRow2.map((img, idx) => (
                <div
                  key={`img2-${i}-${idx}`}
                  className="w-48 sm:w-64 md:w-80 shrink-0 aspect-video rounded-xl overflow-hidden relative border border-white/5 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 hover:border-violet-500/50 transition-all duration-500 hover:scale-[1.02] hover:z-30 hover:shadow-[0_0_30px_rgba(139,92,246,0.2)] cursor-crosshair group"
                >
                  <img src={img} alt="Amostra de Interface" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" decoding="async" fetchPriority="low" />
                  <div className="absolute inset-0 bg-violet-500/10 mix-blend-overlay pointer-events-none group-hover:opacity-0 transition-opacity" />
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section id="portfolio" className="section-render-opt py-24 bg-zinc-950 relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <FadeInUp className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Casos de <br /><span className="text-violet-500">Automação.</span></h2>
              <p className="text-zinc-400 mt-4 max-w-xl">Operações reais, gargalos reais e ganhos concretos em velocidade, consistência e custo.</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-violet-400 bg-violet-500/10 px-4 py-2 rounded-full border border-violet-500/20">
              <Play className="h-4 w-4" /> Veja como funciona
            </div>
          </FadeInUp>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {portfolio.map((project, idx) => (
              <FadeInUp key={project.id} delay={idx * 0.1}>
                <motion.div
                  whileHover="hover"
                  onClick={() => setActiveProject(project)}
                  className={`relative h-64 sm:h-72 md:h-[280px] rounded-2xl overflow-hidden cursor-pointer group ${project.mockImage}`}
                >
                  <motion.div
                    variants={{ hover: { scale: 1.03 } }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="absolute inset-0"
                  >
                    <PortfolioVisual project={project} />
                  </motion.div>
                  <div className="absolute inset-0 cinematic-vignette opacity-70 sm:opacity-80 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent opacity-90 sm:opacity-90 group-hover:opacity-70 transition-opacity duration-500" />
                  <motion.div
                    variants={{ hover: { scale: 1.05 } }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0 w-full h-full -z-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"
                  />
                  <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="rounded-full border border-cyan-300/30 bg-zinc-950/85 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200 backdrop-blur-md sm:text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 group-hover:text-violet-400 transition-colors duration-300">
                      {project.title}
                    </h3>
                    <div className="flex items-center justify-between mt-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transform translate-y-0 sm:translate-y-4 sm:group-hover:translate-y-0 transition-all duration-500">
                      <span className="text-sm font-medium text-zinc-300">Ver Operação</span>
                      <div className="h-10 w-10 rounded-full bg-violet-500 flex items-center justify-center">
                        <Maximize2 className="h-4 w-4 text-zinc-950" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </FadeInUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ── */}
      <section className="section-render-opt py-24 bg-zinc-950 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <FadeInUp className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-[0.2em] mb-5">
              <Zap className="h-3.5 w-3.5 fill-current" /> O que dizem nossos clientes
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">
              Resultados que <span className="text-gradient-animate">falam por si.</span>
            </h2>
          </FadeInUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => {
              const colorMap = {
                cyan:    { ring: "border-cyan-500/20 hover:border-cyan-500/40",    tag: "bg-cyan-400/10 border-cyan-300/30 text-cyan-300",    dot: "bg-cyan-400" },
                violet:  { ring: "border-violet-500/20 hover:border-violet-500/40", tag: "bg-violet-400/10 border-violet-300/30 text-violet-300", dot: "bg-violet-400" },
                emerald: { ring: "border-emerald-500/20 hover:border-emerald-500/40", tag: "bg-emerald-400/10 border-emerald-300/30 text-emerald-300", dot: "bg-emerald-400" },
              };
              const c = colorMap[t.color] ?? colorMap.violet;
              return (
                <FadeInUp key={i} delay={i * 0.12}>
                  <div className={`group relative h-full flex flex-col p-7 rounded-2xl bg-zinc-900/50 border backdrop-blur-md transition-all duration-500 ${c.ring} hover:bg-zinc-900/80 hover:shadow-[0_0_40px_rgba(0,0,0,0.3)] animate-float-delay`} style={{ animationDelay: `${i * 1.2}s` }}>
                    {/* Aspas decorativas */}
                    <span className="absolute top-5 right-6 text-6xl font-black text-zinc-800/60 leading-none select-none pointer-events-none group-hover:text-zinc-700/60 transition-colors">"</span>

                    {/* Estrelas */}
                    <div className="flex gap-1 mb-5">
                      {Array.from({ length: t.rating }).map((_, s) => (
                        <svg key={s} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      ))}
                    </div>

                    {/* Texto */}
                    <p className="text-zinc-300 text-sm sm:text-base leading-relaxed flex-1 relative z-10">
                      "{t.text}"
                    </p>

                    {/* Autor */}
                    <div className="mt-6 flex items-center gap-3 pt-5 border-t border-zinc-800/60">
                      <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-xs font-bold text-zinc-100 shrink-0 ${c.tag}`}>
                        {t.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">{t.name}</p>
                        <p className="text-xs text-zinc-500">{t.role} · {t.business}</p>
                      </div>
                      <div className={`ml-auto w-2 h-2 rounded-full shrink-0 ${c.dot} animate-ping-slow`} />
                    </div>
                  </div>
                </FadeInUp>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-render-opt py-24 bg-zinc-900/30 border-y border-zinc-800/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <FadeInUp className="order-2 lg:order-1 relative">
            <motion.div className="relative mx-auto h-[560px] w-full max-w-[300px] sm:h-[620px] rounded-[44px] border-[10px] border-zinc-900 bg-black shadow-[0_20px_80px_rgba(0,0,0,0.65)]">
              <div className="absolute inset-[6px] overflow-hidden rounded-[34px] border border-zinc-800/70 bg-[#0b141a]">
                <div
                  className="absolute inset-0 opacity-25"
                  style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/graphy-dark.png')" }}
                />

                <div className="absolute left-1/2 top-2 z-30 h-6 w-32 -translate-x-1/2 rounded-full bg-black/90" />

                <div className="relative z-20 mt-7 flex h-[62px] items-center justify-between bg-[#202c33] px-3.5">
                  <div className="flex items-center gap-2.5">
                    <ArrowLeft className="h-4 w-4 text-zinc-100" />
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700/25">
                      <WhatsAppIcon className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="leading-tight">
                      <p className="text-[13px] font-semibold text-zinc-100">ChatFocus IA</p>
                      <p className="text-[10px] text-zinc-300">online</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-200">
                    <Video className="h-4 w-4" />
                    <Phone className="h-4 w-4" />
                    <MoreVertical className="h-4 w-4" />
                  </div>
                </div>

                <div className="relative z-20 h-[470px] overflow-y-auto no-scrollbar px-2.5 pb-16 pt-2 sm:h-[530px]">
                  {/* Encryption notice */}
                  <div className="flex justify-center mb-2">
                    <span className="rounded-md bg-[#182229]/80 px-2.5 py-1.5 text-[9.5px] text-zinc-400 text-center leading-tight max-w-[220px] inline-flex items-center gap-1.5 justify-center">
                      <Lock className="h-2.5 w-2.5 shrink-0" /> As mensagens são criptografadas de ponta a ponta
                    </span>
                  </div>

                  {/* Time label */}
                  <div className="mb-2.5 flex justify-center">
                    <span className="rounded-md bg-[#182229] px-2 py-1 text-[10px] text-zinc-300">
                      Hoje, 14:22
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Customer msg 1 */}
                    <div className="max-w-[84%] rounded-[8px] rounded-tl-[2px] bg-[#202c33] px-3 py-2 text-[12px] leading-snug text-zinc-100 shadow-sm">
                      Oi! Tenho uma clínica odonto e tô perdendo pacientes fora do horário. WhatsApp fica sem resposta e os leads somem.
                      <div className="mt-1 text-right text-[10px] text-zinc-500">14:22</div>
                    </div>

                    {/* IA msg 1 */}
                    <div className="ml-auto max-w-[86%] rounded-[8px] rounded-tr-[2px] bg-[#005c4b] px-3 py-2 text-[12px] leading-snug text-zinc-100 shadow-sm">
                      Olá! Sou a IA de atendimento da ChatFocus.
                      <br />Entendo exatamente o problema. Quantas mensagens sua clínica recebe por dia?
                      <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-emerald-200/80">
                        14:22 <CheckCheck className="h-3.5 w-3.5" />
                      </div>
                    </div>

                    {/* Customer msg 2 */}
                    <div className="max-w-[76%] rounded-[8px] rounded-tl-[2px] bg-[#202c33] px-3 py-2 text-[12px] leading-snug text-zinc-100 shadow-sm">
                      Umas 70 a 80 por dia. Final de semana é o caos.
                      <div className="mt-1 text-right text-[10px] text-zinc-500">14:23</div>
                    </div>

                    {/* IA msg 2 — benefits */}
                    <div className="ml-auto max-w-[88%] rounded-[8px] rounded-tr-[2px] bg-[#005c4b] px-3 py-2 text-[12px] leading-snug text-zinc-100 shadow-sm">
                      Com esse volume, o resultado é direto:
                      <div className="mt-1.5 space-y-1 text-[11.5px]">
                        <div className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-300 shrink-0" /> Triagem automática 24h, 7 dias</div>
                        <div className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-300 shrink-0" /> Agendamento sem precisar de recepcionista</div>
                        <div className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-300 shrink-0" /> Follow-up de pacientes que ficaram sem resposta</div>
                      </div>
                      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-emerald-200/80">
                        14:23 <CheckCheck className="h-3.5 w-3.5" />
                      </div>
                    </div>

                    {/* Customer msg 3 */}
                    <div className="max-w-[78%] rounded-[8px] rounded-tl-[2px] bg-[#202c33] px-3 py-2 text-[12px] leading-snug text-zinc-100 shadow-sm">
                      Que bom! Quanto tempo leva pra implementar?
                      <div className="mt-1 text-right text-[10px] text-zinc-500">14:24</div>
                    </div>

                    {/* IA msg 3 — CTA */}
                    <div className="ml-auto max-w-[88%] rounded-[8px] rounded-tr-[2px] bg-[#005c4b] px-3 py-2 text-[12px] leading-snug text-zinc-100 shadow-sm">
                      7 dias úteis com tudo integrado.
                      <br />Posso te conectar agora com um especialista para um <span className="font-semibold text-emerald-200">diagnóstico gratuito</span> da sua operação?
                      <div className="mt-1.5 flex items-center justify-end gap-1 text-[10px] text-emerald-200/80">
                        14:24 <CheckCheck className="h-3.5 w-3.5" />
                      </div>
                    </div>

                    {/* Typing indicator — customer replying */}
                    <div className="max-w-[40%] rounded-[8px] rounded-tl-[2px] bg-[#202c33] px-3 py-2.5 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2].map((dot) => (
                          <motion.span
                            key={`typing-dot-${dot}`}
                            animate={{ opacity: [0.25, 1, 0.25] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: dot * 0.22 }}
                            className="h-1.5 w-1.5 rounded-full bg-zinc-400"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Input bar — fixed at bottom */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-2 rounded-full bg-[#202c33] px-3 py-2 shadow-lg">
                    <SmilePlus className="h-4 w-4 text-zinc-400" />
                    <Paperclip className="h-4 w-4 text-zinc-400" />
                    <div className="flex-1 text-[11px] text-zinc-500">Mensagem</div>
                    <Circle className="h-5 w-5 fill-emerald-500 text-emerald-500" />
                    <Mic className="absolute right-[11px] h-3.5 w-3.5 text-zinc-950" />
                  </div>
                </div>
              </div>
            </motion.div>
            <div className="absolute left-1/2 top-1/2 -z-10 h-full w-full max-w-sm -translate-x-1/2 -translate-y-1/2 bg-emerald-500/10 blur-[100px]" />
          </FadeInUp>

          <FadeInUp className="order-1 lg:order-2">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 flex flex-wrap items-center gap-2">
              O fim do atendimento <Typewriter words={["lento.", "manual.", "desorganizado."]} className="text-violet-500" />
            </h2>
            <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
              Seu cliente não quer esperar, repetir informação ou cair em respostas diferentes a cada atendente.
              Com IA, sua empresa responde na hora, filtra melhor e encaminha com mais inteligência.
            </p>
            <ul className="space-y-4 mb-8">
              {["Resposta imediata 24/7", "Padrão de atendimento sem oscilação", "Qualificação antes da equipe entrar", "Menos custo com operação repetitiva"].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="bg-violet-500/20 p-1 rounded-full"><Check className="h-4 w-4 text-violet-400" /></div>
                  <span className="text-zinc-300">{item}</span>
                </li>
              ))}
            </ul>
            <a href="#contato" className="btn-metallic inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold bg-white/5 backdrop-blur-md border border-white/10 text-zinc-100 hover:bg-white/10 hover:border-white/20 transition-all">
              Quero automatizar isso
            </a>
          </FadeInUp>
        </div>
      </section>

      {/* ── COMPARATIVO ── */}
      <section className="section-render-opt py-24 bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <FadeInUp className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Sua empresa <span className="text-gradient-animate">antes e depois</span> da automação.
            </h2>
            <p className="text-zinc-400 mt-4 max-w-xl mx-auto">Veja exatamente o que muda quando a IA assume o atendimento repetitivo.</p>
          </FadeInUp>

          <FadeInUp>
            <div className="rounded-2xl border border-zinc-800/60 overflow-hidden backdrop-blur-md bg-zinc-900/30">
              {/* Header */}
              <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-zinc-800/60">
                <div className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500" />
                <div className="px-5 py-4 border-l border-zinc-800/60 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500/80" />
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Sem automação</span>
                </div>
                <div className="px-5 py-4 border-l border-violet-500/20 bg-violet-500/5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping-slow" />
                  <span className="text-xs font-bold uppercase tracking-widest text-violet-400">Com ChatFocus</span>
                </div>
              </div>

              {[
                { label: "Horário de atendimento", sem: "8h às 18h", com: "24h por dia, 7 dias" },
                { label: "Tempo de resposta",        sem: "Minutos a horas", com: "Segundos" },
                { label: "Consistência",              sem: "Depende do humor", com: "Sempre o mesmo tom" },
                { label: "Leads fora do horário",     sem: "Perdidos",         com: "Capturados e organizados" },
                { label: "Custo por atendimento",     sem: "Equipe manual",    com: "Reduzido em até 60%" },
                { label: "Escalabilidade",            sem: "Contratar mais",   com: "Automação cresce sozinha" },
              ].map((row, i) => (
                <div key={i} className={`grid grid-cols-[1fr_1fr_1fr] border-b border-zinc-800/40 last:border-0 transition-colors hover:bg-zinc-900/50 ${i % 2 === 0 ? "" : "bg-zinc-900/20"}`}>
                  <div className="px-5 py-4 text-sm font-medium text-zinc-300">{row.label}</div>
                  <div className="px-5 py-4 border-l border-zinc-800/40 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500/60 shrink-0" />
                    <span className="text-sm text-zinc-500">{row.sem}</span>
                  </div>
                  <div className="px-5 py-4 border-l border-violet-500/15 bg-violet-500/[0.03] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                    <span className="text-sm text-zinc-200 font-medium">{row.com}</span>
                  </div>
                </div>
              ))}
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* ── FUNIL DE REATIVAÇÃO ── */}
      <section className="section-render-opt py-24 bg-zinc-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-amber-500/5 blur-[160px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-orange-500/5 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_100%,rgba(245,158,11,0.04),transparent)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">

          {/* Badge + Heading */}
          <FadeInUp className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-semibold uppercase tracking-widest mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping-slow" />
              Recuperação de Leads &amp; Follow-up
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Cada lead ignorado é{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                dinheiro na mesa.
              </span>
            </h2>
            <p className="text-zinc-400 mt-5 max-w-2xl mx-auto text-base leading-relaxed">
              67% dos leads precisam de mais de um contato para fechar. Sem automação, você perde 7 em cada 10 oportunidades antes de sequer perceber.
            </p>
          </FadeInUp>

          {/* Main layout: Funnel (left) + Stats/Features (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 lg:gap-16 items-start">

            {/* ── FUNIL VISUAL ── */}
            <FadeInUp>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Funil de reativação automática</p>
              <div className="space-y-1">
                {[
                  {
                    Icon: Users, label: "Leads Captados", desc: "Total de contatos recebidos no período",
                    stat: "100", unit: "leads", widthPct: 100,
                    border: "border-amber-500/35", bg: "bg-amber-500/10",
                    iconCol: "text-amber-400", statCol: "text-amber-400",
                  },
                  {
                    Icon: Zap, label: "1º Toque · Imediato", desc: "Resposta automática em menos de 5 segundos",
                    stat: "94%", unit: "abertura", widthPct: 87,
                    border: "border-amber-400/30", bg: "bg-amber-500/5",
                    iconCol: "text-amber-300", statCol: "text-amber-300",
                  },
                  {
                    Icon: RefreshCw, label: "2º Toque · D+3", desc: "Follow-up automático sem intervenção humana",
                    stat: "71%", unit: "engajados", widthPct: 73,
                    border: "border-orange-400/30", bg: "bg-orange-500/5",
                    iconCol: "text-orange-400", statCol: "text-orange-400",
                  },
                  {
                    Icon: Target, label: "3º Toque · D+7", desc: "Oferta especial para leads frios",
                    stat: "48%", unit: "respondem", widthPct: 59,
                    border: "border-orange-500/35", bg: "bg-orange-500/10",
                    iconCol: "text-orange-400", statCol: "text-orange-400",
                  },
                  {
                    Icon: TrendingUp, label: "Conversão Final", desc: "Clientes que só existem com automação",
                    stat: "32", unit: "fechados", widthPct: 45,
                    border: "border-emerald-500/40", bg: "bg-emerald-500/10",
                    iconCol: "text-emerald-400", statCol: "text-emerald-400",
                  },
                ].map((stage, i) => (
                  <div key={i}>
                    {i > 0 && (
                      <div className="flex justify-center py-0.5">
                        <ArrowDown className="h-3.5 w-3.5 text-zinc-700" />
                      </div>
                    )}
                    <motion.div
                      whileHover={{ scale: 1.015 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      style={{ width: `${stage.widthPct}%` }}
                      className={`mx-auto rounded-2xl border ${stage.bg} ${stage.border} px-5 py-4 flex items-center gap-3.5 transition-all duration-300`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-zinc-900/80 border border-zinc-800/70 flex items-center justify-center shrink-0">
                        <stage.Icon className={`h-4 w-4 ${stage.iconCol}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-100 truncate">{stage.label}</p>
                        <p className="text-xs text-zinc-500 truncate">{stage.desc}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-xl font-black tabular-nums ${stage.statCol}`}>{stage.stat}</p>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-wide">{stage.unit}</p>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </div>
              {/* Funnel footer label */}
              <div className="mt-5 flex items-center gap-2 px-2">
                <div className="h-px flex-1 bg-gradient-to-r from-amber-500/30 to-transparent" />
                <p className="text-xs text-zinc-600 whitespace-nowrap">Sequência 100% automática · sem intervenção humana</p>
                <div className="h-px flex-1 bg-gradient-to-l from-orange-500/20 to-transparent" />
              </div>
            </FadeInUp>

            {/* ── DIREITA: stats + money card + features + CTA ── */}
            <FadeInUp delay={0.15} className="space-y-4">

              {/* Stat rows */}
              {[
                { num: "67%",  label: "não fecham no 1º contato",          border: "border-amber-500/20",   numColor: "text-amber-400"  },
                { num: "3×",   label: "mais conversão com follow-up ativo", border: "border-orange-500/20",  numColor: "text-orange-400" },
                { num: "–60%", label: "menos leads perdidos com IA",        border: "border-emerald-500/20", numColor: "text-emerald-400"},
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`flex items-center gap-4 p-4 rounded-xl border bg-zinc-900/50 ${stat.border} hover:bg-zinc-900/80 transition-colors`}
                >
                  <span className={`text-3xl font-black tabular-nums w-20 shrink-0 ${stat.numColor}`}>{stat.num}</span>
                  <p className="text-sm text-zinc-400">{stat.label}</p>
                </motion.div>
              ))}

              {/* Money card */}
              <div className="relative p-6 rounded-2xl overflow-hidden border border-amber-500/25 bg-gradient-to-br from-zinc-900/90 to-zinc-900/50">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.1),transparent_60%)] pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-zinc-500 uppercase tracking-widest mb-1.5">Receita média reativada / mês</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-black text-amber-400 tracking-tight">R$ 4.200</span>
                      <span className="text-zinc-500 text-sm font-medium">/mês</span>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <DollarSign className="h-5 w-5 text-amber-400" />
                  </div>
                </div>
              </div>

              {/* Feature mini grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { Icon: Bell,       title: "Alertas em tempo real", desc: "Notificação ao responder" },
                  { Icon: Target,     title: "Detecção de intenção",  desc: "IA age antes que esfrie" },
                  { Icon: TrendingUp, title: "Escalada inteligente",  desc: "Humano só quando necessário" },
                  { Icon: RefreshCw,  title: "Multi-canal",           desc: "WhatsApp, e-mail e SMS" },
                ].map((f, fi) => (
                  <div key={fi} className="flex items-start gap-2.5 p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700/70 transition-all duration-200">
                    <f.Icon className="h-4 w-4 text-amber-400/80 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-zinc-200 leading-snug">{f.title}</p>
                      <p className="text-[11px] text-zinc-600 mt-0.5 leading-snug">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <motion.a
                href="#contato"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-bold text-sm shadow-[0_0_30px_rgba(245,158,11,0.25)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] transition-shadow"
              >
                <TrendingUp className="h-4 w-4" />
                Recuperar meus leads agora
              </motion.a>
            </FadeInUp>
          </div>
        </div>
      </section>

      <section className="section-render-opt py-24 max-w-7xl mx-auto px-6 relative">
        <FadeInUp className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight flex flex-wrap justify-center items-center gap-2">
            O caminho para a <Typewriter words={["eficiência.", "escala.", "consistência."]} className="text-violet-500 min-w-[140px] sm:min-w-[220px]" />
          </h2>
          <p className="text-zinc-400 mt-4 max-w-xl mx-auto">Implementação pensada para reduzir carga da equipe e melhorar a experiência de quem chama sua empresa.</p>
        </FadeInUp>

        <div className="max-w-4xl mx-auto space-y-4 relative">
          <div className="absolute left-[38px] sm:left-[52px] top-10 bottom-10 w-[2px] bg-zinc-800/50 hidden sm:block overflow-hidden">
            <div className="absolute top-0 left-0 w-full bg-gradient-to-b from-transparent via-violet-500 to-transparent h-1/3 animate-progress-light-vertical" />
          </div>

          {steps.map((step, i) => {
            const isActive = activeStep === i;

            return (
              <FadeInUp key={i} delay={i * 0.1} className="relative z-10">
                <div
                  onClick={() => setActiveStep(isActive ? null : i)}
                  className={`group relative p-6 sm:p-8 rounded-2xl backdrop-blur-md border transition-all duration-500 overflow-hidden cursor-pointer ${
                    isActive
                      ? "bg-zinc-900/80 border-violet-500/40 shadow-[0_10px_40px_rgba(139,92,246,0.05)]"
                      : "bg-zinc-900/30 border-zinc-800/50 hover:bg-zinc-900/50 hover:border-zinc-700"
                  }`}
                >
                  <span className={`absolute -bottom-4 -right-2 text-[100px] font-black transition-colors duration-500 select-none pointer-events-none ${
                    isActive ? "text-violet-500/5" : "text-zinc-800/20 group-hover:text-zinc-700/30"
                  }`}>
                    {step.num}
                  </span>

                  <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent transition-opacity duration-500 ${isActive ? "opacity-100" : "opacity-0"}`} />

                  <div className="flex items-start sm:items-center gap-4 sm:gap-8 relative z-10">
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl border flex items-center justify-center transition-all duration-500 shrink-0 mt-1 sm:mt-0 ${
                      isActive
                        ? "bg-violet-500/10 border-violet-500/30 text-violet-400 scale-110 shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                        : "bg-zinc-950 border-zinc-800 text-zinc-500 group-hover:text-violet-400 group-hover:border-zinc-700"
                    }`}>
                      <step.icon className="h-6 w-6 sm:h-8 sm:w-8" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between pt-2 sm:pt-0">
                        <h3 className={`text-xl sm:text-2xl font-bold transition-colors ${isActive ? "text-zinc-100" : "text-zinc-300"}`}>
                          {step.title}
                        </h3>
                        <motion.div
                          animate={{ rotate: isActive ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="shrink-0 ml-4"
                        >
                          <ChevronDown className={`h-5 w-5 sm:h-6 sm:w-6 transition-colors ${isActive ? "text-violet-400" : "text-zinc-600 group-hover:text-zinc-400"}`} />
                        </motion.div>
                      </div>

                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl pr-4 sm:pr-10 mb-5">
                              {step.desc}
                            </p>

                            {step.checklist && step.checklist.length > 0 && (
                              <ul className="space-y-2.5 pb-2">
                                {step.checklist.map((item, idx) => (
                                  <motion.li
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + (idx * 0.1) }}
                                    className="flex items-center gap-3 text-sm sm:text-base text-zinc-300 font-medium"
                                  >
                                    <div className="w-5 h-5 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
                                      <Check className="w-3 h-3 text-violet-400" />
                                    </div>
                                    {item}
                                  </motion.li>
                                ))}
                              </ul>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </FadeInUp>
            );
          })}
        </div>
      </section>

      <section className="section-render-opt py-24 bg-zinc-950 relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-violet-500/5 blur-[150px] rounded-t-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <FadeInUp className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold flex flex-wrap justify-center items-center gap-2">
              Estrutura <Typewriter words={["enxuta.", "escalável.", "inteligente."]} className="text-violet-500" />
            </h2>
            <p className="text-zinc-400 mt-4">Escolha o nível de automação ideal para a fase atual da sua operação.</p>
          </FadeInUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <FadeInUp key={i} delay={i * 0.1} className="h-full">
                <motion.div
                  onMouseMove={updateSpotlightPosition}
                  className={`group relative flex flex-col h-full p-8 rounded-2xl border transition-all duration-500 bg-zinc-900/40 backdrop-blur-md overflow-hidden ${
                    plan.popular
                      ? "border-violet-500/30 shadow-[0_0_30px_rgba(139,92,246,0.1)] scale-[1.02] md:scale-105 z-20 bg-zinc-900/80"
                      : "border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div
                    className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-0"
                    style={{
                      background: `radial-gradient(600px circle at var(--mouse-x, 0) var(--mouse-y, 0), ${plan.popular ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.05)"}, transparent 40%)`,
                    }}
                  />

                  {plan.popular && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="pricing-beam-popular" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
                          <stop offset="50%" stopColor="#8b5cf6" stopOpacity="1" />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <rect width="100%" height="100%" rx="16" fill="transparent" />
                      <rect
                        width="100%"
                        height="100%"
                        rx="16"
                        fill="transparent"
                        stroke="url(#pricing-beam-popular)"
                        strokeWidth="3"
                        pathLength="100"
                        strokeDasharray="20 80"
                        className="animate-border-beam opacity-80"
                      />
                    </svg>
                  )}

                  <div className={`relative z-10 flex flex-col h-full ${plan.popular ? "pt-6 md:pt-0" : ""}`}>
                    {plan.popular && (
                      <span className="absolute left-1/2 -top-4 z-20 -translate-x-1/2 rounded-full bg-violet-500 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-950 shadow-[0_0_15px_rgba(139,92,246,0.5)] animate-pulse md:-top-5">
                        Mais Contratado
                      </span>
                    )}
                    <h3 className="text-lg font-semibold text-zinc-100">{plan.name}</h3>
                    <p className="mt-2 text-sm text-zinc-400 min-h-[40px]">{plan.desc}</p>

                    {plan.implementation && (
                      <div className="mt-4">
                        <span className="inline-flex items-center rounded-full border border-cyan-300/40 bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-200 shadow-[0_0_18px_rgba(45,212,191,0.32)]">
                          Implementação: R$ {plan.implementation}
                        </span>
                      </div>
                    )}

                    <div className="my-6 relative">
                      {plan.price === "Sob Consulta" ? (
                        <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">{plan.price}</span>
                      ) : (
                        <div className="flex items-baseline">
                          <span className="text-xl font-semibold text-zinc-500 mr-1">R$</span>
                          <span className="text-5xl font-bold tracking-tight text-white">{plan.price}</span>
                        </div>
                      )}
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                          <span className="text-sm text-zinc-300 leading-snug">{feat}</span>
                        </li>
                      ))}
                    </ul>

                    <a
                      href="#contato"
                      className={`btn-metallic w-full mt-auto flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 ${
                        plan.popular
                          ? "bg-violet-500 text-zinc-950 hover:bg-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]"
                          : "bg-white/5 backdrop-blur-md border border-white/10 text-zinc-100 hover:bg-white/10 hover:border-white/20"
                      }`}
                    >
                      Escolher Plano
                    </a>
                  </div>
                </motion.div>
              </FadeInUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── GARANTIA ── */}
      <section className="section-render-opt py-24 bg-zinc-950 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <FadeInUp className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <Shield className="h-3 w-3" />
              Compra 100% segura
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              Você não arrisca{" "}
              <span className="text-emerald-400">absolutamente nada</span>
            </h2>
            <p className="text-zinc-400 mt-3 text-sm max-w-lg mx-auto">
              Toda contratação da ChatFocus vem com proteções concretas. Sua confiança é nossa prioridade.
            </p>
          </FadeInUp>

          <div className="grid sm:grid-cols-2 gap-4 mb-12">
            {[
              {
                Icon: ShieldCheck,
                title: "Garantia de 7 dias",
                desc: "Não ficou satisfeito? Devolvemos 100% do seu investimento sem perguntas, dentro dos primeiros 7 dias.",
                barColor: "bg-emerald-500",
                iconClass: "text-emerald-400",
                iconBg:    "bg-emerald-500/10",
              },
              {
                Icon: Zap,
                title: "Setup em até 48h",
                desc: "Sua IA estará operando em menos de 48 horas após a contratação. Sem enrolação, sem espera.",
                barColor: "bg-violet-500",
                iconClass: "text-violet-400",
                iconBg:    "bg-violet-500/10",
              },
              {
                Icon: Users,
                title: "Suporte dedicado",
                desc: "Time especializado à disposição. Você nunca fica sozinho na implementação ou ajustes do fluxo.",
                barColor: "bg-blue-500",
                iconClass: "text-blue-400",
                iconBg:    "bg-blue-500/10",
              },
              {
                Icon: TrendingUp,
                title: "Resultado ou reembolso",
                desc: "Se em 30 dias não houver melhora mensurável no atendimento, renegociamos o contrato ou devolvemos.",
                barColor: "bg-amber-500",
                iconClass: "text-amber-400",
                iconBg:    "bg-amber-500/10",
              },
            ].map(({ Icon, title, desc, barColor, iconClass, iconBg }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="relative rounded-2xl border border-zinc-800/60 bg-zinc-900/50 overflow-hidden flex gap-5 px-6 py-5 items-start"
              >
                {/* Accent left bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${barColor} opacity-80`} />
                <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon className={`h-5 w-5 ${iconClass}`} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white mb-1">{title}</div>
                  <div className="text-xs text-zinc-400 leading-relaxed">{desc}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="flex flex-wrap items-center justify-center gap-6 pt-6 border-t border-zinc-800/60"
          >
            {[
              { Icon: ShieldCheck, text: "Pagamento seguro"      },
              { Icon: Lock,        text: "Dados criptografados"  },
              { Icon: Star,        text: "4.9 de satisfação"     },
              { Icon: CheckCheck,  text: "Contrato transparente" },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Icon className="h-3.5 w-3.5 text-emerald-400" />
                <span>{text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="section-render-opt py-24 max-w-6xl mx-auto px-6 relative z-10">
        <FadeInUp className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs sm:text-sm font-semibold uppercase tracking-[0.22em]">
            FAQ Estratégico
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mt-6">
            Respostas que <span className="text-violet-500">tiram o medo da automação.</span>
          </h2>
          <p className="text-zinc-400 mt-4 max-w-2xl mx-auto">
            O que empresas locais normalmente querem entender antes de colocar IA para atender clientes.
          </p>
        </FadeInUp>
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.82fr)_minmax(280px,0.38fr)] gap-6 items-start">
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <FadeInUp key={i} delay={i * 0.08}>
                <div
                  className={`group border rounded-[1.75rem] transition-all duration-300 overflow-hidden backdrop-blur-sm ${
                    openFaq === i
                      ? "border-violet-500/40 bg-zinc-900/85 shadow-[0_0_35px_rgba(139,92,246,0.06)]"
                      : "border-zinc-800 bg-zinc-900/35 hover:border-zinc-700 hover:bg-zinc-900/55"
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-5 sm:px-6 py-5 sm:py-6 flex items-start sm:items-center justify-between gap-4 text-left focus:outline-none"
                  >
                    <div className="flex items-start gap-4 pr-2">
                      <span className={`mt-0.5 flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full text-[11px] sm:text-xs font-bold tracking-widest ${
                        openFaq === i
                          ? "bg-violet-500/15 text-violet-400 border border-violet-500/20"
                          : "bg-white/5 text-zinc-500 border border-white/5"
                      }`}>
                        0{i + 1}
                      </span>
                      <span className="font-semibold text-zinc-100 text-base sm:text-lg leading-snug">
                        {faq.q}
                      </span>
                    </div>
                    <motion.div
                      animate={{ rotate: openFaq === i ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className={`flex-shrink-0 p-2 rounded-full transition-colors ${
                        openFaq === i ? "bg-violet-500/15 text-violet-400" : "bg-white/5 text-zinc-500 group-hover:text-zinc-300"
                      }`}
                    >
                      <ChevronDown className="h-5 w-5" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div className="px-5 sm:px-6 pb-6 pt-0">
                          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-5" />
                          <p className="text-zinc-400 leading-relaxed text-sm sm:text-base">
                            {faq.a}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeInUp>
            ))}
          </div>

          <FadeInUp delay={0.15}>
            <div className="sticky top-24 rounded-[2rem] border border-violet-500/15 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.08),transparent_45%),rgba(24,24,27,0.72)] p-6 sm:p-7 backdrop-blur-xl shadow-[0_0_35px_rgba(0,0,0,0.28)]">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-violet-400">
                Atendimento
              </div>
              <h3 className="mt-5 text-2xl font-bold tracking-tight text-zinc-100">
                Ainda ficou alguma dúvida?
              </h3>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-zinc-400">
                Fale direto com a equipe e entenda onde a IA entra primeiro para dar ganho real sem complicar sua operação.
              </p>

              <div className="mt-6 space-y-3">
                {["WhatsApp com IA", "Triagem automática", "Fluxos de follow-up", "Diagnóstico da operação"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
                      <Check className="h-4 w-4 text-violet-400" />
                    </div>
                    <span className="text-sm text-zinc-300">{item}</span>
                  </div>
                ))}
              </div>

              <a
                href="https://wa.me/5543991466255"
                target="_blank"
                rel="noreferrer"
                className="btn-metallic mt-7 flex w-full items-center justify-center gap-3 rounded-2xl bg-violet-500 px-5 py-4 text-sm sm:text-base font-bold text-zinc-950 transition-all hover:bg-violet-400"
              >
                <WhatsAppIcon className="h-5 w-5" />
                Falar no WhatsApp
              </a>
            </div>
          </FadeInUp>
        </div>
      </section>

      <section id="contato" className="section-render-opt py-24 md:py-32 px-6 relative overflow-hidden flex justify-center">
        <div className="absolute inset-0 bg-zinc-950" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="relative w-full max-w-5xl z-10">
          <div className="relative group rounded-[2.5rem] p-[2px] overflow-hidden">
            <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0%,transparent_35%,#8b5cf6_45%,#6d28d9_50%,transparent_50%,transparent_85%,#8b5cf6_95%,#6d28d9_100%)] animate-[spin_10s_linear_infinite] opacity-80" />
            <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0%,transparent_35%,#8b5cf6_45%,#6d28d9_50%,transparent_50%,transparent_85%,#8b5cf6_95%,#6d28d9_100%)] animate-[spin_10s_linear_infinite] blur-2xl opacity-60" />

            <div className="relative bg-zinc-950/90 backdrop-blur-xl rounded-[2.4rem] py-20 px-6 sm:px-12 flex flex-col items-center justify-center text-center overflow-hidden border border-zinc-900/50 shadow-2xl">
              <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-violet-700/10 rounded-full blur-[80px] pointer-events-none" />

              <FadeInUp className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center md:hidden">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-violet-400">
                  <Zap className="h-4 w-4 fill-current" /> Diagnóstico Rápido
                </div>

                <h2 className="mb-5 flex flex-col flex-wrap items-center justify-center gap-y-2 text-center text-[1.45rem] font-bold tracking-tight leading-[1.12]">
                  <span>Pronto para parar de</span>
                  <Typewriter words={["perder leads?", "sobrecarregar a equipe?", "atender no improviso?"]} className="text-violet-500 justify-center text-[1.45rem] leading-tight" />
                </h2>

                <p className="mb-8 max-w-md text-center text-base leading-relaxed text-zinc-400">
                  Fale com a equipe, mostre como seu atendimento funciona hoje e receba uma direção clara de onde a IA pode reduzir custo e melhorar a resposta ao cliente.
                </p>

                <motion.a
                  whileTap={{ scale: 0.97 }}
                  href="https://wa.me/5543991466255"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-metallic relative inline-flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-violet-500 px-6 py-4 text-base font-bold text-zinc-950 shadow-[0_0_30px_rgba(139,92,246,0.35)] transition-all hover:bg-violet-400"
                >
                  <WhatsAppIcon className="relative z-10 h-5 w-5" />
                  <span className="relative z-10">Falar no WhatsApp</span>
                </motion.a>
              </FadeInUp>

              <FadeInUp className="relative z-10 mx-auto hidden max-w-3xl flex-col items-center md:flex">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs sm:text-sm font-bold mb-8 uppercase tracking-widest">
                  <Zap className="w-4 h-4 fill-current" /> Diagnostico Rapido
                </div>

                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 flex flex-col md:flex-row flex-wrap justify-center items-center gap-x-3 gap-y-2 tracking-tight text-center">
                  <span>Pronto para parar de</span>
                  <Typewriter words={["perder leads?", "sobrecarregar a equipe?", "atender no improviso?"]} className="text-violet-500 justify-center md:justify-start md:min-w-[340px]" />
                </h2>

                <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl leading-relaxed text-center">
                  Fale com a equipe, mostre como seu atendimento funciona hoje e receba uma direção clara de onde a IA pode reduzir custo e melhorar a resposta ao cliente.
                </p>

                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="https://wa.me/5543991466255"
                  target="_blank" rel="noreferrer"
                  className="btn-metallic inline-flex items-center gap-3 px-6 sm:px-10 py-5 rounded-2xl font-bold text-base sm:text-xl bg-violet-500 text-zinc-950 hover:bg-violet-400 shadow-[0_0_40px_rgba(139,92,246,0.4)] transition-all relative overflow-hidden group whitespace-nowrap"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <WhatsAppIcon className="h-6 w-6 relative z-10" />
                  <span className="relative z-10">Falar no WhatsApp</span>
                </motion.a>
              </FadeInUp>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-white/5 bg-zinc-950 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
          <a href="#" className="order-1 md:order-none flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/60 border border-zinc-800/80 shadow-sm backdrop-blur-md hover:border-violet-500/40 hover:bg-zinc-900 transition-all cursor-pointer group">
            <FocusPageLogo className="w-4 h-4 text-violet-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold tracking-tight text-zinc-100">
              Chat<span className="text-violet-500">Focus</span>
            </span>
          </a>

          <p className="order-3 md:order-none text-sm text-zinc-500 font-medium">
            © {new Date().getFullYear()} ChatFocus. Todos os direitos reservados.
          </p>

          <div className="order-2 md:order-none flex items-center gap-3">
            <a href="https://www.instagram.com/focusmidia.ai/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-zinc-900/50 border border-zinc-800/50 flex items-center justify-center text-zinc-400 hover:text-violet-400 hover:border-violet-500/30 hover:bg-zinc-900 transition-all">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-zinc-900/50 border border-zinc-800/50 flex items-center justify-center text-zinc-400 hover:text-violet-400 hover:border-violet-500/30 hover:bg-zinc-900 transition-all">
              <Linkedin className="h-4 w-4" />
            </a>
            <a href="https://wa.me/5543991466255" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-zinc-900/50 border border-zinc-800/50 flex items-center justify-center text-zinc-400 hover:text-violet-400 hover:border-violet-500/30 hover:bg-zinc-900 transition-all">
              <WhatsAppIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
      </footer>

      {/* ── FLOATING WHATSAPP BUTTON ── */}
      <motion.a
        href="https://wa.me/5543991466255"
        target="_blank"
        rel="noreferrer"
        initial={{ opacity: 0, scale: 0.5, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.4, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full shadow-lg shadow-emerald-500/30 transition-colors pl-4 pr-5 py-3 sm:pl-4 sm:pr-5"
        aria-label="Fale conosco no WhatsApp"
      >
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
        </span>
        <WhatsAppIcon className="h-5 w-5 shrink-0" />
        <span className="hidden sm:inline text-sm font-semibold tracking-tight whitespace-nowrap">Falar com especialista</span>
      </motion.a>
    </>
  );
}
