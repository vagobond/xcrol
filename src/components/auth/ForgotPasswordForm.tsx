import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthErrors } from "./schemas";

interface ForgotPasswordFormProps {
  email: string;
  setEmail: (v: string) => void;
  errors: AuthErrors;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export const ForgotPasswordForm = ({ email, setEmail, errors, loading, onSubmit, onBack }: ForgotPasswordFormProps) => (
  <div className="space-y-4">
    <div className="text-center space-y-2">
      <h3 className="text-xl font-semibold">Reset Your Password</h3>
      <p className="text-sm text-muted-foreground">
        Enter your email and we'll send you a link to reset your password.
      </p>
    </div>
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reset-email">Email</Label>
        <Input
          id="reset-email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-muted/20 border-primary/30"
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
      </div>
      <Button type="submit" variant="divine" className="w-full" disabled={loading}>
        {loading ? "Sending..." : "Send Reset Link"}
      </Button>
      <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
        Back to Sign In
      </Button>
    </form>
  </div>
);
