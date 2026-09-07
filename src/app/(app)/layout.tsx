import { auth } from "@/auth";
import { AppHeader } from "@/components/app-header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        userName={session?.user?.name}
        userRole={session?.user?.role}
        isAdmin={isAdmin}
      />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
