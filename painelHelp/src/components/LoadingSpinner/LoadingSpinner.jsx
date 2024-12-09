import React from 'react';

const LoadingSpinner = () => {
    return (
        <div className="flex items-center justify-center w-full h-full">
            <div className="w-6 h-6 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        </div>
    );
};

export default LoadingSpinner;
