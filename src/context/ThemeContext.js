import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // 1. Initialize state from localStorage or default to 'system'
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');

    useEffect(() => {
        const root = window.document.documentElement;
        const body = window.document.body;

        const applyTheme = (themeValue) => {
            let actualTheme = themeValue;

            // 2. If 'system', check the prefers-color-scheme media query
            if (themeValue === 'system') {
                actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }

            root.setAttribute('data-bs-theme', actualTheme);
            body.setAttribute('data-theme', actualTheme);
        };

        applyTheme(theme);
        localStorage.setItem('theme', theme);

        // 3. Listen for system preference changes if 'system' is selected
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (theme === 'system') applyTheme('system');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);