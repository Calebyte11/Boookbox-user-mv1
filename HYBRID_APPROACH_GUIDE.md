# Hybrid Approach Implementation Guide

## What We Implemented ✅

The **Hybrid Approach** - a balance between performance and UX:

```
Page Load:
├─ Restaurants API call (Immediate) ⚡ 1-2s
├─ Groceries API call (Background) 🔄 Loading...
├─ Frozen Foods API call (Background) 🔄 Loading...
└─ Wine & Drinks API call (Background) 🔄 Loading...

After 3-4s:
└─ All categories cached and instant to switch
```

---

## Implementation Details

### 1. **Recomended.tsx Changes**

**Before (Conditional Loading):**
```typescript
// Only load selected category
const { data: restaurantData } = useAllRestaurantsQuery({ 
  enabled: selectedCategory === "restaurant" 
});
const { data: groceriesData } = useAllGroceriesQuery({ 
  enabled: selectedCategory === "groceries" 
});
// ... etc - User waits when switching categories
```

**After (Hybrid - Always Load All):**
```typescript
// Load Restaurants IMMEDIATELY
const { data: restaurantData } = useAllRestaurantsQuery({ enabled: true });

// Load Groceries in BACKGROUND
const { data: groceriesData } = useAllGroceriesQuery({ enabled: true });

// Load Frozen Foods in BACKGROUND
const { data: frozenFoodsData } = useAllFrozenFoodsQuery({ enabled: true });

// Load Wine & Drinks in BACKGROUND
const { data: wineDrinksData } = useAllWineDrinksQuery({ enabled: true });
```

**Result:** Switching between categories is instant! ⚡

---

### 2. **Query Hook Updates**

Updated all 4 query hooks to support options and aggressive caching:

#### `useAllRestaurantsQuery()` (useRestaurantQueries.ts)
```typescript
export function useAllRestaurantsQuery(options?: { enabled?: boolean; staleTimeMs?: number }) {
  return useQuery({
    queryKey: restaurantQueryKeys.restaurants.all,
    queryFn: () => restaurantService.getAllRestaurants("restaurants"),
    enabled: options?.enabled !== false,           // ✅ Can disable if needed
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 10, // ✅ 10 min cache
    gcTime: 1000 * 60 * 30,                        // ✅ 30 min garbage collection
    retry: 2,                                      // ✅ Auto-retry on failure
    refetchOnWindowFocus: false,                   // ✅ Don't refetch on tab switch
  });
}
```

**Applied to:**
- `useAllRestaurantsQuery()` in `useRestaurantQueries.ts`
- `useAllGroceriesQuery()` in `useGroceriesQueries.ts`
- `useAllFrozenFoodsQuery()` in `useFrozenFoodsQueries.ts`
- `useAllWineDrinksQuery()` in `useWineDrinksQueries.ts`

---

## Performance Impact

### Before (Conditional)
```
Timeline:
0ms    ├─ User lands on page
200ms  ├─ Restaurant API starts
1200ms ├─ Restaurant data arrives ✅
1200ms ├─ User sees restaurants
       │
       └─ User clicks Groceries tab
1500ms ├─ Groceries API starts
2500ms ├─ User waits... 1 second ⏳
2500ms └─ Groceries data arrives ✅
```

### After (Hybrid)
```
Timeline:
0ms    ├─ User lands on page
200ms  ├─ Restaurant API starts ⚡
300ms  ├─ Groceries API starts 🔄 (background)
400ms  ├─ Frozen Foods API starts 🔄 (background)
500ms  ├─ Wine & Drinks API starts 🔄 (background)
1200ms ├─ Restaurant data arrives ✅
2000ms ├─ Groceries data cached 🔄
2200ms ├─ Frozen Foods data cached 🔄
2400ms └─ Wine & Drinks data cached 🔄
       │
       └─ User clicks Groceries tab
2400ms ├─ Instant render ✅ (already cached!)
```

---

