import React, { useState, useRef } from 'react'
import "../../style/Valuation/ValuationTemplate.css"
import { Container } from 'react-bootstrap';
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
const ValuationTemplate = ({ children, leftComponent = null, rightComponent = null, MainComponent }) => {
    const [leftWidth, setLeftWidth] = useState(25);
    const [rightWidth, setRightWidth] = useState(25);
    const containerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(null);
    const startXRef = useRef(0);
    const startLeftWidthRef = useRef(0);
    const startRightWidthRef = useRef(0);

    const handleMouseDown = (position) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(position);
        startXRef.current = e.clientX;
        startLeftWidthRef.current = leftWidth;
        startRightWidthRef.current = rightWidth;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    const handleMouseUp = React.useCallback(() => {
        setIsDragging(null);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = '';
    }, []);

    const handleMouseMove = React.useCallback((e) => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const containerWidth = container.getBoundingClientRect().width;
        const deltaX = e.clientX - startXRef.current;
        const deltaPercentage = (deltaX / containerWidth) * 100;
        const minMainWidth = 20;

        if (isDragging === 'left-middle') {
            // Only change left width, keep right width fixed
            const maxLeftWidth = 100 - startRightWidthRef.current - minMainWidth;
            const newLeftWidth = Math.max(5, Math.min(maxLeftWidth, startLeftWidthRef.current + deltaPercentage));
            setLeftWidth(newLeftWidth);
        } else if (isDragging === 'main-right') {
            // Only change right width, keep left width fixed
            const maxRightWidth = 100 - startLeftWidthRef.current - minMainWidth;
            const newRightWidth = Math.max(5, Math.min(maxRightWidth, startRightWidthRef.current - deltaPercentage));
            setRightWidth(newRightWidth);
        }
    }, [isDragging]);

    React.useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [handleMouseMove, handleMouseUp, isDragging]);

    const mainWidth = 100 - leftWidth - rightWidth;

    return (
        <Container
            fluid
            ref={containerRef}
            className="valuation-template-container"
            style={{
                marginTop: '0px',
                maxWidth: '100%',
                padding: '0px',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                userSelect: isDragging ? 'none' : 'auto',
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            {isDragging && (
                <div
                    className="valuation-drag-overlay"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                />
            )}
            <div style={{ display: 'flex', gap: '0', flex: 1, overflow: 'hidden', flexWrap: 'nowrap', alignItems: 'stretch' }}>

                {leftComponent != null ? (
                    <>
                        {/* Left Column - Always visible with minimum width */}
                        {leftWidth >= 5 && (
                            <div style={{ width: `${leftWidth}%`, display: 'flex', minWidth: 0, position: 'relative', height: '100%' }}>
                                <div className="valuation-left-component" style={{
                                    border: '2px solid #003cb3e8',
                                    boxShadow: '0 0.125rem 0.25rem rgba(0,0,0,0.075)',
                                    backgroundColor: '#003cb3e8',
                                    padding: '0',
                                    overflowY: 'auto',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderRadius: '0px',
                                    width: '100%',
                                    height: '100%'
                                }}>
                                    {leftComponent}
                                </div>
                            </div>
                        )}

                        {/* Resize Handle Between Left and Main - Always Visible */}


                        <div
                            onMouseDown={handleMouseDown('left-middle')}
                            style={{
                                width: leftWidth < 5 ? '10px' : '10px',
                                height: '100%',
                                cursor: 'col-resize',
                                backgroundColor: isDragging === 'left-middle' ? '#0066ff' : (leftWidth < 5 ? '#a0a0a0' : '#a0a0a0'),
                                transition: 'background-color 0.15s ease, width 0.15s ease',
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                userSelect: 'none'
                            }}
                            title={leftWidth < 5 ? "Click and drag to show left panel" : "Drag to resize"}
                            onMouseEnter={(e) => {
                                if (isDragging !== 'left-middle') {
                                    e.currentTarget.style.backgroundColor = '#0066ff';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (isDragging !== 'left-middle') {
                                    e.currentTarget.style.backgroundColor = (leftWidth < 5 || mainWidth < 50) ? '#a0a0a0' : '#a0a0a0';
                                }
                            }}
                        >

                                {isDragging !== 'left-middle' ? (
                                    <></>
                                ):(
                                 <div className='val_Left_scrollbar'>
                                <FaAngleLeft style={{ color: 'red', opacity: 0.6, fontSize: '23px' }} /> <FaAngleRight style={{ color: 'red', opacity: 0.6, fontSize: '23px' }} />
                                </div>
                                    )}
                        </div>



                        {/* Main Column - Always visible and takes remaining space */}
                        <div style={{ width: `${mainWidth}%`, display: 'flex', minWidth: 0, position: 'relative', height: '100%' }}>
                            <div className="valuation-main-component" style={{
                                border: '1px solid #dee2e6',
                                boxShadow: '0 0.125rem 0.25rem rgba(0,0,0,0.075)',
                                // padding: '1.25rem',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: '8px',
                                width: '100%',
                                height: '100%'
                            }}>
                                <div style={{ width: '100%', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                                    {children}
                                </div>
                            </div>
                        </div>

                        {/* Resize Handle Between Main and Right - Always Visible */}
                        <div
                            onMouseDown={handleMouseDown('main-right')}
                            style={{
                                width: (rightWidth < 5 || mainWidth < 50) ? '8px' : '10px',
                                height: '100%',
                                cursor: 'col-resize',
                                backgroundColor: isDragging === 'main-right' ? '#003cb3cc' : ((rightWidth < 5 || mainWidth < 50) ? '#a0a0a0' : '#a0a0a0'),
                                transition: 'background-color 0.15s ease, width 0.15s ease',
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                userSelect: 'none'
                            }}
                            title={(rightWidth < 5 || mainWidth < 50) ? "Click and drag to show panels" : "Drag to resize"}
                            onMouseEnter={(e) => {
                                if (isDragging !== 'main-right') {
                                    e.currentTarget.style.backgroundColor = '#003cb3cc';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (isDragging !== 'main-right') {
                                    e.currentTarget.style.backgroundColor = (rightWidth < 2 || mainWidth < 2) ? '#a0a0a0' : '#a0a0a0';
                                }
                            }}
                        >

                                {isDragging !== 'main-right' ? (
                                    <></>
                                ):(
                                 <div className='val_Left_scrollbar'>
                                <FaAngleLeft style={{ color: 'red', opacity: 0.6, fontSize: '23px' }} /> <FaAngleRight style={{ color: 'red', opacity: 0.6, fontSize: '23px' }} />
                                </div>
                                    )}
                              </div>
                        {/* Right Column - Always visible with minimum width */}
                        {rightWidth >= 5 && (
                            <div style={{ width: `${rightWidth}%`, display: 'flex', minWidth: 0, position: 'relative', height: '100%' }}>
                                <div className="valuation-right-component" style={{
                                    border: '2px solid #003cb3e8',
                                    boxShadow: '0 0.125rem 0.25rem rgba(0,0,0,0.075)',
                                    backgroundColor: '#003cb3cc',
                                    padding: '0',
                                    overflowY: 'auto',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderRadius: '0px',
                                    width: '100%',
                                    height: '100%'
                                }}>
                                    {rightComponent}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ width: '100%', display: 'flex', minWidth: 0 }}>
                        <div className="valuation-main-component" style={{
                            border: '1px solid #dee2e6',
                            boxShadow: '0 0.125rem 0.25rem rgba(0,0,0,0.075)',
                            padding: '1.5rem',
                            overflow: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: '8px',
                            width: '100%'
                        }}>
                            {children}
                        </div>
                    </div>
                )}
            </div>
        </Container>
    )
}

export default ValuationTemplate
