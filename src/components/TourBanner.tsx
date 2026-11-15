import React from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, X } from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { FEATURE_TUTORIALS } from "../data/tutorialsData";
import { PageId } from "../types/clinic";

interface TourBannerProps {
  active: boolean;
  onClose: () => void;
  completedIds: PageId[];
  onMarkCompleted: (id: PageId) => void;
}

export const TourBanner: React.FC<TourBannerProps> = ({ active, onClose, completedIds, onMarkCompleted }) => {
  const { activePage, setActivePage } = useClinic();

  if (!active) return null;

  const idx = Math.max(0, FEATURE_TUTORIALS.findIndex((t) => t.id === activePage));
  const current = FEATURE_TUTORIALS[idx] || FEATURE_TUTORIALS[0];
  const isDone = completedIds.includes(current.id);

  const goTo = (nextIdx: number) => {
    const target = FEATURE_TUTORIALS[nextIdx];
    if (target) setActivePage(target.id);
  };

  return (
    <div className="no-print fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[94vw] max-w-2xl bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-teal-300">
              <span>GUIDED TOUR • STEP {idx + 1} OF {FEATURE_TUTORIALS.length}</span>
              {isDone && <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">Completed ✓</span>}
            </div>
            <div className="text-sm font-bold mt-0.5">{current.title}</div>
            <div className="text-xs text-slate-300 mt-1">
              <strong className="text-amber-300">Try live:</strong> {current.tryItLive}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            disabled={idx === 0}
            onClick={() => goTo(idx - 1)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Prev
          </button>
          <button
            disabled={idx === FEATURE_TUTORIALS.length - 1}
            onClick={() => {
              onMarkCompleted(current.id);
              goTo(idx + 1);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-xs font-semibold"
          >
            Next Module <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onMarkCompleted(current.id)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold hover:bg-emerald-600/30"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> {isDone ? "Marked Done" : "Mark Step Complete"}
          </button>
        </div>
      </div>
    </div>
  );
};
