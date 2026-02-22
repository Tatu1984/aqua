import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { getMenus, Menu, MenuItem } from "@/lib/api";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let headerMenuItems: MenuItem[] = [];
  let footerMenus: Menu[] = [];

  try {
    const [headerData, footerData] = await Promise.all([
      getMenus("header"),
      getMenus("footer"),
    ]);
    headerMenuItems = headerData.menus[0]?.items ?? [];
    footerMenus = footerData.menus;
  } catch (error) {
    console.error("Failed to fetch menus:", error);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header menuItems={headerMenuItems} />
      <main className="flex-1 pt-24">{children}</main>
      <Footer menus={footerMenus} />
      <CartDrawer />
    </div>
  );
}
