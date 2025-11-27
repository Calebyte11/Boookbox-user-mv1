// import React from "react";
// import { MapPin, RefreshCw } from "lucide-react";
// import { useLocationService } from "@/hooks/useLocationService";

// const LocationDisplay: React.FC = () => {
//   const {
//     displayLocation,
//     hasLocation,
//     isLoading,
//     permissionStatus,
//     coordinates,
//     addressParts,
//     getCurrentLocation,
//     refreshLocation,
//   } = useLocationService({
//     autoRequest: false,
//     showToasts: true,
//   });

//   const handleEnableLocation = () => {
//     getCurrentLocation();
//   };

//   const handleRefreshLocation = () => {
//     refreshLocation();
//   };

//   if (permissionStatus === "denied") {
//     return (
//       <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
//         <div className="flex items-center gap-3">
//           <MapPin className="h-5 w-5 text-amber-600" />
//           <div className="flex-1">
//             <h3 className="font-medium text-amber-900">
//               Location Access Needed
//             </h3>
//             <p className="text-sm text-amber-700">
//               Enable location access to see restaurants and services near you.
//             </p>
//           </div>
//           <button
//             onClick={handleEnableLocation}
//             className="bg-amber-600 text-white px-3 py-1 rounded-md text-sm hover:bg-amber-700"
//           >
//             Enable
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (isLoading) {
//     return (
//       <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//         <div className="flex items-center gap-3">
//           <MapPin className="h-5 w-5 text-blue-600 animate-pulse" />
//           <div>
//             <h3 className="font-medium text-blue-900">Getting Your Location</h3>
//             <p className="text-sm text-blue-700">
//               Please wait while we detect your location...
//             </p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!hasLocation) {
//     return (
//       <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
//         <div className="flex items-center gap-3">
//           <MapPin className="h-5 w-5 text-gray-600" />
//           <div className="flex-1">
//             <h3 className="font-medium text-gray-900">No Location Available</h3>
//             <p className="text-sm text-gray-600">
//               Location services are not available or permission was not granted.
//             </p>
//           </div>
//           <button
//             onClick={handleEnableLocation}
//             className="bg-primary text-white px-3 py-1 rounded-md text-sm hover:bg-primary/90"
//           >
//             Try Again
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-green-50 border border-green-200 rounded-lg p-4">
//       <div className="flex items-start justify-between">
//         <div className="flex items-start gap-3">
//           <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
//           <div>
//             <h3 className="font-medium text-green-900">Current Location</h3>
//             <p className="text-sm text-green-700 mb-2">{displayLocation}</p>

//             {addressParts && (
//               <div className="text-xs text-green-600 space-y-1">
//                 {addressParts.street && (
//                   <div>Street: {addressParts.street}</div>
//                 )}
//                 <div>City: {addressParts.city}</div>
//                 <div>State: {addressParts.state}</div>
//                 <div>Country: {addressParts.country}</div>
//                 {addressParts.postalCode && (
//                   <div>Postal: {addressParts.postalCode}</div>
//                 )}
//               </div>
//             )}

//             {coordinates && (
//               <div className="text-xs text-green-600 mt-2">
//                 <div>Lat: {coordinates.lat.toFixed(6)}</div>
//                 <div>Lng: {coordinates.lng.toFixed(6)}</div>
//                 <div>Accuracy: {coordinates.accuracy}m</div>
//               </div>
//             )}
//           </div>
//         </div>

//         <button
//           onClick={handleRefreshLocation}
//           className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded-md text-xs hover:bg-green-700"
//         >
//           <RefreshCw className="h-3 w-3" />
//           Refresh
//         </button>
//       </div>
//     </div>
//   );
// };

// export default LocationDisplay;
