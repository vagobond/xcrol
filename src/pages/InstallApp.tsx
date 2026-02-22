import { useNavigate } from "react-router-dom";
import { ArrowLeft, Chrome, Globe, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";

const InstallApp = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-start justify-center p-4 pt-20">
      <div className="max-w-2xl w-full space-y-8 animate-fade-in">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/powers")}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Powers
        </Button>

        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-glow">Install the Xcrol App</h1>
          <p className="text-foreground/80 text-lg leading-relaxed">
            You can add Xcrol to your home screen on your phone, tablet, or computer as an app. Here's how, based on your browser:
          </p>
        </div>

        {/* Best Support */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
            <Chrome className="h-5 w-5" />
            Best Support — Chrome, Edge, Brave, Opera
          </h2>
          <div className="bg-card/40 backdrop-blur-sm border border-border rounded-lg p-4 space-y-3">
            <div>
              <h3 className="font-medium">Desktop (Windows, macOS, Linux)</h3>
              <p className="text-foreground/70 text-sm">Full install to a standalone window with push notifications, offline caching, background sync, and auto-prompts.</p>
            </div>
            <div>
              <h3 className="font-medium">Android</h3>
              <p className="text-foreground/70 text-sm">Native-like install to your home screen and apps drawer with full offline and push notification support.</p>
            </div>
          </div>

          <div className="bg-card/40 backdrop-blur-sm border border-border rounded-lg p-4 space-y-2">
            <h3 className="font-medium">Vivaldi (Chromium-based)</h3>
            <p className="text-foreground/70 text-sm">
              <strong>Desktop:</strong> Install via context menu or Menu → Install as PWA (opens in its own window).
            </p>
            <p className="text-foreground/70 text-sm">
              <strong>Android:</strong> Go to Vivaldi menu → Add Page To → Home screen → Install. Creates a true app if the site qualifies.
            </p>
          </div>
        </section>

        {/* Good Support */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
            <Apple className="h-5 w-5" />
            Good Support — Safari
          </h2>
          <div className="bg-card/40 backdrop-blur-sm border border-border rounded-lg p-4 space-y-3">
            <div>
              <h3 className="font-medium">macOS (Sonoma / Ventura+)</h3>
              <p className="text-foreground/70 text-sm">Supports "Add to Dock" (Safari 17+), which creates app-like windows. Push notifications and offline work reasonably well.</p>
            </div>
            <div>
              <h3 className="font-medium">iOS / iPadOS (16.4+)</h3>
              <p className="text-foreground/70 text-sm">
                Install via <strong>Share menu → Add to Home Screen</strong> in Safari. Standalone mode, splash screens, offline caching, and push notifications are supported.
              </p>
              <p className="text-foreground/70 text-sm mt-1 italic">
                Note: No automatic install prompt — you must manually add via Share. In the EU, some PWA behaviors changed in iOS 17.4+ due to DMA rules.
              </p>
            </div>
          </div>
        </section>

        {/* Partial Support */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Partial Support — Firefox & Other iOS Browsers
          </h2>
          <div className="bg-card/40 backdrop-blur-sm border border-border rounded-lg p-4 space-y-3">
            <div>
              <h3 className="font-medium">Firefox</h3>
              <p className="text-foreground/70 text-sm">Android supports full install. Desktop/Windows added support in late 2025 (Firefox 143+), but it's newer and may lag on some advanced features.</p>
            </div>
            <div>
              <h3 className="font-medium">Other iOS browsers (Chrome, Firefox, Vivaldi on iOS)</h3>
              <p className="text-foreground/70 text-sm">These use WebKit (Safari's engine) under the hood, so install works via the same Share menu as Safari — experience is Safari-like, not Chromium-like.</p>
            </div>
          </div>
        </section>

        <div className="pt-4 pb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/powers")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Powers
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InstallApp;
