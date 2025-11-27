import { Link } from "react-router-dom";
import Button from "./Button";
import { Plus } from "lucide-react";
import refuel from "@/assets/images/refuel.png"; // Assuming this is the correct path to your image
import { formatCurrency } from "@/utils/formatCurrency";

type signatureCardType = {
  key: string | number;
  restaurantID: string;
  title?: string;
  description?: string;
  price?: number | string;
  currency?: string;
  image?: string;
  mealId?: string;
  handleClick?: () => void;
};

const SignatureBowelCard = ({
  key,
  restaurantID,
  title,
  description,
  price,
  currency = "NGN",
  image,
  mealId,
  handleClick,
}: signatureCardType) => {
  return (
    <div key={key} className="w-full flex flex-col gap-2" onClick={handleClick}>
      <div className="flex flex-row items-stretch gap-4">
        {/* Text Section */}
        <div className="flex flex-col justify-between flex-1 min-w-0 py-2">
          <div className="capitalize font-semibold flex flex-col gap-1">
            <Link
              to={`/restaurants/${restaurantID}/meals/${mealId}`}
              className="block"
            >
              <p
                className="text-2xl font-medium font-mf text-pretty truncate max-w-[220px]"
               
              >
                {title}
              </p>
            </Link>
            <span
              className="text-sm text-black/50 text-pretty w-full max-w-xs line-clamp-2"
              
            >
              {description
                ? description
                : `Here ia a brief description of the delicious refill pack from Chicken Republic. It contains Rice or Spagetti with chicken and a bottle of Coca Cola`}
            </span>
          </div>
          <p className="font-normal tracking-tight text-medium text-xl mt-2">
            {formatCurrency(Number(price), currency)}
          </p>
        </div>
        {/* Image Section */}
        <div className="relative flex-shrink-0 w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] lg:w-[150px] lg:h-[150px]">
          <img
            src={image || refuel}
            alt="restaurants-image"
            className="rounded-lg w-full h-full object-cover"
          />
          <Button className="absolute bottom-2 right-2 rounded-full p-2 bg-white">
            <Plus />
          </Button>
        </div>
      </div>
      <div className="border my-3 border-gray-300" />
    </div>
  );
};

export default SignatureBowelCard;
