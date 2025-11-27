import Skeleton from "@/components/ui/Skeleton";

// Card skeleton for gift items, tickets, etc.
export const CardSkeleton = () => (
  <div className="border-gray-300 border rounded-lg p-4 mb-4">
    <div className="flex gap-4">
      <Skeleton
        variant="rectangular"
        width={80}
        height={80}
        className="rounded-lg"
      />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" height={20} className="w-3/5" />
        <Skeleton variant="text" height={16} className="w-2/5" />
        <Skeleton variant="text" height={16} className="w-4/5" />
      </div>
    </div>
  </div>
);

// List skeleton for multiple items
export const ListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-4 ">
    {Array.from({ length: count }).map((_, index) => (
      <CardSkeleton key={index} />
    ))}
  </div>
);

// Profile skeleton
export const ProfileSkeleton = () => (
  <div className="p-4 space-y-6">
    {/* Header */}
    <div className="flex items-center gap-4">
      <Skeleton variant="circular" width={64} height={64} />
      <div className="space-y-2">
        <Skeleton variant="text" width={120} height={24} />
        <Skeleton variant="text" width={160} height={16} />
      </div>
    </div>

    {/* Menu items */}
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton variant="rectangular" width={24} height={24} />
          <Skeleton variant="text" width={140} height={20} />
        </div>
      ))}
    </div>
  </div>
);

// Meal details skeleton
export const MealDetailsSkeleton = () => (
  <div className="p-4 space-y-6">
    {/* Header */}
    <div className="flex items-center gap-4 mb-4">
      <Skeleton
        variant="rectangular"
        width={48}
        height={48}
        className="rounded-xl"
      />
      <Skeleton variant="text" width={150} height={24} />
    </div>

    {/* Image */}
    <Skeleton variant="rectangular" className="w-full h-48 rounded-lg" />

    {/* Content */}
    <div className="space-y-4">
      <Skeleton variant="text" className="w-4/5 h-7" />
      <Skeleton variant="text" className="w-3/5 h-5" />
      <div className="space-y-2">
        <Skeleton variant="text" className="w-full h-4" />
        <Skeleton variant="text" className="w-11/12 h-4" />
        <Skeleton variant="text" className="w-3/4 h-4" />
      </div>
    </div>

    {/* Restaurant info */}
    <div className="space-y-3">
      <Skeleton variant="text" className="w-2/5 h-5" />
      <div className="flex gap-2">
        <Skeleton
          variant="rectangular"
          width={80}
          height={80}
          className="rounded-xl"
        />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-3/5 h-5" />
          <Skeleton variant="text" className="w-4/5 h-4" />
          <Skeleton variant="text" className="w-1/2 h-4" />
        </div>
      </div>
    </div>

    {/* Action button */}
    <Skeleton variant="rectangular" className="w-full h-12 rounded-xl" />
  </div>
);

// Gifts page skeleton
export const GiftsSkeleton = () => (
  <div className="p-4 space-y-6">
    {/* Header */}
    <div className="flex items-center gap-4">
      <Skeleton
        variant="rectangular"
        width={48}
        height={48}
        className="rounded-xl"
      />
    </div>

    {/* Search bar */}
    <Skeleton variant="rectangular" className="w-full h-12 rounded-xl" />

    {/* Filter tabs */}
    <div className="flex gap-2 overflow-x-auto">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton
          key={index}
          variant="rectangular"
          width={80}
          height={36}
          className="rounded-lg"
        />
      ))}
    </div>

    {/* Gift cards */}
    <ListSkeleton count={4} />
  </div>
);

// Tickets page skeleton
export const TicketsSkeleton = () => (
  <div className="p-4 space-y-6">
    {/* Header */}
    <div className="flex items-center gap-4">
      <Skeleton
        variant="rectangular"
        width={48}
        height={48}
        className="rounded-xl"
      />
      <Skeleton variant="text" width={150} height={24} />
    </div>

    {/* Filter tabs */}
    <div className="flex gap-2 overflow-x-auto">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton
          key={index}
          variant="rectangular"
          width={70}
          height={36}
          className="rounded-lg"
        />
      ))}
    </div>

    {/* Ticket cards */}
    <ListSkeleton count={3} />
  </div>
);

