// app/api/farmer/dashboard/route.ts
import { NextResponse } from 'next/server';
import { Stat, PendingAction, Activity } from '@/types';
// TODO: Replace with actual database queries and user authentication

// SIMULATED DATABASE / DATA SOURCE
const MOCK_STATS: Stat[] = [
    // Add an 'icon' string property
    { id: '1', title: 'Active Batches', value: 5, icon: 'package' },
    { id: '2', title: 'Batches Certified', value: 3, icon: 'check-square' },
    { id: '3', title: 'Needs Attention', value: 1, icon: 'alert-circle' },
    { id: '4', title: 'Monthly Sales', value: '$1,250', icon: 'trending-up' },
];

const MOCK_PENDING_ACTIONS: PendingAction[] = [
    { id: 'pa1', description: 'Upload verification photos for Batch #B006', batchId: 'B006', actionLink: '/farmer/batches/B006' },
    { id: 'pa2', description: 'Certification request pending for Batch #B004', batchId: 'B004' },
];

const MOCK_RECENT_ACTIVITY: Activity[] = [
    { id: 'act1', timestamp: new Date(Date.now() - 3600 * 1000).toISOString(), description: 'Batch #B007 Registered', batchId: 'B007' },
    { id: 'act2', timestamp: new Date(Date.now() - 86400 * 1000).toISOString(), description: 'Batch #B003 marked as Sold' },
    { id: 'act3', timestamp: new Date(Date.now() - 2 * 86400 * 1000).toISOString(), description: 'Certification approved for Batch #B004', batchId: 'B004' },
    { id: 'act4', timestamp: new Date(Date.now() - 3 * 86400 * 1000).toISOString(), description: 'Payment received for Batch #B002' },
];
// END SIMULATION

export async function GET(request: Request) {
    // TODO: Implement proper authentication check here
    // const userId = await getUserIdFromSession(request);
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // TODO: Fetch data from your database based on userId
    try {
        const data = {
            stats: MOCK_STATS, // Use the updated mock stats
            pendingActions: MOCK_PENDING_ACTIONS,
            recentActivity: MOCK_RECENT_ACTIVITY,
        };
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}