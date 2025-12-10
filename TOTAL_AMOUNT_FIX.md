# Total Amount Mismatch Fix - OrderForm to CheckoutDetails

## Problem
The calculated total amount in `OrderForm.tsx` was not persisting when navigating to `CheckoutDetails.tsx`. The total would differ because:

1. **OrderForm** calculates the total with special logic based on booking type and number of recipients:
   - Public bookings: `cartTotal × numberOfBookings × numberOfRecipients`
   - Multiple recipients: `cartTotal × numberOfRecipients × numberOfBookings`
   - Single recipient: `cartTotal × numberOfBookings`

2. **CheckoutDetails** was recalculating the total from scratch using `NewBookingPricing` component, which only multiplied by recipients for public bookings, missing the other multiplications.

## Solution
Implemented a proper data flow for the calculated total amount:

### 1. Updated Booking Store (`src/store/bookingStore.ts`)
- Added `calculatedTotalAmount?: number` field to `BookingDetails` interface
- Initialize it as `undefined` in the initial state
- Include it in the `partialize` function for localStorage persistence

### 2. Updated OrderForm (`src/components/sponsor/OrderForm.tsx`)
- When submitting the booking form, now stores the calculated total:
  ```typescript
  updateBookingDetails({
    // ... other fields
    calculatedTotalAmount: calculateTotalAmount(),
  });
  ```

### 3. Updated CheckoutDetails (`src/pages/CheckoutDetails.tsx`)
- Extract `calculatedTotalAmount` from booking store
- Use it as the primary source for total amount calculation:
  ```typescript
  const totalAmountValue =
    calculatedTotalAmount && calculatedTotalAmount > 0
      ? calculatedTotalAmount
      : typeof totalInSmallestUnit === "number" && totalInSmallestUnit > 0
      ? totalInSmallestUnit / 100
      : totalDisplayAmount;
  ```
- Added fallback logic to use computed breakdown if stored value is not available
- Clear `calculatedTotalAmount` when clearing booking data after successful payment
- Added debug logging to track when stored calculated total is being used

## Data Flow
```
OrderForm
  ↓
  calculateTotalAmount()
  ↓
  updateBookingDetails({ calculatedTotalAmount })
  ↓
  Zustand Store (persisted to localStorage)
  ↓
  Navigate to CheckoutDetails
  ↓
  Extract calculatedTotalAmount from store
  ↓
  Use it for payment calculation & display
```

## Benefits
✅ Total amount remains consistent across navigation  
✅ Respects all booking type multiplications from OrderForm  
✅ Fallback logic ensures compatibility if data isn't stored  
✅ Data persists even if page is refreshed during checkout  
✅ Debug logging helps track amount calculations  
✅ Proper cleanup after payment success  

## Testing
1. Create a booking with different booking types in OrderForm
2. Note the total amount displayed
3. Navigate to CheckoutDetails
4. Verify the total matches
5. Check browser console for debug logs confirming stored value is being used
