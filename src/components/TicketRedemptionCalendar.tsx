import {
  add,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isEqual,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
  getYear,
  setYear,
  setMonth,
  isWithinInterval,
} from "date-fns";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface TicketRedemptionCalendarProps {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  validityStart: string; // ISO string
  validityEnd: string; // ISO string
}

const TicketRedemptionCalendar = ({ 
  selectedDate, 
  onDateChange, 
  validityStart, 
  validityEnd 
}: TicketRedemptionCalendarProps) => {
  const colStartClasses = [
    "",
    "col-start-2",
    "col-start-3",
    "col-start-4",
    "col-start-5",
    "col-start-6",
    "col-start-7",
  ];

  const today = startOfToday();
  const validityStartDate = new Date(validityStart);
  const validityEndDate = new Date(validityEnd);
  
  // Initialize with selectedDate or first valid date
  const initialDate = selectedDate && isWithinInterval(selectedDate, { start: validityStartDate, end: validityEndDate })
    ? selectedDate 
    : (isWithinInterval(today, { start: validityStartDate, end: validityEndDate }) ? today : validityStartDate);
  
  const [selectedDay, setSelectedDay] = useState(initialDate);
  const [currentMonth, setCurrentMonth] = useState(format(initialDate, "MMM-yyyy"));
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date());

  // For month dropdown
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const monthTriggerRef = useRef<HTMLButtonElement>(null);
  const yearTriggerRef = useRef<HTMLButtonElement>(null);

  // Month names for dropdown
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  // Generate a range of years for the dropdown
  const currentYear = getYear(firstDayCurrentMonth);
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  const days = eachDayOfInterval({
    start: firstDayCurrentMonth,
    end: endOfMonth(firstDayCurrentMonth),
  });

  function previousMonth() {
    const prevMonth = add(firstDayCurrentMonth, { months: -1 });
    setCurrentMonth(format(prevMonth, "MMM-yyyy"));
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 });
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
  }

  // Helper function to check if a date is within the validity range
  function isDateValid(day: Date) {
    return isWithinInterval(day, { start: validityStartDate, end: validityEndDate });
  }

  // Helper function to check if a date is in the validity range (for highlighting)
  function isDateInValidityRange(day: Date) {
    return isWithinInterval(day, { start: validityStartDate, end: validityEndDate });
  }

  function changeMonth(monthIndex: number) {
    const newDate = setMonth(firstDayCurrentMonth, monthIndex);
    setCurrentMonth(format(newDate, "MMM-yyyy"));
    setIsMonthDropdownOpen(false);
  }

  function changeYear(year: number) {
    const newDate = setYear(firstDayCurrentMonth, year);
    setCurrentMonth(format(newDate, "MMM-yyyy"));
    setIsYearDropdownOpen(false);
  }

  function previousYear() {
    const prevYear = add(firstDayCurrentMonth, { years: -1 });
    setCurrentMonth(format(prevYear, "MMM-yyyy"));
  }

  function nextYear() {
    const nextYear = add(firstDayCurrentMonth, { years: 1 });
    setCurrentMonth(format(nextYear, "MMM-yyyy"));
  }

  // Handle single date selection
  function handleDateSelect(day: Date) {
    if (!isDateValid(day)) return; // Don't allow selection of invalid dates
    
    setSelectedDay(day);
    if (onDateChange) {
      onDateChange(day);
    }
  }

  function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(" ");
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Selected Date Display */}
      <div className="pb-4">
        <div className="border border-primary rounded-lg flex items-center p-3 gap-2 justify-center">
          <p className="bg-primary/15 text-primary rounded-lg px-4 py-2 flex justify-center items-center">
            {format(selectedDay, "dd MMM, yyyy")}
          </p>
        </div>
        <p className="text-sm text-gray-600 mt-2 text-center">
          Valid from {format(validityStartDate, "dd MMM")} to {format(validityEndDate, "dd MMM, yyyy")}
        </p>
      </div>

      {/* Calendar */}
      <div className="bg-[#ECE6F0] rounded-lg p-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <button
              type="button"
              onClick={previousMonth}
              className="flex items-center justify-center p-1 text-gray-400 hover:text-gray-500"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>

            <DropdownMenu.Root
              open={isMonthDropdownOpen}
              onOpenChange={setIsMonthDropdownOpen}
            >
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  ref={monthTriggerRef}
                  className="inline-flex items-center px-4 py-2 font-semibold text-gray-900 hover:bg-gray-100 rounded-md focus:outline-none"
                >
                  {format(firstDayCurrentMonth, "MMMM")}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="bg-white rounded-md shadow-lg p-1 min-w-[150px] max-h-[300px] overflow-y-auto z-50"
                  sideOffset={5}
                  align="center"
                >
                  {months.map((month, idx) => (
                    <DropdownMenu.Item
                      key={`${month}${idx}`}
                      className={`${
                        idx === firstDayCurrentMonth.getMonth()
                          ? "bg-primary text-white"
                          : "text-black hover:bg-orange-500"
                      } cursor-pointer select-none rounded-md px-3 py-2 text-sm outline-none`}
                      onSelect={() => changeMonth(idx)}
                    >
                      {month}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            <button
              onClick={nextMonth}
              type="button"
              className="flex items-center justify-center p-1 text-gray-400 hover:text-gray-500"
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center">
            <button
              type="button"
              onClick={previousYear}
              className="flex items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>

            <DropdownMenu.Root
              open={isYearDropdownOpen}
              onOpenChange={setIsYearDropdownOpen}
            >
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  ref={yearTriggerRef}
                  className="inline-flex items-center px-4 py-2 font-semibold text-gray-900 hover:bg-gray-100 rounded-md focus:outline-none"
                >
                  {format(firstDayCurrentMonth, "yyyy")}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="bg-white rounded-md shadow-lg p-1 min-w-[100px] max-h-[300px] overflow-y-auto z-50"
                  sideOffset={5}
                  align="center"
                >
                  {years.map((year) => (
                    <DropdownMenu.Item
                      key={`year-${year}`}
                      className={`${
                        year === currentYear
                          ? "bg-primary text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      } cursor-pointer select-none rounded-md px-3 py-2 text-sm outline-none`}
                      onSelect={() => changeYear(year)}
                    >
                      {year}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            <button
              onClick={nextYear}
              type="button"
              className="flex items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 mt-4 text-lg leading-6 text-center text-[#1D1B20]">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <div key={index} className="font-medium">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 mt-4 text-lg gap-1">
          {days.map((day, dayIdx) => {
            const isSelected = isEqual(day, selectedDay);
            const isValidDate = isDateValid(day);
            const isInValidityRange = isDateInValidityRange(day);
            const isCurrentMonth = isSameMonth(day, firstDayCurrentMonth);
            const isTodayDate = isToday(day);

            return (
              <div
                key={dayIdx}
                className={classNames(
                  dayIdx === 0 && colStartClasses[getDay(day)],
                  "py-1"
                )}
              >
                <button
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  disabled={!isValidDate}
                  className={classNames(
                    // Selected date - Brand Blue
                    isSelected && "bg-[#522D8A] text-white font-bold",
                    
                    // Validity range highlighting (not selected)
                    !isSelected && isInValidityRange && isCurrentMonth && "bg-primary/10 text-primary border border-primary",
                    
                    // Today (if not selected and in validity range)
                    !isSelected && !isInValidityRange && isTodayDate && "text-orange-600 font-semibold",
                    
                    // Valid dates (not selected, not in validity range)
                    !isSelected && !isInValidityRange && isValidDate && isCurrentMonth && "text-[#1D1B20] hover:bg-gray-200",
                    
                    // Invalid dates
                    !isValidDate && "text-gray-300 cursor-not-allowed",
                    
                    // Out of current month
                    !isCurrentMonth && "text-gray-400",

                    // Hover effect for valid, unselected dates
                    isValidDate && !isSelected && "hover:bg-blue-100",

                    // Base style
                    "mx-auto flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200"
                  )}
                >
                  <time dateTime={format(day, "yyyy-MM-dd")}>
                    {format(day, "d")}
                  </time>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TicketRedemptionCalendar;