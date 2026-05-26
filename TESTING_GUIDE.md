# Super Admin Dashboard - Testing Guide

## Prerequisites

1. **Backend Running**: Make sure your backend server is running on `http://localhost:8081`
2. **Database**: Ensure PostgreSQL is running with the correct schema
3. **Super Admin User**: You need a user with `role: 'SUPER_ADMIN'` in the database

## Creating a Super Admin User (If Not Exists)

If you don't have a super admin user, you can create one using Prisma Studio or SQL:

### Option 1: Using Prisma Studio
```bash
cd backend
npx prisma studio
```
Then manually create a user with `role: 'SUPER_ADMIN'`

### Option 2: Using SQL
```sql
-- First, hash a password (use bcrypt with salt rounds 10)
-- For testing, you can use this pre-hashed password: "admin123"
-- Hash: $2a$10$rZ5qX8qK5X5X5X5X5X5X5eX5X5X5X5X5X5X5X5X5X5X5X5X5X5X

INSERT INTO users (id, name, email, password_hash, role, created_at)
VALUES (
  gen_random_uuid(),
  'Super Admin',
  'admin@petpooja.com',
  '$2a$10$YourHashedPasswordHere',
  'SUPER_ADMIN',
  NOW()
);
```

### Option 3: Create via Backend API (Temporary Route)
You can temporarily add this route to test:

```javascript
// In backend/index.js (REMOVE AFTER TESTING)
app.post('/api/create-super-admin', async (req, res) => {
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('admin123', salt);
  
  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@petpooja.com',
      passwordHash: hash,
      role: 'SUPER_ADMIN'
    }
  });
  
  res.json({ success: true, admin });
});
```

## Starting the Application

### 1. Start Backend
```bash
cd backend
npm install  # if not already done
npm start    # or node index.js
```

Expected output:
```
Server is running on port 8081
```

### 2. Start Frontend
```bash
cd admin-web
npm install  # if not already done
npm run dev
```

Expected output:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

## Testing Steps

### Step 1: Login as Super Admin
1. Open browser: `http://localhost:5173`
2. You should be redirected to `/login`
3. Enter credentials:
   - Email: `admin@petpooja.com`
   - Password: `admin123` (or whatever you set)
4. Click "Login"
5. Should redirect to dashboard (`/`)

### Step 2: Verify Dashboard Loads
Check that all 5 sections appear:
- ✅ Platform Overview KPIs (8 cards)
- ✅ Restaurant Management (table with data)
- ✅ Platform Analytics (charts)
- ✅ Subscription Overview (cards + list)
- ✅ Recent Activity (two columns)

### Step 3: Test Platform Overview KPIs
Verify each card shows correct data:
- **Total Restaurants**: Should match count in database
- **Active Subscriptions**: Count of restaurants with ACTIVE status
- **Expired Subscriptions**: Count of restaurants with EXPIRED status
- **Total Revenue**: Sum of all completed orders
- **Orders Today**: Count of today's orders
- **Total Customers**: Unique customer count
- **Active Orders**: Pending + Accepted orders
- **Restaurant Owners**: Count of users with OWNER role

### Step 4: Test Restaurant Management
1. Check if table displays restaurants
2. Verify columns show correct data:
   - Restaurant name and slug
   - Owner name and email
   - Status badge (green for ACTIVE, red for EXPIRED)
   - Tables count
   - Orders count
   - Revenue amount
3. **Test Subscription Toggle**:
   - Click "Deactivate" on an ACTIVE restaurant
   - Status should change to EXPIRED (red badge)
   - Button should change to "Activate"
   - Click "Activate" to toggle back
   - Verify status changes in database

### Step 5: Test Platform Analytics
1. **7-Day Revenue Trend**:
   - Check if bars display for last 7 days
   - Hover to see values
   - Verify dates are correct
   - Check if revenue amounts match

2. **Top 5 Restaurants**:
   - Verify ranking (1-5)
   - Check restaurant names
   - Verify order counts
   - Verify revenue amounts
   - Should be sorted by revenue (highest first)

### Step 6: Test Subscription Overview
1. **Summary Cards**:
   - Active count should match KPI
   - Expired count should match KPI
   - Percentages should add up to 100%

2. **Expired List**:
   - Should show restaurants with EXPIRED status
   - Click "Activate" button
   - Restaurant should move to ACTIVE
   - Should disappear from expired list

