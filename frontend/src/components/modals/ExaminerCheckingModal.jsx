import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useUpdateFacultyRawFieldsMutation } from '../../redux-slice/adminOperationApiSlice';

const roleMaster = [
  { id: '0', name: 'Admin' },
  { id: '1', name: 'Chief Examiner' },
  { id: '2', name: 'Examiner' },
  { id: '3', name: 'Review' },
  { id: '4', name: 'Camp Officer' },
  { id: '5', name: 'Camp Officer Assistant' },
  { id: '6', name: 'Section Staff' },
  { id: '7', name: 'Chief Evaluation Examiner' },
];

const getRoleNames = (roleIds) => {
  if (!roleIds) return '-';
  return roleIds.split(',').map(id => {
    const role = roleMaster.find(r => r.id === id.trim());
    return role ? role.name : id.trim();
  }).join(', ');
};

// Fields that belong to each role (all comma-separated fields)
const ROLE_FIELDS = {
  '1': [
    { key: 'Chief_subcode',            label: 'Chief Subject Code' },
    { key: 'Chief_Eva_Subject',         label: 'Chief Evaluation Type' },
    { key: 'chief_examiner',            label: 'Chief Examiner ID' },
    { key: 'camp_offcer_id_chief',      label: 'Chief Camp Officer ID' },
    { key: 'Camp_id_chief',             label: 'Chief Camp ID' },
    { key: 'Chief_Valuation_Status',    label: 'Chief Valuation Status' },
    { key: 'Dep_Name_1',                label: 'Chief Department' },
  ],
  '2': [
    { key: 'subcode',                   label: 'Subject Code' },
    { key: 'Eva_Subject',               label: 'Evaluation Type' },
    { key: 'Sub_Max_Paper',             label: 'Max Papers' },
    { key: 'camp_offcer_id_examiner',   label: 'Camp Officer ID' },
    { key: 'Camp_id',                   label: 'Camp ID' },
    { key: 'Examiner_Valuation_Status', label: 'Valuation Status' },
    { key: 'Dep_Name_2',                label: 'Department' },
  ],
  '7': [
    { key: 'Chief_subcode',            label: 'Chief Subject Code' },
    { key: 'Chief_Eva_Subject',         label: 'Chief Evaluation Type' },
    { key: 'chief_examiner',            label: 'Chief Examiner ID' },
    { key: 'camp_offcer_id_chief',      label: 'Chief Camp Officer ID' },
    { key: 'Camp_id_chief',             label: 'Chief Camp ID' },
    { key: 'Chief_Valuation_Status',    label: 'Chief Valuation Status' },
  ],
};

// Parse role number from mismatch block like "Role2 Mismatch: ..."
const parseRoleFromBlock = (block) => {
  const m = block.match(/Role(\d+)/i);
  return m ? m[1] : null;
};

// Parse mismatched field names from block like "Role2 Mismatch: subcode(5), Eva_Subject(4)"
const parseMismatchedFields = (block) => {
  const after = block.split(':').slice(1).join(':').trim();
  return after.split(',').map(f => f.trim().replace(/\(\d+\)/, '').trim()).filter(Boolean);
};

