import React from 'react';
import { FiCheck } from 'react-icons/fi';
import { useTheme } from '../../../context/ThemeContext';
import './ThemeSelector.css';

const ThemeSelector = () => {
    const { variant, setVariant, mode } = useTheme();

    const themes = [
        { id: 'normal', name: 'רגיל', color: mode === 'dark' ? '#0f172a' : '#f8fafc' },
        { id: 'wood', name: 'עץ', color: '#2c1810' },
        { id: 'space', name: 'חלל', color: '#0b0d17' },
        { id: 'classic', name: 'קלאסי', color: '#334155' }
    ];

    return (
        <div className="theme-selector">
            <h3 className="theme-selector__title">בחר ערכת נושא</h3>
            <div className="theme-selector__options">
                {themes.map((theme) => (
                    <button
                        key={theme.id}
                        className={`theme-option ${variant === theme.id ? 'active' : ''}`}
                        onClick={() => setVariant(theme.id)}
                        title={theme.name}
                    >
                        <div 
                            className="theme-option__preview"
                            style={{ backgroundColor: theme.color }}
                        >
                            {variant === theme.id && <FiCheck size={24} />}
                        </div>
                        <span className="theme-option__name">{theme.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ThemeSelector;
