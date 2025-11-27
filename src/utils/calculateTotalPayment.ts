
// Service Fee
const DEFAULT_SERVICE_FEE_PERCENT = Number(
  import.meta.env.VITE_BOOKING_SERVICE_FEE_PERCENT ?? "0"
);
// VAT
const VAT_PERCENT = Number(import.meta.env.VITE_BOOKING_VAT_PERCENT ?? "1.5");

// New simplified percentages (based on your example)
const BOOOKBOX_CHARGE_PERCENT = Number(
  import.meta.env.VITE_BOOKING_BOOOKBOX_CHARGE_PERCENT ?? "10"
); // ₦5000 → ₦500 = 10%

const PAYSTACK_CHARGE_PERCENT = Number(
  import.meta.env.VITE_BOOKING_PAYSTACK_CHARGE_PERCENT ?? "5"
); // ₦5000 → ₦250 = 5%

const GATEWAY_OFFSET = Number(
  import.meta.env.VITE_BOOKING_GATEWAY_OFFSET ?? "2.70"
); //  'offset'

const DEFAULT_TAX_AMOUNT = Number(
  import.meta.env.VITE_BOOKING_TAX ?? "0"
); //  parseFloat(tax)


const roundCurrency = (value: number) => Number(value.toFixed(2));

export type ServiceFeeOptions = {
  serviceFeePercent?: number;
  decimalPlaces?: number;
};

export const calculateServiceFee = (
  mealPrice: number,
  deliveryFee = 0,
  options?: ServiceFeeOptions
) => {
  const base = mealPrice + deliveryFee;
  if (base <= 0) return 0;

  const percent = options?.serviceFeePercent ?? DEFAULT_SERVICE_FEE_PERCENT;
  const decimalPlaces = options?.decimalPlaces ?? 2;

  const fee = (base * percent) / 100;
  return Number(fee.toFixed(decimalPlaces));
};

// ============================
// MAIN CALCULATION (MATCHES BACKEND EXACTLY)
// ============================

export type PaymentBreakdown = {
  mealPrice: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  vat: number;
  offset: number;
  mealBooking: number; // NEW: This is the base meal amount
  boookboxCharge: number;
  restaurantAmount: number;
  paystackCharge: number; // NEW: Renamed from gatewayCharge for clarity
  totalAmount: number; // NEW: meal_booking + paystack_charge
  transactionFee: number; // NEW: total_amount - restaurant_amount
  // Legacy fields for backward compatibility
  gatewayCharge: number;
  totalBeforeGateway: number;
  totalBeforeGatewayWithVat: number;
  totalPayable: number;
  totalPayableWithVat: number;
  totalPayableInSmallestUnit: number;
  transactionCharge: number;
};

export type CalculateTotalPaymentOptions = {
  toSmallestUnit?: boolean;
  serviceFeePercent?: number;
  gatewayOffset?: number;
};


export const calculatePaymentBreakdown = (
  mealPrice: number,
  deliveryFee: number,
  tax: number,
  serviceFee: number,
  options?: CalculateTotalPaymentOptions
): PaymentBreakdown => {
  
  // Calculate service fee if not provided
  const resolvedServiceFee = serviceFee > 0 
    ? serviceFee 
    : calculateServiceFee(mealPrice);

  const offset = options?.gatewayOffset ?? GATEWAY_OFFSET;

  // ============================
  // NEW SIMPLIFIED CALCULATION (MATCHES YOUR EXAMPLE)
  // ============================
  
  const mealBooking = mealPrice; // The base meal price
  const boookboxCharge = roundCurrency((mealBooking * BOOOKBOX_CHARGE_PERCENT) / 100);
  const restaurantAmount = roundCurrency(mealBooking - boookboxCharge);
  const paystackCharge = roundCurrency((mealBooking * PAYSTACK_CHARGE_PERCENT) / 100);
  // Apply tax based on meal amount - ₦50 if over ₦10,000
  const calculatedTax = mealBooking > 10000 ? 50 : tax;
  const totalAmount = roundCurrency(mealBooking);
  const transactionFee = roundCurrency(totalAmount - restaurantAmount);
  const vat = VAT_PERCENT > 0 ? roundCurrency(mealBooking * (VAT_PERCENT / 100)) : 0;

  return {
    // New clear variables
    mealBooking: roundCurrency(mealBooking),
    boookboxCharge: roundCurrency(boookboxCharge),
    restaurantAmount: roundCurrency(restaurantAmount),
    paystackCharge: roundCurrency(paystackCharge),
    totalAmount: roundCurrency(totalAmount), 
    transactionFee: roundCurrency(transactionFee),
    
    // Input values
    mealPrice: roundCurrency(mealPrice),
    deliveryFee: roundCurrency(deliveryFee),
    serviceFee: roundCurrency(resolvedServiceFee),
    tax: roundCurrency(calculatedTax),
    vat,
    offset: roundCurrency(offset),
    
    // Legacy fields for backward compatibility
    gatewayCharge: roundCurrency(paystackCharge), // Same as paystackCharge
    totalBeforeGateway: roundCurrency(mealBooking),
    totalBeforeGatewayWithVat: roundCurrency(mealBooking + vat),
    totalPayable: roundCurrency(totalAmount + tax), // Same as totalAmount
    totalPayableWithVat: roundCurrency(totalAmount + vat),
    totalPayableInSmallestUnit: Math.round(totalAmount * 100), // Goes to Paystack
    transactionCharge: roundCurrency(transactionFee), // Same as transactionFee
  };
};

/**
 * SIMPLIFIED TOTAL PAYMENT CALCULATION
 */
export function calculateTotalPayment(
  mealPrice: number,
  deliveryFee: number,
  tax: number,
  serviceFee: number,
  options?: CalculateTotalPaymentOptions
): number {
  const breakdown = calculatePaymentBreakdown(mealPrice, deliveryFee, tax, serviceFee, options);
  
  if (options?.toSmallestUnit) {
    return breakdown.totalPayableInSmallestUnit;
  }
  
  return breakdown.totalPayable;
}

// ============================
// GETTER FUNCTIONS FOR CONSTANTS
// ============================

export const getDefaultServiceFeePercent = () => DEFAULT_SERVICE_FEE_PERCENT;
export const getDefaultTaxAmount = () => DEFAULT_TAX_AMOUNT;
export const getVatPercent = () => VAT_PERCENT;




