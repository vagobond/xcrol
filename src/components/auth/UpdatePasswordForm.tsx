import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound } from "lucide-react";
import type { AuthErrors } from "./schemas";

interface UpdatePasswordFormProps {
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  errors: AuthErrors;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const UpdatePasswordForm = ({
  password, setPassword, confirmPassword, setConfirmPassword,
  errors, loading, onSubmit,
}: UpdatePasswordFormProps) => (
  <div className="space-y-4">
    <div className="text-center space-y-2">
      <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
        <KeyRound className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold">Set New Password</h3>
      <p className="text-sm text-muted-foreground">Enter your new password below.</p>
    </div>
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new-password">New Password</Label>
        <Input
          id="new-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-muted/20 border-primary/30"
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
        <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="bg-muted/20 border-primary/30"
        />
        {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
      </div>
      <Button type="submit" variant="divine" className="w-full" disabled={loading}>
        {loading ? "Updating..." : "Update Password"}
      </Button>
    </form>
  </div>
);
