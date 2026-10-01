import { FiGrid, FiLogOut, FiUnlock, FiUploadCloud, FiUser } from "react-icons/fi";
import { useSelector } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";
import useLogout from "../../../hooks/useLogout";
import "./ModelSchoolAdministratorNav.css";

const ModelSchoolAdministratorNav = () => {
  const user = useSelector((state) => state.auth.userInfo);
  const logout = useLogout();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="msa-nav" aria-label="Model School Administrator navigation">
      <div className="msa-nav__brand">
        <span>MS</span>
        <div><strong>Operations Desk</strong><small>Model School</small></div>
      </div>
      <div className="msa-nav__links">
        <NavLink to="/model-school-administrator/dashboard"><FiGrid /> Overview</NavLink>
        <NavLink to="/model-school-administrator/new-dashboard"><FiGrid /> New Dashboard</NavLink>
        <NavLink to="/model-school-administrator/students-mark"><FiGrid /> Students Mark</NavLink>
        <NavLink to="/model-school-administrator/uploads"><FiUploadCloud /> District Uploads</NavLink>
        <NavLink to="/model-school-administrator/pending-papers"><FiUnlock /> Pending Papers</NavLink>
      </div>
      <div className="msa-nav__user">
        <FiUser />
        <span><strong>{user?.User_Name || "Administrator"}</strong><small>Role 13</small></span>
        <button type="button" onClick={handleLogout} title="Logout" aria-label="Logout"><FiLogOut /></button>
      </div>
    </nav>
  );
};

export default ModelSchoolAdministratorNav;