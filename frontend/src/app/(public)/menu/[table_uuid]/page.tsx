"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Loader2, Utensils, Bell, Globe, Sparkles, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NextIntlClientProvider, useTranslations } from "next-intl";

import enMessages from "../../../../../messages/en.json";
import neMessages from "../../../../../messages/ne.json";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: string;
  is_vegetarian: boolean;
  is_vegan: boolean;
  contains_allergens: string[];
}

interface MenuCategory {
  id: number;
  name: string;
  icon: string;
  items: MenuItem[];
}

interface TableMetadata {
  table_id: number;
  table_number: string;
  area_name: string;
}

function GuestMenuContent() {
  const params = useParams();
  const router = useRouter();
  const table_uuid = params.table_uuid as string;

  const t = useTranslations("Menu");

  const [table, setTable] = useState<TableMetadata | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Call waiter state
  const [callingWaiter, setCallingWaiter] = useState(false);
  const [waiterCalled, setWaiterCalled] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!table_uuid) return;

    const loadData = async () => {
      try {
        // 1. Fetch table metadata
        const tableRes = await axios.get(`/api/restaurant/tables/qr/${table_uuid}/`);
        setTable(tableRes.data);

        // 2. Fetch public menu
        const menuRes = await axios.get("/api/restaurant/categories/public/");
        setCategories(menuRes.data);
        if (menuRes.data.length > 0) {
          setActiveCategory(menuRes.data[0].id);
        }
      } catch (err: any) {
        console.error("Failed to load digital menu data", err);
        setError("Failed to load digital menu. Please scan the QR code again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [table_uuid]);

  // Establish a connection to WebSocket for calling waiter
  useEffect(() => {
    if (typeof window === "undefined") return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/kds/all/`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected for call waiter");
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected for call waiter");
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleCallWaiter = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !table) {
      alert("Unable to reach waiter service. Please call a staff member directly.");
      return;
    }

    setCallingWaiter(true);

    const message = {
      event: "call_waiter",
      table_id: table.table_id,
      table_number: table.table_number,
      area_name: table.area_name,
    };

    wsRef.current.send(JSON.stringify(message));

    setTimeout(() => {
      setCallingWaiter(false);
      setWaiterCalled(true);
      setTimeout(() => setWaiterCalled(false), 5000);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 text-[#2D5016] animate-spin" />
        <span className="text-xs text-slate-500 font-medium mt-3">Loading Lahana digital menu...</span>
      </div>
    );
  }

  if (error || !table) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 max-w-sm">
          <h3 className="text-sm font-bold text-red-800">Error Loading Menu</h3>
          <p className="text-xs text-red-600 mt-2">{error || "Invalid dining table QR code."}</p>
        </div>
      </div>
    );
  }

  const activeCategoryData = categories.find((c) => c.id === activeCategory);

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-slate-900 pb-28">
      {/* Header Banner */}
      <header className="bg-gradient-to-b from-[#2D5016] to-[#1E360F] text-[#FAFAF7] px-6 pt-10 pb-8 rounded-b-[2rem] shadow-lg relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 h-40 w-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 bg-[#C9A84C]/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="h-14 w-14 bg-white/10 rounded-full flex items-center justify-center border border-[#C9A84C]/30 shadow-md">
            <img src="/lahana-logo.png" className="h-9 w-9 object-contain" alt="Lahana Logo" />
          </div>
          
          <span className="text-[10px] uppercase tracking-widest text-[#C9A84C] font-bold mt-3">
            {t("welcome")}
          </span>
          <h1 className="text-xl font-bold mt-1 text-[#FAFAF7] font-serif">
            Lahana Resort {t("title")}
          </h1>
          <p className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold text-[#FAFAF7] mt-3 border border-white/5 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#C9A84C]" />
            {t("table")} {table.table_number} ({table.area_name})
          </p>
        </div>
      </header>

      {/* Categories Scroll */}
      <div className="sticky top-0 bg-[#FAFAF7]/95 backdrop-blur-md py-4 px-6 border-b border-slate-200/60 z-20 overflow-x-auto flex gap-2.5 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 shadow-sm border ${
              activeCategory === cat.id
                ? "bg-[#2D5016] text-[#FAFAF7] border-[#2D5016]"
                : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu List */}
      <div className="px-6 py-6 space-y-4 max-w-2xl mx-auto">
        {activeCategoryData && activeCategoryData.items.length > 0 ? (
          activeCategoryData.items.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-100/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex justify-between gap-4"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-800 leading-snug">{item.name}</h3>
                  <div className="flex gap-1">
                    {item.is_vegetarian && (
                      <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase">
                        {t("veg")}
                      </span>
                    )}
                    {item.is_vegan && (
                      <span className="bg-green-50 text-green-600 border border-green-100 text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase">
                        {t("vegan")}
                      </span>
                    )}
                  </div>
                </div>
                {item.description && (
                  <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                    {item.description}
                  </p>
                )}
                {item.contains_allergens && item.contains_allergens.length > 0 && (
                  <div className="flex items-center gap-1 text-[9px] text-amber-600 font-medium pt-1">
                    <Info className="h-3 w-3" />
                    <span>
                      {t("allergens")}: {item.contains_allergens.join(", ")}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-right shrink-0 flex flex-col justify-between">
                <span className="font-extrabold text-sm text-[#2D5016]">
                  {t("currency")} {parseFloat(item.price).toFixed(2)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-white p-6">
            <Utensils className="h-8 w-8 text-slate-400 mx-auto mb-2 animate-pulse" />
            <p className="text-xs text-slate-400 font-medium">{t("empty")}</p>
          </div>
        )}
      </div>

      {/* Floating Action: Call Waiter */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm z-30 bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20">
            <Bell className="h-4.5 w-4.5 text-amber-500 animate-ring" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
              Need Assistance?
            </span>
            <span className="text-[10px] text-slate-400 block">
              Notify waiter terminal directly
            </span>
          </div>
        </div>

        <Button
          size="sm"
          disabled={callingWaiter || waiterCalled}
          onClick={handleCallWaiter}
          className={`text-[10px] px-3.5 h-8 font-bold rounded-lg transition-all ${
            waiterCalled
              ? "bg-emerald-600 hover:bg-emerald-500 text-white"
              : "bg-amber-500 hover:bg-amber-400 text-slate-950"
          }`}
        >
          {callingWaiter ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
              {t("calling")}
            </>
          ) : waiterCalled ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1" />
              Called
            </>
          ) : (
            t("call_waiter")
          )}
        </Button>
      </div>
    </div>
  );
}

function GuestMenuLayout() {
  const [locale, setLocale] = useState<"en" | "ne">("en");
  const messages = locale === "ne" ? neMessages : enMessages;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {/* Mini top-float language switcher */}
      <div className="absolute right-4 top-4 z-40 flex bg-white/10 border border-white/15 rounded-full p-0.5 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setLocale("en")}
          className={`flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-bold rounded-full transition-all ${
            locale === "en" ? "bg-[#C9A84C] text-slate-950 shadow-sm" : "text-[#FAFAF7] hover:text-white"
          }`}
        >
          <Globe className="h-3 w-3" /> EN
        </button>
        <button
          type="button"
          onClick={() => setLocale("ne")}
          className={`flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-bold rounded-full transition-all ${
            locale === "ne" ? "bg-[#C9A84C] text-slate-950 shadow-sm" : "text-[#FAFAF7] hover:text-white"
          }`}
        >
          <Globe className="h-3 w-3" /> नेपाली
        </button>
      </div>

      <GuestMenuContent />
    </NextIntlClientProvider>
  );
}

export default function GuestMenuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#2D5016] animate-spin" />
      </div>
    }>
      <GuestMenuLayout />
    </Suspense>
  );
}
