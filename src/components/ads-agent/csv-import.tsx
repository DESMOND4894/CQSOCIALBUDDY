"use client";

import { ChangeEvent, useRef, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  FileSpreadsheet,
  Loader2,
  RotateCcw,
  Sparkles,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  analyzeAds,
  parseMetric,
  type AdsAgentReport,
  type AdsPerformanceAnalysis,
  type NormalizedAdResult,
} from "@/lib/ads-agent/analysis";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_PREVIEW_ROWS = 10;

type CsvImportResult = {
  fileName: string;
  headers: string[];
  rows: string[][];
  totalRows: number;
  mappedColumns: MappedColumn[];
  analysis: AdsPerformanceAnalysis | null;
};

type MetaColumn = {
  key: string;
  label: string;
  required: boolean;
  aliases: string[];
};

type MappedColumn = MetaColumn & {
  header: string | null;
  columnIndex: number | null;
};

const META_COLUMNS: MetaColumn[] = [
  {
    key: "adName",
    label: "Ad name",
    required: true,
    aliases: ["ad name", "ad"],
  },
  {
    key: "spend",
    label: "Amount spent",
    required: true,
    aliases: ["amount spent", "amount spent (usd)", "spend"],
  },
  {
    key: "purchases",
    label: "Purchases",
    required: false,
    aliases: ["purchases", "website purchases", "meta purchases"],
  },
  {
    key: "conversionValue",
    label: "Purchase conversion value",
    required: false,
    aliases: [
      "purchase conversion value",
      "purchases conversion value",
      "website purchase conversion value",
      "website purchases conversion value",
      "conversion value",
    ],
  },
  {
    key: "costPerPurchase",
    label: "Cost per purchase",
    required: false,
    aliases: ["cost per purchase", "cost per website purchase"],
  },
  {
    key: "roas",
    label: "Purchase ROAS",
    required: false,
    aliases: [
      "purchase roas (return on ad spend)",
      "website purchase roas",
      "purchase roas",
      "roas",
    ],
  },
];

function normalizeHeader(header: string) {
  return header
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function mapMetaColumns(headers: string[]): MappedColumn[] {
  const normalizedHeaders = headers.map(normalizeHeader);

  return META_COLUMNS.map((column) => {
    const columnIndex = normalizedHeaders.findIndex((header) =>
      column.aliases.includes(header)
    );

    return {
      ...column,
      header: columnIndex >= 0 ? headers[columnIndex] : null,
      columnIndex: columnIndex >= 0 ? columnIndex : null,
    };
  });
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (character === '"') {
      if (inQuotes && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === "," && !inQuotes) {
      row.push(field.trim());
      field = "";
    } else if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && text[index + 1] === "\n") {
        index += 1;
      }
      row.push(field.trim());
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (inQuotes) {
    throw new Error("The CSV contains an unfinished quoted value.");
  }

  row.push(field.trim());
  if (row.some((value) => value.length > 0)) {
    rows.push(row);
  }

  return rows;
}

function normalizeAds(
  rows: string[][],
  mappedColumns: MappedColumn[]
): NormalizedAdResult[] {
  const indexFor = (key: string) =>
    mappedColumns.find((column) => column.key === key)?.columnIndex ?? null;
  const adNameIndex = indexFor("adName");
  const spendIndex = indexFor("spend");

  if (adNameIndex === null || spendIndex === null) return [];

  return rows
    .map((row) => ({
      adName: row[adNameIndex]?.trim() ?? "",
      spend: parseMetric(row[spendIndex]) ?? 0,
      purchases: parseMetric(row[indexFor("purchases") ?? -1]),
      conversionValue: parseMetric(row[indexFor("conversionValue") ?? -1]),
      costPerPurchase: parseMetric(row[indexFor("costPerPurchase") ?? -1]),
      roas: parseMetric(row[indexFor("roas") ?? -1]),
    }))
    .filter((ad) => ad.adName);
}

function formatCurrency(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatNumber(value: number | null, decimals = 0) {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
  }).format(value);
}

const PREVIEW_ADS: NormalizedAdResult[] = [
  {
    adName: "New Leads Ad",
    spend: 2600,
    purchases: 140,
    conversionValue: 27000,
    costPerPurchase: null,
    roas: null,
  },
  {
    adName: "Retargeting Ad",
    spend: 3097.2,
    purchases: 135,
    conversionValue: 26001,
    costPerPurchase: null,
    roas: null,
  },
];

