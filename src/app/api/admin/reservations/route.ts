
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "../../../../../lib/prisma";

class ActionError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new ActionError(
      401,
      "Silakan login terlebih dahulu."
    );
  }

  if (session.user.role !== "ADMIN") {
    throw new ActionError(
      403,
      "Hanya admin yang boleh mengakses fitur ini."
    );
  }

  return session.user.id;
}

function handleError(error: unknown) {
  if (error instanceof ActionError) {
    return NextResponse.json(
      { message: error.message },
      { status: error.status }
    );
  }

  console.error("ADMIN RESERVATIONS ERROR:", error);

  return NextResponse.json(
    { message: "Terjadi kesalahan pada server." },
    { status: 500 }
  );
}

// GET DAFTAR DAN DETAIL RESERVASI
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const id = request.nextUrl.searchParams.get("id");

    if (id) {
      const reservation =
        await prisma.reservation.findUnique({
          where: { id },
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
            room: {
              include: {
                roomType: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            payments: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        });

      if (!reservation) {
        throw new ActionError(
          404,
          "Reservasi tidak ditemukan."
        );
      }

      return NextResponse.json(
        { reservation },
        {
          headers: {
            "Cache-Control": "private, no-store",
          },
        }
      );
    }

    const reservations =
      await prisma.reservation.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 100,
        select: {
          id: true,
          bookingCode: true,
          checkIn: true,
          checkOut: true,
          totalPrice: true,
          dpAmount: true,
          status: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          room: {
            select: {
              roomNumber: true,
              roomType: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

    return NextResponse.json(
      { reservations },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    return handleError(error);
  }
}

type AdminAction =
  | "VERIFY_DP"
  | "REJECT_DP"
  | "CHECK_IN"
  | "CHECK_OUT";

type PayMethod = "CASH" | "TRANSFER" | "QRIS";

// PATCH STATUS RESERVASI DAN PEMBAYARAN
export async function PATCH(request: NextRequest) {
  try {
    const adminId = await requireAdmin();
    const body = await request.json();

    const id =
      typeof body?.id === "string"
        ? body.id.trim()
        : "";

    const action: AdminAction = body?.action;
    const method: PayMethod = body?.method;

    const notes =
      typeof body?.notes === "string"
        ? body.notes.trim()
        : "";

    if (
      !id ||
      ![
        "VERIFY_DP",
        "REJECT_DP",
        "CHECK_IN",
        "CHECK_OUT",
      ].includes(action)
    ) {
      throw new ActionError(
        400,
        "ID reservasi atau tindakan tidak valid."
      );
    }

    if (
      action === "REJECT_DP" &&
      notes.length < 5
    ) {
      throw new ActionError(
        400,
        "Alasan penolakan minimal 5 karakter."
      );
    }

    if (
      action === "CHECK_IN" &&
      !["CASH", "TRANSFER", "QRIS"].includes(method)
    ) {
      throw new ActionError(
        400,
        "Pilih metode pelunasan terlebih dahulu."
      );
    }

    await prisma.$transaction(async (tx) => {
      const reservation =
        await tx.reservation.findUnique({
          where: { id },
          include: {
            payments: true,
          },
        });

      if (!reservation) {
        throw new ActionError(
          404,
          "Reservasi tidak ditemukan."
        );
      }

      const dp = reservation.payments.find(
        (payment) => payment.type === "DP"
      );

      if (!dp) {
        throw new ActionError(
          409,
          "Data DP tidak ditemukan."
        );
      }

      // 1. VERIFIKASI ATAU TOLAK DP
      if (
        action === "VERIFY_DP" ||
        action === "REJECT_DP"
      ) {
        if (
          reservation.status !==
            "WAITING_DP_VERIFICATION" ||
          dp.status !== "PENDING" ||
          !dp.proofImage
        ) {
          throw new ActionError(
            409,
            "Reservasi tidak menunggu verifikasi DP."
          );
        }

        const accepted = action === "VERIFY_DP";

        const updated = await tx.payment.updateMany({
          where: {
            id: dp.id,
            status: "PENDING",
          },
          data: {
            status: accepted ? "VERIFIED" : "REJECTED",
            verifiedAt: accepted ? new Date() : null,
            verifiedById: adminId,
            notes: accepted ? null : notes,
          },
        });

        if (updated.count !== 1) {
          throw new ActionError(
            409,
            "Status DP sudah berubah."
          );
        }

        const changed =
          await tx.reservation.updateMany({
            where: {
              id,
              status: "WAITING_DP_VERIFICATION",
            },
            data: {
              status: accepted
                ? "CONFIRMED"
                : "PENDING_DP",
            },
          });

        if (changed.count !== 1) {
          throw new ActionError(
            409,
            "Status reservasi sudah berubah."
          );
        }

        return;
      }

      // 2. CHECK-IN DAN PELUNASAN
      if (action === "CHECK_IN") {
        if (
          reservation.status !== "CONFIRMED" ||
          dp.status !== "VERIFIED"
        ) {
          throw new ActionError(
            409,
            "Reservasi belum terkonfirmasi."
          );
        }

        const existingSettlement =
          reservation.payments.find(
            (payment) => payment.type === "SETTLEMENT"
          );

        if (existingSettlement) {
          throw new ActionError(
            409,
            "Pelunasan sudah pernah dicatat."
          );
        }

        const outstanding =
          reservation.totalPrice - reservation.dpAmount;

        if (outstanding < 0) {
          throw new ActionError(
            409,
            "Nominal DP melebihi total tagihan."
          );
        }

        const room = await tx.room.updateMany({
          where: {
            id: reservation.roomId,
            status: "VACANT",
          },
          data: {
            status: "OCCUPIED",
          },
        });

        if (room.count !== 1) {
          throw new ActionError(
            409,
            "Kamar tidak sedang kosong."
          );
        }

        const changed =
          await tx.reservation.updateMany({
            where: {
              id,
              status: "CONFIRMED",
            },
            data: {
              status: "CHECKED_IN",
            },
          });

        if (changed.count !== 1) {
          throw new ActionError(
            409,
            "Status reservasi sudah berubah."
          );
        }

        await tx.payment.create({
          data: {
            reservationId: id,
            type: "SETTLEMENT",
            amount: outstanding,
            method,
            status: "VERIFIED",
            paidAt: new Date(),
            verifiedAt: new Date(),
            verifiedById: adminId,
          },
        });

        return;
      }

      // 3. CHECK-OUT
      if (action === "CHECK_OUT") {
        const settlement =
          reservation.payments.find(
            (payment) => payment.type === "SETTLEMENT"
          );

        if (
          reservation.status !== "CHECKED_IN" ||
          settlement?.status !== "VERIFIED"
        ) {
          throw new ActionError(
            409,
            "Reservasi belum check-in atau belum lunas."
          );
        }

        const changed =
          await tx.reservation.updateMany({
            where: {
              id,
              status: "CHECKED_IN",
            },
            data: {
              status: "CHECKED_OUT",
            },
          });

        if (changed.count !== 1) {
          throw new ActionError(
            409,
            "Status reservasi sudah berubah."
          );
        }

        const room = await tx.room.updateMany({
          where: {
            id: reservation.roomId,
            status: "OCCUPIED",
          },
          data: {
            status: "VACANT",
          },
        });

        if (room.count !== 1) {
          throw new ActionError(
            409,
            "Status kamar tidak sesuai."
          );
        }
      }
    });

    return NextResponse.json({
      message: "Reservasi berhasil diperbarui.",
    });
  } catch (error) {
    return handleError(error);
  }
}
