"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Loader2, QrCode, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QRScanPage() {
  const router = useRouter();
  const params = useParams();
  const qr_uuid = params.qr_uuid as string;

  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    if (!qr_uuid) return;

    const resolveTable = async () => {
      try {
        // Resolve table details publicly
        const res = await axios.get(`/api/restaurant/tables/qr/${qr_uuid}/`);
        const { table_id } = res.data;

        // Check authentication state by querying /api-auth/me
        try {
          await axios.get("/api-auth/me");
          // Authenticated -> Redirect to POS
          router.replace(`/pos/?table=${table_id}`);
        } catch (authErr) {
          // Unauthenticated -> Redirect to Login with custom redirect param
          router.replace(`/login/?redirect=/pos/%3Ftable%3D${table_id}`);
        }
      } catch (err: any) {
        console.error("Failed to resolve QR code:", err);
        setError(
          err.response?.data?.error || 
          "Failed to resolve table QR code. Please ensure it is valid."
        );
      } finally {
        setResolving(false);
      }
    };

    resolveTable();
  }, [qr_uuid, router]);

  if (resolving) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <div className="h-16 w-16 bg-[#2D5016]/10 rounded-2xl flex items-center justify-center border border-[#2D5016]/20 animate-pulse">
            <QrCode className="h-8 w-8 text-[#C9A84C]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Resolving Table QR Code</h2>
            <p className="text-xs text-slate-400 mt-1">
              Checking table assignments and routing to ordering terminal...
            </p>
          </div>
          <Loader2 className="h-6 w-6 text-[#C9A84C] animate-spin mt-2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="h-12 w-12 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Resolution Failed</h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{error}</p>
          </div>
          <Button
            onClick={() => router.push("/")}
            className="w-full mt-2 bg-[#2D5016] text-[#FAFAF7] hover:bg-[#1E3A0E] text-xs font-semibold"
          >
            Go to Workspace
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
