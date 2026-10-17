import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { blsLausAreas } from "../data/bls-laus-areas";

const BLS_SERIES_URL = "https://api.bls.gov/publicAPI";
const CACHE_MS = 6 * 60 * 60 * 1000;
const CATALOG_CACHE_MS = 24 * 60 * 60 * 1000;

const nationalSeries = {
  unemploymentRate: "LNS14000000",
  laborForceParticipation: "LNS11300000",
  employment: "LNS12000000",
  unemployed: "LNS13000000",
  unemploymentRateNotSeasonallyAdjusted: "LNU04000000",
  payrollEmployment: "CES0000000001",
  averageHourlyEarnings: "CES0500000003",
} as const;

type BLSPoint = {
  year: string;
  period: string;
  periodName: string;
  value: string;
  footnotes?: Array<{ code?: string; text?: string }>;
};
type BLSSeries = { seriesID: string; data?: BLSPoint[] };
type BLSResponse = {
  status?: string;
  message?: string[];
  Results?: { series?: BLSSeries[] } | Array<{ series?: BLSSeries[] }>;
};
type LocationType = "region" | "state" | "metro" | "city" | "county" | "all";
type Area = {
  areaCode: string;
  name: string;
  areaTypeCode: string;
  areaType: string;
  seriesByMeasure: Record<string, string>;
  seriesCandidatesByMeasure: Record<string, { S: string; U: string }>;
  seasonalityByMeasure: Record<string, "S" | "U">;
  seasonalAdjustment: "S" | "U";
};
export type InsightLocation = Pick<Area, "areaCode" | "name" | "areaTypeCode" | "areaType">;
type Metric = { value: number; year: string; period: string; periodName: string; footnotes: string[] } | null;
type TrendPoint = { key: string; label: string; value: number };
export type MarketInsightsDashboard = {
  location: string;
  locationType: string;
  refreshedAt: string;
  latestPeriod: string;
  apiKeyConfigured: boolean;
  localSeasonalAdjustment: "S" | "U" | null;
  national: {
    unemploymentRate: Metric;
    laborForceParticipation: Metric;
    employment: Metric;
    unemployed: Metric;
    payrollEmployment: Metric;
    averageHourlyEarnings: Metric;
  };
  local: {
    unemploymentRate: Metric;
    unemployed: Metric;
    employed: Metric;
    laborForce: Metric;
    employmentPopulationRatio: Metric;
    laborForceParticipation: Metric;
  } | null;
  trends: {
    unemployment: Array<{ key: string; label: string; national: number | null; selected: number | null }>;
    payrollEmployment: TrendPoint[];
    averageHourlyEarnings: TrendPoint[];
    localEmployment: TrendPoint[];
  };
};

const resultCache = new Map<string, { expiresAt: number; data: MarketInsightsDashboard }>();
let catalogCache: { expiresAt: number; areas: Area[] } | undefined;

const locationInput = z.object({
  query: z.string().trim().min(2).max(80),
  type: z.enum(["region", "state", "metro", "city", "county", "all"]).default("all"),
});
const dashboardInput = z.object({
  areaCode: z.string().trim().max(24).regex(/^$|^[A-Z0-9]+$/).default(""),
});

const typeLabels: Record<string, string> = {
  M: "Census region",
  N: "Census division",
  A: "State",
  B: "Metropolitan area",
  C: "Metropolitan division",
  D: "Micropolitan area",
  E: "Combined statistical area",
  F: "County",
  G: "City",
  H: "Part of city",
  I: "Small labor market area",
  J: "New England city or town area",
  K: "New England city or town division",
};

function supportedAreaType(type: LocationType, code: string) {
  if (type === "all") return ["M", "N", "A", "B", "C", "F", "G"].includes(code);
  if (type === "region") return code === "M" || code === "N";
  if (type === "state") return code === "A";
  if (type === "metro") return code === "B" || code === "C";
  if (type === "city") return code === "G";
  return code === "F";
}

function getAreaCatalog(): Area[] {
  if (catalogCache) return catalogCache.areas;

  // Bundle the public LAUS area catalog with the app. Runtime requests to
  // download.bls.gov can return HTTP 403 from hosted environments, which made
  // location search fail before any statistics could be requested.
  const areas: Area[] = blsLausAreas.areas
    .filter((entry) => entry.selectable && typeLabels[entry.areaTypeCode])
    .map((entry) => {
      const seriesCandidatesByMeasure: Area["seriesCandidatesByMeasure"] = {};
      const seriesByMeasure: Record<string, string> = {};
      const seasonalityByMeasure: Record<string, "S" | "U"> = {};
      for (const measure of ["03", "04", "05", "06", "07", "08"]) {
        seriesCandidatesByMeasure[measure] = {
          S: `LAS${entry.areaCode}${measure}`,
          U: `LAU${entry.areaCode}${measure}`,
        };
        seriesByMeasure[measure] = seriesCandidatesByMeasure[measure]!.S;
        seasonalityByMeasure[measure] = "S";
      }
      return {
        areaCode: entry.areaCode,
        name: entry.name,
        areaTypeCode: entry.areaTypeCode,
        areaType: typeLabels[entry.areaTypeCode]!,
        seriesByMeasure,
        seriesCandidatesByMeasure,
        seasonalityByMeasure,
        seasonalAdjustment: "S" as const,
      };
    });

  catalogCache = { expiresAt: Number.POSITIVE_INFINITY, areas };
  return areas;
}

