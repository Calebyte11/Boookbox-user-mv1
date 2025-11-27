import React from 'react';

const OfflinePage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-4 text-primary text-center">You're Offline</h1>
        <div className="mb-6 text-center">
          <svg 
            className="w-24 h-24 mx-auto mb-4 text-gray-400" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path d="M18.364 5.636a9 9 0 1 1-12.728 0M12 2v4m0 16v-4"></path>
          </svg>
          <p className="mb-4">
            It looks like you're currently offline. Some features of BoookBox may not be available.
          </p>
          <p className="text-gray-600 text-sm mb-6">
            Please check your internet connection and try again.
          </p>
        </div>
        
        <div className="flex justify-center">
          <button 
            onClick={() => window.location.reload()} 
            className="bg-primary text-white font-semibold py-2 px-6 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfflinePage;
