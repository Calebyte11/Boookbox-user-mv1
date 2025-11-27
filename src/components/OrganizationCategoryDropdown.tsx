import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, Check } from "lucide-react";
import { 
  type Control, 
  type FieldValues, 
  type Path,
  type FieldErrors,
  Controller 
} from "react-hook-form";
import { ORGANIZATION_CATEGORIES } from "@/constants/organizationCategories";

interface OrganizationCategoryDropdownProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  errors?: FieldErrors<T>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  required?: boolean;
}

export default function OrganizationCategoryDropdown<T extends FieldValues>({
  name,
  control,
  errors,
  placeholder = "Select organization category",
  disabled = false,
  className = "",
  label,
  required = false,
}: OrganizationCategoryDropdownProps<T>) {
  // Get error for this field
  const fieldError = errors?.[name];
  const errorMessage = fieldError?.message as string;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                disabled={disabled}
                className={`
                  w-full flex items-center justify-between px-4 py-3 
                  bg-white border border-gray-300 rounded-lg shadow-sm 
                  focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                  disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
                  transition-colors
                  ${errorMessage ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
                `}
                aria-label="Select organization category"
              >
                <span className={`text-left ${!field.value ? 'text-gray-500' : 'text-gray-900'}`}>
                  {field.value || placeholder}
                </span>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-400 transition-transform ${disabled ? 'opacity-50' : ''}`} 
                />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="
                  bg-white border border-gray-200 rounded-lg shadow-lg 
                  p-1 min-w-[280px] max-h-[300px] overflow-y-auto z-50
                "
                sideOffset={4}
                align="start"
              >
                {/* Clear selection option */}
                <DropdownMenu.Item
                  className="
                    flex items-center justify-between px-3 py-2 text-sm 
                    cursor-pointer rounded-md hover:bg-gray-100 
                    focus:bg-gray-100 outline-none text-gray-500
                  "
                  onSelect={() => field.onChange("")}
                >
                  <span>Clear selection</span>
                </DropdownMenu.Item>
                
                <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />

                {/* Category options */}
                {ORGANIZATION_CATEGORIES.map((category) => (
                  <DropdownMenu.Item
                    key={category}
                    className="
                      flex items-center justify-between px-3 py-2 text-sm 
                      cursor-pointer rounded-md hover:bg-gray-100 
                      focus:bg-gray-100 outline-none
                    "
                    onSelect={() => field.onChange(category)}
                  >
                    <span className="text-gray-900">{category}</span>
                    {field.value === category && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      />

      {/* Error message */}
      {errorMessage && (
        <p className="text-red-500 text-sm mt-1">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
