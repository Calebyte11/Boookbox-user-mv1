import React from "react";
import DefaultHeader from "./DefaultHeader";
import RestaurantHeader from "./RestaurantHeader";
import SimpleHeader from "./SimpleHeader";
import type { 
  HeaderType, 
  DefaultHeaderProps, 
  RestaurantHeaderProps, 
  SimpleHeaderProps 
} from "./types";

interface HeaderFactoryProps {
  type: HeaderType;
  props: DefaultHeaderProps | RestaurantHeaderProps | SimpleHeaderProps;
}

/**
 * Factory component that renders the appropriate header based on type
 * This replaces the complex switch statement in HeaderPageLayout
 */
export const HeaderFactory: React.FC<HeaderFactoryProps> = ({ type, props }) => {
  switch (type) {
    case "restaurant":
      return <RestaurantHeader {...(props as RestaurantHeaderProps)} />;
    case "simple":
      return <SimpleHeader {...(props as SimpleHeaderProps)} />;
    case "profile":
      // TODO: Implement ProfileHeader
      return <DefaultHeader {...(props as DefaultHeaderProps)} />;
    case "meal":
      // TODO: Implement MealHeader
      return <DefaultHeader {...(props as DefaultHeaderProps)} />;
    case "default":
    default:
      return <DefaultHeader {...(props as DefaultHeaderProps)} />;
  }
};

export default HeaderFactory;
