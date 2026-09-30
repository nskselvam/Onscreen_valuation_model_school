import React, { useRef, useState } from 'react';
import axios from 'axios';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import { FiDownload, FiFileText, FiUploadCloud } from 'react-icons/fi';
import UploadPageLayout from '../../components/DashboardComponents/UploadPageLayout';
import { BASE_URL } from '../../constraint/constraint';

const endpoint = `${BASE_URL}/api/excelupload/answer-sheet-folders`;

const ExcelFileCreation = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const fileInput = useRef(null);

    const downloadTemplate = async () => {
        setDownloading(true);
        setError('');
        try {
            const response = await axios.get(`${endpoint}/template`, {
                responseType: 'blob',
                withCredentials: true,
            });
            const url = URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'answer-sheet-folders.xlsx';
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch {
            setError('Could not download the Excel template. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    const uploadWorkbook = async (event) => {
        event.preventDefault();
        if (!file) {
            setError('Select an .xlsx file to upload.');
            return;
        }

        setUploading(true);
        setError('');
        setResult(null);
        try {
            const data = new FormData();
            data.append('file', file);
            const response = await axios.post(endpoint, data, { withCredentials: true });
            setResult(response.data);
            setFile(null);
            if (fileInput.current) fileInput.current.value = '';
        } catch (uploadError) {
            setError(uploadError.response?.data?.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <UploadPageLayout mainTopic="Excel File Creation" cardTitle="Answer Sheet Folders">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <div className="d-flex align-items-center gap-2 text-secondary">
                    <FiFileText size={22} aria-hidden="true" />
                    <span>AnswerSheet_Uploaded</span>
                </div>
                <Button variant="outline-primary" type="button" disabled={downloading || uploading} onClick={downloadTemplate}>
                    {downloading ? <Spinner animation="border" size="sm" className="me-2" /> : <FiDownload className="me-2" aria-hidden="true" />}
                    Download Excel template
                </Button>
            </div>

            <Form onSubmit={uploadWorkbook}>
                <Form.Group controlId="answerSheetExcelFile" className="mb-3">
                    <Form.Label>Excel workbook</Form.Label>
                    <Form.Control
                        ref={fileInput}
                        type="file"
                        accept=".xlsx"
                        disabled={uploading}
                        onChange={(event) => {
                            const selected = event.target.files?.[0];
                            setResult(null);
                            setError('');
                            if (selected && (!/\.xlsx$/i.test(selected.name) || selected.size > 5 * 1024 * 1024)) {
                                setFile(null);
                                event.target.value = '';
                                setError('Select an .xlsx workbook no larger than 5 MB.');
                            } else {
                                setFile(selected || null);
                            }
                        }}
                    />
                </Form.Group>
                <Button type="submit" disabled={!file || uploading || downloading}>
                    {uploading ? <Spinner animation="border" size="sm" className="me-2" /> : <FiUploadCloud className="me-2" aria-hidden="true" />}
                    {uploading ? 'Creating folders...' : 'Create folders'}
                </Button>
            </Form>

            {error && <Alert variant="danger" className="mt-4 mb-0" role="alert">{error}</Alert>}
            {result && (
                <Alert variant="success" className="mt-4 mb-0" role="status">
                    {result.rowsProcessed} row{result.rowsProcessed === 1 ? '' : 's'} processed in {result.storage === 's3' ? 'S3' : 'local storage'}.
                </Alert>
            )}
        </UploadPageLayout>
    );
};

export default ExcelFileCreation;