import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Table, Button, Pagination } from 'react-bootstrap';
import * as XLSX from 'xlsx';

const ErrorLogExcel = () => {
    const errData = useSelector((state) => state.errinfo.errInfo);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Extract table data from errData
    const tableData = useMemo(() => {
        if (!errData) return [];
        
        // Check if Error_responseData exists
        if (errData.Error_responseData && Array.isArray(errData.Error_responseData)) {
            return errData.Error_responseData;
        }
        
        // If errData is an array, use it directly
        if (Array.isArray(errData)) {
            return errData;
        }
        
        return [];
    }, [errData]);

    // Pagination calculations
    const totalPages = Math.ceil(tableData.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = tableData.slice(indexOfFirstItem, indexOfLastItem);

    // Get table headers dynamically
    const tableHeaders = useMemo(() => {
        if (tableData.length === 0) return [];
        return Object.keys(tableData[0]);
    }, [tableData]);

    // Export to Excel
    const exportToExcel = () => {
        if (tableData.length === 0) return;
        
        const worksheet = XLSX.utils.json_to_sheet(tableData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Error Log');
        XLSX.writeFile(workbook, `ErrorLog_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Export to CSV
    const exportToCSV = () => {
        if (tableData.length === 0) return;

        const headers = Object.keys(tableData[0]);
        const csvContent = [
            headers.join(','),
            ...tableData.map(row => 
                headers.map(header => {
                    const value = row[header];
                    const stringValue = String(value || '');
                    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `ErrorLog_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const renderPaginationItems = () => {
        const items = [];
        const maxPagesToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage < maxPagesToShow - 1) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        if (startPage > 1) {
            items.push(
                <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
                    1
                </Pagination.Item>
            );
            if (startPage > 2) {
                items.push(<Pagination.Ellipsis key="ellipsis-start" disabled />);
            }
        }

        for (let page = startPage; page <= endPage; page++) {
            items.push(
                <Pagination.Item
                    key={page}
                    active={page === currentPage}
                    onClick={() => handlePageChange(page)}
                >
                    {page}
                </Pagination.Item>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                items.push(<Pagination.Ellipsis key="ellipsis-end" disabled />);
            }
            items.push(
                <Pagination.Item key={totalPages} onClick={() => handlePageChange(totalPages)}>
                    {totalPages}
                </Pagination.Item>
            );
        }

        return items;
    };

    if (tableData.length === 0) return null;

    return (
        <div className="mt-4 p-3 bg-white rounded shadow-sm border border-danger border-opacity-25">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="text-danger mb-0">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    Error Log ({tableData.length} errors found)
                </h5>
                <div className="d-flex gap-2">
                    <Button variant="outline-success" size="sm" onClick={exportToExcel}>
                        <i className="bi bi-file-earmark-excel me-1"></i>
                        Export Excel
                    </Button>
                    <Button variant="outline-primary" size="sm" onClick={exportToCSV}>
                        <i className="bi bi-file-earmark-text me-1"></i>
                        Export CSV
                    </Button>
                </div>
            </div>

            <div className="table-responsive">
                <Table striped bordered hover size="sm" className="mb-0">
                    <thead className="table-danger">
                        <tr>
                            <th style={{ width: '60px' }}>#</th>
                            {tableHeaders.map((header, idx) => (
                                <th key={idx} className="text-capitalize">
                                    {header.replace(/_/g, ' ')}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                <td>{indexOfFirstItem + rowIndex + 1}</td>
                                {tableHeaders.map((header, colIndex) => (
                                    <td key={colIndex}>
                                        {row[header] !== undefined && row[header] !== null 
                                            ? String(row[header]) 
                                            : '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                    <small className="text-muted">
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, tableData.length)} of {tableData.length} entries
                    </small>
                    <Pagination size="sm" className="mb-0">
                        <Pagination.Prev
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                        />
                        {renderPaginationItems()}
                        <Pagination.Next
                            disabled={currentPage === totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
                        />
                    </Pagination>
                </div>
            )}
        </div>
    );
};

export default ErrorLogExcel;
