# Backend Server Restart Required

## Issue
The error "Can't find /api/admin/stats on this server!" appears because the backend server was running BEFORE the new admin routes were added.

## Solution
You need to **restart the backend server** to load the new routes.

## Steps to Restart Backend

### Option 1: Using Terminal (Recommended)
1. Go to the terminal where backend is running
2. Press `Ctrl + C` to stop the server
3. Wait for it to fully stop
4. Run `npm start` or `node index.js` again
5. You should see: "Server is running on port 8081"

### Option 2: Using Command Prompt
```bash
# Navigate to backend folder
cd c:\Users\ASUS\OneDrive\Desktop\Intern\Qr-code-system\backend

# Stop any running node processes (if needed)
taskkill /F /IM node.exe

# Start the server again
npm start
```

### Option 3: Using PowerShell
```powershell
# Navigate to backend folder
cd c:\Users\ASUS\OneDrive\Desktop\Intern\Qr-code-system\backend

# Stop any running node processes (if needed)
Stop-Process -Name node -Force

# Start the server again
npm start
```

## Verification

After restarting, verify the routes are working:

### Test 1: Health Check
```bash
curl http://localhost:8081/api/health
```
Should return: `{"status":"OK","message":"Backend and Database are connected"}`

### Test 2: Admin Stats (requires authentication)
Open browser console and run:
```javascript
fetch('http://localhost:8081/api/admin/stats', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(console.log)
```

## Expected Console Output After Restart

You should see something like:
```
Server is running on port 8081
```

And when you refresh the dashboard, it should load successfully!

## If Still Not Working

1. **Check if backend is actually running:**
   - Open Task Manager
   - Look for "Node.js" process
   - If not found, backend is not running

2. **Check for errors in backend console:**
   - Look for any red error messages
   - Common issues:
     - Port 8081 already in use
     - Database connection failed
     - Missing dependencies

3. **Check backend logs:**
   - Any errors when starting?
   - Any errors when accessing routes?

4. **Verify file exists:**
   ```bash
   dir backend\src\routes\adminRoutes.js
   dir backend\src\controllers\adminController.js
   ```

5. **Check for syntax errors:**
   - Open backend console
   - Look for any JavaScript errors
   - Fix any syntax issues

## Common Issues

### Issue: Port 8081 already in use
**Solution:**
```bash
# Windows
netstat -ano | findstr :8081
taskkill /PID <PID_NUMBER> /F

# Then restart
npm start
```

### Issue: Module not found
**Solution:**
```bash
cd backend
npm install
npm start
```

### Issue: Database connection failed
**Solution:**
- Check if PostgreSQL is running
- Verify DATABASE_URL in .env file
- Test connection: `npx prisma db pull`

## After Successful Restart

1. Refresh the admin dashboard page
2. The error should disappear
3. Dashboard should load with all 5 sections
4. If you see loading spinner, wait for data to load
5. If you see data, everything is working! 🎉

## Still Having Issues?

If the problem persists after restart:
1. Check browser console for errors (F12)
2. Check Network tab for failed requests
3. Verify you're logged in as SUPER_ADMIN
4. Check backend console for errors
5. Verify database has data to display
