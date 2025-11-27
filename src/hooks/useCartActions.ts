import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { useToast } from "@/hooks/useToast";

export type CartItemData = {
  mealId: string;
  restaurantId: string;
  restaurantName?: string;
  mealName: string;
  mealImage?: string;
  quantity: number;
  pricePerUnit: number;
  choices: {
    foodChoice: string[];
    toppingChoice: string[];
    proteinChoice: string[];
  };
  userInstruction?: string;
};

export const useCartActions = () => {
  const {
    addItemWithRestaurantCheck,
    switchRestaurant,
    getCurrentRestaurantId,
    items,
  } = useCartStore();
  const { toast } = useToast();
  const [pendingItem, setPendingItem] = useState<CartItemData | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  const addItemToCart = async (itemData: CartItemData): Promise<boolean> => {
    const result = addItemWithRestaurantCheck(itemData);

    if (result === "added") {
      toast({
        title: "Item Added",
        description: `${itemData.mealName} has been added to your cart.`,
        variant: "success",
      });
      return true;
    } else if (result === "conflict") {
      // Store pending item and show dialog
      setPendingItem(itemData);
      setShowConflictDialog(true);
      return false; // Will be handled by dialog actions
    }

    return false;
  };

  const handleReplaceCart = () => {
    if (pendingItem) {
      switchRestaurant(pendingItem);
      toast({
        title: "Cart Replaced",
        description: `Your cart has been updated with items from ${
          pendingItem.restaurantName || "the new restaurant"
        }.`,
        variant: "success",
      });
      setPendingItem(null);
    }
  };

  const handleKeepCurrentCart = () => {
    toast({
      title: "Item Not Added",
      description: "Item was not added to maintain single restaurant ordering.",
      variant: "info",
    });
    setPendingItem(null);
  };

  const getCurrentRestaurant = () => {
    return getCurrentRestaurantId();
  };

  const getCurrentRestaurantName = () => {
    return items[0]?.restaurantName || "another restaurant";
  };

  const closeConflictDialog = () => {
    setShowConflictDialog(false);
    setPendingItem(null);
  };

  return {
    addItemToCart,
    getCurrentRestaurant,
    getCurrentRestaurantName,
    // Dialog state and handlers
    showConflictDialog,
    pendingItem,
    handleReplaceCart,
    handleKeepCurrentCart,
    closeConflictDialog,
  };
};