const PREVIEW_REPORT: AdsAgentReport = {
  executiveSummary:
    "Meta reports strong overall performance, with $53,001 in attributed purchase value from $5,697.20 in spend. The New Leads Ad is the more efficient of the two in this preview, but Meta attribution should remain directional until reservation source tracking is improved.",
  findings: [
    "The preview totals 275 Meta-reported purchases at an overall 9.3x return on ad spend.",
    "New Leads Ad has the lower cost per purchase and the stronger return on ad spend.",
    "Reservation records cannot yet confirm which individual bookings came from these ads.",
  ],
  recommendations: [
    "Preserve the winning message as the control and test one creative variable at a time.",
    "Add consistent UTM parameters and capture booking source before increasing confidence in attribution.",
    "Review destination page and offer details before drafting any campaign for approval.",
  ],
  draftCampaign: {
    name: "Celtic Quest Winning Message Test — Draft",
    objective: "Test a new creative variation against the current lead-generation winner.",
    rationale:
      "The New Leads Ad appears more efficient, so the next controlled test should build from that message without changing live spend or replacing the current winner.",
    guardrails: [
      "Draft only",
      "No budget selected",
      "No audience selected",
      "Des approval required",
      "Remain paused",
    ],
  },
};

function createPreviewResult(): CsvImportResult {
  return {
    fileName: "celtic-quest-meta-preview.csv",
    headers: [
      "Ad name",
      "Amount spent (USD)",
      "Purchases",
      "Purchases conversion value",
    ],
    rows: PREVIEW_ADS.map((ad) => [
      ad.adName,
      ad.spend.toFixed(2),
      String(ad.purchases),
      String(ad.conversionValue),
    ]),
    totalRows: PREVIEW_ADS.length,
    mappedColumns: mapMetaColumns([
      "Ad name",
      "Amount spent (USD)",
      "Purchases",
      "Purchases conversion value",
    ]),
    analysis: analyzeAds(PREVIEW_ADS),
  };
}

