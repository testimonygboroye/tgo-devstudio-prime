"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const url = new URL(window.location.href);
    const params = url.searchParams;

    const sendAnalytics = async () => {
      try {
        const isStandalonePwa =
          window.matchMedia?.(
            "(display-mode: standalone)"
          ).matches ||
          Boolean(
            (
              window.navigator as Navigator & {
                standalone?: boolean;
              }
            ).standalone
          );

        await fetch(
          "/api/analytics/track",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              path: pathname,
              url: window.location.href,

              metadata: {
                language:
                  navigator.language ||
                  undefined,

                languages:
                  Array.isArray(
                    navigator.languages
                  )
                    ? navigator.languages
                    : undefined,

                timezone:
                  Intl.DateTimeFormat()
                    .resolvedOptions()
                    .timeZone ||
                  undefined,

                screenWidth:
                  window.screen?.width,

                screenHeight:
                  window.screen?.height,

                viewportWidth:
                  window.innerWidth,

                viewportHeight:
                  window.innerHeight,

                isStandalonePwa,

                cookiesEnabled:
                  navigator.cookieEnabled,

                referrer:
                  document.referrer ||
                  undefined,

                utmSource:
                  params.get(
                    "utm_source"
                  ) || undefined,

                utmMedium:
                  params.get(
                    "utm_medium"
                  ) || undefined,

                utmCampaign:
                  params.get(
                    "utm_campaign"
                  ) || undefined,

                utmTerm:
                  params.get(
                    "utm_term"
                  ) || undefined,

                utmContent:
                  params.get(
                    "utm_content"
                  ) || undefined,
              },
            },
          }
        );
      } catch {
        // Analytics must never
        // disrupt the visitor experience.
      }
    };

    void sendAnalytics();
  }, [pathname]);

  return null;
}