function toSeriesMap(payload: BLSResponse): Map<string, BLSPoint[]> {
  const result = payload.Results;
  const series = Array.isArray(result) ? result.flatMap((item) => item.series ?? []) : result?.series ?? [];
  const output = new Map<string, BLSPoint[]>();
  for (const item of series) {
    const points = (item.data ?? [])
      .filter((point) => /^M(0[1-9]|1[0-2])$/.test(point.period) && Number.isFinite(Number(point.value)))
      .sort((a, b) => (a.year + a.period).localeCompare(b.year + b.period));
    output.set(item.seriesID, points);
  }
  return output;
}

function latestMetric(points: BLSPoint[] | undefined): Metric {
  if (!points?.length) return null;
  const point = points[points.length - 1]!;
  return {
    value: Number(point.value),
    year: point.year,
    period: point.period,
    periodName: point.periodName,
    footnotes: (point.footnotes ?? []).map((note) => note.text).filter(Boolean),
  };
}

function trend(points: BLSPoint[] | undefined, divisor = 1): TrendPoint[] {
  return (points ?? []).map((point) => ({
    key: point.year + "-" + point.period,
    label: point.periodName.slice(0, 3) + " '" + point.year.slice(-2),
    value: Number(point.value) / divisor,
  }));
}

async function fetchBLS(seriesIds: string[], startYear: number, endYear: number): Promise<Map<string, BLSPoint[]>> {
  const apiKey = process.env.BLS_API_KEY;
  const version = apiKey ? "v2" : "v1";
  const payload: Record<string, unknown> = {
    seriesid: [...new Set(seriesIds)],
    startyear: String(startYear),
    endyear: String(endYear),
  };
  if (apiKey) payload.registrationkey = apiKey;

  const response = await fetch(BLS_SERIES_URL + "/" + version + "/timeseries/data/", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": "WorkforcePrep/1.0 (labor market insights)" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(response.status === 429
    ? "The BLS data service is rate-limiting requests. Please try again later."
    : "The BLS data service is temporarily unavailable. Please try again.");
  const data = (await response.json()) as BLSResponse;
  if (data.status !== "REQUEST_SUCCEEDED") {
    const detail = data.message?.filter(Boolean).join(" ");
    if (!apiKey && /daily|limit|too many|registration/i.test(detail || "")) {
      throw new Error("The BLS public API limit has been reached. The site administrator can add a free BLS_API_KEY server-side secret to increase the daily allowance.");
    }
    throw new Error(detail || "The BLS data service did not return usable statistics.");
  }
  return toSeriesMap(data);
}

export const searchInsightLocations = createServerFn({ method: "GET" })
  .validator((input: unknown) => locationInput.parse(input))
  .handler(async ({ data }): Promise<InsightLocation[]> => {
    const areas = await getAreaCatalog();
    const query = data.query.toLocaleLowerCase("en-US");
    return areas
      .filter((area) => supportedAreaType(data.type, area.areaTypeCode) && area.name.toLocaleLowerCase("en-US").includes(query))
      .sort((a, b) => {
        const aStarts = a.name.toLocaleLowerCase("en-US").startsWith(query) ? 0 : 1;
        const bStarts = b.name.toLocaleLowerCase("en-US").startsWith(query) ? 0 : 1;
        return aStarts - bStarts || a.name.localeCompare(b.name);
      })
      .slice(0, 20)
      .map(({ areaCode, name, areaTypeCode, areaType }) => ({ areaCode, name, areaTypeCode, areaType }));
  });

