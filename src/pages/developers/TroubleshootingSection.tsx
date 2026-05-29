import { Card, CardContent } from "@/components/ui/card";
import { CodeBlock, endpoints, XCROL_PUBLIC_API_KEY, XCROL_API_BASE_URL } from "./shared";

export default function TroubleshootingSection() {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">Troubleshooting</h2>
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div>
            <h3 className="font-semibold text-red-500 mb-2">❌ Getting HTML instead of JSON from token endpoint</h3>
            <p className="text-muted-foreground text-sm mb-2">
              You're calling the wrong URL. Make sure you're using the Supabase function URL for the token endpoint:
            </p>
            <div className="text-sm space-y-1">
              <p className="text-red-500">Wrong: <code className="bg-muted px-1 rounded">https://xcrol.com/oauth/token</code></p>
              <p className="text-green-500">Correct: <code className="bg-muted px-1 rounded">{endpoints.token}</code></p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-destructive mb-2">❌ "Authentication Failed" / 401 when calling Token or User Info</h3>
            <p className="text-muted-foreground text-sm mb-2">
              Your request is missing the required <code className="bg-muted px-1 rounded">apikey</code> header.
              Add it to both the Token Exchange and User Info calls.
            </p>
            <div className="mt-2">
              <CodeBlock code={`apikey: ${XCROL_PUBLIC_API_KEY}`} />
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-red-500 mb-2">❌ Getting JSON directly instead of consent page</h3>
            <p className="text-muted-foreground text-sm mb-2">
              You're calling the backend function directly for authorization. The authorization URL should be the frontend page:
            </p>
            <div className="text-sm space-y-1">
              <p className="text-red-500">Wrong: <code className="bg-muted px-1 rounded">{XCROL_API_BASE_URL}/functions/v1/oauth-authorize</code></p>
              <p className="text-green-500">Correct: <code className="bg-muted px-1 rounded">{endpoints.authorization}</code></p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-red-500 mb-2">❌ "Redirect URI not registered" error</h3>
            <p className="text-muted-foreground text-sm mb-2">
              The redirect_uri in your request must <strong>exactly</strong> match one of your registered redirect URIs.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Check for trailing slashes (<code className="bg-muted px-1 rounded">/callback</code> vs <code className="bg-muted px-1 rounded">/callback/</code>)</li>
              <li>Check protocol (<code className="bg-muted px-1 rounded">http</code> vs <code className="bg-muted px-1 rounded">https</code>)</li>
              <li>Check exact domain and path matching</li>
              <li>For multi-environment apps, register <strong>all</strong> redirect URIs (dev, staging, production)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-red-500 mb-2">❌ "Failed to load authorization request" or blank page</h3>
            <p className="text-muted-foreground text-sm mb-2">
              Your preview/development URL is different from the registered production URL.
            </p>
            <p className="text-muted-foreground text-sm">
              <strong>Solution:</strong> Register both development and production redirect URIs in your Xcrol app settings,
              or hardcode the production redirect URI when building the authorize URL.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-red-500 mb-2">❌ "Session expired or invalid" after redirect</h3>
            <p className="text-muted-foreground text-sm mb-2">
              The OAuth state was stored in <code className="bg-muted px-1 rounded">sessionStorage</code> on one domain but the callback redirected to a different domain.
              <code className="bg-muted px-1 rounded">sessionStorage</code> is not shared across origins.
            </p>
            <p className="text-muted-foreground text-sm">
              <strong>Solution:</strong> Ensure the OAuth flow starts and ends on the same domain.
              For multi-environment apps, use the same domain for both initiating auth and receiving the callback.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-red-500 mb-2">❌ "Invalid authorization code" error</h3>
            <p className="text-muted-foreground text-sm">
              Authorization codes expire after 10 minutes and can only be used once.
              Make sure you're exchanging the code immediately after receiving it.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-red-500 mb-2">❌ "Invalid user data" or user profile not saving correctly</h3>
            <p className="text-muted-foreground text-sm mb-2">
              You may be using incorrect field names. The <code className="bg-muted px-1 rounded">/oauth-userinfo</code> endpoint returns <strong>standard OAuth claims</strong>, not custom field names.
            </p>
            <div className="mt-3 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Correct field mapping:</p>
              <CodeBlock code={`const xcrolUser = await userInfoResponse.json();

// Correct field mapping
const userId = xcrolUser.sub;           // NOT 'id'
const displayName = xcrolUser.name;     // NOT 'display_name'
const avatarUrl = xcrolUser.picture;    // NOT 'avatar_url'
const bio = xcrolUser.bio;
const username = xcrolUser.username;
const link = xcrolUser.link;`} />
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-red-500 mb-2">❌ Blank page after successful OAuth</h3>
            <p className="text-muted-foreground text-sm mb-2">
              Silent JavaScript errors in the callback handler, often due to field mapping issues.
            </p>
            <p className="text-muted-foreground text-sm">
              <strong>Solution:</strong> Add comprehensive error handling and log the actual API response to debug field names:
            </p>
            <div className="mt-2">
              <CodeBlock code={`console.log("Xcrol user data:", JSON.stringify(xcrolUser));`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
