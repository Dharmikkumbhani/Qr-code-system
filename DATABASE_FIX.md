# Database Connection Issue - Fix Guide

## Error
```
Can't reach database server at `ep-long-cell-aq8iyh93-pooler.c-8.us-east-1.aws.neon.tech:5432`
```

## Root Cause
Your Neon PostgreSQL database is not reachable. This is common with Neon's free tier databases.

## Solutions (Try in Order)

### Solution 1: Wake Up Neon Database (Most Common)
Neon free tier databases automatically sleep after 5 minutes of inactivity.

**Steps:**
1. Go to [Neon Console](https://console.neon.tech)
2. Login to your account
3. Find your project: `ep-long-cell-aq8iyh93-pooler`
4. Click on the project
5. Look for database status - if it says "Sleeping" or "Inactive"
6. Click "Wake up" or wait 10-20 seconds for it to auto-wake
7. Try your application again

**Alternative - Test Connection:**
```bash
cd backend
npx prisma db pull
```
This will attempt to connect and wake up the database.

### Solution 2: Check Internet Connection
1. Make sure you have active internet connection
2. Try accessing: https://console.neon.tech
3. If you can't access, check your internet

### Solution 3: Verify Database Credentials
Your current DATABASE_URL:
```
postgresql://neondb_owner:npg_49SqOYsAHIWF@ep-long-cell-aq8iyh93-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Steps:**
1. Go to [Neon Console](https://console.neon.tech)
2. Navigate to your project
3. Go to "Connection Details" or "Dashboard"
4. Copy the connection string
5. Compare with your `.env` file
6. If different, update `.env` with new connection string
7. Restart backend server

### Solution 4: Use Direct Connection (Not Pooler)
Sometimes the pooler endpoint has issues. Try the direct endpoint:

**Steps:**
1. Go to Neon Console
2. Find "Connection String"
3. Look for option to switch between "Pooled" and "Direct"
4. Copy the **Direct** connection string
5. Update `.env` file:
```env
DATABASE_URL="postgresql://neondb_owner:PASSWORD@ep-long-cell-aq8iyh93.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
```
(Note: Remove `-pooler` from the hostname)
6. Restart backend

### Solution 5: Check Firewall/VPN
1. Disable VPN if you're using one
2. Check Windows Firewall settings
3. Try from a different network
4. Check if your ISP blocks port 5432

### Solution 6: Regenerate Prisma Client
Sometimes Prisma client gets out of sync:

```bash
cd backend
npx prisma generate
npm start
```

### Solution 7: Use Local PostgreSQL (Alternative)
If Neon continues to have issues, switch to local PostgreSQL:

**Install PostgreSQL:**
1. Download from: https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set

**Update .env:**
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/qr_system?schema=public"
```

**Setup Database:**
```bash
cd backend
npx prisma db push
npm start
```

## Quick Test Commands

### Test 1: Check if database is reachable
```bash
cd backend
npx prisma db pull
```

**Expected Output (Success):**
```
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "neondb"
✔ Introspected 10 models and wrote them into prisma\schema.prisma
```

**Expected Output (Failure):**
```
Error: Can't reach database server
```

### Test 2: Test Prisma connection
```bash
cd backend
npx prisma studio
```
This should open Prisma Studio in browser. If it fails, database is not reachable.

### Test 3: Direct PostgreSQL connection test
```bash
# Install psql if not already installed
# Then test connection:
psql "postgresql://neondb_owner:npg_49SqOYsAHIWF@ep-long-cell-aq8iyh93-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

## Recommended Solution for Development

For reliable development, I recommend using **local PostgreSQL** instead of Neon:

### Why Local PostgreSQL?
- ✅ No sleep/wake issues
- ✅ Faster response times
- ✅ Works offline
- ✅ No connection limits
- ✅ More reliable

### Quick Setup:
1. Install PostgreSQL locally
2. Create database: `qr_system`
3. Update `.env`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/qr_system?schema=public"
```
4. Run migrations:
```bash
npx prisma db push
```
5. Create super admin:
```bash
node scripts/createSuperAdmin.js
```

## After Fixing Database Connection

1. Restart backend server
2. You should see: "Server is running on port 8081"
3. Test health endpoint: `curl http://localhost:8081/api/health`
4. Should return: `{"status":"OK","message":"Backend and Database are connected"}`
5. Refresh your dashboard - it should work!

## Still Not Working?

### Check Backend Console
Look for these messages:
- ✅ "Server is running on port 8081" - Good
- ❌ "Can't reach database server" - Database issue
- ❌ "ECONNREFUSED" - Database not running
- ❌ "Authentication failed" - Wrong credentials

### Check Neon Dashboard
1. Go to https://console.neon.tech
2. Check project status
3. Check if database is active
4. Check connection limits (free tier has limits)
5. Check if project is suspended

### Contact Neon Support
If Neon database continues to have issues:
1. Check Neon status page: https://neonstatus.com
2. Contact Neon support
3. Or switch to local PostgreSQL

## Prevention

To prevent database sleep issues with Neon:

### Option 1: Keep-Alive Ping
Add this to your backend (optional):
```javascript
// In backend/index.js
setInterval(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database keep-alive ping');
  } catch (error) {
    console.error('Keep-alive failed:', error.message);
  }
}, 4 * 60 * 1000); // Every 4 minutes
```

### Option 2: Upgrade Neon Plan
Paid Neon plans don't have auto-sleep feature.

### Option 3: Use Local PostgreSQL
Most reliable for development.

## Summary

**Most Likely Issue:** Neon database is sleeping (free tier limitation)

**Quick Fix:** 
1. Go to Neon Console
2. Wake up the database
3. Restart backend
4. Refresh dashboard

**Long-term Fix:**
Use local PostgreSQL for development to avoid these issues.
