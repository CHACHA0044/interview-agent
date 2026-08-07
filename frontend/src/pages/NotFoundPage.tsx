import { useNavigate } from "react-router";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";
import { PageTransition } from "@/components/layout/PageTransition";
import { LayoutContainer, Section, Surface, Stack, Cluster } from "@/components/layout/system";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <Section density="relaxed">
        <LayoutContainer size="reading">
          <Surface padding="lg" className="min-h-[55vh] flex items-center justify-center">
            <Stack gap="md" className="items-center text-center max-w-reading">
              <span className="text-8xl font-extrabold text-[#D4AF37] font-mono leading-none">404</span>
              <h1 className="heading-display">Page Not Found</h1>
              <p className="text-body text-[#A3A3A3]">
                The requested page does not exist or has been relocated within the interview system.
              </p>
              <Cluster gap="sm" className="justify-center">
                <Button onClick={() => navigate("/")} icon={<Home className="h-4 w-4" />}>
                  Return to Overview
                </Button>
                <Button variant="secondary" onClick={() => navigate(-1)} icon={<ArrowLeft className="h-4 w-4" />}>
                  Go Back
                </Button>
              </Cluster>
            </Stack>
          </Surface>
        </LayoutContainer>
      </Section>
    </PageTransition>
  );
}
