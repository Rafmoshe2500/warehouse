import React from 'react';
import PropTypes from 'prop-types';
import './StatCard.css';

const StatCard = React.memo(({ icon: Icon, title, value, color }) => {
    return (
        <div className="stat-card">
            <div className={`stat-icon-wrapper ${color}`}>
                <Icon className="stat-icon" />
            </div>
            <div className="stat-info">
                <h3>{title}</h3>
                <p className="stat-value">{value}</p>
            </div>
        </div>
    );
});

StatCard.propTypes = {
    icon: PropTypes.elementType.isRequired,
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    color: PropTypes.oneOf(['blue', 'red', 'green', 'purple', 'amber', 'gray']).isRequired
};

StatCard.displayName = 'StatCard';

export default StatCard;
