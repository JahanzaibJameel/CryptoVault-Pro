# Failure Demo GIF Instructions

## 30-Second Demo Script

### Setup
1. Open Chrome browser
2. Navigate to: `http://localhost:4200`
3. Open browser console (F12) to see debug logs
4. Position browser window to capture both dashboard and debug panel

### Recording Steps (30 seconds total)

**0-5 seconds: Online State**
- Show dashboard with loaded data
- Highlight debug panel in bottom-right corner
- Show "Online" status in debug panel

**5-10 seconds: Toggle API Offline**
- Click "🚫 Go Offline" button in debug panel
- Show console logs indicating API offline
- Notice cached data still displays

**10-20 seconds: Offline Operations**
- Navigate to Portfolio tab
- Click "Add Transaction" 
- Fill form: Bitcoin, Buy, 0.001, Market price
- Submit transaction (should work offline)
- Show success message

**20-25 seconds: Verify Offline Persistence**
- Navigate back to Dashboard
- Show transaction was saved locally
- Refresh page (Ctrl+R) to verify persistence

**25-30 seconds: Recovery**
- Click "🌐 Go Online" button in debug panel
- Show API calls resume and fresh data loads

### Recording Tools

**Option 1: Windows Game Bar**
1. Press `Win + G`
2. Start recording
3. Perform the demo steps
4. Stop recording
5. Trim to 30 seconds
6. Save as: `docs/failure-demo.gif`

**Option 2: LICEcap**
1. Download and install LICEcap
2. Set recording area to browser window
3. Record at 15-20 FPS for smaller file size
4. Save as GIF (target < 2MB)

**Option 3: ScreenToGif**
1. Use online tool or desktop app
2. Record browser window
3. Optimize for web (reduce colors, frame rate)
4. Export as GIF

### Key Moments to Capture
- Debug panel toggle from Online → Offline
- Transaction form working without network
- Data persistence after page refresh
- Recovery when going back online

### Expected File Size
- Target: < 2MB
- Resolution: 1920x1080 or smaller
- Frame rate: 15-20 FPS
- Duration: exactly 30 seconds
