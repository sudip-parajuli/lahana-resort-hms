import React, { useState, useEffect } from "react";
import { Loader2, DollarSign, Plus, Trash2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Reservation } from "@/lib/types";

interface AdditionalCharge {
  description: string;
  amount: number;
}

interface CheckOutModalProps {
  reservation: Reservation | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    reservation_id: number;
    additional_charges: AdditionalCharge[];
    payment_method: string;
    feedback_rating?: number;
    feedback_comment?: string;
    splits?: Array<{
      payment_method: string;
      amount: string;
      reference: string;
      description: string;
    }>;
  }) => Promise<void>;
}

export const CheckOutModal: React.FC<CheckOutModalProps> = ({
  reservation,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>([]);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [splits, setSplits] = useState<Array<{
    payment_method: string;
    amount: string;
    reference: string;
    description: string;
  }>>([
    { payment_method: "cash", amount: "", reference: "", description: "" }
  ]);

  useEffect(() => {
    if (isOpen) {
      setAdditionalCharges([]);
      setDesc("");
      setAmount("");
      setPaymentMethod("cash");
      setRating(5);
      setComment("");
      setSplits([{ payment_method: "cash", amount: "", reference: "", description: "" }]);
    }
  }, [isOpen]);

  if (!reservation) return null;

  const handleAddCharge = () => {
    if (!desc.trim() || !amount) return;
    setAdditionalCharges([
      ...additionalCharges,
      { description: desc, amount: parseFloat(amount) },
    ]);
    setDesc("");
    setAmount("");
  };

  const handleRemoveCharge = (index: number) => {
    setAdditionalCharges(additionalCharges.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const roomTotal = parseFloat(reservation.total_amount) || 0;
    const additionalTotal = additionalCharges.reduce((sum, item) => sum + item.amount, 0);
    return {
      roomTotal,
      additionalTotal,
      grandTotal: roomTotal + additionalTotal,
    };
  };

  const { roomTotal, additionalTotal, grandTotal } = calculateTotals();
  const depositPaid = (reservation.deposit_paid && reservation.deposit_amount) ? parseFloat(reservation.deposit_amount) : 0;
  const remainingBalance = grandTotal - depositPaid;

  const totalAllocated = splits.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const isAllocationValid = Math.abs(totalAllocated - remainingBalance) < 0.01;

  const handleAddSplitRow = () => {
    setSplits([
      ...splits,
      { payment_method: "cash", amount: "", reference: "", description: "" }
    ]);
  };

  const handleRemoveSplitRow = (index: number) => {
    if (splits.length === 1) return;
    setSplits(splits.filter((_, i) => i !== index));
  };

  const handleUpdateSplitRow = (index: number, key: string, value: string) => {
    const newSplits = [...splits];
    newSplits[index] = {
      ...newSplits[index],
      [key]: value
    };
    setSplits(newSplits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === "split" && !isAllocationValid) return;
    setSubmitting(true);
    try {
      await onConfirm({
        reservation_id: reservation.id,
        additional_charges: additionalCharges,
        payment_method: paymentMethod,
        feedback_rating: rating,
        feedback_comment: comment,
        splits: paymentMethod === "split" ? splits : undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-slate-950 border-slate-900 text-slate-100 max-w-lg rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-emerald-400" />
              Check Out Guest & Settle Balance
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Settle room charges, minibar logs, and additional service payments.
            </DialogDescription>
          </DialogHeader>

          {/* Stay review details */}
          <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-3.5 space-y-2 text-xs">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Reservation details</h4>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div>
                <span className="text-slate-500 block text-[10px]">Guest Name</span>
                <span className="font-semibold">{reservation.guest.first_name} {reservation.guest.last_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Assigned Room</span>
                <span className="font-semibold text-slate-200">Room {reservation.room.room_number}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Stay Interval</span>
                <span className="font-semibold">{reservation.check_in_date} to {reservation.check_out_date}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Total Stay Nights</span>
                <span className="font-semibold">{reservation.total_nights} Nights</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Custom additional charges builder */}
            <div className="space-y-2.5">
              <Label className="text-slate-400 font-bold uppercase text-[10px]">Additional Charges (Minibar, damage, extra items)</Label>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-7">
                  <Input
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Description (e.g. Laundry charges)"
                    className="bg-slate-900 border-slate-800 text-slate-100 rounded-lg h-9 text-xs"
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount"
                    className="bg-slate-900 border-slate-800 text-slate-100 rounded-lg h-9 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <Button
                    type="button"
                    onClick={handleAddCharge}
                    className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 h-9 rounded-lg px-2"
                  >
                    <Plus className="h-4 w-4 text-cyan-400" />
                  </Button>
                </div>
              </div>

              {/* Added charges list */}
              {additionalCharges.length > 0 && (
                <div className="rounded-lg border border-slate-900 bg-slate-950 p-2 space-y-1.5 max-h-[120px] overflow-y-auto">
                  {additionalCharges.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-300 text-xs py-1 border-b border-slate-900/60 last:border-b-0">
                      <span>{item.description}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">Rs. {item.amount.toLocaleString()}</span>
                        <Trash2
                          onClick={() => handleRemoveCharge(idx)}
                          className="h-3.5 w-3.5 text-red-500 hover:text-red-400 cursor-pointer"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method selector */}
            <div className="space-y-1.5">
              <Label htmlFor="payment" className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                Settlement Payment Gateway *
              </Label>
              <select
                id="payment"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs p-2.5 h-10 outline-none cursor-pointer focus:border-emerald-500"
              >
                <option value="cash">Cash (NPR)</option>
                <option value="card">Credit / Debit Card</option>
                <option value="esewa">eSewa Wallet (Nepal)</option>
                <option value="khalti">Khalti Wallet (Nepal)</option>
                <option value="fonepay">Fonepay QR scan</option>
                <option value="bank_transfer">Direct Bank Transfer</option>
                <option value="split">Split Payment (Group/Multiple)</option>
              </select>
            </div>

            {/* Split allocations section */}
            {paymentMethod === "split" && (
              <div className="space-y-3 border border-slate-900 bg-slate-900/10 p-3.5 rounded-xl">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Split Payment Allocations</h4>
                  <Button
                    type="button"
                    onClick={handleAddSplitRow}
                    className="bg-emerald-850 text-emerald-400 hover:bg-emerald-800 border border-emerald-800/40 text-[10px] h-7 px-2.5 rounded-md flex items-center gap-1 font-bold"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Allocation
                  </Button>
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {splits.map((split, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-900 p-2.5 rounded-xl space-y-2 relative">
                      {splits.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSplitRow(idx)}
                          className="absolute right-2 top-2 text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 font-bold uppercase">Payment Method</label>
                          <select
                            value={split.payment_method}
                            onChange={(e) => handleUpdateSplitRow(idx, "payment_method", e.target.value)}
                            className="w-full rounded-md bg-slate-900 border border-slate-800 text-slate-300 text-[10px] p-1.5 h-8 outline-none focus:border-emerald-500"
                          >
                            <option value="cash">Cash (NPR)</option>
                            <option value="card">Credit/Debit Card</option>
                            <option value="esewa">eSewa Wallet</option>
                            <option value="khalti">Khalti Wallet</option>
                            <option value="fonepay">Fonepay QR</option>
                            <option value="bank_transfer">Bank Transfer</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 font-bold uppercase">Amount (NPR)</label>
                          <Input
                            type="number"
                            value={split.amount}
                            onChange={(e) => handleUpdateSplitRow(idx, "amount", e.target.value)}
                            placeholder="e.g. 5000"
                            className="bg-slate-900 border-slate-800 text-slate-100 rounded-md h-8 text-[10px]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 font-bold uppercase">Reference No.</label>
                          <Input
                            value={split.reference}
                            onChange={(e) => handleUpdateSplitRow(idx, "reference", e.target.value)}
                            placeholder="e.g. REF-1234"
                            className="bg-slate-900 border-slate-800 text-slate-100 rounded-md h-8 text-[9px]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 font-bold uppercase">Allocation Description</label>
                          <Input
                            value={split.description}
                            onChange={(e) => handleUpdateSplitRow(idx, "description", e.target.value)}
                            placeholder="e.g. Guest A portion"
                            className="bg-slate-900 border-slate-800 text-slate-100 rounded-md h-8 text-[9px]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-slate-900">
                  <span className="text-slate-400">Total Allocated:</span>
                  <span className={`font-bold ${isAllocationValid ? "text-emerald-400" : "text-amber-500"}`}>
                    Rs. {totalAllocated.toLocaleString()} / Rs. {remainingBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Feedback Rating & Comments */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rating" className="text-slate-400 font-bold uppercase text-[10px]">
                  Feedback Rating
                </Label>
                <select
                  id="rating"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs p-2.5 h-10 outline-none cursor-pointer"
                >
                  <option value={5}>5 ★ - Excellent</option>
                  <option value={4}>4 ★ - Very Good</option>
                  <option value={3}>3 ★ - Average</option>
                  <option value={2}>2 ★ - Poor</option>
                  <option value={1}>1 ★ - Bad</option>
                </select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="comment" className="text-slate-400 font-bold uppercase text-[10px]">
                  Feedback Comment
                </Label>
                <Input
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g. Guest loved the balcony view, smooth service."
                  className="bg-slate-900 border-slate-800 text-slate-100 rounded-lg h-10"
                />
              </div>
            </div>

            {/* Billing Estimations */}
            <div className="rounded-xl border border-slate-900 bg-slate-950 p-4 space-y-2 text-xs">
              <h4 className="font-extrabold text-cyan-400 uppercase tracking-wider text-[10px]">Final Billing Aggregations</h4>
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Room Stay Charges (with VAT)</span>
                  <span>Rs. {roomTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Additional Services Total</span>
                  <span>Rs. {additionalTotal.toLocaleString()}</span>
                </div>
                {depositPaid > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>Advance Deposit Paid</span>
                    <span>- Rs. {depositPaid.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-white pt-1.5 border-t border-slate-900">
                  <span>Grand Total Amount</span>
                  <span className="text-white">Rs. {grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-white pt-1.5 border-t border-slate-900">
                  <span>{paymentMethod === "split" ? "Remaining Balance to Split" : "Amount to Settle Now"}</span>
                  <span className="text-emerald-400">Rs. {remainingBalance.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-slate-900/60">
            <Button
              type="button"
              onClick={onClose}
              variant="ghost"
              className="border border-slate-800 text-slate-400 hover:text-white rounded-lg h-10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || (paymentMethod === "split" && !isAllocationValid)}
              className="bg-gradient-to-tr from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-lg h-10 px-5 gap-1.5 shadow-lg shadow-emerald-500/10"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  Processing Checkout...
                </>
              ) : (
                "Settle Bill & Check Out"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
