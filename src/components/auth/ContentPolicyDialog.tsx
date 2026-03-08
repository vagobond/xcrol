import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";

interface ContentPolicyDialogProps {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

export const ContentPolicyDialog = ({ open, onAccept, onCancel }: ContentPolicyDialogProps) => {
  const [acknowledged, setAcknowledged] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onCancel();
      setAcknowledged(false);
    }
  };

  const handleAccept = () => {
    onAccept();
    setAcknowledged(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <AlertDialogHeader className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mb-2">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <AlertDialogTitle className="text-xl text-center">Content Policy</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Please read our content policy before creating your account.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ScrollArea className="flex-1 max-h-[45vh] border rounded-md p-4 my-2">
          <div className="space-y-4 text-sm leading-relaxed">
            <p className="text-muted-foreground">
              To maintain a safe and respectful community, users must follow these rules when posting or interacting on the platform.
            </p>

            <div>
              <h3 className="font-semibold text-foreground mb-1">1. No Hate Speech or Harassment</h3>
              <p className="text-muted-foreground">
                Content that promotes violence, discrimination, or hatred against individuals or groups based on characteristics such as race, ethnicity, nationality, religion, gender, sexual orientation, disability, or similar attributes is strictly prohibited. Harassment, threats, or bullying of any user is not allowed.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">2. No Illegal Activity</h3>
              <p className="text-muted-foreground">
                Users may not post, promote, or facilitate illegal activities. This includes sharing instructions, coordinating unlawful acts, selling illegal goods or services, or encouraging others to break the law.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">3. Zero Tolerance for Child Abuse or Exploitation</h3>
              <p className="text-muted-foreground">
                Any content that involves child abuse, sexualization of minors, grooming behavior, or exploitation of children is strictly forbidden. This includes images, videos, messages, links, or any other material involving minors in abusive or exploitative contexts.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">4. Reporting and Enforcement</h3>
              <p className="text-muted-foreground">
                Users are encouraged to report violations. Content that violates these rules may be removed, and accounts may be suspended or permanently banned. Serious violations may be reported to law enforcement.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">5. Platform Responsibility</h3>
              <p className="text-muted-foreground">
                We reserve the right to review, remove, or restrict any content or account that violates this policy or threatens the safety of the community.
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="flex items-start space-x-2 py-2">
          <Checkbox
            id="content-policy-ack"
            checked={acknowledged}
            onCheckedChange={(checked) => setAcknowledged(checked === true)}
            className="mt-0.5"
          />
          <label htmlFor="content-policy-ack" className="text-sm leading-relaxed cursor-pointer">
            I have read and agree to the Content Policy
          </label>
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction onClick={handleAccept} disabled={!acknowledged} className="w-full">
            I Agree — Continue
          </AlertDialogAction>
          <AlertDialogCancel onClick={onCancel} className="w-full">
            Cancel
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
