
"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";

type RoomType = {
  id: string;
  name: string;
  description: string;
  capacity: number;
  basePrice: number;
  image: string | null;
  totalUnits: number;
  amenities: string[];
};

type AvailabilityResult = {
  available: boolean;
  availableCount: number;
  nights: number;
  basePrice: number;
  totalPrice: number;
  roomType: {
    id: string;
    name: string;
    capacity: number;
  };
};

type RoomResult = {
  id: string;
  room: RoomType | null;
  error: string;
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getToday() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

async function fetchRoom(id: string): Promise<RoomType> {
  const response = await fetch(`/api/rooms/${id}`, {
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Gagal mengambil detail kamar."
    );
  }

  return data as RoomType;
}

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } =
    useSession();

  const isAdmin = session?.user?.role === "ADMIN";

  const id =
    typeof params.id === "string" ? params.id : "";

  const [result, setResult] = useState<RoomResult | null>(
    null
  );

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");

  const [checkingAvailability, setCheckingAvailability] =
    useState(false);

  const [availabilityError, setAvailabilityError] =
    useState("");

  const [availability, setAvailability] =
    useState<AvailabilityResult | null>(null);

  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");

  const today = getToday();

  const loading = Boolean(id) && result?.id !== id;
  const room = result?.id === id ? result.room : null;
  const error =
    !id
      ? "ID kamar tidak valid."
      : result?.id === id
        ? result.error
        : "";

  useEffect(() => {
    if (!id) return;

    let active = true;

    fetchRoom(id)
      .then((data) => {
        if (active) {
          setResult({
            id,
            room: data,
            error: "",
          });
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setResult({
            id,
            room: null,
            error:
              err instanceof Error
                ? err.message
                : "Gagal mengambil detail kamar.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  function resetAvailability() {
    setAvailability(null);
    setAvailabilityError("");
    setBookingError("");
  }

  async function handleCheckAvailability(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!id) return;

    setCheckingAvailability(true);
    resetAvailability();

    try {
      const query = new URLSearchParams({
        checkIn,
        checkOut,
        guests,
      });

      const response = await fetch(
        `/api/rooms/${id}/availability?${query.toString()}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Gagal mengecek ketersediaan."
        );
      }

      setAvailability(data);
    } catch (err) {
      setAvailabilityError(
        err instanceof Error
          ? err.message
          : "Gagal mengecek ketersediaan kamar."
      );
    } finally {
      setCheckingAvailability(false);
    }
  }

  async function handleBooking() {
    if (isAdmin) {
      setBookingError(
        "Admin tidak dapat melakukan reservasi sebagai tamu."
      );
      return;
    }

    if (!availability?.available || !room) return;

    setBooking(true);
    setBookingError("");

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomTypeId: room.id,
          checkIn,
          checkOut,
          guestCount: Number(guests),
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        router.push("/signin");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Gagal membuat reservasi."
        );
      }

      router.push(
        `/my-reservation/${data.reservation.id}`
      );
    } catch (err) {
      setBookingError(
        err instanceof Error
          ? err.message
          : "Gagal membuat reservasi."
      );
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 px-6 pt-32 text-center text-neutral-500">
        Memuat detail kamar...
      </main>
    );
  }

  if (error || !room) {
    return (
      <main className="min-h-screen bg-neutral-50 px-6 pt-32">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl bg-red-50 p-5 text-red-700">
            {error || "Kamar tidak ditemukan."}
          </div>

          <Link
            href="/rooms"
            className="mt-5 inline-block text-amber-900"
          >
            ← Kembali ke daftar kamar
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 pt-24">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <Link
          href="/rooms"
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          ← Kembali ke daftar kamar
        </Link>

        <div className="mt-6 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex aspect-[16/6] items-center justify-center bg-neutral-100">
            {room.image ? (
              <img
                src={room.image}
                alt={room.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-neutral-400">
                Foto kamar belum tersedia
              </span>
            )}
          </div>

          <div className="grid gap-10 p-7 lg:grid-cols-[1fr_380px] lg:p-10">
            <div>
              <p className="text-sm font-medium text-amber-800">
                Hotel UNIDA Gontor
              </p>

              <h1 className="mt-2 text-3xl font-semibold">
                {room.name}
              </h1>

              <div className="mt-4 flex flex-wrap gap-3">
                <span className="rounded-full bg-neutral-100 px-4 py-2 text-sm">
                  Maks. {room.capacity} tamu
                </span>

                <span className="rounded-full bg-neutral-100 px-4 py-2 text-sm">
                  {room.totalUnits} unit kamar
                </span>
              </div>

              <div className="mt-8">
                <h2 className="text-lg font-semibold">
                  Tentang Kamar
                </h2>

                <p className="mt-3 leading-7 text-neutral-600">
                  {room.description}
                </p>
              </div>

              <div className="mt-8">
                <h2 className="text-lg font-semibold">
                  Fasilitas
                </h2>

                {room.amenities.length === 0 ? (
                  <p className="mt-3 text-sm text-neutral-500">
                    Fasilitas belum ditambahkan pada tipe kamar ini.
                  </p>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {room.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="rounded-xl border border-neutral-200 px-4 py-2 text-sm"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <aside className="h-fit rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
              <p className="text-sm text-neutral-500">
                Harga per malam
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {formatRupiah(room.basePrice)}
                <span className="ml-2 text-sm font-normal text-neutral-400">
                  / malam
                </span>
              </p>

              <div className="my-6 border-t" />

              {isAdmin && (
                <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Anda login sebagai ADMIN. Anda boleh
                  mengecek ketersediaan, tetapi tidak
                  melakukan reservasi sebagai tamu.
                </div>
              )}

              {room.totalUnits === 0 && (
                <div className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                  Tipe kamar ini belum memiliki unit fisik
                  yang terdaftar.
                </div>
              )}

              <form
                onSubmit={handleCheckAvailability}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="checkIn"
                    className="mb-2 block text-sm font-medium"
                  >
                    Check-in
                  </label>

                  <input
                    id="checkIn"
                    type="date"
                    value={checkIn}
                    min={today}
                    required
                    onChange={(e) => {
                      setCheckIn(e.target.value);
                      resetAvailability();
                    }}
                    className="w-full rounded-xl border bg-white px-4 py-3"
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkOut"
                    className="mb-2 block text-sm font-medium"
                  >
                    Check-out
                  </label>

                  <input
                    id="checkOut"
                    type="date"
                    value={checkOut}
                    min={checkIn || today}
                    required
                    onChange={(e) => {
                      setCheckOut(e.target.value);
                      resetAvailability();
                    }}
                    className="w-full rounded-xl border bg-white px-4 py-3"
                  />
                </div>

                <div>
                  <label
                    htmlFor="guests"
                    className="mb-2 block text-sm font-medium"
                  >
                    Jumlah Tamu
                  </label>

                  <input
                    id="guests"
                    type="number"
                    min="1"
                    max={room.capacity}
                    value={guests}
                    required
                    onChange={(e) => {
                      setGuests(e.target.value);
                      resetAvailability();
                    }}
                    className="w-full rounded-xl border bg-white px-4 py-3"
                  />

                  <p className="mt-2 text-xs text-neutral-400">
                    Maksimal {room.capacity} tamu
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={checkingAvailability}
                  className="w-full rounded-xl bg-amber-900 py-3 font-medium text-white disabled:opacity-50"
                >
                  {checkingAvailability
                    ? "Mengecek..."
                    : "Cek Ketersediaan"}
                </button>
              </form>

              {availabilityError && (
                <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                  {availabilityError}
                </div>
              )}

              {availability?.available && (
                <div className="mt-5 space-y-4">
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                    <p className="font-medium text-green-800">
                      Kamar tersedia
                    </p>

                    <p className="mt-1 text-sm text-green-700">
                      {availability.availableCount} unit
                      tersedia untuk tanggal yang dipilih.
                    </p>
                  </div>

                  <div className="rounded-xl border bg-white p-4">
                    <p className="text-sm text-neutral-600">
                      {formatRupiah(availability.basePrice)} ×{" "}
                      {availability.nights} malam
                    </p>

                    <div className="mt-3 flex justify-between border-t pt-3">
                      <span>Total</span>
                      <strong>
                        {formatRupiah(availability.totalPrice)}
                      </strong>
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex justify-between gap-3">
                      <span className="text-sm text-amber-800">
                        DP reservasi
                      </span>

                      <strong className="text-amber-900">
                        Rp100.000
                      </strong>
                    </div>

                    <p className="mt-2 text-xs text-amber-800">
                      Pembayaran DP dilakukan setelah
                      reservasi dibuat.
                    </p>
                  </div>

                  {isAdmin ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      Pemesanan sebagai tamu tidak tersedia
                      untuk akun admin.
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleBooking}
                      disabled={
                        booking ||
                        sessionStatus === "loading"
                      }
                      className="w-full rounded-xl bg-amber-900 py-3 font-medium text-white disabled:opacity-50"
                    >
                      {booking
                        ? "Memproses..."
                        : "Pesan Sekarang"}
                    </button>
                  )}

                  {bookingError && (
                    <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                      {bookingError}
                    </div>
                  )}
                </div>
              )}

              {availability &&
                !availability.available && (
                  <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                    Kamar tidak tersedia untuk tanggal
                    tersebut. Silakan pilih tanggal lain.
                  </div>
                )}
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
