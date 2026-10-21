
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";

type Payment = {
  id: string;
  type: string;
  amount: number;
  method: string | null;
  status: string;
  proofImage: string | null;
  notes: string | null;
};

type Reservation = {
  id: string;
  bookingCode: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  totalPrice: number;
  dpAmount: number;
  status: string;
  room: {
    roomNumber: string;
    roomType: {
      name: string;
    };
  };
  payments: Payment[];
};

type ReservationResult = {
  id: string;
  reservation: Reservation | null;
  error: string;
};

const MAX_FILE = 700 * 1024;

function money(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function date(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

async function fetchReservation(
  id: string
): Promise<Reservation> {
  const response = await fetch(
    `/api/reservations/${id}`,
    { cache: "no-store" }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "Tidak dapat mengambil reservasi."
    );
  }

  return result.reservation as Reservation;
}

export default function ReservationDetailPage() {
  const params = useParams();

  const id =
    typeof params.id === "string" ? params.id : "";

  const [result, setResult] =
    useState<ReservationResult | null>(null);

  const [method, setMethod] =
    useState<"TRANSFER" | "QRIS">("TRANSFER");

  const [proof, setProof] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loading = Boolean(id) && result?.id !== id;

  const item =
    result?.id === id ? result.reservation : null;

  const loadError =
    !id
      ? "ID reservasi tidak valid."
      : result?.id === id
        ? result.error
        : "";

  useEffect(() => {
    if (!id) return;

    let active = true;

    fetchReservation(id)
      .then((reservation) => {
        if (active) {
          setResult({
            id,
            reservation,
            error: "",
          });
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setResult({
            id,
            reservation: null,
            error:
              reason instanceof Error
                ? reason.message
                : "Tidak dapat mengambil reservasi.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  function chooseProof(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    setProof("");
    setMessage("");
    setError("");

    if (!file) return;

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(
        file.type
      ) ||
      file.size > MAX_FILE
    ) {
      setError(
        "Pilih gambar JPG, PNG, atau WebP maksimal 700 KB."
      );
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProof(reader.result);
      }
    };

    reader.onerror = () => {
      setError("Gagal membaca gambar.");
    };

    reader.readAsDataURL(file);
  }

  async function sendProof() {
    if (!item || !proof || sending) return;

    setSending(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/reservations/${item.id}/payment-proof`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            method,
            proofImage: proof,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Gagal mengirim bukti pembayaran."
        );
      }

      setProof("");
      setMessage(data.message);

      const updated = await fetchReservation(item.id);

      setResult({
        id: item.id,
        reservation: updated,
        error: "",
      });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Gagal mengirim bukti pembayaran."
      );
    } finally {
      setSending(false);
    }
  }

  const dp = item?.payments.find(
    (payment) => payment.type === "DP"
  );

  const canUpload =
    item?.status === "PENDING_DP" &&
    (dp?.status === "UNPAID" ||
      dp?.status === "REJECTED");

  return (
    <main className="min-h-screen bg-[#f7f4ef] px-6 pb-20 pt-32 text-neutral-900">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/my-reservation"
          className="text-sm font-semibold text-amber-900 hover:underline"
        >
          ← Kembali ke reservasi
        </Link>

        <h1 className="mt-5 text-4xl font-semibold">
          Detail Reservasi
        </h1>

        {loading && (
          <p className="mt-8">Memuat reservasi...</p>
        )}

        {(loadError || error) && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {loadError || error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            {message}
          </div>
        )}

        {item && (
          <div className="mt-8 space-y-6">
            <section className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="text-sm text-neutral-500">
                    Kode Booking
                  </p>

                  <strong className="text-lg">
                    {item.bookingCode}
                  </strong>
                </div>

                <span className="h-fit rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900">
                  {item.status.replaceAll("_", " ")}
                </span>
              </div>

              <div className="mt-6 grid gap-5 border-t border-neutral-100 pt-6 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-neutral-500">
                    Tipe kamar
                  </p>
                  <p className="font-semibold">
                    {item.room.roomType.name}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-neutral-500">
                    Nomor unit
                  </p>
                  <p className="font-semibold">
                    {item.room.roomNumber}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-neutral-500">
                    Check-in
                  </p>
                  <p className="font-semibold">
                    {date(item.checkIn)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-neutral-500">
                    Check-out
                  </p>
                  <p className="font-semibold">
                    {date(item.checkOut)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-neutral-500">
                    Jumlah tamu
                  </p>
                  <p className="font-semibold">
                    {item.guestCount}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-neutral-500">
                    Total tagihan
                  </p>
                  <p className="font-semibold">
                    {money(item.totalPrice)}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
              <h2 className="text-xl font-semibold">
                Pembayaran Uang Muka (DP)
              </h2>

              <div className="mt-5 flex flex-wrap justify-between gap-3 rounded-xl bg-amber-50 p-5 text-amber-950">
                <span>DP reservasi</span>
                <strong className="text-xl">
                  {money(item.dpAmount)}
                </strong>
              </div>

              <p className="mt-3 text-sm text-neutral-600">
                Status DP:{" "}
                <strong>
                  {dp?.status ?? "BELUM DICATAT"}
                </strong>
              </p>

              <p className="mt-2 text-sm text-neutral-600">
                Sisa pelunasan saat check-in:{" "}
                <strong>
                  {money(
                    Math.max(
                      0,
                      item.totalPrice - item.dpAmount
                    )
                  )}
                </strong>
              </p>

              {item.status ===
                "WAITING_DP_VERIFICATION" && (
                <p className="mt-5 rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
                  Bukti DP telah dikirim. Tunggu
                  verifikasi admin hotel.
                </p>
              )}

              {item.status === "CONFIRMED" && (
                <p className="mt-5 rounded-lg bg-green-50 p-4 text-sm text-green-900">
                  Reservasi telah dikonfirmasi admin hotel.
                </p>
              )}

              {canUpload && (
                <div className="mt-7 space-y-4 border-t border-neutral-100 pt-6">
                  <p className="text-sm text-neutral-600">
                    Lakukan pembayaran DP sesuai
                    instruksi resmi Hotel UNIDA Gontor,
                    lalu unggah bukti transaksi di sini.
                    Pastikan rekening tujuan kepada pihak
                    hotel terlebih dahulu.
                  </p>

                  {dp?.status === "REJECTED" && (
                    <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                      Bukti sebelumnya ditolak.{" "}
                      {dp.notes ||
                        "Silakan kirim bukti yang benar."}
                    </p>
                  )}

                  <label
                    htmlFor="method"
                    className="block text-sm font-semibold"
                  >
                    Metode pembayaran
                  </label>

                  <select
                    id="method"
                    className="w-full rounded-xl border border-neutral-300 bg-white p-3"
                    value={method}
                    onChange={(event) =>
                      setMethod(
                        event.target.value as
                          | "TRANSFER"
                          | "QRIS"
                      )
                    }
                  >
                    <option value="TRANSFER">
                      Transfer bank
                    </option>
                    <option value="QRIS">QRIS</option>
                  </select>

                  <label
                    htmlFor="proof"
                    className="block text-sm font-semibold"
                  >
                    Bukti pembayaran (JPG, PNG, WebP;
                    maks. 700 KB)
                  </label>

                  <input
                    id="proof"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={chooseProof}
                    className="block w-full rounded-xl border border-neutral-300 bg-white p-3 text-sm"
                  />

                  <button
                    type="button"
                    disabled={!proof || sending}
                    onClick={sendProof}
                    className="rounded-xl bg-amber-900 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending
                      ? "Mengirim..."
                      : "Kirim Bukti DP"}
                  </button>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
