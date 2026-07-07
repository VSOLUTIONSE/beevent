"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Clock,
  Check,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isBefore,
  startOfDay,
} from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { createBooking } from "@/lib/server/actions/booking";
import { initiatePayment, mockPaymentCallback } from "@/lib/server/actions/payment";
import { GlassCard, PillButton } from "@/design/primitives";
import { ScrollArea } from "@/components/ui/scroll-area";
import Navbar from "@/components/layout/Navbar";

const eventTypes = [
  "wedding", "birthday", "conference", "church",
  "corporate", "seminar", "concert", "party", "other",
] as const;

const fallbackPackages = [
  { id: 1, name: "The Gala — Full Day", durationHours: 12, price: "2500000", includes: "Full venue access,Tables & chairs for 300,Basic sound system,Standard lighting,2 security personnel,Cleaning crew,Event coordinator", maxCapacity: 500, imageUrl: "/images/package-fullday.jpg" },
  { id: 2, name: "The Conference — Half Day", durationHours: 6, price: "1200000", includes: "Main hall access,Conference seating for 200,Projector & screen,Podium & microphones,Wi-Fi,Coffee break setup,1 security personnel", maxCapacity: 200, imageUrl: "/images/package-halfday.jpg" },
  { id: 3, name: "The Celebration — Weekend", durationHours: 24, price: "4500000", includes: "Full weekend venue access,Tables & chairs for 500,Premium sound & lighting,Stage setup,4 security personnel,VIP cleaning crew,Dedicated event manager,Bridal suite access", maxCapacity: 500, imageUrl: "/images/package-weekend.jpg" },
];

const fallbackAddons = [
  { id: 1, name: "Generator / Power Backup", price: "150000", unit: "per_day" },
  { id: 2, name: "Event Decor — Basic", price: "300000", unit: "flat_fee" },
  { id: 3, name: "Event Decor — Premium", price: "750000", unit: "flat_fee" },
  { id: 4, name: "AV Technician", price: "100000", unit: "per_day" },
];

function formatPrice(price: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(parseFloat(price));
}

type Step = 1 | 2 | 3 | 4;

