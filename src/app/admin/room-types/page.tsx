"use client";

import {
  FormEvent,
  useCallback,
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

  _count: {
    rooms: number;
  };
};

type FormState = {
  name: string;
  description: string;
  capacity: string;
  basePrice: string;
  image: string;
};

const initialForm: FormState = {
  name: "",
  description: "",
  capacity: "",
  basePrice: "",
  image: "",
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function RoomTypesPage() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);

  const [form, setForm] =
    useState<FormState>(initialForm);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [loadingData, setLoadingData] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const loadRoomTypes = useCallback(async () => {
    try {
      setLoadingData(true);

      const response = await fetch(
        "/api/admin/room-types",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Gagal mengambil data."
        );
        return;
      }

      setRoomTypes(data);
    } catch {
      setError(
        "Terjadi kesalahan saat mengambil data."
      );
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadRoomTypes();
  }, [loadRoomTypes]);

  function handleChange(
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function startEdit(roomType: RoomType) {
    setEditingId(roomType.id);

    setForm({
      name: roomType.name,
      description: roomType.description,
      capacity: String(roomType.capacity),
      basePrice: String(roomType.basePrice),
      image: roomType.image ?? "",
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

    const payload = {
      name: form.name,
      description: form.description,
      capacity: Number(form.capacity),
      basePrice: Number(form.basePrice),
      image: form.image,
    };

    try {
      const url = editingId
        ? `/api/admin/room-types/${editingId}`
        : "/api/admin/room-types";

      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Gagal menyimpan tipe kamar."
        );
        return;
      }

      setSuccess(
        editingId
          ? "Tipe kamar berhasil diperbarui."
          : "Tipe kamar berhasil ditambahkan."
      );

      setEditingId(null);
      setForm(initialForm);

      await loadRoomTypes();
    } catch {
      setError(
        "Terjadi kesalahan saat menyimpan data."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(
    roomType: RoomType
  ) {
    const confirmed = window.confirm(
      `Hapus tipe kamar "${roomType.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(roomType.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/room-types/${roomType.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Gagal menghapus tipe kamar."
        );
        return;
      }

      setSuccess(
        "Tipe kamar berhasil dihapus."
      );

      if (editingId === roomType.id) {
        cancelEdit();
      }

      await loadRoomTypes();
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
            Room Types
          </h1>

          <p className="mt-2 text-neutral-500">
            Kelola kategori kamar yang tersedia
            di hotel.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">

          {/* FORM */}
          <section className="h-fit rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">

            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  {editingId
                    ? "Edit Tipe Kamar"
                    : "Tambah Tipe Kamar"}
                </h2>

                <p className="mt-1 text-sm text-neutral-500">
                  {editingId
                    ? "Perbarui data kategori kamar."
                    : "Tambahkan kategori kamar baru."}
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
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-5"
            >

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  Nama Tipe
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: Deluxe Room"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-amber-800"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  Deskripsi
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Deskripsi singkat tipe kamar..."
                  className="w-full resize-none rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-amber-800"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  Kapasitas
                </label>

                <input
                  name="capacity"
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={handleChange}
                  required
                  placeholder="2"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-amber-800"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  Harga per Malam
                </label>

                <input
                  name="basePrice"
                  type="number"
                  min="1"
                  value={form.basePrice}
                  onChange={handleChange}
                  required
                  placeholder="500000"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-amber-800"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  URL Gambar
                </label>

                <input
                  name="image"
                  type="text"
                  value={form.image}
                  onChange={handleChange}
                  placeholder="Opsional"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-amber-800"
                />

                <p className="mt-2 text-xs text-neutral-400">
                  Upload gambar kita rapikan nanti.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-amber-900 py-3 font-medium text-white transition hover:bg-amber-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Menyimpan..."
                  : editingId
                  ? "Simpan Perubahan"
                  : "Tambah Tipe Kamar"}
              </button>
            </form>
          </section>

          {/* LIST */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                Daftar Tipe Kamar
              </h2>

              <p className="text-sm text-neutral-500">
                {roomTypes.length} tipe kamar
              </p>
            </div>

            {loadingData ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">
                Memuat data...
              </div>
            ) : roomTypes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">

                <h3 className="font-medium text-neutral-800">
                  Belum ada tipe kamar
                </h3>

                <p className="mt-1 text-sm text-neutral-500">
                  Tambahkan tipe kamar pertama
                  dari form di sebelah kiri.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {roomTypes.map((roomType) => (
                  <article
                    key={roomType.id}
                    className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
                  >

                    <div className="flex items-start justify-between gap-5">
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900">
                          {roomType.name}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-neutral-500">
                          {roomType.description}
                        </p>
                      </div>

                      <div className="shrink-0 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                        {roomType._count.rooms} unit
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-end justify-between gap-5 border-t border-neutral-100 pt-4">

                      <div className="flex gap-8">
                        <div>
                          <p className="text-xs text-neutral-400">
                            Kapasitas
                          </p>

                          <p className="mt-1 text-sm font-medium text-neutral-800">
                            {roomType.capacity} tamu
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-neutral-400">
                            Harga
                          </p>

                          <p className="mt-1 text-sm font-medium text-neutral-800">
                            {formatRupiah(
                              roomType.basePrice
                            )}

                            <span className="font-normal text-neutral-400">
                              {" "}
                              / malam
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            startEdit(roomType)
                          }
                          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={
                            deletingId === roomType.id
                          }
                          onClick={() =>
                            handleDelete(roomType)
                          }
                          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === roomType.id
                            ? "Menghapus..."
                            : "Hapus"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}