# Mesh Loading & 3D Visualization Diagnostics Guide

## Issue Summary

Your 3D robot body appears incomplete in the viewer. This is because some mesh files (.stl files) may not be loading correctly from the public assets folder. The issue is likely one of:

1. **Mesh file path resolution** - Path conversion from `package://meshes/` format not working correctly
2. **HTTP fetch failures** - Specific mesh files returning 404 or other HTTP errors
3. **STL parsing errors** - Mesh files corrupted or in incompatible format
4. **Electron file:// protocol issues** - Asset serving in packaged Electron app

## Quick Diagnostic Steps

### Step 1: Open Browser DevTools Console
1. **Press `F12`** on your keyboard to open DevTools
2. Go to the **Console** tab
3. You should see messages like:
   ```
   [STLLoader] Starting fetch: /meshes/head.stl
   [STLLoader] Response received for /meshes/head.stl: status=200 ok=true
   [STLLoader] ✓ Success: /meshes/head.stl (vertices: 1250)
   ```

### Step 2: Run Mesh Loading Test
In the browser console, type:
```javascript
await window.meshDiagnostics.testMeshLoading()
```

This will:
- Test **all 90+ mesh files** in parallel
- Show which ones loaded successfully (✓)
- Show which ones failed (✗) and why
- Display a summary with OK/Missing/Error counts
- Print list of failed meshes

**Expected output:**
```
✓ mid_stomach.stl: 15234 bytes
✓ top_stomach.stl: 18923 bytes
✗ some_file.stl: HTTP 404: Not Found
...

=== Mesh Loading Summary ===
{
  "total": 90,
  "ok": 88,
  "missing": 2,
  "error": 0
}
```

### Step 3: Test Individual Mesh
If you want to test a specific mesh file:
```javascript
await window.meshDiagnostics.testSingleMesh('r_hand.stl')
```

This shows the full fetch details including HTTP status, content type, and file size.

## Console Error Patterns

### Pattern 1: HTTP 404 Errors
```
✗ filename.stl: HTTP 404: Not Found
```
**Cause:** Mesh file doesn't exist in `public/meshes/`
**Fix:** Check if file exists in `public/meshes/` folder

### Pattern 2: CORS errors
```
✗ filename.stl: Failed to fetch (CORS)
```
**Cause:** File serving issue with Electron app
**Fix:** Check Vite/Electron configuration for asset serving

### Pattern 3: Parse errors
```
[URDFBuilder] ✗ Failed to load linkname: Failed to parse STL
```
**Cause:** STL file corrupted or in incompatible format
**Fix:** Re-export the mesh file from 3D modeling tool

### Pattern 4: Timeouts
```
✗ filename.stl: Failed to fetch (timeout)
```
**Cause:** File server too slow or unresponsive
**Fix:** Check system resources, rebuild/restart app

## Understanding the Logs

When meshes load, you'll see messages in DevTools console like:

```
[URDFBuilder] Resolved mesh path for r_hand: /meshes/r_hand.stl
[STLLoader] Starting fetch: /meshes/r_hand.stl
[STLLoader] Response received for /meshes/r_hand.stl: status=200 ok=true
[STLLoader] Buffer received, size: 45678 bytes
[STLLoader] ✓ Success: /meshes/r_hand.stl (vertices: 1500)
[URDFBuilder] ✓ Successfully loaded: r_hand_link
```

## Common Build Issues

### Issue: Meshes not bundled with app
**Symptom:** All meshes fail with 404 errors
**Solution:** 
- Ensure `public/meshes/` directory exists
- Run build command: `npm run build`
- Check that meshes are copied to dist output

### Issue: Only some meshes fail
**Symptom:** 85/90 mesh files load, but specific ones fail
**Solution:**
- Use `testSingleMesh()` to identify which ones fail
- Check file exists: `ls public/meshes/filename.stl`
- Check file isn't corrupted: File size should be >1KB
- Try re-exporting from mesh library

### Issue: Electron file:// protocol path issues
**Symptom:** Works in dev but fails in packaged app
**Solution:**
- Check forge.config.ts has `asar: true` (public is bundled)
- Test in packaged app (not dev mode)
- Check that paths use forward slashes (not backslashes on Windows)

## Next Steps

1. **Collect diagnostics:** Run `testMeshLoading()` and note which files fail
2. **Check console errors:** Look for [URDFBuilder] or [STLLoader] error messages
3. **Verify files exist:** `ls public/meshes/` (or use file explorer on Windows)
4. **Test single file:** `testSingleMesh('filename.stl')` for any failing file
5. **Report findings:** Share console output and failed file list with debugging

## Accessing Diagnostics in Production

The diagnostic functions are automatically attached to `window.meshDiagnostics` when the app loads. You can access them anytime:

```javascript
// List all mesh files being tested
window.meshDiagnostics.MESH_FILES

// Test all meshes and get results
const results = await window.meshDiagnostics.testMeshLoading()

// Test specific mesh with full details
await window.meshDiagnostics.testSingleMesh('head.stl')
```

## Debugging Best Practices

1. **Clear browser cache** before testing: DevTools → Application → Clear storage
2. **Check Network tab** in DevTools to see fetch requests
3. **Look for red errors** in console - those are actual failures
4. **Note failed filenames** for pattern analysis
5. **Compare with working mesh** to understand format difference

## File Checklist

Complete mesh inventory (verify these exist in `public/meshes/`):

**Body (6 files):**
- [ ] mid_stomach.stl
- [ ] top_stomach.stl
- [ ] disk.stl
- [ ] torso.stl
- [ ] chest.stl
- [ ] kinectone.stl

**Head (12 files):**
- [ ] head_base.stl
- [ ] head.stl
- [ ] jaw.stl
- [ ] skull.stl
- [ ] earleftv1.stl
- [ ] earrightv1.stl
- [ ] face.stl
- [ ] eyesupport.stl
- [ ] r_eyesupport.stl
- [ ] l_eyesupport.stl
- [ ] camera.stl (shared)
- [ ] eye.stl (shared)
- [ ] iris.stl (shared)

**Arms (8 files):**
- [ ] r_shoulder_base.stl
- [ ] r_shoulder.stl
- [ ] l_shoulder_base.stl
- [ ] l_shoulder.stl
- [ ] bicep.stl (shared)
- [ ] bicepcover.stl (shared)
- [ ] r_forearm.stl
- [ ] l_forearm.stl

**Hands (35+ files):**
- [ ] r_hand.stl
- [ ] l_hand.stl
- [ ] Thumb, Index, Middle, Ring, Pinky joints (multiple segments each)
- [ ] Hand covers (8 files)
- [ ] Finger covers (4 per hand)

---

**Need Help?** Check the console logs first - they usually indicate exactly what's missing or failing. Share those logs for faster diagnosis.
