import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft, Sparkles, ShieldCheck, Crown, ExternalLink, BookOpen,
} from "lucide-react";

const ScrollAiTutorial = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <Helmet>
        <title>AI Assistance for your Scrolls — Setup</title>
        <meta
          name="description"
          content="Two ways to summon AI help in your Scrolls: bring your own provider key, or wait for Xcrol AI with Wayfarer+."
        />
      </Helmet>

      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <header className="space-y-2">
          <Badge variant="outline" className="w-fit">A word from the Pater Familias</Badge>
          <h1 className="text-3xl font-serif">Two ways to summon the helper</h1>
          <p className="text-muted-foreground font-serif italic">
            Your Scroll is yours. The helper does not touch what you have already written —
            no River post, no group post, no Xcrol entry. It only helps with the cover work:
            the title, the blurb, the chapter names, and the interludes you wrote in your own
            hand. The choice is whose lantern lights the work.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" /> Path one — Bring Your Own Key
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 font-serif">
            <p>
              You hold an account with one of the great AI houses. You ask the house for a key.
              You paste the key into Xcrol. The key stays in your browser, encrypted, behind glass
              — Xcrol never sees it. When you press <em>✨ Suggest</em>, your browser speaks
              directly to the house, and the answer returns to your Scroll.
            </p>
            <p className="text-sm text-muted-foreground">
              Cost: usually a fraction of a cent per suggestion. Most houses let you cap your monthly
              spend; do that.
            </p>
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Your key never leaves this device. Xcrol servers cannot read it. If you wipe browser data,
                you'll need to paste it again.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ProviderCard
            name="OpenRouter (recommended)"
            url="https://openrouter.ai/keys"
            steps={[
              "Sign in at openrouter.ai",
              "Open Keys → Create Key",
              "Add a few dollars of credit (pay-as-you-go)",
              "Paste it into Settings → AI Assistance",
            ]}
            modelHint="One key, hundreds of models. Default: openai/gpt-4o-mini"
          />
          <ProviderCard
            name="OpenAI"
            url="https://platform.openai.com/api-keys"
            steps={[
              "Sign in at platform.openai.com",
              "Open API keys → Create new secret key",
              "Copy the key (starts with sk-…)",
              "Paste it into Settings → AI Assistance",
            ]}
            modelHint="Default model: gpt-4o-mini"
          />
          <ProviderCard
            name="Anthropic Claude"
            url="https://console.anthropic.com/settings/keys"
            steps={[
              "Sign in at console.anthropic.com",
              "Open API Keys → Create Key",
              "Copy the key (starts with sk-ant-…)",
              "Paste it into Settings → AI Assistance",
            ]}
            modelHint="Default model: claude-3-5-haiku-latest"
          />
          <ProviderCard
            name="Google Gemini"
            url="https://aistudio.google.com/apikey"
            steps={[
              "Open Google AI Studio",
              "Click 'Get API key' → 'Create API key'",
              "Copy the key",
              "Paste it into Settings → AI Assistance",
            ]}
            modelHint="Default model: gemini-2.0-flash"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">What does it cost?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p className="text-muted-foreground">
              A typical Scroll suggestion (title, blurb, chapter labels, or a polished interlude)
              uses a few thousand tokens. With the cheap default models below, that's typically
              <strong> a fraction of a cent</strong> per click.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1 pr-3">Provider</th>
                    <th className="text-left py-1 pr-3">Cheap default</th>
                    <th className="text-left py-1">Rough cost / suggestion</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b"><td className="py-1 pr-3">OpenRouter</td><td className="py-1 pr-3">openai/gpt-4o-mini</td><td className="py-1">~$0.001–$0.005</td></tr>
                  <tr className="border-b"><td className="py-1 pr-3">OpenAI</td><td className="py-1 pr-3">gpt-4o-mini</td><td className="py-1">~$0.001–$0.005</td></tr>
                  <tr className="border-b"><td className="py-1 pr-3">Anthropic</td><td className="py-1 pr-3">claude-3-5-haiku-latest</td><td className="py-1">~$0.002–$0.01</td></tr>
                  <tr><td className="py-1 pr-3">Google</td><td className="py-1 pr-3">gemini-2.0-flash</td><td className="py-1">often free tier, then ~$0.001</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              Most providers let you cap your monthly spend — do that on day one.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" /> Path two — Xcrol AI
              <Badge variant="outline">Coming soon</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 font-serif">
            <p>
              In time, those who join as <strong>Wayfarer+</strong> will have no key to manage.
              They press <em>✨ Suggest</em> and Xcrol's own helper answers. Same craft, no setup.
            </p>
            <p className="text-sm text-muted-foreground">
              Wayfarer+ memberships are not open yet. When they are, this page will tell you how to join.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> What the helper will and won't touch
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Will:</strong> suggest titles, blurbs, chapter labels, polish interludes you wrote.</p>
            <p><strong>Will not:</strong> rewrite, summarise or paraphrase your original River posts, group posts or Xcrol entries. Those stay exactly as you wrote them.</p>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/settings">Set up my key in Settings</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/scrolls">Back to my Scrolls</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

interface ProviderCardProps {
  name: string;
  url: string;
  steps: string[];
  modelHint: string;
}

const ProviderCard = ({ name, url, steps, modelHint }: ProviderCardProps) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-base flex items-center justify-between">
        {name}
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          Get key <ExternalLink className="h-3 w-3" />
        </a>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2 text-sm">
      <ol className="list-decimal pl-5 space-y-1">
        {steps.map((s) => <li key={s}>{s}</li>)}
      </ol>
      <p className="text-xs text-muted-foreground">{modelHint}</p>
    </CardContent>
  </Card>
);

export default ScrollAiTutorial;
