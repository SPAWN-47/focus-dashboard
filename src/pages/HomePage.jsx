import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { LazyMotion, domAnimation, m as motion, useMotionValue, useTransform, animate, useScroll, useSpring, useInView } from "framer-motion";
import {
  ArrowRight, Zap, Link as LinkIcon, Monitor,
  ShoppingCart, Search, PenTool, Code, Rocket, Clock3, TrendingDown, ShieldCheck, BadgeCheck,
  MessageCircle, Globe, Calendar, RefreshCw, BarChart2,
} from "lucide-react";

const NOISE_TEXTURE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;
const FocusPageBelowFold = lazy(() => import("./FocusPageBelowFold"));
const FocusPageProjectModal = lazy(() => import("./FocusPageProjectModal"));

// --- HOOKS & COMPONENTES UTILITÁRIOS ---

// Logo ChatFocus
const FocusPageLogo = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H10l-4 3v-3.5A2.5 2.5 0 0 1 5 12.5z" />
    <path d="M9 8.75h6" />
    <path d="M9 11.75h4.5" />
    <circle cx="17.5" cy="17.5" r="2.5" fill="#8b5cf6" stroke="none" />
  </svg>
);

const WhatsAppIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const CustomCursor = () => {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 300, damping: 28, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 300, damping: 28, mass: 0.5 });

  useEffect(() => {
    const canUseCursor = window.matchMedia("(pointer: fine)").matches;
    if (!canUseCursor) return;
    const onMove = (e) => { x.set(e.clientX - 16); y.set(e.clientY - 16); };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [x, y]);

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 rounded-full border border-violet-500/50 pointer-events-none z-[100] hidden md:flex items-center justify-center bg-violet-500/10 backdrop-blur-[2px]"
      style={{ x: springX, y: springY }}
    >
      <div className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
    </motion.div>
  );
};

const AnimatedNumber = ({ value, suffix = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const unsubscribe = rounded.on("change", (v) => setDisplayValue(v));
    const controls = animate(count, value, { duration: 2, type: "tween", ease: "easeOut" });
    return () => { controls.stop(); unsubscribe(); };
  }, [isInView, value, count, rounded]);

  return <motion.span ref={ref}>{displayValue}{suffix}</motion.span>;
};

const FadeInUp = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-10px" }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

const heroIndicators = [
  {
    icon: Clock3,
    color: "cyan",
    value: "24/7",
    label: "Atendimento Contínuo",
    hint: "sempre ativo",
  },
  {
    icon: TrendingDown,
    color: "emerald",
    value: "Até 60%",
    label: "Redução de Custo Operacional",
    hint: "mais eficiência",
  },
  {
    icon: ShieldCheck,
    color: "violet",
    value: "0",
    label: "Oscilação de Humor na Resposta",
    hint: "tom consistente",
  },
];

