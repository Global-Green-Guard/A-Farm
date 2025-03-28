// app/farmer/page.tsx
import React from 'react';
import StatCard from '@/components/farmer/StatCard';
import PendingActionItem from '@/components/farmer/PendingActionItem';
import ActivityItem from '@/components/farmer/ActivityItem';
import { Stat, PendingAction, Activity } from '@/types';
import { FiPackage, FiCheckSquare, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';

// --- SIMULATED DATA FETCHING ---
// In a real app, this data would come from API calls to your backend
const getDashboardData = async (): Promise<{
  stats: Stat[];
  pendingActions: PendingAction[];
  recentActivity: Activity[];
}> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 50));

  return {
    stats: [
      { id: '1', title: 'Active Batches', value: 5, icon: <FiPackage size={24}/> },
      { id: '2', title: 'Batches Certified', value: 3, icon: <FiCheckSquare size={24}/> },
      { id: '3', title: 'Needs Attention', value: 1, icon: <FiAlertCircle size={24}/> },
      { id: '4', title: 'Monthly Sales', value: '$1,250', icon: <FiTrendingUp size={24}/> },
    ],
    pendingActions: [
      { id: 'pa1', description: 'Upload verification photos for Batch #B006', batchId: 'B006', actionLink: '/farmer/batches/B006' },
      { id: 'pa2', description: 'Certification request pending for Batch #B004', batchId: 'B004' },
    ],
    recentActivity: [
      { id: 'act1', timestamp: new Date(Date.now() - 3600 * 1000).toISOString(), description: 'Batch #B007 Registered', batchId: 'B007' },
      { id: 'act2', timestamp: new Date(Date.now() - 86400 * 1000).toISOString(), description: 'Batch #B003 marked as Sold' },
      { id: 'act3', timestamp: new Date(Date.now() - 2 * 86400 * 1000).toISOString(), description: 'Certification approved for Batch #B004', batchId: 'B004' },
      { id: 'act4', timestamp: new Date(Date.now() - 3 * 86400 * 1000).toISOString(), description: 'Payment received for Batch #B002' },
    ],
  };
};
// --- END SIMULATED DATA ---

// --- FETCH DATA FROM API ---
// Note: fetch is automatically extended by Next.js for caching/revalidation
async function getDashboardDataFromApi(): Promise<{
    stats: Stat[];
    pendingActions: PendingAction[];
    recentActivity: Activity[];
  }> {
    // Use absolute URL for server-side fetching, or configure base URL
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/farmer/dashboard`, {
      cache: 'no-store', // Disable caching for dynamic data, or use revalidate options
    });
  
    if (!res.ok) {
      // Handle error appropriately
      console.error("Failed to fetch dashboard data:", res.status, await res.text());
      // Return default/empty state or throw error to trigger error boundary
      return { stats: [], pendingActions: [], recentActivity: [] };
    }
  
    // Assign icons locally as they are React components and not serializable in JSON
    const data = await res.json();
    // data.stats[0].icon = <FiPackage size={24}/>;
    // data.stats[1].icon = <FiCheckSquare size={24}/>;
    // data.stats[2].icon = <FiAlertCircle size={24}/>;
    // data.stats[3].icon = <FiTrendingUp size={24}/>;
  
    return data;
  }
  // --- END FETCH DATA ---
  
  
export default async function FarmerDashboardPage() {
    // Fetch data from the API endpoint
    const { stats, pendingActions, recentActivity } = await getDashboardDataFromApi();
  
  return (
    <div className="space-y-6">
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </div>

      {/* Pending Actions & Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending Actions */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Pending Actions</h2>
          {pendingActions.length > 0 ? (
            <div className="space-y-1">
              {pendingActions.map((action) => (
                <PendingActionItem key={action.id} action={action} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No pending actions.</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Recent Activity</h2>
           {recentActivity.length > 0 ? (
             <div className="space-y-1">
               {recentActivity.map((activity) => (
                 <ActivityItem key={activity.id} activity={activity} />
               ))}
             </div>
            ) : (
              <p className="text-sm text-gray-500">No recent activity.</p>
            )}
        </div>
      </div>
    </div>
  );
}


// Add basic revalidation if data changes frequently (optional)
// export const revalidate = 60; // Revalidate data every 60 seconds
