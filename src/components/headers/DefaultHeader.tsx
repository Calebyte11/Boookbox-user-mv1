import React from "react";
import HeaderPageNav from "@/components/HeaderPageNav";
import type { DefaultHeaderProps } from "./types";

const DefaultHeader: React.FC<DefaultHeaderProps> = ({
  title = "",
  showSearch = false,
  searchPlaceholder = "Search",
  onSearchChange,
}) => {
  return (
    <HeaderPageNav
      title={title}
      showSearch={showSearch}
      searchPlaceholder={searchPlaceholder}
      onSearchChange={onSearchChange}
    />
  );
};

export default DefaultHeader;
