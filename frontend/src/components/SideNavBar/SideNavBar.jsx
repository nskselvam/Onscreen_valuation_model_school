import { useState, useEffect, useMemo, useRef } from 'react'
import { Col, Nav, Row, Modal, Button } from 'react-bootstrap'
import {
  FaHome, FaCog, FaChevronDown, FaChevronUp, FaSignOutAlt, FaBook, FaClipboard, FaUsers,
  FaChartBar, FaBars, FaTimes, FaFileAlt, FaUpload, FaDatabase, FaList, FaCheckCircle,
  FaFileExcel, FaUserCheck, FaNetworkWired, FaSms, FaUserTie, FaAngleRight,
  FaLayerGroup, FaGraduationCap, FaUniversity, FaTasks, FaCalendarAlt, FaIdCard,
  FaShieldAlt, FaTools, FaBell, FaDesktop, FaServer, FaThLarge, FaCubes, FaBuilding,
  FaBoxes, FaFolder, FaAward, FaProjectDiagram, FaChalkboardTeacher, FaClipboardList,
  FaClipboardCheck, FaKey, FaCertificate, FaMedal, FaTrophy, FaStar, FaFlag,
  FaEnvelope, FaSearch, FaEdit, FaLock, FaChartLine, FaChartPie, FaTable,
  FaFileInvoice, FaPaperPlane, FaCopy, FaCode, FaArrowLeft
} from 'react-icons/fa'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import '../../style/SideNavBar.css'
import { useGetNavbarMenuQuery } from "../../redux-slice/navBarApiSlice"
import useLogout from "../../hooks/useLogout"
import navbarRoute from '../gen/navbarRoute.json'
//import BranchMasterData from "../../json/BranchData.json"


// --- Random icon pools (module-level so they are stable across renders) ---
const LEVEL1_ICONS = [
  <FaHome />, <FaBook />, <FaClipboard />, <FaUsers />, <FaChartBar />, <FaCog />,
  <FaDatabase />, <FaLayerGroup />, <FaGraduationCap />, <FaUniversity />, <FaTasks />,
  <FaCalendarAlt />, <FaIdCard />, <FaShieldAlt />, <FaTools />, <FaBell />,
  <FaDesktop />, <FaServer />, <FaThLarge />, <FaCubes />, <FaBuilding />,
  <FaBoxes />, <FaFolder />, <FaAward />, <FaProjectDiagram />, <FaChalkboardTeacher />,
  <FaClipboardList />, <FaClipboardCheck />, <FaKey />, <FaCertificate />,
  <FaMedal />, <FaTrophy />, <FaStar />, <FaFlag />, <FaChartLine />, <FaChartPie />,
  <FaFileInvoice />, <FaTable />, <FaEdit />, <FaLock />
]

const SUBLEVEL_ICONS = [
  <FaAngleRight />, <FaFileAlt />, <FaUpload />, <FaFileExcel />, <FaUserCheck />,
  <FaList />, <FaCheckCircle />, <FaClipboard />, <FaUserTie />, <FaNetworkWired />,
  <FaSms />, <FaSearch />, <FaEnvelope />, <FaEdit />, <FaCopy />,
  <FaPaperPlane />, <FaCode />, <FaKey />, <FaStar />, <FaFlag />,
  <FaFolder />, <FaCalendarAlt />, <FaIdCard />, <FaTable />, <FaFileInvoice />,
  <FaChartLine />, <FaChartPie />, <FaClipboardList />, <FaClipboardCheck />, <FaBook />
]

const getRandomIcon = (pool) => pool[Math.floor(Math.random() * pool.length)]


