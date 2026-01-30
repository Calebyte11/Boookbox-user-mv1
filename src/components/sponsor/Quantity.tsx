// import Button from "@/components/Button";
// import { Minus, Plus, Trash2 } from "lucide-react";
// import { useCartStore } from "@/store/cartStore";

// type QuantityTypes = {
//   itemId: string; // Added itemId to identify the cart item
//   quantity: number; // This should be the quantity from the cart store
//   deleteIcon?: boolean;
//   onDelete?: () => void; // Kept for explicit delete action
//   minimumCampaignOrder?: number; // Minimum quantity for campaign orders
//   // onIncrement, onDecrement, onQuantityChange are removed as store is updated directly
// };

// const Quantity = ({
//   itemId, // Use itemId
//   quantity,
//   // onDelete,
//   deleteIcon,
//   minimumCampaignOrder,
// }: QuantityTypes) => {
//   // Ensure quantity is always at least 1 to prevent crashes
//   const safeQuantity = Math.max(1, quantity || 1);
  
//   // Determine the minimum allowed quantity (1 or campaign minimum)
//   const minAllowedQuantity = minimumCampaignOrder || 1;

//   // Get the action from the store
//   const updateItemQuantityInStore = useCartStore(
//     (state) => state.updateItemQuantity
//   );
//   const incrementQuantity = () => {
//     updateItemQuantityInStore(itemId, safeQuantity + 1);
//   };
//   const decrementQuantity = () => {

//     console.log(minimumCampaignOrder);
    
//     // Prevent decrementing below the minimum allowed quantity unless it's a delete action
//     if (!deleteIcon && safeQuantity <= minAllowedQuantity) {
//       return;
//     }
//     // The store's updateItemQuantity handles removal if newQuantity <= 0.
//     updateItemQuantityInStore(itemId, safeQuantity - 1);
//   };
//   const handleQuantityInputChange = (
//     event: React.FormEvent<HTMLSpanElement>
//   ) => {
//     const currentSpan = event.currentTarget;
//     const newText = currentSpan.textContent || "";

//     if (newText === "") {
//       // If input is cleared, reset to minAllowedQuantity to prevent crashes
//       updateItemQuantityInStore(itemId, minAllowedQuantity);
//       currentSpan.textContent = minAllowedQuantity.toString();
//       return;
//     }

//     const newQuantity = parseInt(newText, 10);

//     if (!isNaN(newQuantity)) {
//       if (newQuantity < minAllowedQuantity) {
//         // Don't allow quantities less than minAllowedQuantity through manual input
//         updateItemQuantityInStore(itemId, minAllowedQuantity);
//         currentSpan.textContent = minAllowedQuantity.toString();
//       } else {
//         // Valid number greater than or equal to minAllowedQuantity, update the store
//         updateItemQuantityInStore(itemId, newQuantity);
//       }
//     } else {
//       // Invalid input (e.g., text)
//       // Reset the span's text to the current safe quantity.
//       currentSpan.textContent = safeQuantity.toString();
//     }
//   };

//   return (
//     <div className="inline-flex p-3 border gap-3 py-2 rounded-full">
//       <Button
//         type="button"
//         onClick={decrementQuantity}
//         disabled={!deleteIcon && safeQuantity <= 1} // Prevents decrementing to 0 via button if not deleteIcon
//         className={`${
//           !deleteIcon && safeQuantity <= 1
//             ? "opacity-50 cursor-not-allowed"
//             : ""
//         }`}
//       >
//         {deleteIcon ? <Trash2 /> : <Minus />}
//       </Button>
//       <span
//         className="min-w-[20px] text-center"
//         contentEditable
//         suppressContentEditableWarning
//         onInput={handleQuantityInputChange}
//         key={safeQuantity}
//       >
//         {safeQuantity}
//       </span>
//       <Button type="button" onClick={incrementQuantity}>
//         <Plus />
//       </Button>
//     </div>
//   );
// };

// export default Quantity;

import Button from "@/components/Button";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useEffect } from "react";

