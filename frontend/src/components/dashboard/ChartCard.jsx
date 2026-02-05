import React from 'react';
import PropTypes from 'prop-types';
import './ChartCard.css';

const ChartCard = React.memo(({ title, icon: Icon, children, className, headerContent }) => {
    return (
        <div className={`chart-card ${className}`}>
            <div className="chart-header">
                <h2 className="chart-title">
                    {Icon && <Icon style={{verticalAlign: 'middle', marginLeft: '8px'}} />}
                    {title}
                </h2>
                {headerContent}
            </div>
            <div className="chart-content">
                {children}
            </div>
        </div>
    );
});

ChartCard.propTypes = {
    title: PropTypes.string.isRequired,
    icon: PropTypes.elementType,
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    headerContent: PropTypes.node
};

ChartCard.defaultProps = {
    className: ''
};

ChartCard.displayName = 'ChartCard';

export default ChartCard;
