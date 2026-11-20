import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import AdminDashboard from "@/app/admin/AdminDashboard";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function AdminPage() {
  await connection();
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/admin/login");

  const [orders, products, settings] = await Promise.all([
    prisma.order.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: { items: { select: { productName: true, quantity: true, totalPriceCents: true } } },
    }),
    prisma.menuProduct.findMany({
      where: { deletedAt: null },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
    }),
    prisma.restaurantSettings.findUnique({ where: { id: "default" } }),
  ]);
  if (!settings) throw new Error("Restaurant settings have not been initialized; run the database migration and seed step.");

  return (
    <AdminDashboard
      initialOrders={orders.map((order) => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
      }))}
      initialProducts={products}
      initialSettings={settings}
    />
  );
}