type QuantityTypes = {
  itemId: string;
  quantity: number;
  deleteIcon?: boolean;
  onDelete?: () => void;
  minimumCampaignOrder?: number;
};

const Quantity = ({
  itemId,
  quantity,
  deleteIcon,
  minimumCampaignOrder,
}: QuantityTypes) => {
  // Determine the minimum allowed quantity (campaign minimum or 1)
  const minAllowedQuantity = minimumCampaignOrder || 1;
  
  // Ensure quantity is always at least the minimum allowed
  const safeQuantity = Math.max(minAllowedQuantity, quantity || minAllowedQuantity);

  // Get the action from the store
  const updateItemQuantityInStore = useCartStore(
    (state) => state.updateItemQuantity
  );

  // Ensure quantity in store is never below minimum on mount/update
  useEffect(() => {
    if (quantity < minAllowedQuantity) {
      console.log(`Correcting quantity from ${quantity} to ${minAllowedQuantity}`);
      updateItemQuantityInStore(itemId, minAllowedQuantity);
    }
  }, [quantity, minAllowedQuantity, itemId, updateItemQuantityInStore]);

  const incrementQuantity = () => {
    const newQuantity = safeQuantity + 1;
    console.log(`Incrementing to: ${newQuantity}`);
    updateItemQuantityInStore(itemId, newQuantity);
  };

  const decrementQuantity = () => {
    console.log(`Current: ${safeQuantity}, Min: ${minAllowedQuantity}`);
    
    // If deleteIcon is present, allow removal (quantity can go to 0)
    if (deleteIcon) {
      const newQuantity = safeQuantity - 1;
      console.log(`Decrementing (with delete) to: ${newQuantity}`);
      updateItemQuantityInStore(itemId, newQuantity);
      return;
    }
    
    // Otherwise, only decrement if current quantity is GREATER than minAllowedQuantity
    if (safeQuantity > minAllowedQuantity) {
      const newQuantity = safeQuantity - 1;
      console.log(`Decrementing to: ${newQuantity}`);
      updateItemQuantityInStore(itemId, newQuantity);
    } else {
      console.log(`Cannot decrement below minimum: ${minAllowedQuantity}`);
    }
  };

  const handleQuantityInputChange = (
    event: React.FormEvent<HTMLSpanElement>
  ) => {
    const currentSpan = event.currentTarget;
    const newText = currentSpan.textContent || "";

    if (newText === "") {
      // If input is cleared, reset to minAllowedQuantity
      updateItemQuantityInStore(itemId, minAllowedQuantity);
      currentSpan.textContent = minAllowedQuantity.toString();
      return;
    }

    const newQuantity = parseInt(newText, 10);

    if (!isNaN(newQuantity)) {
      if (newQuantity < minAllowedQuantity) {
        // Don't allow quantities less than minAllowedQuantity through manual input
        console.log(`Input ${newQuantity} is below minimum, setting to ${minAllowedQuantity}`);
        updateItemQuantityInStore(itemId, minAllowedQuantity);
        currentSpan.textContent = minAllowedQuantity.toString();
      } else {
        // Valid number greater than or equal to minAllowedQuantity
        updateItemQuantityInStore(itemId, newQuantity);
      }
    } else {
      // Invalid input (e.g., text) - reset to current safe quantity
      currentSpan.textContent = safeQuantity.toString();
    }
  };

  return (
    <div className="inline-flex p-3 border gap-3 py-2 rounded-full">
      <Button
        type="button"
        onClick={decrementQuantity}
        disabled={!deleteIcon && safeQuantity <= minAllowedQuantity}
        className={`${
          !deleteIcon && safeQuantity <= minAllowedQuantity
            ? "opacity-50 cursor-not-allowed"
            : ""
        }`}
      >
        {deleteIcon ? <Trash2 /> : <Minus />}
      </Button>
      <span
        className="min-w-[20px] text-center"
        contentEditable
        suppressContentEditableWarning
        onInput={handleQuantityInputChange}
        key={safeQuantity}
      >
        {safeQuantity}
      </span>
      <Button type="button" onClick={incrementQuantity}>
        <Plus />
      </Button>
    </div>
  );
};

export default Quantity;