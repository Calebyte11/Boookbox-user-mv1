/* eslint-disable @typescript-eslint/no-explicit-any */
import Button from "./Button";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/utils/formatCurrency";
type CartButtonType = {
  isValid: boolean;
  className?: string;
  text: string;
  handleClick?: () => void;
  textClassName?: string;
  customPrice?: number;
  customCount?: number;
  currency?:string;
  [key: string]: any;
};
const CartButton = ({
  isValid,
  className,
  text,
  textClassName,
  customPrice,
  customCount,
  // currency,
  ...rest
}: CartButtonType) => {
  const CartState = useCartStore((state) => state);

  //   total price of all items from Cartstore or custom price
  const totalPrice =
    customPrice !== undefined
      ? customPrice
      : CartState.items.reduce((acc, item) => acc + item.totalPrice, 0);
  // total count of items in cart or custom count
  const totalCount =
    customCount !== undefined
      ? customCount
      : CartState.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <Button
      type="submit"
      className={`text-white mt-4 w-full items-center rounded-full py-2.5 font-semibold text-base transition-colors inline-flex px-3 gap-2 relative  bg-primary hover:bg-orange-600 justify-between "
      ${className}`}
      {...rest}
      
    >
      {isValid && (
        <span className="text-primary bg-white w-fit h-auto rounded-full px-2 py-1 text-right">
          {totalCount}
        </span>
      )}
      <span className={`${textClassName} text-center`}>{text}</span>
      <span className="text-white text-left">{`${formatCurrency(totalPrice)}`}</span>
    </Button>
  );
};

export default CartButton;
