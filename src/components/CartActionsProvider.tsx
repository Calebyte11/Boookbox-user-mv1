import React from "react";
import RestaurantConflictDialog from "@/components/RestaurantConflictDialog";
import { useCartActions } from "@/hooks/useCartActions";

interface CartActionsProviderProps {
  children: React.ReactNode;
}

export const CartActionsProvider: React.FC<CartActionsProviderProps> = ({
  children,
}) => {
  const {
    showConflictDialog,
    pendingItem,
    handleReplaceCart,
    handleKeepCurrentCart,
    closeConflictDialog,
    getCurrentRestaurantName,
  } = useCartActions();

  return (
    <>
      {children}
      <RestaurantConflictDialog
        isOpen={showConflictDialog}
        onClose={closeConflictDialog}
        onReplace={handleReplaceCart}
        onCancel={handleKeepCurrentCart}
        currentRestaurantName={getCurrentRestaurantName()}
        newRestaurantName={pendingItem?.restaurantName}
        newItemName={pendingItem?.mealName || ""}
      />
    </>
  );
};

export default CartActionsProvider;
