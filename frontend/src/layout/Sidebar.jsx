import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Stethoscope, Users, LogOut, ClipboardList, Pill } from "lucide-react";
import "./Sidebar.css";

function Sidebar({ patientCount }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const email = user.email || "";
  const initial = (user.name || email).charAt(0).toUpperCase() || "?";
  const displayName = user.name || email.split("@")[0] || "User";

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Stethoscope color="white" size={20} />
        </div>
        <div>
          <div className="sidebar-title">ClinicalAI</div>
          <div className="sidebar-subtitle">Management System</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/patients"
          className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
        >
          <span className="sidebar-link-content">
            <Users size={18} />
            Patient List
          </span>
        </NavLink>

        <NavLink
          to="/icd10-codes"
          className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
        >
          <span className="sidebar-link-content">
            <ClipboardList size={18} />
            ICD-10 Codes
          </span>
        </NavLink>

        <NavLink
          to="/medical-acts"
          className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
        >
          <span className="sidebar-link-content">
            <Pill size={18} />
            Medical Acts
          </span>
        </NavLink>
      </nav>

      <div className="sidebar-profile" ref={menuRef}>
        {menuOpen && (
          <div className="sidebar-profile-menu">
            <button className="sidebar-profile-menu-item" onClick={handleLogout}>
              <LogOut size={16} />
              Log out
            </button>
          </div>
        )}

        <button
          className="sidebar-profile-trigger"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <div className="sidebar-avatar">{initial}</div>
          <div className="sidebar-profile-info">
            <div className="sidebar-profile-name">{displayName}</div>
            <div className="sidebar-profile-email">{email}</div>
          </div>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;