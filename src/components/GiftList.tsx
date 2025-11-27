import React from "react";
import {
  Plus,
  Gift,
  MoreHorizontal,
  Calendar,
  Edit3,
  Trash2,
} from "lucide-react";
// import Button from "@/components/Button";
import Heading from "./Heading";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type {
  GiftItem,
  GiftListConfig,
  EmptyStateConfig,
} from "@/types/sponsor";
// import {diffInSeconds} from "@/utils/diffInSeconds";
interface GiftActionItem {
  icon: React.ReactNode;
  label: string;
  onClick: (item: GiftItem) => void;
  variant?: "default" | "danger";
  show?: (item: GiftItem) => boolean;
}

interface GiftListProps {
  items: GiftItem[];
  config: GiftListConfig;
  emptyState?: EmptyStateConfig;
  className?: string;
  itemClassName?: string;
  onItemClick?: (item: GiftItem) => void;
  showActions?: boolean;
  actions?: GiftActionItem[];
  onEditGift?: (item: GiftItem) => void;
  onDeleteGift?: (item: GiftItem) => void;
  showTimeAgo?: boolean;
}

// Simple time ago utility (no third-party lib)
function getTimeAgo(dateInput: string | number | Date | undefined): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (isNaN(seconds) || seconds < 0) return "";
  if (seconds < 60) return "just now";
  const intervals: [number, string][] = [
    [60, "minute"],
    [60 * 60, "hour"],
    [60 * 60 * 24, "day"],
    [60 * 60 * 24 * 7, "week"],
    [60 * 60 * 24 * 30, "month"],
    [60 * 60 * 24 * 365, "year"],
  ];
  let value = seconds;
  let unit = "second";
  for (let i = 0; i < intervals.length; i++) {
    if (seconds < intervals[i][0]) break;
    value = Math.floor(seconds / intervals[i][0]);
    unit = intervals[i][1];
  }
  return `${value} ${unit}${value !== 1 ? "s" : ""} ago`;
}

