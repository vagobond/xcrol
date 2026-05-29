import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { CodeBlock, EndpointCard, endpoints, XCROL_PUBLIC_API_KEY } from "./shared";

export default function EndpointsSection() {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">OAuth Endpoints</h2>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            API Endpoints
          </CardTitle>
          <CardDescription>Use these exact URLs in your OAuth implementation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <EndpointCard title="Authorization (User Consent)" url={endpoints.authorization} method="GET" />
          <EndpointCard title="Token Exchange" url={endpoints.token} method="POST" />
          <EndpointCard title="User Info" url={endpoints.userinfo} method="GET" />
        </CardContent>
      </Card>

      <div className="mt-4 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground mb-3">
          <strong>Required:</strong> Requests to <strong>Token Exchange</strong> and <strong>User Info</strong> must include an
          <code className="bg-background px-1 rounded mx-1">apikey</code> header. If you omit it, you'll often see
          <strong className="mx-1">"Authentication Failed"</strong> and the request may not reach the endpoint.
        </p>
        <CodeBlock code={`apikey: ${XCROL_PUBLIC_API_KEY}`} />
        <p className="text-xs text-muted-foreground mt-3">
          (Some HTTP clients support passing this as a URL query param
          <code className="bg-background px-1 rounded mx-1">?apikey=...</code>, but headers are recommended.)
        </p>
      </div>

      <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <p className="text-sm text-amber-600 dark:text-amber-400">
          <strong>⚠️ Common Mistake:</strong> The Authorization endpoint is the <strong>frontend page</strong> at xcrol.com,
          not the Supabase function. The Token endpoint is the Supabase function. Don't mix these up!
        </p>
      </div>
    </section>
  );
}
