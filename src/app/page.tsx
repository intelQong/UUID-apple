import { FaqSection } from "@/components/home/FaqSection";
import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { PrivacySection } from "@/components/home/PrivacySection";
import { QrAttributionTracker } from "@/components/home/QrAttributionTracker";
import { PageShell } from "@/components/PageShell";

export default function Home() {
  return (
    <PageShell>
      <QrAttributionTracker />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <PrivacySection />
        <FaqSection />
      </main>
    </PageShell>
  );
}
