import { APP_NAME } from "@/constants";
import { LayoutContainer } from "@/components/layout/system";

export function AppFooter() {
  return (
    <footer className="border-t border-[#1F1F1F] mt-16">
      <LayoutContainer size="dashboard" className="py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-[#737373]">
          <p>© 2026 {APP_NAME}. Enterprise AI Cohort Evaluation System.</p>
          <p className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#22C55E]" aria-hidden="true" />
            Live backend connected
          </p>
        </div>
      </LayoutContainer>
    </footer>
  );
}
