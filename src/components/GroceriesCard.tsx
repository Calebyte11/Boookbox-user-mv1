// import React from "react";
// import { Star } from "lucide-react";
// import { Link, useNavigate } from "react-router-dom";


// interface GroceriesCardProps {
//   id: string;
//   title: string;
//   image: string;
//   rating?: string | number;
//   price?: string;
//   status?: "active" | "inactive";
//   location?: string;
//   description?: string;
//   className?: string;
//   onCardClick?: () => void;
//   city?: string;
//   state?: string;
// }

// const GroceriesCard: React.FC<GroceriesCardProps> = ({
//   id,
//   title,
//   image,
//   rating,
//   price,
//   status,
//   location,
//   description,
//   className = "",
//   onCardClick,
//   city,
//   state,
// }) => {
//   const navigate = useNavigate();

//   const handleCardClick = () => {
//     if (onCardClick) {
//       onCardClick();
//     } else {
//       if (id) {
//         navigate(`/restaurants/${id}`);
//       } else {
//         console.warn("Business ID is missing - cannot navigate");
//       }
//     }
//   };

//   return (
//     <div
//       className={`flex flex-col gap-2 shadow-sm p-2 bg-[#F8F8F8] cursor-pointer rounded-lg transition-all hover:shadow-md ${className}`}
//       onClick={handleCardClick}
//     >
//       {" "}
//       <img
//         src={image}
//         alt={`${title} restaurant`}
//         className="rounded-lg object-cover h-32 w-full"
//         onError={(e) => {
//           // Fallback image if restaurant image fails to load
//           const target = e.target as HTMLImageElement;
//           target.src = "";
//         }}
//       />
//       <div className="flex flex-col gap-1 mt-2">
//         <p className="capitalize font-semibold text-sm truncate" title={title}>
//           {title}
//         </p>
//         {price && (
//           <p className="font-normal tracking-tight text-sm text-gray-600">
//             {price}
//           </p>
//         )}
//         {/* City/State display */}
//         {(city || state) && (
//           <p className="font-normal tracking-tight text-xs text-gray-500 truncate">
//             {city && <span>{city}</span>}
//             {city && state && <span>, </span>}
//             {state && <span>{state}</span>}
//           </p>
//         )}
//         {location && (
//           <p className="font-normal tracking-tight text-xs text-gray-500 truncate">
//             {location}
//           </p>
//         )}
//         {description && (
//           <p className="font-normal tracking-tight text-xs text-gray-500 line-clamp-2">
//             {description}
//           </p>
//         )}
//         <div className="flex items-center justify-between mt-1">
//           <span className="text-gray-400 inline-flex items-center text-sm gap-1">
//             <Star className="text-black w-4 h-4" fill="currentColor" />
//             {rating || 0}
//           </span>

//           {status && (
//             <span
//               className={`text-xs px-2 py-1 rounded-full ${
//                 status === "active"
//                   ? "bg-green-100 text-green-800"
//                   : "bg-red-100 text-red-800"
//               }`}
//             >
//               {status}
//             </span>
//           )}
//         </div>{" "}
//       </div>
//       {id && (
//         <Link
//           to={`/restaurants/${id}`}
//           className="bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 inline-flex justify-center transition-colors duration-200 mt-auto w-fit"
//           onClick={(e) => e.stopPropagation()}
//         >
//           <span className="text-center text-sm">Book a meal</span>
//         </Link>
//       )}
//     </div>
//   );
// };

// export default GroceriesCard;
