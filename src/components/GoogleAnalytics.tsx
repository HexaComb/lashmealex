"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { useConsent } from "@/context/ConsentContext";
import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  ANALYTICS_CONSENT_STORAGE_KEY_LEGACY,
} from "@/lib/brand-keys";
import {
  applyConsentDefaults,
  configureGaAfterLoad,
  getGaMeasurementId,
  getGaScriptSrc,
  grantGaConsent,
  isGaConfigured,
  revokeGaConsent,
  sendGaPageView,
  shouldLoadGaScript,
} from "@/lib/ga";
import { readAndMigrateStorage } from "@/lib/migrate-local-storage";

function storageConsentGranted(): boolean {
  if (typeof window === "undefined") return false;
  return (
    readAndMigrateStorage(
      window.localStorage,
      ANALYTICS_CONSENT_STORAGE_KEY,
      ANALYTICS_CONSENT_STORAGE_KEY_LEGACY,
    ) === "granted"
  );
}

function subscribeConsentStorage(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

export default function GoogleAnalytics() {
  const { status } = useConsent();
  const pathname = usePathname();
  const lastSentPathRef = useRef<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const storageGranted = useSyncExternalStore(
    subscribeConsentStorage,
    storageConsentGranted,
    () => false,
  );

  const consentGranted =
    status === "declined" ? false : status === "accepted" || storageGranted;
  const loadScript = shouldLoadGaScript(consentGranted);
  const readyToTrack = loadScript && scriptLoaded;

  useEffect(() => {
    if (!isGaConfigured()) return;
    applyConsentDefaults();
    if (consentGranted) {
      grantGaConsent();
      return;
    }
    if (status === "declined") {
      revokeGaConsent();
      lastSentPathRef.current = null;
    }
  }, [consentGranted, status]);

  useEffect(() => {
    if (!readyToTrack) return;
    if (lastSentPathRef.current === pathname) return;
    lastSentPathRef.current = pathname;
    sendGaPageView(pathname);
  }, [pathname, readyToTrack]);

  const measurementId = getGaMeasurementId();
  const scriptSrc = getGaScriptSrc(measurementId);
  if (!measurementId || !scriptSrc || !loadScript) return null;

  return (
    <Script
      id="ga-gtag"
      src={scriptSrc}
      strategy="afterInteractive"
      onLoad={() => {
        configureGaAfterLoad();
        setScriptLoaded(true);
      }}
    />
  );
}
