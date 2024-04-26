import React from 'react';
import './IconBox.css';

const IconBox = ({ svgPath, alt }) => {
    return (
        <div className="crypto-logo">
            <img src={svgPath} alt={alt} />
        </div>
    );
};

export default IconBox;
