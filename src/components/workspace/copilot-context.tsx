import { createContext, useContext, useState, type ReactNode } from "react";
import { CopilotDrawer } from "@/components/workspace/copilot-drawer";

type CopilotCtx = {
  open: (prefill?: string) => void;
};

const Ctx = createContext<CopilotCtx | null>(null);

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prefill, setPrefill] = useState<string | undefined>();

  function open(p?: string) {
    setPrefill(p);
    setIsOpen(true);
  }

  return (
    <Ctx.Provider value={{ open }}>
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
