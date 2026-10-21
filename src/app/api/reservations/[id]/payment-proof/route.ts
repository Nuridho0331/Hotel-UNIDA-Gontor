import { NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { prisma } from "../../../../../../lib/prisma";

type Context = { params: Promise<{ id: string }> };
const MAX_PROOF_BYTES = 700 * 1024;
const MAX_BODY_BYTES = 1050 * 1024;

function validImage(dataUrl: unknown): dataUrl is string {
  if (typeof dataUrl !== "string") return false;
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!match) return false;
  const encoded = match[2];
  if (encoded.length > Math.ceil(MAX_PROOF_BYTES / 3) * 4 + 4) return false;

  const bytes = Buffer.from(encoded, "base64");
  if (!bytes.length || bytes.length > MAX_PROOF_BYTES) return false;
  if (bytes.toString("base64") !== encoded) return false;

  const mime = match[1];
  if (mime === "jpeg") {
    return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mime === "png") {
    return bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"));
  }
  return bytes.length > 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP";
}

// Bukti disimpan di kolom Payment.proofImage (PostgreSQL).
// Tidak memakai filesystem lokal: aman dari hilangnya file saat serverless restart.
// Untuk volume produksi besar, migrasikan ke object storage privat.
export async function POST(request: Request, context: Context) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Silakan login terlebih dahulu." }, { status: 401 });
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ message: "Ukuran bukti pembayaran terlalu besar." }, { status: 413 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const method = body?.method;
    const proofImage = body?.proofImage;

    if (method !== "TRANSFER" && method !== "QRIS") {
      return NextResponse.json({ message: "Pilih metode TRANSFER atau QRIS." }, { status: 400 });
    }
    if (!validImage(proofImage)) {
      return NextResponse.json({ message: "Bukti harus berupa gambar JPG, PNG, atau WebP maksimal 700 KB." }, { status: 400 });
    }

    const outcome = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findFirst({
        where: { id, userId: session.user.id },
        select: {
          id: true,
          status: true,
          payments: { where: { type: "DP" }, select: { id: true, status: true } },
        },
      });
      if (!reservation) return "NOT_FOUND";
      if (reservation.status !== "PENDING_DP") return "NOT_PENDING";
      const dp = reservation.payments[0];
      if (!dp || (dp.status !== "UNPAID" && dp.status !== "REJECTED")) return "NOT_PENDING";

      // Optimistic state guard: upload ganda tidak boleh memproses DP berkali-kali.
      const updated = await tx.payment.updateMany({
        where: { id: dp.id, status: { in: ["UNPAID", "REJECTED"] } },
        data: {
          method,
          proofImage,
          status: "PENDING",
          paidAt: new Date(),
          notes: null,
          verifiedAt: null,
          verifiedById: null,
        },
      });
      if (updated.count !== 1) return "NOT_PENDING";

      const confirmed = await tx.reservation.updateMany({
        where: { id, userId: session.user.id, status: "PENDING_DP" },
        data: { status: "WAITING_DP_VERIFICATION" },
      });
      if (confirmed.count !== 1) throw new Error("RESERVATION_STATE_CONFLICT");
      return "OK";
    });

    if (outcome === "NOT_FOUND") {
      return NextResponse.json({ message: "Reservasi tidak ditemukan." }, { status: 404 });
    }
    if (outcome !== "OK") {
      return NextResponse.json({ message: "Bukti DP sudah dikirim atau reservasi tidak lagi menunggu DP." }, { status: 409 });
    }

    return NextResponse.json({
      message: "Bukti DP berhasil dikirim dan menunggu verifikasi admin.",
      status: "WAITING_DP_VERIFICATION",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "RESERVATION_STATE_CONFLICT") {
      return NextResponse.json({ message: "Status reservasi berubah. Muat ulang halaman." }, { status: 409 });
    }
    console.error("UPLOAD DP PROOF ERROR:", error);
    return NextResponse.json({ message: "Gagal mengirim bukti pembayaran." }, { status: 500 });
  }
}
