import React, { useState } from 'react';
import { Card, Row, Col, Spinner } from 'react-bootstrap';
import excelresources from './excelresource.json';
import axios from 'axios';
import { BASE_URL } from '../../constraint/constraint';

const ExcelTextSample = () => {
    const sampleFiles = excelresources.fileTypes;
    const [downloading, setDownloading] = useState(null);

    const handleDownload = async (fileName, name) => {
        try {
            setDownloading(fileName);
            
            const response = await axios({
                url: `${BASE_URL}/api/excel-text/download?fileName=${encodeURIComponent(fileName)}`,
                method: 'GET',
                responseType: 'blob',
                withCredentials: true,
            });

            // Create blob URL and trigger download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();

            // Cleanup
            link.remove();
            window.URL.revokeObjectURL(url);
            setDownloading(null);

        } catch (error) {
            console.error('Download error:', error);
            alert(`Failed to download ${name}: ${error.response?.data?.message || error.message}`);
            setDownloading(null);
        }
    };

    return (
        <Card className="h-100">
            <Card.Header className="bg-info text-white">
                <h5 className="mb-0">Download Sample Files</h5>
            </Card.Header>
            <Card.Body>
                <Row>
                    {sampleFiles.map((file) => (
                        <Col xs={6} md={6} key={file.id} className="mb-2">
                            <div 
                                className="p-2 border rounded bg-light text-center" 
                                style={{ 
                                    cursor: downloading === file.fileName ? 'wait' : 'pointer',
                                    opacity: downloading === file.fileName ? 0.6 : 1
                                }}
                                onClick={() => !downloading && file.fileName && handleDownload(file.fileName, file.name)}
                            >
                                {downloading === file.fileName ? (
                                    <small className="fw-medium text-secondary">
                                        <Spinner animation="border" size="sm" className="me-1" />
                                        Downloading...
                                    </small>
                                ) : (
                                    <small className="fw-medium text-primary text-decoration-underline">
                                        {file.name}
                                    </small>
                                )}
                            </div>
                        </Col>
                    ))}
                </Row>
            </Card.Body>
        </Card>
    );
};

export default ExcelTextSample;
