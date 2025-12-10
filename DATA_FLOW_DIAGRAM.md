# Total Amount Flow Diagram

## Before Fix ❌
```
┌──────────────┐
│ OrderForm    │
│ calculateTotalAmount() = ₦50,000
└──────┬───────┘
       │
       │ (Not Stored!)
       │
       ▼
┌──────────────────────┐
│ CheckoutDetails      │
│ Recalculate from cart│
│ = ₦35,000           │
│ (WRONG!)             │
└──────────────────────┘
```

## After Fix ✅
```
┌─────────────────────────────────────────┐
│           OrderForm                     │
│                                         │
│  calculateTotalAmount()                 │
│         ↓                               │
│  ₦50,000                                │
│         ↓                               │
│  updateBookingDetails({                 │
│    calculatedTotalAmount: 50000 ← NEW! │
│  })                                     │
└─────────┬───────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│        Zustand Store                    │
│                                         │
│  bookingStore {                         │
│    calculatedTotalAmount: 50000         │
│    bookingPayload: {...}                │
│    recipientDetails: {...}              │
│    ... other fields ...                 │
│  }                                      │
│                                         │
│  Persisted to localStorage ↔            │
└─────────┬───────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│      CheckoutDetails                    │
│                                         │
│  Extract: { calculatedTotalAmount }     │
│           ↓                             │
│         ₦50,000 ← Use stored value!    │
│           ↓                             │
│  Payment Calculation: ₦50,000           │
│  Display Amount: ₦50,000                │
│  Payment Auth: ₦50,000                  │
│                                         │
│  ALL CONSISTENT ✅                      │
└─────────────────────────────────────────┘
```

## Data Structure Changes

### BookingStore Interface
```typescript
interface BookingDetails {
  // ... existing fields ...
  
  // NEW FIELD:
  calculatedTotalAmount?: number;
  // Stores the total calculated in OrderForm
  // Persisted to localStorage
  // Used to maintain consistency across pages
}
```

## Calculation Flow in OrderForm

```
User Input
    ↓
+--────────────────────────────────────+
│  calculateTotalAmount()              │
│  Returns: number                     │
+──────────────────────────────────────+
│                                      │
│  Logic:                              │
│  if (bookingType === 'public')       │
│    return cartTotal × bookings × recs│
│  else if (bookingType === 'others')  │
│    return cartTotal × recs × bookings│
│  else                                │
│    return cartTotal × bookings       │
│                                      │
+──────────────────────────────────────+
    ↓
  ₦50,000 (or appropriate amount)
    ↓
setBookingPayload()
    ↓
updateBookingDetails({ 
  calculatedTotalAmount: ₦50,000 
})
    ↓
Zustand Store
```

## Fallback Logic in CheckoutDetails

```
Decision Tree for Total Amount:

    Is calculatedTotalAmount > 0?
           │
      ┌────┴────┐
      │         │
     YES       NO
      │         │
      ↓         ↓
   Use it    Is totalInSmallestUnit > 0?
             │
        ┌────┴────┐
       YES       NO
        │         │
        ↓         ↓
    Use it    Use totalDisplayAmount


Result: totalAmountValue
    ↓
Normalize: Number(totalAmountValue.toFixed(2))
    ↓
Use in payment: normalizedTotalAmount
```

## localStorage Persistence

```
Before Navigation:
┌──────────────────────┐
│  Window Storage      │
│  localStorage:       │
│  'booking-storage'   │
│  {                   │
│    bookingId: "...", │
│    bookingType: "...",
│    ... fields ...    │
│    calculated        │ ← NEW: Persisted!
│    TotalAmount: 50000
│  }                   │
└──────────────────────┘

After Page Refresh:
Zustand automatically restores from localStorage
calculatedTotalAmount: 50000 ← Still available!
```

## Page Refresh Scenario

```
1. User in OrderForm
   ↓
   calculatedTotalAmount: ₦50,000 stored
   ↓
2. Click "Go to Checkout" → Navigate
   ↓
   Zustand restores from localStorage
   ↓
3. Page refreshes accidentally
   ↓
   Zustand STILL has calculatedTotalAmount: ₦50,000
   ↓
4. CheckoutDetails loads
   ↓
   Uses persisted calculated amount ✅
   No data loss!
```

## Payment Success Cleanup

```
Payment Successful
    ↓
clearBookingData()
    ↓
updateBookingDetails({
  bookingId: undefined,
  recipientDetails: undefined,
  deliveryDate: undefined,
  ... all fields ...
  calculatedTotalAmount: undefined  ← NEW: Also cleared!
})
    ↓
Zustand store reset
    ↓
Cart cleared
    ↓
User ready for new booking
```
