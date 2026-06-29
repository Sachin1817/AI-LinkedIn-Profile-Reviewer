import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LogOut, Activity, Compass } from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full px-4 py-4 md:px-8">
      <div className="max-w-7xl mx-auto glass-panel rounded-2xl px-6 py-4 flex items-center justify-between shadow-lg">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-blue to-brand-accentTeal flex items-center justify-center text-white font-black text-xl shadow-md shadow-brand-blue/20">
            L
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent group-hover:text-brand-accentBlue transition duration-300">
            Link<span className="text-brand-accentTeal">Reviewer</span>
          </span>
        </Link>

        {/* Navigation links */}
        <div className="flex items-center gap-6">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className={`flex items-center gap-1.5 text-sm font-medium transition duration-200 ${
                  isActive("/dashboard")
                    ? "text-brand-accentBlue font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Compass className="w-4.5 h-4.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              
              <Link
                to="/history"
                className={`flex items-center gap-1.5 text-sm font-medium transition duration-200 ${
                  isActive("/history")
                    ? "text-brand-accentBlue font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Activity className="w-4.5 h-4.5" />
                <span className="hidden sm:inline">History</span>
              </Link>

              {/* User profile / Log out separator */}
              <div className="h-5 w-[1px] bg-slate-800" />
              
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold uppercase">
                    {user.displayName ? user.displayName.substring(0, 2) : user.email?.substring(0, 2)}
                  </div>
                )}
                
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-400 transition-colors duration-200"
                  title="Sign Out"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            </>
          ) : (
            <Link
              to="/auth"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-blue to-blue-600 hover:from-blue-600 hover:to-brand-blue text-white text-sm font-bold shadow-md shadow-brand-blue/20 transition-all duration-300 transform hover:scale-[1.02]"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
