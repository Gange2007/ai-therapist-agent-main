"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, X, MessageCircle, AudioWaveform, LogOut,
  LayoutDashboard, BookOpen, Heart, BarChart3, User, HeartHandshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { SignInButton } from "@/components/auth/sign-in-button";
import { useSession } from "@/lib/contexts/session-context";
import { cn } from "@/lib/utils";

const PUBLIC_NAV = [
  { href: "/features", label: "Features" },
  { href: "/about", label: "About Aura" },
];

const AUTH_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/resources", label: "Resources", icon: HeartHandshake },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: User },
];

export function Header() {
  const { isAuthenticated, logout, user } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = isAuthenticated ? AUTH_NAV : PUBLIC_NAV;

  return (
    <div className="w-full fixed top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="absolute inset-0 border-b border-primary/10" />
      <header className="relative max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href={isAuthenticated ? "/dashboard" : "/"}
            className="flex items-center space-x-2 transition-opacity hover:opacity-80 shrink-0"
          >
            <AudioWaveform className="h-7 w-7 text-primary animate-pulse-gentle" />
            <div className="flex flex-col">
              <span className="font-semibold text-lg bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                AuraMind
              </span>
              <span className="text-xs text-muted-foreground leading-none">
                Your mental health Companion
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center space-x-0.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors relative group",
                      isActive
                        ? "text-primary bg-primary/8"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {"icon" in item && item.icon && (
                      <item.icon className="w-3.5 h-3.5" />
                    )}
                    {item.label}
                    {!isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />

              {isAuthenticated ? (
                <>
                  <Button
                    asChild
                    size="sm"
                    className="hidden md:flex gap-2 bg-primary/90 hover:bg-primary"
                  >
                    <Link href="/therapy/new">
                      <MessageCircle className="w-4 h-4" />
                      Start Chat
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="hidden md:flex text-muted-foreground hover:text-foreground gap-1.5"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </Button>
                </>
              ) : (
                <SignInButton />
              )}

              {/* Mobile hamburger */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-primary/10 pb-4">
            <nav className="flex flex-col space-y-1 pt-3">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "text-primary bg-primary/8"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {"icon" in item && item.icon && (
                      <item.icon className="w-4 h-4" />
                    )}
                    {item.label}
                  </Link>
                );
              })}

              {isAuthenticated && (
                <div className="flex flex-col gap-2 pt-2 px-4">
                  <Button asChild className="gap-2 bg-primary/90 hover:bg-primary">
                    <Link href="/therapy/new" onClick={() => setIsMenuOpen(false)}>
                      <MessageCircle className="w-4 h-4" /> Start Chat
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={() => { logout(); setIsMenuOpen(false); }} className="gap-2">
                    <LogOut className="w-4 h-4" /> Sign out
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>
    </div>
  );
}
