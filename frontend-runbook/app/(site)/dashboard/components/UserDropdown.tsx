"use client";

import React from "react";
import {
    ChevronDown,
    LogOutIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { signOut } from "next-auth/react";

export default function UserDropdown({ user }: { user: any }) {
    const [open, setOpen] = React.useState(false);

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 gap-3 rounded-md px-2.5">
                    <Avatar className="size-7">
                        {user?.image ? (
                            <Image
                                src={user.image}
                                alt={user?.name || "User avatar"}
                                width={28}
                                height={28}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <AvatarFallback>{user?.name?.[0] ?? "U"}</AvatarFallback>
                        )}
                    </Avatar>
                    <div className="hidden max-w-36 truncate text-sm font-medium text-foreground sm:block">
                        {user?.name}
                    </div>
                    <ChevronDown className="size-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-60"
                sideOffset={4}>
                <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-3 px-3 py-3 text-left text-sm">
                        <Avatar className="size-9">
                            {user?.image ? (
                                <Image
                                    src={user.image}
                                    alt={user?.name || "User avatar"}
                                    width={36}
                                    height={36}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <AvatarFallback>{user?.name?.[0] ?? "U"}</AvatarFallback>
                            )}
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">{user?.name}</span>
                            <span className="text-muted-foreground truncate text-[7px] lowercase">{user?.email}</span>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => signOut()}
                    className="cursor-pointer"
                    variant="destructive">
                    <LogOutIcon />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
