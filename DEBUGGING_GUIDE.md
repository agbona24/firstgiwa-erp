# 🔧 FIRSTGIWA ERP - React Debugging Guide

## Quick Reference: When You See a Blank White Page

### Step 1: Open Browser DevTools
Press `F12` or `Cmd + Option + I` (Mac) → Go to **Console** tab

### Step 2: Look for the Error Type

| Error Message | What It Means | Quick Fix |
|--------------|---------------|-----------|
| `Objects are not valid as a React child` | You're rendering an object directly | Use `{item.name}` not `{item}` |
| `Cannot read properties of undefined` | Accessing data before it loads | Add `?.` optional chaining |
| `Maximum update depth exceeded` | Infinite loop in useEffect | Check your dependency array |
| `is not a function` | Calling undefined function | Check imports and spelling |

---

## The #1 Cause of Blank Pages: React Error #31

This happens when you try to render an object directly:

```jsx
// ❌ WRONG - This crashes React
const user = { name: 'John', age: 30 };
return <div>{user}</div>;  // Objects can't be rendered!

// ✅ CORRECT - Render specific properties
return <div>{user.name}</div>;
```

### Common Pattern That Causes This:

```jsx
// ❌ WRONG - Spreading objects with nested objects
const items = apiData.map(item => ({
    ...item,  // If item.product is an object, this will crash!
}));

// ✅ CORRECT - Extract only what you need
const items = apiData.map(item => ({
    id: item.id,
    name: item.name,
    product_name: item.product?.name || '-',  // Extract the string!
}));
```

---

## Using the Debug Helpers

We've created utilities in `/resources/js/utils/debugHelpers.js`:

### 1. Inspect Data Before Rendering

```jsx
import { inspectData, debugLog } from '@/utils/debugHelpers';

// In your component:
useEffect(() => {
    api.get('/products').then(response => {
        inspectData(response.data, 'Products API Response');  // See structure in console
        setProducts(response.data);
    });
}, []);
```

### 2. Safe Render (Prevents Error #31)

```jsx
import { safeRender } from '@/utils/debugHelpers';

// Safely render anything - objects become their .name property
<td>{safeRender(item.product)}</td>
```

### 3. Transform API Data Safely

```jsx
import { transformItem } from '@/utils/debugHelpers';

const safeItems = apiData.map(item => transformItem(item, {
    id: 'id',
    name: 'name',
    product_name: 'product.name',  // Dot notation for nested
    total: (item) => item.qty * item.price,  // Custom function
}));
```

### 4. Debug Logging

```jsx
import { debugLog } from '@/utils/debugHelpers';

debugLog.info('Component mounted');
debugLog.success('Data loaded', data);
debugLog.warn('Missing optional field', field);
debugLog.error('API call failed', error);
debugLog.api('/products', response);  // Special API logging
```

---

## Standard Debugging Workflow

### When You Hit a Bug:

1. **Open Console** (F12 → Console)
2. **Read the Error** - The first line tells you what went wrong
3. **Check the Component Stack** - Which component failed?
4. **Add Logging** - Before the error line:
   ```jsx
   console.log('data before render:', data);
   console.log('data type:', typeof data);
   console.log('data keys:', Object.keys(data || {}));
   ```
5. **Use inspectData()** - For complex API responses:
   ```jsx
   inspectData(response.data, 'API Response');
   ```

### Preventing Blank Pages:

1. **Always use optional chaining** for nested data:
   ```jsx
   item?.product?.name  // Won't crash if product is undefined
   ```

2. **Add loading states**:
   ```jsx
   if (loading) return <div>Loading...</div>;
   if (error) return <div>Error: {error.message}</div>;
   ```

3. **Default empty arrays**:
   ```jsx
   const items = data?.items || [];
   ```

4. **Check before mapping**:
   ```jsx
   {items && items.length > 0 && items.map(...)}
   ```

---

## API Response Debugging

When data from API looks wrong:

```jsx
// Add this to your fetch function:
const fetchData = async () => {
    try {
        const response = await api.get('/endpoint');
        
        // Log EVERYTHING
        console.group('🌐 API Response');
        console.log('Status:', response.status);
        console.log('Full response:', response);
        console.log('Data:', response.data);
        console.log('Data type:', typeof response.data);
        
        if (Array.isArray(response.data)) {
            console.log('Is Array, length:', response.data.length);
            console.log('First item:', response.data[0]);
        }
        console.groupEnd();
        
        return response.data;
    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
        throw error;
    }
};
```

---

## Checklist Before Asking for Help

- [ ] Opened Browser Console and read the error message
- [ ] Identified which component is failing (from stack trace)
- [ ] Added `console.log()` to see what data looks like
- [ ] Checked if the data is loaded before rendering
- [ ] Verified API is returning expected structure
- [ ] Looked for objects being rendered directly

---

## Quick Fixes Reference

| Problem | Solution |
|---------|----------|
| `{item}` shows error | Change to `{item.name}` or `{safeRender(item)}` |
| `{...item}` in map spreads objects | Extract only primitives explicitly |
| Data undefined on first render | Add loading check or `data?.property` |
| API returns nested data | Access with `response.data.data` or check structure |
| List crashes | Add `key` prop and check array exists |
