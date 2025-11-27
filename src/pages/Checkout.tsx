import HeaderNav from "@/components/sponsor/HeaderNav";
import { useForm } from "react-hook-form";
import FormField from "@/components/FormField"; 
import Button from "@/components/Button"; 

type PaymentFormInputs = {
  cardNumber: string;
  expiryDate: string;
  cvc: string;
  nameOnCard: string;
  city: string;
  state: string;
  zipCode: string;
};

const Checkout = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormInputs>();

  const onSubmit = (data: PaymentFormInputs) => {
    console.log(data);
    // Handle payment submission logic here
  };

  return (
    <section className="pb-20">
      <HeaderNav
        Heading="Sponsor Meals"
        HeadingClassName="!text-black text-xl "
        className="m-4"
      />
      <div className="px-4 mt-4">
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h2 className=" font-semibold mb-2 text-black text-2xl ">
            Sponsorship Summary
          </h2>
          {/* Replace with actual meal data if available */}
          <div className="flex justify-between items-center text-lg mt-3">
            <p className="">Meal to sponsor </p>
            <p className=" font-medium">5</p>
          </div>
          <div className="border-t border-gray-200 my-2"></div>
          <div className="flex justify-between items-center font-bold text-lg">
            <h2 className="">Total</h2>
            <p className="text-primary">$10.00</p>{" "}
            {/* Assuming a static total for now, integrate with cart if needed */}
          </div>
        </div>

        <div className="mx-4">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Payment Information
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField<PaymentFormInputs>
              name="cardNumber"
              register={register}
              errors={errors}
              placeholder="0000 0000 0000 0000"
              rules={{ required: "Card number is required" }}
              inputClassName="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm h-[48px]"
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField<PaymentFormInputs>
                name="expiryDate"
                register={register}
                errors={errors}
                placeholder="MM/YY"
                rules={{ required: "Expiry date is required" }}
                inputClassName="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm h-[48px]"
              />
              <FormField<PaymentFormInputs>
                name="cvc"
                register={register}
                errors={errors}
                placeholder="CVC"
                rules={{ required: "CVC is required" }}
                inputClassName="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm h-[48px]"
              />
            </div>

            <FormField<PaymentFormInputs>
              name="nameOnCard"
              register={register}
              errors={errors}
              placeholder="Name on Card"
              rules={{ required: "Name on card is required" }}
              inputClassName="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm h-[48px]"
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField<PaymentFormInputs>
                name="city"
                register={register}
                errors={errors}
                placeholder="City"
                rules={{ required: "City is required" }}
                inputClassName="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm h-[48px]"
              />
              <FormField<PaymentFormInputs>
                name="state"
                register={register}
                errors={errors}
                placeholder="State"
                rules={{ required: "State is required" }}
                inputClassName="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm h-[48px]"
              />
            </div>

            <FormField<PaymentFormInputs>
              name="zipCode"
              register={register}
              errors={errors}
              placeholder="Zip Code"
              rules={{ required: "Zip code is required" }}
              inputClassName="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm h-[48px]"
            />
            <div className="mx-6 fixed bottom-4 left-0 right-0 z-50">
              <Button
                className="rounded-lg bg-primary text-white font-semibold py-2 w-full bottom-2"
                type="submit"
              >
                <span>Sponsor Meals</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Checkout;
