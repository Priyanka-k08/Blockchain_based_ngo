import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/about", label: "About" },
  { to: "/campaigns", label: "Campaigns" },
  { to: "/store", label: "In-kind store" },
  { to: "/beneficiaries", label: "Beneficiaries" },
  { to: "/utilization", label: "Utilization" },
  { to: "/transparency", label: "Audit" },
  { to: "/impact", label: "Impact" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const home = location.pathname === "/";

  function signOut() {
    logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen grain">
      <header className={`sticky top-0 z-30 border-b ${home ? "border-white/10 bg-ink/90 text-sand" : "border-ink/10 bg-paper/90 text-ink"} backdrop-blur`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="font-display text-xl tracking-tight">
            KindLedger
          </Link>
          <nav className="hidden items-center gap-5 text-sm md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `hover:opacity-80 ${isActive ? "underline decoration-copper underline-offset-4" : ""}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link to="/admin" className="hidden sm:inline">
                    Desk
                  </Link>
                )}
                <Link to="/profile">{user.name.split(" ")[0]}</Link>
                <button type="button" onClick={signOut} className="opacity-70">
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login">Sign in</Link>
            )}
            <Link
              to="/donate"
              className="rounded-full bg-copper px-4 py-2 text-white"
            >
              Give
            </Link>
          </div>
        </div>
      </header>
      <nav className={`flex gap-4 overflow-x-auto px-4 py-3 text-sm md:hidden ${home ? "border-b border-white/10 bg-ink text-sand" : "border-b border-ink/10"}`}>
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className="whitespace-nowrap">
            {link.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
      <footer className="mt-20 border-t border-ink/10 bg-ink text-sand">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
          <div>
            <p className="font-display text-2xl">KindLedger Trust</p>
            <p className="mt-3 text-sm text-sand/70">
              A Madurai-based nonprofit that treats every donation as a public record, not a slogan.
            </p>
          </div>
          <div className="text-sm space-y-2">
            <p className="uppercase tracking-[0.2em] text-copper">Visit</p>
            <p>12, Lane 4, Thiruparankundram</p>
            <p>Madurai 411004</p>
          </div>
          <div className="text-sm space-y-2">
            <p className="uppercase tracking-[0.2em] text-copper">Open</p>
            <p>Mon–Sat, 9:30–18:00</p>
            <p>hello@kindledger.org</p>
          </div>
          <div className="text-sm space-y-2">
            <Link to="/about" className="block">About</Link>
            <Link to="/contact" className="block">Contact</Link>
            <Link to="/transparency" className="block">Public ledger</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
