Cloudflare Pages deployment fails because the build uses Vite 5.4.19, but Cloudflare's wrangler auto-configuration requires Vite 6.0.0+. The build itself succeeds, but the deploy step errors out.

Plan
----
1. Update `vite` in `package.json` from `^5.4.19` to `^6.0.0` (or latest stable 6.x).
2. Run `bun install` to regenerate `bun.lockb`.
3. Verify the local build still passes with `bun run build`.
4. Let the user retry the Cloudflare Pages deploy.

That's it — a single dependency bump with lockfile refresh and a build sanity check.