// Home page skeleton
export const HomeSkeleton = () => (
  <div className="container mx-auto py-4">
    <div className="m-4">
      {/* Hero Carousel Skeleton */}
      <Skeleton variant="rectangular" className="w-full h-40 rounded-lg" />
    </div>

    <div className="m-4">
      {/* Category Slider Skeleton */}
      <div className="flex gap-4 overflow-x-auto">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex flex-col items-center space-y-2">
            <Skeleton variant="circular" width={60} height={60} />
            <Skeleton variant="text" width={50} height={12} />
          </div>
        ))}
      </div>
    </div>

    <div className="m-4 space-y-4">
      {/* Recent Gifting Section */}
      <Skeleton variant="text" width={150} height={24} />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton
              variant="rectangular"
              className="w-full h-32 rounded-lg"
            />
            <Skeleton variant="text" className="w-3/4 h-4" />
            <Skeleton variant="text" className="w-1/2 h-3" />
          </div>
        ))}
      </div>
    </div>

    <div className="m-4 space-y-4">
      {/* Recommended Section */}
      <Skeleton variant="text" width={120} height={24} />
      <div className="flex gap-4 overflow-x-auto">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex-shrink-0 w-40 space-y-2">
            <Skeleton
              variant="rectangular"
              className="w-full h-24 rounded-lg"
            />
            <Skeleton variant="text" className="w-full h-4" />
            <Skeleton variant="text" className="w-2/3 h-3" />
          </div>
        ))}
      </div>
    </div>

    <div className="m-4 space-y-4">
      {/* Popular Packages Section */}
      <Skeleton variant="text" width={140} height={24} />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex gap-3">
            <Skeleton
              variant="rectangular"
              width={80}
              height={80}
              className="rounded-lg"
            />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" className="w-3/4 h-4" />
              <Skeleton variant="text" className="w-1/2 h-3" />
              <Skeleton variant="text" className="w-1/4 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Receipt page skeleton (matches Receipt.tsx structure)
export const ReceiptSkeleton = () => (
  <section>
    <div className="flex items-center m-4">
      <Skeleton
        variant="rectangular"
        width={44}
        height={44}
        className="rounded-xl"
      />
      <Skeleton variant="text" width={120} height={32} className="mx-auto" />
    </div>
    <div>
      <div className="mx-4 mb-2 flex flex-col items-center">
        <Skeleton variant="text" width={180} height={32} className="my-3" />
        <div className="m-2 w-full max-w-lg">
          <Skeleton
            variant="text"
            width={320}
            height={20}
            className="mx-auto mb-2"
          />
          <div className="bg-[#F7FAFC] flex flex-col m-2 gap-2 p-4 rounded-lg">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="flex justify-between my-3 text-lg md:text-lg"
              >
                <Skeleton variant="text" width={120} height={20} />
                <Skeleton variant="text" width={100} height={20} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    <div className="w-full flex justify-center items-center flex-col md:flex-row gap-3 px-4 mt-8">
      <Skeleton
        variant="rectangular"
        className="h-12 w-full max-w-[380px] rounded-lg"
      />
      <Skeleton
        variant="rectangular"
        className="h-12 w-full max-w-[380px] rounded-lg"
      />
    </div>
  </section>
);

