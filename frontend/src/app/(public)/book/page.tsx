"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bed, Calendar, Users, ArrowRight, Loader2, Sparkles, CheckCircle2, Phone, Mail, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { bookingsApi } from "@/lib/api/bookings";
import { roomsApi } from "@/lib/api/rooms";
import type { RoomType } from "@/lib/types";

export default function PublicBookingWidgetPage() {
  const [step, setStep] = useState(1);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);

  // Search Availability
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [availableTypes, setAvailableTypes] = useState<any[]>([]);

  // Selected Room Type for Booking
  const [selectedTypeItem, setSelectedTypeItem] = useState<any | null>(null);

  // Guest Details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [nationality, setNationality] = useState("Nepalese");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation Success
  const [createdBooking, setCreatedBooking] = useState<any | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      setIsLoadingMetadata(true);
      try {
        const res = await roomsApi.listRoomTypes();
        setRoomTypes(res.data.results || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingMetadata(false);
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    const sendHeight = () => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: "lahana-resize", height }, "*");
    };
    // Send height message after rendering stabilizes
    const timer = setTimeout(sendHeight, 150);
    return () => clearTimeout(timer);
  }, [step, availableTypes, selectedTypeItem, isLoadingMetadata]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkIn || !checkOut || !adults) {
      toast.error("Please fill in dates and occupant details.");
      return;
    }
    if (new Date(checkIn) >= new Date(checkOut)) {
      toast.error("Check-out date must be after check-in date.");
      return;
    }

    setIsSearching(true);
    try {
      const res = await bookingsApi.publicAvailability({
        check_in: checkIn,
        check_out: checkOut,
        adults,
      });
      setAvailableTypes(res.data || []);
      if (res.data.length === 0) {
        toast.info("No room classes are available for these stay dates.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to query availability database.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectRoomType = (item: any) => {
    setSelectedTypeItem(item);
    setStep(2);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !phone) {
      toast.error("Please write first name, last name, and contact phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await bookingsApi.publicBookingCreate({
        guest: {
          first_name: firstName,
          last_name: lastName,
          phone,
          email: email || undefined,
          nationality,
        },
        booking: {
          check_in_date: checkIn,
          check_out_date: checkOut,
          room_type_id: selectedTypeItem.room_type.id,
          adults,
          special_requests: specialRequests || undefined,
        },
      });

      setCreatedBooking(res.data);
      toast.success("Stay reservation sent successfully!");
      setStep(3);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Error confirming reservation request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingMetadata) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] text-[#2D5016] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#C9A84C]" />
        <p className="text-slate-500 text-xs font-semibold">Synchronizing widget parameters...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-slate-800 p-6 flex flex-col justify-start max-w-2xl mx-auto space-y-6">
      {/* Visual Widget Header with Premium Logo */}
      <div className="text-center space-y-2 py-4">
        <img
          src="/lahana-logo.png"
          alt="Lahana Resort Logo"
          className="h-16 mx-auto mb-2 object-contain"
          onError={(e) => {
            // Hide image if it fails to load and fallback to text styling
            (e.target as HTMLElement).style.display = "none";
          }}
        />
        <h1 className="text-2xl font-black tracking-tight text-[#2D5016]">
          Lahana Resort
        </h1>
        <div className="h-[2px] w-12 bg-[#C9A84C] mx-auto rounded-full"></div>
        <p className="text-slate-500 text-xs mt-1 font-medium">Stay Reservation Portal</p>
      </div>

      {/* STEP 1: Search Availability & List */}
      {step === 1 && (
        <div className="space-y-6">
          <Card className="bg-white border-slate-200/80 shadow-lg shadow-slate-100/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-xs font-bold text-[#2D5016] uppercase tracking-wider">Search Room Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <Label htmlFor="check-in" className="text-slate-500 uppercase font-bold text-[10px]">Check In</Label>
                  <Input
                    type="date"
                    id="check-in"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="bg-slate-50/50 border-slate-200 text-slate-800 focus-visible:ring-[#2D5016] focus-visible:border-[#2D5016]"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="check-out" className="text-slate-500 uppercase font-bold text-[10px]">Check Out</Label>
                  <Input
                    type="date"
                    id="check-out"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="bg-slate-50/50 border-slate-200 text-slate-800 focus-visible:ring-[#2D5016] focus-visible:border-[#2D5016]"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="adults" className="text-slate-500 uppercase font-bold text-[10px]">Adults</Label>
                  <Input
                    type="number"
                    id="adults"
                    min={1}
                    value={adults}
                    onChange={(e) => setAdults(Number(e.target.value))}
                    className="bg-slate-50/50 border-slate-200 text-slate-800 focus-visible:ring-[#2D5016] focus-visible:border-[#2D5016]"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSearching}
                  className="col-span-1 sm:col-span-3 w-full bg-[#2D5016] hover:bg-[#1E360F] text-white font-semibold gap-2 shadow-md shadow-green-800/10 h-10 transition-colors"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      Searching Catalog...
                    </>
                  ) : (
                    <>
                      Search Available Rooms
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results Class List */}
          <div className="space-y-4">
            {availableTypes.map((item) => (
              <Card
                key={item.room_type.id}
                className="bg-white border-slate-200/80 hover:border-[#C9A84C]/50 transition-all overflow-hidden flex flex-col sm:flex-row shadow-md"
              >
                <div className="flex-1 p-5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-[#2D5016]">{item.room_type.name}</h3>
                      <p className="text-[10px] text-[#C9A84C] font-semibold uppercase tracking-wider">{item.room_type.slug}</p>
                    </div>
                    <span className="text-[10px] font-bold text-[#2D5016] bg-[#2D5016]/10 px-2 py-0.5 rounded border border-[#2D5016]/20 flex-shrink-0">
                      Max: {item.room_type.max_occupancy} Guests
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.room_type.description}</p>
                  <div className="pt-2 flex flex-col gap-1 text-[11px]">
                    {Number(item.pricing.advance_deposit_percent || 0) > 0 && (
                      <div className="text-emerald-700 font-semibold flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#C9A84C]" />
                        <span>
                          Rs. {Number(item.pricing.deposit_amount).toLocaleString()} deposit required now ({item.pricing.advance_deposit_percent}%)
                        </span>
                      </div>
                    )}
                    <div className="text-slate-400">
                      * Cancellation: Free cancellation up to {item.pricing.free_cancellation_days} days before check-in.
                    </div>
                  </div>
                </div>

                <div className="border-t sm:border-t-0 sm:border-l border-slate-100 p-5 bg-slate-50/30 flex flex-col justify-center items-center text-center gap-3 w-full sm:w-48 flex-shrink-0">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Estimated Total</span>
                    <span className="text-xl font-extrabold text-[#2D5016]">
                      Rs. {Number(item.pricing.total_price).toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-500 block">({item.pricing.nights} Nights, incl. VAT)</span>
                  </div>
                  <Button
                    onClick={() => handleSelectRoomType(item)}
                    size="sm"
                    className="w-full bg-[#2D5016] hover:bg-[#1E360F] text-white font-semibold shadow-sm transition-colors"
                  >
                    Select Room
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Guest Details Form */}
      {step === 2 && selectedTypeItem && (
        <Card className="bg-white border-slate-200/80 shadow-lg shadow-slate-100/50">
          <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xs font-bold text-[#2D5016] uppercase tracking-wider">Guest & Contact Information</CardTitle>
              <CardDescription className="text-slate-400 text-xs">Fill details to confirm pending reservation.</CardDescription>
            </div>
            <Button
              onClick={() => setStep(1)}
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-slate-500 hover:text-[#2D5016] hover:bg-slate-50"
            >
              Change Room
            </Button>
          </CardHeader>

          <CardContent className="pt-5">
            <form onSubmit={handleConfirmBooking} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <Label htmlFor="first-name" className="text-slate-500 font-bold uppercase text-[10px]">First Name</Label>
                  <Input
                    id="first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ramesh"
                    className="bg-slate-50/50 border-slate-200 text-slate-800 focus-visible:ring-[#2D5016] focus-visible:border-[#2D5016]"
                  />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <Label htmlFor="last-name" className="text-slate-500 font-bold uppercase text-[10px]">Last Name</Label>
                  <Input
                    id="last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Sharma"
                    className="bg-slate-50/50 border-slate-200 text-slate-800 focus-visible:ring-[#2D5016] focus-visible:border-[#2D5016]"
                  />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <Label htmlFor="phone" className="text-slate-500 font-bold uppercase text-[10px]">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98XXXXXXXX"
                    className="bg-slate-50/50 border-slate-200 text-slate-800 focus-visible:ring-[#2D5016] focus-visible:border-[#2D5016]"
                  />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <Label htmlFor="email" className="text-slate-500 font-bold uppercase text-[10px]">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ramesh@gmail.com"
                    className="bg-slate-50/50 border-slate-200 text-slate-800 focus-visible:ring-[#2D5016] focus-visible:border-[#2D5016]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="special-requests" className="text-slate-500 font-bold uppercase text-[10px]">Special Stay Requirements</Label>
                <Input
                  id="special-requests"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="e.g. Requests extra pillows, late check-in..."
                  className="bg-slate-50/50 border-slate-200 text-slate-800 focus-visible:ring-[#2D5016] focus-visible:border-[#2D5016]"
                />
              </div>

              {/* Stay Summary details */}
              <div className="rounded-xl border border-slate-200 bg-[#FAFAF7] p-4 space-y-3">
                <h4 className="font-bold text-[#2D5016] uppercase tracking-wider text-[10px]">Summary of Reservation Charges</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Stay Class</span>
                    <span className="font-semibold text-[#2D5016]">{selectedTypeItem.room_type.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Nights Charge</span>
                    <span>Rs. {Number(selectedTypeItem.pricing.base_price).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>VAT (13%)</span>
                    <span>Rs. {Number(selectedTypeItem.pricing.tax_price).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-[#2D5016] pt-2 border-t border-slate-200">
                    <span>Total Amount</span>
                    <span className="text-[#C9A84C]">Rs. {Number(selectedTypeItem.pricing.total_price).toLocaleString()}</span>
                  </div>
                  {Number(selectedTypeItem.pricing.advance_deposit_percent || 0) > 0 && (
                    <div className="pt-2 mt-2 border-t border-dashed border-slate-200 space-y-1">
                      <div className="flex justify-between text-emerald-700 font-bold text-[11px]">
                        <span>Deposit Required Now ({selectedTypeItem.pricing.advance_deposit_percent}%)</span>
                        <span>Rs. {Number(selectedTypeItem.pricing.deposit_amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>Remaining Balance (Due at Check-in)</span>
                        <span>Rs. {(Number(selectedTypeItem.pricing.total_price) - Number(selectedTypeItem.pricing.deposit_amount)).toLocaleString()}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 pt-1 leading-normal">
                        * Cancellation Policy: Free cancellation up to {selectedTypeItem.pricing.free_cancellation_days} days prior to check-in. Cancellations inside this window are subject to a {100 - selectedTypeItem.pricing.cancellation_refund_percent}% charge on the deposit.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#2D5016] hover:bg-[#1E360F] text-white font-semibold gap-2 shadow-md shadow-green-800/10 h-10 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    Confirming Reservation...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-white" />
                    Confirm Reservation Request
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Checkout Success */}
      {step === 3 && createdBooking && (
        <Card className="bg-white border-slate-200/80 shadow-lg shadow-slate-100/50 text-center py-10 px-6 space-y-6">
          <div className="h-16 w-16 bg-[#2D5016]/10 border border-[#2D5016]/25 text-[#2D5016] rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-800/5">
            <CheckCircle2 className="h-10 w-10 text-[#C9A84C]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#2D5016]">Booking Request Received!</h2>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              Your reservation request has been processed. Stay details are listed below:
            </p>
          </div>

          {/* Details summary */}
          <div className="rounded-xl border border-slate-100 bg-[#FAFAF7] p-4 max-w-md mx-auto text-left text-xs space-y-3 shadow-inner">
            <div className="flex justify-between pb-2 border-b border-slate-200/50">
              <span className="text-slate-500 font-medium">Booking Ref</span>
              <span className="font-extrabold text-[#2D5016]">#{createdBooking.id}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200/50">
              <span className="text-slate-500 font-medium">Guest Name</span>
              <span className="font-semibold text-slate-800">
                {firstName} {lastName}
              </span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200/50">
              <span className="text-slate-500 font-medium">Check In</span>
              <span className="font-semibold text-slate-800">{checkIn}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200/50">
              <span className="text-slate-500 font-medium">Check Out</span>
              <span className="font-semibold text-slate-800">{checkOut}</span>
            </div>
            <div className="flex justify-between pt-1 font-extrabold text-lg text-[#2D5016]">
              <span>Total Stay Value</span>
              <span className="text-[#C9A84C]">Rs. {Number(createdBooking.total_amount).toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-4 max-w-md mx-auto">
            <Button
              onClick={() => {
                setStep(1);
                setAvailableTypes([]);
                setSelectedTypeItem(null);
                setCreatedBooking(null);
              }}
              className="w-full bg-[#2D5016] hover:bg-[#1E360F] text-white font-semibold h-10 transition-colors"
            >
              Start New Search
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