function MobileHeroIndicators() {
  const cardWidth = 236;
  const cardGap = 12;
  const loopDistance = heroIndicators.length * (cardWidth + cardGap);

  const colorClasses = {
    cyan: {
      iconWrap: "border-cyan-300/30 bg-cyan-400/10 text-cyan-200",
      hint: "text-cyan-300/85",
    },
    emerald: {
      iconWrap: "border-emerald-300/30 bg-emerald-400/10 text-emerald-200",
      hint: "text-emerald-300/85",
    },
    violet: {
      iconWrap: "border-violet-300/30 bg-violet-400/10 text-violet-200",
      hint: "text-violet-300/85",
    },
  };

  const loopItems = [...heroIndicators, ...heroIndicators];

  return (
    <div className="overflow-hidden px-2 py-1">
      <motion.div
        className="flex w-max gap-3"
        animate={{ x: [0, -loopDistance] }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      >
        {loopItems.map((item, index) => {
          const Icon = item.icon;
          const color = colorClasses[item.color];
          return (
            <div
              key={`mobile-indicator-${index}`}
              className="w-[236px] shrink-0 border-r border-zinc-800/70 px-4 py-4 flex flex-col items-center justify-center"
            >
              <span className={`mb-3 rounded-xl border p-2.5 ${color.iconWrap}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-2xl font-extrabold text-zinc-100 tracking-tight drop-shadow-sm">{item.value}</span>
              <span className="mt-2 text-center text-xs leading-tight text-zinc-300 font-semibold">{item.label}</span>
              <span className={`mt-2 text-[10px] uppercase tracking-[0.16em] ${color.hint}`}>{item.hint}</span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

function DesktopHeroIndicators() {
  return (
    <div className="grid grid-cols-3 divide-x divide-zinc-800/80">
      <div className="flex flex-col items-center justify-center px-4 py-8">
        <span className="mb-3 rounded-xl border border-cyan-300/30 bg-cyan-400/10 p-2.5 text-cyan-200">
          <Clock3 className="h-4 w-4" />
        </span>
        <span className="text-4xl md:text-5xl font-extrabold text-zinc-100 tracking-tight drop-shadow-sm">
          <AnimatedNumber value={24} suffix="" />/7
        </span>
        <span className="mt-2 text-center text-sm md:text-base leading-tight text-zinc-300 font-semibold">Atendimento Contínuo</span>
        <span className="mt-2 text-[10px] uppercase tracking-[0.16em] text-cyan-300/85">sempre ativo</span>
      </div>

      <div className="flex flex-col items-center justify-center px-4 py-8">
        <span className="mb-3 rounded-xl border border-emerald-300/30 bg-emerald-400/10 p-2.5 text-emerald-200">
          <TrendingDown className="h-4 w-4" />
        </span>
        <span className="text-4xl md:text-5xl font-extrabold text-zinc-100 tracking-tight drop-shadow-sm">
          Até <AnimatedNumber value={60} suffix="%" />
        </span>
        <span className="mt-2 text-center text-sm md:text-base leading-tight text-zinc-300 font-semibold">Redução de Custo Operacional</span>
        <span className="mt-2 text-[10px] uppercase tracking-[0.16em] text-emerald-300/85">mais eficiência</span>
      </div>

      <div className="flex flex-col items-center justify-center px-4 py-8">
        <span className="mb-3 rounded-xl border border-violet-300/30 bg-violet-400/10 p-2.5 text-violet-200">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <span className="text-4xl md:text-5xl font-extrabold text-zinc-100 tracking-tight drop-shadow-sm">
          <AnimatedNumber value={0} suffix="" />
        </span>
        <span className="mt-2 text-center text-sm md:text-base leading-tight text-zinc-300 font-semibold">Oscilação de Humor na Resposta</span>
        <span className="mt-2 text-[10px] uppercase tracking-[0.16em] text-violet-300/85">tom consistente</span>
      </div>
    </div>
  );
}

// Typewriter Melhorado: Sem "pulos" de Layout no Mobile (Anti Layout Shift Grid Trick)
const Typewriter = ({ words, className = "" }) => {
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pega a palavra mais longa para criar o "bloco fantasma" e não deixar a tela encolher/pular
  const longestWord = useMemo(
    () => words.reduce((longest, current) => (current.length > longest.length ? current : longest), ""),
    [words],
  );

  useEffect(() => {
    const currentWord = words[wordIndex];
    let timeout;
    if (isDeleting) {
      timeout = setTimeout(() => {
        setText(currentWord.substring(0, text.length - 1));
        if (text === "") {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        }
      }, 40);
    } else {
      if (text === currentWord) {
        timeout = setTimeout(() => setIsDeleting(true), 2000);
      } else {
        timeout = setTimeout(() => {
          setText(currentWord.substring(0, text.length + 1));
        }, 100);
      }
    }
    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex, words]);

  return (
    <span className={`inline-grid ${className}`}>
      <span className="col-start-1 row-start-1 invisible whitespace-nowrap pointer-events-none" aria-hidden="true">
        {longestWord}
        <span className="inline-block w-[3px] ml-1 sm:ml-2" />
      </span>
      <span className="col-start-1 row-start-1 flex items-center whitespace-nowrap">
        {text}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
          className="inline-block w-[3px] h-[0.9em] bg-current ml-1 sm:ml-2 -translate-y-[2px] rounded-full"
        />
      </span>
    </span>
  );
};

// --- DADOS ---

const services = [
  {
    icon: MessageCircle,
    color: "violet",
    title: "Atendimento no WhatsApp",
    desc: "IA que responde, qualifica e direciona clientes sem depender de equipe online o dia todo.",
    features: ["Resposta automática em menos de 5 segundos", "Triagem e qualificação de intenção", "Escalada para humano quando necessário"],
  },
  {
    icon: Globe,
    color: "cyan",
    title: "Chat no Site",
    desc: "Seu site atendendo 24 horas por dia com respostas rápidas, padronizadas e sem perder lead.",
    features: ["Widget instalável em qualquer plataforma", "Captura e armazena leads automaticamente", "Sincroniza com WhatsApp e CRM"],
  },
  {
    icon: Calendar,
    color: "emerald",
    title: "Agendamento Inteligente",
    desc: "Automação para marcar horários, filtrar intenção e reduzir idas e voltas no atendimento.",
    features: ["Agendamento por conversa natural", "Confirmação e lembrete automático", "Integração com Google Calendar"],
  },
  {
    icon: RefreshCw,
    color: "rose",
    title: "Recuperação de Orçamentos",
    desc: "Fluxos que retomam contatos parados e fazem follow-up sem desgaste humano.",
    features: ["Follow-up em até 3 tentativas automáticas", "Mensagens personalizadas por perfil", "Reativação de leads frios via IA"],
  },
  {
    icon: PenTool,
    color: "amber",
    title: "Scripts de Conversa",
    desc: "Tom de voz, objeções e respostas treinadas para vender mais e errar menos.",
    features: ["Treinado com a linguagem do seu negócio", "Respostas prontas para objeções comuns", "Melhoria contínua por análise de conversas"],
  },
  {
    icon: BarChart2,
    color: "sky",
    title: "Relatórios e Performance",
    desc: "Visibilidade sobre tempo de resposta, volume de contatos e oportunidades geradas.",
    features: ["Dashboard com métricas em tempo real", "Taxa de conversão por canal e horário", "Relatório semanal enviado por e-mail"],
  },
];

const nichesLine1 = [
  "Clínicas Médicas", "Escritórios de Advocacia", "Restaurantes e Delivery",
  "Lojas de Roupas", "Estética e Beleza", "Imobiliárias", "Consultorias Corporativas"
];

const nichesLine2 = [
  "Oficinas Automotivas", "Infoprodutores e Mentores", "Profissionais Liberais",
  "Odontologia Especializada", "Academias e Crossfit", "Agências de Turismo", "Arquitetura e Engenharia"
];

const galleryRow1 = [
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1555421689-d68471e189f2?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=600&q=80"
];

const galleryRow2 = [
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1618761714954-0b8cd0026356?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80"
];

const portfolio = [
  {
    id: 1,
    title: "Clínica Odonto Prime",
    category: "Atendimento com IA",
    tags: ["Odonto", "Triagem", "WhatsApp IA"],
    mockImage: "bg-zinc-800",
    visualType: "image",
    visualImage: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80",
    challenge: "A equipe perdia contatos fora do horário comercial, demorava para responder e deixava o WhatsApp virar uma fila desorganizada.",
    solution: "Estruturamos uma IA para responder dúvidas iniciais, filtrar interesse real, coletar dados do paciente e encaminhar só os casos certos para a recepção.",
    resultStat: "-63%",
    resultText: "No tempo operacional gasto com atendimento repetitivo."
  },
  {
    id: 2,
    title: "Bella Estética",
    category: "Automação Comercial",
    tags: ["Leads", "Follow-up", "Estética"],
    mockImage: "bg-zinc-900",
    visualType: "image",
    visualImage: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
    challenge: "A empresa respondia bem quando a equipe estava disponível, mas perdia dinheiro à noite, nos finais de semana e nos horários de pico.",
    solution: "Criamos um fluxo de IA para atendimento inicial, respostas instantâneas, recuperação de interessados e encaminhamento para fechamento humano quando necessário.",
    resultStat: "24/7",
    resultText: "De cobertura no atendimento sem ampliar a folha."
  },
  {
    id: 3,
    title: "Auto Center Local",
    category: "IA para Empresas Locais",
    tags: ["Oficina", "Orçamento", "WhatsApp"],
    mockImage: "bg-zinc-800",
    visualType: "image",
    visualImage: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80",
    challenge: "A maior parte do atendimento era tomada por perguntas repetidas: preço, horário, serviços, disponibilidade e status de orçamento.",
    solution: "A IA assumiu o primeiro contato, organizou a triagem e deixou a equipe focada no que realmente gera receita: aprovação, execução e fidelização.",
    resultStat: "+41%",
    resultText: "Mais orçamentos respondidos em menos tempo."
  },
  {
    id: 4,
    title: "Imobiliária Centro",
    category: "Atendimento Omnichannel",
    tags: ["Imóveis", "Qualificação", "Lead Quente"],
    mockImage: "bg-zinc-900",
    visualType: "image",
    visualImage: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80",
    challenge: "A equipe comercial recebia curiosos e leads frios misturados com oportunidades reais, desperdiçando horas em conversas sem prioridade.",
    solution: "Desenhamos uma IA para identificar perfil, urgência e faixa de interesse antes do corretor entrar na conversa.",
    resultStat: "3x",
    resultText: "Mais velocidade na qualificação de leads."
  }
];

const testimonials = [
  {
    name: "Dra. Camila Rocha",
    role: "Diretora Clínica",
    business: "Clínica OdontoVita",
    avatar: "CR",
    rating: 5,
    text: "A recepção parou de ficar presa respondendo a mesma pergunta toda hora. A IA faz o trabalho inicial e a equipe só entra quando o paciente está pronto para agendar.",
    color: "cyan",
  },
  {
    name: "Rafael Mendes",
    role: "Sócio",
    business: "Mendes & Associados",
    avatar: "RM",
    rating: 5,
    text: "Ficamos surpresos com o nível de personalização. A IA responde dentro do tom do escritório, sem parecer robótica. Perdemos menos oportunidades fora do horário comercial.",
    color: "violet",
  },
  {
    name: "Patrícia Lima",
    role: "Proprietária",
    business: "Studio P — Estética",
    avatar: "PL",
    rating: 5,
    text: "Perdia agendamentos nos finais de semana. Agora a IA organiza a fila, coleta os dados e quando abro na segunda já tem clientes confirmados esperando.",
    color: "emerald",
  },
];

const plans = [
  {
    name: "Starter",
    desc: "Para começar a automatizar o atendimento.",
    price: "890",
    implementation: "2.000",
    popular: false,
    features: ["Fluxo inicial no WhatsApp", "Perguntas frequentes treinadas", "Qualificação básica de leads", "Ajuste de tom de voz", "Entrega rápida"],
  },
  {
    name: "Pro",
    desc: "Atendimento automatizado para operar melhor.",
    price: "1.500",
    implementation: "3.000",
    popular: true,
    features: ["IA no WhatsApp e site", "Triagem e encaminhamento", "Recuperação de contatos", "Relatório de conversas", "Implantação assistida"],
  },
  {
    name: "Scale",
    desc: "Para empresas com time e operação maiores.",
    price: "2.400",
    implementation: "5.000",
    popular: false,
    features: ["Múltiplos funis de atendimento", "Setores e regras personalizadas", "Integrações com CRM", "Otimização de scripts", "Acompanhamento contínuo"],
  },
];

const steps = [
  {
    num: "01",
    icon: Search,
    title: "Diagnóstico",
    desc: "Entendemos onde seu atendimento trava, quanto tempo sua equipe perde com repetição e quais conversas a IA deve assumir primeiro.",
    checklist: ["Levantamento de canais", "Mapeamento de gargalos", "Definição de metas operacionais"]
  },
  {
    num: "02",
    icon: PenTool,
    title: "Arquitetura",
    desc: "Desenhamos os fluxos de conversa, regras de triagem, mensagens-chave e pontos de transferência para sua equipe.",
    checklist: ["Roteiro de atendimento", "Quebra de objeções", "Tom de voz da marca"]
  },
  {
    num: "03",
    icon: Code,
    title: "Treinamento da IA",
    desc: "Configuramos a IA com base no seu negócio para responder melhor, encaminhar melhor e operar com consistência.",
    checklist: ["Base de conhecimento", "Fluxos automatizados", "Cenários de validação"]
  },
  {
    num: "04",
    icon: Rocket,
    title: "Operação",
    desc: "Colocamos a automação no ar, acompanhamos os primeiros atendimentos e refinamos o que for necessário para ganhar eficiência.",
    checklist: ["Publicação assistida", "Ajustes finos", "Leitura de performance"]
  },
];

const faqs = [
  {
    q: "Em quanto tempo a IA pode começar a atender?",
    a: "Projetos mais simples podem entrar no ar em poucos dias. Operações com mais regras, setores e integrações exigem um mapeamento maior, mas o cronograma sempre é definido antes do início."
  },
  {
    q: "A IA substitui totalmente minha equipe?",
    a: "Nem sempre. O foco é tirar da equipe o atendimento repetitivo, a triagem inicial e o excesso de demanda. Quando faz sentido, a IA encaminha a conversa para um humano no momento certo."
  },
  {
    q: "O atendimento fica robótico ou frio demais?",
    a: "Não. A IA é treinada com o contexto da empresa, perguntas frequentes, tom de voz e regras de conversa. O objetivo é responder com consistência, sem improviso ruim e sem mau humor."
  },
  {
    q: "Isso ajuda mesmo a reduzir custo com funcionários?",
    a: "Sim. Em muitos casos, a empresa deixa de precisar colocar mais gente só para responder mensagem, fazer triagem ou repetir informações básicas o dia inteiro."
  },
  {
    q: "A IA atende fora do horário comercial?",
    a: "Sim. Esse é um dos ganhos mais importantes. Sua empresa continua respondendo, qualificando e organizando contatos mesmo quando a equipe não está online."
  },
  {
    q: "E se eu precisar ajustar respostas e fluxos depois?",
    a: "A operação pode ser refinada. Depois da implantação inicial, ajustamos mensagens, regras, objeções e encaminhamentos com base no comportamento real dos contatos."
  }
];

// --- MAIN COMPONENT ---

export default function FocusMidiaLandingPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [activeProject, setActiveProject] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [shouldRenderBelowFold, setShouldRenderBelowFold] = useState(false);
  const belowFoldRef = useRef(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    if (activeProject) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [activeProject]);

  useEffect(() => {
    if (shouldRenderBelowFold) {
      return undefined;
    }

    const target = belowFoldRef.current;

    if (!target || typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      setShouldRenderBelowFold(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRenderBelowFold(true);
          observer.disconnect();
        }
      },
      { rootMargin: "1200px 0px" },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [shouldRenderBelowFold]);

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative min-h-screen bg-zinc-950 text-zinc-100 selection:bg-violet-500/30 font-sans overflow-x-hidden">
        <motion.div
          className="fixed top-0 left-0 right-0 h-1 bg-violet-500 origin-left z-[100]"
          style={{ scaleX }}
        />

        <CustomCursor />
        <div
          className="fixed inset-0 z-50 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: NOISE_TEXTURE }}
        />

        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
          className="fixed top-4 sm:top-6 left-0 right-0 z-50 flex justify-center pointer-events-none transition-all duration-300"
        >
          <div className="pointer-events-auto flex w-[calc(100%-2rem)] max-w-md items-center justify-between gap-4 rounded-full border border-zinc-700/50 bg-zinc-900/70 px-4 py-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:w-auto sm:max-w-none sm:justify-start sm:gap-8 sm:px-6">
            <a href="#" className="flex items-center gap-2 group cursor-pointer">
              <div className="bg-zinc-950 p-2 sm:p-1.5 rounded-full sm:rounded-md border border-zinc-800 group-hover:border-violet-500/50 transition-colors shadow-inner flex items-center justify-center">
                <FocusPageLogo className="w-5 h-5 sm:w-4 sm:h-4 text-violet-500 sm:text-zinc-100 group-hover:text-violet-400 transition-colors" />
              </div>
              <span className="block text-base font-bold tracking-tighter sm:text-lg">
                Chat<span className="text-violet-500">Focus</span>
              </span>
            </a>

            <a href="#contato" className="btn-metallic flex items-center justify-center text-sm font-semibold bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 px-4 sm:px-5 py-2 rounded-full border border-violet-500/20 transition-colors whitespace-nowrap">
              Falar com Especialista
            </a>
          </div>
        </motion.nav>

        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 flex flex-col items-center text-center">
          <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />
          {/* Orb principal */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-violet-500/20 blur-[120px] rounded-full pointer-events-none"
          />
          {/* Orbs secundários */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15], x: [0, 20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-1/3 left-[10%] w-[180px] h-[180px] md:w-[300px] md:h-[300px] bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1], x: [0, -15, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
            className="absolute top-1/2 right-[8%] w-[150px] h-[150px] md:w-[250px] md:h-[250px] bg-emerald-500/8 blur-[70px] rounded-full pointer-events-none"
          />
          <motion.div
            animate={{ opacity: [0.05, 0.12, 0.05], y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute bottom-1/4 left-1/3 w-[120px] h-[120px] md:w-[200px] md:h-[200px] bg-violet-400/10 blur-[60px] rounded-full pointer-events-none"
          />

          <div className="relative z-10 w-full max-w-md md:max-w-4xl mx-auto flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs md:text-sm font-medium mb-5 md:mb-6"
            >
              <Zap className="h-3.5 w-3.5 md:h-4 md:w-4" /> Atendimento com IA para Empresas Locais
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              className="text-[2rem] sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
            >
              Sua empresa atendendo melhor, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-violet-600">
                sem depender de mais gente.{" "}
              </span>
              <br />
              <Typewriter
                words={["Sem fila.", "Sem mau humor.", "Sem horário limitado."]}
                className="text-violet-400"
              />
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-5 md:mt-6 text-base md:text-xl text-zinc-400 max-w-2xl"
            >
              Automatize o atendimento da sua empresa com IA para responder mais rápido, reduzir custo operacional e não perder oportunidades fora do horário.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto"
            >
              <a href="#contato" className="btn-metallic flex items-center justify-center gap-2 px-6 md:px-8 py-3.5 md:py-4 rounded-xl font-semibold bg-violet-500/20 backdrop-blur-md border border-violet-500/50 text-violet-50 hover:bg-violet-500/30 hover:border-violet-400/80 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all duration-300">
                Quero automatizar meu atendimento <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#portfolio" className="btn-metallic flex items-center justify-center px-6 md:px-8 py-3.5 md:py-4 rounded-xl font-semibold bg-white/5 backdrop-blur-md border border-white/10 text-zinc-100 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                Ver exemplos
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-10 md:mt-20 w-full md:max-w-5xl mx-auto relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-400/10 to-emerald-400/0 blur-2xl transition-opacity duration-500 opacity-50 group-hover:opacity-100" />

              <div className="relative z-10 overflow-hidden rounded-3xl border border-zinc-700/60 bg-zinc-900/45 shadow-[0_0_40px_rgba(0,0,0,0.55)] backdrop-blur-md">
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-300/15 to-transparent"
                  animate={{ x: ["-140%", "260%"] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }}
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),transparent_35%)]" />

                <div className="relative border-b border-zinc-800/90 px-4 py-3 sm:px-6">
                  <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Indicadores de Operacao
                  </span>
                </div>

                <div className="md:hidden">
                  <MobileHeroIndicators />
                </div>
                <div className="hidden md:block">
                  <DesktopHeroIndicators />
                </div>

                <div className="border-t border-zinc-800/80 px-4 py-3 text-center text-[10px] text-zinc-500 sm:text-xs">
                  *Medias operacionais observadas em projetos ativos.
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <div ref={belowFoldRef} className="h-px w-full" />

        {shouldRenderBelowFold ? (
          <Suspense fallback={<div className="min-h-[60vh]" />}>
            <FocusPageBelowFold
              FadeInUp={FadeInUp}
              Typewriter={Typewriter}
              FocusPageLogo={FocusPageLogo}
              WhatsAppIcon={WhatsAppIcon}
              services={services}
              nichesLine1={nichesLine1}
              nichesLine2={nichesLine2}
              galleryRow1={galleryRow1}
              galleryRow2={galleryRow2}
              portfolio={portfolio}
              testimonials={testimonials}
              plans={plans}
              steps={steps}
              faqs={faqs}
              activeProject={activeProject}
              setActiveProject={setActiveProject}
              activeStep={activeStep}
              setActiveStep={setActiveStep}
              openFaq={openFaq}
              setOpenFaq={setOpenFaq}
            />
          </Suspense>
        ) : null}

        {activeProject ? (
          <Suspense fallback={null}>
            <FocusPageProjectModal
              activeProject={activeProject}
              setActiveProject={setActiveProject}
            />
          </Suspense>
        ) : null}
      </div>
    </LazyMotion>
  );
}
