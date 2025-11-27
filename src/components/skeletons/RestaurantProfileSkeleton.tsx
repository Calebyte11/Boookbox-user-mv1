import React from "react";
import { ChevronLeft, Heart, Search } from "lucide-react";
import Button from "@/components/Button";
import Skeleton from "@/components/ui/Skeleton";
import NotchAreaHeader from "@/components/NotchAreaHeader";

const RestaurantProfileSkeleton: React.FC = () => {
  return (
    <div className="relative font-roboto">
      {/* Hero Image Skeleton */}
      <NotchAreaHeader
        imageUrl={""}
        imageAlt=" ..."
        className="hidden md:block"
      >
        <div className="md:flex justify-between mt-5 hidden ">
          <Button className="p-4 bg-white rounded-xl">
            <ChevronLeft className="w-[24px]" />
          </Button>
          <Button className="p-4 bg-white rounded-xl">
            <Heart className="w-[24px]" />
          </Button>
        </div>
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      </NotchAreaHeader>

      {/* Restaurant Info Skeleton */}
      <div className="px-4 py-6 flex flex-col">
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-10 w-64 mb-4" />
        </div>

        <div className="flex items-center gap-2 py-2 mb-4">
          <Skeleton variant="circular" className="h-5 w-5" />
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-32" />
        </div>

        <Skeleton className="h-6 w-20 mb-6" />

        <div className="flex gap-3 w-full justify-start">
          <Skeleton className="h-12 w-40 rounded-full" />
          <Skeleton className="h-12 w-40 rounded-full" />
        </div>
      </div>

      {/* Search Skeleton */}
      <div className="px-4 py-2">
        <div className="relative">
          <Skeleton className="w-full h-14 rounded-full" />
          <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-300" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="px-4 pt-4">
        <div className="flex border-b border-gray-300 bg-[#FEF7FF] justify-evenly">
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-12 w-28" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="px-4 py-4">
        <Skeleton className="h-8 w-40 mb-4" />

        {/* Menu Items Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex gap-4 p-4 bg-[#F8F8F8] border border-[#EADDFF] rounded-lg h-32"
            >
              <div className="flex flex-col justify-between flex-1">
                <div>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-24 mb-3" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="w-24 h-full rounded-r-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RestaurantProfileSkeleton;
