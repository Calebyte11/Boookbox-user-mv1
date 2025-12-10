# Total Amount Persistence Fix - Complete Guide

## Problem Statement
Users were experiencing a mismatch in the booking total amount:
- **OrderForm** displayed: ₦50,000
- **CheckoutDetails** displayed: ₦35,000
- **Cause:** The calculated total from OrderForm was not being persisted to CheckoutDetails

## Root Cause Analysis

### Why the Mismatch Happened
1. **OrderForm** uses `calculateTotalAmount()` which applies special multiplications:
   ```typescript
   // For "others" with multiple recipients: cartTotal × numRecipients × numBookings
   return cartTotal * numRecipients * numBookings;
   ```

2. **CheckoutDetails** recalculates from scratch using `NewBookingPricing`:
   ```typescript
   // Only multiplies for "public" bookings
   if (bookingType === "public" && numberOfRecipients > 1) {
     subtotal = baseTotal * numberOfRecipients;
   } else {
     subtotal = baseTotal;
   }
   ```

3. **No data transfer** between the two - each calculates independently

### Result
Different calculation logic = Different totals ❌

## Solution Overview

Implement a **three-point data pipeline** to persist the calculated total:

```
OrderForm → Zustand Store → CheckoutDetails
  (calc)        (persist)      (retrieve & use)
```

## Implementation Details

### 1. Zustand Store Enhancement

**File:** `src/store/bookingStore.ts`

**Add to BookingDetails interface:**
```typescript
export interface BookingDetails {
  // ... existing fields ...
  calculatedTotalAmount?: number; // Store the total amount calculated from OrderForm
}
```

**Add to initial state:**
```typescript
const initialState: BookingDetails = {
  // ... existing initializations ...
  calculatedTotalAmount: undefined,
};
```

**Add to localStorage persistence:**
```typescript
partialize: (state) => ({
  // ... existing fields ...
  calculatedTotalAmount: state.calculatedTotalAmount,
}),
```

### 2. OrderForm Integration

**File:** `src/components/sponsor/OrderForm.tsx`

**In the form submission handler, when calling updateBookingDetails:**
```typescript
updateBookingDetails({
  bookingType: data.bookingType,
  numberOfRecipients: parseInt(data.numberOfRecipients || "1", 10),
  // ... other fields ...
  calculatedTotalAmount: calculateTotalAmount(), // ← Add this line
});
```

**Important:** This must be called AFTER calculating the total but BEFORE navigation.

### 3. CheckoutDetails Integration

**File:** `src/pages/CheckoutDetails.tsx`

**Extract the stored value:**
```typescript
const {
  // ... other extractions ...
  calculatedTotalAmount, // ← Add this
  updateBookingDetails,
} = useBookingStore((state) => state);
```

**Use it in the total calculation (with fallback):**
```typescript
// Priority 1: Use stored calculated total (most accurate)
// Priority 2: Use computed breakdown total
// Priority 3: Use display total (fallback)
const totalAmountValue =
  calculatedTotalAmount && calculatedTotalAmount > 0
    ? calculatedTotalAmount
    : typeof totalInSmallestUnit === "number" && totalInSmallestUnit > 0
    ? totalInSmallestUnit / 100
    : totalDisplayAmount;
```

**Add debug logging (optional but recommended):**
```typescript
useEffect(() => {
  if (calculatedTotalAmount && calculatedTotalAmount > 0) {
    console.log("✅ Using stored calculated total from OrderForm:", {
      calculatedTotalAmount,
      normalizedTotalAmount,
      bookingType,
      numberOfRecipients,
    });
  }
}, [calculatedTotalAmount, normalizedTotalAmount, bookingType, numberOfRecipients]);
```

**Clear after successful payment:**
```typescript
updateBookingDetails({
  // ... other clears ...
  calculatedTotalAmount: undefined,
});
```

## Advanced Topics

### Persistence Mechanism

The Zustand store uses localStorage, so the calculated total persists across:
- Page navigation
- Browser tab reload
- Back button navigation
- Window refresh

**How it works:**
1. When `updateBookingDetails()` is called, Zustand updates the store
2. The `persist` middleware catches this change
3. It serializes and saves to localStorage under key `"booking-storage"`
4. On page reload, Zustand restores from localStorage automatically

