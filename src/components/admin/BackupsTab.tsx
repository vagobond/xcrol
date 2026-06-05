import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, PlayCircle, ShieldCheck, AlertTriangle, RefreshCw, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BackupRun {
  id: string;
  kind: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  bytes_uploaded: number;
  files_uploaded: number;
  tables_dumped: number;
  manifest_key: string | null;
  error: string | null;
}

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

export function BackupsTab() {
  const [runs, setRuns] = useState<BackupRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("backup_runs")
      .select("id, kind, status, started_at, finished_at, bytes_uploaded, files_uploaded, tables_dumped, manifest_key, error")
      .order("started_at", { ascending: false })
      .limit(50);
    if (error) toast.error(error.message);
    else setRuns((data ?? []) as BackupRun[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runNow = async () => {
    setTriggering(true);
    try {
      const { data, error } = await supabase.functions.invoke("nightly-backup");
      if (error) throw error;
      if (data?.ok) toast.success(`Backup complete: ${data.files_uploaded} files, ${fmtBytes(data.bytes_uploaded)}`);
      else toast.error(`Backup finished with errors: ${(data?.errors ?? []).join("; ") || data?.error || "see history"}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Backup failed");
    } finally {
      setTriggering(false);
      load();
    }
  };

  const lastSuccess = runs.find((r) => r.status === "success" && r.kind !== "heartbeat");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" /> Off-site backups
          </CardTitle>
          <CardDescription>
            Nightly dump of every public table + auth.users + storage catalog, uploaded to a Backblaze B2
            bucket you control. See <a className="underline" href="https://github.com" target="_blank" rel="noreferrer">docs/RUNBOOK.md</a> for restoring.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {lastSuccess ? (
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>Last successful backup</AlertTitle>
              <AlertDescription className="text-xs">
                {new Date(lastSuccess.started_at).toLocaleString()} —{" "}
                {lastSuccess.files_uploaded} files, {fmtBytes(lastSuccess.bytes_uploaded)},{" "}
                {lastSuccess.tables_dumped} tables. Key: <code>{lastSuccess.manifest_key}</code>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No successful backup yet</AlertTitle>
              <AlertDescription className="text-xs">
                Add the B2 secrets (B2_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET_NAME), then run a manual backup.
              </AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2">
            <Button onClick={runNow} disabled={triggering}>
              {triggering ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
              Run backup now
            </Button>
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button variant="ghost" asChild>
              <a href="/docs/RUNBOOK.md" target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" /> Runbook
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Run history (latest 50)</CardTitle></CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No runs yet.</p>
          ) : (
            <div className="space-y-2">
              {runs.map((r) => (
                <div key={r.id} className="flex items-center justify-between border rounded-md p-3 text-sm">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={r.status === "success" ? "secondary" : r.status === "failed" ? "destructive" : "outline"}>
                        {r.status}
                      </Badge>
                      <Badge variant="outline">{r.kind}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.started_at).toLocaleString()}
                      </span>
                    </div>
                    {r.manifest_key && <div className="text-xs text-muted-foreground truncate">{r.manifest_key}</div>}
                    {r.error && <div className="text-xs text-destructive truncate">{r.error}</div>}
                  </div>
                  <div className="text-xs text-right text-muted-foreground shrink-0 ml-3">
                    {r.tables_dumped} tables<br />
                    {r.files_uploaded} files · {fmtBytes(r.bytes_uploaded)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
