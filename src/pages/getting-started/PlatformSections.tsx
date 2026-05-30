import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Key,
  Lock,
  AlertTriangle,
  Code,
  Gamepad2,
  Settings,
  Shield,
  Eye,
  Bell,
  Link2,
  Mail,
  Download,
  Smartphone,
  Globe,
  MapPin,
  Waves,
  Building2,
  Store,
  TreePine,
  Castle,
  Map as MapIcon,
  User,
  CircleDollarSign,
} from "lucide-react";

export default function PlatformSections() {
  const navigate = useNavigate();

  return (
    <>
      {/* OAuth */}
      <section className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
        <div className="flex items-center gap-3">
          <Key className="w-8 h-8 text-green-500" />
          <h2 className="text-2xl md:text-3xl font-bold">Login with XCROL - Your Portable Identity</h2>
        </div>
        <div className="space-y-4 text-foreground/80 leading-relaxed">
          <p className="text-lg">
            Just like you can log into apps with Google, Apple, or GitHub—<strong>other websites can use XCROL as an identity provider</strong>.
          </p>
          <div className="p-4 bg-background/50 rounded-lg border border-green-500/20">
            <h4 className="font-bold text-green-500 mb-2">Why This Matters</h4>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Own your identity:</strong> Your XCROL profile becomes your portable digital identity across the web</li>
              <li><strong>Granular permissions:</strong> You choose exactly what data each app can access (profile info, hometown, friends list, etc.)</li>
              <li><strong>Revoke anytime:</strong> Disconnect apps from Settings → Connected Apps with one click</li>
              <li><strong>No password fatigue:</strong> One secure XCROL login works across participating sites</li>
            </ul>
          </div>
          <div className="p-4 bg-green-500/10 rounded-lg">
            <h4 className="font-bold mb-2">How It Works</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>A website (like <strong>microvictoryarmy.com</strong>) offers "Login with XCROL"</li>
              <li>You click and see what permissions they're requesting</li>
              <li>You authorize only the scopes you're comfortable sharing</li>
              <li>You're logged in—no new account creation needed</li>
            </ol>
          </div>
          <div className="p-4 bg-background/50 rounded-lg border border-border/30">
            <h4 className="font-bold text-primary mb-2">Available Permissions (Scopes)</h4>
            <div className="grid md:grid-cols-2 gap-2 text-sm">
              {[
                ["profile:read", "Basic profile info"],
                ["profile:email", "Your email address"],
                ["hometown:read", "Your hometown location"],
                ["connections:read", "Your friends list"],
                ["xcrol:read", "Your diary entries"],
              ].map(([scope, desc]) => (
                <div key={scope} className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span><strong>{scope}</strong> - {desc}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
            <h4 className="font-bold text-yellow-600 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" />
              Taking Control of the Internet
            </h4>
            <p className="text-sm">
              Traditional social logins (Facebook, Google) give those companies more data about where you go online.
              XCROL flips this—<strong>you</strong> control your identity, and <strong>you</strong> decide which apps
              deserve access. This is about building a web where users have power, not platforms.
            </p>
          </div>
        </div>
      </section>

      {/* Developers */}
      <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
        <div className="flex items-center gap-3">
          <Code className="w-8 h-8 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold">For Developers - Add "Login with XCROL"</h2>
        </div>
        <div className="space-y-4 text-foreground/80 leading-relaxed">
          <p>If you're building a website or app, you can let your users authenticate with their XCROL accounts:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Go to <strong>Settings → Developer</strong> in your XCROL account</li>
            <li>Create an OAuth App with your redirect URIs</li>
            <li>Integrate the OAuth flow using the provided Client ID and Secret</li>
            <li>Users authorize your app and you receive access tokens</li>
          </ol>
          <p className="text-sm text-muted-foreground mt-4">
            XCROL uses standard OAuth 2.0 with PKCE support. Your users benefit from a trusted identity while you get verified profile data.
          </p>
        </div>
      </section>

      {/* Mini Games */}
      <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
        <div className="flex items-center gap-3">
          <Gamepad2 className="w-8 h-8 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold">The Adventure Hub</h2>
        </div>
        <div className="space-y-4 text-foreground/80 leading-relaxed">
          <p>
            XCROL includes unique games that blend entertainment with community building.
            Access them from <strong>THE WORLD</strong> or your profile.
          </p>
          <div className="grid gap-4 mt-4">
            <div className="p-4 rounded-lg bg-background/50 border border-border/30">
              <h3 className="font-bold text-lg mb-2">🌍 Every Country in the World</h3>
              <p className="text-sm">Help XCROL reach global representation! Invite friends from different countries and track progress toward having a user from every nation on Earth.</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50 border border-border/30">
              <h3 className="font-bold text-lg mb-2">💜 The Cure to Loneliness and Boredom</h3>
              <p className="text-sm">An AI-powered adventure game with creative suggestions for meaningful activities and connections. Get wild, offbeat ideas for curing boredom or meeting new people.</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50 border border-border/30">
              <h3 className="font-bold text-lg mb-2">✈️ Dream Trip</h3>
              <p className="text-sm">A 20-step choose-your-own-adventure that visits 10 real XCROL users' hometowns. Each playthrough is unique and may inspire your next real-world journey.</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50 border border-border/30">
              <h3 className="font-bold text-lg mb-2">🪵 Rough Living</h3>
              <p className="text-sm">A survival-flavored adventure exploring how you'd cope when the comforts disappear.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Settings */}
      <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold">Settings & Account Management</h2>
        </div>
        <div className="space-y-4 text-foreground/80 leading-relaxed">
          <p>Access Settings from your user menu to manage:</p>
          <div className="grid md:grid-cols-2 gap-3">
            <SettingItem icon={<Bell className="w-4 h-4 text-yellow-500" />} title="Notifications" desc="Email and in-app notification preferences" />
            <SettingItem icon={<Shield className="w-4 h-4 text-blue-500" />} title="Privacy" desc="Online status visibility and friend request settings" />
            <SettingItem icon={<Eye className="w-4 h-4 text-red-500" />} title="Blocked Users" desc="Manage users you've blocked" />
            <SettingItem icon={<Link2 className="w-4 h-4 text-green-500" />} title="Connected Apps" desc="Apps authorized to access your XCROL data" />
            <SettingItem icon={<Code className="w-4 h-4 text-purple-500" />} title="Developer" desc='Create OAuth apps for "Login with XCROL"' />
            <SettingItem icon={<Mail className="w-4 h-4 text-amber-500" />} title="Weekly Digest Email" desc="Opt-in Monday email summarizing the past week's activity. Toggle from Settings → Notifications." />
            <SettingItem icon={<Download className="w-4 h-4 text-cyan-500" />} title="Download My Data" desc="GDPR-compliant export of everything XCROL stores about you, as a single JSON archive." />
            <SettingItem icon={<Smartphone className="w-4 h-4 text-pink-500" />} title="Install as an App" desc={<>XCROL is a PWA—add it to your phone's home screen. Step-by-step guide at <code>/install-app</code>.</>} />
            <div className="p-3 rounded-lg bg-background/50 border border-destructive/30">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <strong>Delete Account</strong>
              </div>
              <p className="text-sm">Request permanent account deletion</p>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
        <div className="flex items-center gap-3">
          <Globe className="w-8 h-8 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold">Quick Navigation Guide</h2>
        </div>
        <div className="space-y-3 text-foreground/80 leading-relaxed">
          <p>From the main Powers page, access everything:</p>
          <div className="grid gap-2">
            <NavItem icon={<MapPin className="w-5 h-5 text-purple-500" />} title="THE WORLD" desc="IRL Layer map, meetups, hometown claims, Hearth Surf" />
            <NavItem icon={<Waves className="w-5 h-5 text-blue-500" />} title="THE RIVER" desc="Friends' Xcrol feed, reactions, replies" />
            <NavItem icon={<Building2 className="w-5 h-5 text-orange-500" />} title="THE VILLAGE" desc="Community groups, group posts, member management" />
            <NavItem icon={<Store className="w-5 h-5 text-yellow-500" />} title="THE TOWN" desc="Community marketplace, classifieds, listings" />
            <NavItem icon={<TreePine className="w-5 h-5 text-emerald-500" />} title="THE FOREST" desc="Friends, requests, introductions, blocked users" />
            <NavItem icon={<Castle className="w-5 h-5 text-amber-500" />} title="THE CASTLE" desc="Mysterious destination unlocked through participation" />
            <NavItem icon={<MapIcon className="w-5 h-5 text-cyan-500" />} title="THE MAP" desc="Illustrated SVG world map navigation hub" />
            <NavItem icon={<Gamepad2 className="w-5 h-5 text-pink-500" />} title="ADVENTURE HUB" desc="Mini games (Every Country, Cure to Loneliness, Dream Trip, Rough Living)" />
            <NavItem icon={<User className="w-5 h-5 text-green-500" />} title="YOU" desc="Profile, settings, Xcrol diary, Brooks" />
          </div>
        </div>
      </section>

      {/* Points */}
      <section className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/30">
        <div className="flex items-center gap-3">
          <CircleDollarSign className="w-8 h-8 text-amber-500" />
          <h2 className="text-2xl md:text-3xl font-bold">Earning Points</h2>
        </div>
        <div className="space-y-4 text-foreground/80 leading-relaxed">
          <p>
            Every action you take on XCROL earns you points. They accumulate silently,
            a quiet measure of your presence and participation.
          </p>
          <div className="grid gap-2">
            {POINTS.map(([label, pts]) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <span>{label}</span>
                <span className="font-bold text-amber-500">{pts}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-lg bg-background/30 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Castle className="w-5 h-5 text-amber-500" />
              <strong className="text-amber-500">The Castle</strong>
            </div>
            <p className="text-sm text-foreground/70">
              Points unlock <strong>The Castle</strong> — a destination reachable from the Powers page.
              Your progress toward the unlock criteria (points, friends, accepted invites) is shown there.
              Those who have built something here will find the threshold more welcoming. More will be
              revealed in time.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center space-y-6 py-8">
        <h2 className="text-2xl md:text-3xl font-bold">Ready to Begin?</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Button variant="divine" size="lg" onClick={() => navigate("/auth")}>
            Create Account
          </Button>
          <Button variant="mystical" size="lg" onClick={() => navigate("/powers")}>
            Explore Powers
          </Button>
        </div>
      </div>

      <div className="text-center pb-8">
        <Button variant="ghost" onClick={() => navigate("/powers")}>
          ← Back to Powers
        </Button>
      </div>
    </>
  );
}

function SettingItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: React.ReactNode }) {
  return (
    <div className="p-3 rounded-lg bg-background/50">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <strong>{title}</strong>
      </div>
      <p className="text-sm">{desc}</p>
    </div>
  );
}

function NavItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded bg-background/50">
      {icon}
      <strong>{title}</strong> - {desc}
    </div>
  );
}

const POINTS: [string, string][] = [
  ["Write a daily Xcrol entry", "+1"],
  ["Include a link in your Xcrol", "+1"],
  ["React or comment on a Xcrol", "+1"],
  ["Each friend you have", "+1"],
  ["Comment on a brook or group post", "+1"],
  ["Post in a group", "+1"],
  ["Create a listing in The Town", "+1"],
  ["Set up your hometown", "+2"],
  ["Leave a review of another user", "+3"],
  ["Invite a friend to XCROL", "+2"],
  ["Start a Brook with a friend", "+2"],
  ["Invited friend accepts", "+5"],
  ["Keep a Brook alive for 5 days", "+5"],
  ["Complete your full profile", "+10"],
  ["Create a group in The Village", "+10"],
];
