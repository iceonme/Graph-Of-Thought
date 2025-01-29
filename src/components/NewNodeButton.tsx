import React from 'react';

interface NewNodeButtonProps {
  onClick: () => void;
}

function NewNodeButton({ onClick }: NewNodeButtonProps) {
  return (
    <button
      onClick={onClick}
      className="absolute top-4 right-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg flex items-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
      </svg>
      空白卡片
    </button>
  );
}

export default NewNodeButton;