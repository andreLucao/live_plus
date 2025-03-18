import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getSubscriptionModel } from '@/lib/models/Subscription';

export async function GET(request, { params }) {
  try {
    const id = await params;
    const tenant = id.tenant

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant is required' }, { status: 400 });
    }

    // Connect to the tenant's database
    const connection = await connectDB(tenant);
    const Subscription = getSubscriptionModel(connection);

    // Find the active subscription for this tenant
    const subscription = await Subscription.findOne({
      status: 'active',
      currentPeriodEnd: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!subscription) {
      // If no subscription found, return starter plan as default
      return NextResponse.json({ 
        planType: 'starter',
        userCount: 1,
        pricePerUser: 0,
        status: 'active'
      });
    }

    return NextResponse.json({
      planType: subscription.planType,
      userCount: subscription.userCount,
      pricePerUser: subscription.pricePerUser,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd
    });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription data' }, { status: 500 });
  }
} 