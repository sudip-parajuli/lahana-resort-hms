"use client";

import React, { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("Service Worker registered successfully with scope:", reg.scope);
          })
          .catch((err) => {
            console.error("Service Worker registration failed:", err);
          });
      });
    }

    // 2. Listen for BeforeInstallPrompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      
      // Check if user has previously dismissed the prompt
      const isDismissed = localStorage.getItem("lahana_pwa_prompt_dismissed");
      if (!isDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("lahana_pwa_prompt_dismissed", "true");
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl z-50 flex items-center justify-between gap-4 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 bg-[#2D5016]/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-[#2D5016]/20">
          <Download className="h-5 w-5 text-[#C9A84C]" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-100">Install Lahana Resort PMS</h4>
          <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
            Install the PMS web app on your home screen for quick, offline-capable staff access.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleInstallClick}
          className="bg-[#2D5016] text-[#FAFAF7] hover:bg-[#1E360F] text-[10px] px-3 h-8 font-semibold rounded-lg shadow-sm shrink-0"
        >
          Install
        </Button>
        <button
          onClick={handleDismiss}
          className="p-1 text-slate-500 hover:text-slate-300 transition-colors shrink-0"
          aria-label="Dismiss prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
