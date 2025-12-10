import { Link, useNavigate } from "react-router-dom";
import { Gift, HandHelping } from "lucide-react";
import refuel from "@/assets/images/refuel.png";

interface SignatureItemProps {
  id: string;
  title: string;
  price: number | string;
  image: string;
  description?: string;
  currency?: string;
}

type SignatureBowelCardType = {
  item?: SignatureItemProps;
  restaurantId?: string;
  restaurantName?: string;
  businessCategory?: string;
  handleClick?: () => void;
  onRequestClick?: (item: SignatureItemProps) => void;
};

const SignatureBowelCard = ({
  item,
  restaurantId = "",
  restaurantName = "",
  businessCategory = "",
  handleClick,
  onRequestClick,
}: SignatureBowelCardType) => {
  const navigate = useNavigate();

  if (!item) {
    return null;
  }

  const handleRequestClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRequestClick && item) {
      onRequestClick(item);
    }
  };

  const handleGiftClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(
      businessCategory === "restaurant"
        ? `/restaurants/${restaurantId}/meals/${item?.id}`
        : `/${businessCategory}/${restaurantId}/items/${item?.id}`
    );
  };

  return (
    <div
      className="flex items-start bg-[#F8F8F8] rounded-lg shadow-sm h-[12em] w-full hover:shadow-sm cursor-pointer"
      onClick={handleClick}
    >
      <div className="shrink-0 w-40 sm:w-40 md:w-48 h-full rounded-l-lg overflow-hidden flex items-center justify-center">
        <img
          src={item.image || refuel}
          alt={item.title}
          className="w-full h-full object-cover object-center rounded-l-lg"
        />
      </div>
      <div className="flex-col flex container p-2 justify-between flex-1 h-full w-40">
        <div>
          <Link
            to={
              businessCategory === "restaurant"
                ? `/restaurants/${restaurantId}/meals/${item?.id}`
                : `/${businessCategory}/${restaurantId}/items/${item?.id}`
            }
            key={item?.id}
            className="block"
            onClick={(e) => e.stopPropagation()}
          >
            <h1
              className="font-semibold text-lg truncate capitalize"
              title={item.title}
            >
              {item.title}
            </h1>
          </Link>
          <p className="text-black text-sm truncate">
            {restaurantName || item.description || "Signature Bowl"}
          </p>
          <p className="font-normal tracking-tight text-medium text-lg mt-5">
            {item.currency || "₦"}
            {item.price}
          </p>
        </div>

        <div className="flex gap-2 w-full">
          <button
            type="button"
            onClick={handleGiftClick}
            className="bg-primary hover:bg-primary/90 p-1.5 text-white inline-flex rounded-lg items-center justify-center gap-1 flex-1 text-xs transition-colors"
          >
            <Gift className="w-3.5 h-3.5" />
            <span className="truncate">Gift</span>
          </button>
          <button
            onClick={handleRequestClick}
            type="button"
            className="bg-green-100 hover:bg-green-200 border p-1.5 text-green-800 inline-flex rounded-lg items-center justify-center gap-1 flex-1 text-xs transition-colors"
          >
            <HandHelping className="w-4 h-4" />
            <span className="truncate">Request</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignatureBowelCard;
