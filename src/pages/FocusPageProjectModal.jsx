import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, X } from "lucide-react";

export default function FocusPageProjectModal({ activeProject, setActiveProject }) {
  return (
    <AnimatePresence>
      {activeProject && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
        >
          <div
            className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl cursor-pointer"
            onClick={() => setActiveProject(null)}
          />

          <motion.div
            layoutId={`project-${activeProject.id}`}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-5xl bg-zinc-900 rounded-2xl md:rounded-[2rem] overflow-hidden border border-zinc-800 shadow-2xl z-10 flex flex-col max-h-[90vh]"
          >
            <button
              onClick={() => setActiveProject(null)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 h-10 w-10 rounded-full bg-zinc-950/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="overflow-y-auto no-scrollbar">
              <div className={`relative h-64 sm:h-96 w-full ${activeProject.mockImage}`}>
                <div className="absolute inset-0 cinematic-vignette opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                <motion.div
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                  className="absolute bottom-0 left-0 p-6 sm:p-10 w-full"
                >
                  <span className="text-violet-400 font-medium tracking-widest uppercase text-xs sm:text-sm mb-2 block">
                    {activeProject.category}
                  </span>
                  <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-white">
                    {activeProject.title}
                  </h2>
                </motion.div>
              </div>

              <motion.div
                initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.3 } } }}
                className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-10"
              >
                <div className="md:col-span-2 space-y-8">
                  <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                    <h4 className="text-xl font-semibold text-zinc-100 mb-3 flex items-center gap-2">O Desafio</h4>
                    <p className="text-zinc-400 leading-relaxed text-base sm:text-lg">{activeProject.challenge}</p>
                  </motion.div>
                  <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                    <h4 className="text-xl font-semibold text-zinc-100 mb-3 flex items-center gap-2">A Solução Focus</h4>
                    <p className="text-zinc-400 leading-relaxed text-base sm:text-lg">{activeProject.solution}</p>
                  </motion.div>
                </div>

                <motion.div variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }} className="bg-zinc-950/50 rounded-2xl p-6 border border-zinc-800/50 flex flex-col h-fit">
                  <span className="text-sm font-medium text-zinc-500 uppercase tracking-widest mb-4 block">O Resultado</span>
                  <div className="text-5xl sm:text-6xl font-bold text-violet-400 mb-2 tracking-tighter">{activeProject.resultStat}</div>
                  <p className="text-sm text-zinc-400 mb-8">{activeProject.resultText}</p>
                  <div className="mt-auto space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {activeProject.tags.map((tag, i) => (
                        <span key={i} className="text-xs text-zinc-300 bg-zinc-800 px-2 py-1 rounded">{tag}</span>
                      ))}
                    </div>
                    <a href="#contato" onClick={() => setActiveProject(null)} className="btn-metallic w-full flex items-center justify-center gap-2 bg-violet-500 text-zinc-950 font-semibold py-3 rounded-xl hover:bg-violet-400 transition-colors">
                      Quero este resultado <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