### Fallback Logic Explanation

```typescript
const totalAmountValue =
  calculatedTotalAmount && calculatedTotalAmount > 0
    ? calculatedTotalAmount                          // Priority 1
    : typeof totalInSmallestUnit === "number" && totalInSmallestUnit > 0
    ? totalInSmallestUnit / 100                     // Priority 2
    : totalDisplayAmount;                           // Priority 3
```

This handles multiple scenarios:

| Scenario | Result |
|----------|--------|
| Normal flow from OrderForm | Uses stored `calculatedTotalAmount` ✅ |
| Direct URL to CheckoutDetails | Falls back to `totalInSmallestUnit` |
| Edge case with invalid data | Uses `totalDisplayAmount` |

### Debug Logging

The console logs help verify the system is working:

```
✅ Using stored calculated total from OrderForm: {
  calculatedTotalAmount: 50000,
  normalizedTotalAmount: 50000,
  bookingType: "others",
  numberOfRecipients: 1
}
```

**What to look for:**
- ✅ The value is present and correct
- ✅ It matches the OrderForm total
- ✅ `normalizedTotalAmount` is properly formatted

## Verification Checklist

### Before Payment
- [ ] OrderForm shows total: ₦X
- [ ] Navigate to CheckoutDetails
- [ ] CheckoutDetails shows same total: ₦X
- [ ] Console shows debug log confirming stored total is used
- [ ] Payment amount matches display amount

### After Page Refresh
- [ ] Page refreshes during CheckoutDetails
- [ ] Total remains the same
- [ ] localStorage still contains `booking-storage` data

### After Successful Payment
- [ ] Payment completes successfully
- [ ] `calculatedTotalAmount` is cleared from store
- [ ] New booking starts fresh (no old data)

### Edge Cases
- [ ] Manual URL navigation to checkout bypasses OrderForm (should still work)
- [ ] Browser DevTools shows localStorage persisting data
- [ ] Logout and login preserves nothing (clean state)

## Troubleshooting

### Issue: Totals still don't match

**Diagnosis:**
1. Check browser console for errors
2. Open DevTools → Application → localStorage
3. Search for `booking-storage` key
4. Verify `calculatedTotalAmount` is present

**Solution:**
- Verify line 2788 in OrderForm saves the value
- Verify line 56 in CheckoutDetails extracts it
- Check that `useBookingStore` is properly configured

### Issue: Amount changes after refresh

**Diagnosis:**
- Check if `partialize` includes `calculatedTotalAmount`
- Verify localStorage isn't being cleared

**Solution:**
- Add to partialize if missing
- Don't clear localStorage between navigation

### Issue: Debug log not showing

**Diagnosis:**
- Console might be filtered
- Effect dependency might not be working

**Solution:**
- Check console filter settings
- Verify `calculatedTotalAmount` is not undefined
- Check effect dependencies match the log condition

## Performance Considerations

- **Storage size:** `calculatedTotalAmount` is a single number (negligible)
- **Calculation overhead:** Minimal - just a lookup from store
- **Memory:** No memory leaks - cleanup on payment success
- **Rendering:** No re-renders caused by this change

## Type Safety

All changes are fully typed:

```typescript
// bookingStore.ts
calculatedTotalAmount?: number; // Optional number type

// OrderForm.tsx
calculatedTotalAmount: calculateTotalAmount(), // returns number

// CheckoutDetails.tsx
const { calculatedTotalAmount } = useBookingStore((state) => state);
// ✅ TypeScript knows it's number | undefined
```

## Future Improvements

Potential enhancements for later:
- [ ] Add validation that stored total > 0
- [ ] Add warning if calculated vs stored differs significantly
- [ ] Add analytics tracking for total amount changes
- [ ] Add retry mechanism if payment fails
- [ ] Add total amount audit trail for debugging

## Summary

This solution ensures the booking total calculated in OrderForm is accurately preserved through CheckoutDetails by:

1. **Storing** it in Zustand during form submission
2. **Persisting** it to localStorage for durability
3. **Retrieving** it in CheckoutDetails with priority logic
4. **Clearing** it after payment success

Result: **Consistent, reliable total amounts throughout the checkout flow** ✅
