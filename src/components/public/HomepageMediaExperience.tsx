"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SmartImage from "@/components/public/SmartImage";

type Props = { settings: {
  enabled?: boolean; countdownEnabled?: boolean; countdownVisible?: boolean;
  launchDate?: string | Date | null; title?: string; description?: string; countdownLabel?: string; countdownStatusLabel?: string; countdownYearsLabel?:string; countdownMonthsLabel?:string; countdownDaysLabel?:string; countdownHoursLabel?:string; countdownMinutesLabel?:string; countdownSecondsLabel?:string;
  videoUrl?: string; flyerUrl?: string; afterLaunchVideoUrl?: string; afterLaunchFlyerUrl?: string;
  flyerSeconds?: number; flyerDurationMinutes?: number; flyerDurationSeconds?: number;
  videoAudioEnabled?: boolean; videoDurationHours?: number; videoDurationMinutes?: number;
  videoDurationSeconds?: number; useVideoDurationOverride?: boolean;
} };

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  const day = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return next;
}

function remainingTime(target: number, now: number) {
  let cursor = new Date(now);
  let years = 0;
  while (years < 100 && new Date(cursor.getFullYear() + 1, cursor.getMonth(), cursor.getDate(), cursor.getHours(), cursor.getMinutes(), cursor.getSeconds()).getTime() <= target) {
    cursor.setFullYear(cursor.getFullYear() + 1);
    years++;
  }
  let months = 0;
  while (months < 12 && addMonths(cursor, 1).getTime() <= target) {
    cursor = addMonths(cursor, 1);
    months++;
  }
  let total = Math.max(0, Math.floor((target - cursor.getTime()) / 1000));
  const days = Math.floor(total / 86400); total %= 86400;
  const hours = Math.floor(total / 3600); total %= 3600;
  const minutes = Math.floor(total / 60); total %= 60;
  return { years, months, days, hours, minutes, seconds: total };
}

export default function HomepageMediaExperience({ settings }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [mediaIndex, setMediaIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const target = useMemo(() => settings.launchDate ? new Date(settings.launchDate).getTime() : 0, [settings.launchDate]);
  const hasTarget = Boolean(target && Number.isFinite(target));
  const countdownEnabled = settings.countdownEnabled !== false;
  const afterTarget = countdownEnabled && hasTarget && now >= target;
  const video = afterTarget && settings.afterLaunchVideoUrl ? settings.afterLaunchVideoUrl : settings.videoUrl;
  const image = afterTarget && settings.afterLaunchFlyerUrl ? settings.afterLaunchFlyerUrl : settings.flyerUrl;
  const media = useMemo(() => [
    ...(video ? [{ kind: "video" as const, url: video }] : []),
    ...(image ? [{ kind: "image" as const, url: image }] : []),
  ], [video, image]);
  const current = media.length ? media[mediaIndex % media.length] : null;
  const overrideSeconds = (settings.videoDurationHours || 0) * 3600 + (settings.videoDurationMinutes || 0) * 60 + (settings.videoDurationSeconds || 0);
  const useOverride = Boolean(settings.useVideoDurationOverride && overrideSeconds > 0);
  const advance = useCallback(() => setMediaIndex(index => media.length ? (index + 1) % media.length : 0), [media.length]);

  useEffect(() => {
    if (!settings.enabled || !countdownEnabled || !hasTarget || afterTarget) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [settings.enabled, countdownEnabled, hasTarget, afterTarget]);

  useEffect(() => {
    if (!settings.videoAudioEnabled) return;
    const resume = () => { const element = videoRef.current; if (element?.paused) void element.play().catch(() => undefined); };
    window.addEventListener("pointerdown", resume, { once: true });
    window.addEventListener("keydown", resume, { once: true });
    return () => { window.removeEventListener("pointerdown", resume); window.removeEventListener("keydown", resume); };
  }, [settings.videoAudioEnabled, current?.url]);

  useEffect(() => {
    if (!current || current.kind === "video" && !useOverride) return;
    const seconds = current.kind === "video"
      ? overrideSeconds
      : (settings.flyerDurationMinutes || 0) * 60 + (settings.flyerDurationSeconds ?? settings.flyerSeconds ?? 8);
    if (seconds <= 0) return;
    const timer = window.setTimeout(advance, seconds * 1000);
    return () => window.clearTimeout(timer);
  }, [current, useOverride, overrideSeconds, settings.flyerSeconds, settings.flyerDurationMinutes, settings.flyerDurationSeconds, advance]);

  if (!settings.enabled) return null;
  const countdown = countdownEnabled && hasTarget && !afterTarget ? remainingTime(target, now) : null;
  const units = countdown ? [
    [(settings.countdownYearsLabel||"YEARS"), countdown.years], [(settings.countdownMonthsLabel||"MONTHS"), countdown.months], [(settings.countdownDaysLabel||"DAYS"), countdown.days],
    [(settings.countdownHoursLabel||"HOURS"), countdown.hours], [(settings.countdownMinutesLabel||"MINUTES"), countdown.minutes], [(settings.countdownSecondsLabel||"SECONDS"), countdown.seconds],
  ] as const : [];

  return (
    <section className="homepage-launch relative overflow-hidden border-y border-white/10 px-4 py-12 sm:px-8 sm:py-16" aria-label="Featured announcement">
      <div className="homepage-launch-glow" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl">
        {(settings.title || settings.description) && (
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow-label">A TGO moment</span>
            {settings.title && <h2 className="heading-premium mt-4 text-3xl font-bold brand-gradient-text sm:text-5xl">{settings.title}</h2>}
            {settings.description && <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-neutral-300 sm:text-base">{settings.description}</p>}
          </div>
        )}
        {current && (
          <div className="homepage-media-frame mx-auto mt-9">
            <div className="homepage-media-topline"><span>FEATURED MEDIA</span><span><i /> TGO DEVSTUDIO</span></div>
            {current.kind === "video" ? (
              <video ref={videoRef} key={current.url} src={current.url} autoPlay muted={!settings.videoAudioEnabled} playsInline preload="auto" controls={false} disablePictureInPicture controlsList="nodownload noplaybackrate noremoteplayback" loop={false} onContextMenu={event => event.preventDefault()} onEnded={advance} className="homepage-media-content homepage-media-video" />
            ) : (
              <div className="homepage-media-image-wrap"><SmartImage priority src={current.url} alt={settings.title || "TGO DevStudio featured media"} label={settings.title || "TGO DevStudio"} className="homepage-media-content homepage-media-image" /></div>
            )}
            {media.length > 1 && <div className="homepage-media-pagination" aria-label={`Media ${mediaIndex + 1} of ${media.length}`}>{media.map((item, index) => <button key={item.url} type="button" aria-label={`Show media ${index + 1}`} aria-current={index === mediaIndex ? "true" : undefined} onClick={() => setMediaIndex(index)} />)}</div>}
          </div>
        )}
        {countdown && settings.countdownVisible !== false && (
          <div className="homepage-countdown mx-auto mt-8 max-w-5xl">
            <div className="homepage-countdown-heading"><span>{settings.countdownLabel || "COUNTDOWN"}</span><span>{settings.countdownStatusLabel || "LIVE TIMER"}</span></div>
            <div className="homepage-countdown-grid">{units.map(([label, value]) => (
              <div key={label} className="homepage-countdown-unit"><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span></div>
            ))}</div>
          </div>
        )}
      </div>
    </section>
  );
}
