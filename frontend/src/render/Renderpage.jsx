import React, { useState } from 'react'
import { Outlet } from "react-router-dom"
import GovNavbar from '../components/gen/GenNavbar'
import LogNavBar from '../components/gen/LogNavBar'
import SideNavBar from '../components/SideNavBar/SideNavBar'
import IdleTimeoutManager from '../components/IdleTimeoutManager/IdleTimeoutManager'
import "../style/general/general.css"
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import BranchMasterData from "../json/BranchData.json"

const Renderpage = () => {
  const Location = useLocation();
  const userinfo = useSelector((state) => state.auth.userInfo);
  const locationPath = Location.pathname;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const showSidebar = userinfo && locationPath !== '/common/dashboard'  && locationPath !== '/login' && locationPath !== '/candidate-dashboard'&& locationPath !== '/district/common/dashboard' && locationPath !== '/state-coordinator/common/dashboard' && locationPath !== '/headmaster/common/dashboard' && locationPath !== '/district-officials/common/dashboard' && locationPath !== '/state-assistant/common/dashboard' && !locationPath.startsWith('/model-school-administrator/');
  const ValuationScreen = locationPath == '/valuation' || locationPath == '/examiner/reviewe/valuationreview' || locationPath == '/valuation/chief-valuation' || locationPath == '/valuation/chief-valuation-review-main';

  const LoginScreen = locationPath == '/login' || locationPath == '/reset-password' || locationPath == '/candidate-dashboard' || locationPath == '/district/common/dashboard' || locationPath == '/state-coordinator/common/dashboard' || locationPath == '/headmaster/common/dashboard' || locationPath == '/district-officials/common/dashboard' || locationPath == '/state-assistant/common/dashboard';
  // Show navbar on all pages except valuation screens and login screens
  const showNavbar = !ValuationScreen;

  const WorkData = BranchMasterData.BranchMasterData

  return (
    <>
      {/* Idle Timeout Manager - monitors activity and auto-logout */}
      <IdleTimeoutManager />
      
      {showNavbar ? (
        userinfo && userinfo.selected_course && !LoginScreen ? (
          <LogNavBar data={WorkData.map((b) => {
            if (b.id === userinfo.selected_course) {
              return b.name;
            }
            return null;
          })} />
        ) : (
          <GovNavbar />
        )
      ) : null}

      {ValuationScreen ? (
        <Outlet />
      ) : (
        <div className={`main-layout ${!showNavbar ? 'no-navbar' : ''}`}>
          {showSidebar && (
            <SideNavBar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
          )}

          <div className={`main-content ${!showNavbar ? 'no-navbar-page' : ''} ${showSidebar ? (isSidebarCollapsed ? 'with-sidebar-collapsed' : 'with-sidebar-expanded') : 'no-sidebar'}`}>
            <Outlet />
          </div>
        </div>
      )}
    </>
  )
}

export default Renderpage
