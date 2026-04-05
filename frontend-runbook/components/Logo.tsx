import Image from "next/image";
import Link from "next/link";

export default function Logo({ height }: { height: number }) {
    return (
        <Link href={"/"}>
            <Image
                src="/logo.png"
                alt="Runbook Logo"
                width={height}
                height={height}
                className="h-fit mx-auto bg-transparent"
            />
        </Link>
    );
}