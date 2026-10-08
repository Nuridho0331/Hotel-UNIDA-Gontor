"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

type RoomStatus =
  | "VACANT"
  | "OCCUPIED"
  | "OUT_OF_ORDER";

type RoomType = {
  id: string;
  name: string;
  capacity: number;
  basePrice: number;
};

type Room = {
  id: string;
  roomNumber: string;
  floor: string | null;
  status: RoomStatus;

  roomType: {
    id: string;
    name: string;
    capacity: number;
    basePrice: number;
  };
};

type FormState = {
  roomNumber: string;
  floor: string;
  roomTypeId: string;
  status: RoomStatus;
};

const initialForm: FormState = {
  roomNumber: "",
  floor: "",
  roomTypeId: "",
  status: "VACANT",
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatStatus(status: RoomStatus) {
  if (status === "VACANT") {
    return "Vacant";
  }

  if (status === "OCCUPIED") {
    return "Occupied";
  }

  return "Out of Order";
}

function statusClass(status: RoomStatus) {
  if (status === "VACANT") {
    return "bg-green-50 text-green-700";
  }

  if (status === "OCCUPIED") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-red-50 text-red-700";
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] =
    useState<RoomType[]>([]);

  const [form, setForm] =
    useState<FormState>(initialForm);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [roomsResponse, roomTypesResponse] =
        await Promise.all([
          fetch("/api/admin/rooms", {
            cache: "no-store",
          }),

          fetch("/api/admin/room-types", {
            cache: "no-store",
          }),
        ]);

      const roomsData =
        await roomsResponse.json();

      const roomTypesData =
        await roomTypesResponse.json();

      if (!roomsResponse.ok) {
        setError(
          roomsData.message ||
            "Gagal mengambil data kamar."
        );
        return;
      }

      if (!roomTypesResponse.ok) {
        setError(
          roomTypesData.message ||
            "Gagal mengambil tipe kamar."
        );
        return;
      }

      setRooms(roomsData);
      setRoomTypes(roomTypesData);
    } catch {
      setError(
        "Terjadi kesalahan saat mengambil data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function startEdit(room: Room) {
    setEditingId(room.id);

    setForm({
      roomNumber: room.roomNumber,
      floor: room.floor ?? "",
      roomTypeId: room.roomType.id,
      status: room.status,
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(initialForm);

    setError("");
    setSuccess("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const url = editingId
        ? `/api/admin/rooms/${editingId}`
        : "/api/admin/rooms";

      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Gagal menyimpan unit kamar."
        );
        return;
      }

      setSuccess(
        editingId
          ? "Unit kamar berhasil diperbarui."
          : "Unit kamar berhasil ditambahkan."
      );

      setEditingId(null);
      setForm(initialForm);

      await loadData();
    } catch {
      setError(
        "Terjadi kesalahan saat menyimpan data."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(room: Room) {
    const confirmed = window.confirm(
      `Hapus kamar "${room.roomNumber}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(room.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/rooms/${room.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Gagal menghapus unit kamar."
        );
        return;
      }

      setSuccess(
        "Unit kamar berhasil dihapus."
      );

      if (editingId === room.id) {
        setEditingId(null);
        setForm(initialForm);
      }

      await loadData();
    } catch {
      setError(
        "Terjadi kesalahan saat menghapus data."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8">
          <p className="text-sm font-medium text-amber-800">
            Hotel UNIDA Gontor
          </p>

          <h1 className="mt-1 text-3xl font-semibold text-neutral-900">
            Unit Kamar
          </h1>

          <p className="mt-2 text-neutral-500">
            Kelola unit kamar fisik dan status
            operasional hotel.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[360px_1fr]">

          {/* FORM */}
          <section className="h-fit rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">

            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  {editingId
                    ? "Edit Unit Kamar"
                    : "Tambah Unit Kamar"}
                </h2>

                <p className="mt-1 text-sm text-neutral-500">
                  {editingId
                    ? "Perbarui data dan status kamar."
                    : "Tambahkan unit kamar baru."}
                </p>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-sm font-medium text-neutral-500 hover:text-neutral-900"
                >
                  Batal
                </button>
              )}
            </div>

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-5"
            >

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  Nomor Kamar
                </label>

                <input
                  value={form.roomNumber}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      roomNumber:
                        event.target.value,
                    }))
                  }
                  required
                  placeholder="Contoh: 101"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-amber-800"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  Lantai
                </label>

                <input
                  value={form.floor}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      floor: event.target.value,
                    }))
                  }
                  placeholder="Contoh: 1"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-amber-800"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  Tipe Kamar
                </label>

                <select
                  value={form.roomTypeId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      roomTypeId:
                        event.target.value,
                    }))
                  }
                  required
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-amber-800"
                >
                  <option value="">
                    Pilih tipe kamar
                  </option>

                  {roomTypes.map((roomType) => (
                    <option
                      key={roomType.id}
                      value={roomType.id}
                    >
                      {roomType.name}
                    </option>
                  ))}
                </select>
              </div>

              {editingId && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">
                    Status Operasional
                  </label>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status:
                          event.target
                            .value as RoomStatus,
                      }))
                    }
                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-amber-800"
                  >
                    <option value="VACANT">
                      Vacant
                    </option>

                    <option value="OCCUPIED">
                      Occupied
                    </option>

                    <option value="OUT_OF_ORDER">
                      Out of Order
                    </option>
                  </select>

                  <p className="mt-2 text-xs leading-5 text-neutral-400">
                    Status Booked akan ditentukan
                    otomatis dari reservasi.
                  </p>
                </div>
              )}

              {!editingId && (
                <div className="rounded-xl bg-neutral-50 p-4 text-sm text-neutral-500">
                  Unit kamar baru otomatis berstatus{" "}
                  <span className="font-medium text-neutral-800">
                    Vacant
                  </span>.
                </div>
              )}

              <button
                disabled={submitting}
                className="w-full rounded-xl bg-amber-900 py-3 font-medium text-white transition hover:bg-amber-950 disabled:opacity-60"
              >
                {submitting
                  ? "Menyimpan..."
                  : editingId
                  ? "Simpan Perubahan"
                  : "Tambah Unit Kamar"}
              </button>

            </form>
          </section>

          {/* LIST */}
          <section>

            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  Daftar Unit Kamar
                </h2>

                <p className="text-sm text-neutral-500">
                  {rooms.length} unit kamar
                </p>
              </div>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">
                Memuat data...
              </div>
            ) : rooms.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
                Belum ada unit kamar.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">

                <div className="overflow-x-auto">
                  <table className="w-full text-left">

                    <thead className="border-b border-neutral-200 bg-neutral-50 text-sm text-neutral-500">
                      <tr>
                        <th className="px-5 py-4 font-medium">
                          Kamar
                        </th>

                        <th className="px-5 py-4 font-medium">
                          Tipe
                        </th>

                        <th className="px-5 py-4 font-medium">
                          Lantai
                        </th>

                        <th className="px-5 py-4 font-medium">
                          Harga
                        </th>

                        <th className="px-5 py-4 font-medium">
                          Status
                        </th>

                        <th className="px-5 py-4 text-right font-medium">
                          Aksi
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {rooms.map((room) => (
                        <tr
                          key={room.id}
                          className="border-b border-neutral-100 last:border-none"
                        >

                          <td className="px-5 py-4 font-semibold text-neutral-900">
                            {room.roomNumber}
                          </td>

                          <td className="px-5 py-4 text-sm text-neutral-700">
                            {room.roomType.name}
                          </td>

                          <td className="px-5 py-4 text-sm text-neutral-700">
                            {room.floor || "-"}
                          </td>

                          <td className="px-5 py-4 text-sm text-neutral-700">
                            {formatRupiah(
                              room.roomType
                                .basePrice
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(
                                room.status
                              )}`}
                            >
                              {formatStatus(
                                room.status
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  startEdit(room)
                                }
                                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                disabled={
                                  deletingId ===
                                  room.id
                                }
                                onClick={() =>
                                  handleDelete(room)
                                }
                                className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                {deletingId ===
                                room.id
                                  ? "Menghapus..."
                                  : "Hapus"}
                              </button>

                            </div>
                          </td>

                        </tr>
                      ))}
                    </tbody>

                  </table>
                </div>
              </div>
            )}

          </section>

        </div>
      </div>
    </main>
  );
}