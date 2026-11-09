import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { authorizePlatformPermission } from "@/lib/platform/authorize";
import { getPlatformRequestId, platformFailure, platformSuccess } from "@/lib/platform/response";
import { getPlatformRuntimeConfig } from "@/lib/platform/config";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestId = getPlatformRequestId(request);

  try {
    const access = await authorizePlatformPermission("platform.access");

    if (!access.session) {
      return platformFailure("UNAUTHENTICATED", "Sign in to access platform diagnostics.", {
        status: 401,
        requestId,
      });
    }

    if (!access.allowed) {
      return platformFailure("FORBIDDEN", "You do not have access to platform diagnostics.", {
        status: 403,
        requestId,
      });
    }

    const databaseConnected = mongoose.connection.readyState === 1;
    const config = getPlatformRuntimeConfig();

    const response = platformSuccess(
      {
        status: databaseConnected ? "operational" : "degraded",
        database: databaseConnected ? "connected" : "disconnected",
        platformEnabled: config.enabled,
        environment: config.environment,
        checkedAt: new Date().toISOString(),
      },
      { status: databaseConnected ? 200 : 503, requestId }
    );

    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch {
    return platformFailure(
      "HEALTH_CHECK_FAILED",
      "Platform health could not be verified. Review server diagnostics.",
      { status: 503, requestId }
    );
  }
}