// BookingDetailView skeleton (matches BookingDetailView.tsx structure)
export const BookingDetailViewSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    {/* Header */}
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          <Skeleton
            variant="rectangular"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <div>
            <Skeleton variant="text" width={180} height={28} />
            <Skeleton variant="text" width={120} height={16} />
          </div>
        </div>
      </div>
    </div>
    {/* Main Content */}
    <div className="mx-auto px-4 py-6 max-w-4xl">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Restaurant Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <Skeleton
                variant="rectangular"
                width={64}
                height={64}
                className="rounded-lg"
              />
              <div className="flex-1">
                <Skeleton
                  variant="text"
                  width={140}
                  height={24}
                  className="mb-2"
                />
                <Skeleton
                  variant="text"
                  width={180}
                  height={16}
                  className="mb-2"
                />
                <Skeleton variant="text" width={120} height={20} />
              </div>
            </div>
          </div>
          {/* Meal Package Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <Skeleton variant="text" width={160} height={20} className="mb-4" />
            <div className="flex gap-4 mb-4">
              <Skeleton
                variant="rectangular"
                width={96}
                height={96}
                className="rounded-lg"
              />
              <div className="flex-1">
                <Skeleton
                  variant="text"
                  width={120}
                  height={20}
                  className="mb-2"
                />
                <Skeleton
                  variant="text"
                  width={180}
                  height={16}
                  className="mb-2"
                />
                <Skeleton variant="text" width={120} height={16} />
              </div>
            </div>
            {/* Menu Items */}
            <div className="border-t pt-4 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton variant="text" width={100} height={16} />
                  <Skeleton variant="text" width={60} height={16} />
                </div>
              ))}
              <div className="border-t pt-2 mt-2 flex justify-between items-center font-medium">
                <Skeleton variant="text" width={100} height={18} />
                <Skeleton variant="text" width={80} height={18} />
              </div>
            </div>
          </div>
          {/* Additional Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <Skeleton variant="text" width={180} height={20} className="mb-4" />
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i}>
                  <Skeleton variant="text" width={100} height={16} />
                  <Skeleton variant="text" width={180} height={14} />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Right Column - Actions/QR/Status */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col items-center">
            <Skeleton
              variant="rectangular"
              width={120}
              height={120}
              className="rounded-lg mb-4"
            />
            <Skeleton variant="text" width={100} height={20} className="mb-2" />
            <Skeleton
              variant="rectangular"
              width={120}
              height={36}
              className="rounded-lg mb-2"
            />
            <Skeleton
              variant="rectangular"
              width={120}
              height={36}
              className="rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Order Form skeleton (matches OrderForm.tsx structure)
export const OrderFormSkeleton = () => (
  <div className="p-4 space-y-6">
    {/* Header */}
    <div className="flex items-center gap-4 mb-4">
      <Skeleton variant="rectangular" width={48} height={48} className="rounded-xl" />
      <Skeleton variant="text" width={180} height={28} />
    </div>
    {/* Booking type slider */}
    <Skeleton variant="rectangular" className="w-full h-12 rounded-lg mb-4" />
    {/* Redemption mode slider */}
    <Skeleton variant="rectangular" className="w-full h-12 rounded-lg mb-4" />
    {/* Recipient fields (simulate 3 fields) */}
    <div className="space-y-3">
      <Skeleton variant="text" className="w-3/4 h-6" />
      <Skeleton variant="text" className="w-3/4 h-6" />
      <Skeleton variant="text" className="w-3/4 h-6" />
    </div>
    {/* Menu items list */}
    <div className="space-y-2 mt-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton variant="rectangular" width={32} height={32} className="rounded-lg" />
          <Skeleton variant="text" width={120} height={20} />
          <Skeleton variant="text" width={60} height={20} />
        </div>
      ))}
    </div>
    {/* Date picker and notes */}
    <Skeleton variant="rectangular" className="w-full h-10 rounded-lg mt-4" />
    <Skeleton variant="text" className="w-full h-6 mt-2" />
    {/* File upload and ticket customization */}
    <Skeleton variant="rectangular" className="w-full h-16 rounded-lg mt-4" />
    {/* Submit button */}
    <Skeleton variant="rectangular" className="w-full h-12 rounded-xl mt-6" />
  </div>
);

export default Skeleton;
