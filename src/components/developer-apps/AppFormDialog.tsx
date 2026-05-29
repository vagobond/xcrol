import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { OAuthAppFormState } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  form: OAuthAppFormState;
  onChange: (form: OAuthAppFormState) => void;
  onSubmit: () => void;
  submitting: boolean;
}

export default function AppFormDialog({ open, onOpenChange, mode, form, onChange, onSubmit, submitting }: Props) {
  const idPrefix = mode === "edit" ? "edit-" : "";
  const title = mode === "edit" ? "Edit App" : "Create OAuth App";
  const description =
    mode === "edit"
      ? "Update your OAuth app settings."
      : 'Create an app to enable "Login with XCROL" on your website.';
  const submitLabel = mode === "edit" ? "Save Changes" : "Create App";

  const update = (patch: Partial<OAuthAppFormState>) => onChange({ ...form, ...patch });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor={`${idPrefix}name`}>App Name *</Label>
            <Input
              id={`${idPrefix}name`}
              placeholder="My Awesome App"
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor={`${idPrefix}description`}>Description</Label>
            <Textarea
              id={`${idPrefix}description`}
              placeholder="What does your app do?"
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor={`${idPrefix}homepage_url`}>Homepage URL</Label>
            <Input
              id={`${idPrefix}homepage_url`}
              type="url"
              placeholder="https://myapp.com"
              value={form.homepage_url}
              onChange={(e) => update({ homepage_url: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor={`${idPrefix}redirect_uris`}>Redirect URIs * (one per line)</Label>
            <Textarea
              id={`${idPrefix}redirect_uris`}
              placeholder="https://myapp.com/auth/callback&#10;http://localhost:3000/auth/callback"
              value={form.redirect_uris}
              onChange={(e) => update({ redirect_uris: e.target.value })}
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Users will be redirected here after authorization
            </p>
          </div>

          <div>
            <Label htmlFor={`${idPrefix}logo_url`}>Logo URL</Label>
            <Input
              id={`${idPrefix}logo_url`}
              type="url"
              placeholder="https://myapp.com/logo.png"
              value={form.logo_url}
              onChange={(e) => update({ logo_url: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
