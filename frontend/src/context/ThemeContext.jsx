import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    // Theme: 'light' | 'dark'
    const [mode, setMode] = useState(() => {
        return localStorage.getItem('theme_mode') || 'dark';
    });

    // Variant: 'normal' | 'wood' | 'space'
    const [variant, setVariant] = useState(() => {
        return localStorage.getItem('theme_variant') || 'normal';
    });

    useEffect(() => {
        // Update DOM
        document.documentElement.setAttribute('data-theme', mode);
        document.documentElement.setAttribute('data-variant', variant);
        
        // Persist
        localStorage.setItem('theme_mode', mode);
        localStorage.setItem('theme_variant', variant);
    }, [mode, variant]);

    const toggleMode = () => {
        setMode(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const value = {
        mode,
        setMode,
        toggleMode,
        variant,
        setVariant
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
