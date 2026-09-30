import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Badge, Spinner, Form, Row, Col, Alert } from 'react-bootstrap';
import DataTableBase from 'react-data-table-component';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select';
import { 
  useGetAllUserDataQuery, 
  useGetNavbarDetailsQuery,
  useCreateRollMasterMutation,
  useUpdateRollMasterMutation ,
  useUpdateRollMasterMappingMutation
} from '../../redux-slice/adminOperationApiSlice';

const DataTable = DataTableBase.default || DataTableBase;

const RollexaminerUpdate = () => {
  const [filterText, setFilterText]   = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage]         = useState(10);

  // Debounce search: wait 400 ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(filterText);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [filterText]);

  const { data: userDataFromApi, isLoading, isFetching, refetch } = useGetAllUserDataQuery(
    { page: currentPage, limit: perPage, search: searchQuery },
    { refetchOnMountOrArgChange: true }
  );

  const { data: navbarDataResponse, isLoading: isNavbarLoading } = useGetNavbarDetailsQuery();
  
  const [createRollMaster] = useCreateRollMasterMutation();
  const [updateRollMaster] = useUpdateRollMasterMutation();
  const [updateRollMasterMapping] = useUpdateRollMasterMappingMutation();

  const tableData = userDataFromApi?.data  || [];
  const totalRows = userDataFromApi?.total || 0;
  const roleMasters = userDataFromApi?.roleMasters || navbarDataResponse?.roleMasters || [];

  // Helper function to convert role IDs to role names
  const getRoleNames = (roleIds) => {
    if (!roleIds) return '-';
    const roleMap = {};
    roleMasters.forEach(role => {
      roleMap[String(role.user_role_code)] = role.user_role;
    });
    const ids = roleIds.split(',').map(id => id.trim());
    const names = ids.map(id => roleMap[id] || `Unknown (${id})`);
    return names.join(', ');
  };

  const [navbarOptions, setNavbarOptions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedNavbarIds, setSelectedNavbarIds] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingRollMaster, setIsUpdatingRollMaster] = useState(false);
  const [level1Headers, setLevel1Headers] = useState([]);
  const [selectedLevel1Header, setSelectedLevel1Header] = useState(null);
  const [filteredLevel2Options, setFilteredLevel2Options] = useState([]);
  const [showAllLevels, setShowAllLevels] = useState(false);
  const [selectedRoleColumn, setSelectedRoleColumn] = useState('0'); // Default to User_Roll_Admin_0

  // Update data when API data is loaded - now handled via tableData/totalRows above

  // Process navbar data for select options
  useEffect(() => {
    if (navbarDataResponse?.data_complete) {
      const options = navbarDataResponse.data_complete.map((item, index) => {
        const isMainHeader = item.Nav_Header_2 === 0;
        return {
          value: item.id,
          label: isMainHeader 
            ? `${item.id} - ${item.Nav_Main_Header_Name} [Main Header - Level ${item.Nav_Header_1}]`
            : `${item.id} - ${item.Nav_Main_Header_Name} (${item.Nav_Header_1}.${item.Nav_Header_2}.${item.Nav_Header_3}.${item.Nav_Header_4})`,
          navItem: item,
          isMainHeader: isMainHeader,
          key: `nav-${item.id}-${index}`
        };
      });
      setNavbarOptions(options);
      
      // Extract Level 1 main headers (Nav_Header_2 === 0)
      const level1Options = navbarDataResponse.data_complete
        .filter(item => item.Nav_Header_2 === 0)
        .map(item => ({
          value: item.id,
          label: `Level ${item.Nav_Header_1} - ${item.Nav_Main_Header_Name}`,
          navItem: item,
          level: item.Nav_Header_1
        }));
      setLevel1Headers(level1Options);
    }
  }, [navbarDataResponse]);
  
  // Filter Level 2 options based on selected Level 1 header
  useEffect(() => {
    if (selectedLevel1Header && navbarDataResponse?.data_complete) {
      const level1Value = selectedLevel1Header.navItem.Nav_Header_1;
      
      // Define specific IDs to include in submenu
      const specificSubMenuIds = [24, 9, 54, 55, 29, 28];
      
      if (showAllLevels) {
        // Show all Level 2 headers from all levels
        const allLevel2Options = navbarDataResponse.data_complete
          .filter(item => item.Nav_Header_2 !== 0)
          .map((item, index) => ({
            value: item.id,
            label: `${item.id} - ${item.Nav_Main_Header_Name} (${item.Nav_Header_1}.${item.Nav_Header_2}.${item.Nav_Header_3}.${item.Nav_Header_4})`,
            navItem: item,
            fromDifferentLevel: item.Nav_Header_1 !== level1Value,
            key: `all-level2-${item.id}-${index}`
          }));
        setFilteredLevel2Options(allLevel2Options);
      } else {
        // First, add the Level 1 Main Header itself
        const mainHeader = {
          value: selectedLevel1Header.value,
          label: `${selectedLevel1Header.value} - ${selectedLevel1Header.navItem.Nav_Main_Header_Name} [Level ${level1Value} Main Header]`,
          navItem: selectedLevel1Header.navItem,
          isMainHeader: true,
          key: `main-${selectedLevel1Header.value}`
        };
        
        // Then get all Level 2 sub-headers from the selected level
        const level2SubHeaders = navbarDataResponse.data_complete
          .filter(item => item.Nav_Header_1 === level1Value && item.Nav_Header_2 !== 0)
          .map((item, index) => ({
            value: item.id,
            label: `${item.id} - ${item.Nav_Main_Header_Name} (${item.Nav_Header_1}.${item.Nav_Header_2}.${item.Nav_Header_3}.${item.Nav_Header_4})`,
            navItem: item,
            key: `level2-${item.id}-${index}`
          }));
        
        // Add specific submenu items if they're not already in the level
        const specificItems = navbarDataResponse.data_complete
          .filter(item => specificSubMenuIds.includes(item.id) && item.Nav_Header_1 !== level1Value)
          .map((item, index) => ({
            value: item.id,
            label: `${item.id} - ${item.Nav_Main_Header_Name} (${item.Nav_Header_1}.${item.Nav_Header_2}.${item.Nav_Header_3}.${item.Nav_Header_4}) [Additional]`,
            navItem: item,
            isAdditional: true,
            key: `specific-${item.id}-${index}`
          }));
        
        // Combine: Main Header first, then Level 2 sub-headers, then additional items
        setFilteredLevel2Options([mainHeader, ...level2SubHeaders, ...specificItems]);
      }
    } else {
      setFilteredLevel2Options([]);
    }
  }, [selectedLevel1Header, navbarDataResponse, showAllLevels]);

  // Filter data based on search - now handled server-side

  // Handle Edit User Roll Admin
  const handleEditRollAdmin = (row, roleColumn) => {
    setSelectedUser(row);
    
    // If no roleColumn specified, use the first role from the user's Role field
    let initialRoleColumn = roleColumn;
    if (!initialRoleColumn && row.Role) {
      const userRoles = row.Role.split(',').map(r => r.trim());
      initialRoleColumn = userRoles.length > 0 ? userRoles[0] : '0';
    } else if (!initialRoleColumn) {
      initialRoleColumn = '0';
    }
    
    setSelectedRoleColumn(initialRoleColumn);
    
    // Parse existing User_Roll_Admin field based on selected role column
    const fieldName = `User_Roll_Admin_${initialRoleColumn}`;
    let existingIds = [];
    if (row[fieldName]) {
      try {
        // Handle both JSON array and comma-separated string formats
        if (row[fieldName].startsWith('[')) {
          existingIds = JSON.parse(row[fieldName]);
        } else {
          existingIds = row[fieldName].split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        }
      } catch (e) {
        console.error(`Error parsing ${fieldName}:`, e);
        existingIds = [];
      }
    }
    
    // Set selected options - include all existing IDs even if not in current options
    const selected = existingIds.map(id => {
      const existing = navbarOptions.find(opt => opt.value === id);
      if (existing) {
        return existing;
      } else {
        // Create a placeholder option for IDs not found in current data
        return {
          value: id,
          label: `ID: ${id} (Not found in current data)`,
          navItem: null
        };
      }
    });
    setSelectedNavbarIds(selected);
    setSelectedLevel1Header(null);
    setShowAllLevels(false);
    setShowEditModal(true);
  };

  // Handle navbar selection change with main header deletion/addition logic
  const handleNavbarSelectionChange = (newSelectedItems) => {
    // Helper to check if an item is a main header (Nav_Header_2 === 0)
    const isMainHeaderItem = (item) => {
      return item.navItem && item.navItem.Nav_Header_2 === 0;
    };
    
    // Check if a main header was removed or added
    const previousMainHeaders = selectedNavbarIds.filter(item => isMainHeaderItem(item));
    const currentMainHeaders = newSelectedItems.filter(item => isMainHeaderItem(item));
    
    // Find which main headers were removed
    const removedMainHeaders = previousMainHeaders.filter(
      prevItem => !currentMainHeaders.find(currItem => currItem.value === prevItem.value)
    );
    
    // Find which main headers were added
    const addedMainHeaders = currentMainHeaders.filter(
      currItem => !previousMainHeaders.find(prevItem => prevItem.value === currItem.value)
    );
    
    let filteredItems = [...newSelectedItems];
    
    // Handle removed main headers - remove all their sub-headers
    if (removedMainHeaders.length > 0 && navbarDataResponse?.data_complete) {
      removedMainHeaders.forEach(removedMainHeader => {
        const mainHeaderLevel1 = removedMainHeader.navItem.Nav_Header_1;
        
        // Remove all sub-headers belonging to this main header
        filteredItems = filteredItems.filter(item => {
          // Keep items without navItem (placeholders)
          if (!item.navItem) {
            return true;
          }
          
          // Keep the item if it's a main header (Nav_Header_2 === 0)
          if (item.navItem.Nav_Header_2 === 0) {
            return true;
          }
          
          // For sub-headers (Nav_Header_2 !== 0), keep only if they don't belong to the removed main header
          return item.navItem.Nav_Header_1 !== mainHeaderLevel1;
        });
      });
      
      // Show toast notification for removal
      if (removedMainHeaders.length === 1) {
        toast.info(`Main header removed along with all its sub-headers from Level ${removedMainHeaders[0].navItem.Nav_Header_1}`);
      } else {
        toast.info(`${removedMainHeaders.length} main headers removed along with their sub-headers`);
      }
    }
    
    // Handle added main headers - automatically add all their sub-headers
    if (addedMainHeaders.length > 0 && navbarDataResponse?.data_complete) {
      addedMainHeaders.forEach(addedMainHeader => {
        const mainHeaderLevel1 = addedMainHeader.navItem.Nav_Header_1;
        
        // Find all sub-headers belonging to this main header
        const subHeaders = navbarDataResponse.data_complete
          .filter(item => 
            item.Nav_Header_1 === mainHeaderLevel1 && 
            item.Nav_Header_2 !== 0
          )
          .map(item => ({
            value: item.id,
            label: `${item.id} - ${item.Nav_Main_Header_Name} (${item.Nav_Header_1}.${item.Nav_Header_2}.${item.Nav_Header_3}.${item.Nav_Header_4})`,
            navItem: item
          }));
        
        // Add sub-headers that are not already selected
        subHeaders.forEach(subHeader => {
          if (!filteredItems.find(item => item.value === subHeader.value)) {
            filteredItems.push(subHeader);
          }
        });
      });
      
      // Show toast notification for addition
      if (addedMainHeaders.length === 1) {
        const subHeaderCount = navbarDataResponse.data_complete.filter(item => 
          item.Nav_Header_1 === addedMainHeaders[0].navItem.Nav_Header_1 && 
          item.Nav_Header_2 !== 0
        ).length;
        toast.success(`Main header selected along with ${subHeaderCount} sub-header${subHeaderCount !== 1 ? 's' : ''} from Level ${addedMainHeaders[0].navItem.Nav_Header_1}`);
      } else {
        toast.success(`${addedMainHeaders.length} main headers selected along with their sub-headers`);
      }
    }
    
    setSelectedNavbarIds(filteredItems);
  };

  // Handle Level 1 Main Header selection - auto-select all its sub-headers
  const handleLevel1HeaderChange = (selectedLevel1) => {
    setSelectedLevel1Header(selectedLevel1);
    
    if (selectedLevel1 && navbarDataResponse?.data_complete) {
      const level1Value = selectedLevel1.navItem.Nav_Header_1;
      
      // Get the main header itself
      const mainHeader = {
        value: selectedLevel1.value,
        label: `${selectedLevel1.value} - ${selectedLevel1.navItem.Nav_Main_Header_Name} [Level ${level1Value} Main Header]`,
        navItem: selectedLevel1.navItem,
        isMainHeader: true
      };
      
      // Get all Level 2 sub-headers from the selected level
      const level2SubHeaders = navbarDataResponse.data_complete
        .filter(item => item.Nav_Header_1 === level1Value && item.Nav_Header_2 !== 0)
        .map(item => ({
          value: item.id,
          label: `${item.id} - ${item.Nav_Main_Header_Name} (${item.Nav_Header_1}.${item.Nav_Header_2}.${item.Nav_Header_3}.${item.Nav_Header_4})`,
          navItem: item
        }));
      
      // Combine main header and sub-headers
      const allHeadersToAdd = [mainHeader, ...level2SubHeaders];
      
      // Add to selected items (avoid duplicates)
      const updatedSelection = [...selectedNavbarIds];
      allHeadersToAdd.forEach(header => {
        if (!updatedSelection.find(item => item.value === header.value)) {
          updatedSelection.push(header);
        }
      });
      
      setSelectedNavbarIds(updatedSelection);
      
      toast.success(`Level ${level1Value} main header and ${level2SubHeaders.length} sub-header${level2SubHeaders.length !== 1 ? 's' : ''} selected`);
    }
  };

  // Handle Save User Roll Admin
  const handleSaveRollAdmin = async () => {
    if (!selectedUser) return;

    try {
      setIsSaving(true);
      
      // Convert selected options to array of IDs
      const navbarIds = selectedNavbarIds.map(opt => opt.value);
      
      const result = await updateRollMasterMapping({
        userId: selectedUser.id,
        evaId: selectedUser.Email_Id,
        userRollAdmin: JSON.stringify(navbarIds),
        roleColumn: selectedRoleColumn  // Send which column to update
      }).unwrap();
      
      toast.success('User Roll Admin updated successfully');
      setShowEditModal(false);
      refetch(); // Refresh the data
    } catch (error) {
      console.error('Error updating User Roll Admin:', error);
      toast.error(error?.data?.message || 'An error occurred while updating');
    } finally {
      setIsSaving(false);
    }
  };

  // Get navbar names from IDs - combines all User_Roll_Admin_0 through User_Roll_Admin_9
  const getNavbarNames = (row) => {
    try {
      let allIds = [];
      
      // Iterate through all User_Roll_Admin_0 to User_Roll_Admin_9 columns
      for (let i = 0; i <= 9; i++) {
        const fieldName = `User_Roll_Admin_${i}`;
        const fieldValue = row[fieldName];
        
        if (fieldValue) {
          let ids = [];
          if (fieldValue.startsWith('[')) {
            ids = JSON.parse(fieldValue);
          } else {
            ids = fieldValue.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
          }
          allIds = [...allIds, ...ids];
        }
      }
      
      // Remove duplicates
      allIds = [...new Set(allIds)];
      
      if (allIds.length === 0) return '-';
      
      const names = allIds.map(id => {
        const nav = navbarOptions.find(opt => opt.value === id);
        return nav ? nav.navItem.Nav_Main_Header_Name : `ID:${id}`;
      });
      
      return names.slice(0, 3).join(', ') + (names.length > 3 ? ` +${names.length - 3} more` : '');
    } catch (e) {
      return '-';
    }
  };

  // Handle Update Roll Master
  const handleUpdateRollMaster = async () => {
    const confirmed = window.confirm('This will update User_Roll_Admin fields for ALL users in the database based on their roles. Continue?');
    if (!confirmed) return;
    
    try {
      setIsUpdatingRollMaster(true);

      // Send empty request - backend will fetch all users automatically
      const response = await updateRollMasterMapping({
        ExaminerRoll: []
      }).unwrap();
      
      toast.success(response.message || `Successfully updated ${response.updated} users!`);
      refetch(); // Refresh current page data
    } catch (error) {
      console.error('Error updating roll master:', error);
      toast.error(error?.data?.message || 'Failed to update roll master data');
    } finally {
      setIsUpdatingRollMaster(false);
    }
  };

  // Table columns
  const columns = [
    {
      name: 'S.No',
      cell: (row, index) => (currentPage - 1) * perPage + index + 1,
      sortable: false,
      width: '70px',
      style: {
        justifyContent: 'center'
      }
    },
    {
      name: 'Name',
      selector: (row) => row.User_Name,
      sortable: true,
      width: '200px',
      wrap: true
    },
    {
      name: 'Email',
      selector: (row) => row.Email_Id,
      sortable: true,
      width: '200px',
      wrap: true
    },
    {
      name: 'Roles',
      selector: (row) => getRoleNames(row.Role),
      sortable: true,
      width: '150px',
      wrap: true,
      cell: (row) => (
        <div style={{ whiteSpace: 'normal', padding: '8px 0' }}>
          {getRoleNames(row.Role)}
        </div>
      ),
    },
    {
      name: 'Assigned Navbar Items',
      selector: (row) => getNavbarNames(row),
      sortable: false,
      width: '250px',
      wrap: true,
      cell: (row) => (
        <div style={{ whiteSpace: 'normal', padding: '8px 0' }}>
          <small>{getNavbarNames(row)}</small>
        </div>
      ),
    },
    {
      name: 'Status',
      selector: (row) => row.Active_Status,
      sortable: true,
      width: '100px',
      style: {
        justifyContent: 'center'
      },
      cell: (row) => (
        <Badge
          bg={row.Active_Status === 'Active' || row.Active_Status === null ? 'success' : 'danger'}
          style={{ fontSize: '12px', padding: '5px 10px' }}
        >
          {row.Active_Status || 'Active'}
        </Badge>
      ),
    },
    {
      name: 'Actions',
      cell: (row) => (
        <Button
          onClick={() => handleEditRollAdmin(row)}
          variant="primary"
          size="sm"
        >
          <i className="bi bi-pencil-square me-1"></i>
          Edit Roll
        </Button>
      ),
      ignoreRowClick: true,
      width: '130px',
      style: {
        justifyContent: 'center'
      }
    },
  ];

  // Custom styles for the table
  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#2c5282',
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: '14px',
        borderBottom: '2px solid #1a365d'
      },
    },
    headCells: {
      style: {
        paddingLeft: '8px',
        paddingRight: '8px',
        borderRight: '1px solid #cbd5e0',
        '&:last-child': {
          borderRight: 'none'
        }
      },
    },
    rows: {
      style: {
        minHeight: '45px',
        borderBottom: '1px solid #e2e8f0',
        '&:hover': {
          backgroundColor: '#f7fafc',
          cursor: 'pointer'
        }
      },
    },
    cells: {
      style: {
        paddingLeft: '8px',
        paddingRight: '8px',
        borderRight: '1px solid #e2e8f0',
        '&:last-child': {
          borderRight: 'none'
        }
      },
    }
  };

  // Custom styles for react-select
  const selectStyles = {
    control: (base) => ({
      ...base,
      minHeight: '45px',
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#e3f2fd',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#1976d2',
      fontWeight: '500',
    }),
  };

  return (
    <Container fluid className="p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <h3 className="mb-4" style={{ color: '#2c5282', fontWeight: '600' }}>
        <i className="bi bi-person-badge-fill me-2"></i>
        Roll Examiner Update - Navbar Assignment
      </h3>

      {/* Sub Header Level 2 */}
      <div className="mb-3">
        <h5 style={{ color: '#4a5568', fontWeight: '500', borderLeft: '4px solid #2c5282', paddingLeft: '12px' }}>
          <i className="bi bi-chevron-right me-2"></i>
          Sub Header Level 2
        </h5>
      </div>
      
      <Card>
        <Card.Body>
          <Row className="mb-3">
            <Col md={12}>
              <Alert variant="info">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Note:</strong> This module allows you to assign navbar items to users. 
                Default navbar IDs are: [1, 11, 10, 34, 36, 2, 9, 54, 55, 7, 27, 22, 21, 19, 20, 37, 40]
              </Alert>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={8}>
              <Form.Group>
                <Form.Control
                  type="text"
                  placeholder="Search by Name, Email, or Role..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4} className="text-end">
              <Button
                variant="success"
                onClick={handleUpdateRollMaster}
                disabled={isUpdatingRollMaster || totalRows === 0}
                className="w-100"
              >
                {isUpdatingRollMaster ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-repeat me-2"></i>
                    Update Roll Master
                  </>
                )}
              </Button>
              <small className="text-muted">
                Sync navbar assignments to roll_master table
              </small>
            </Col>
          </Row>

          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading data...</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={tableData}
              pagination
              paginationServer
              paginationTotalRows={totalRows}
              paginationPerPage={perPage}
              paginationRowsPerPageOptions={[10, 20, 30, 50]}
              onChangePage={(page) => setCurrentPage(page)}
              onChangeRowsPerPage={(newPerPage, page) => { setPerPage(newPerPage); setCurrentPage(page); }}
              progressPending={isFetching}
              progressComponent={<Spinner animation="border" variant="primary" className="my-3" />}
              highlightOnHover
              striped
              responsive
              customStyles={customStyles}
              noDataComponent={
                <div className="text-center py-5">
                  <p>No users found</p>
                </div>
              }
            />
          )}
        </Card.Body>
      </Card>

      {/* Edit User Roll Admin Modal */}
      {showEditModal && selectedUser && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-pencil-square me-2"></i>
                  Edit Navbar Assignment for {selectedUser.User_Name}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowEditModal(false)}
                  disabled={isSaving}
                ></button>
              </div>
              <div className="modal-body">
                <Row className="mb-3">
                  <Col md={12}>
                    <strong>Email:</strong> {selectedUser.Email_Id}
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={12}>
                    <strong>Current Roles:</strong> {getRoleNames(selectedUser.Role)}
                  </Col>
                </Row>
                <hr />
                                {/* Role Column Selector */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">
                    <i className="bi bi-person-badge me-2"></i>
                    Select Role Column to Edit
                  </Form.Label>
                  <Form.Select
                    value={selectedRoleColumn}
                    onChange={(e) => {
                      const newRoleColumn = e.target.value;
                      setSelectedRoleColumn(newRoleColumn);
                      // Reload navbar items for the new role column
                      if (selectedUser) {
                        const fieldName = `User_Roll_Admin_${newRoleColumn}`;
                        let existingIds = [];
                        if (selectedUser[fieldName]) {
                          try {
                            if (selectedUser[fieldName].startsWith('[')) {
                              existingIds = JSON.parse(selectedUser[fieldName]);
                            } else {
                              existingIds = selectedUser[fieldName].split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
                            }
                          } catch (e) {
                            console.error(`Error parsing ${fieldName}:`, e);
                            existingIds = [];
                          }
                        }
                        const selected = existingIds.map(id => {
                          const existing = navbarOptions.find(opt => opt.value === id);
                          if (existing) {
                            return existing;
                          } else {
                            return {
                              value: id,
                              label: `ID: ${id} (Not found in current data)`,
                              navItem: null
                            };
                          }
                        });
                        setSelectedNavbarIds(selected);
                      }
                    }}
                  >
                    {selectedUser && selectedUser.Role ? (
                      selectedUser.Role.split(',').map(roleId => {
                        const trimmedRole = roleId.trim();
                        const roleMap = {
                          '0': 'State User',
                          '1': 'District User',
                          '2': 'Student User',
                          '3': 'Zone User'
                        };
                        const roleName = roleMap[trimmedRole] || `Role ${trimmedRole}`;
                        return (
                          <option key={trimmedRole} value={trimmedRole}>
                            {roleName}
                          </option>
                        );
                      })
                    ) : (
                      <option value="0">No roles available</option>
                    )}
                  </Form.Select>
                  <small className="text-muted">
                    Select which role column to assign navbar items to (filtered by user's roles)
                  </small>
                </Form.Group>
                {/* Level 1 Main Header Selection */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">
                    <i className="bi bi-folder me-2"></i>
                    Select Level 1 Main Header (Auto-selects all sub-headers)
                  </Form.Label>
                  <Select
                    options={level1Headers}
                    value={selectedLevel1Header}
                    onChange={handleLevel1HeaderChange}
                    placeholder="Select a Level 1 header to auto-select all its Level 2 sub-headers..."
                    styles={selectStyles}
                    isSearchable
                    isClearable
                  />
                  <small className="text-muted">
                    Selecting a Level 1 main header will automatically select the main header and all its Level 2 sub-headers below.
                  </small>
                </Form.Group>
                
                {/* Toggle to show all Level 2 from all levels */}
                {selectedLevel1Header && (
                  <Form.Group className="mb-3">
                    <Form.Check 
                      type="switch"
                      id="show-all-levels-switch"
                      label="Show Level 2 headers from all levels"
                      checked={showAllLevels}
                      onChange={(e) => setShowAllLevels(e.target.checked)}
                    />
                    <small className="text-muted">
                      {showAllLevels ? 'Showing Level 2 from all levels' : 'Showing only from selected Level 1'}
                    </small>
                  </Form.Group>
                )}
                
                {/* Level 2 Navbar Items Selection */}
                <Form.Group>
                  <Form.Label className="fw-bold">
                    <i className="bi bi-list-ul me-2"></i>
                    Assign Navbar Items (User_Roll_Admin_{selectedRoleColumn})
                    {selectedLevel1Header && (
                      <Badge bg="info" className="ms-2">
                        Level {selectedLevel1Header.level}
                      </Badge>
                    )}
                  </Form.Label>
                  <Select
                    isMulti
                    options={selectedLevel1Header ? filteredLevel2Options : navbarOptions}
                    value={selectedNavbarIds}
                    onChange={handleNavbarSelectionChange}
                    placeholder={selectedLevel1Header ? "Select Level 2 sub-headers from selected main header..." : "Select navbar items or choose a Level 1 header first..."}
                    styles={selectStyles}
                    isSearchable
                    closeMenuOnSelect={false}
                    getOptionValue={(option) => option.key || `opt-${option.value}`}
                  />
                  <small className="text-muted">
                    Select multiple navbar items to assign to this user. Selected IDs will be stored as JSON array.
                    <br />
                    <strong className="text-success">Auto-Select:</strong> Selecting a main header (e.g., 8.0.0.0) will automatically select all its sub-headers (e.g., 8.1.0.0, 8.2.0.0, 8.3.0.0, etc.).
                    <br />
                    <strong className="text-danger">Auto-Delete:</strong> Deleting a main header will automatically remove all its sub-headers.
                  </small>
                </Form.Group>

                {selectedNavbarIds.length > 0 && (
                  <div className="mt-3 p-3 bg-light rounded">
                    <strong>Selected Navbar IDs:</strong>
                    <div className="mt-2">
                      <code>
                        [{selectedNavbarIds.map(opt => opt.value).join(', ')}]
                      </code>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <Button
                  variant="secondary"
                  onClick={() => setShowEditModal(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveRollAdmin}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-save me-2"></i>
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default RollexaminerUpdate;