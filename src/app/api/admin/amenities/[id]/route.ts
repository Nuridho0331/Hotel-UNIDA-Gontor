import { NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { prisma } from "../../../../../../lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const body = await request.json();
    const name = String(body.name ?? "").trim();

    if (!name) {
      return NextResponse.json(
        { message: "Nama fasilitas wajib diisi." },
        { status: 400 }
      );
    }

    const amenity = await prisma.amenity.findUnique({
      where: { id },
    });

    if (!amenity) {
      return NextResponse.json(
        { message: "Fasilitas tidak ditemukan." },
        { status: 404 }
      );
    }

    const duplicate = await prisma.amenity.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
        NOT: {
          id,
        },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { message: "Nama fasilitas sudah digunakan." },
        { status: 409 }
      );
    }

    const updatedAmenity = await prisma.amenity.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json({
      message: "Fasilitas berhasil diperbarui.",
      amenity: updatedAmenity,
    });
  } catch (error) {
    console.error("UPDATE AMENITY ERROR:", error);

    return NextResponse.json(
      { message: "Gagal memperbarui fasilitas." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const amenity = await prisma.amenity.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            roomTypes: true,
          },
        },
      },
    });

    if (!amenity) {
      return NextResponse.json(
        { message: "Fasilitas tidak ditemukan." },
        { status: 404 }
      );
    }

    if (amenity._count.roomTypes > 0) {
      return NextResponse.json(
        {
          message:
            "Fasilitas tidak dapat dihapus karena masih digunakan oleh tipe kamar.",
        },
        { status: 409 }
      );
    }

    await prisma.amenity.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Fasilitas berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE AMENITY ERROR:", error);

    return NextResponse.json(
      { message: "Gagal menghapus fasilitas." },
      { status: 500 }
    );
  }
}