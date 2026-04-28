import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { CopilotDrawer } from "@/components/workspace/copilot-drawer";

type CopilotCtx = {
  open: (prefill?: string) => void;
};

const Ctx = createContext<CopilotCtx | null>(null);

const BANNER_DISMISS_KEY = "copilot-banner-dismissed";

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prefill, setPrefill] = useState<string | undefined>();
  const [keyMissing, setKeyMissing] = useState(false);
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem(BANNER_DISMISS_KEY) === "1",
  );

  useEffect(() => {
    function onMissingKey() {
      setKeyMissing(true);
    }
    window.addEventListener("copilot:missing-key", onMissingKey);
    return () => window.removeEventListener("copilot:missing-key", onMissingKey);
  }, []);

  function open(p?: string) {
    setPrefill(p);
    setIsOpen(true);
  }

  function dismissBanner() {
    sessionStorage.setItem(BANNER_DISMISS_KEY, "1");
    setDismissed(true);
  }

  const showBanner = keyMissing && !dismissed;

  return (
    <Ctx.Provider value={{ open }}>
      {showBanner && (
        <div className="fixed top-0 inset-x-0 z-50 bg-warning/15 border-b border-warning/40 text-xs px-4 py-2 flex items-center gap-3">
          <span className="text-warning font-medium">
            AI copilot offline: server is missing <code className="font-mono">AI_GATEWAY_API_KEY</code>.
          </span>
          <a
            className="underline text-warning hover:text-warning/80"
            href="/api/diagnostic"
            target="_blank"
            rel="noreferrer"
          >
            Run diagnostic
          </a>
          <button
            type="button"
            onClick={dismissBanner}
            className="ml-auto text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
      {children}
      <CopilotDrawer open={isOpen} onOpenChange={setIsOpen} prefill={prefill} />
    </Ctx.Provider>
  );
}

export function useCopilot() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCopilot must be used inside CopilotProvider");
  return c;
}
