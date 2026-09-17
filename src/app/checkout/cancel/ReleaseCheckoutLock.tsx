"use client";

import { useEffect } from "react";

import { releaseCheckoutLockAction } from "@/app/cart/actions";

export function ReleaseCheckoutLock() {
  useEffect(() => {
    void releaseCheckoutLockAction();
  }, []);
  return null;
}