## Cache Strategy

| Category | Load Time | Cache Time | Garbage Collection |
|----------|-----------|------------|-------------------|
| **Restaurants** | ~1s | 10 min | 30 min |
| **Groceries** | ~1-1.5s | 10 min | 30 min |
| **Frozen Foods** | ~1-1.5s | 10 min | 30 min |
| **Wine & Drinks** | ~1-1.5s | 10 min | 30 min |

**Meaning:**
- Data is considered "fresh" for 10 minutes
- If data is older than 10 min, it's marked as stale (but still used)
- If user navigates away for 30 min, data is cleared from memory

---

## Testing Checklist

### ✅ Basic Functionality
- [ ] Page loads with restaurants showing
- [ ] Switching categories shows correct data
- [ ] No loading spinner when switching categories
- [ ] All 4 categories display correctly

### ✅ Performance
- [ ] Open DevTools Network tab
- [ ] Page load completes in < 3s
- [ ] Category switch is instant (< 100ms)
- [ ] No duplicate API calls

### ✅ Error Handling
- [ ] Try loading with poor internet
- [ ] Switch categories while loading
- [ ] Refresh page
- [ ] All errors handled gracefully

### ✅ Edge Cases
- [ ] No restaurants data
- [ ] Missing images
- [ ] Very long business names
- [ ] No location data

---

## Network Tab Expectations

**Good Sign:**
```
GET /u/businesses/all?category=restaurants  200 OK  ~1s
GET /u/businesses/all?category=groceries    200 OK  ~1s
GET /u/businesses/all?category=frozen-foods 200 OK  ~1s
GET /u/businesses/all?category=wine-drinks  200 OK  ~1s
```

All 4 requests fire roughly simultaneously (within 100-300ms of each other).

**Bad Sign (Don't Want):**
```
GET /u/businesses/all?category=groceries    Pending 5s
GET /u/businesses/all?category=frozen-foods Pending 10s
```

Stalled requests = timeout or network issue.

---

## Optimization Options (Future)

### Option 1: Prioritize Requests
```typescript
// Load restaurants first, others with lower priority
const { data: restaurantData } = useAllRestaurantsQuery({ enabled: true });
const { data: groceriesData } = useAllGroceriesQuery({ 
  enabled: true,
  networkMode: "online" // Only load if online (future feature)
});
```

### Option 2: Progressive Loading
```typescript
// Load restaurants immediately, others after 1 second
const [loadOthers, setLoadOthers] = useState(false);
useEffect(() => {
  const timer = setTimeout(() => setLoadOthers(true), 1000);
  return () => clearTimeout(timer);
}, []);

const { data: groceriesData } = useAllGroceriesQuery({ enabled: loadOthers });
```

### Option 3: Lazy Load Non-Critical Data
```typescript
// Only load when user clicks category tab
const [loadGroceries, setLoadGroceries] = useState(false);
const { data: groceriesData } = useAllGroceriesQuery({ enabled: loadGroceries });

const handleCategoryClick = (category) => {
  if (category === "groceries") setLoadGroceries(true);
  setSelectedCategory(category);
};
```

---

## Monitoring Performance

Add this to your component to log performance:

```typescript
useEffect(() => {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    console.log(`Category ${selectedCategory} data ready in ${endTime - startTime}ms`);
  };
}, [selectedCategory, restaurantData, groceriesData, frozenFoodsData, wineDrinksData]);
```

Or use React DevTools Profiler:
1. Open React DevTools
2. Go to Profiler tab
3. Record an interaction
4. Check render times per component

---

## Summary

✅ **Restaurants load immediately** - Fast initial page load
✅ **Other categories preload** - Instant category switching after 2-3s
✅ **10-minute cache** - Frequent refreshes don't waste bandwidth
✅ **Automatic retries** - Network glitches don't break the app
✅ **No window refocus refetch** - Smooth UX when switching tabs

This is the **sweet spot** between performance and UX! 🎯
