"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import {
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
  UserRoundIcon,
} from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type UserNavProps = {
  email?: string | null;
  name?: string | null;
};

/**
 * Builds display name and avatar initial from the signed-in user.
 */
const getUserDisplay = (email?: string | null, name?: string | null) => {
  const label = name?.trim() || email?.trim() || "Account";
  const detail = email?.trim() || null;
  const initialSource = name?.trim() || email?.trim() || "A";
  const initial = initialSource.charAt(0).toUpperCase();
  return { label, detail, initial };
};

/**
 * Compact account menu: identity, theme, profile, and sign out.
 * Adapted from @reui/c-dropdown-menu-14.
 */
export const UserNav = ({ email, name }: UserNavProps) => {
  const { theme, setTheme } = useTheme();
  const { label, detail, initial } = getUserDisplay(email, name);

  const handleThemeChange = (value: string | number | null) => {
    if (value === "light" || value === "dark" || value === "system") {
      setTheme(value);
    }
  };

  const handleSignOut = () => {
    void signOutAction();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-full"
            aria-label="Open account menu"
          />
        }
      >
        <Avatar size="sm">
          <AvatarFallback className="text-xs font-semibold">
            {initial}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64" align="end" sideOffset={8}>
        <div className="flex items-center gap-3 px-1.5 py-2">
          <Avatar>
            <AvatarFallback className="font-semibold">{initial}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {label}
            </p>
            {detail ? (
              <p className="truncate text-xs text-muted-foreground">{detail}</p>
            ) : null}
          </div>
        </div>

        <div className="px-1 pb-2">
          <Tabs value={theme ?? "system"} onValueChange={handleThemeChange}>
            <TabsList className="w-full">
              <TabsTrigger
                value="light"
                className="h-7 flex-1"
                aria-label="Light theme"
              >
                <SunIcon className="size-4" aria-hidden />
              </TabsTrigger>
              <TabsTrigger
                value="dark"
                className="h-7 flex-1"
                aria-label="Dark theme"
              >
                <MoonIcon className="size-4" aria-hidden />
              </TabsTrigger>
              <TabsTrigger
                value="system"
                className="h-7 flex-1"
                aria-label="System theme"
              >
                <MonitorIcon className="size-4" aria-hidden />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem render={<Link href="/profile" />}>
          <UserRoundIcon aria-hidden />
          Profile
        </DropdownMenuItem>

        <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
          <LogOutIcon aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