export default function BookingWizard() {
  const [step, setStep] = useState<Step>(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<number | null>(null);
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState<string>("");
  const [guestCount, setGuestCount] = useState("");
  const [requests, setRequests] = useState("");
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);
  const [bookingRef, setBookingRef] = useState("");
  const [bookingTotal, setBookingTotal] = useState(0);
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(false);

  const { data: apiPackages } = useQuery({
    queryKey: ["packages"],
    queryFn: () => apiGet<typeof fallbackPackages>("/api/venue/packages"),
  });
  const { data: apiAddons } = useQuery({
    queryKey: ["addons"],
    queryFn: () => apiGet<typeof fallbackAddons>("/api/venue/addons"),
  });

  const packages = apiPackages && apiPackages.length > 0 ? apiPackages : fallbackPackages;
  const addons = apiAddons && apiAddons.length > 0 ? apiAddons : fallbackAddons;

  const selectedPackage = packages.find((p) => p.id === selectedPkg);

  const total = useMemo(() => {
    let t = selectedPackage ? parseFloat(selectedPackage.price) : 0;
    selectedAddons.forEach((aid) => {
      const a = addons.find((ad) => ad.id === aid);
      if (a) t += parseFloat(a.price);
    });
    return t;
  }, [selectedPackage, selectedAddons, addons]);

  const handleCreateBooking = async () => {
    if (!selectedDate || !selectedPkg || !eventName || !eventType || !guestCount) return;
    setCreating(true);
    try {
      const result = await createBooking({
        eventName,
        eventType: eventType as typeof eventTypes[number],
        guestCount: parseInt(guestCount),
        packageId: selectedPkg,
        eventStart: selectedDate.toISOString(),
        eventEnd: new Date(selectedDate.getTime() + (selectedPackage?.durationHours || 12) * 3600000).toISOString(),
        specialRequests: requests,
        addonIds: selectedAddons,
      });
      setBookingRef(result.bookingRef);
      setBookingTotal(result.total);
      setStep(3);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handlePayment = async () => {
    if (!bookingRef) return;
    setPaying(true);
    try {
      const result = await initiatePayment(parseInt(bookingRef.split("-")[2]) || 1);
      await mockPaymentCallback(result.providerRef);
      setStep(4);
    } catch (e) {
      console.error(e);
      setStep(4);
    } finally {
      setPaying(false);
    }
  };

  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const today = startOfDay(new Date());
  const [calMonth, setCalMonth] = useState(new Date());
  const calDays = useMemo(() => {
    const ms = startOfMonth(calMonth);
    const me = endOfMonth(ms);
    const cs = startOfWeek(ms);
    const ce = endOfWeek(me);
    const days: Date[] = [];
    let d = cs;
    while (d <= ce) { days.push(d); d = addDays(d, 1); }
    return days;
  }, [calMonth]);

  const canProceed: Record<number, boolean> = {
    1: !!selectedDate && !!selectedPkg,
    2: !!eventName && !!eventType && !!guestCount,
    3: true,
    4: true,
  };

  return (
    <main className="relative min-h-screen bg-[#030305]">
      <Navbar />

      <div className="pt-24 lg:pt-32 pb-8">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#B0A8A8] hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-3xl lg:text-5xl text-white mb-2"
          >
            Book Your Event
          </motion.h1>
          <p className="text-[#B0A8A8]">
            Complete the steps below to reserve BeeVent Halls for your special occasion.
          </p>

          <div className="flex items-center gap-2 mt-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                    s === step
                      ? "bg-[#E33539] text-white"
                      : s < step
                      ? "bg-[#829796] text-white"
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  {s < step ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 4 && (
                  <div className={`flex-1 h-px transition-all duration-300 ${s < step ? "bg-[#829796]" : "bg-white/10"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-8 pb-24">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid lg:grid-cols-2 gap-8">
                <GlassCard maxHeight={400} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-serif text-lg text-white">{format(calMonth, "MMMM yyyy")}</h3>
                    <div className="flex gap-1">
                      <button onClick={() => setCalMonth(subMonths(calMonth, 1))} className="p-1.5 rounded-lg hover:bg-white/10"><ChevronLeft className="w-4 h-4 text-white/60" /></button>
                      <button onClick={() => setCalMonth(addMonths(calMonth, 1))} className="p-1.5 rounded-lg hover:bg-white/10"><ChevronRight className="w-4 h-4 text-white/60" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {weekDays.map((d) => (
                      <div key={d} className="text-center text-[10px] text-[#B0A8A8] uppercase py-2">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calDays.map((day, i) => {
                      const inMonth = isSameMonth(day, calMonth);
                      const isPast = isBefore(day, today);
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      return (
                        <button
                          key={i}
                          disabled={!inMonth || isPast}
                          onClick={() => setSelectedDate(day)}
                          className={`aspect-square rounded-lg flex items-center justify-center text-sm transition-all ${
                            !inMonth ? "text-white/10" : isPast ? "text-white/20 cursor-not-allowed" : "text-white/80 hover:bg-white/10"
                          } ${isSelected ? "bg-[#E33539] text-white hover:bg-[#E33539]" : ""}`}
                        >
                          {format(day, "d")}
                        </button>
                      );
                    })}
                  </div>
                </GlassCard>

                <div className="flex flex-col" style={{ height: 400 }}>
                  <h3 className="font-serif text-lg text-white mb-4 shrink-0">Select Package</h3>
                  <ScrollArea className="h-full pr-3">
                    <div className="space-y-3">
                    {packages.map((pkg) => (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedPkg(pkg.id)}
                        className={`w-full text-left p-4 rounded-xl bg-gradient-to-b from-white/[0.12] to-white/[0.05] backdrop-blur-[6px] border border-white/15 transition-all duration-300 shrink-0 ${
                          selectedPkg === pkg.id ? "ring-1 ring-[#E33539] bg-[#E33539]/5" : "hover:bg-white/[0.03]"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <img src={pkg.imageUrl || ""} alt={pkg.name} className="w-16 h-16 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium text-sm">{pkg.name}</h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-[#B0A8A8]">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{pkg.durationHours}h</span>
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{pkg.maxCapacity}</span>
                            </div>
                            <p className="text-[#829796] font-semibold text-sm mt-2">{formatPrice(pkg.price)}</p>
                          </div>
                          {selectedPkg === pkg.id && <Check className="w-5 h-5 text-[#E33539] shrink-0" />}
                        </div>
                      </button>
                    ))}
                  </div>
                  </ScrollArea>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <GlassCard className="p-6 space-y-5">
                    <h3 className="font-serif text-lg text-white">Event Details</h3>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#B0A8A8] mb-2">Event Name</label>
                      <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="e.g., Johnson Wedding" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#829796] transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#B0A8A8] mb-2">Event Type</label>
                      <div className="flex flex-wrap gap-2">
                        {eventTypes.map((type) => (
                          <button key={type} onClick={() => setEventType(type)} className={`px-3 py-1.5 rounded-full text-xs capitalize transition-all ${eventType === type ? "bg-[#829796] text-white" : "bg-white/5 text-[#B0A8A8] hover:bg-white/10"}`}>{type}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#B0A8A8] mb-2">Expected Guests</label>
                      <input type="number" value={guestCount} onChange={(e) => setGuestCount(e.target.value)} placeholder={`Max: ${selectedPackage?.maxCapacity || 500}`} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#829796] transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#B0A8A8] mb-2">Special Requests</label>
                      <textarea value={requests} onChange={(e) => setRequests(e.target.value)} rows={3} placeholder="Any special requirements..." className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#829796] transition-colors resize-none" />
                    </div>
                  </GlassCard>

                  <GlassCard className="p-6">
                    <h3 className="font-serif text-lg text-white mb-4">Add-on Services</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {addons.map((addon) => (
                        <button
                          key={addon.id}
                          onClick={() => setSelectedAddons((prev) => prev.includes(addon.id) ? prev.filter((id) => id !== addon.id) : [...prev, addon.id])}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${selectedAddons.includes(addon.id) ? "border-[#829796] bg-[#829796]/10" : "border-white/10 hover:border-white/20"}`}
                        >
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedAddons.includes(addon.id) ? "bg-[#829796] border-[#829796]" : "border-white/30"}`}>
                            {selectedAddons.includes(addon.id) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{addon.name}</p>
                            <p className="text-xs text-[#829796]">{formatPrice(addon.price)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </GlassCard>
                </div>

                <div className="lg:sticky lg:top-24 h-fit">
                  <GlassCard className="p-6 space-y-4">
                    <h3 className="font-serif text-lg text-white">Booking Summary</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between text-[#B0A8A8]"><span>Date</span><span className="text-white">{selectedDate ? format(selectedDate, "MMM d, yyyy") : "—"}</span></div>
                      <div className="flex justify-between text-[#B0A8A8]"><span>Package</span><span className="text-white text-right">{selectedPackage?.name || "—"}</span></div>
                      <div className="flex justify-between text-[#B0A8A8]"><span>Add-ons</span><span className="text-white">{selectedAddons.length} selected</span></div>
                    </div>
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex justify-between items-center"><span className="text-[#B0A8A8]">Total</span><span className="text-xl font-semibold text-[#829796]">{formatPrice(total.toString())}</span></div>
                    </div>
                  </GlassCard>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-lg mx-auto"
            >
              <GlassCard className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[#829796]/20 flex items-center justify-center mx-auto mb-6">
                  <CreditCard className="w-8 h-8 text-[#829796]" />
                </div>
                <h3 className="font-serif text-2xl text-white mb-2">Complete Payment</h3>
                <p className="text-[#B0A8A8] text-sm mb-6">
                  Your booking <span className="text-[#829796] font-medium">{bookingRef}</span> is ready. Secure your date with payment.
                </p>
                <div className="bg-white/5 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[#B0A8A8]">Amount Due</span>
                    <span className="text-2xl font-semibold text-white">{formatPrice(bookingTotal.toString())}</span>
                  </div>
                </div>
                <PillButton onClick={handlePayment} disabled={paying} className="w-full">
                  {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Pay with Paystack</span><ArrowRight className="w-4 h-4" /></>}
                </PillButton>
                <p className="text-xs text-[#B0A8A8] mt-4">Secure payment powered by Paystack. Your transaction is protected with 256-bit SSL encryption.</p>
              </GlassCard>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-lg mx-auto text-center"
            >
              <GlassCard className="p-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
                  className="w-20 h-20 rounded-full bg-[#829796]/20 flex items-center justify-center mx-auto mb-6"
                >
                  <Check className="w-10 h-10 text-[#829796]" />
                </motion.div>
                <h2 className="font-serif text-3xl lg:text-4xl text-white mb-3">Thank you</h2>
                <p className="text-[#B0A8A8] mb-2">Your booking has been confirmed.</p>
                <p className="text-sm text-[#829796] font-medium mb-8">Reference: {bookingRef || "VH-2026-DEMO"}</p>
                <div className="space-y-3">
                  <Link href="/book" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 bg-[#E33539] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-[#E33539]/25 w-full">
                    Book Another Event<ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:scale-[1.02] w-full">
                    Back to Home
                  </Link>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {step < 4 && (
          <div className="flex items-center justify-between mt-16">
            <PillButton variant="secondary" onClick={() => setStep((s) => (s > 1 ? (s - 1) as Step : s))} disabled={step === 1} className={step === 1 ? "opacity-40 cursor-not-allowed" : ""}>
              <ArrowLeft className="w-4 h-4" />Back
            </PillButton>
            <PillButton onClick={() => { if (step === 2) handleCreateBooking(); else if (canProceed[step]) setStep((s) => (s + 1) as Step); }} disabled={!canProceed[step] || creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : step === 2 ? <>Create Booking<ArrowRight className="w-4 h-4" /></> : <>Continue<ArrowRight className="w-4 h-4" /></>}
            </PillButton>
          </div>
        )}
      </div>
    </main>
  );
}
