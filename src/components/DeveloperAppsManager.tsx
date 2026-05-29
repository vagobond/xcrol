import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Loader2, Plus, Code } from "lucide-react";
import { toast } from "sonner";
import AppCard from "./developer-apps/AppCard";
import AppFormDialog from "./developer-apps/AppFormDialog";
import CredentialsDialog from "./developer-apps/CredentialsDialog";
import { emptyForm, type OAuthApp, type OAuthAppFormState } from "./developer-apps/types";

const parseRedirectUris = (raw: string): string[] | null => {
  const uris = raw.split("\n").map((u) => u.trim()).filter(Boolean);
  if (uris.length === 0) {
    toast.error("At least one redirect URI is required");
    return null;
  }
  for (const uri of uris) {
    try {
      new URL(uri);
    } catch {
      toast.error(`Invalid redirect URI: ${uri}`);
      return null;
    }
  }
  return uris;
};

const DeveloperAppsManager = () => {
  const { user } = useAuth();
  const [apps, setApps] = useState<OAuthApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState<{ app: OAuthApp; plainSecret: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<OAuthApp | null>(null);
  const [showEditDialog, setShowEditDialog] = useState<OAuthApp | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [newApp, setNewApp] = useState<OAuthAppFormState>(emptyForm);
  const [editApp, setEditApp] = useState<OAuthAppFormState>(emptyForm);

  useEffect(() => {
    if (user?.id) loadApps();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadApps = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("oauth_clients")
        .select("id, name, description, client_id, redirect_uris, logo_url, homepage_url, is_verified, created_at")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApps(data || []);
    } catch (error) {
      console.error("Error loading apps:", error);
      toast.error("Failed to load your apps");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApp = async () => {
    if (!newApp.name.trim()) {
      toast.error("App name is required");
      return;
    }
    const redirectUris = parseRedirectUris(newApp.redirect_uris);
    if (!redirectUris) return;

    setCreating(true);
    try {
      if (!user) throw new Error("Not authenticated");

      // Server-side RPC generates the secret, stores only the hash,
      // and returns the plaintext exactly once for display.
      const { data, error } = await supabase.rpc("create_oauth_app", {
        p_name: newApp.name.trim(),
        p_description: newApp.description.trim() || null,
        p_homepage_url: newApp.homepage_url.trim() || null,
        p_redirect_uris: redirectUris,
        p_logo_url: newApp.logo_url.trim() || null,
      });

      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) throw new Error("App creation returned no data");

      const created: OAuthApp = {
        id: row.id,
        name: row.name,
        description: row.description,
        client_id: row.client_id,
        redirect_uris: row.redirect_uris,
        logo_url: row.logo_url,
        homepage_url: row.homepage_url,
        is_verified: row.is_verified,
        created_at: row.created_at,
      };

      setApps((prev) => [created, ...prev]);
      setShowCreateDialog(false);
      setShowCredentialsDialog({ app: created, plainSecret: row.plain_secret });
      setNewApp(emptyForm);
      toast.success("App created successfully!");
    } catch (error) {
      console.error("Error creating app:", error);
      toast.error("Failed to create app");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteApp = async (app: OAuthApp) => {
    setDeleting(true);
    try {
      const { error } = await supabase.from("oauth_clients").delete().eq("id", app.id);
      if (error) throw error;
      setApps((prev) => prev.filter((a) => a.id !== app.id));
      toast.success(`Deleted ${app.name}`);
    } catch (error) {
      console.error("Error deleting app:", error);
      toast.error("Failed to delete app");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(null);
    }
  };

  const openEditDialog = (app: OAuthApp) => {
    setEditApp({
      name: app.name,
      description: app.description || "",
      homepage_url: app.homepage_url || "",
      redirect_uris: app.redirect_uris.join("\n"),
      logo_url: app.logo_url || "",
    });
    setShowEditDialog(app);
  };

  const handleUpdateApp = async () => {
    if (!showEditDialog) return;
    if (!editApp.name.trim()) {
      toast.error("App name is required");
      return;
    }
    const redirectUris = parseRedirectUris(editApp.redirect_uris);
    if (!redirectUris) return;

    setUpdating(true);
    try {
      const { data, error } = await supabase
        .from("oauth_clients")
        .update({
          name: editApp.name.trim(),
          description: editApp.description.trim() || null,
          homepage_url: editApp.homepage_url.trim() || null,
          redirect_uris: redirectUris,
          logo_url: editApp.logo_url.trim() || null,
        })
        .eq("id", showEditDialog.id)
        .select()
        .single();

      if (error) throw error;

      setApps((prev) => prev.map((a) => (a.id === data.id ? ({ ...a, ...data } as OAuthApp) : a)));
      setShowEditDialog(null);
      toast.success("App updated successfully!");
    } catch (error) {
      console.error("Error updating app:", error);
      toast.error("Failed to update app");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Developer Apps</h3>
          <p className="text-sm text-muted-foreground">
            Create OAuth apps to let other sites use "Login with XCROL"
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create App
        </Button>
      </div>

      {apps.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Code className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No Apps Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first OAuth app to enable "Login with XCROL" on your website.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First App
            </Button>
          </CardContent>
        </Card>
      ) : (
        apps.map((app) => (
          <AppCard key={app.id} app={app} onEdit={openEditDialog} onDelete={setShowDeleteConfirm} />
        ))
      )}

      <AppFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        mode="create"
        form={newApp}
        onChange={setNewApp}
        onSubmit={handleCreateApp}
        submitting={creating}
      />

      <CredentialsDialog
        data={showCredentialsDialog}
        onClose={() => setShowCredentialsDialog(null)}
      />

      <AppFormDialog
        open={!!showEditDialog}
        onOpenChange={(open) => !open && setShowEditDialog(null)}
        mode="edit"
        form={editApp}
        onChange={setEditApp}
        onSubmit={handleUpdateApp}
        submitting={updating}
      />

      <AlertDialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete App</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{showDeleteConfirm?.name}</strong>?
              All users who authorized this app will be disconnected. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showDeleteConfirm && handleDeleteApp(showDeleteConfirm)}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete App
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DeveloperAppsManager;
