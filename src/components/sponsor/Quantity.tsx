import Button from "@/components/Button";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

type QuantityTypes = {
  itemId: string; // Added itemId to identify the cart item
  quantity: number; // This should be the quantity from the cart store
  deleteIcon?: boolean;
  onDelete?: () => void; // Kept for explicit delete action
  // onIncrement, onDecrement, onQuantityChange are removed as store is updated directly
};

const Quantity = ({
  itemId, // Use itemId
  quantity,
  // onDelete,
  deleteIcon,
}: QuantityTypes) => {
  // Ensure quantity is always at least 1 to prevent crashes
  const safeQuantity = Math.max(1, quantity || 1);

  // Get the action from the store
  const updateItemQuantityInStore = useCartStore(
    (state) => state.updateItemQuantity
  );
  const incrementQuantity = () => {
    updateItemQuantityInStore(itemId, safeQuantity + 1);
  };
  const decrementQuantity = () => {
    // Prevent decrementing below 1 unless it's a delete action
    if (!deleteIcon && safeQuantity <= 1) {
      return;
    }
    // The store's updateItemQuantity handles removal if newQuantity <= 0.
    updateItemQuantityInStore(itemId, safeQuantity - 1);
  };
  const handleQuantityInputChange = (
    event: React.FormEvent<HTMLSpanElement>
  ) => {
    const currentSpan = event.currentTarget;
    const newText = currentSpan.textContent || "";

    if (newText === "") {
      // If input is cleared, reset to 1 instead of 0 to prevent crashes
      updateItemQuantityInStore(itemId, 1);
      currentSpan.textContent = "1";
      return;
    }

    const newQuantity = parseInt(newText, 10);

    if (!isNaN(newQuantity)) {
      if (newQuantity <= 0) {
        // Don't allow quantities less than 1 through manual input
        updateItemQuantityInStore(itemId, 1);
        currentSpan.textContent = "1";
      } else {
        // Valid number greater than 0, update the store
        updateItemQuantityInStore(itemId, newQuantity);
      }
    } else {
      // Invalid input (e.g., text)
      // Reset the span's text to the current safe quantity.
      currentSpan.textContent = safeQuantity.toString();
    }
  };

  return (
    <div className="inline-flex p-3 border gap-3 py-2 rounded-full">
      <Button
        type="button"
        onClick={decrementQuantity}
        disabled={!deleteIcon && safeQuantity <= 1} // Prevents decrementing to 0 via button if not deleteIcon
        className={`${
          !deleteIcon && safeQuantity <= 1
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
