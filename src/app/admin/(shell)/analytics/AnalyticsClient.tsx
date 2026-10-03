"use client";

import { useEffect, useMemo, useState } from "react";

interface ViewEntry {
  _id: string;
  path: string;
  visitorId: string;
  userAgent: string;
  referrer?: string;
  host?: string;
  deploymentProvider?: string;
  language?: string;
  deviceType?: string;
  browser?: string;
  operatingSystem?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  createdAt: string;
}

interface VisitorEntry {
  _id: string;
  visitorId: string;
  displayName?: string;
  email?: string;
  gender?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  postalCode?: string;
  timezone?: string;
  deviceType?: string;
  deviceModel?: string;
  browser?: string;
  browserVersion?: string;
  operatingSystem?: string;
  operatingSystemVersion?: string;
  language?: string;
  languages?: string[];
  firstReferrer?: string;
  latestReferrer?: string;
  firstPath?: string;
  latestPath?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  deploymentHost?: string;
  deploymentProvider?: string;
  firstSeen: string;
  lastSeen: string;
  totalPageViews: number;
  totalSessions: number;
  activeDays: number;
  status: string;
  hosts: string[];
  rank: number;
}

interface AnalyticsResponse {
  status: string;
  views: ViewEntry[];
  visitors: VisitorEntry[];
  totalCount: number;
  uniqueVisitorCount: number;
  averageDailyVisitors: number;
  peakDailyVisitors: number;
  peakDay: string | null;
  deploymentHosts: string[];
  deploymentProviders: string[];
  countries: string[];
  regions: string[];
  cities: string[];
  deviceTypes: string[];
  browsers: string[];
  operatingSystems: string[];
}

const statusLabels: Record<string, string> = {
  new: "New",
  returning: "Returning",
  active: "Active",
  "highly-active": "Highly active",
  constant: "Constant",
  dormant: "Dormant",
};

function formatDate(value?: string) {
  if (!value) return "—";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function shortDate(value?: string) {
  if (!value) return "—";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value));
}

function optionLabel(value: string) {
  return value;
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-500">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        disabled={disabled}
        className="w-full rounded-lg border border-base-800 bg-base-900 px-3 py-2.5 text-sm text-neutral-200 outline-none transition focus:border-violet-500 disabled:opacity-50"
      >
        <option value="">All</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span className="inline-flex rounded-full border border-base-700 bg-base-800 px-2 py-1 text-[11px] font-medium text-neutral-300">
      {statusLabels[status] || status}
    </span>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-base-800 bg-base-900 p-5">
      <p className="text-2xl font-bold text-neutral-100">
        {value}
      </p>

      <p className="mt-1 text-xs font-medium uppercase tracking-wider text-neutral-500">
        {label}
      </p>

      {detail && (
        <p className="mt-2 text-xs text-neutral-600">
          {detail}
        </p>
      )}
    </div>
  );
}