export const getMarketInsights = createServerFn({ method: "GET" })
  .validator((input: unknown) => dashboardInput.parse(input))
  .handler(async ({ data }): Promise<MarketInsightsDashboard> => {
    const cacheKey = data.areaCode || "US";
    const cached = resultCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const currentYear = new Date().getUTCFullYear();
    const startYear = currentYear - 5;
    const nationalIds = Object.values(nationalSeries);
    let selectedArea: Area | undefined;
    if (data.areaCode) {
      const areas = await getAreaCatalog();
      selectedArea = areas.find((area) => area.areaCode === data.areaCode);
      if (!selectedArea) throw new Error("That location is no longer available in the BLS directory. Search for it again.");
    }

    const localMeasures = selectedArea ? ["03", "04", "05", "06", "07", "08"] : [];
    const localIds = selectedArea
      ? localMeasures.flatMap((measure) => {
          const candidates = selectedArea!.seriesCandidatesByMeasure[measure];
          return candidates ? [candidates.S, candidates.U] : [];
        })
      : [];
    const seriesMap = await fetchBLS([...nationalIds, ...localIds], startYear, currentYear);
    if (selectedArea) {
      for (const measure of localMeasures) {
        const candidates = selectedArea.seriesCandidatesByMeasure[measure];
        if (!candidates) continue;
        const seasonalPoints = seriesMap.get(candidates.S);
        const unadjustedPoints = seriesMap.get(candidates.U);
        const chosen = seasonalPoints?.length ? "S" : unadjustedPoints?.length ? "U" : null;
        if (chosen) {
          selectedArea.seriesByMeasure[measure] = candidates[chosen];
          selectedArea.seasonalityByMeasure[measure] = chosen;
          if (measure === "03") selectedArea.seasonalAdjustment = chosen;
        } else {
          delete selectedArea.seriesByMeasure[measure];
        }
      }
    }
    const national = {
      unemploymentRate: latestMetric(seriesMap.get(nationalSeries.unemploymentRate)),
      laborForceParticipation: latestMetric(seriesMap.get(nationalSeries.laborForceParticipation)),
      employment: latestMetric(seriesMap.get(nationalSeries.employment)),
      unemployed: latestMetric(seriesMap.get(nationalSeries.unemployed)),
      payrollEmployment: latestMetric(seriesMap.get(nationalSeries.payrollEmployment)),
      averageHourlyEarnings: latestMetric(seriesMap.get(nationalSeries.averageHourlyEarnings)),
    };
    const local = selectedArea ? {
      unemploymentRate: latestMetric(selectedArea.seriesByMeasure["03"] ? seriesMap.get(selectedArea.seriesByMeasure["03"]) : undefined),
      unemployed: latestMetric(selectedArea.seriesByMeasure["04"] ? seriesMap.get(selectedArea.seriesByMeasure["04"]) : undefined),
      employed: latestMetric(selectedArea.seriesByMeasure["05"] ? seriesMap.get(selectedArea.seriesByMeasure["05"]) : undefined),
      laborForce: latestMetric(selectedArea.seriesByMeasure["06"] ? seriesMap.get(selectedArea.seriesByMeasure["06"]) : undefined),
      employmentPopulationRatio: latestMetric(selectedArea.seriesByMeasure["07"] ? seriesMap.get(selectedArea.seriesByMeasure["07"]) : undefined),
      laborForceParticipation: latestMetric(selectedArea.seriesByMeasure["08"] ? seriesMap.get(selectedArea.seriesByMeasure["08"]) : undefined),
    } : null;

    const nationalTrendSeries = selectedArea?.seasonalAdjustment === "U" ? nationalSeries.unemploymentRateNotSeasonallyAdjusted : nationalSeries.unemploymentRate;
    const nationalUnemployment = trend(seriesMap.get(nationalTrendSeries));
    const localUnemployment = selectedArea ? trend(selectedArea.seriesByMeasure["03"] ? seriesMap.get(selectedArea.seriesByMeasure["03"]) : undefined) : [];
    const unemploymentMap = new Map(nationalUnemployment.map((point) => [point.key, point]));
    const localUnemploymentMap = new Map(localUnemployment.map((point) => [point.key, point]));
    const unemploymentKeys = [...new Set([...unemploymentMap.keys(), ...localUnemploymentMap.keys()])].sort();
    const trends = {
      unemployment: unemploymentKeys.map((key) => ({
        key,
        label: unemploymentMap.get(key)?.label ?? localUnemploymentMap.get(key)?.label ?? key,
        national: unemploymentMap.get(key)?.value ?? null,
        selected: selectedArea ? localUnemploymentMap.get(key)?.value ?? null : unemploymentMap.get(key)?.value ?? null,
      })),
      payrollEmployment: trend(seriesMap.get(nationalSeries.payrollEmployment), 1000),
      averageHourlyEarnings: trend(seriesMap.get(nationalSeries.averageHourlyEarnings)),
      localEmployment: selectedArea ? trend(selectedArea.seriesByMeasure["05"] ? seriesMap.get(selectedArea.seriesByMeasure["05"]) : undefined, 1_000_000) : trend(seriesMap.get(nationalSeries.employment), 1000),
    };
    const dashboard: MarketInsightsDashboard = {
      location: selectedArea?.name ?? "United States",
      locationType: selectedArea?.areaType ?? "National",
      refreshedAt: new Date().toISOString(),
      latestPeriod: national.unemploymentRate ? national.unemploymentRate.periodName + " " + national.unemploymentRate.year : "Latest available release",
      apiKeyConfigured: Boolean(process.env.BLS_API_KEY),
      localSeasonalAdjustment: selectedArea?.seasonalAdjustment ?? null,
      national,
      local,
      trends,
    };
    resultCache.set(cacheKey, { expiresAt: Date.now() + CACHE_MS, data: dashboard });
    return dashboard;
  });
