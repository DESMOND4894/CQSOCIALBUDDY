export type NormalizedAdResult = {
  adName: string;
  spend: number;
  purchases: number | null;
  conversionValue: number | null;
  costPerPurchase: number | null;
  roas: number | null;
};

export type AdsPerformanceAnalysis = {
  ads: NormalizedAdResult[];
  totals: {
    spend: number;
    purchases: number | null;
    conversionValue: number | null;
    costPerPurchase: number | null;
    roas: number | null;
  };
  bestByRoas: NormalizedAdResult | null;
  bestByCostPerPurchase: NormalizedAdResult | null;
  warnings: string[];
};

export type AdsAgentReport = {
  executiveSummary: string;
  findings: string[];
  recommendations: string[];
  draftCampaign: {
    name: string;
    objective: string;
    rationale: string;
    guardrails: string[];
  };
};

export function parseMetric(value: string | undefined): number | null {
  if (!value) return null;

  const normalized = value
    .trim()
    .replace(/[$,%]/g, "")
    .replace(/\s/g, "")
    .replace(/[−–—]/g, "-");

  if (!normalized || normalized === "-") return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function analyzeAds(ads: NormalizedAdResult[]): AdsPerformanceAnalysis {
  const validAds = ads.filter((ad) => ad.adName && Number.isFinite(ad.spend));
  const totalSpend = validAds.reduce((sum, ad) => sum + ad.spend, 0);
  const purchaseValues = validAds
    .map((ad) => ad.purchases)
    .filter((value): value is number => value !== null);
  const conversionValues = validAds
    .map((ad) => ad.conversionValue)
    .filter((value): value is number => value !== null);
  const totalPurchases =
    purchaseValues.length > 0
      ? purchaseValues.reduce((sum, value) => sum + value, 0)
      : null;
  const totalConversionValue =
    conversionValues.length > 0
      ? conversionValues.reduce((sum, value) => sum + value, 0)
      : null;

  const adsWithDerivedMetrics = validAds.map((ad) => ({
    ...ad,
    costPerPurchase:
      ad.costPerPurchase ??
      (ad.purchases !== null && ad.purchases > 0
        ? ad.spend / ad.purchases
        : null),
    roas:
      ad.roas ??
      (ad.conversionValue !== null && ad.spend > 0
        ? ad.conversionValue / ad.spend
        : null),
  }));

  const byRoas = adsWithDerivedMetrics
    .filter((ad) => ad.roas !== null)
    .sort((a, b) => (b.roas ?? 0) - (a.roas ?? 0));
  const byCost = adsWithDerivedMetrics
    .filter((ad) => ad.costPerPurchase !== null)
    .sort(
      (a, b) => (a.costPerPurchase ?? Infinity) - (b.costPerPurchase ?? Infinity)
    );
  const warnings: string[] = [];

  if (purchaseValues.length !== validAds.length) {
    warnings.push("Some ads are missing purchase results.");
  }
  if (conversionValues.length !== validAds.length) {
    warnings.push("Some ads are missing purchase conversion value.");
  }
  warnings.push(
    "Meta attribution is directional until reservation source and UTM tracking are reconciled."
  );

  return {
    ads: adsWithDerivedMetrics,
    totals: {
      spend: totalSpend,
      purchases: totalPurchases,
      conversionValue: totalConversionValue,
      costPerPurchase:
        totalPurchases !== null && totalPurchases > 0
          ? totalSpend / totalPurchases
          : null,
      roas:
        totalConversionValue !== null && totalSpend > 0
          ? totalConversionValue / totalSpend
          : null,
    },
    bestByRoas: byRoas[0] ?? null,
    bestByCostPerPurchase: byCost[0] ?? null,
    warnings,
  };
}
