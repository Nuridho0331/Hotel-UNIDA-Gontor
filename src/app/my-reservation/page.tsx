"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Reservation = {
  id: string;
  bookingCode: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: string;
  room: { roomNumber: string; roomType: { name: string } };
};

const money = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const date = (s: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(s));

export default function MyReservationPage() {
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/reservations", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Gagal memuat reservasi.");
        return result.reservations as Reservation[];
      })
      .then((reservations) => { if (active) setItems(reservations); })
      .catch((reason) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f4ef] px-6 pb-20 pt-32 text-neutral-900">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium uppercase tracking-widest text-amber-800">Hotel UNIDA Gontor</p>
        <h1 className="mt-3 text-4xl font-semibold">Reservasi Saya</h1>
        <p className="mt-3 text-neutral-600">Pantau status pemesanan dan pembayaran DP Anda.</p>
        {loading && <p className="mt-10">Memuat reservasi...</p>}
        {error && <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center">
            <p>Anda belum memiliki reservasi.</p>
            <Link href="/rooms" className="mt-4 inline-block font-semibold text-amber-900 underline">Lihat kamar</Link>
          </div>
        )}
        <div className="mt-8 grid gap-5">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-neutral-500">Kode booking: {item.bookingCode}</p>
                  <h2 className="mt-1 text-xl font-semibold">{item.room.roomType.name}</h2>
                  <p className="mt-2 text-sm text-neutral-600">{date(item.checkIn)} – {date(item.checkOut)}</p>
                  <p className="mt-1 text-sm text-neutral-600">Unit {item.room.roomNumber}</p>
                </div>
                <span className="rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-900">{item.status.replaceAll("_", " ")}</span>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-100 pt-5">
                <strong>{money(item.totalPrice)}</strong>
                <Link href={`/my-reservation/${item.id}`} className="rounded-lg bg-amber-900 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-950">Lihat Detail</Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
