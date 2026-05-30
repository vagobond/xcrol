import {
  Scroll,
  Waves,
  Droplets,
  Building2,
  Store,
  Globe,
  Image,
  Video,
  Zap,
  MapPin,
  Coffee,
  Home,
  TreePine,
  CheckCircle2,
  MessageCircle,
  Bell,
  User,
} from "lucide-react";

export default function SocialSections() {
  return (
    <>
      {/* My Xcrol */}
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
          <p>You can also attach a link to each entry—share an article, a song, or anything meaningful from your day.</p>
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

      {/* The Village */}
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

      {/* The Town */}
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

      {/* Decentralized Media */}
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

      {/* NOSTR */}
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
          <p className="text-lg">The World is an interactive map showing where XCROL users call home.</p>
          <p>When you pin your hometown on the map, you're joining a global network of real people in real places:</p>
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
            By default, anyone at <strong>Wayfarer</strong> (Friendly Acquaintance) or above can send a request, but you can raise the bar.
          </p>
        </div>
      </section>

      {/* The Forest */}
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
          <p>Build trust through references—testimonials from friends about their experiences with you:</p>
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

      {/* Messaging */}
      <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold">Messaging & Introductions</h2>
        </div>
        <div className="space-y-4 text-foreground/80 leading-relaxed">
          <p>XCROL provides multiple ways to communicate:</p>
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

      {/* Notifications */}
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

      {/* Usernames */}
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
    </>
  );
}
