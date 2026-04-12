import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { CircleUserRound, Crown, LogOut, Swords, Trophy, Wallet } from "lucide-react";

import { useAuth } from "../context/AuthContext";

const navigation = [
  { to: "/dashboard", label: "Dashboard", icon: Crown },
  { to: "/matchmaking", label: "Find Match", icon: Swords },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/profile", label: "Profile", icon: CircleUserRound },
  { to: "/wallet", label: "Wallet", icon: Wallet },
];

function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMatchRoute = location.pathname.startsWith("/match/");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen px-4 py-5 md:px-8">
      {!isMatchRoute && (
        <header className="mx-auto mb-6 flex max-w-7xl flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="rounded-2xl bg-arena-500 px-3 py-2 font-bold text-arena-950">CA</div>
            <div>
              <div className="text-lg font-bold">CodeCamp Arena</div>
              <div className="text-sm text-paper-200/60">Realtime coding duels</div>
            </div>
          </Link>

          <nav className="flex flex-wrap gap-2">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `arena-button-secondary gap-2 ${isActive ? "border-arena-500/60 bg-arena-500/10 text-arena-400" : ""}`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-arena-900/60 px-4 py-2">
              <div className="text-sm font-medium">{user?.username}</div>
              <div className="text-xs text-paper-200/60">Rating {user?.rating} · {user?.coinBalance ?? 0} coins</div>
            </div>
            <button onClick={handleLogout} className="arena-button-secondary gap-2">
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </header>
      )}

      <main className={isMatchRoute ? "h-[calc(100vh-2.5rem)]" : "mx-auto max-w-7xl"}>{<Outlet />}</main>
    </div>
  );
}

export default AppShell;
