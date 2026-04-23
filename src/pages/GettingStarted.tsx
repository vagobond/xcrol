import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  Users, 
  MapPin, 
  Gamepad2, 
  Shield, 
  Heart,
  Eye,
  EyeOff,
  Star,
  Globe,
  Sparkles,
  Scroll,
  Waves,
  Droplets,
  MessageCircle,
  Coffee,
  Home,
  Link2,
  Settings,
  Key,
  Lock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Bell,
  Code,
  ChevronDown,
  ChevronRight,
  Store,
  Building2,
  Image,
  Video,
  CircleDollarSign,
  Castle,
  Send,
  Mail,
  Download,
  Smartphone,
  TreePine,
  Zap,
  Gift,
  Map as MapIcon,
} from "lucide-react";
import { useState } from "react";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";

const GettingStarted = () => {
  const navigate = useNavigate();
  const [profileDetailsOpen, setProfileDetailsOpen] = useState(false);

  return (
    <div className="min-h-screen p-4 pt-20 md:p-8 md:pt-20">
      <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-glow">
            Getting Started
          </h1>
          <p className="text-xl text-foreground/70">
            Your complete guide to XCROL and taking control of your digital life
          </p>
        </div>

        {/* Quick Start - Setting Up Your Profile */}
        <section className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Setting Up Your Profile</h2>
          </div>
          <div className="space-y-3 text-foreground/80 leading-relaxed">
            <p>
              Your profile is your digital identity within XCROL. Get started quickly:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li><strong>Sign up</strong> using your email address</li>
              <li>Add a <strong>display name</strong> and <strong>avatar</strong></li>
              <li>Set your <strong>hometown</strong> on the IRL Layer map</li>
              <li>Configure <strong>friendship levels</strong> for your connections</li>
            </ol>
            <p className="text-primary/90 font-medium mt-4">
              <Sparkles className="w-4 h-4 inline mr-1" />
              The more complete your profile, the more meaningful your connections become.
            </p>
          </div>

          {/* Expandable Deep Dive */}
          <Collapsible open={profileDetailsOpen} onOpenChange={setProfileDetailsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-start mt-4 text-primary hover:text-primary/80">
                {profileDetailsOpen ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                {profileDetailsOpen ? "Hide detailed profile guide" : "Learn more about profile setup and features →"}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4 p-4 bg-background/50 rounded-lg border border-border/50">
              <h3 className="font-bold text-lg">Complete Profile Guide</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-primary">Basic Information</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li><strong>Display Name:</strong> How friends see you (can be your real name or nickname)</li>
                    <li><strong>Username:</strong> Your unique @handle for shareable profile links</li>
                    <li><strong>Avatar:</strong> Upload a photo (max 2MB) so friends recognize you</li>
                    <li><strong>Bio:</strong> Tell your story in up to 1000 characters</li>
                    <li><strong>Public Link:</strong> Share a website, portfolio, or social link visible to everyone</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-primary">Personal Information (with Visibility Controls)</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li><strong>Birthday:</strong> Separate controls for day/month vs. birth year visibility</li>
                    <li><strong>Home Address:</strong> Your current residence (only share with trusted friends)</li>
                    <li><strong>Mailing Address:</strong> Where to receive mail (useful for postcards from traveling friends!)</li>
                    <li><strong>Nicknames:</strong> What close friends call you</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-primary">Contact Information</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li><strong>WhatsApp:</strong> For quick messaging (visible based on friendship level)</li>
                    <li><strong>Phone Number:</strong> Direct contact for close friends</li>
                    <li><strong>Private Email:</strong> Personal email for close connections</li>
                    <li><strong>Contact Email:</strong> General contact email</li>
                    <li><strong>Instagram & LinkedIn:</strong> Social media links</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-primary">Social Links</h4>
                  <p className="text-sm ml-4">Add unlimited social links (Twitter, TikTok, YouTube, etc.) with individual visibility controls for each friendship level.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-primary">Custom Friendship Types</h4>
                  <p className="text-sm ml-4">Create custom categories beyond the defaults (e.g., "Work Colleagues", "Travel Buddies") with granular control over what each type can see.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-primary">Profile Completeness</h4>
                  <p className="text-sm ml-4">Your profile page shows a completeness indicator—the more you fill in, the richer your experience and connections become.</p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </section>

        {/* Friendship Levels */}
        <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Understanding Friendship Levels</h2>
          </div>
          <div className="space-y-4 text-foreground/80 leading-relaxed">
            <p>
              XCROL reimagines how we categorize relationships. Not all friends are equal, and that's okay. 
              Each level determines what information that person can see about you.
            </p>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                <Heart className="w-5 h-5 text-pink-500 mt-0.5" />
                <div>
                  <strong className="text-pink-500">Oath Bound (Close Friend)</strong>
                  <p className="text-sm">Your inner circle. Complete access to all your information, including home address, birth year, and private contact details.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                <Users className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <strong className="text-orange-500">Blood Bound (Family)</strong>
                  <p className="text-sm">An independent category outside the trust hierarchy. Family members get phone number, private email, and full birthday—but not social links or other friend-tier info unless you choose to share.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <strong className="text-yellow-500">Companion (Buddy)</strong>
                  <p className="text-sm">Good friends you hang out with regularly. Access to birthday (without year), mailing address, and most contact info.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                <UserCheck className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <strong className="text-blue-500">Wayfarer (Friendly Acquaintance)</strong>
                  <p className="text-sm">People you know and like, but aren't super close with. Basic contact info and public details. <strong>Wayfarer or above</strong> is the minimum tier required to send meetup/hosting requests and leave references.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                <EyeOff className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <strong className="text-purple-500">Invisible Ally (Secret Friend)</strong>
                  <p className="text-sm">A close connection hidden from public view. Same access as Oath Bound, but the relationship isn't visible to others.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                <Eye className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <strong className="text-red-500">Shadow Friend (Secret Enemy)</strong>
                  <p className="text-sm">Appears as a friend publicly, but has minimal actual access. For social situations requiring diplomacy. You can optionally give them decoy information.</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              <strong>Connection Degrees:</strong> XCROL also shows you how you're connected to people you haven't friended yet—friend-of-a-friend chains up to 6 degrees.
            </p>
          </div>
        </section>

        {/* Access Control */}
        <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Controlling Who Sees What</h2>
          </div>
          <div className="space-y-3 text-foreground/80 leading-relaxed">
            <p>
              Every piece of personal information you add can be assigned a visibility level:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Close Friend:</strong> Only your closest friends can see this</li>
              <li><strong>Family:</strong> Family members (phone, email, full birthday by default)</li>
              <li><strong>Buddy:</strong> Buddies and above can access</li>
              <li><strong>Friendly Acquaintance:</strong> All connected friends can view</li>
              <li><strong>Nobody:</strong> Hidden from everyone except you</li>
            </ul>
            <p className="mt-4">
              This applies to your birthday, home address, mailing address, nicknames, and social links. 
              You decide exactly what each level of friend can see about you.
            </p>
            <p className="text-primary/90 font-medium mt-4">
              <Shield className="w-4 h-4 inline mr-1" />
              Your data, your rules. XCROL puts you in complete control.
            </p>
          </div>
        </section>

        {/* My Xcrol - Daily Diary */}
        <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-3">
            <Scroll className="w-8 h-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">My Xcrol - Your Daily Diary</h2>
          </div>
          <div className="space-y-4 text-foreground/80 leading-relaxed">
            <p>
              Xcrol is your personal daily diary—a micro-journal limited to <strong>one entry per day</strong> and <strong>240 characters</strong>. 
              This constraint encourages you to distill each day into its essence.
            </p>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <h4 className="font-semibold mb-2">Privacy Levels for Entries</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Private:</strong> Only you can see</li>
                <li><strong>Close Friends:</strong> Your inner circle only</li>
                <li><strong>Buddies & above:</strong> Buddies and close friends</li>
                <li><strong>Acquaintances & above:</strong> All your friends</li>
              </ul>
            </div>
            <p>
              You can also attach a link to each entry—share an article, a song, or anything meaningful from your day.
            </p>
          </div>
        </section>

        {/* The River */}
        <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-3">
            <Waves className="w-8 h-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">The River - Your Friends' Updates</h2>
          </div>
          <div className="space-y-4 text-foreground/80 leading-relaxed">
            <p>
              The River is XCROL's social feed—a flowing stream of Xcrol entries from your friends. 
              Unlike algorithmic feeds, The River shows entries chronologically based on your friendship levels.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Real-time updates:</strong> New posts appear instantly with a "New post" banner you can tap to load</li>
              <li><strong>Threaded replies:</strong> Up to 3 levels of nested conversation, with emoji reactions on every reply</li>
              <li><strong>Filter by friendship level</strong> to focus on specific circles</li>
              <li><strong>Personal RSS feeds:</strong> Subscribe to news sources in Settings—they flow into your River alongside friends' posts</li>
              <li><strong>Shareable posts:</strong> Public entries get rich link previews (OpenGraph) and a public URL at <code>/post/:id</code></li>
              <li>Write your own Xcrol directly from The River</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              The River respects privacy—you'll only see entries from friends who've granted you access at their chosen level.
            </p>
          </div>
        </section>

        {/* The Brook */}
        <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-3">
            <Droplets className="w-8 h-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">The Brook - Private Two-Person Streams</h2>
          </div>
          <div className="space-y-4 text-foreground/80 leading-relaxed">
            <p>
              The Brook is a private, two-person version of The River. Each Brook is a dedicated space 
              where exactly two people can share daily updates, just with each other.
            </p>
            
            <div className="p-4 bg-secondary/30 rounded-lg">
              <h4 className="font-semibold mb-2">How Brooks Work</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>You can have up to <strong>5 active Brooks</strong></li>
                <li>Each user can post <strong>once per day per Brook</strong></li>
                <li>Brook posts <strong>don't count</strong> as your daily Xcrol entry</li>
                <li>Posts are limited to <strong>240 characters</strong> with an optional link</li>
                <li>Posts appear in <strong>strict chronological order</strong>—no algorithms</li>
              </ul>
            </div>

            <div className="p-4 bg-secondary/30 rounded-lg">
              <h4 className="font-semibold mb-2">Starting a Brook</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Go to <strong>My Xcrol</strong> and click "Start a Brook"</li>
                <li>Invite an existing XCROL user or invite by email</li>
                <li>The Brook is created once the recipient accepts</li>
                <li>Your Brooks appear at the top of your My Xcrol page</li>
              </ol>
            </div>

            <div className="p-4 bg-secondary/30 rounded-lg">
              <h4 className="font-semibold mb-2">Interactions</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>React to posts with emoji</li>
                <li>Add comments to posts</li>
                <li>All interactions are visible only to the two participants</li>
              </ul>
            </div>

            <div className="p-4 bg-secondary/30 rounded-lg">
              <h4 className="font-semibold mb-2">Inactivity Handling</h4>
              <p className="text-sm mb-2">
                If no posts occur for a configurable number of days (3, 7, or 9), the active user is gently prompted with options:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Let it rest:</strong> Keep the Brook but take a break (default)</li>
                <li><strong>Archive:</strong> Private and reversible—bring it back anytime</li>
                <li><strong>Send one gentle nudge:</strong> A single, non-intrusive reminder</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                The other person is never notified when you rest or archive a Brook.
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              <strong>Privacy first:</strong> Brooks are fully private—not visible on profiles, no public indicators, 
              no streaks, read receipts, typing indicators, or activity metrics. Just calm, daily awareness.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>NOSTR bridge (optional):</strong> If both Brook participants have enabled NOSTR identity in Settings, 
              Brook posts can be relayed as encrypted NIP-17 direct messages—keeping the conversation portable across the open NOSTR network.
            </p>
          </div>
        </section>

        {/* The Village - Groups */}
        <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">The Village - Community Groups</h2>
          </div>
          <div className="space-y-4 text-foreground/80 leading-relaxed">
            <p>
              The Village is XCROL's group system—community hubs where people with shared interests can gather, 
              post updates, and organize together.
            </p>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <h4 className="font-semibold mb-2">How Groups Work</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Create a group with a custom name, description, and unique slug (<code>/group/your-name</code>)</li>
                <li>Membership uses an <strong>Invite + Request</strong> model—members request to join or are invited</li>
                <li>Creators and co-admins manage membership, settings, and content</li>
                <li>Public visitors can see the group name, avatar, and description</li>
                <li>Internal content (posts, member list, shared links) is restricted based on trust levels</li>
              </ul>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <h4 className="font-semibold mb-2">Group Features</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Post updates with links and reactions</li>
                <li>Comment threads on group posts</li>
                <li>Admin controls for group metadata and avatar</li>
                <li>Adjustable visibility thresholds via the Settings tab</li>
              </ul>
            </div>
          </div>
        </section>

        {/* The Town - Marketplace */}
        <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-3">
            <Store className="w-8 h-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">The Town - Community Marketplace</h2>
          </div>
          <div className="space-y-4 text-foreground/80 leading-relaxed">
            <p>
              The Town is XCROL's community marketplace—a classifieds board inspired by the simplicity of early-2000s Craigslist, 
              built for trust-based communities.
            </p>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <h4 className="font-semibold mb-2">Categories</h4>
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <div><strong>Community:</strong> Activities, artists, childcare, events, groups, local news, missed connections, music, pets, politics, rideshare, romance, volunteers</div>
                <div><strong>Housing:</strong> Apartments, rooms, sublets, housing wanted, office/commercial, parking, real estate, storage</div>
                <div><strong>For Sale:</strong> Antiques, appliances, bikes, books, electronics, furniture, free stuff, general, jewelry, materials, and more</div>
                <div><strong>Services & Jobs:</strong> Professional services, lessons, skilled trades, job postings, resumes, and gigs</div>
              </div>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <h4 className="font-semibold mb-2">How It Works</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Browse active listings without an account</li>
                <li>Post listings with custom contact info or direct XCROL messaging</li>
                <li>Search across listing titles and descriptions</li>
                <li>Manage your own listings from "My Listings"</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Decentralized Media Hosting */}
        <section className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
          <div className="flex items-center gap-3">
            <Globe className="w-8 h-8 text-blue-500" />
            <h2 className="text-2xl md:text-3xl font-bold">Decentralized Media Hosting</h2>
          </div>
          <div className="space-y-4 text-foreground/80 leading-relaxed">
            <p className="text-lg">
              XCROL embraces the decentralized web by integrating with <strong>Pixelfed</strong> and <strong>PeerTube</strong> for 
              media hosting—keeping your photos and videos outside the control of Big Tech.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                <div className="flex items-center gap-2 mb-2">
                  <Image className="w-5 h-5 text-pink-500" />
                  <h3 className="font-bold">Pixelfed - Photo Hosting</h3>
                </div>
                <p className="text-sm">
                  A federated, open-source alternative to Instagram. Your photos are hosted on decentralized servers, 
                  giving you full ownership of your images while remaining accessible across the Fediverse.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                <div className="flex items-center gap-2 mb-2">
                  <Video className="w-5 h-5 text-red-500" />
                  <h3 className="font-bold">PeerTube - Video Hosting</h3>
                </div>
                <p className="text-sm">
                  A federated, open-source alternative to YouTube. Videos are distributed peer-to-peer, reducing 
                  reliance on centralized platforms and ensuring your content stays yours.
                </p>
              </div>
            </div>

            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <h4 className="font-bold mb-2">Why Decentralized?</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>You own your data:</strong> No corporation can delete, demonetize, or restrict your content</li>
                <li><strong>Censorship-resistant:</strong> Federated networks can't be shut down by a single entity</li>
                <li><strong>Interoperable:</strong> Content on Pixelfed and PeerTube is accessible across the entire Fediverse (Mastodon, Lemmy, etc.)</li>
                <li><strong>No ads or algorithms:</strong> Your content reaches people chronologically, not based on engagement metrics</li>
              </ul>
            </div>
          </div>
        </section>

        {/* NOSTR Identity & Federation */}
        <section className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/30">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-purple-500" />
            <h2 className="text-2xl md:text-3xl font-bold">NOSTR Identity & Federation</h2>
          </div>
          <div className="space-y-4 text-foreground/80 leading-relaxed">
            <p>
              XCROL plugs into the open <strong>NOSTR</strong> protocol so your identity and posts can travel beyond
              this app. Setup lives in <strong>Settings → NOSTR Identity</strong>.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
              <li><strong>Your npub</strong> (public key) is stored on your XCROL profile and discoverable.</li>
              <li><strong>Your nsec</strong> (private key) is generated and stored <strong>only in your browser's IndexedDB</strong>—never on our servers.</li>
              <li><strong>Auto-publish:</strong> When enabled, your public Xcrol entries are mirrored as kind 1 notes to three default relays (Damus, Nostr.band, Nos.lol).</li>
              <li><strong>NIP-05 discovery:</strong> Set a custom NOSTR handle and you become findable as <code>handle@xcrol.com</code> across the network.</li>
              <li><strong>Clean disable:</strong> Turning NOSTR off clears the npub from your profile, removes local keys, and resets all related flags.</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              NOSTR is fully optional. Use it to make your identity portable, or ignore it entirely.
            </p>
          </div>
        </section>

        {/* The World */}
        <section className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30">
          <div className="flex items-center gap-3">
            <MapPin className="w-8 h-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">The World - Your Hometown Matters</h2>
          </div>
          <div className="space-y-4 text-foreground/80 leading-relaxed">
            <p className="text-lg">
              The World is an interactive map showing where XCROL users call home.
            </p>
            <p>
              When you pin your hometown on the map, you're joining a global network of real people in real places:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Claim your hometown:</strong> Click anywhere on the map to set your location</li>
              <li><strong>Discover connections:</strong> See who else lives in your area or your friends' hometowns</li>
              <li><strong>Explore the world:</strong> Click on clusters to see users from different cities</li>
              <li><strong>Create meetups:</strong> Organize gatherings with a location, time, and description</li>
            </ul>
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/30 mt-4">
              <p className="font-semibold text-primary flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Purple dots = users • Yellow dots = locations with active meetups
              </p>
            </div>
          </div>
        </section>

        {/* Meetups & Hosting */}
        <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-3">
            <Coffee className="w-8 h-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Meetups & Hosting</h2>
          </div>
          <div className="space-y-4 text-foreground/80 leading-relaxed">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                <div className="flex items-center gap-2 mb-2">
                  <Coffee className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-bold">Meetup Requests</h3>
                </div>
                <p className="text-sm">
                  Request to meet up with friends when you're traveling or they're in your area. 
                  Set your meetup preferences and minimum friendship level required.
                </p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  <li>Tourism & sightseeing</li>
                  <li>Food & dining</li>
                  <li>Friendship & hangouts</li>
                  <li>Romance & dating</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-5 h-5 text-green-500" />
                  <h3 className="font-bold">Hosting Requests</h3>
                </div>
                <p className="text-sm">
                  Offer to host friends traveling to your city—or request a stay when visiting theirs. 
                  Configure accommodation type and capacity.
                </p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  <li>Spare room or couch</li>
                  <li>Private apartment</li>
                  <li>Guest house access</li>
                </ul>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Both features respect friendship levels—only friends meeting your minimum level can send requests.
            </p>
          </div>
        </section>

        {/* The Forest - Friends Hub */}
        <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-3">
            <TreePine className="w-8 h-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">The Forest - Your Friends Hub</h2>
          </div>
          <div className="space-y-4 text-foreground/80 leading-relaxed">
            <p>
              The Forest (<code>/the-forest</code>) is the centralized social hub where every friendship-related
              action lives in one place.
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-background/50">
                <strong>Friends list</strong>
                <p className="text-sm">All your connections, grouped by friendship level. Edit a level inline anytime.</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50">
                <strong>Incoming & outgoing requests</strong>
                <p className="text-sm">Friend requests with the sender's reference summary attached, so you can decide with context.</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50">
                <strong>Ask for an introduction</strong>
                <p className="text-sm">Request a mutual friend to introduce you to someone in their network. The introducer chooses how (or whether) to relay it.</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50">
                <strong>Blocked users</strong>
                <p className="text-sm">Manage anyone you've blocked from one tab.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong>Single nudge rule:</strong> You can send one gentle nudge per pending request—no spam loops.
            </p>
          </div>
        </section>

        {/* References */}
        <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">References & Trust</h2>
          </div>
          <div className="space-y-4 text-foreground/80 leading-relaxed">
            <p>
              Build trust through references—testimonials from friends about their experiences with you:
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-background/50">
                <strong className="text-green-500">Host References</strong>
                <p className="text-sm">Rate someone's hospitality after staying with them</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50">
                <strong className="text-blue-500">Guest References</strong>
                <p className="text-sm">Share your experience as a guest</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50">
                <strong className="text-purple-500">Friendly References</strong>
                <p className="text-sm">General friendship endorsements</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50">
                <strong className="text-orange-500">Business References</strong>
                <p className="text-sm">Professional collaboration testimonials</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Only friends at the appropriate level can leave references. References can be flagged if inappropriate.
            </p>
          </div>
        </section>

        {/* Messaging & Introduction Requests */}
        <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Messaging & Introductions</h2>
          </div>
          <div className="space-y-4 text-foreground/80 leading-relaxed">
            <p>
              XCROL provides multiple ways to communicate:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Direct Messages:</strong> Send messages to friends with optional platform suggestions (WhatsApp, email, etc.)</li>
              <li><strong>Introduction Requests:</strong> Ask a mutual friend to introduce you to someone in their network</li>
              <li><strong>Notifications:</strong> Get alerts for friend requests, messages, meetup requests, and more</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              XCROL's messaging is designed to bridge you to the right platform rather than replace existing communication tools.
            </p>
          </div>
        </section>

        {/* Notification Streams */}
        <section className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Notifications - Bell, Village & World</h2>
          </div>
          <div className="space-y-4 text-foreground/80 leading-relaxed">
            <p>
              XCROL splits notifications across three icons in the top bar so each kind of activity lives where you'd
              naturally look for it.
            </p>
            <div className="grid gap-3">
              <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                <div className="flex items-center gap-2 mb-1">
                  <Bell className="w-5 h-5 text-yellow-500" />
                  <strong className="text-yellow-500">Bell — Personal & Social</strong>
                </div>
                <p className="text-sm">Friend requests, references received, mentions, river replies, brook activity, unread messages.</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-5 h-5 text-orange-500" />
                  <strong className="text-orange-500">Village — Group activity</strong>
                </div>
                <p className="text-sm">Posts, comments, and reactions in any group you've joined. The badge surfaces only what's new since you last visited each group.</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-5 h-5 text-blue-500" />
                  <strong className="text-blue-500">World — IRL Layer activity</strong>
                </div>
                <p className="text-sm">New hometowns claimed near yours (~200 km), hosting requests, meetup requests, and introduction requests.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Each dropdown has an <strong>"Unread only / All recent"</strong> toggle. Switch to "All recent" to revisit
              the past 14 days; "Mark all as read" appears alongside it. Introductions still surface in The Forest as well.
            </p>
          </div>
        </section>

        {/* Custom Usernames */}
        <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Custom @Usernames</h2>
          </div>
          <div className="space-y-3 text-foreground/80 leading-relaxed">
            <p>
              Pick a unique <strong>@username</strong> (lowercase letters, numbers, underscores) once during onboarding or
              from your profile. Your shareable profile lives at <code>xcrol.com/@username</code>.
            </p>
            <p className="text-sm text-muted-foreground">
              Usernames are <strong>immutable</strong> once chosen—pick something you'll be happy with long-term. They also
              power @mentions across Xcrol entries, messages, brooks, and group posts.
            </p>
          </div>
        </section>

        {/* XCROL as OAuth Identity - NEW IMPORTANT SECTION */}
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
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span><strong>profile:read</strong> - Basic profile info</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span><strong>profile:email</strong> - Your email address</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span><strong>hometown:read</strong> - Your hometown location</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span><strong>connections:read</strong> - Your friends list</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span><strong>xcrol:read</strong> - Your diary entries</span>
                </div>
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

        {/* For Developers */}
        <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-3">
            <Code className="w-8 h-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">For Developers - Add "Login with XCROL"</h2>
          </div>
          <div className="space-y-4 text-foreground/80 leading-relaxed">
            <p>
              If you're building a website or app, you can let your users authenticate with their XCROL accounts:
            </p>
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

        {/* Settings & Privacy */}
        <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Settings & Account Management</h2>
          </div>
          <div className="space-y-4 text-foreground/80 leading-relaxed">
            <p>Access Settings from your user menu to manage:</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-background/50">
                <div className="flex items-center gap-2 mb-1">
                  <Bell className="w-4 h-4 text-yellow-500" />
                  <strong>Notifications</strong>
                </div>
                <p className="text-sm">Email and in-app notification preferences</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <strong>Privacy</strong>
                </div>
                <p className="text-sm">Online status visibility and friend request settings</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="w-4 h-4 text-red-500" />
                  <strong>Blocked Users</strong>
                </div>
                <p className="text-sm">Manage users you've blocked</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50">
                <div className="flex items-center gap-2 mb-1">
                  <Link2 className="w-4 h-4 text-green-500" />
                  <strong>Connected Apps</strong>
                </div>
                <p className="text-sm">Apps authorized to access your XCROL data</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50">
                <div className="flex items-center gap-2 mb-1">
                  <Code className="w-4 h-4 text-purple-500" />
                  <strong>Developer</strong>
                </div>
                <p className="text-sm">Create OAuth apps for "Login with XCROL"</p>
              </div>
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

        {/* Navigation Overview */}
        <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-3">
            <Globe className="w-8 h-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Quick Navigation Guide</h2>
          </div>
          <div className="space-y-3 text-foreground/80 leading-relaxed">
            <p>From the main Powers page, access everything:</p>
            <div className="grid gap-2">
              <div className="flex items-center gap-3 p-2 rounded bg-background/50">
                <MapPin className="w-5 h-5 text-purple-500" />
                <strong>THE WORLD</strong> - IRL Layer map, meetups, hometown claims, Hearth Surf
              </div>
              <div className="flex items-center gap-3 p-2 rounded bg-background/50">
                <Waves className="w-5 h-5 text-blue-500" />
                <strong>THE RIVER</strong> - Friends' Xcrol feed, reactions, replies
              </div>
              <div className="flex items-center gap-3 p-2 rounded bg-background/50">
                <Building2 className="w-5 h-5 text-orange-500" />
                <strong>THE VILLAGE</strong> - Community groups, group posts, member management
              </div>
              <div className="flex items-center gap-3 p-2 rounded bg-background/50">
                <Store className="w-5 h-5 text-yellow-500" />
                <strong>THE TOWN</strong> - Community marketplace, classifieds, listings
              </div>
              <div className="flex items-center gap-3 p-2 rounded bg-background/50">
                <User className="w-5 h-5 text-green-500" />
                <strong>YOU</strong> - Profile, friends, settings, Xcrol diary, Brooks
              </div>
            </div>
          </div>
        </section>

        {/* Earning Points */}
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
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <span>Write a daily Xcrol entry</span>
                <span className="font-bold text-amber-500">+1</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <span>Include a link in your Xcrol</span>
                <span className="font-bold text-amber-500">+1</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <span>React or comment on a Xcrol</span>
                <span className="font-bold text-amber-500">+1</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <span>Each friend you have</span>
                <span className="font-bold text-amber-500">+1</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <span>Post in a group</span>
                <span className="font-bold text-amber-500">+1</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <span>Create a listing in The Town</span>
                <span className="font-bold text-amber-500">+1</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <span>Set up your hometown</span>
                <span className="font-bold text-amber-500">+2</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <span>Leave a review of another user</span>
                <span className="font-bold text-amber-500">+3</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <span>Invite a friend to XCROL</span>
                <span className="font-bold text-amber-500">+2</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <span>Start a Brook with a friend</span>
                <span className="font-bold text-amber-500">+2</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <span>Invited friend accepts</span>
                <span className="font-bold text-amber-500">+5</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <span>Keep a Brook alive for 5 days</span>
                <span className="font-bold text-amber-500">+5</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <span>Complete your full profile</span>
                <span className="font-bold text-amber-500">+10</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <span>Create a group in The Village</span>
                <span className="font-bold text-amber-500">+10</span>
              </div>
            </div>
            <div className="mt-6 p-4 rounded-lg bg-background/30 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Castle className="w-5 h-5 text-amber-500" />
                <strong className="text-amber-500">But why do points matter?</strong>
              </div>
              <p className="text-sm text-foreground/60 italic">
                That remains to be seen. For now, know that your points are being counted. 
                When the gates of <strong>The Castle</strong> finally open, those who have built something here 
                will find the threshold more welcoming than those who have not. 
                More will be revealed in time.
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <div className="text-center space-y-6 py-8">
          <h2 className="text-2xl md:text-3xl font-bold">Ready to Begin?</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              variant="divine" 
              size="lg"
              onClick={() => navigate("/auth")}
            >
              Create Account
            </Button>
            <Button 
              variant="mystical" 
              size="lg"
              onClick={() => navigate("/powers")}
            >
              Explore Powers
            </Button>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center pb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/powers")}
          >
            ← Back to Powers
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GettingStarted;