const SideNavBar = ({ isCollapsed, setIsCollapsed }) => {
  const [expandedMenu, setExpandedMenu] = useState(null)
  const [expandedSubMenu, setExpandedSubMenu] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [activeMenuPath, setActiveMenuPath] = useState(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [hasAuthError, setHasAuthError] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const isLoggingOut = useRef(false)

  // Get current user info from Redux
  const { userInfo } = useSelector((state) => state.auth)
  console.log(userInfo)
  // Use selected_role (the role the user chose at login/pin screen)
  const currentUserType = userInfo?.selected_role ?? userInfo?.selectedRole ?? userInfo?.user_Type ?? userInfo?.userType ?? userInfo?.role ?? userInfo?.Role 





 
   //import BranchMasterData from "../../json/BranchData.json"

  
  const { data: navbarData, isLoading, isError, error } = useGetNavbarMenuQuery(
    { userRole : currentUserType },
    { skip: !currentUserType || hasAuthError } // Skip query if auth error occurred
  )


  // Calculate home route based on user role
  const selectedRole = userInfo?.selected_role ?? userInfo?.selectedRole ?? userInfo?.role ?? userInfo?.Role
  const homeRoute = useMemo(() => {
    const roleKey = selectedRole !== undefined && selectedRole !== null ? String(selectedRole) : ''

    if(roleKey == '11' || roleKey == '2') return '/examiner/valuation-review'
    if(roleKey == '13') return '/model-school-administrator/dashboard'
    if(roleKey == '0') return '/state/dashboard'
    if(roleKey == '1') return '/district/dashboard'
    
    const route = navbarRoute[roleKey]
    if (!route) return '/'
    return route.startsWith('/') ? route : `/${route}`
  }, [selectedRole])

  // Initialize logout hook before using it
  const logout = useLogout()

  // Handle error - for 401, apiSlice global handler will handle it
  // This only handles 403/404 permission errors
  useEffect(() => {
    if (error && !isLoggingOut.current) {
      
      // Check if this is a session/auth error (401 or specific 403 messages)
      const isAuthError = error.status === 401 || 
                         error.originalStatus === 401 ||
                         (error.status === 403 && error.data?.message?.includes('No navigation permissions'))
      
      if (isAuthError) {
        setHasAuthError(true) // Stop queries from running
        isLoggingOut.current = true
        // Global handler in apiSlice.js will show toast and redirect
      } else if (error.status === 403 || error.status === 404) {
        // For other permission errors, just show the error once
        toast.error(`Access Denied: You are not authorized to access ${location.pathname}`)
        isLoggingOut.current = true // Prevent duplicate toasts
      }
    }
  }, [error, location.pathname])


  
  const handleBack = () => {
    if(currentUserType == '0' || currentUserType == '2') {
      navigate('/state/dashboard')
    } 
  }

  // Transform backend data to menu item structure
  const transformBackendData = (data) => {
    if (!data || !Array.isArray(data)) {
      return []
    }

    const filteredData = data.map(item => item.dataValues || item)
    // const filteredData = menuData.filter(item => {
    //   const types = String(item.user_Type).split(',').map(t => t.trim())
    //   return types.includes(String(currentUserType))
    // })

    // Build hierarchical structure
    // Level 1: Nav_Header_1 > 0, Nav_Header_2 = 0, Nav_Header_3 = 0, Nav_Header_4 = 0
    // Level 2: Nav_Header_1 > 0, Nav_Header_2 > 0, Nav_Header_3 = 0, Nav_Header_4 = 0
    // Level 3: Nav_Header_1 > 0, Nav_Header_2 > 0, Nav_Header_3 > 0, Nav_Header_4 = 0
    // Level 4: Nav_Header_1 > 0, Nav_Header_2 > 0, Nav_Header_3 > 0, Nav_Header_4 > 0

    const sortedData = [...filteredData].sort((a, b) => {
      if (a.Nav_Header_1 !== b.Nav_Header_1) return a.Nav_Header_1 - b.Nav_Header_1
      if (a.Nav_Header_2 !== b.Nav_Header_2) return a.Nav_Header_2 - b.Nav_Header_2
      if (a.Nav_Header_3 !== b.Nav_Header_3) return a.Nav_Header_3 - b.Nav_Header_3
      return a.Nav_Header_4 - b.Nav_Header_4
    })

    const level1Items = sortedData.filter(
      item => item.Nav_Header_1 > 0 && item.Nav_Header_2 === 0 &&
              item.Nav_Header_3 === 0 && item.Nav_Header_4 === 0
    )

    const buildMenuItem = (item, level = 1) => {
      const menuItem = {
        id: `menu-${item.id}`,
        label: item.Nav_Main_Header_Name,
        icon: level === 1 ? getRandomIcon(LEVEL1_ICONS) : getRandomIcon(SUBLEVEL_ICONS),
        link: item.route_path || '#',
        description: item.Nav_Main_Header_Name_Description,
        userType: item.user_Type,
        status: item.Nav_Status
      }

      let children = []
      if (level === 1) {
        children = sortedData.filter(
          child => child.Nav_Header_1 === item.Nav_Header_1 &&
                   child.Nav_Header_2 > 0 &&
                   child.Nav_Header_3 === 0 &&
                   child.Nav_Header_4 === 0
        )
      } else if (level === 2) {
        children = sortedData.filter(
          child => child.Nav_Header_1 === item.Nav_Header_1 &&
                   child.Nav_Header_2 === item.Nav_Header_2 &&
                   child.Nav_Header_3 > 0 &&
                   child.Nav_Header_4 === 0
        )
      } else if (level === 3) {
        children = sortedData.filter(
          child => child.Nav_Header_1 === item.Nav_Header_1 &&
                   child.Nav_Header_2 === item.Nav_Header_2 &&
                   child.Nav_Header_3 === item.Nav_Header_3 &&
                   child.Nav_Header_4 > 0
        )
      }

      if (children.length > 0) {
        menuItem.children = children.map(child => buildMenuItem(child, level + 1))
      }

      return menuItem
    }

    return level1Items.map(item => buildMenuItem(item))
  }

  useEffect(() => {
    const source = navbarData?.data ?? navbarData
    if (Array.isArray(source) && source.length > 0) {
      const transformedMenu = transformBackendData(source)
      setMenuItems(transformedMenu)
    } else {
      setMenuItems([])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navbarData, currentUserType])

  // Track active menu based on current route
  useEffect(() => {
    const findActiveMenu = (items, path = []) => {
      for (const item of items) {
        const currentPath = [...path, item.id]
        
        if (item.link && item.link !== '#' && location.pathname === item.link) {
          setActiveMenuPath(item.id)
          // Auto-expand parent menus
          if (currentPath.length > 1) {
            setExpandedMenu(currentPath[0])
            if (currentPath.length > 2) {
              setExpandedSubMenu(currentPath[1])
            }
          }
          return true
        }
        
        if (item.children) {
          if (findActiveMenu(item.children, currentPath)) {
            return true
          }
        }
      }
      return false
    }

    if (menuItems.length > 0) {
      findActiveMenu(menuItems)
    }
  }, [location.pathname, menuItems])

  const toggleMenu = (menuName) => {
    setExpandedMenu(expandedMenu === menuName ? null : menuName)
    setExpandedSubMenu(null)
  }

  const toggleSubMenu = (subMenuName, e) => {
    e.stopPropagation()
    setExpandedSubMenu(expandedSubMenu === subMenuName ? null : subMenuName)
  }

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    setShowLogoutModal(false)
    logout()
    navigate('/login')
  }

  const handleNavigation = (e, link) => {
    if (link && link !== '#') {
      e.preventDefault()
      navigate(link)
    }
  }

  const renderMenuItems = (items, level = 1) => {
    return items.map((item) => {
      const isActive = activeMenuPath === item.id
      const isExpanded = expandedMenu === item.id
      
      return (
        <div key={item.id}>
          <div
            className="nav-item-wrapper"
            onClick={(e) => {
              if (item.children) {
                toggleMenu(item.id)
              } else {
                handleNavigation(e, item.link)
              }
            }}
          >
            <Nav.Link
              href={!item.children ? item.link : '#'}
              className={`nav-item nav-level-${level} ${isActive ? 'active' : ''} ${isExpanded ? 'expanded' : ''}`}
              onClick={(e) => {
                if (item.children) {
                  e.preventDefault()
                } else {
                  handleNavigation(e, item.link)
                }
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.children && (
                <span className="nav-chevron">
                  {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                </span>
              )}
            </Nav.Link>
          </div>

          {item.children && isExpanded && level < 3 && (
            <div className="nav-submenu">
              {item.children.map((subItem) => {
                const isSubActive = activeMenuPath === subItem.id
                const isSubExpanded = expandedSubMenu === subItem.id
                
                return (
                  <div key={subItem.id}>
                    <div
                      className="nav-item-wrapper"
                      onClick={(e) => {
                        if (subItem.children) {
                          toggleSubMenu(subItem.id, e)
                        } else {
                          handleNavigation(e, subItem.link)
                        }
                      }}
                    >
                      <Nav.Link
                        href={!subItem.children ? subItem.link : '#'}
                        className={`nav-item nav-level-${level + 1} ${isSubActive ? 'active' : ''} ${isSubExpanded ? 'expanded' : ''}`}
                        onClick={(e) => {
                          if (subItem.children) {
                            e.preventDefault()
                            toggleSubMenu(subItem.id, e)
                          } else {
                            handleNavigation(e, subItem.link)
                          }
                        }}
                      >
                        <span className="nav-icon">{subItem.icon}</span>
                        <span className="nav-label">{subItem.label}</span>
                        {subItem.children && (
                          <span className="nav-chevron">
                            {isSubExpanded ? <FaChevronUp /> : <FaChevronDown />}
                          </span>
                        )}
                      </Nav.Link>
                    </div>

                    {subItem.children && isSubExpanded && level < 2 && (
                      <div className="nav-submenu">
                        {subItem.children.map((thirdItem) => {
                          const isThirdActive = activeMenuPath === thirdItem.id
                          
                          return (
                            <Nav.Link
                              key={thirdItem.id}
                              href={thirdItem.link}
                              className={`nav-item nav-level-3 ${isThirdActive ? 'active' : ''}`}
                              onClick={(e) => handleNavigation(e, thirdItem.link)}
                            >
                              <span className="nav-icon">{thirdItem.icon}</span>
                              <span className="nav-label">{thirdItem.label}</span>
                            </Nav.Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <>
    
      <button 
        className={`sidebar-toggle-btn ${isCollapsed ? 'collapsed' : ''}`}
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <FaBars /> : <FaTimes />}
      </button>

      <aside className={`sidebar-container ${isCollapsed ? 'collapsed' : 'expanded'}`}>
        <div 
          className="sidebar-header" 
          onClick={() => navigate(homeRoute)}
          style={{ 
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            transition: 'all 0.3s ease',
            padding: '16px 12px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          <Row className="align-items-center justify-content-center">
            <Col xs="auto" className="p-0 m-0">
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#ffffff', margin: '4px 0 0 0', fontSize: '20px', fontWeight: '800' }}>
                  {isCollapsed ? 'D' : 'Dashboard'}
                </div>
              </div>
            </Col>
          </Row>
        </div>

        <div className="sidebar-body">
        {isLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#667eea' }}>
            Loading menu...
          </div>
        ) : isError ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444' }}>
            Error loading menu: {error?.data?.message || 'Please try again'}
          </div>
        ) : (
          <Nav className="flex-column nav-menu">
            {renderMenuItems(menuItems)}

            <hr />

            <Nav.Link
              onClick={handleBack}
              className="nav-item nav-back"
              title="Back"
            >
              {currentUserType != '1' ? (
                <>
                  <span className="nav-icon"><FaArrowLeft /></span>
                  <span className="nav-label">Back</span>
                </>
              ) : null}
            </Nav.Link>
            <Nav.Link
              onClick={handleLogout}
              className="nav-item nav-logout"
              title="Logout"
            >
              <span className="nav-icon"><FaSignOutAlt /></span>
              <span className="nav-label">Logout</span>
            </Nav.Link>
          </Nav>
        )}
      </div>
    </aside>

    {/* Logout Confirmation Modal */}
    <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
          Confirm Logout
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ fontSize: '14px', color: '#475569', padding: '20px 24px' }}>
        Are you sure you want to logout? Any unsaved changes will be lost.
      </Modal.Body>
      <Modal.Footer style={{ justifyContent: 'space-between' }}>
        <Button
          variant="danger"
          onClick={confirmLogout}
          style={{ fontWeight: '600', minWidth: '90px' }}
        >
          <FaSignOutAlt style={{ marginRight: '6px' }} />
          Logout
        </Button>
        <Button
          variant="outline-secondary"
          onClick={() => setShowLogoutModal(false)}
          style={{ fontWeight: '500', minWidth: '90px' }}
        >
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
    </>
  )
}

export default SideNavBar
