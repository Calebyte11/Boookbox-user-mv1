export type HeaderType = "default" | "profile" | "restaurant" | "groceries" | "frozen-foods" | "wine-drinks" | "simple" | "meal";

// Base interface for all header components
export interface BaseHeaderProps {
  title?: string;
  onBackClick?: () => void;
}

// Specific header prop interfaces
export interface DefaultHeaderProps extends BaseHeaderProps {
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
}

export interface RestaurantHeaderProps extends BaseHeaderProps {
  restaurantId: string;
}

export interface ProfileHeaderProps extends BaseHeaderProps {
  // Profile-specific props (placeholder for future expansion)
  userId?: string;
}

export interface MealHeaderProps extends BaseHeaderProps {
  // Meal-specific props (placeholder for future expansion)
  mealId?: string;
}

export interface SimpleHeaderProps extends BaseHeaderProps {
  // Simple header with minimal configuration
  hideBackButton?: boolean;
}

// Union type for all header props
export type HeaderProps = 
  | DefaultHeaderProps 
  | RestaurantHeaderProps 
  | ProfileHeaderProps 
  | MealHeaderProps 
  | SimpleHeaderProps;
