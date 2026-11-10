import { Link, useLocation } from "wouter";
import { Compass, Menu, Plane, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { useTrip } from "@/contexts/TripContext";

const links = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/planner", label: "AI Planner" },
  { href: "/trips", label: "My Trips" },
];

export function TripNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { setDraft } = useTrip();
  const isActive = (href: string) => href === location || (href !== "/" && location.startsWith(href));

  return (
    <header className="site-nav">
      <div className="container nav-inner">
        <Link href="/" className="brand" onClick={() => setMobileOpen(false)}>
          <span className="brand-mark"><Plane size={16} /></span><span>Trip<span>Wise</span></span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map(link => <Link key={link.href} href={link.href} className={isActive(link.href) ? "active" : ""} onClick={() => { if (link.href === "/planner") setDraft(null); }}>{link.label}</Link>)}
        </nav>
        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              <Link href="/profile" className="profile-chip"><span>{user?.name?.slice(0, 1) || "T"}</span>{user?.name?.split(" ")[0] || "Profile"}</Link>
              <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => void logout()}>Sign out</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="hidden sm:inline-flex" onClick={startLogin}>Sign in</Button>
              <Button className="button-teal" onClick={startLogin}><Sparkles size={15} /> Get started</Button>
            </>
          )}
          <button className="mobile-menu" onClick={() => setMobileOpen(open => !open)} aria-label="Toggle navigation">{mobileOpen ? <X /> : <Menu />}</button>
        </div>
      </div>
      {mobileOpen && <nav className="mobile-nav" aria-label="Mobile navigation">
        {links.map(link => <Link key={link.href} href={link.href} className={isActive(link.href) ? "active" : ""} onClick={() => { setMobileOpen(false); if (link.href === "/planner") setDraft(null); }}><Compass size={15} />{link.label}</Link>)}
        {isAuthenticated ? <button className="mobile-sign-out" onClick={() => { setMobileOpen(false); void logout(); }}>Sign out</button> : <button className="mobile-sign-out" onClick={startLogin}>Sign in</button>}
      </nav>}
    </header>
  );
}
