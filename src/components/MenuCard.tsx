import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

interface MenuItemProps {
  id: string; // Or number, depending on your data model
  title: string;
  price: number | string;
  image: string;
}

type MenuType = {
  item?: MenuItemProps;
  restaurantId?: string;
  handleClick?: () => void;
};

const MenuCard = ({ item, restaurantId = "", handleClick }: MenuType) => {
  if (!item) {
    return null; // Or a placeholder/loading state
  }

  return (
    <div
      className="flex flex-row items-stretch gap-2 shadow-sm bg-[#F8F8F8] border border-[#EADDFF] rounded-lg h-[14rem] max-w-full md:h-[16rem]"
      onClick={handleClick}
    >
      <div className="flex flex-col gap-2 mt-2 p-4 justify-between mb-4 flex-1 min-w-0">
      <p className="capitalize font-semibold inline-flex flex-col gap-1">
        <Link
        to={`/restaurants/${restaurantId}/meals/${item.id}`}
        key={item.id}
        className="block"
        >
        <span className="text-2xl font-medium font-mf text-pretty line-clamp-2 break-words">
          {item.title}
        </span>
        </Link>
        <span className="text-sm text-gray-400">Lunch and Dinner</span>
      </p>
      <p className="font-normal tracking-tight text-medium text-lg">
        ₦{item.price}
      </p>
      </div>
      <div className="relative w-32 md:w-48 flex-shrink-0 h-full">
      <img
        src={item.image}
        alt="restaurants-image"
        className="rounded-r-lg object-cover w-full h-full"
      />
      <Link
        to={`/restaurants/${restaurantId}/meals/${item.id}`}
        className="absolute bottom-4 right-4 rounded-full p-2 bg-white"
      >
        <Plus />
      </Link>
      </div>
    </div>
  );
};

export default MenuCard;
