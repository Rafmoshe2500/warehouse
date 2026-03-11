import React from 'react';
import PropTypes from 'prop-types';

const Tabs = ({ tabs, activeTab, onTabChange, className = '', style = {} }) => {
  return (
    <div className={`access-tabs ${className}`.trim()} style={style}>
      {tabs.filter(tab => !tab.hidden).map(tab => (
        <button
          key={tab.id}
          className={`tab-btn ${activeTab === tab.id ? 'active' : ''} ${tab.className || ''}`.trim()}
          onClick={() => onTabChange(tab.id)}
          disabled={tab.disabled}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.node.isRequired,
      icon: PropTypes.node,
      hidden: PropTypes.bool,
      disabled: PropTypes.bool,
      className: PropTypes.string,
    })
  ).isRequired,
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default Tabs;
