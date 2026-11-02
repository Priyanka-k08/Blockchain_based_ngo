import { NavLink, Outlet } from "react-router-dom";

const items = [
  ["", "Overview"],
  ["users", "Users"],
  ["campaigns", "Campaigns"],
  ["donations", "Donations"],
  ["beneficiaries", "Beneficiaries"],
  ["store", "Store"],
  ["expenses", "Expenses"],
  ["reports", "Reports"],
  ["messages", "Messages"],
  ["notifications", "WhatsApp"],
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-sand">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[200px_1fr]">
        <aside>
          <p className="font-display text-2xl">
            <a href="/">KindLedger</a>
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-copper">Admin desk</p>
          <nav className="mt-6 space-y-2 text-sm">
            {items.map(([path, label]) => (
              <NavLink
                key={label}
                end={path === ""}
                to={`/admin${path ? `/${path}` : ""}`}
                className={({ isActive }) =>
                  `block rounded-2xl px-3 py-2 ${isActive ? "bg-ink text-sand" : "hover:bg-white"}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <section>
          <Outlet />
        </section>
      </div>
    </div>
  );
}
