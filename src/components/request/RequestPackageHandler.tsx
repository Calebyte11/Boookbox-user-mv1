// // import React, { useState, useEffect } from 'react';
// // import { Users } from 'lucide-react';
// // import { useRequestPackageParam } from '@/hooks/useRequestPackageParam';
// // import { useNavigate } from 'react-router-dom';
// // import { formatCurrency } from '@/utils/formatCurrency';

// // interface Package {
// //   id: string;
// //   brand: string;
// //   businessCategory: string;
// //   description: string;
// //   image: string;
// //   package: string;
// //   price?: number;
// //   restaurantId: string;
// //   menuId: string;
// //   currency: string;
// //   category: string;
// // }

// // interface RequestData {
// //   package: Package;
// //   message: string;
// // }

// // interface PackageRequestHandlerProps {
// //   packages: Package[];
// // }

// // const PackageRequestHandler: React.FC<PackageRequestHandlerProps> = ({ packages }) => {
// //   const navigate = useNavigate();
// //   const [requestData, setRequestData] = useState<RequestData | null>(null);
// //   const { packageId, restaurantId, source } = useRequestPackageParam();

// //   useEffect(() => {
// //     if (packageId && source === 'friend_request') {
// //       const pkg = packages.find(p => p.menuId === packageId);
// //       if (pkg) {
// //         setRequestData({
// //           package: pkg,
// //           message: "Your friend has requested this package!"
// //         });
// //       }
// //     }
// //   }, [packageId, source, packages]);

// //   if (!requestData) return null;

// //   const pkg = requestData.package;

// //   const handleViewPackage = () => {
// //     // Use restaurantId from URL params if package doesn't have it
// //     const finalRestaurantId = pkg.restaurantId || restaurantId;
    
// //     navigate(
// //       pkg.businessCategory === "restaurant"
// //         ? `/restaurants/${finalRestaurantId}/meals/${pkg.menuId}`
// //         : `/${pkg.businessCategory}/${finalRestaurantId}/items/${pkg.menuId}`
// //     );
// //   };

// //   return (
// //     <div className="bg-linear-to-r from-purple-50 to-pink-50 p-4 rounded-xl mb-6 border-2 border-purple-200 shadow-sm">
// //       <div className="flex items-center gap-3 mb-3">
// //         <div className="bg-purple-500 rounded-full p-2">
// //           <Users size={24} className="text-white" />
// //         </div>
// //         <div className="flex-1">
// //           <h3 className="font-bold text-purple-900">Friend Request</h3>
// //           <p className="text-sm text-purple-700">{requestData.message}</p>
// //         </div>
// //       </div>
// //       <div className="bg-white rounded-lg p-4 flex items-center gap-4">
// //         <img
// //           src={pkg.image}
// //           alt={pkg.package}
// //           className="w-20 h-20 rounded-lg object-cover"
// //         />
// //         <div className="flex-1">
// //           <h4 className="font-semibold text-lg capitalize">{pkg.package}</h4>
// //           <p className="text-sm text-gray-600">{pkg.brand}</p>
          
// //           <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-[11px] rounded-full border border-blue-200">
// //             {pkg.businessCategory === "restaurant"
// //               ? "Restaurant"
// //               : pkg.businessCategory === "groceries"
// //               ? "Grocery Store"
// //               : pkg.businessCategory === "frozen-foods"
// //               ? "Frozen Foods Store"
// //               : pkg.businessCategory === "wine-drinks"
// //               ? "Wine & Drinks Store"
// //               : ""}
// //           </span>

// //           {pkg.price && (
// //             <p className="text-primary font-bold mt-2">
// //               {formatCurrency(pkg.price, pkg.currency || "NGN")}
// //             </p>
// //           )}
// //         </div>
// //       </div>
      
// //       <button
// //         onClick={handleViewPackage}
// //         className="w-full mt-4 bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
// //       >
// //         View Package & Gift to Friend
// //       </button>
// //     </div>
// //   );
// // };

// // export default PackageRequestHandler;



// import React, { useEffect } from 'react';
// import { useRequestPackageParam } from '@/hooks/useRequestPackageParam';
// import { useNavigate } from 'react-router-dom';

// interface Package {
//   id: string;
//   brand: string;
//   businessCategory: string;
//   description: string;
//   image: string;
//   package: string;
//   price?: number;
//   restaurantId: string;
//   menuId: string;
//   currency: string;
//   category: string;
// }

// interface PackageRequestHandlerProps {
//   packages: Package[];
//   isLoading?: boolean;
// }

// const PackageRequestHandler: React.FC<PackageRequestHandlerProps> = ({ packages, isLoading = false }) => {
//   const navigate = useNavigate();
//   const { packageId, restaurantId, source } = useRequestPackageParam();

//   useEffect(() => {
//     // Wait until packages are loaded
//     if (isLoading) return;

//     // Check if this is a friend request
//     if (packageId && restaurantId && source === 'friend_request') {
//       console.log('Friend request detected!');
//       console.log('packageId:', packageId);
//       console.log('restaurantId:', restaurantId);
//       console.log('packages:', packages);

//       // Find the package
//       const pkg = packages.find(p => p.menuId === packageId);
      
//       console.log('Found package:', pkg);

//       if (pkg) {
//         // Build redirect URL
//         const redirectUrl = pkg.businessCategory === "restaurant"
//           ? `/restaurants/${restaurantId}/meals/${packageId}`
//           : `/${pkg.businessCategory}/${restaurantId}/items/${packageId}`;
        
//         console.log('Redirecting to:', redirectUrl);
        
//         // Redirect
//         navigate(redirectUrl, { replace: true });
//       } else {
//         // Package not found in list, but we have the IDs from URL
//         // Assume it's a restaurant and redirect anyway
//         console.log('Package not in list, redirecting with URL params');
//         const redirectUrl = `/restaurants/${restaurantId}/meals/${packageId}`;
//         navigate(redirectUrl, { replace: true });
//       }
//     }
//   }, [packageId, restaurantId, source, packages, navigate, isLoading]);

//   // Show loading state while checking
//   if (packageId && source === 'friend_request' && isLoading) {
//     return (
//       <div className="flex items-center justify-center p-8">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//       </div>
//     );
//   }

//   return null;
// };

// export default PackageRequestHandler;