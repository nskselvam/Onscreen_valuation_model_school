import React from 'react';
import './ElegantLoader.css';

const ElegantLoader = ({ 
    message = 'Loading...', 
    size = 'medium',
    fullScreen = false,
    variant = 'primary' 
}) => {
    const containerStyle = fullScreen
        ? {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999
        }
        : {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '60px 20px',
            minHeight: '300px'
        };

    const sizeMap = {
        small: { spinner: '40px', dots: '6px' },
        medium: { spinner: '60px', dots: '8px' },
        large: { spinner: '80px', dots: '10px' }
    };

    const currentSize = sizeMap[size] || sizeMap.medium;

    const variantColors = {
        primary: { main: '#2c5282', light: '#4299e1', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
        success: { main: '#38a169', light: '#68d391', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
        info: { main: '#3182ce', light: '#63b3ed', gradient: 'linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%)' },
        warning: { main: '#d69e2e', light: '#f6ad55', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }
    };

    const colors = variantColors[variant] || variantColors.primary;

    return (
        <div style={containerStyle} className="elegant-loader-container">
            <div className="elegant-loader-wrapper">
                {/* Animated Circle Loader */}
                <div 
                    className="elegant-spinner"
                    style={{ 
                        width: currentSize.spinner, 
                        height: currentSize.spinner,
                        borderTopColor: colors.main,
                        borderRightColor: colors.light
                    }}
                >
                    <div className="elegant-spinner-inner" style={{ borderTopColor: colors.light }}></div>
                </div>

                {/* Pulsing Dots */}
                <div className="elegant-dots" style={{ marginTop: '20px' }}>
                    <span className="elegant-dot" style={{ 
                        width: currentSize.dots, 
                        height: currentSize.dots,
                        backgroundColor: colors.main
                    }}></span>
                    <span className="elegant-dot elegant-dot-delay-1" style={{ 
                        width: currentSize.dots, 
                        height: currentSize.dots,
                        backgroundColor: colors.main
                    }}></span>
                    <span className="elegant-dot elegant-dot-delay-2" style={{ 
                        width: currentSize.dots, 
                        height: currentSize.dots,
                        backgroundColor: colors.main
                    }}></span>
                </div>
            </div>

            {/* Loading Message */}
            {message && (
                <div className="elegant-message" style={{ 
                    background: colors.gradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    {message}
                </div>
            )}

            {/* Decorative Element */}
            <div className="elegant-wave">
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path 
                        d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
                        opacity=".25"
                        fill={colors.light}
                    />
                    <path 
                        d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" 
                        opacity=".5"
                        fill={colors.light}
                    />
                    <path 
                        d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" 
                        fill={colors.main}
                    />
                </svg>
            </div>
        </div>
    );
};

export default ElegantLoader;
