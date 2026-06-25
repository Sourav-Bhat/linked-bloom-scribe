import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error";
interface Toast { id: number; msg: string; type: ToastType }

const ToastContext = createContext<(msg: string, type?: ToastType) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((msg: string, type: ToastType = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex min-w-[260px] items-center gap-3 rounded-xl bg-ink-900 px-4 py-3 text-sm font-medium text-white shadow-brand-3",
            )}
          >
            {t.type === "success"
              ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
              : <AlertTriangle className="h-4 w-4 shrink-0 text-gold-500" />}
            <span className="flex-1">{t.msg}</span>
            <button onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="text-white/50 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
