"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getRoomImageByName(name: string) {
  const images: Record<string, string> = {
    "Sharing Room": "/rooms/hostel_room.png",
    "Classic Family": "/rooms/classic_family.png",
    "Twin Deluxe": "/rooms/twin_deluxe.png",
    "Superior Family": "/rooms/superior_family.png",
    "Triple Deluxe": "/rooms/triple_deluxe.png",
    "VIP": "/rooms/vip.png",
    "VVIP": "/rooms/vvip.png",
  };

  return images[name] || "/IMG_0334.JPG";
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRooms() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/rooms", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.message || "Gagal mengambil data kamar."
          );
          return;
        }

        setRooms(data);
      } catch {
        setError(
          "Terjadi kesalahan saat mengambil data kamar."
        );
      } finally {
        setLoading(false);
      }
    }

    loadRooms();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-50 pt-24">
      {/* HEADER */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-sm font-medium text-amber-800">
            Hotel UNIDA Gontor
          </p>

          <h1 className="mt-2 text-4xl font-semibold text-neutral-900">
            Pilih Kamar
          </h1>

          <p className="mt-3 max-w-2xl text-neutral-500">
            Pilih tipe kamar yang sesuai dengan kebutuhan menginap Anda.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        {loading && (
          <div className="py-20 text-center text-neutral-500">
            Memuat daftar kamar...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && rooms.length === 0 && (
          <div className="py-20 text-center">
            <h2 className="text-xl font-semibold text-neutral-800">
              Belum ada kamar
            </h2>

            <p className="mt-2 text-neutral-500">
              Data tipe kamar belum tersedia.
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <article
              key={room.id}
              className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              {/* IMAGE */}
              <div className="aspect-[16/10] overflow-hidden bg-neutral-100">
                <img
                  src={getRoomImageByName(room.name)}
                  alt={room.name}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* BODY */}
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-neutral-900">
                      {room.name}
                    </h2>

                    <p className="mt-1 text-sm text-neutral-500">
                      Maks. {room.capacity} tamu
                    </p>
                  </div>

                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">
                    {room.totalUnits} unit
                  </span>
                </div>

                <p className="mt-4 line-clamp-3 text-sm leading-6 text-neutral-500">
                  {room.description}
                </p>

                {room.amenities.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {room.amenities.slice(0, 4).map((amenity) => (
                      <span
                        key={amenity}
                        className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-6 border-t border-neutral-100 pt-5">
                  <p className="text-xs text-neutral-400">
                    Mulai dari
                  </p>

                  <div className="mt-1 flex items-end justify-between gap-3">
                    <div>
                      <span className="text-xl font-semibold text-neutral-900">
                        {formatRupiah(room.basePrice)}
                      </span>

                      <span className="text-sm text-neutral-400">
                        {" "}
                        / malam
                      </span>
                    </div>

                    <Link
                      href={`/rooms/${room.id}`}
                      className="rounded-xl bg-amber-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-950"
                    >
                      Lihat Detail
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}