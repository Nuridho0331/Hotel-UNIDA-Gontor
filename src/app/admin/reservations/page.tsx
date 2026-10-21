
"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";

type Payment = {
  id: string;
  type: "DP" | "SETTLEMENT";
  amount: number;
  status: string;
  method: string | null;
  proofImage: string | null;
  notes: string | null;
};

type Reservation = {
  id: string;
  bookingCode: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  dpAmount: number;
  status: string;
  user: {
    name: string;
    email: string;
    phone?: string | null;
  };
  room: {
    roomNumber: string;
    roomType: {
      name: string;
    };
  };
  payments?: Payment[];
};

type AdminAction =
  | "VERIFY_DP"
  | "REJECT_DP"
  | "CHECK_IN"
  | "CHECK_OUT";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] =
    useState<Reservation[]>([]);

  const [selected, setSelected] =
    useState<Reservation | null>(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reason, setReason] = useState("");

  const [method, setMethod] =
    useState<"CASH" | "TRANSFER" | "QRIS">("CASH");

  async function loadReservations() {
    const response = await fetch(
      "/api/admin/reservations",
      { cache: "no-store" }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Gagal mengambil reservasi."
      );
    }

    setReservations(data.reservations);
  }

  async function loadDetail(id: string) {
    const response = await fetch(
      `/api/admin/reservations?id=${encodeURIComponent(id)}`,
      { cache: "no-store" }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Gagal mengambil detail reservasi."
      );
    }

    setSelected(data.reservation);
  }

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      try {
        const response = await fetch(
          "/api/admin/reservations",
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Gagal mengambil reservasi."
          );
        }

        if (active) {
          setReservations(data.reservations);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal memuat reservasi."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void initialLoad();

    return () => {
      active = false;
    };
  }, []);

  async function selectReservation(id: string) {
    try {
      setError("");
      setSuccess("");
      setReason("");
      await loadDetail(id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil detail."
      );
    }
  }

  async function runAction(action: AdminAction) {
    if (!selected || busy) return;

    if (action === "VERIFY_DP") {
      const confirmed = window.confirm(
        "Pastikan DP benar-benar masuk ke rekening hotel. Setujui pembayaran?"
      );

      if (!confirmed) return;
    }

    if (action === "CHECK_IN") {
      const confirmed = window.confirm(
        "Pastikan tamu sudah datang dan sisa pembayaran sudah diterima. Lanjut check-in?"
      );

      if (!confirmed) return;
    }

    if (action === "CHECK_OUT") {
      const confirmed = window.confirm(
        "Pastikan tamu sudah check-out dan kamar telah kosong. Lanjutkan?"
      );

      if (!confirmed) return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/admin/reservations",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: selected.id,
            action,
            method,
            notes: reason,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Gagal memproses reservasi."
        );
      }

      setSuccess(data.message);
      setReason("");

      await loadReservations();
      await loadDetail(selected.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memperbarui reservasi."
      );
    } finally {
      setBusy(false);
    }
  }

  const dp = selected?.payments?.find(
    (payment) => payment.type === "DP"
  );

  const settlement = selected?.payments?.find(
    (payment) => payment.type === "SETTLEMENT"
  );

  const canVerify =
    selected?.status === "WAITING_DP_VERIFICATION" &&
    dp?.status === "PENDING";

  const canCheckIn =
    selected?.status === "CONFIRMED" &&
    dp?.status === "VERIFIED";

  const canCheckOut =
    selected?.status === "CHECKED_IN" &&
    settlement?.status === "VERIFIED";

  return (
    <main className="min-h-screen bg-[#f7f4ef] px-5 pb-20 pt-32 text-neutral-900">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin"
          className="text-sm font-medium text-amber-900 hover:underline"
        >
          ← Kembali ke Dashboard
        </Link>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-800">
            Hotel UNIDA Gontor
          </p>

          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
            Manajemen Reservasi
          </h1>

          <p className="mt-3 text-sm text-neutral-600">
            Kelola pembayaran DP, check-in,
            pelunasan, dan check-out tamu hotel.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            {success}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          {/* DAFTAR RESERVASI */}
          <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b p-6">
              <h2 className="text-lg font-semibold">
                Daftar Reservasi
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Menampilkan maksimal 100 reservasi terbaru.
              </p>
            </div>

            {loading && (
              <p className="p-6 text-neutral-500">
                Memuat reservasi...
              </p>
            )}

            {!loading && reservations.length === 0 && (
              <p className="p-6 text-neutral-500">
                Belum ada reservasi.
              </p>
            )}

            <div className="max-h-[700px] divide-y overflow-y-auto">
              {reservations.map((reservation) => (
                <button
                  key={reservation.id}
                  type="button"
                  onClick={() =>
                    void selectReservation(reservation.id)
                  }
                  className={`block w-full p-6 text-left transition hover:bg-amber-50 ${
                    selected?.id === reservation.id
                      ? "bg-amber-50"
                      : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <strong className="text-sm">
                      {reservation.bookingCode}
                    </strong>

                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
                      {formatStatus(reservation.status)}
                    </span>
                  </div>

                  <h3 className="mt-3 font-semibold">
                    {reservation.user.name}
                  </h3>

                  <p className="mt-1 text-sm text-neutral-600">
                    {reservation.room.roomType.name}
                    {" · "}Unit {reservation.room.roomNumber}
                  </p>

                  <p className="mt-2 text-xs text-neutral-500">
                    {formatDate(reservation.checkIn)}
                    {" – "}
                    {formatDate(reservation.checkOut)}
                  </p>

                  <p className="mt-3 font-semibold text-amber-900">
                    {formatRupiah(reservation.totalPrice)}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* DETAIL RESERVASI */}
          <section className="h-fit rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            {!selected ? (
              <div className="py-14 text-center">
                <h2 className="text-lg font-semibold">
                  Detail Reservasi
                </h2>

                <p className="mt-3 text-sm text-neutral-500">
                  Pilih reservasi di sebelah kiri
                  untuk melihat detail dan tindakan admin.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-amber-800">
                    Detail Reservasi
                  </p>

                  <h2 className="mt-2 text-xl font-semibold">
                    {selected.bookingCode}
                  </h2>

                  <span className="mt-3 inline-block rounded-full bg-amber-50 px-4 py-2 text-xs font-medium text-amber-900">
                    {formatStatus(selected.status)}
                  </span>
                </div>

                <div className="space-y-2 border-t pt-5 text-sm">
                  <p>
                    <strong>Tamu:</strong>{" "}
                    {selected.user.name}
                  </p>

                  <p>
                    <strong>Email:</strong>{" "}
                    {selected.user.email}
                  </p>

                  {selected.user.phone && (
                    <p>
                      <strong>Telepon:</strong>{" "}
                      {selected.user.phone}
                    </p>
                  )}

                  <p>
                    <strong>Kamar:</strong>{" "}
                    {selected.room.roomType.name}
                  </p>

                  <p>
                    <strong>Unit:</strong>{" "}
                    {selected.room.roomNumber}
                  </p>

                  <p>
                    <strong>Check-in:</strong>{" "}
                    {formatDate(selected.checkIn)}
                  </p>

                  <p>
                    <strong>Check-out:</strong>{" "}
                    {formatDate(selected.checkOut)}
                  </p>
                </div>

                <div className="rounded-xl bg-neutral-50 p-5">
                  <p className="text-sm text-neutral-500">
                    Total Tagihan
                  </p>

                  <p className="mt-1 text-2xl font-semibold">
                    {formatRupiah(selected.totalPrice)}
                  </p>

                  <div className="mt-4 space-y-2 border-t pt-4 text-sm">
                    <div className="flex justify-between gap-3">
                      <span>DP</span>
                      <strong>
                        {formatRupiah(selected.dpAmount)}
                      </strong>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span>Sisa Pelunasan</span>
                      <strong>
                        {formatRupiah(
                          Math.max(
                            0,
                            selected.totalPrice - selected.dpAmount
                          )
                        )}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border p-5">
                  <h3 className="font-semibold">
                    Pembayaran DP
                  </h3>

                  <p className="mt-2 text-sm">
                    Status: {dp?.status || "-"}
                  </p>

                  <p className="mt-1 text-sm">
                    Metode: {dp?.method || "-"}
                  </p>

                  {dp?.notes && (
                    <p className="mt-2 text-sm text-red-700">
                      Catatan: {dp.notes}
                    </p>
                  )}

                  {dp?.proofImage && (
                    <div className="mt-5">
                      <p className="mb-3 text-sm text-neutral-500">
                        Bukti pembayaran tamu
                      </p>

                      <img
                        src={dp.proofImage}
                        alt="Bukti pembayaran DP"
                        className="max-h-80 w-full rounded-lg border object-contain"
                      />

                      <p className="mt-3 text-xs text-neutral-500">
                        Periksa mutasi rekening hotel
                        sebelum menyetujui DP.
                      </p>
                    </div>
                  )}
                </div>

                {/* VERIFIKASI DP */}
                {canVerify && (
                  <div className="space-y-3 border-t pt-5">
                    <h3 className="font-semibold">
                      Verifikasi Pembayaran
                    </h3>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void runAction("VERIFY_DP")
                      }
                      className="w-full rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Setujui Pembayaran DP
                    </button>

                    <label
                      htmlFor="reason"
                      className="block text-sm font-medium"
                    >
                      Alasan penolakan
                    </label>

                    <textarea
                      id="reason"
                      value={reason}
                      onChange={(e) =>
                        setReason(e.target.value)
                      }
                      rows={3}
                      placeholder="Tuliskan alasan penolakan..."
                      className="w-full rounded-xl border p-3 text-sm"
                    />

                    <button
                      type="button"
                      disabled={busy || reason.trim().length < 5}
                      onClick={() =>
                        void runAction("REJECT_DP")
                      }
                      className="w-full rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 disabled:opacity-50"
                    >
                      Tolak Pembayaran DP
                    </button>
                  </div>
                )}

                {/* CHECK-IN DAN PELUNASAN */}
                {canCheckIn && (
                  <div className="space-y-4 border-t pt-5">
                    <h3 className="font-semibold">
                      Proses Check-in
                    </h3>

                    <p className="text-sm text-neutral-600">
                      Pastikan tamu sudah datang dan
                      sisa pelunasan telah diterima.
                    </p>

                    <label
                      htmlFor="paymentMethod"
                      className="block text-sm font-medium"
                    >
                      Metode Pelunasan
                    </label>

                    <select
                      id="paymentMethod"
                      value={method}
                      onChange={(e) =>
                        setMethod(
                          e.target.value as
                            | "CASH"
                            | "TRANSFER"
                            | "QRIS"
                        )
                      }
                      className="w-full rounded-xl border bg-white p-3"
                    >
                      <option value="CASH">Tunai</option>
                      <option value="TRANSFER">
                        Transfer Bank
                      </option>
                      <option value="QRIS">QRIS</option>
                    </select>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void runAction("CHECK_IN")
                      }
                      className="w-full rounded-xl bg-amber-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Catat Pelunasan & Check-in
                    </button>
                  </div>
                )}

                {/* CHECK-OUT */}
                {canCheckOut && (
                  <div className="space-y-3 border-t pt-5">
                    <h3 className="font-semibold">
                      Proses Check-out
                    </h3>

                    <p className="text-sm text-neutral-600">
                      Pastikan tamu sudah meninggalkan
                      kamar dan kamar telah kosong.
                    </p>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void runAction("CHECK_OUT")
                      }
                      className="w-full rounded-xl bg-amber-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Proses Check-out
                    </button>
                  </div>
                )}

                {selected.status === "CHECKED_OUT" && (
                  <div className="rounded-xl bg-green-50 p-4 text-sm text-green-800">
                    Reservasi telah selesai.
                    Tamu sudah check-out.
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