const GiftList: React.FC<GiftListProps> = ({
  items,
  config,
  emptyState,
  className = "my-2",
  itemClassName = "",
  onItemClick,
  showActions = false,
  actions = [],
  onEditGift,
  onDeleteGift,
  showTimeAgo = false,
}) => {
  const defaultActions: GiftActionItem[] = [
    {
      icon: <Calendar className="h-4 w-4" />,
      label: "View Details",
      onClick: (item) => onItemClick?.(item),
      show: () => !!onItemClick,
    },
    {
      icon: <Edit3 className="h-4 w-4" />,
      label: "Edit Gift",
      onClick: (item) => onEditGift?.(item),
      show: () => !!onEditGift,
    },
    {
      icon: <Trash2 className="h-4 w-4" />,
      label: "Delete Gift",
      onClick: (item) => onDeleteGift?.(item),
      variant: "danger" as const,
      show: () => !!onDeleteGift,
    },
  ];

  const displayActions = actions.length > 0 ? actions : defaultActions;
  return (
    <section className={className}>
      {/* Header Section */}
      <div className="max-w-7xl mx-auto flex justify-between items-center my-[10px]">
        <Heading
          link={config.link}
          title={config.title}
          CTA={config.ctaText}
          status={items.length > 0}
          handleClick={config.onCtaClick}
        />
      </div>

      {/* Content Section */}
      {items.length > 0 ? (
        <div className="max-w-7xl mx-auto bg-[#F8F8F8] rounded-xl  relative">
          {items.map((item, index: number) => {
            return (
              <div key={index} className="relative">
                <div
                  className={`flex items-center p-4 hover:bg-gray-50 transition-colors border-b border-black md:border-0 justify-between cursor-pointer ${itemClassName}`}
                  onClick={() => onItemClick?.(item)}
                >
                  <img
                    src={item.image}
                    alt={`Gift item ${item.id}`}
                    className="rounded-full w-14 h-14 object-cover shadow"
                  />
                  <div className="ml-4 flex-1 min-w-0">
                    <h3 className="text-base font-medium text-gray-900 truncate">
                      {item.description}
                    </h3>
                    <p className="text-sm w-fit text-pretty  text-gray-600 truncate mt-1">
                      {item.reason}
                    </p>

                    <div className="flex items-center mt-1 gap-3 w-fit">
                      <span className="text-xs text-gray-500 text-pretty w-full truncate">
                        {item.bookedBy}
                      </span>

                     
                    </div>
                    {showTimeAgo && (
                      <p className="text-xs text-gray-400 mt-1">
                        {/* Try all possible date fields in order of priority */}
                        {getTimeAgo(
                          item.bookingData?.bookedAt ||
                            item.bookingData?.updatedAt ||
                            item.bookingData?.createdAt
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 !relative flex-col ml-2">
                    <div className="flex items-center gap-1 !relative ">
                      <Gift
                      className={`text-sm font-medium ${
                        item.statusText === "Paid"
                          ? "text-[#34C759]"
                          : item.statusText === "Used"
                          ? "text-[#34C759]"
                          : item.statusText === "Refund"
                          ? "text-[#FF9500]"
                          : item.statusText === "Active"
                          ? "text-[#34C759]" // Green for active
                          : item.statusText === "Expired"
                          ? "text-[#FF3B30]"
                          : item.statusText === "Cancelled"
                          ? "text-[#8E8E93]"
                          : item.statusText === "Unused"
                          ? "text-[#FFCE6D]"
                          : item.statusText === "claimed"
                          ? "text-[#34C759]"
                          : "text-[#FF9500]"
                      }`}
                    />

                    {/* Actions Menu */}
                    {showActions && (
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger
                          asChild
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <button
                            className="p-1 hover:bg-gray-100 rounded-full"
                            aria-label="More options"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            className="bg-white border border-gray-200 rounded-lg shadow-lg p-1 min-w-[140px] z-50"
                            sideOffset={0}
                            side="bottom"
                            avoidCollisions={true}
                            collisionPadding={5}
                            align="start"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            {displayActions
                              .filter(
                                (action) => !action.show || action.show(item)
                              )
                              .map((action, index) => (
                                <DropdownMenu.Item
                                  key={index}
                                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm cursor-pointer rounded-md outline-none data-[highlighted]:bg-gray-100 ${
                                    action.variant === "danger"
                                      ? "text-red-600 data-[highlighted]:bg-red-50"
                                      : "text-gray-700"
                                  }`}
                                  onSelect={() => action.onClick(item)}
                                >
                                  {action.icon}
                                  {action.label}
                                </DropdownMenu.Item>
                              ))}
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    )}
                    </div>
                    {/* Status Text */}
                    <div
                       className={` text-sm font-medium w-full text-pretty self-end flex ${
                         item.statusText === "Paid"
                           ? "text-[#34C759]" // Green for paid
                           : item.statusText === "Used"
                           ? "text-[#34C759]" // Green for used
                           : item.statusText === "Active"
                           ? "text-[#34C759]" // Green for active
                           : item.statusText === "Refund"
                           ? "text-[#FF9500]" // Orange for refund
                           : item.statusText === "Expired"
                           ? "text-[#FF3B30]" // Red for expired
                           : item.statusText === "Cancelled"
                           ? "text-[#8E8E93]" // Gray for cancelled
                           : item.statusText === "Unused"
                           ? "text-[#FFCE6D]"
                           : item.statusText === "claimed"
                           ? "text-[#34C759]" // Green for claimed
                           : "text-[#FF9500]" // Default yellow
                       }`}
                     >
                       {item.statusText}
                     </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        emptyState && (
          <div className="container mx-auto">
            <div className="relative h-[280px] md:h-[350px] rounded-xl overflow-hidden">
              <img
                src={emptyState.heroImage}
                alt="Empty state"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-primary/0 to-primary flex flex-col items-center justify-end pb-10 md:pb-16 px-6 text-center h-full bottom-20">
                <h2 className="text-white text-xl md:text-3xl font-medium font-mf my-4 max-w-lg tracking-tight">
                  {emptyState.title}
                </h2>
                <button
                  className="bg-white hover:bg-gray-50 text-primary rounded-full px-6 py-3 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                  onClick={emptyState.buttonAction}
                >
                  <Plus size={18} />
                  <span className="font-medium">{emptyState.buttonText}</span>
                </button>
              </div>
            </div>
          </div>
        )
      )}
    </section>
  );
};

export default GiftList;
