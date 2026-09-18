import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppNav } from "@/components/app-nav";
import { UserNav } from "@/components/user-nav";

type AppChromeProps = {
  children: React.ReactNode;
};

/**
 * Authenticated shell: session gate, top user chrome, and page content.
 */
export const AppChrome = async ({ children }: AppChromeProps) => {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <AppNav
        userNav={
          <UserNav
            email={session.user.email}
            name={session.user.name}
          />
        }
      />
      {children}
    </div>
  );
};
