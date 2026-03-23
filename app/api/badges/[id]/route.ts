import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { uploadBadgeImage } from "@/lib/cloudinary";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const name        = formData.get("name") as string;
    const icon        = formData.get("icon") as string;
    const description = formData.get("description") as string;
    const points      = formData.get("points") as string;
    const category    = formData.get("category") as string;
    const color       = formData.get("color") as string;
    const imageFile   = formData.get("image") as File | null;
    const removeImage = formData.get("removeImage") as string;

    if (!name || !icon || !description || !points || !category || !color) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const badgeSnap = await adminDb.collection("badges").doc(id).get();
    if (!badgeSnap.exists) {
      return NextResponse.json({ error: "Badge not found" }, { status: 404 });
    }

    // Upload new image if provided
    let imageURL = badgeSnap.data()?.imageURL ?? null;
    if (removeImage === "true") {
      imageURL = null;
    } else if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${id}_${Date.now()}_${name.replace(/\s+/g, "-").toLowerCase()}`;
      imageURL = await uploadBadgeImage(buffer, filename);
    }

    await adminDb.collection("badges").doc(id).update({
      name: name.trim(),
      icon: icon.trim(),
      imageURL,
      description: description.trim(),
      points: Number(points),
      category: category.trim(),
      color: color.trim(),
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.uid,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/badges/[id]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}