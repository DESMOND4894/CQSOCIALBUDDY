import {
  CheckCircle2,
  FileSpreadsheet,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CsvImport } from "@/components/ads-agent/csv-import";
import { AdDraftBuilder } from "@/components/ads-agent/ad-draft-builder";

const safeguards = [
  "No live ads can be published",
  "No budgets or active campaigns can be changed",
  "Every proposed action will require Des's approval",
];

export default function AdsAgentPage() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">Celtic Quest</p>
          <h1 className="text-2xl font-bold tracking-tight">Meta Ads Agent</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Review performance and prepare campaigns for approval. The first
            release is read-only and draft-only.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit gap-1.5 px-3 py-1.5">
          <LockKeyhole className="h-3.5 w-3.5" />
          Safe mode
        </Badge>
      </div>

      <Card className="border-emerald-200 bg-emerald-50/60">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Campaign protection is on</CardTitle>
              <CardDescription className="mt-1 text-emerald-900/70">
                This area is isolated from CQ Social Buddy&apos;s existing
                posting and inbox features.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 md:grid-cols-3">
            {safeguards.map((safeguard) => (
              <li
                key={safeguard}
                className="flex items-start gap-2 text-sm text-emerald-950"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {safeguard}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Approve a private-charter creative bundle</CardTitle>
            <CardDescription>
              Compare every photo variation, review the copy and settings, then
              approve the exact bundle before Meta creation is available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdDraftBuilder />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Import Meta results</CardTitle>
                <CardDescription>
                  Start safely with an Ads Manager CSV export.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CsvImport />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
