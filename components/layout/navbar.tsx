"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { useUserContext } from "@/contexts/user/user-context";
import { useLogout } from "@/hooks/auth/use-logout";
import ProfilePictureModal from "../shared/profile-picture-modal";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Camera, LogOut } from "lucide-react";
import UserAvatar from "../shared/user-avatar";

const LINKS = [
  { href: "/hotels", label: "Hotels" },
  { href: "/bookings", label: "Bookings", match: ["/bookings", "/booking"] },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useUserContext();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const onHero = pathname === "/";
  const solid = !onHero || scrolled || open;
  const { logout, isLoading } = useLogout();
  const [isProfilePictureModalOpen, setIsProfilePictureModalOpen] =
    useState<boolean>(false);

  const handleProfilePictureModalClose = () => {
    setIsProfilePictureModalOpen(false);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition",
        solid
          ? "border-b border-line bg-paper/95 backdrop-blur"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-5 md:px-8">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className={cn(
            "font-display text-2xl tracking-tight",
            solid ? "text-ink" : "text-white",
          )}
        >
          Open Hotels
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {LINKS.map((link) => {
            const active = isActive(pathname, link);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-full px-3 py-2 text-sm font-medium",
                  active
                    ? solid
                      ? "bg-ink text-white"
                      : "bg-white text-ink"
                    : solid
                      ? "text-ink hover:bg-sand"
                      : "text-white hover:bg-white/15",
                )}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
          {user ? (
            <Popover>
              <PopoverTrigger className="rounded-full outline-none">
                <UserAvatar
                  name={user.name}
                  seed={user.email}
                  src={user.profile_image_url}
                  className="h-8 w-8 cursor-pointer"
                />
              </PopoverTrigger>
              <PopoverContent className="bg-[#E2E8F0]">
                <div className="flex flex-col items-center">
                  <div className="relative text-black hover:text-[#0A66C2] cursor-pointer">
                    <UserAvatar
                      name={user.name}
                      seed={user.email}
                      src={user.profile_image_url}
                      className="h-10 w-10"
                    />
                    <div
                      className="absolute -right-2.5 -bottom-2 w-6 h-6 rounded-full flex items-center justify-center bg-white"
                      onClick={() => setIsProfilePictureModalOpen(true)}
                      aria-label="Edit profile picture"
                    >
                      <Camera size={14} color="#0000FF" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 mt-2">
                    <h2>Hi! {user.name.split(" ")[0]}</h2>
                    <p className="text-xs text-neutral-500">{user.email}</p>
                  </div>
                  {/* <Link
                    href="/profile"
                    className="rounded-xl bg-white flex items-center justify-center px-2.5 py-1.5 mt-3 w-45 text-neutral-500 duration-300 transition-all hover:bg-neutral-100 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 ">My Profile</div>
                  </Link> */}
                  <p
                    onClick={() => logout()}
                    className="flex items-center gap-2 text-xs text-red-500 cursor-pointer duration-300 transition-all hover:text-red-700 my-2"
                  >
                    <LogOut size={14} />
                    {isLoading ? "Signing out..." : "Sign Out"}
                  </p>
                  {/* <button
                    className="rounded-xl bg-white flex items-center justify-center px-2.5 py-1.5 my-3 w-45 text-neutral-500 duration-300 transition-all hover:text-red-500 cursor-pointer"
                    onClick={() => logout()}
                  >
                    <div className="flex items-center gap-2 ">
                      <LogOut size={14} />
                      {isLoading ? "Signing out..." : "Sign Out"}
                    </div>
                  </button> */}
                  <div className="flex items-center gap-1.5 text-black text-[10px]">
                    <Link
                      href="/privacy-policy"
                      className="cursor-pointer underline underline-offset-2 transition-all duration-300 hover:text-blue-700"
                    >
                      Privacy Policy
                    </Link>
                    <span className="bg-black w-0.5 h-0.5 rounded-full" />
                    <Link
                      href="/terms-of-service"
                      className="cursor-pointer underline underline-offset-2 transition-all duration-300 hover:text-blue-700"
                    >
                      Terms of Service
                    </Link>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <Link
              href="/sign-in"
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                solid
                  ? "bg-clay text-white hover:bg-clay-dark"
                  : "bg-white text-ink hover:bg-white/90",
              )}
            >
              Sign in
            </Link>
          )}
        </nav>
        <button
          type="button"
          className={cn(
            "grid h-10 w-10 place-items-center rounded-full md:hidden",
            solid ? "text-ink" : "text-white",
          )}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Close" : "Menu"}</span>
          <span aria-hidden className="flex w-5 flex-col gap-1.5">
            <span className="h-0.5 w-full bg-current" />
            <span className="h-0.5 w-full bg-current" />
            <span className="h-0.5 w-3/4 bg-current" />
          </span>
        </button>
      </div>
      {open ? (
        <nav
          className="border-t border-line bg-paper px-5 py-3 md:hidden"
          aria-label="Mobile"
        >
          {LINKS.map((link) => {
            const active = isActive(pathname, link);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-2xl px-3 py-3 text-base font-medium",
                  active ? "bg-sand text-ink" : "text-ink hover:bg-sand",
                )}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="mt-2 border-t border-line pt-3">
            {user ? (
              <>
                <div className="flex items-center gap-3 rounded-2xl px-3 py-3">
                  <UserAvatar
                    name={user.name}
                    seed={user.email}
                    src={user.profile_image_url}
                    className="h-10 w-10"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">
                      {user.name.split(" ")[0]}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {user.email}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  disabled={isLoading}
                  className="flex w-full items-center gap-2 rounded-2xl px-3 py-3 text-left text-sm font-medium text-red-600 hover:bg-sand disabled:opacity-60"
                >
                  <LogOut size={16} />
                  {isLoading ? "Signing out..." : "Sign out"}
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 px-1">
                <Link
                  href="/sign-in"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-clay px-4 py-3 text-center text-sm font-semibold text-white hover:bg-clay-dark"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-line px-4 py-3 text-center text-sm font-semibold text-ink hover:bg-sand"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>
        </nav>
      ) : null}
      <ProfilePictureModal
        isOpen={isProfilePictureModalOpen}
        onClose={handleProfilePictureModalClose}
      />
    </header>
  );
}

export function NavbarFallback() {
  return <div className="fixed inset-x-0 top-0 z-50 h-16" />;
}

function isActive(pathname: string, link: { href: string; match?: string[] }) {
  const paths = link.match ?? [link.href];
  return paths.some(
    (href) => pathname === href || pathname.startsWith(`${href}/`),
  );
}
