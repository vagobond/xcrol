import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleSignInButton } from "./GoogleSignInButton";
import type { AuthErrors } from "./schemas";

interface SignInFormProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  errors: AuthErrors;
  loading: boolean;
  googleLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onForgotPassword: () => void;
  onGoogleSignIn: () => void;
}

export const SignInForm = ({
  email, setEmail, password, setPassword,
  errors, loading, googleLoading,
  onSubmit, onForgotPassword, onGoogleSignIn,
}: SignInFormProps) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="signin-email">Email</Label>
      <Input
        id="signin-email"
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="bg-muted/20 border-primary/30"
      />
      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
    </div>
    <div className="space-y-2">
      <Label htmlFor="signin-password">Password</Label>
      <Input
        id="signin-password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="bg-muted/20 border-primary/30"
      />
      {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
    </div>
    <Button type="submit" variant="divine" className="w-full" disabled={loading}>
      {loading ? "Signing in..." : "Sign In"}
    </Button>
    <Button
      type="button"
      variant="link"
      className="w-full text-muted-foreground hover:text-foreground"
      onClick={onForgotPassword}
    >
      Forgot your password?
    </Button>

    <div className="relative my-4">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-primary/30" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
      </div>
    </div>

    <GoogleSignInButton onClick={onGoogleSignIn} loading={googleLoading} />
  </form>
);
