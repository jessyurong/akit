"use client";

import React, { useEffect, useRef, useState } from "react";

export default function ServiceWorkerRegister() {
  const [updateReady, setUpdateReady] = useState(false);
  const regRef = useRef<ServiceWorkerRegistration | null>(null);
  const refreshing = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let mounted = true;
    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        if (!mounted) return;
        regRef.current = reg;
        if (reg.waiting) setUpdateReady(true);
        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateReady(true);
            }
          });
        });
      } catch {
        /* offline-first is a bonus, not a requirement */
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing.current) window.location.reload();
    });

    void register();
    return () => {
      mounted = false;
    };
  }, []);

  if (!updateReady) return null;

  return (
    <div className="updateBar" role="status">
      <span>🔄 A new version is ready.</span>
      <button
        onClick={() => {
          refreshing.current = true;
          const reg = regRef.current;
          if (reg?.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
          else window.location.reload();
        }}
      >
        Refresh
      </button>
    </div>
  );
}
