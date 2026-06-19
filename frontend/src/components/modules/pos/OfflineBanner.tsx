"use client";

import React, { useEffect, useState } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { getOfflineOrders, deleteOfflineOrder } from "@/lib/offlineQueue";
import { posApi } from "@/lib/api/pos";
import { toast } from "sonner";

interface OfflineBannerProps {
  onSyncComplete?: () => void;
}

export function OfflineBanner({ onSyncComplete }: OfflineBannerProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [offlineCount, setOfflineCount] = useState(0);
  const [showOnlineFlash, setShowOnlineFlash] = useState(false);

  const checkOfflineCount = async () => {
    try {
      const orders = await getOfflineOrders();
      setOfflineCount(orders.length);
    } catch (err) {
      console.error("Error reading offline queue", err);
    }
  };

  const performSync = async () => {
    const queued = await getOfflineOrders();
    if (queued.length === 0) {
      setOfflineCount(0);
      return;
    }

    setSyncing(true);
    let successCount = 0;
    let conflictCount = 0;

    toast.info(`Syncing ${queued.length} offline orders...`, { id: "pwa-sync" });

    for (const order of queued) {
      try {
        await posApi.createOrder({
          table_id: order.table_id,
          reservation_id: order.reservation_id,
          order_type: order.order_type as any,
          notes: order.notes,
          discount_amount: order.discount_amount,
          items: order.items,
        });
        if (order.id) {
          await deleteOfflineOrder(order.id);
        }
        successCount++;
      } catch (err: any) {
        console.error("Failed to sync offline order", err);
        // Conflict handling: e.g. table closed, occupied, duplicate key
        if (err.response?.status === 400 || err.response?.status === 409) {
          conflictCount++;
          const errorMsg = err.response?.data?.error || "Order conflict or invalid data";
          toast.error(`Sync conflict: ${errorMsg}. Order deleted from queue and sent for review.`, {
            duration: 6000,
          });
          if (order.id) {
            await deleteOfflineOrder(order.id);
          }
        } else {
          // General network error: keep remaining in queue and retry next time
          toast.warning("Network connection still unstable. Retrying remaining orders later.");
          break;
        }
      }
    }

    setSyncing(false);
    await checkOfflineCount();

    if (successCount > 0) {
      toast.success(`Successfully synced ${successCount} orders!`, { id: "pwa-sync" });
      setShowOnlineFlash(true);
      setTimeout(() => setShowOnlineFlash(false), 5000);
      if (onSyncComplete) {
        onSyncComplete();
      }
    } else if (conflictCount > 0) {
      toast.warning(`Sync processed: ${conflictCount} conflicts resolved/handled.`, { id: "pwa-sync" });
    } else {
      toast.dismiss("pwa-sync");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    checkOfflineCount();

    const handleOnline = () => {
      setIsOnline(true);
      performSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Also poll queue count periodically (every 10s)
    const interval = setInterval(checkOfflineCount, 10000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Display offline banner
  if (!isOnline) {
    return (
      <div className="bg-amber-600 text-white px-6 py-2 flex items-center justify-between text-xs font-semibold shadow-md animate-in slide-in-from-top duration-300 relative z-20 border-b border-amber-500/20">
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4 text-amber-100 animate-pulse" />
          <span>
            Offline Mode — POS orders will be saved locally and synced when connection is restored.
            {offlineCount > 0 && (
              <strong className="ml-1 text-amber-100 font-bold">({offlineCount} pending sync)</strong>
            )}
          </span>
        </div>
      </div>
    );
  }

  // Display back-online flash banner
  if (showOnlineFlash) {
    return (
      <div className="bg-[#2D5016] text-[#FAFAF7] px-6 py-2 flex items-center justify-between text-xs font-semibold shadow-md animate-in slide-in-from-top duration-300 relative z-20 border-b border-emerald-800/20">
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4 text-[#C9A84C]" />
          <span>Back online — Local orders synced successfully.</span>
        </div>
      </div>
    );
  }

  // Display manual sync action if we have offline items but are online
  if (offlineCount > 0) {
    return (
      <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-400 px-6 py-2 flex items-center justify-between text-xs font-medium relative z-20">
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4 animate-pulse" />
          <span>You have {offlineCount} offline orders waiting to sync.</span>
        </div>
        <button
          onClick={performSync}
          disabled={syncing}
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase transition-all disabled:opacity-50"
        >
          {syncing ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            "Sync Now"
          )}
        </button>
      </div>
    );
  }

  return null;
}
