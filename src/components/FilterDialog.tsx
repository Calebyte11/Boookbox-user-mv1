import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, ChevronDown, CircleCheck, Circle } from "lucide-react";
import FormField from "./FormField";
import Button from "./Button";
import { useForm } from "react-hook-form";

interface FilterDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

interface FilterFormInputs {
  minPrice?: number;
  maxPrice?: number;
  mealType: string;
  cuisine: string;
  availability: string;
  state?: string;
  country?: string;
  city?: string;
}
const FilterDialog: React.FC<FilterDialogProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FilterFormInputs>({
    defaultValues: {
      mealType: "all",
      cuisine: "nigerian",
      availability: "pick up",
      minPrice: undefined,
      maxPrice: undefined,
      city: "",
      country: "",
      state: "",
    },
    mode: "onChange",
  });

  const mealTypes = ["all", "breakfast", "lunch", "dinner"];
  const cuisines = ["nigerian", "chinese", "indian", "american"];
  const avail = ["pick up", "offer on delivery"];

  const watchedMealType = watch("mealType");
  const watchedCuisine = watch("cuisine");
  const watchedAvailability = watch("availability");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = (data: any) => {
    console.log(data);
    onOpenChange(false); // Close dialog on submit
  };
  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 md:hidden" />
        <Dialog.Content className="fixed inset-0 z-50 bg-white p-4 focus:outline-none md:hidden overflow-y-auto">
          <div className="flex items-center justify-between my-4 w-full ">
            <Dialog.Close className="rounded-xl p-3 bg-gray-100 w-full flex justify-center">
              <X className="h-6 w-6 text-black text-center" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
            {/* Price Range */}
            <div>
              <p className="mb-2 text-lg font-semibold">Price Range</p>
              <div className="border-b border-black my-3" />
              <p className="text-sm text-gray-600 mb-2">
                Enter min and max price range
              </p>
              <div className="flex flex-col">
                <div className="grid grid-cols-2 gap-3">
                  {" "}
                  <FormField
                    label="from"
                    labelClassName="capitalize text-medium text-[13px] py-2"
                    name="minPrice"
                    placeholder="#5000"
                    inputClassName="text-center rounded-xl p-2 focus:border-primary bg-[#EBEBEB] w-[182px]"
                    type="number"
                    register={register}
                    rules={{
                      min: {
                        value: 0,
                        message: "Price cannot be negative",
                      },
                      validate: {
                        lessThanMax: (value: number) => {
                          const maxPrice = watch("maxPrice");
                          if (value && maxPrice && value > maxPrice) {
                            return "Min price should be less than max price";
                          }
                          return true;
                        },
                      },
                    }}
                    errors={errors}
                    valueAsNumber
                  />
                  <FormField
                    label="to"
                    labelClassName="capitalize text-medium text-[13px] py-2"
                    name="maxPrice"
                    placeholder="#10000"
                    inputClassName="text-center rounded-xl p-2 focus:border-primary bg-[#EBEBEB] w-[182px]"
                    type="number"
                    register={register}
                    rules={{
                      min: {
                        value: 0,
                        message: "Price cannot be negative",
                      },
                      validate: {
                        greaterThanMin: (value: number) => {
                          const minPrice = watch("minPrice");
                          if (value && minPrice && value < minPrice) {
                            return "Max price should be greater than min price";
                          }
                          return true;
                        },
                      },
                    }}
                    errors={errors}
                    valueAsNumber
                  />
                </div>
                <Button className="bg-primary p-2 rounded-xl">
                  <span className="text-white ">Save Price Range</span>
                </Button>
              </div>
            </div>
            {/* Meal Type */}
            <div>
              <p className="text-lg font-semibold">Meal Type</p>
              <div className="border-b border-black my-3" />
              <div className=" flex flex-wrap gap-2">
                {mealTypes.map((type) => {
                  const isActive = watchedMealType === type;
                  return (
                    <Button
                      type="button"
                      key={type}
                      className={`inline-flex items-center gap-2 border border-[#808080] rounded-xl cursor-pointer p-2 px-3 text-sm font-medium
                                ${isActive ? "bg-white" : "bg-white "}`}
                      onClick={() =>
                        setValue("mealType", type, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    >
                      {isActive ? (
                        <CircleCheck
                          className="text-white w-[24px] h-[24px] "
                          fill="#ff7a00"
                        />
                      ) : (
                        <Circle className="text-gray-400 w-[24px] h-[24px]" />
                      )}
                      <span className="capitalize">{type}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
            {/* Cuisine */}
            <div>
              <p className="text-lg font-semibold">Cuisine</p>
              <div className="border-b border-black my-3" />
              <div className=" flex flex-wrap gap-2">
                {cuisines.map((cuisineItem) => {
                  const isActive = watchedCuisine === cuisineItem;
                  return (
                    <Button
                      type="button"
                      key={cuisineItem}
                      className={`inline-flex items-center gap-2 border border-[#808080] rounded-xl cursor-pointer p-2 px-3 text-sm font-medium
                                ${isActive ? "bg-white" : "bg-white "}`}
                      onClick={() =>
                        setValue("cuisine", cuisineItem, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    >
                      {isActive ? (
                        <CircleCheck
                          className="text-white w-[24px] h-[24px] "
                          fill="#ff7a00"
                        />
                      ) : (
                        <Circle className="text-gray-400 w-[24px] h-[24px]" />
                      )}
                      <span className="capitalize">{cuisineItem}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
            {/* Availability */}
            <div>
              <p className="text-lg font-semibold">Availability</p>
              <div className="border-b border-black my-3" />
              <div className=" flex flex-wrap gap-2">
                {avail.map((avail) => {
                  const isActive = watchedAvailability === avail;
                  return (
                    <Button
                      type="button"
                      key={avail}
                      className={`inline-flex items-center gap-2 border border-[#808080] rounded-xl cursor-pointer p-2 px-3 text-sm font-medium
                                ${isActive ? "bg-white" : "bg-white "}`}
                      onClick={() =>
                        setValue("availability", avail, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    >
                      {isActive ? (
                        <CircleCheck
                          className="text-white w-[24px] h-[24px] "
                          fill="#ff7a00"
                        />
                      ) : (
                        <Circle className="text-gray-400 w-[24px] h-[24px]" />
                      )}
                      <span className="capitalize">{avail}</span>
                    </Button>
                  );
                })}
              </div>
            </div>{" "}
            {/* Location */}
            <div>
              <p className="text-lg font-semibold">Select Location</p>
              <div className="border-b border-black my-3" />
              <div className="space-y-4">
                <FormField
                  name="country"
                  placeholder="Select Country"
                  type="text"
                  register={register}
                  errors={errors}
                  icon={<ChevronDown className="h-5 w-5 text-gray-400" />}
                  iconPosition="right"
                />
                <div className="relative">
                  <FormField
                    name="state"
                    placeholder="Select State"
                    type="text"
                    register={register}
                    errors={errors}
                    icon={<ChevronDown className="h-5 w-5 text-gray-400" />}
                    iconPosition="right"
                  />
                  <FormField
                    name="city"
                    placeholder="Select City"
                    type="text"
                    register={register}
                    errors={errors}
                    icon={<ChevronDown className="h-5 w-5 text-gray-400" />}
                    iconPosition="right"
                  />
                </div>
              </div>
            </div>
            <div className="mt-8 justify-center flex flex-col gap-2">
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm  text-white bg-primary rounded-md mr-2 focus:ring-primary/90 hover:bg-primary/90"
              >
                <span>Apply Filters</span>
              </Button>
              <Button
                type="submit"
                className="px-4 py-2 text-sm  text-black bg-gray-200 rounded-md   "
              >
                <span>Clear All Filters</span>
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default FilterDialog;
