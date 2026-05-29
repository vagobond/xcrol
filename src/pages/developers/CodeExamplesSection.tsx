import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlock, endpoints } from "./shared";

export default function CodeExamplesSection() {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">Code Examples</h2>

      <Tabs defaultValue="javascript">
        <TabsList>
          <TabsTrigger value="javascript">JavaScript</TabsTrigger>
          <TabsTrigger value="python">Python</TabsTrigger>
          <TabsTrigger value="curl">cURL</TabsTrigger>
        </TabsList>

        <TabsContent value="javascript" className="mt-4">
          <CodeBlock
            language="javascript"
            code={`// You must include an apikey header when calling the Token + User Info endpoints.
// This is a PUBLIC key (not your client secret).
const XCROL_PUBLIC_API_KEY = "XCROL_PUBLIC_API_KEY";

// Step 1: Redirect to authorization
const authorizeUrl = new URL("${endpoints.authorization}");
authorizeUrl.searchParams.set("client_id", CLIENT_ID);
authorizeUrl.searchParams.set("redirect_uri", "https://yourapp.com/auth/xcrol/callback");
authorizeUrl.searchParams.set("response_type", "code");
authorizeUrl.searchParams.set("scope", "profile:read");
authorizeUrl.searchParams.set("state", crypto.randomUUID());

window.location.href = authorizeUrl.toString();

// Step 2: In your callback handler, exchange the code
async function handleCallback(code) {
  const response = await fetch("${endpoints.token}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: XCROL_PUBLIC_API_KEY,
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: "https://yourapp.com/auth/xcrol/callback",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error("Token exchange failed [" + response.status + "]: " + errText);
  }

  const tokens = await response.json();
  const access_token = tokens.access_token;

  // Step 3: Fetch user info
  const userResponse = await fetch("${endpoints.userinfo}", {
    headers: {
      Authorization: "Bearer " + access_token,
      apikey: XCROL_PUBLIC_API_KEY,
    },
  });

  if (!userResponse.ok) {
    const errText = await userResponse.text();
    throw new Error("Userinfo failed [" + userResponse.status + "]: " + errText);
  }

  const user = await userResponse.json();

  // Map standard OAuth claims
  const userData = {
    id: user.sub,           // Standard OAuth 'sub' claim
    displayName: user.name, // Standard OAuth 'name' claim
    avatarUrl: user.picture // Standard OAuth 'picture' claim
  };

  console.log("Logged in as:", userData.displayName);
}`}
          />
        </TabsContent>

        <TabsContent value="python" className="mt-4">
          <CodeBlock language="python" code={`import requests
from urllib.parse import urlencode
import secrets

XCROL_PUBLIC_API_KEY = "XCROL_PUBLIC_API_KEY"

# Step 1: Generate authorization URL
params = {
    "client_id": CLIENT_ID,
    "redirect_uri": "https://yourapp.com/auth/xcrol/callback",
    "response_type": "code",
    "scope": "profile:read",
    "state": secrets.token_urlsafe(16)
}
auth_url = f"${endpoints.authorization}?{urlencode(params)}"
# Redirect user to auth_url

# Step 2: Exchange code for token (in callback handler)
def handle_callback(code):
    response = requests.post(
        "${endpoints.token}",
        headers={"apikey": XCROL_PUBLIC_API_KEY},
        json={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": "https://yourapp.com/auth/xcrol/callback",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
        }
    )
    response.raise_for_status()
    tokens = response.json()

    # Step 3: Fetch user info
    user_response = requests.get(
        "${endpoints.userinfo}",
        headers={
            "Authorization": f"Bearer {tokens['access_token']}",
            "apikey": XCROL_PUBLIC_API_KEY,
        }
    )
    user_response.raise_for_status()
    user = user_response.json()

    # Map standard OAuth claims
    user_data = {
        "id": user["sub"],
        "display_name": user["name"],
        "avatar_url": user["picture"],
    }
    print(f"Logged in as: {user_data['display_name']}")`} />
        </TabsContent>

        <TabsContent value="curl" className="mt-4">
          <CodeBlock code={`# Exchange authorization code for token
curl -X POST "${endpoints.token}" \\
  -H "Content-Type: application/json" \\
  -H "apikey: XCROL_PUBLIC_API_KEY" \\
  -d '{
    "grant_type": "authorization_code",
    "code": "AUTH_CODE_HERE",
    "redirect_uri": "https://yourapp.com/auth/xcrol/callback",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET"
  }'

# Fetch user info
curl "${endpoints.userinfo}" \\
  -H "Authorization: Bearer ACCESS_TOKEN_HERE" \\
  -H "apikey: XCROL_PUBLIC_API_KEY"`} />
        </TabsContent>
      </Tabs>
    </section>
  );
}
