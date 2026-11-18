"use client";

import React, { useEffect, useState } from "react";
import { Icon } from "../icons";

export default function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (online) return null;

  return (
    <div className="offlineBar" role="status">
      <Icon name="offline" size={15} />
      <span>You&apos;re offline — toys, music, and drawings still work.</span>
    </div>
  );
}
