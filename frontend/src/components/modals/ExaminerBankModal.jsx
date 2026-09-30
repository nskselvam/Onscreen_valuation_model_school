import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { FaUniversity, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useGetUserBankDetailsQuery } from "../../redux-slice/userDashboardSlice";
import {usePostUserBankDetailsUpdateMutation } from "../../redux-slice/userDashboardSlice";
import { useSelector } from "react-redux";

const ExaminerBankModal = ({ show, onHide, onSuccess, bankDetails }) => {

const userInfo = useSelector((state) => state.auth.userInfo);

    
    const [formData, setFormData] = useState({
        accountHolderName: '',
        accountNumber: '',
        confirmAccountNumber: '',
        accountType: '',
        ifscCode: '',
        bankName: '',
        branchName: '',
        Type_Edit: "",
        Evaluator_Id: '',
        branchAddress: '',
        
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [fetchingBank, setFetchingBank] = useState(false);
    const [bankFetchError, setBankFetchError] = useState('');
    const [submitError, setSubmitError] = useState('');

    const [skipQuery, setSkipQuery] = useState(true);
    const [ifscToFetch, setIfscToFetch] = useState('');

    // Use RTK Query to fetch bank details from local database
    const { data: bankDataFromDB, error: bankError, isLoading: isBankLoading } = useGetUserBankDetailsQuery(
        { ifsc: ifscToFetch },
        { skip: skipQuery }
    );

    // Use mutation hook for updating bank details
    const [updateBankDetails, { isLoading: isUpdating }] = usePostUserBankDetailsUpdateMutation();

    // Reset form when modal opens
    useEffect(() => {
        if (show) {
            setFormData({
                accountHolderName: bankDetails && bankDetails.EMPLOYEE_NAME ? bankDetails.EMPLOYEE_NAME : userInfo ? userInfo.name.toUpperCase() : '',
                accountNumber: bankDetails && bankDetails.BANK_ACCOUNT_NUMBER ? bankDetails.BANK_ACCOUNT_NUMBER : '',
                confirmAccountNumber: bankDetails && bankDetails.BANK_ACCOUNT_NUMBER ? bankDetails.BANK_ACCOUNT_NUMBER : '',
                accountType: bankDetails && bankDetails.NATUREOFBANK ? bankDetails.NATUREOFBANK : '',
                ifscCode: bankDetails && bankDetails.IFSC ? bankDetails.IFSC : '',
                bankName: bankDetails && bankDetails.BANK_NAME ? bankDetails.BANK_NAME : '',
                branchName: bankDetails && bankDetails.BRANCH ? bankDetails.BRANCH : '',
                Type_Edit: bankDetails && bankDetails.Type_Edit ? bankDetails.Type_Edit : false,
                Evaluator_Id: bankDetails && bankDetails.Evaluator_Id ? bankDetails.Evaluator_Id : userInfo ? userInfo.username : '',
                branchAddress: bankDetails && (bankDetails.BANK_ADDRESS || bankDetails.ADDRESS) ? (bankDetails.BANK_ADDRESS || bankDetails.ADDRESS) : '',
            });
            setErrors({});
            setBankFetchError('');
            setSubmitError('');
        }
    }, [show]);


    // Fetch bank details when IFSC code is valid (11 characters)
    useEffect(() => {
        if (formData.ifscCode.length === 11) {
            setIfscToFetch(formData.ifscCode);
            setSkipQuery(false);
        } else {
            setSkipQuery(true);
            setFormData(prev => ({
                ...prev,
                bankName: '',
                branchName: '',
                branchAddress: ''
            }));
        }
    }, [formData.ifscCode]);

    // Handle bank data response from local database
    useEffect(() => {
        if (isBankLoading) {
            setFetchingBank(true);
            setBankFetchError('');
        } else if (bankError) {
            setFetchingBank(false);
            setBankFetchError('Invalid IFSC code. Please check and try again.');
            setFormData(prev => ({
                ...prev,
                bankName: '',
                branchName: '',
                branchAddress: ''
            }));
        } else if (bankDataFromDB) {
            setFetchingBank(false);
            setBankFetchError('');
            setFormData(prev => ({
                ...prev,
                bankName: bankDataFromDB.BANK_NAME || bankDataFromDB.BANK || '',
                branchName: bankDataFromDB.BRANCH || '',
                branchAddress: bankDataFromDB.ADDRESS || ''
            }));
        }
    }, [bankDataFromDB, bankError, isBankLoading]);

    // Fetch bank details when IFSC code is valid (11 characters)
    // useEffect(() => {
    //     const fetchBankDetails = async () => {
    //         if (formData.ifscCode.length === 11) {
    //             setFetchingBank(true);
    //             setBankFetchError('');
    //             try {
    //                 // Using Razorpay IFSC API (free public API)
    //                 const response = await fetch(`https://ifsc.razorpay.com/${formData.ifscCode}`);
    //                 if (response.ok) {
    //                     const data = await response.json();
    //                     setFormData(prev => ({
    //                         ...prev,
    //                         bankName: data.BANK || '',
    //                         branchName: data.BRANCH || ''
    //                     }));
    //                     setBankFetchError('');
    //                 } else {
    //                     setBankFetchError('Invalid IFSC code. Please check and try again.');
    //                     setFormData(prev => ({
    //                         ...prev,
    //                         bankName: '',
    //                         branchName: ''
    //                     }));
    //                 }
    //             } catch (error) {
    //                 console.error('Error fetching bank details:', error);
    //                 setBankFetchError('Unable to fetch bank details. Please enter manually.');
    //             }
    //             setFetchingBank(false);
    //         } else {
    //             setFormData(prev => ({
    //                 ...prev,
    //                 bankName: '',
    //                 branchName: ''
    //             }));
    //         }
    //     };

    //     const debounceTimer = setTimeout(fetchBankDetails, 500);
    //     return () => clearTimeout(debounceTimer);
    // }, [formData.ifscCode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Format IFSC code to uppercase
        if (name === 'ifscCode') {
            setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
        } 
        // Only allow numbers for account fields
        else if (name === 'accountNumber' || name === 'confirmAccountNumber') {
            const numericValue = value.replace(/\D/g, '');
            setFormData(prev => ({ ...prev, [name]: numericValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Account Holder Name validation
        if (!formData.accountHolderName) {
            newErrors.accountHolderName = 'Account holder name is required';
        } else if (formData.accountHolderName.length < 2) {
            newErrors.accountHolderName = 'Name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s.]+$/.test(formData.accountHolderName)) {
            newErrors.accountHolderName = 'Name can only contain letters, spaces, and periods';
        }

        // Account Number validation
        if (!formData.accountNumber) {
            newErrors.accountNumber = 'Account number is required';
        } else if (formData.accountNumber.length < 9 || formData.accountNumber.length > 18) {
            newErrors.accountNumber = 'Account number must be between 9 and 18 digits';
        }

        // Confirm Account Number validation
        if (!formData.confirmAccountNumber) {
            newErrors.confirmAccountNumber = 'Please confirm your account number';
        } else if (formData.accountNumber !== formData.confirmAccountNumber) {
            newErrors.confirmAccountNumber = 'Account numbers do not match';
        }

        // Account Type validation
        if (!formData.accountType) {
            newErrors.accountType = 'Account type is required';
        }

        // IFSC Code validation
        if (!formData.ifscCode) {
            newErrors.ifscCode = 'IFSC code is required';
        } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode)) {
            newErrors.ifscCode = 'Invalid IFSC code format (e.g., SBIN0001234)';
        }

        // Bank Name validation
        if (!formData.bankName) {
            newErrors.bankName = 'Bank name is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
           // formData.Type_Edit = true;
            const response = await updateBankDetails(formData).unwrap();

            // TODO: Replace with actual API endpoint
            // const response = await fetch('/api/examiner/bank-details', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({
            //         accountHolderName: formData.accountHolderName,
            //         accountNumber: formData.accountNumber,
            //         accountType: formData.accountType,
            //         ifscCode: formData.ifscCode,
            //         bankName: formData.bankName,
            //         branchName: formData.branchName
            //     })
            // });

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // On success
            if (onSuccess) {
                onSuccess(formData);
            }
        } catch (error) {
            console.error('Error saving bank details:', error);
            setSubmitError('Failed to save bank details. Please try again.');
        }
        setLoading(false);
    };

    const isAccountMatch = formData.accountNumber && 
                          formData.confirmAccountNumber && 
                          formData.accountNumber === formData.confirmAccountNumber;

    const S = {
        modal: { fontFamily: "'Segoe UI', sans-serif" },
        header: {
            background: 'linear-gradient(135deg, #1a56db 0%, #0e9384 100%)',
            padding: '18px 24px',
            borderRadius: '0',
        },
        headerTitle: {
            display: 'flex', alignItems: 'center', gap: '10px',
            color: '#fff', fontWeight: '700', fontSize: '16px', margin: 0,
        },
        headerBadge: {
            background: 'rgba(255,255,255,0.25)', borderRadius: '20px',
            padding: '3px 10px', fontSize: '11px', color: '#fff',
            fontWeight: '600', letterSpacing: '0.5px',
        },
        body: { padding: '24px 28px', background: '#f8fafc' },
        sectionCard: {
            background: '#fff', borderRadius: '10px',
            border: '1px solid #e2e8f0', padding: '18px 20px', marginBottom: '16px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        },
        sectionHeader: {
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '13px', fontWeight: '700', color: '#1a56db',
            marginBottom: '16px', paddingBottom: '10px',
            borderBottom: '2px solid #ebf5ff',
            textTransform: 'uppercase', letterSpacing: '0.5px',
        },
        sectionIcon: {
            width: '26px', height: '26px', borderRadius: '6px',
            background: 'linear-gradient(135deg, #1a56db, #0e9384)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '13px', flexShrink: 0,
        },
        label: {
            fontSize: '12px', fontWeight: '700', color: '#4a5568',
            marginBottom: '5px', display: 'block', textTransform: 'uppercase',
            letterSpacing: '0.4px',
        },
        required: { color: '#e53e3e', marginLeft: '2px' },
        input: {
            fontSize: '13px', borderRadius: '7px',
            border: '1.5px solid #e2e8f0', padding: '9px 12px',
            transition: 'border-color 0.2s, box-shadow 0.2s', color: '#2d3748',
        },
        inputReadonly: {
            background: 'linear-gradient(135deg, #f0fdf4, #f7fee7)',
            border: '1.5px solid #bbf7d0', color: '#166534',
            fontWeight: '600', fontSize: '13px', borderRadius: '7px',
            padding: '9px 12px',
        },
        helpText: { fontSize: '11px', color: '#718096', marginTop: '4px' },
        matchBadge: (ok) => ({
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            fontSize: '11px', fontWeight: '700', padding: '3px 10px',
            borderRadius: '20px', marginTop: '5px',
            background: ok ? '#f0fdf4' : '#fff5f5',
            color: ok ? '#15803d' : '#dc2626',
            border: `1px solid ${ok ? '#bbf7d0' : '#fecaca'}`,
        }),
        verifiedCard: {
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            border: '1.5px solid #6ee7b7', borderRadius: '10px',
            padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px',
        },
        verifiedIcon: {
            width: '36px', height: '36px', borderRadius: '50%',
            background: '#10b981', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff', fontSize: '16px', flexShrink: 0,
        },
        footer: {
            background: '#f1f5f9', borderTop: '1px solid #e2e8f0',
            padding: '14px 24px', display: 'flex', justifyContent: 'flex-end', gap: '10px',
        },
        btnCancel: {
            borderRadius: '8px', padding: '9px 22px', fontSize: '13px',
            fontWeight: '600', border: '1.5px solid #cbd5e0', color: '#4a5568',
            background: '#fff',
        },
        btnSave: {
            borderRadius: '8px', padding: '9px 26px', fontSize: '13px',
            fontWeight: '700', border: 'none',
            background: 'linear-gradient(135deg, #1a56db 0%, #0e9384 100%)',
            color: '#fff', boxShadow: '0 2px 8px rgba(26,86,219,0.3)',
        },
    };

    return (
        <Modal show={show} onHide={onHide} centered backdrop="static" size="lg" style={S.modal}>
            {/* ── HEADER ── */}
            <div style={S.header}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={S.headerTitle}>
                        <FaUniversity size={18} />
                        Bank Account Details
                        <span style={S.headerBadge}>
                            {formData.Type_Edit ? 'EDIT' : 'ADD NEW'}
                        </span>
                    </div>
                    <button
                        onClick={onHide}
                        style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px',
                            cursor: 'pointer', opacity: 0.8, lineHeight: 1 }}
                        aria-label="Close"
                    >✕</button>
                </div>
                {formData.Evaluator_Id && (
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '6px' }}>
                        Examiner ID: <strong style={{ color: '#fff' }}>{formData.Evaluator_Id}</strong>
                    </div>
                )}
            </div>

            {/* ── BODY ── */}
            <div style={S.body}>
                {submitError && (
                    <Alert variant="danger" className="mb-3 py-2" style={{ fontSize: '13px', borderRadius: '8px' }}>
                        ⚠️ {submitError}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit}>

                    {/* ── SECTION 1 : Account Holder ── */}
                    <div style={S.sectionCard}>
                        <div style={S.sectionHeader}>
                            <span style={S.sectionIcon}>👤</span>
                            Account Holder Information
                        </div>
                        <Row>
                            <Col md={12}>
                                <Form.Group>
                                    <label style={S.label}>
                                        Account Holder Name <span style={S.required}>*</span>
                                    </label>
                                    <Form.Control
                                        type="text"
                                        name="accountHolderName"
                                        value={formData.accountHolderName}
                                        onChange={handleChange}
                                        placeholder="Enter name exactly as per bank records"
                                        isInvalid={!!errors.accountHolderName}
                                        autoComplete="off"
                                        style={{ ...S.input, textTransform: 'uppercase' }}
                                    />
                                    <Form.Control.Feedback type="invalid" style={{ fontSize: '11px' }}>
                                        {errors.accountHolderName}
                                    </Form.Control.Feedback>
                                    <div style={S.helpText}>Must match name as registered with your bank</div>
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>

                    {/* ── SECTION 2 : Account Details ── */}
                    <div style={S.sectionCard}>
                        <div style={S.sectionHeader}>
                            <span style={S.sectionIcon}>🏦</span>
                            Account Details
                        </div>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <label style={S.label}>
                                        Account Number <span style={S.required}>*</span>
                                    </label>
                                    <Form.Control
                                        type="text"
                                        name="accountNumber"
                                        value={formData.accountNumber}
                                        onChange={handleChange}
                                        placeholder="Enter account number"
                                        maxLength={18}
                                        isInvalid={!!errors.accountNumber}
                                        autoComplete="off"
                                        style={S.input}
                                    />
                                    <Form.Control.Feedback type="invalid" style={{ fontSize: '11px' }}>
                                        {errors.accountNumber}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <label style={S.label}>
                                        Confirm Account Number <span style={S.required}>*</span>
                                    </label>
                                    <div className="position-relative">
                                        <Form.Control
                                            type="text"
                                            name="confirmAccountNumber"
                                            value={formData.confirmAccountNumber}
                                            onChange={handleChange}
                                            placeholder="Re-enter account number"
                                            maxLength={18}
                                            isInvalid={!!errors.confirmAccountNumber}
                                            isValid={isAccountMatch}
                                            autoComplete="off"
                                            style={{ ...S.input, paddingRight: '42px' }}
                                        />
                                        {formData.confirmAccountNumber && (
                                            <span style={{
                                                position: 'absolute', right: '12px', top: '50%',
                                                transform: 'translateY(-50%)', fontSize: '16px',
                                                color: isAccountMatch ? '#15803d' : '#dc2626',
                                            }}>
                                                {isAccountMatch ? <FaCheckCircle /> : <FaTimesCircle />}
                                            </span>
                                        )}
                                        <Form.Control.Feedback type="invalid" style={{ fontSize: '11px' }}>
                                            {errors.confirmAccountNumber}
                                        </Form.Control.Feedback>
                                    </div>
                                    {formData.confirmAccountNumber && (
                                        <div style={S.matchBadge(isAccountMatch)}>
                                            {isAccountMatch
                                                ? <><FaCheckCircle /> Account numbers match</>
                                                : <><FaTimesCircle /> Numbers do not match</>}
                                        </div>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group>
                                    <label style={S.label}>
                                        Account Type <span style={S.required}>*</span>
                                    </label>
                                    <Form.Select
                                        name="accountType"
                                        value={formData.accountType}
                                        onChange={handleChange}
                                        isInvalid={!!errors.accountType}
                                        style={S.input}
                                    >
                                        <option value="">— Select Account Type —</option>
                                        <option value="savings">Savings Account</option>
                                        <option value="current">Current Account</option>
                                        <option value="salary">Salary Account</option>
                                        <option value="other">Other</option>
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid" style={{ fontSize: '11px' }}>
                                        {errors.accountType}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                {/* spacer — keeps grid balanced */}
                            </Col>
                        </Row>
                    </div>

                    {/* ── SECTION 3 : Bank & Branch ── */}
                    <div style={S.sectionCard}>
                        <div style={S.sectionHeader}>
                            <span style={S.sectionIcon}>📍</span>
                            Bank &amp; Branch Information
                        </div>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <label style={S.label}>
                                        IFSC Code <span style={S.required}>*</span>
                                    </label>
                                    <div className="position-relative">
                                        <Form.Control
                                            type="text"
                                            name="ifscCode"
                                            value={formData.ifscCode}
                                            onChange={handleChange}
                                            placeholder="e.g., SBIN0001234"
                                            maxLength={11}
                                            isInvalid={!!errors.ifscCode || !!bankFetchError}
                                            autoComplete="off"
                                            style={{ ...S.input, textTransform: 'uppercase', paddingRight: '40px' }}
                                        />
                                        {fetchingBank && (
                                            <Spinner
                                                animation="border"
                                                size="sm"
                                                className="position-absolute"
                                                style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#1a56db' }}
                                            />
                                        )}
                                        <Form.Control.Feedback type="invalid" style={{ fontSize: '11px' }}>
                                            {errors.ifscCode || bankFetchError}
                                        </Form.Control.Feedback>
                                    </div>
                                    <div style={S.helpText}>
                                        🔍 Bank &amp; branch auto-filled on valid IFSC
                                    </div>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <label style={S.label}>
                                        Bank Name <span style={S.required}>*</span>
                                    </label>
                                    <Form.Control
                                        type="text"
                                        name="bankName"
                                        value={formData.bankName}
                                        onChange={handleChange}
                                        placeholder="Auto-filled from IFSC"
                                        isInvalid={!!errors.bankName}
                                        readOnly={!!formData.bankName && !bankFetchError}
                                        style={formData.bankName ? S.inputReadonly : S.input}
                                    />
                                    <Form.Control.Feedback type="invalid" style={{ fontSize: '11px' }}>
                                        {errors.bankName}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group>
                                    <label style={S.label}>Branch Name</label>
                                    <Form.Control
                                        type="text"
                                        name="branchName"
                                        value={formData.branchName}
                                        onChange={handleChange}
                                        placeholder="Auto-filled from IFSC"
                                        readOnly={!!formData.branchName && !bankFetchError}
                                        style={formData.branchName ? S.inputReadonly : S.input}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <label style={S.label}>Branch Address</label>
                                    <Form.Control
                                        type="text"
                                        name="branchAddress"
                                        value={formData.branchAddress}
                                        onChange={handleChange}
                                        placeholder="Auto-filled from IFSC"
                                        readOnly={!!formData.branchAddress && !bankFetchError}
                                        style={formData.branchAddress ? S.inputReadonly : S.input}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row className="mt-3">
                            <Col md={6}>
                                {/* spacer */}
                            </Col>
                            <Col md={6}>
                                {formData.bankName && formData.branchName && (
                                    <div style={{ ...S.verifiedCard, marginTop: '22px' }}>
                                        <div style={S.verifiedIcon}><FaCheckCircle /></div>
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#065f46', fontSize: '13px' }}>
                                                Bank Verified ✓
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#047857', marginTop: '2px' }}>
                                                {formData.bankName}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#6ee7b7', color: '#059669' }}>
                                                {formData.branchName}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Col>
                        </Row>
                    </div>

                </Form>
            </div>

            {/* ── FOOTER ── */}
            <div style={S.footer}>
                <button style={S.btnCancel} onClick={onHide} type="button">
                    Cancel
                </button>
                <button
                    style={{ ...S.btnSave, opacity: loading ? 0.75 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                    onClick={handleSubmit}
                    disabled={loading}
                    type="button"
                >
                    {loading ? (
                        <><Spinner animation="border" size="sm" className="me-2" />Saving...</>
                    ) : (
                        <><FaCheckCircle style={{ marginRight: '6px' }} />Save Bank Details</>
                    )}
                </button>
            </div>
        </Modal>
    );
};

export default ExaminerBankModal;
