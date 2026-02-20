import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

interface ResetPasswordSentProps {
  email: string;
  loading: boolean;
  onResend: () => void;
  onBack: () => void;
}

export const ResetPasswordSent = ({ email, loading, onResend, onBack }: ResetPasswordSentProps) => (
  <div className="text-center space-y-4 py-6">
    <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
      <Mail className="w-8 h-8 text-primary" />
    </div>
    <h3 className="text-xl font-semibold">Check Your Email</h3>
    <p className="text-muted-foreground">
      We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>
    </p>
    <p className="text-sm text-muted-foreground">
      Click the link in the email to reset your password.
    </p>
    <div className="flex flex-col gap-2 mt-4">
      <Button variant="outline" disabled={loading} onClick={onResend}>
        {loading ? "Sending..." : "Resend Reset Email"}
      </Button>
      <Button variant="ghost" onClick={onBack}>
        Back to Sign In
      </Button>
    </div>
  </div>
);
