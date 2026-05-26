import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  TrendingUp, TrendingDown, Store, DollarSign, 
  ShoppingCart, Users, Activity, CheckCircle, XCircle
} from 'lucide-react';

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [subscriptions, setSubscriptions] = useState(null);
  const [recentActivity, setRecentActivity] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all dashboard data in parallel
      const [statsRes, restaurantsRes, analyticsRes, subscriptionsRes, activityRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/restaurants?limit=5'),
        api.get('/admin/analytics'),
        api.get('/admin/subscriptions'),
        api.get('/admin/activity?limit=10')
      ]);

      setStats(statsRes.data.data);
      setRestaurants(restaurantsRes.data.data.restaurants);
      setAnalytics(analyticsRes.data.data);
      setSubscriptions(subscriptionsRes.data.data);
      setRecentActivity(activityRes.data.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionToggle = async (restaurantId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'EXPIRED' : 'ACTIVE';
      await api.patch(`/admin/restaurants/${restaurantId}/subscription`, {
        subscriptionStatus: newStatus
      });
      
      // Refresh data
      fetchDashboardData();
    } catch (err) {
      console.error('Error updating subscription:', err);
      alert(err.response?.data?.message || 'Failed to update subscription');
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <p style={styles.errorText}>{error}</p>
        <button style={styles.retryButton} onClick={fetchDashboardData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* 1. Platform Overview KPIs */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Platform Overview</h2>
        <div style={styles.kpiGrid}>
          <KPICard
            icon={<Store size={20} />}
            title="Total Restaurants"
            value={stats?.totalRestaurants || 0}
            color="#3b82f6"
          />
          <KPICard
            icon={<CheckCircle size={20} />}
            title="Active Subscriptions"
            value={stats?.activeSubscriptions || 0}
            color="#10b981"
          />
          <KPICard
            icon={<XCircle size={20} />}
            title="Expired Subscriptions"
            value={stats?.expiredSubscriptions || 0}
            color="#ef4444"
          />
          <KPICard
            icon={<DollarSign size={20} />}
            title="Total Revenue"
            value={`$${(stats?.totalRevenue || 0).toFixed(2)}`}
            color="#8b5cf6"
          />

        </div>
      </section>

      {/* 2. Restaurant Management */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Restaurant Management</h2>
          <span style={styles.viewAll}>View All →</span>
        </div>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Restaurant</th>
                <th style={styles.th}>Owner</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Tables</th>
                <th style={styles.th}>Orders</th>
                <th style={styles.th}>Revenue</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((restaurant) => (
                <tr key={restaurant.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.restaurantName}>{restaurant.name}</div>
                    <div style={styles.restaurantSlug}>/{restaurant.slug}</div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.ownerName}>{restaurant.owner.name}</div>
                    <div style={styles.ownerEmail}>{restaurant.owner.email}</div>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      ...(restaurant.subscriptionStatus === 'ACTIVE' 
                        ? styles.badgeActive 
                        : styles.badgeExpired)
                    }}>
                      {restaurant.subscriptionStatus}
                    </span>
                  </td>
                  <td style={styles.td}>{restaurant._count.tables}</td>
                  <td style={styles.td}>{restaurant._count.orders}</td>
                  <td style={styles.td}>${(restaurant.totalRevenue || 0).toFixed(2)}</td>
                  <td style={styles.td}>
                    <button
                      style={styles.actionButton}
                      onClick={() => handleSubscriptionToggle(restaurant.id, restaurant.subscriptionStatus)}
                    >
                      {restaurant.subscriptionStatus === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Platform Analytics */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Platform Analytics</h2>
        <div style={styles.analyticsGrid}>
          {/* Revenue Trend */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>7-Day Revenue Trend</h3>
            <div style={styles.chartContainer}>
              {analytics?.revenueTrend?.last7Days?.map((day, index) => (
                <div key={index} style={styles.barContainer}>
                  <div
                    style={{
                      ...styles.bar,
                      height: `${(day.revenue / Math.max(...analytics.revenueTrend.last7Days.map(d => d.revenue))) * 100}%`
                    }}
                  />
                  <div style={styles.barLabel}>{day.date}</div>
                  <div style={styles.barValue}>${day.revenue.toFixed(0)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Restaurants */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Top 5 Restaurants</h3>
            <div style={styles.topList}>
              {analytics?.topRestaurants?.map((restaurant, index) => (
                <div key={restaurant.id} style={styles.topItem}>
                  <div style={styles.topRank}>{index + 1}</div>
                  <div style={styles.topInfo}>
                    <div style={styles.topName}>{restaurant.name}</div>
                    <div style={styles.topStats}>
                      {restaurant.orders} orders • ${restaurant.revenue.toFixed(2)}
                    </div>
                  </div>
                  <div style={styles.topRevenue}>
                    ${restaurant.revenue.toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Subscription Overview */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Subscription Overview</h2>
        <div style={styles.subscriptionGrid}>
          <div style={styles.subscriptionCard}>
            <div style={styles.subscriptionHeader}>
              <CheckCircle size={24} color="#10b981" />
              <h3 style={styles.subscriptionTitle}>Active</h3>
            </div>
            <div style={styles.subscriptionValue}>{subscriptions?.summary?.active || 0}</div>
            <div style={styles.subscriptionPercentage}>
              {subscriptions?.summary?.total > 0 
                ? ((subscriptions.summary.active / subscriptions.summary.total) * 100).toFixed(1)
                : 0}% of total
            </div>
          </div>
          <div style={styles.subscriptionCard}>
            <div style={styles.subscriptionHeader}>
              <XCircle size={24} color="#ef4444" />
              <h3 style={styles.subscriptionTitle}>Expired</h3>
            </div>
            <div style={styles.subscriptionValue}>{subscriptions?.summary?.expired || 0}</div>
            <div style={styles.subscriptionPercentage}>
              {subscriptions?.summary?.total > 0 
                ? ((subscriptions.summary.expired / subscriptions.summary.total) * 100).toFixed(1)
                : 0}% of total
            </div>
          </div>
        </div>

        {subscriptions?.expiredRestaurants?.length > 0 && (
          <div style={styles.expiredList}>
            <h4 style={styles.expiredTitle}>Expired Subscriptions (Need Attention)</h4>
            {subscriptions.expiredRestaurants.slice(0, 5).map((restaurant) => (
              <div key={restaurant.id} style={styles.expiredItem}>
                <div>
                  <div style={styles.expiredName}>{restaurant.name}</div>
                  <div style={styles.expiredOwner}>{restaurant.owner.email}</div>
                </div>
                <button
                  style={styles.activateButton}
                  onClick={() => handleSubscriptionToggle(restaurant.id, 'EXPIRED')}
                >
                  Activate
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Recent Activity */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Activity</h2>
        <div style={styles.activityGrid}>
          {/* Recent Restaurants */}
          <div style={styles.activityCard}>
            <h3 style={styles.activityTitle}>Recently Added Restaurants</h3>
            <div style={styles.activityList}>
              {recentActivity?.recentRestaurants?.slice(0, 5).map((restaurant) => (
                <div key={restaurant.id} style={styles.activityItem}>
                  <Store size={16} color="#3b82f6" />
                  <div style={styles.activityInfo}>
                    <div style={styles.activityName}>{restaurant.name}</div>
                    <div style={styles.activityTime}>
                      {new Date(restaurant.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Large Orders */}
          <div style={styles.activityCard}>
            <h3 style={styles.activityTitle}>Recent Large Orders</h3>
            <div style={styles.activityList}>
              {recentActivity?.recentLargeOrders?.slice(0, 5).map((order) => (
                <div key={order.id} style={styles.activityItem}>
                  <ShoppingCart size={16} color="#10b981" />
                  <div style={styles.activityInfo}>
                    <div style={styles.activityName}>
                      {order.restaurant.name} - ${parseFloat(order.totalAmount).toFixed(2)}
                    </div>
                    <div style={styles.activityTime}>
                      {order.table.tableNumber} • {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// KPI Card Component
const KPICard = ({ icon, title, value, color }) => (
  <div style={styles.kpiCard}>
    <div style={{ ...styles.kpiIcon, backgroundColor: `${color}15` }}>
      <div style={{ color }}>{icon}</div>
    </div>
    <div style={styles.kpiContent}>
      <div style={styles.kpiTitle}>{title}</div>
      <div style={styles.kpiValue}>{value}</div>
    </div>
  </div>
);

// Styles
const styles = {
  container: {
    width: '100%',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid var(--border)',
    borderTop: '4px solid var(--primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '16px',
  },
  errorText: {
    color: 'var(--danger)',
    fontSize: '0.95rem',
  },
  retryButton: {
    padding: '10px 20px',
    background: 'var(--primary)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  section: {
    marginBottom: '32px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--text)',
    marginBottom: '16px',
  },
  viewAll: {
    color: 'var(--primary)',
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
  },
  kpiCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    transition: 'var(--transition)',
    cursor: 'pointer',
  },
  kpiIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  kpiContent: {
    flex: 1,
  },
  kpiTitle: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginBottom: '4px',
  },
  kpiValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--text)',
  },
  tableContainer: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '16px',
    textAlign: 'left',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg)',
  },
  tr: {
    borderBottom: '1px solid var(--border)',
  },
  td: {
    padding: '16px',
    fontSize: '0.9rem',
    color: 'var(--text)',
  },
  restaurantName: {
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '2px',
  },
  restaurantSlug: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  ownerName: {
    fontWeight: 500,
    color: 'var(--text)',
    marginBottom: '2px',
  },
  ownerEmail: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  badgeActive: {
    background: '#10b98115',
    color: '#10b981',
  },
  badgeExpired: {
    background: '#ef444415',
    color: '#ef4444',
  },
  actionButton: {
    padding: '6px 12px',
    background: 'var(--primary)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 500,
  },
  analyticsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '16px',
  },
  chartCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '20px',
  },
  chartTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '16px',
  },
  chartContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '200px',
    gap: '8px',
  },
  barContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    width: '100%',
    background: 'linear-gradient(180deg, var(--primary) 0%, var(--primary-light) 100%)',
    borderRadius: '4px 4px 0 0',
    minHeight: '4px',
    transition: 'height 0.3s ease',
  },
  barLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    marginTop: '8px',
  },
  barValue: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text)',
    marginTop: '4px',
  },
  topList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  topItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: 'var(--bg)',
    borderRadius: '8px',
  },
  topRank: {
    width: '32px',
    height: '32px',
    background: 'var(--primary-light)',
    color: 'var(--primary)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.9rem',
  },
  topInfo: {
    flex: 1,
  },
  topName: {
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '2px',
  },
  topStats: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  topRevenue: {
    fontWeight: 700,
    color: 'var(--primary)',
    fontSize: '0.95rem',
  },
  subscriptionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  subscriptionCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '24px',
  },
  subscriptionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  subscriptionTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text)',
  },
  subscriptionValue: {
    fontSize: '2rem',
    fontWeight: 700,
    color: 'var(--text)',
    marginBottom: '8px',
  },
  subscriptionPercentage: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  expiredList: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '20px',
  },
  expiredTitle: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '16px',
  },
  expiredItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    background: 'var(--bg)',
    borderRadius: '8px',
    marginBottom: '8px',
  },
  expiredName: {
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '2px',
  },
  expiredOwner: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  activateButton: {
    padding: '6px 16px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  activityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '16px',
  },
  activityCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '20px',
  },
  activityTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '16px',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: 'var(--bg)',
    borderRadius: '8px',
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontWeight: 500,
    color: 'var(--text)',
    marginBottom: '2px',
    fontSize: '0.9rem',
  },
  activityTime: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
};

// Add keyframe animation for spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default Home;
