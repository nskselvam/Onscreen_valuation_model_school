import React, { useState, useEffect } from 'react'
import { Container, Card, Button, Badge, Spinner, Form, Row, Col } from 'react-bootstrap'
import DataTable from 'react-data-table-component/dist/index.es.js'
import { useGetExaminerResetPasswordQuery , useResetExaminerPasswordMutation} from '../../redux-slice/examinerApiSlice'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux';
const { VITE_Institution_No } = import.meta.env;



const ResetPassword = () => {
    const [filterText, setFilterText] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [perPage, setPerPage] = useState(10)

    const { userInfo } = useSelector((state) => state.auth);

    // Debounce search: wait 400 ms after the user stops typing
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(filterText);
            setCurrentPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [filterText]);

    const [resetExaminerPassword] = useResetExaminerPasswordMutation();
    
    const { data: resetPasswordData, isLoading, isFetching, refetch } = useGetExaminerResetPasswordQuery({
        Dep_Name: userInfo?.selected_course || '',
        Eva_Mon_Year: userInfo?.eva_month_year || '',
        page: currentPage,
        limit: perPage,
        search: searchQuery,
    });

    const tableData = resetPasswordData?.data || [];
    const totalRows = resetPasswordData?.total || 0;
    const roleMasters = resetPasswordData?.roleMasters || [];

    // Create role map from roleMasters for dynamic role name lookup
    const roleMap = {};
    roleMasters.forEach(role => {
        roleMap[String(role.user_role_code)] = role.user_role;
    });

    const fetchUsers = () => refetch();

    const handlePasswordReset = (row) => {
        const passwordResetData = {
            id: row.id,
        };
        resetExaminerPassword(passwordResetData)
            .unwrap()
            .then((response) => {
                const emailStatus = response.data?.emailStatus || 'Unknown';
                const statusEmoji = emailStatus === 'Sent' ? '✅' : '⚠️';
                toast.success(
                    `Password reset successful for ${row.User_Name}. ` +
                    `${statusEmoji} Email Status: ${emailStatus}. ` +
                    `New password has been sent to ${response.data?.email || row.Email_Id}.`
                );
                // Refetch the user list to reflect changes
                refetch();
            })
            .catch((error) => {
                console.error('Error resetting password:', error);
                toast.error(error?.data?.message || 'Failed to reset password');
            });
    }

    const getRoleBadgeColor = (role) => {
        const roleColors = {
            '0': { bg: 'primary', text: 'white' },    // State User
            '1': { bg: 'success', text: 'white' },    // District User
            '2': { bg: 'danger', text: 'white' },     // Student User
            '3': { bg: 'warning', text: 'dark' }      // Zone User
        }
        return roleColors[role] || { bg: 'secondary', text: 'white' }
    }

    // Filter data based on search - now handled server-side

    const columns = [
        {
            name: 'S.No',
            cell: (row, index) => (currentPage - 1) * perPage + index + 1,
            sortable: false,
            width: '80px',
            style: {
                justifyContent: 'center',
            },
        },
        {
            name: 'Roll Number',
            selector: row => row.User_Id,
            sortable: true,
            width: '150px'
        },
        {
            name: 'Candidate Name',
            selector: row => row.User_Name,
            sortable: true,
            width: '200px',
            wrap: true
        },

        {
            name: 'Role',
            selector: row => row.RoleName || row.Role,
            sortable: true,
            width: '200px',
            style: {
                justifyContent: 'center',
            },
            wrap: true,
            cell: row => {
                //const roleName = row.RoleName || row.Role;
                const roles = (row.Role).includes(',') ? ( row.Role).split(',').map(r => r.trim()) : [ row.Role];
                
                return (
                    <div className="d-flex flex-wrap gap-1 justify-content-center">
                        {roles.map((role, index) => {
                            const colors = getRoleBadgeColor(role);
                            const roleName = roleMap[String(role)] || `Unknown (${role})`;
                            return (
                                <Badge
                                    key={index}
                                    bg={colors.bg}
                                    text={colors.text}
                                    style={{ fontSize: '11px', padding: '4px 8px' }}
                                >
                                    {roleName}
                                </Badge>
                            );
                        })}
                    </div>
                );
            }
        },
        {
            name: 'Email',
            selector: row => row.Email_Id,
            sortable: true,
            width: '220px',
            wrap: true
        },
        {
            name: 'Last Login',
            selector: row => row.updatedAt,
            sortable: true,
            width: '180px',
            cell: row => {
                if (!row.updatedAt) return 'Never';
                const date = new Date(row.updatedAt);
                return date.toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                }) + ' ' + date.toLocaleTimeString('en-GB', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            }
        },
        {
            name: 'Actions',
            width: '150px',
            style: {
                justifyContent: 'center',
            },
            cell: row => (
                <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handlePasswordReset(row)}
                >
                    Password Reset
                </Button>
            )
        }
    ]

    const customStyles = {
        headRow: {
            style: {
                backgroundColor: '#2c5282',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '14px',
                borderBottom: '2px solid #1a365d'
            }
        },
        headCells: {
            style: {
                paddingLeft: '8px',
                paddingRight: '8px',
                borderRight: '1px solid #cbd5e0',
                '&:last-child': {
                    borderRight: 'none'
                }
            }
        },
        rows: {
            style: {
                minHeight: '85px',
                borderBottom: '1px solid #e2e8f0',
                '&:hover': {
                    backgroundColor: '#f7fafc',
                    cursor: 'pointer'
                }
            }
        },
        cells: {
            style: {
                paddingLeft: '8px',
                paddingRight: '8px',
                borderRight: '1px solid #e2e8f0',
                '&:last-child': {
                    borderRight: 'none'
                }
            }
        }
    }

    return (
        <Container fluid className="p-4">
            <h3 className="mb-4" style={{ color: '#2c5282', fontWeight: '600' }}>
                Reset Password
            </h3>
            <Card>
                <Card.Body>
                    <Row className="mb-3">
                        <Col md={9}>
                            <Form.Group>
                                <Form.Control
                                    type="text"
                                    placeholder="Search by Roll Number, Name, or Role..."
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3} className="text-end">
                            <Button
                                variant="primary"
                                onClick={fetchUsers}
                                disabled={isFetching}
                            >
                                {isFetching ? <Spinner animation="border" size="sm" /> : 'Refresh'}
                            </Button>
                        </Col>
                    </Row>

                    {isLoading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3">Loading users...</p>
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
        </Container>
    )
}

export default ResetPassword