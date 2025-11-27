# Three Approaches to Loading Business Data

## Approach 1: Current Implementation ❌ (4 Separate Conditional Queries)

```typescript
// src/pages/Recomended.tsx - Current approach
const { data: restaurantData } = useAllRestaurantsQuery({ 
  enabled: selectedCategory === "restaurant" 
});
const { data: groceriesData } = useAllGroceriesQuery({ 
  enabled: selectedCategory === "groceries" 
});
const { data: frozenFoodsData } = useAllFrozenFoodsQuery({ 
  enabled: selectedCategory === "frozen-foods" 
});
const { data: wineDrinksData } = useAllWineDrinksQuery({ 
  enabled: selectedCategory === "wine-drinks" 
});
```

**Pros:**
- Smaller initial payload
- Only loads selected category
- Good if user doesn't view all categories

**Cons:**
- Switching between categories requires new API calls
- Not a smooth UX when switching
- Still multiple API calls (just sequential)

**Network Activity:**
```
Load page → Restaurant API call (1s)
Click Groceries → Groceries API call (1s)  
Click Frozen Foods → Frozen Foods API call (1s)
Click Wine & Drinks → Wine & Drinks API call (1s)
Total: Multiple requests over time
```

---

## Approach 2: Single Call Load All ✅ (Your Idea)

```typescript
// src/hooks/useAllBusinessesUnified.ts - NEW
const { data } = useAllBusinessesUnifiedQuery();
// data = {
//   restaurant: [...],
//   groceries: [...],
//   frozen-foods: [...],
//   wine-drinks: [...]
// }
```

**Pros:**
- ✅ Only 1 API call ever
- ✅ Instant switching between categories (cached)
- ✅ Simplest implementation
- ✅ Best UX for category switching

**Cons:**
- ❌ Larger initial payload (all data at once)
- ❌ More bandwidth used
- ❌ More memory usage
- ❌ Slower initial load time

**Network Activity:**
```
Load page → All Businesses API call (3s) - includes all data
Click Groceries → Instant (cached)
Click Frozen Foods → Instant (cached)
Click Wine & Drinks → Instant (cached)
Total: 1 request, but larger payload
```

---

## Approach 3: Hybrid - Load Popular First, Others on Demand ⭐ (BEST)

```typescript
// Pseudo-code example
const { data: allData } = useAllBusinessesUnifiedQuery({
  enabled: true // Always load in background
});

// But prioritize showing restaurants first
// While other categories load in background with lower priority
const [visibleCategories, setVisibleCategories] = useState(['restaurant']);
```

**Pros:**
- ✅ Best of both worlds
- ✅ Quick initial load (restaurants only)
- ✅ Instant switching (everything cached after first load)
- ✅ Perfect UX
- ✅ Smart network usage

**Cons:**
- Slightly more complex logic

**Network Activity:**
```
Load page → Restaurant API call (1s)
[Background] → Groceries/Frozen/Wine loading (1-2s)
Click Groceries → Instant (cached or loading)
Total: Balanced approach
```

---

## My Recommendation: **Approach 2 (Single Call)**

### Why?

1. **Your API likely returns reasonable payload sizes** (probably < 1MB for all businesses)
2. **UX is much better** - Instant category switching feels native
3. **Simpler code** - Less to maintain
4. **Better caching** - 10 minute cache means users get instant results

### Implementation:

I've created `useAllBusinessesUnifiedQuery()` in `src/hooks/useAllBusinessesUnified.ts`

**Usage:**
```typescript
// Instead of 4 separate queries:
const { data: restaurantData } = useAllRestaurantsQuery();
const { data: groceriesData } = useAllGroceriesQuery();
// ... etc

// Use one unified query:
const { data } = useAllBusinessesUnifiedQuery();
const restaurantData = data?.restaurant;
const groceriesData = data?.groceries;
const frozenFoodsData = data?.["frozen-foods"];
const wineDrinksData = data?.["wine-drinks"];
```

---

## Network Comparison

| Approach | Initial Load | Category Switch | Total API Calls | Payload Size | UX |
|----------|--------------|-----------------|-----------------|--------------|-----|
| **Approach 1** (Current) | 1-2s | 1-2s each | 4 calls | Small × 4 | Slow switching ❌ |
| **Approach 2** (All at Once) | 2-3s | Instant | 1 call | Medium | Smooth ✅ |
| **Approach 3** (Hybrid) | 1-2s | Instant | 1-2 calls | Medium | Best ⭐ |

---

## What to Do Next

### Option A: Implement Approach 2 NOW (Recommended)
1. Replace all 4 query hooks in `Recomended.tsx` with `useAllBusinessesUnifiedQuery()`
2. Filter data in component
3. Test & measure performance

### Option B: Fine-tune with Analytics
1. Measure current payload sizes: `console.log(data.length * ~5KB)`
2. If < 500KB: Use Approach 2
3. If > 500KB: Use Approach 3

### Option C: Keep Current + Optimize Later
1. Keep Approach 1 for now
2. Add virtual scrolling / pagination
3. Revisit if still slow

---

## Quick Win: Measure Your Payload

Add this to your component temporarily:

```typescript
useEffect(() => {
  fetch("YOUR_API_URL/u/businesses/all")
    .then(r => r.json())
    .then(data => {
      console.log("Payload size estimate:", 
        JSON.stringify(data).length / 1024 + "KB"
      );
    });
}, []);
```

If it's under 500KB, definitely use Approach 2!
