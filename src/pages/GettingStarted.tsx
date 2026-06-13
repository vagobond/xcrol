import ProfileSections from "./getting-started/ProfileSections";
import SocialSections from "./getting-started/SocialSections";
import MoreFeaturesSections from "./getting-started/MoreFeaturesSections";
import PlatformSections from "./getting-started/PlatformSections";
import FaqSection from "./getting-started/FaqSection";

const GettingStarted = () => {
  return (
    <div className="min-h-screen p-4 pt-20 md:p-8 md:pt-20">
      <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-glow">Getting Started & FAQ</h1>
          <p className="text-xl text-foreground/70">
            Your complete guide to XCROL and taking control of your digital life
          </p>
        </div>

        <ProfileSections />
        <SocialSections />
        <MoreFeaturesSections />
        <PlatformSections />
        <FaqSection />
      </div>
    </div>
  );
};

export default GettingStarted;