export default function AnalyticsClient() {
  const [data, setData] =
    useState<AnalyticsResponse | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [host, setHost] =
    useState("");

  const [provider, setProvider] =
    useState("");

  const [countryCode, setCountryCode] =
    useState("");

  const [region, setRegion] =
    useState("");

  const [city, setCity] =
    useState("");

  const [deviceType, setDeviceType] =
    useState("");

  const [browser, setBrowser] =
    useState("");

  const [operatingSystem, setOperatingSystem] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [sort, setSort] =
    useState("recent");

  const [search, setSearch] =
    useState("");

  const [from, setFrom] =
    useState("");

  const [to, setTo] =
    useState("");

  const [selectedVisitor, setSelectedVisitor] =
    useState<VisitorEntry | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    params.set("limit", "100");

    if (host) params.set("host", host);
    if (provider) params.set("provider", provider);
    if (countryCode) {
      params.set("countryCode", countryCode);
    }
    if (region) params.set("region", region);
    if (city) params.set("city", city);
    if (deviceType) {
      params.set("deviceType", deviceType);
    }
    if (browser) params.set("browser", browser);
    if (operatingSystem) {
      params.set(
        "operatingSystem",
        operatingSystem
      );
    }
    if (status) params.set("status", status);
    if (sort) params.set("sort", sort);
    if (search) params.set("search", search);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    return params.toString();
  }, [
    host,
    provider,
    countryCode,
    region,
    city,
    deviceType,
    browser,
    operatingSystem,
    status,
    sort,
    search,
    from,
    to,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/analytics/page-views?${queryString}`,
          {
            cache: "no-store",
          }
        );

        const json =
          (await response.json()) as AnalyticsResponse & {
            message?: string;
          };

        if (!response.ok || json.status !== "ok") {
          throw new Error(
            json.message ||
              "Failed to load analytics."
          );
        }

        if (!cancelled) {
          setData(json);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load analytics."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [queryString]);

  function resetFilters() {
    setHost("");
    setProvider("");
    setCountryCode("");
    setRegion("");
    setCity("");
    setDeviceType("");
    setBrowser("");
    setOperatingSystem("");
    setStatus("");
    setSort("recent");
    setSearch("");
    setFrom("");
    setTo("");
  }

  const activeFilterCount = [
    host,
    provider,
    countryCode,
    region,
    city,
    deviceType,
    browser,
    operatingSystem,
    status,
    search,
    from,
    to,
  ].filter(Boolean).length;

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total page views"
          value={data?.totalCount ?? 0}
          detail="Across the selected filters"
        />

        <StatCard
          label="Unique visitors"
          value={data?.uniqueVisitorCount ?? 0}
          detail="Distinct visitor IDs"
        />

        <StatCard
          label="Average daily visitors"
          value={
            data?.averageDailyVisitors ?? 0
          }
          detail="Average unique visitors per active day"
        />

        <StatCard
          label="Peak daily visitors"
          value={
            data?.peakDailyVisitors ?? 0
          }
          detail={
            data?.peakDay
              ? `Peak: ${shortDate(data.peakDay)}`
              : "No peak recorded yet"
          }
        />
      </section>

      <section className="rounded-xl border border-base-800 bg-base-900 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-300">
              Visitor filters
            </h2>

            <p className="mt-1 text-xs text-neutral-500">
              Filter by deployment, exact hostname,
              location, device, activity, date and more.
            </p>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-base-700 px-3 py-2 text-xs font-medium text-neutral-300 transition hover:border-violet-500 hover:text-white"
          >
            Reset filters
            {activeFilterCount > 0
              ? ` (${activeFilterCount})`
              : ""}
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <FilterSelect
            label="Deployment platform"
            value={provider}
            onChange={setProvider}
            options={
              data?.deploymentProviders || []
            }
          />

          <FilterSelect
            label="Exact site / domain"
            value={host}
            onChange={setHost}
            options={
              data?.deploymentHosts || []
            }
          />

          <FilterSelect
            label="Visitor status"
            value={status}
            onChange={setStatus}
            options={[
              "new",
              "returning",
              "active",
              "highly-active",
              "constant",
              "dormant",
            ]}
          />

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-500">
              Ranking
            </span>

            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value)
              }
              className="w-full rounded-lg border border-base-800 bg-base-900 px-3 py-2.5 text-sm text-neutral-200 outline-none focus:border-violet-500"
            >
              <option value="recent">
                Most recent
              </option>
              <option value="top-visited">
                Top visited
              </option>
              <option value="top-active">
                Top active
              </option>
              <option value="top-constant">
                Top constant
              </option>
              <option value="newest">
                Newly acquired
              </option>
              <option value="oldest">
                Oldest visitors
              </option>
            </select>
          </label>

          <FilterSelect
            label="Country"
            value={countryCode}
            onChange={setCountryCode}
            options={data?.countries || []}
          />

          <FilterSelect
            label="Region / state"
            value={region}
            onChange={setRegion}
            options={data?.regions || []}
          />

          <FilterSelect
            label="City"
            value={city}
            onChange={setCity}
            options={data?.cities || []}
          />

          <FilterSelect
            label="Device"
            value={deviceType}
            onChange={setDeviceType}
            options={data?.deviceTypes || []}
          />

          <FilterSelect
            label="Browser"
            value={browser}
            onChange={setBrowser}
            options={data?.browsers || []}
          />

          <FilterSelect
            label="Operating system"
            value={operatingSystem}
            onChange={setOperatingSystem}
            options={
              data?.operatingSystems || []
            }
          />

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-500">
              From
            </span>

            <input
              type="date"
              value={from}
              onChange={(event) =>
                setFrom(event.target.value)
              }
              className="w-full rounded-lg border border-base-800 bg-base-900 px-3 py-2.5 text-sm text-neutral-200 outline-none focus:border-violet-500"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-500">
              To
            </span>

            <input
              type="date"
              value={to}
              onChange={(event) =>
                setTo(event.target.value)
              }
              className="w-full rounded-lg border border-base-800 bg-base-900 px-3 py-2.5 text-sm text-neutral-200 outline-none focus:border-violet-500"
            />
          </label>

          <label className="block sm:col-span-2 lg:col-span-3 xl:col-span-4">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-500">
              Search visitor
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Name, email or visitor ID..."
              className="w-full rounded-lg border border-base-800 bg-base-900 px-3 py-2.5 text-sm text-neutral-200 outline-none placeholder:text-neutral-700 focus:border-violet-500"
            />
          </label>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="rounded-xl border border-base-800 bg-base-900 p-6 text-sm text-neutral-400">
          Loading visitor analytics...
        </div>
      )}

      {!isLoading && data && (
        <>
          <section className="rounded-xl border border-base-800 bg-base-900">
            <div className="flex items-center justify-between border-b border-base-800 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-300">
                  Visitors
                </h2>
                <p className="mt-1 text-xs text-neutral-600">
                  Default order is most recently seen.
                  Change Ranking to see the highest-visited,
                  most-active or most-constant visitors.
                </p>
              </div>

              <span className="text-xs text-neutral-600">
                {data.visitors.length} shown
              </span>
            </div>

            {data.visitors.length === 0 ? (
              <div className="p-6 text-sm text-neutral-500">
                No visitors match the current filters.
              </div>
            ) : (
              <div className="divide-y divide-base-800">
                {data.visitors.map((visitor) => (
                  <button
                    key={visitor.visitorId}
                    type="button"
                    onClick={() =>
                      setSelectedVisitor(visitor)
                    }
                    className="block w-full px-5 py-4 text-left transition hover:bg-base-800/40"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-violet-300">
                            #{visitor.rank}
                          </span>

                          <span className="font-medium text-neutral-100">
                            {visitor.displayName ||
                              "Anonymous visitor"}
                          </span>

                          <StatusBadge
                            status={visitor.status}
                          />
                        </div>

                        <p className="mt-1 truncate text-xs text-neutral-600">
                          {visitor.email ||
                            visitor.visitorId}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs sm:grid-cols-4">
                        <span className="text-neutral-500">
                          Views{" "}
                          <strong className="text-neutral-300">
                            {visitor.totalPageViews}
                          </strong>
                        </span>

                        <span className="text-neutral-500">
                          Sessions{" "}
                          <strong className="text-neutral-300">
                            {visitor.totalSessions}
                          </strong>
                        </span>

                        <span className="text-neutral-500">
                          Active days{" "}
                          <strong className="text-neutral-300">
                            {visitor.activeDays}
                          </strong>
                        </span>

                        <span className="text-neutral-500">
                          Last seen{" "}
                          <strong className="text-neutral-300">
                            {shortDate(
                              visitor.lastSeen
                            )}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
                      <span>
                        {visitor.country ||
                          "Unknown country"}
                        {visitor.region
                          ? ` · ${visitor.region}`
                          : ""}
                        {visitor.city
                          ? ` · ${visitor.city}`
                          : ""}
                      </span>

                      <span>
                        {visitor.deviceType ||
                          "Unknown device"}
                        {visitor.browser
                          ? ` · ${visitor.browser}`
                          : ""}
                        {visitor.operatingSystem
                          ? ` · ${visitor.operatingSystem}`
                          : ""}
                      </span>

                      <span>
                        {visitor.deploymentProvider ||
                          "Unknown platform"}
                        {visitor.deploymentHost
                          ? ` · ${visitor.deploymentHost}`
                          : ""}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-base-800 bg-base-900">
            <div className="border-b border-base-800 px-5 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-300">
                Recent page activity
              </h2>
            </div>

            <div className="divide-y divide-base-800">
              {data.views.length === 0 ? (
                <p className="p-5 text-sm text-neutral-500">
                  No page views recorded yet.
                </p>
              ) : (
                data.views.map((view) => (
                  <div
                    key={view._id}
                    className="px-5 py-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-mono text-sm text-neutral-200">
                        {view.path}
                      </span>

                      <span className="text-xs text-neutral-600">
                        {formatDate(
                          view.createdAt
                        )}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
                      <span>
                        {view.deploymentProvider ||
                          "Unknown platform"}
                      </span>

                      <span>
                        {view.host ||
                          "Unknown host"}
                      </span>

                      <span>
                        {view.deviceType ||
                          "Unknown device"}
                      </span>

                      <span>
                        {view.country ||
                          view.countryCode ||
                          "Unknown location"}
                        {view.city
                          ? ` · ${view.city}`
                          : ""}
                      </span>

                      <span>
                        Visitor{" "}
                        {view.visitorId.slice(
                          0,
                          8
                        )}
                      </span>
                    </div>

                    {view.referrer && (
                      <p className="mt-2 truncate text-xs text-neutral-700">
                        Referrer: {view.referrer}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}

      {selectedVisitor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() =>
            setSelectedVisitor(null)
          }
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-base-700 bg-base-900 shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="sticky top-0 flex items-start justify-between border-b border-base-800 bg-base-900 px-6 py-5">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-violet-300">
                  Visitor #{selectedVisitor.rank}
                </p>

                <h2 className="mt-1 text-2xl font-bold text-neutral-100">
                  {selectedVisitor.displayName ||
                    "Anonymous visitor"}
                </h2>

                <p className="mt-1 text-xs text-neutral-600">
                  {selectedVisitor.visitorId}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedVisitor(null)
                }
                className="rounded-lg border border-base-700 px-3 py-2 text-sm text-neutral-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  Identity
                </h3>

                <div className="mt-3 space-y-2 text-sm">
                  <p>
                    <span className="text-neutral-600">
                      Name:
                    </span>{" "}
                    {selectedVisitor.displayName ||
                      "Not provided"}
                  </p>

                  <p>
                    <span className="text-neutral-600">
                      Email:
                    </span>{" "}
                    {selectedVisitor.email ||
                      "Not provided"}
                  </p>

                  <p>
                    <span className="text-neutral-600">
                      Gender:
                    </span>{" "}
                    {selectedVisitor.gender ||
                      "Not provided"}
                  </p>

                  <p>
                    <span className="text-neutral-600">
                      Language:
                    </span>{" "}
                    {selectedVisitor.language ||
                      "Unknown"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  Location
                </h3>

                <div className="mt-3 space-y-2 text-sm">
                  <p>
                    <span className="text-neutral-600">
                      Country:
                    </span>{" "}
                    {selectedVisitor.country ||
                      selectedVisitor.countryCode ||
                      "Unknown"}
                  </p>

                  <p>
                    <span className="text-neutral-600">
                      Region:
                    </span>{" "}
                    {selectedVisitor.region ||
                      "Unknown"}
                  </p>

                  <p>
                    <span className="text-neutral-600">
                      City:
                    </span>{" "}
                    {selectedVisitor.city ||
                      "Unknown"}
                  </p>

                  <p>
                    <span className="text-neutral-600">
                      Timezone:
                    </span>{" "}
                    {selectedVisitor.timezone ||
                      "Unknown"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  Deployment
                </h3>

                <div className="mt-3 space-y-2 text-sm">
                  <p>
                    <span className="text-neutral-600">
                      Platform:
                    </span>{" "}
                    {selectedVisitor.deploymentProvider ||
                      "Unknown"}
                  </p>

                  <p>
                    <span className="text-neutral-600">
                      Site / host:
                    </span>{" "}
                    {selectedVisitor.deploymentHost ||
                      "Unknown"}
                  </p>

                  <div>
                    <span className="text-neutral-600">
                      Sites visited:
                    </span>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedVisitor.hosts.length
                        ? selectedVisitor.hosts.map(
                            (visitorHost) => (
                              <span
                                key={visitorHost}
                                className="rounded-full border border-base-700 px-2 py-1 text-xs text-neutral-300"
                              >
                                {visitorHost}
                              </span>
                            )
                          )
                        : (
                          <span className="text-xs text-neutral-600">
                            Unknown
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  Device
                </h3>

                <div className="mt-3 space-y-2 text-sm">
                  <p>
                    <span className="text-neutral-600">
                      Type:
                    </span>{" "}
                    {selectedVisitor.deviceType ||
                      "Unknown"}
                  </p>

                  <p>
                    <span className="text-neutral-600">
                      Model:
                    </span>{" "}
                    {selectedVisitor.deviceModel ||
                      "Unknown"}
                  </p>

                  <p>
                    <span className="text-neutral-600">
                      Browser:
                    </span>{" "}
                    {selectedVisitor.browser ||
                      "Unknown"}
                    {selectedVisitor.browserVersion
                      ? ` ${selectedVisitor.browserVersion}`
                      : ""}
                  </p>

                  <p>
                    <span className="text-neutral-600">
                      OS:
                    </span>{" "}
                    {selectedVisitor.operatingSystem ||
                      "Unknown"}
                    {selectedVisitor.operatingSystemVersion
                      ? ` ${selectedVisitor.operatingSystemVersion}`
                      : ""}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  Activity
                </h3>

                <div className="mt-3 grid grid-cols-3 gap-3">
                  <StatCard
                    label="Views"
                    value={
                      selectedVisitor.totalPageViews
                    }
                  />

                  <StatCard
                    label="Sessions"
                    value={
                      selectedVisitor.totalSessions
                    }
                  />

                  <StatCard
                    label="Active days"
                    value={
                      selectedVisitor.activeDays
                    }
                  />
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <p>
                    <span className="text-neutral-600">
                      Status:
                    </span>{" "}
                    <StatusBadge
                      status={
                        selectedVisitor.status
                      }
                    />
                  </p>

                  <p>
                    <span className="text-neutral-600">
                      First seen:
                    </span>{" "}
                    {formatDate(
                      selectedVisitor.firstSeen
                    )}
                  </p>

                  <p>
                    <span className="text-neutral-600">
                      Last seen:
                    </span>{" "}
                    {formatDate(
                      selectedVisitor.lastSeen
                    )}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  Journey
                </h3>

                <div className="mt-3 space-y-2 text-sm">
                  <p>
                    <span className="text-neutral-600">
                      First page:
                    </span>{" "}
                    {selectedVisitor.firstPath ||
                      "Unknown"}
                  </p>

                  <p>
                    <span className="text-neutral-600">
                      Latest page:
                    </span>{" "}
                    {selectedVisitor.latestPath ||
                      "Unknown"}
                  </p>

                  <p>
                    <span className="text-neutral-600">
                      First referrer:
                    </span>{" "}
                    {selectedVisitor.firstReferrer ||
                      "Direct / unknown"}
                  </p>

                  <p>
                    <span className="text-neutral-600">
                      Latest referrer:
                    </span>{" "}
                    {selectedVisitor.latestReferrer ||
                      "Direct / unknown"}
                  </p>
                </div>
              </div>

              <div className="sm:col-span-2">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  Campaign attribution
                </h3>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {[
                    ["Source", selectedVisitor.utmSource],
                    ["Medium", selectedVisitor.utmMedium],
                    ["Campaign", selectedVisitor.utmCampaign],
                    ["Term", selectedVisitor.utmTerm],
                    ["Content", selectedVisitor.utmContent],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-base-800 p-3"
                    >
                      <p className="text-[10px] uppercase tracking-widest text-neutral-600">
                        {label}
                      </p>
                      <p className="mt-1 break-words text-sm text-neutral-300">
                        {value || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
