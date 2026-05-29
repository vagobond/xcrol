import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

const XCROL_API_BASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const XCROL_PUBLIC_API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const endpoints = {
  authorization: "https://xcrol.com/oauth/authorize",
  token: `${XCROL_API_BASE_URL}/functions/v1/oauth-token`,
  userinfo: `${XCROL_API_BASE_URL}/functions/v1/oauth-userinfo`,
};

export { XCROL_API_BASE_URL };

export const CodeBlock = ({ code, language = "bash" }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-muted/70 text-foreground border border-border p-4 rounded-lg overflow-x-auto text-sm font-mono">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-4 w-4 text-primary" />
        ) : (
          <Copy className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
};

export const EndpointCard = ({ title, url, method = "GET" }: { title: string; url: string; method?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
      <div className="flex items-center gap-3 min-w-0">
        <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-mono rounded shrink-0">
          {method}
        </span>
        <div className="min-w-0">
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground font-mono truncate">{url}</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={handleCopy} className="shrink-0">
        {copied ? (
          <Check className="h-4 w-4 text-primary" />
        ) : (
          <Copy className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
};
