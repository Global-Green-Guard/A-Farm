// components/farmer/Topbar.tsx
import React from 'react';
import { FiSearch, FiBell, FiUser } from 'react-icons/fi';

const Topbar = () => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Placeholder for Search or Page Title */}
      <div>
        <h1 className="text-lg font-semibold text-gray-800">Farmer Dashboard</h1>
      </div>

      {/* Right side icons/controls */}
      <div className="flex items-center space-x-4">
        {/* Search Icon (optional) */}
        <button className="text-gray-500 hover:text-gray-700">
          <FiSearch className="h-5 w-5" />
        </button>

        {/* Notification Icon */}
        <button className="relative text-gray-500 hover:text-gray-700">
          <FiBell className="h-5 w-5" />
          {/* Optional: Notification badge */}
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>

        {/* Profile Dropdown Placeholder */}
        <button className="flex items-center space-x-2 text-gray-500 hover:text-gray-700">
          <FiUser className="h-5 w-5" />
          <span className="text-sm font-medium hidden md:block">Farmer Name</span> {/* Replace with actual name */}
        </button>
      </div>
    </header>
  );
};

export default Topbar;