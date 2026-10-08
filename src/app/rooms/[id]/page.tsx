"use client";

import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";

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

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getToday() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();

  const id =
    typeof params.id === "string"
      ? params.id
      : "";

  const [room, setRoom] =
    useState<RoomType | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [checkIn, setCheckIn] =
    useState("");

  const [checkOut, setCheckOut] =
    useState("");

  const [guests, setGuests] =
    useState("1");

  const [
    checkingAvailability,
    setCheckingAvailability,
  ] = useState(false);

  const [
    availabilityError,
    setAvailabilityError,
  ] = useState("");

  const [
    availability,
    setAvailability,
  ] =
    useState<AvailabilityResult | null>(
      null
    );

  const [booking, setBooking] =
    useState(false);

  const [
    bookingError,
    setBookingError,
  ] = useState("");

  const today = getToday();

  useEffect(() => {
    if (!id) {
      return;
    }

    async function loadRoom() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/rooms/${id}`,
          {
            cache: "no-store",
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          setError(
            data.message ||
              "Gagal mengambil detail kamar."
          );

          return;
        }

        setRoom(data);
      } catch {
        setError(
          "Terjadi kesalahan saat mengambil detail kamar."
        );
      } finally {
        setLoading(false);
      }
    }

    loadRoom();
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

    setCheckingAvailability(true);

    setAvailabilityError("");
    setAvailability(null);
    setBookingError("");

    try {
      const query =
        new URLSearchParams({
          checkIn,
          checkOut,
          guests,
        });

      const response = await fetch(
        `/api/rooms/${id}/availability?${query.toString()}`,
        {
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setAvailabilityError(
          data.message ||
            "Gagal mengecek ketersediaan kamar."
        );

        return;
      }

      setAvailability(data);
    } catch {
      setAvailabilityError(
        "Terjadi kesalahan saat mengecek ketersediaan kamar."
      );
    } finally {
      setCheckingAvailability(false);
    }
  }

  async function handleBooking() {
    if (!availability?.available) {
      return;
    }

    setBooking(true);
    setBookingError("");

    try {
      const response = await fetch(
        "/api/reservations",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            roomTypeId: room?.id,
            checkIn,
            checkOut,
            guestCount:
              Number(guests),
          }),
        }
      );

      const data =
        await response.json();

      if (
        response.status === 401
      ) {
        router.push("/signin");
        return;
      }

      if (!response.ok) {
        setBookingError(
          data.message ||
            "Gagal membuat reservasi."
        );
        return;
      }

      router.push(
        `/my-reservation/${data.reservation.id}`
      );
    } catch {
      setBookingError(
        "Terjadi kesalahan saat membuat reservasi."
      );
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 px-6 pt-32">
        <div className="mx-auto max-w-6xl text-center text-neutral-500">
          Memuat detail kamar...
        </div>
      </main>
    );
  }

  if (error || !room) {
    return (
      <main className="min-h-screen bg-neutral-50 px-6 pt-32">
        <div className="mx-auto max-w-3xl">

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error ||
              "Kamar tidak ditemukan."}
          </div>

          <Link
            href="/rooms"
            className="mt-6 inline-block text-sm font-medium text-amber-900"
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
          className="text-sm font-medium text-neutral-500 hover:text-neutral-900"
        >
          ← Kembali ke daftar kamar
        </Link>

        <div className="mt-6 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">

          {/* FOTO */}
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

            {/* INFORMASI KAMAR */}
            <div>

              <p className="text-sm font-medium text-amber-800">
                Hotel UNIDA Gontor
              </p>

              <h1 className="mt-2 text-3xl font-semibold text-neutral-900">
                {room.name}
              </h1>

              <div className="mt-4 flex flex-wrap gap-3">

                <span className="rounded-full bg-neutral-100 px-4 py-2 text-sm text-neutral-600">
                  Maks. {room.capacity} tamu
                </span>

                <span className="rounded-full bg-neutral-100 px-4 py-2 text-sm text-neutral-600">
                  {room.totalUnits} unit kamar
                </span>

              </div>

              <div className="mt-8">

                <h2 className="text-lg font-semibold text-neutral-900">
                  Tentang Kamar
                </h2>

                <p className="mt-3 max-w-3xl leading-7 text-neutral-600">
                  {room.description}
                </p>

              </div>

              <div className="mt-8">

                <h2 className="text-lg font-semibold text-neutral-900">
                  Fasilitas
                </h2>

                {room.amenities.length === 0 ? (
                  <p className="mt-3 text-sm text-neutral-500">
                    Fasilitas belum ditambahkan pada tipe kamar ini.
                  </p>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-3">

                    {room.amenities.map(
                      (amenity) => (
                        <span
                          key={amenity}
                          className="rounded-xl border border-neutral-200 px-4 py-2 text-sm text-neutral-700"
                        >
                          {amenity}
                        </span>
                      )
                    )}

                  </div>
                )}

              </div>

            </div>

            {/* BOOKING / AVAILABILITY */}
            <aside className="h-fit rounded-2xl border border-neutral-200 bg-neutral-50 p-6">

              <p className="text-sm text-neutral-500">
                Harga per malam
              </p>

              <div className="mt-1">

                <span className="text-2xl font-semibold text-neutral-900">
                  {formatRupiah(
                    room.basePrice
                  )}
                </span>

                <span className="text-sm text-neutral-400">
                  {" "}
                  / malam
                </span>

              </div>

              <div className="my-6 border-t border-neutral-200" />

              <form
                onSubmit={
                  handleCheckAvailability
                }
                className="space-y-4"
              >

                <div>

                  <label className="mb-2 block text-sm font-medium text-neutral-700">
                    Check-in
                  </label>

                  <input
                    type="date"
                    value={checkIn}
                    min={today}
                    required
                    onChange={(event) => {
                      setCheckIn(
                        event.target.value
                      );

                      resetAvailability();
                    }}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-amber-800"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-neutral-700">
                    Check-out
                  </label>

                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn || today}
                    required
                    onChange={(event) => {
                      setCheckOut(
                        event.target.value
                      );

                      resetAvailability();
                    }}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-amber-800"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-neutral-700">
                    Jumlah Tamu
                  </label>

                  <input
                    type="number"
                    min="1"
                    max={room.capacity}
                    value={guests}
                    required
                    onChange={(event) => {
                      setGuests(
                        event.target.value
                      );

                      resetAvailability();
                    }}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-amber-800"
                  />

                  <p className="mt-2 text-xs text-neutral-400">
                    Maksimal {room.capacity} tamu
                  </p>

                </div>

                <button
                  type="submit"
                  disabled={
                    checkingAvailability
                  }
                  className="w-full rounded-xl bg-amber-900 py-3 font-medium text-white transition hover:bg-amber-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {checkingAvailability
                    ? "Mengecek..."
                    : "Cek Ketersediaan"}
                </button>

              </form>

              {/* ERROR AVAILABILITY */}
              {availabilityError && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {availabilityError}
                </div>
              )}

              {/* AVAILABLE */}
              {availability?.available && (
                <div className="mt-5">

                  <div className="rounded-xl border border-green-200 bg-green-50 p-4">

                    <p className="font-medium text-green-800">
                      Kamar tersedia
                    </p>

                    <p className="mt-1 text-sm text-green-700">
                      {
                        availability.availableCount
                      }{" "}
                      unit tersedia untuk tanggal yang dipilih.
                    </p>

                  </div>

                  <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">

                    <div className="flex justify-between text-sm text-neutral-600">

                      <span>
                        {formatRupiah(
                          availability.basePrice
                        )}{" "}
                        ×{" "}
                        {availability.nights} malam
                      </span>

                      <span>
                        {formatRupiah(
                          availability.totalPrice
                        )}
                      </span>

                    </div>

                    <div className="mt-3 border-t border-neutral-100 pt-3">

                      <div className="flex items-center justify-between">

                        <span className="font-medium text-neutral-700">
                          Total
                        </span>

                        <span className="text-lg font-semibold text-neutral-900">
                          {formatRupiah(
                            availability.totalPrice
                          )}
                        </span>

                      </div>

                    </div>

                  </div>

                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">

                    <div className="flex items-center justify-between gap-4">

                      <span className="text-sm text-amber-800">
                        DP reservasi
                      </span>

                      <span className="font-semibold text-amber-900">
                        Rp100.000
                      </span>

                    </div>

                    <p className="mt-1 text-xs leading-5 text-amber-700">
                      Reservasi akan menunggu pembayaran DP setelah dibuat.
                    </p>

                  </div>

                  {/* TOMBOL BOOKING */}
                  <button
                    type="button"
                    onClick={
                      handleBooking
                    }
                    disabled={booking}
                    className="mt-4 w-full rounded-xl bg-amber-900 py-3 font-medium text-white transition hover:bg-amber-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {booking
                      ? "Memproses..."
                      : "Pesan Sekarang"}
                  </button>

                  {bookingError && (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {bookingError}
                    </div>
                  )}

                </div>
              )}

              {/* TIDAK TERSEDIA */}
              {availability &&
                !availability.available && (
                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">

                    <p className="font-medium text-amber-800">
                      Kamar tidak tersedia
                    </p>

                    <p className="mt-1 text-sm leading-5 text-amber-700">
                      Semua unit kamar untuk tanggal tersebut sedang tidak tersedia. Silakan pilih tanggal lain.
                    </p>

                  </div>
                )}

            </aside>

          </div>
        </div>

      </section>

    </main>
  );
}