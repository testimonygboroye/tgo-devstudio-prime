import { NextResponse } from "next/server";
import { getServerLocale } from "./serverLocale";
import { createTranslator } from "./translationHelper";

export async function apiError(
  code: string,
  defaultMessage: string,
  status: number = 400,
  options?: Record<string, string | number>
): Promise<NextResponse> {
  const locale = await getServerLocale();
  const t = createTranslator(locale);
  const messageKey = `api.errors.${code}`;
  const translated = t(messageKey, options);
  const message = translated !== messageKey ? translated : defaultMessage;

  return NextResponse.json({ status: "error", code, message }, { status });
}

export async function apiSuccess(
  data: Record<string, any> = {},
  messageCode?: string,
  defaultMessage?: string,
  status: number = 200,
  options?: Record<string, string | number>
): Promise<NextResponse> {
  let message = defaultMessage;
  if (messageCode) {
    const locale = await getServerLocale();
    const t = createTranslator(locale);
    const messageKey = `api.success.${messageCode}`;
    const translated = t(messageKey, options);
    if (translated !== messageKey) {
      message = translated;
    }
  }
  return NextResponse.json(
    {
      status: "ok",
      ...(messageCode ? { code: messageCode } : {}),
      ...(message ? { message } : {}),
      ...data,
    },
    { status }
  );
}
