import { notFound } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CsvImport } from "@/components/ads-agent/csv-import";
import { AdDraftBuilder } from "@/components/ads-agent/ad-draft-builder";

export default function AdsAgentPreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <main className="min-h-screen bg-muted/20 p-4 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">Celtic Quest</p>
            <h1 className="text-3xl font-bold tracking-tight">Meta Ads Agent</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Read-only performance intelligence, recommendations, and
              approval-ready campaign concepts.
            </p>
          </div>
          <Badge variant="secondary" className="w-fit gap-1.5 px-3 py-1.5">
            <LockKeyhole className="h-3.5 w-3.5" />
            Safe mode
          </Badge>
        </div>

        <Card className="border-emerald-200 bg-emerald-50/60">
          <CardContent className="flex items-start gap-3 p-5">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div>
              <p className="font-medium text-emerald-950">
                Campaign protection is on
              </p>
              <p className="mt-1 text-sm text-emerald-900/70">
                This preview cannot publish, change budgets, connect Meta
                assets, or alter active campaigns.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approve a private-charter creative bundle</CardTitle>
          </CardHeader>
          <CardContent>
            <AdDraftBuilder demoMode />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance review and campaign advisor</CardTitle>
          </CardHeader>
          <CardContent>
            <CsvImport demoMode />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
