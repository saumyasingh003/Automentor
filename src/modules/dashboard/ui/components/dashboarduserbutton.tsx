import React from "react";
import { authClient } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { GeneratedAvatar } from "@/components/generative-avatar";
import { ChevronDownIcon, CreditCardIcon, LogOutIcon, Crown, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/app/api/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import Link from "next/link";

export const DashboardUserButton = () => {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { data, isPending } = authClient.useSession();
  const trpc = useTRPC();
  const { data: userData } = useSuspenseQuery(
    trpc.user.getCurrentUser.queryOptions(undefined, {
      enabled: !!data?.user,
    })
  );

  const getPlanInfo = (plan: string) => {
    switch (plan) {
      case 'free':
        return { label: 'Free', color: 'bg-gray-100 text-gray-800', icon: null };
      case 'monthly':
        return { label: 'Monthly', color: 'bg-blue-100 text-blue-800', icon: Crown };
      case 'yearly':
        return { label: 'Yearly', color: 'bg-purple-100 text-purple-800', icon: Star };
      default:
        return { label: 'Free', color: 'bg-gray-100 text-gray-800', icon: null };
    }
  };

  const onLogout = () => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => router.push("/sign-in"),
      },
    });
  };

  if (isPending || !data?.user) {
    return null;
  }

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger className=" rounded-lg border border-border/10 p-3 w-full flex items-center justify-between  bg-black/20 hover:bg-black/30 overflow-hidden">
          {data.user.image ? (
            <Avatar>
              {data.user.image && <AvatarImage src={data.user.image} />}
            </Avatar>
          ) : (
            <GeneratedAvatar
              seed={data.user.name}
              variant="initials"
              className="mr-3 size-9"
            />
          )}
          <div className="flex flex-col gap-0.5 text-left overflow-hidden flex-1 min-w-0">
            <p className="text-sm truncate w-full">{data.user.name}</p>
            <p className="text-xs truncate w-full">{data.user.email}</p>
            {userData?.plan && (
              <div className="flex items-center gap-1 mt-1">
                <Badge className={`text-xs ${getPlanInfo(userData.plan).color}`}>
                  {getPlanInfo(userData.plan).icon && (() => {
                    const IconComponent = getPlanInfo(userData.plan).icon;
                    return <IconComponent className="h-3 w-3 mr-1" />;
                  })()}
                  {getPlanInfo(userData.plan).label}
                </Badge>
              </div>
            )}
          </div>
          <ChevronDownIcon className="size=4 shrink-0" />
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{data.user.name}</DrawerTitle>
              <DrawerTitle>{data.user.email}</DrawerTitle>
              {userData?.plan && (
                <div className="flex items-center gap-2">
                  <Badge className={getPlanInfo(userData.plan).color}>
                    {getPlanInfo(userData.plan).icon && (() => {
                      const IconComponent = getPlanInfo(userData.plan).icon;
                      return <IconComponent className="h-3 w-3 mr-1" />;
                    })()}
                    {getPlanInfo(userData.plan).label} Plan
                  </Badge>
                </div>
              )}
            </DrawerHeader>
            <DrawerFooter>
              {userData?.plan === 'free' && (
                <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <Link href="/upgrade">
                    <Star className="size-4 mr-2" />
                    Upgrade Plan
                  </Link>
                </Button>
              )}
              <Button variant="outline" onClick={() => {}}>
                <CreditCardIcon className="size-4 text-black" />
                Billing
              </Button>
              <Button variant="outline" onClick={onLogout}>
                <LogOutIcon className="size-4 text-black" />
                Logout
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </DrawerTrigger>
      </Drawer>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className=" rounded-lg border border-border/10 p-3 w-full flex items-center justify-between bg-black/20 hover:bg-black/30 overflow-hidden">
        {data.user.image ? (
          <Avatar>
            {data.user.image && <AvatarImage src={data.user.image} />}
          </Avatar>
        ) : (
          <GeneratedAvatar
            seed={data.user.name}
            variant="initials"
            className="mr-3 size-9"
          />
        )}
        <div className="flex flex-col gap-0.5 text-left overflow-hidden flex-1 min-w-0">
          <p className="text-sm truncate w-full">{data.user.name}</p>
          <p className="text-xs truncate w-full">{data.user.email}</p>
          {userData?.plan && (
            <div className="flex items-center gap-1 mt-1">
              <Badge className={`text-xs ${getPlanInfo(userData.plan).color}`}>
                {getPlanInfo(userData.plan).icon && (() => {
                  const IconComponent = getPlanInfo(userData.plan).icon;
                  return <IconComponent className="h-3 w-3 mr-1" />;
                })()}
                {getPlanInfo(userData.plan).label}
              </Badge>
            </div>
          )}
        </div>
        <ChevronDownIcon className="size=4 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="top"
        className="w-72 left-2 relative"
      >
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <span className="font-medium truncate">{data.user.name}</span>
            <span className="text-sm font-normal text-muted-foreground truncate">
              {data.user.email}
            </span>
            {userData?.plan && (
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getPlanInfo(userData.plan).color}>
                  {getPlanInfo(userData.plan).icon && (() => {
                    const IconComponent = getPlanInfo(userData.plan).icon;
                    return <IconComponent className="h-3 w-3 mr-1" />;
                  })()}
                  {getPlanInfo(userData.plan).label} Plan
                </Badge>
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userData?.plan === 'free' && (
          <DropdownMenuItem asChild className="cursor-pointer flex items-center justify-between">
            <Link href="/upgrade" className="flex items-center justify-between w-full">
              <span className="flex items-center gap-2">
                <Star className="size-4" />
                Upgrade Plan
              </span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className="cursor-pointer flex items-center justify-between">
          Billing
          <CreditCardIcon className="size-4  " />
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onLogout}
          className="cursor-pointer flex items-center justify-between"
        >
          SignOut
          <LogOutIcon className="size-4" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DashboardUserButton;
