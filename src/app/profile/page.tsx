import { AppChrome } from "@/components/app-chrome";
import { PageShell } from "@/components/page-shell";
import { ProfilePage } from "@/components/profile-page";
import { auth } from "@/auth";
import { getProgress } from "@/services/study-service";
import { redirect } from "next/navigation";

export default async function ProfileRoutePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const progress = await getProgress(session.user.id);

  return (
    <AppChrome>
      <PageShell withNav size="wide">
        <ProfilePage
          email={session.user.email}
          name={session.user.name}
          progress={progress}
        />
      </PageShell>
    </AppChrome>
  );
}
