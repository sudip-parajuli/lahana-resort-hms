"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bed, CalendarCheck, UserCheck, DollarSign,
  Activity, ArrowUpRight, Clock, AlertTriangle,
  Utensils, Hammer, RefreshCw, Loader2, Play
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/authStore";
import { roomsApi } from "@/lib/api/rooms";
import { frontdeskApi } from "@/lib/api/frontdesk";
import { analyticsApi } from "@/lib/api/analytics";
import { inventoryApi } from "@/lib/api/inventory";
import { housekeepingApi } from "@/lib/api/housekeeping";
import { posApi } from "@/lib/api/pos";
import { apiClient } from "@/lib/api/client";
import { RoomStatusGrid } from "@/components/modules/rooms/RoomStatusGrid";
import { RoomDetailSheet } from "@/components/modules/rooms/RoomDetailSheet";
import type { Room, RoomType, Reservation, InventoryItem, HousekeepingTask, MaintenanceRequest, Order, DiningTable } from "@/lib/types";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [time, setTime] = useState(new Date());
  const t = useTranslations("Dashboard");

  // Data states
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [arrivals, setArrivals] = useState<Reservation[]>([]);
  const [departures, setDepartures] = useState<Reservation[]>([]);
  const [inHouseCount, setInHouseCount] = useState(0);
  const [occupancyRate, setOccupancyRate] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [restaurantCovers, setRestaurantCovers] = useState(0);
  
  // Restaurant POS details
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);

  // Alerts
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [pendingHKTasks, setPendingHKTasks] = useState<HousekeepingTask[]>([]);
  const [openMaintenance, setOpenMaintenance] = useState<MaintenanceRequest[]>([]);

  // Room Sheet control
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      const [
        roomsRes,
        typesRes,
        fdStatsRes,
        analyticsSummaryRes,
        inventoryRes,
        hkTasksRes,
        posTablesRes,
        activeOrdersRes
      ] = await Promise.all([
        roomsApi.listRooms(),
        roomsApi.listRoomTypes(),
        frontdeskApi.getTodayStats(),
        analyticsApi.getDashboardSummary().catch(() => ({ data: { today: { total_revenue: 0, restaurant_covers: 0 } } })),
        inventoryApi.getItems().catch(() => ({ data: [] })),
        housekeepingApi.getTasks().catch(() => ({ data: [] })),
        apiClient.get<DiningTable[]>("/restaurant/tables/").catch(() => ({ data: [] })),
        posApi.getActiveOrders().catch(() => ({ data: [] }))
      ]);

      const loadedRooms = roomsRes.data.results || [];
      setRooms(loadedRooms);
      setRoomTypes(typesRes.data.results || []);
      
      // Front Desk data
      setArrivals(fdStatsRes.data.arrivals || []);
      setDepartures(fdStatsRes.data.departures || []);
      setInHouseCount(fdStatsRes.data.in_house?.length || 0);
      setOccupancyRate(fdStatsRes.data.occupancy_rate || 0);

      // Analytics Summary
      const summaryToday = analyticsSummaryRes.data.today || {};
      setTodayRevenue(summaryToday.total_revenue || 0);
      setRestaurantCovers(summaryToday.restaurant_covers || 0);

      // POS Data
      setTables(posTablesRes.data || []);
      setActiveOrdersCount(activeOrdersRes.data?.length || 0);

      // Inventory alerts (Low stock: current_stock < reorder_level)
      const inventoryItems = Array.isArray(inventoryRes.data) ? inventoryRes.data : ((inventoryRes.data as any)?.results || []);
      const lowStock = inventoryItems.filter(
        (item: InventoryItem) => parseFloat(item.current_stock) < parseFloat(item.reorder_level)
      );
      setLowStockItems(lowStock);

      // Housekeeping Alerts
      const hkTasks = Array.isArray(hkTasksRes.data) ? hkTasksRes.data : ((hkTasksRes.data as any)?.results || []);
      const pendingHK = hkTasks.filter(
        (task: HousekeepingTask) => task.status === "pending" || task.status === "in_progress"
      );
      setPendingHKTasks(pendingHK);

      // Maintenance requests (Open/In progress)
      try {
        const maintenanceRes = await apiClient.get<MaintenanceRequest[]>("/housekeeping/maintenance/");
        const openMaint = (maintenanceRes.data || []).filter((req) => req.status !== "resolved");
        setOpenMaintenance(openMaint);
      } catch (maintErr) {
        console.error("Failed to load maintenance requests", maintErr);
      }

    } catch (err) {
      console.error("Failed to load dashboard statistics", err);
      toast.error("Error loading daily operations data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") {
      const isImpersonating = document.cookie.includes("impersonated_tenant_name");
      if (!isImpersonating) {
        router.replace("/superadmin");
      }
    }
  }, [user, router]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setIsSheetOpen(true);
  };

  const handleRefresh = () => {
    setLoading(true);
    loadDashboardData();
  };

  const totalTables = tables.length;
  const occupiedTables = tables.filter((t) => t.status === "occupied").length;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-slate-950 text-white gap-3">
        <Loader2 className="h-10 w-10 text-cyan-500 animate-spin" />
        <span className="text-sm text-slate-400 font-medium">{t("loading")}</span>
      </div>
    );
  }

  const locale = user?.preferred_language || "en";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {time.getHours() < 12 ? t("good_morning") : time.getHours() < 17 ? t("good_afternoon") : t("good_evening")},{" "}
            <span className="bg-gradient-to-r from-[#C9A84C] to-amber-300 bg-clip-text text-transparent">
              {user?.first_name ?? t("manager")}
            </span>
          </h1>
          <p className="text-slate-400 text-sm">
            {t("overview_for")}{" "}
            {time.toLocaleDateString(locale === "ne" ? "ne-NP" : "en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="border-slate-800 text-slate-300 hover:text-white bg-slate-900/40 hover:bg-slate-900 h-10 w-10 p-0"
          >
            <RefreshCw className="h-4.5 w-4.5" />
          </Button>
          <div className="flex items-center gap-2 text-slate-400 bg-slate-900/40 border border-slate-800/80 rounded-xl px-4 py-2 h-10">
            <Clock className="h-4 w-4 text-[#C9A84C]" />
            <span className="font-mono text-sm font-medium text-slate-300">
              {time.toLocaleTimeString(locale === "ne" ? "ne-NP" : "en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Today's KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/40 border-slate-800/60 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t("occupancy_rate")}
            </CardTitle>
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 shadow-sm">
              <Bed className="h-4 w-4 text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{occupancyRate.toFixed(1)}%</div>
            <p className="text-[10px] text-slate-500 mt-1">{t("active_res", { count: inHouseCount })}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/60 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t("expected_arrivals")}
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
              <CalendarCheck className="h-4 w-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{arrivals.length}</div>
            <p className="text-[10px] text-slate-500 mt-1">{t("expected_checkouts", { count: departures.length })}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/60 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t("restaurant_covers")}
            </CardTitle>
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 shadow-sm">
              <Utensils className="h-4 w-4 text-violet-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{restaurantCovers}</div>
            <p className="text-[10px] text-slate-500 mt-1">{t("active_orders", { count: activeOrdersCount })}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/60 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t("todays_revenue")}
            </CardTitle>
            <div className="p-2 rounded-lg bg-[#2D5016]/10 border border-[#2D5016]/20 shadow-sm">
              <DollarSign className="h-4 w-4 text-[#C9A84C]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">Rs. {todayRevenue.toLocaleString()}</div>
            <p className="text-[10px] text-slate-500 mt-1">{t("revenue_sub")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Room Status Grid (Take up 2 cols on wide screens) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900/40 border-slate-800/60">
            <CardHeader className="border-b border-slate-900 pb-4">
              <CardTitle className="text-sm font-semibold text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bed className="h-4.5 w-4.5 text-[#C9A84C]" />
                  <span>{t("room_status_grid")}</span>
                </div>
                <Link href="/rooms">
                  <span className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer flex items-center gap-0.5">
                    {t("manage_rooms")} <ArrowUpRight className="h-3 w-3" />
                  </span>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <RoomStatusGrid rooms={rooms} onRoomClick={handleRoomClick} />
            </CardContent>
          </Card>
        </div>

        {/* Alerts & Operations Feed (1 col) */}
        <div className="space-y-6">
          
          {/* Operations Alerts Card */}
          <Card className="bg-slate-900/40 border-slate-800/60">
            <CardHeader className="border-b border-slate-900 pb-4">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
                <span>{t("operations_alerts")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 max-h-[300px] overflow-y-auto scrollbar-thin">
              {lowStockItems.length === 0 && pendingHKTasks.length === 0 && openMaintenance.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs font-medium">
                  {t("all_systems_normal")}
                </div>
              ) : (
                <>
                  {/* Maintenance requests */}
                  {openMaintenance.map((m) => (
                    <div key={m.id} className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start gap-2.5">
                      <Hammer className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-200 block">{t("maintenance_alert", { room: m.room_number })}</span>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{m.description}</p>
                      </div>
                      <Badge className="bg-red-500/10 text-red-400 text-[8px] uppercase font-bold shrink-0">{m.category}</Badge>
                    </div>
                  ))}

                  {/* Housekeeping task alerts */}
                  {pendingHKTasks.map((t_hk) => (
                    <div key={t_hk.id} className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-2.5">
                      <Bed className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-200 block">{t("housekeeping_alert", { room: t_hk.room_number })}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {t_hk.task_type.replace("_", " ")} — {t("assigned_to")}: {t_hk.assigned_to_name || t("unassigned")}
                        </p>
                      </div>
                      <Badge className="bg-amber-500/10 text-amber-400 text-[8px] uppercase font-bold shrink-0">{t_hk.status}</Badge>
                    </div>
                  ))}

                  {/* Low Stock inventory */}
                  {lowStockItems.map((item) => (
                    <div key={item.id} className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-2.5">
                      <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-200 block">{t("low_stock_alert", { name: item.name })}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {t("currently")}: {item.current_stock} {item.unit} ({t("reorder")}: {item.reorder_level} {item.unit})
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          {/* Restaurant activity ratio */}
          <Card className="bg-slate-900/40 border-slate-800/60">
            <CardHeader className="border-b border-slate-900 pb-4">
              <CardTitle className="text-sm font-semibold text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils className="h-4.5 w-4.5 text-violet-400" />
                  <span>{t("restaurant_live_ratio")}</span>
                </div>
                <Link href="/pos">
                  <span className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer flex items-center gap-0.5">
                    {t("pos_terminal")} <ArrowUpRight className="h-3 w-3" />
                  </span>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>{t("occupied_tables")}</span>
                <span className="font-semibold text-slate-200">{t("tables_stat", { occupied: occupiedTables, total: totalTables })}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-300"
                  style={{ width: `${totalTables > 0 ? (occupiedTables / totalTables) * 100 : 0}%` }}
                />
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Today's Arrivals expected list */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-slate-900/40 border-slate-800/60">
          <CardHeader className="border-b border-slate-900 pb-4">
            <CardTitle className="text-sm font-semibold text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4.5 w-4.5 text-emerald-400" />
                <span>{t("expected_arrivals_today")}</span>
              </div>
              <Link href="/frontdesk">
                <span className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer flex items-center gap-0.5">
                  {t("front_desk")} <ArrowUpRight className="h-3 w-3" />
                </span>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 overflow-x-auto">
            {arrivals.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs font-medium">
                {t("no_expected_arrivals")}
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-wider pb-2">
                    <th className="py-2.5">{t("guest")}</th>
                    <th>{t("room_assigned")}</th>
                    <th>{t("proximity")}</th>
                    <th>{t("booking_source")}</th>
                    <th className="text-right">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs">
                  {arrivals.map((arr) => (
                    <tr key={arr.id} className="text-slate-300 hover:text-white hover:bg-slate-900/10">
                      <td className="py-3 font-semibold text-slate-100">
                        {arr.guest.first_name} {arr.guest.last_name}
                      </td>
                      <td>
                        {arr.room?.room_number ? `Room ${arr.room.room_number} (${arr.room.room_type?.name})` : t("unassigned")}
                      </td>
                      <td className="text-slate-400">
                        {arr.total_nights} {locale === "ne" ? "रात" : "nights"}
                      </td>
                      <td className="capitalize text-slate-400">
                        {arr.booking_source.replace("_", " ")}
                      </td>
                      <td className="text-right">
                        <Link href="/frontdesk">
                          <Button size="xs" className="bg-[#2D5016] text-[#FAFAF7] hover:bg-[#1E3A0E] text-[10px]">
                            {t("checkin_desk")}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Slide Drawer room detail panel */}
      <RoomDetailSheet
        room={selectedRoom}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onSuccess={loadDashboardData}
      />
    </div>
  );
}

// Custom simple Badge representation to prevent import clashes
function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold ${className}`}>
      {children}
    </span>
  );
}