### Step 7: Test Recent Activity
1. **Recently Added Restaurants**:
   - Shows last 5 restaurants created
   - Displays creation date
   - Sorted by newest first

2. **Recent Large Orders**:
   - Shows orders over $100
   - Displays restaurant name
   - Shows order amount
   - Shows table number
   - Shows timestamp

### Step 8: Test Error Handling
1. **Stop Backend Server**
2. Refresh dashboard
3. Should show error message: "Failed to load dashboard data"
4. Click "Retry" button
5. Should attempt to reload (will fail if server still down)
6. **Restart Backend Server**
7. Click "Retry" again
8. Dashboard should load successfully

### Step 9: Test Loading State
1. Open browser DevTools (F12)
2. Go to Network tab
3. Set throttling to "Slow 3G"
4. Refresh page
5. Should see loading spinner with "Loading dashboard..." text
6. Wait for data to load
7. Loading should disappear and dashboard should appear

### Step 10: Test Responsive Design
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test different screen sizes:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1200px)
4. Verify:
   - KPI cards stack properly
   - Tables are scrollable on mobile
   - Charts adapt to screen size
   - Sidebar works on mobile

## API Testing (Using Postman or cURL)

### Get Platform Stats
```bash
curl -X GET http://localhost:8081/api/admin/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Restaurants
```bash
curl -X GET "http://localhost:8081/api/admin/restaurants?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Subscription
```bash
curl -X PATCH http://localhost:8081/api/admin/restaurants/RESTAURANT_ID/subscription \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subscriptionStatus": "EXPIRED"}'
```

### Get Analytics
```bash
curl -X GET http://localhost:8081/api/admin/analytics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Subscriptions
```bash
curl -X GET http://localhost:8081/api/admin/subscriptions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Recent Activity
```bash
curl -X GET "http://localhost:8081/api/admin/activity?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Common Issues & Solutions

### Issue 1: "401 Unauthorized"
**Solution**: 
- Check if you're logged in
- Verify JWT token in localStorage
- Check if user has SUPER_ADMIN role

### Issue 2: "Failed to load dashboard data"
**Solution**:
- Check if backend is running
- Verify database connection
- Check backend console for errors
- Verify API endpoints are registered

### Issue 3: Empty Dashboard (No Data)
**Solution**:
- Add test data to database
- Create restaurants, orders, customers
- Verify database has data

### Issue 4: Subscription Toggle Not Working
**Solution**:
- Check browser console for errors
- Verify restaurant ID is correct
- Check backend logs
- Ensure user has SUPER_ADMIN role

### Issue 5: Charts Not Displaying
**Solution**:
- Check if analytics data is being fetched
- Verify data structure in browser console
- Check for JavaScript errors
- Ensure there's data for the date range

## Sample Test Data

To properly test the dashboard, you should have:
- At least 5-10 restaurants
- Mix of ACTIVE and EXPIRED subscriptions
- At least 50+ orders (some completed, some pending)
- Orders spread across last 7 days
- At least 20+ customers
- Multiple restaurant owners

You can use Prisma Studio or seed scripts to create test data.

## Success Criteria

✅ All 5 dashboard sections load without errors
✅ KPI cards display correct statistics
✅ Restaurant table shows data with proper formatting
✅ Subscription toggle works bidirectionally
✅ Charts render with correct data
✅ Recent activity feeds populate
✅ Loading state displays during fetch
✅ Error handling works gracefully
✅ Responsive design works on all screen sizes
✅ No console errors
✅ All API endpoints return 200 status
✅ Authentication and authorization work correctly

## Performance Benchmarks

- Dashboard initial load: < 2 seconds
- Subscription toggle: < 500ms
- API response times: < 300ms each
- No memory leaks after multiple refreshes
- Smooth animations and transitions

## Security Checklist

✅ All admin routes require authentication
✅ All admin routes restricted to SUPER_ADMIN only
✅ JWT token validated on every request
✅ No sensitive data exposed in frontend
✅ Proper error messages (no stack traces to client)
✅ SQL injection prevention (Prisma ORM)
✅ XSS prevention (React escaping)

## Next Steps After Testing

1. Add more test data if needed
2. Test with real production-like data volume
3. Perform load testing
4. Add unit tests for controllers
5. Add integration tests for API endpoints
6. Set up monitoring and logging
7. Deploy to staging environment
8. Conduct user acceptance testing
