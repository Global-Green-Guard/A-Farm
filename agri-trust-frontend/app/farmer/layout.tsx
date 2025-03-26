// app/farmer/layout.tsx
import React from 'react';
import Sidebar from '@/components/farmer/Sidebar';
import Topbar from '@/components/farmer/Topbar';

export default function FarmerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64"> {/* Adjust ml-64 to match sidebar width */}
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children} {/* Page content will be injected here */}
        </main>
      </div>
    </div>
  );
}