const ExaminerCheckingModal = ({ show, onHide, row, onSave }) => {
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [updateFacultyRawFields, { isLoading: saving }] = useUpdateFacultyRawFieldsMutation();

  useEffect(() => {
    if (!show) {
      setEditMode(false);
      setSaveSuccess(false);
    }
  }, [show]);

  useEffect(() => {
    if (row && editMode) {
      // Pre-fill edit values from row data for all fields across all mismatch roles
      const initial = {};
      remarkBlocks.forEach(block => {
        const roleNum = parseRoleFromBlock(block);
        const fields = ROLE_FIELDS[roleNum] || [];
        fields.forEach(f => {
          initial[f.key] = row[f.key] || '';
        });
      });
      setEditValues(initial);
    }
  }, [editMode, row]);

  if (!row) return null;

  const remarks = row.Remarks_Gen || 'OK';
  const isOk = remarks === 'OK';
  const remarkBlocks = remarks.split(' | ').map(r => r.trim());

  const handleFieldChange = (key, value) => {
    setEditValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaveSuccess(false);
    try {
      await updateFacultyRawFields({ id: row.id, ...editValues }).unwrap();
      setSaveSuccess(true);
      setEditMode(false);
      if (onSave) onSave();
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton style={{ backgroundColor: '#2c5282', color: '#fff' }}>
        <Modal.Title style={{ fontSize: '15px', fontWeight: '700' }}>
          Faculty Cross-Check — {row.Eva_Id} &nbsp;|&nbsp; {row.FACULTY_NAME}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ padding: '20px' }}>
        {saveSuccess && (
          <Alert variant="success" className="py-2 mb-3" style={{ fontSize: '13px' }}>
            ✅ Fields updated successfully. Run crosscheck again to verify.
          </Alert>
        )}

        {/* Faculty Info */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '13px' }}>
          <tbody>
            {[
              { label: 'Evaluator ID', value: row.Eva_Id },
              { label: 'Faculty Name', value: row.FACULTY_NAME },
              { label: 'Role(s)',       value: getRoleNames(row.Role) },
              { label: 'Email',         value: row.Email_Id || '-' },
              { label: 'Mobile',        value: row.Mobile_Number || '-' },
            ].map(({ label, value }) => (
              <tr key={label}>
                <td style={{ backgroundColor: '#f5f5f5', padding: '7px 12px', fontWeight: '600',
                  color: '#555', width: '155px', border: '1px solid #e0e0e0', fontSize: '12px' }}>{label}</td>
                <td style={{ padding: '7px 12px', border: '1px solid #e0e0e0', color: '#333', fontSize: '12px' }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Status */}
        <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontWeight: '600', fontSize: '13px', color: '#555' }}>Status:</span>
          <span style={{
            backgroundColor: isOk ? '#c6f6d5' : '#fed7d7',
            color: isOk ? '#22543d' : '#742a2a',
            borderRadius: '4px', padding: '4px 14px',
            fontWeight: '700', fontSize: '13px',
          }}>
            {isOk ? '✅ OK — All arrays match' : '⚠️ Mismatch Detected'}
          </span>
          {!isOk && !editMode && (
            <Button
              variant="warning"
              size="sm"
              style={{ fontSize: '12px', fontWeight: '600', marginLeft: '8px' }}
              onClick={() => setEditMode(true)}
            >
              ✏️ Edit Fields
            </Button>
          )}
          {editMode && (
            <Button
              variant="outline-secondary"
              size="sm"
              style={{ fontSize: '12px', marginLeft: '8px' }}
              onClick={() => setEditMode(false)}
            >
              ✕ Cancel Edit
            </Button>
          )}
        </div>

        {/* Remarks Detail */}
        {!editMode && (
          <div style={{ fontSize: '13px' }}>
            <div style={{ fontWeight: '600', color: '#555', marginBottom: '8px' }}>Remarks:</div>
            {isOk ? (
              <div style={{ backgroundColor: '#f0fff4', border: '1px solid #9ae6b4',
                borderRadius: '6px', padding: '12px 16px', color: '#22543d', fontWeight: '600' }}>
                All comma-separated field arrays have equal counts. No issues found.
              </div>
            ) : (
              remarkBlocks.map((block, i) => {
                const mismatchedFields = parseMismatchedFields(block);
                return (
                  <div key={i} style={{
                    backgroundColor: '#fff5f5', border: '1px solid #feb2b2',
                    borderRadius: '6px', padding: '12px 16px', marginBottom: '8px',
                  }}>
                    <strong style={{ fontSize: '13px', color: '#c53030' }}>{block.split(':')[0]}:</strong>
                    <div style={{ marginTop: '6px' }}>
                      {mismatchedFields.map((field, fi) => (
                        <span key={fi} style={{
                          display: 'inline-block', backgroundColor: '#fefcbf',
                          border: '1px solid #f6e05e', borderRadius: '4px',
                          padding: '2px 8px', margin: '2px 4px 2px 0',
                          fontWeight: '600', color: '#744210', fontSize: '12px',
                        }}>{field}</span>
                      ))}
                    </div>
                    {/* Show counts of current values */}
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#718096' }}>
                      {(() => {
                        const roleNum = parseRoleFromBlock(block);
                        const fields = ROLE_FIELDS[roleNum] || [];
                        return fields.map(f => {
                          const val = row[f.key] || '';
                          const count = val ? val.split(',').length : 0;
                          const isMismatched = mismatchedFields.includes(f.key);
                          return (
                            <span key={f.key} style={{
                              display: 'inline-block', padding: '2px 6px', margin: '2px 3px',
                              borderRadius: '3px', border: `1px solid ${isMismatched ? '#fc8181' : '#cbd5e0'}`,
                              backgroundColor: isMismatched ? '#fff5f5' : '#f7fafc',
                              color: isMismatched ? '#c53030' : '#4a5568',
                              fontWeight: isMismatched ? '700' : '400',
                            }}>
                              {f.label}: <strong>{count}</strong>
                            </span>
                          );
                        });
                      })()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Edit Mode */}
        {editMode && (
          <div>
            <div style={{ fontWeight: '600', color: '#2c5282', marginBottom: '10px', fontSize: '13px' }}>
              ✏️ Edit Comma-Separated Fields — fix counts to make all arrays equal
            </div>
            {remarkBlocks.map((block, bi) => {
              const roleNum = parseRoleFromBlock(block);
              const fields = ROLE_FIELDS[roleNum] || [];
              const mismatchedFields = parseMismatchedFields(block);
              return (
                <div key={bi} style={{
                  border: '1px solid #bee3f8', borderRadius: '6px',
                  padding: '14px', marginBottom: '14px', backgroundColor: '#ebf8ff',
                }}>
                  <div style={{ fontWeight: '700', color: '#2b6cb0', marginBottom: '12px', fontSize: '13px' }}>
                    {block.split(':')[0]} — Fields
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {fields.map(f => {
                      const isMismatched = mismatchedFields.includes(f.key);
                      const currentVal = editValues[f.key] || '';
                      const count = currentVal ? currentVal.split(',').length : 0;
                      return (
                        <div key={f.key}>
                          <Form.Label style={{
                            fontSize: '11px', fontWeight: '700', marginBottom: '3px',
                            color: isMismatched ? '#c53030' : '#4a5568',
                            display: 'flex', justifyContent: 'space-between',
                          }}>
                            <span>
                              {isMismatched && <span style={{ color: '#fc8181' }}>⚠ </span>}
                              {f.label}
                            </span>
                            <span style={{
                              backgroundColor: isMismatched ? '#feb2b2' : '#e2e8f0',
                              color: isMismatched ? '#742a2a' : '#718096',
                              borderRadius: '10px', padding: '1px 7px', fontSize: '10px',
                            }}>
                              {count} entries
                            </span>
                          </Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            value={currentVal}
                            onChange={(e) => handleFieldChange(f.key, e.target.value)}
                            style={{
                              fontSize: '12px', resize: 'vertical',
                              border: isMismatched ? '1.5px solid #fc8181' : '1px solid #cbd5e0',
                              backgroundColor: isMismatched ? '#fff5f5' : '#fff',
                            }}
                            placeholder={`Comma-separated values for ${f.label}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div style={{ fontSize: '11px', color: '#718096', marginTop: '4px' }}>
              💡 Each field must have the same number of comma-separated entries. After saving, run crosscheck again to verify.
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer style={{ gap: '8px' }}>
        {editMode ? (
          <>
            <Button
              variant="success"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              style={{ fontWeight: '600', fontSize: '13px', minWidth: '90px' }}
            >
              {saving ? <><Spinner animation="border" size="sm" className="me-1" />Saving...</> : '💾 Save'}
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={() => setEditMode(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button variant="secondary" size="sm" onClick={onHide}>Close</Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ExaminerCheckingModal;

