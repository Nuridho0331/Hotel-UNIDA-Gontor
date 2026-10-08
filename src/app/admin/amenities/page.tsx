"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

type Amenity = {
  id: string;
  name: string;

  _count: {
    roomTypes: number;
  };
};

export default function AmenitiesPage() {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAmenities = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/admin/amenities",
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

      setAmenities(data);
    } catch {
      setError(
        "Terjadi kesalahan saat mengambil data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAmenities();
  }, [loadAmenities]);

  function startEdit(amenity: Amenity) {
    setEditingId(amenity.id);
    setName(amenity.name);

    setError("");
    setSuccess("");
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");

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
        ? `/api/admin/amenities/${editingId}`
        : "/api/admin/amenities";

      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Gagal menyimpan fasilitas."
        );
        return;
      }

      setSuccess(
        editingId
          ? "Fasilitas berhasil diperbarui."
          : "Fasilitas berhasil ditambahkan."
      );

      setName("");
      setEditingId(null);

      await loadAmenities();
    } catch {
      setError(
        "Terjadi kesalahan saat menyimpan fasilitas."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(
    amenity: Amenity
  ) {
    const confirmed = window.confirm(
      `Hapus fasilitas "${amenity.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(amenity.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/amenities/${amenity.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Gagal menghapus fasilitas."
        );
        return;
      }

      setSuccess(
        "Fasilitas berhasil dihapus."
      );

      if (editingId === amenity.id) {
        cancelEdit();
      }

      await loadAmenities();
    } catch {
      setError(
        "Terjadi kesalahan saat menghapus fasilitas."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">

        <div className="mb-8">
          <p className="text-sm font-medium text-amber-800">
            Hotel UNIDA Gontor
          </p>

          <h1 className="mt-1 text-3xl font-semibold text-neutral-900">
            Amenities
          </h1>

          <p className="mt-2 text-neutral-500">
            Kelola fasilitas yang tersedia pada tipe kamar.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[340px_1fr]">

          <section className="h-fit rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              {editingId
                ? "Edit Fasilitas"
                : "Tambah Fasilitas"}
            </h2>

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
              className="mt-6 space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Nama Fasilitas
                </label>

                <input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  required
                  placeholder="Contoh: WiFi"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-amber-800"
                />
              </div>

              <button
                disabled={submitting}
                className="w-full rounded-xl bg-amber-900 py-3 font-medium text-white hover:bg-amber-950 disabled:opacity-60"
              >
                {submitting
                  ? "Menyimpan..."
                  : editingId
                  ? "Simpan Perubahan"
                  : "Tambah Fasilitas"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="w-full rounded-xl border border-neutral-300 py-3 text-sm font-medium"
                >
                  Batal
                </button>
              )}
            </form>
          </section>

          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">
                Daftar Fasilitas
              </h2>

              <p className="text-sm text-neutral-500">
                {amenities.length} fasilitas
              </p>
            </div>

            {loading ? (
              <div className="rounded-2xl border bg-white p-8 text-center text-neutral-500">
                Memuat data...
              </div>
            ) : amenities.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-white p-8 text-center text-neutral-500">
                Belum ada fasilitas.
              </div>
            ) : (
              <div className="space-y-3">
                {amenities.map((amenity) => (
                  <div
                    key={amenity.id}
                    className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
                  >
                    <div>
                      <p className="font-medium text-neutral-900">
                        {amenity.name}
                      </p>

                      <p className="mt-1 text-xs text-neutral-400">
                        Digunakan oleh{" "}
                        {amenity._count.roomTypes} tipe kamar
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          startEdit(amenity)
                        }
                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      >
                        Edit
                      </button>

                      <button
                        disabled={
                          deletingId === amenity.id
                        }
                        onClick={() =>
                          handleDelete(amenity)
                        }
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === amenity.id
                          ? "Menghapus..."
                          : "Hapus"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}