export function CsvImport({ demoMode = false }: { demoMode?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<CsvImportResult | null>(
    demoMode ? createPreviewResult() : null
  );
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AdsAgentReport | null>(
    demoMode ? PREVIEW_REPORT : null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);

  function resetImport() {
    setResult(null);
    setError(null);
    setReport(null);
    setAgentError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError(null);
    setResult(null);
    setReport(null);
    setAgentError(null);

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Choose a CSV file exported from Meta Ads Manager.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("This file is larger than the 5 MB import limit.");
      return;
    }

    try {
      const parsedRows = parseCsv(await file.text());
      const [headers, ...rows] = parsedRows;

      if (!headers?.length || rows.length === 0) {
        throw new Error("The CSV needs a header row and at least one data row.");
      }

      const mappedColumns = mapMetaColumns(headers);
      const normalizedAds = normalizeAds(rows, mappedColumns);

      setResult({
        fileName: file.name,
        headers,
        rows: rows.slice(0, MAX_PREVIEW_ROWS),
        totalRows: rows.length,
        mappedColumns,
        analysis: normalizedAds.length > 0 ? analyzeAds(normalizedAds) : null,
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "This CSV could not be read."
      );
    }
  }

  async function runAgent() {
    if (!result?.analysis) return;

    setIsAnalyzing(true);
    setAgentError(null);
    setReport(null);

    try {
      const response = await fetch("/api/ads-agent/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ads: result.analysis.ads,
          totals: result.analysis.totals,
          warnings: result.analysis.warnings,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "The Ads Agent could not run.");
      }

      setReport(data.report);
    } catch (caughtError) {
      setAgentError(
        caughtError instanceof Error
          ? caughtError.message
          : "The Ads Agent could not run."
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  if (result) {
    const foundColumns = result.mappedColumns.filter(
      (column) => column.columnIndex !== null
    );
    const missingRequiredColumns = result.mappedColumns.filter(
      (column) => column.required && column.columnIndex === null
    );

    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-sm font-medium">{result.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {result.totalRows} {result.totalRows === 1 ? "row" : "rows"} read
                locally · nothing uploaded
                {demoMode ? " · representative preview data" : ""}
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={resetImport}>
            <RotateCcw />
            Choose another file
          </Button>
        </div>

        <div
          className={`rounded-lg border p-4 ${
            missingRequiredColumns.length === 0
              ? "border-emerald-200 bg-emerald-50/60"
              : "border-amber-200 bg-amber-50/60"
          }`}
        >
          <div className="flex items-start gap-3">
            {missingRequiredColumns.length === 0 ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            ) : (
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {missingRequiredColumns.length === 0
                  ? "Ready for read-only analysis"
                  : "Required columns are missing"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Recognized {foundColumns.length} of {result.mappedColumns.length}{" "}
                analysis fields.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.mappedColumns.map((column) => (
                  <Badge
                    key={column.key}
                    variant={
                      column.columnIndex !== null ? "secondary" : "outline"
                    }
                  >
                    {column.columnIndex !== null ? "Found" : "Missing"}:{" "}
                    {column.label}
                    {column.required ? " *" : ""}
                  </Badge>
                ))}
              </div>
              {missingRequiredColumns.length > 0 && (
                <p className="mt-3 text-xs text-amber-900">
                  Export the Ad name and Amount spent columns from Meta Ads
                  Manager before continuing. Optional missing metrics will limit
                  the performance comparison.
                </p>
              )}
            </div>
          </div>
        </div>

        {missingRequiredColumns.length === 0 && result.analysis && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["Spend", formatCurrency(result.analysis.totals.spend)],
                ["Purchases", formatNumber(result.analysis.totals.purchases)],
                [
                  "Conversion value",
                  formatCurrency(result.analysis.totals.conversionValue),
                ],
                [
                  "Cost per purchase",
                  formatCurrency(result.analysis.totals.costPerPurchase),
                ],
                [
                  "ROAS",
                  result.analysis.totals.roas === null
                    ? "—"
                    : `${formatNumber(result.analysis.totals.roas, 2)}x`,
                ],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border bg-background p-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-xl font-semibold">{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad</TableHead>
                    <TableHead className="text-right">Spend</TableHead>
                    <TableHead className="text-right">Purchases</TableHead>
                    <TableHead className="text-right">Purchase value</TableHead>
                    <TableHead className="text-right">Cost / purchase</TableHead>
                    <TableHead className="text-right">ROAS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.analysis.ads.map((ad, index) => (
                    <TableRow key={`${ad.adName}-${index}`}>
                      <TableCell className="font-medium">{ad.adName}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(ad.spend)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(ad.purchases)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(ad.conversionValue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(ad.costPerPurchase)}
                      </TableCell>
                      <TableCell className="text-right">
                        {ad.roas === null
                          ? "—"
                          : `${formatNumber(ad.roas, 2)}x`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                    <p className="font-medium">Celtic Quest Ads Agent</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Generate findings, recommended tests, and one draft campaign
                    concept from these results.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={runAgent}
                  disabled={isAnalyzing || demoMode}
                >
                  {isAnalyzing ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Sparkles />
                  )}
                  {demoMode
                    ? "Preview report"
                    : isAnalyzing
                      ? "Analyzing…"
                      : "Run Ads Agent"}
                </Button>
              </div>
              <p className="mt-3 text-xs text-indigo-900/70">
                Advisory only. This cannot publish ads or change campaigns,
                audiences, schedules, bids, or budgets.
              </p>
              {agentError && (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  {agentError}
                </p>
              )}
            </div>

            {report && (
              <div className="space-y-4 rounded-lg border bg-background p-5">
                <div>
                  <Badge variant="secondary">AI analysis · draft only</Badge>
                  <h3 className="mt-3 text-lg font-semibold">
                    Performance briefing
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {report.executiveSummary}
                  </p>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-semibold">Key findings</h4>
                    <ul className="mt-2 space-y-2">
                      {report.findings.map((finding, index) => (
                        <li key={index} className="flex gap-2 text-sm">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Recommended next tests</h4>
                    <ul className="mt-2 space-y-2">
                      {report.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex gap-2 text-sm">
                          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-lg border border-dashed p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-semibold">
                      {report.draftCampaign.name}
                    </h4>
                    <Badge variant="outline">Not sent to Meta</Badge>
                  </div>
                  <p className="mt-2 text-sm">
                    <span className="font-medium">Objective:</span>{" "}
                    {report.draftCampaign.objective}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {report.draftCampaign.rationale}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {report.draftCampaign.guardrails.map((guardrail, index) => (
                      <Badge key={index} variant="secondary">
                        {guardrail}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <details className="rounded-lg border">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
            View raw CSV preview
          </summary>
          <div className="border-t">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {result.headers.map((header, index) => (
                  <TableHead key={`${header}-${index}`}>{header || "Untitled"}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {result.headers.map((_, columnIndex) => (
                    <TableCell key={columnIndex}>
                      {row[columnIndex] || "—"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {result.totalRows > MAX_PREVIEW_ROWS && (
          <p className="px-4 pb-3 text-xs text-muted-foreground">
            Previewing the first {MAX_PREVIEW_ROWS} rows.
          </p>
        )}
          </div>
        </details>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed p-6 text-center">
      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="mt-3 text-sm font-medium">Choose a Meta Ads CSV export</p>
      <p className="mt-1 text-xs text-muted-foreground">
        The file stays in this browser and is not sent anywhere.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        className="mt-4"
        onClick={() => inputRef.current?.click()}
      >
        <FileSpreadsheet />
        Select CSV
      </Button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
