import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

interface EmailNotConfirmedProps {
  email: string;
  loading: boolean;
  onResend: () => void;
  onBack: () => void;
}

export const EmailNotConfirmed = ({ email, loading, onResend, onBack }: EmailNotConfirmedProps) => (
  <div className="text-center space-y-4 py-6">
    <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
      <Mail className="w-8 h-8 text-amber-500" />
    </div>
    <h3 className="text-xl font-semibold">Email Not Confirmed</h3>
    <p className="text-muted-foreground">
      Your email address <span className="font-medium text-foreground">{email}</span> hasn't been confirmed yet.
    </p>
    <p className="text-sm text-muted-foreground">
      Please check your inbox for the confirmation email, or click below to resend it.
    </p>
    <div className="flex flex-col gap-2 mt-4">
      <Button variant="divine" disabled={loading} onClick={onResend}>
        {loading ? "Sending..." : "Resend Confirmation Email"}
      </Button>
      <Button variant="ghost" onClick={onBack}>
        Back to Sign In
      </Button>
    </div>
  </div>
);
