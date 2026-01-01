"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Items" },
  { href: "/templates", label: "Templates" },
  { href: "/assets", label: "Assets" }
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm">
      {links.map((link) => {
        const isActive = link.href === "/"
          ? pathname === "/"
          : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-4 py-1.5 transition ${
              isActive
                ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                : "text-[var(--muted)] hover:text-[var(--accent)]"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
