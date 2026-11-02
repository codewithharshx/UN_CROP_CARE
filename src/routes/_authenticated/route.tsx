import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getCurrentStaffUserFn } from "@/lib/auth.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const authData = await getCurrentStaffUserFn();
    if (!authData?.user) {
      throw redirect({ to: "/auth" });
    }
    return {
      user: authData.user,
      roles: authData.roles,
      isStaff: authData.isStaff,
      isAdmin: authData.isAdmin,
      isSuperAdmin: authData.isSuperAdmin,
    };
  },
  component: () => <Outlet />,
});
