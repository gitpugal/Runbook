"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function UserMenu() {
    return (
        <Button
            variant="outline"
            size="sm"
            className="text-black"
            onClick={() => signOut({ callbackUrl: "/login" })}
        >
            Logout
        </Button>
    );
}
