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
} from "date-fns";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface CalendarProps {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

const Calendar = ({ selectedDate, onDateChange }: CalendarProps) => {
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
  const [selectedDay, setSelectedDay] = useState(selectedDate || today);
  const [selectedEndDay, setSelectedEndDay] = useState(
    add(selectedDate || today, { days: 6 })
  );
  const [currentMonth, setCurrentMonth] = useState(format(today, "MMM-yyyy"));
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date());

  // For month dropdown
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const monthTriggerRef = useRef<HTMLButtonElement>(null);
  const yearTriggerRef = useRef<HTMLButtonElement>(null);

  // Month names for dropdown
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Month names for dropdown
  // const months = Array.from({ length: 12 }, (_, i) => format(new Date(0, i), 'MMM'));

  // Generate a range of years for the dropdown (10 years back, 10 years forward)
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

  // Helper function to check if a date is within the selected range
  function isDateInRange(day: Date) {
    if (!selectedDay || !selectedEndDay) return false;
    return (
      (isEqual(day, selectedDay) || day > selectedDay) &&
      (isEqual(day, selectedEndDay) || day < selectedEndDay)
    );
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
  // Handle date selection with automatic 5-day range
  function handleDateSelect(day: Date) {
    setSelectedDay(day);
    setSelectedEndDay(add(day, { days: 6 }));
    // Call the parent's onDateChange if provided
    if (onDateChange) {
      onDateChange(day);
    }
  }
  function handleClear() {
    const today = startOfToday();
    setSelectedDay(today);
    setSelectedEndDay(add(today, { days: 6 }));
    // Call the parent's onDateChange if provided
    if (onDateChange) {
      onDateChange(today);
    }
    console.log("Date range cleared and reset to default.");
  }

  function handleCancel() {
    console.log("Cancel action triggered.");
  }

  function handleOk() {
    console.log(
      "OK action triggered. Selected range:",
      selectedDay,
      selectedEndDay
    );
  }

  function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(" ");
  }

  return (
    <div className="max-w-6xl mx-auto mb-8">
      <div className="pb-8">
        <div className="border border-primary rounded-lg flex  sm:flex-row h-auto sm:h-[52px] items-center p-2 sm:p-3 gap-2 justify-center  max-w-6xl mx-auto">
          <p className="bg-primary/15 text-primary rounded-lg w-full sm:w-[150px] lg:w-[200px] xl:w-[250px] p-2 flex justify-center items-center">
            {format(selectedDay, "dd MMM, yyyy")}
          </p>

          <div className="hidden sm:block w-8 text-center font-bold">——</div>

          <p className="bg-primary/15 text-primary rounded-lg w-full sm:w-[150px] lg:w-[200px] xl:w-[250px] p-2 flex justify-center items-center">
            {format(selectedEndDay, "dd MMM, yyyy")}
          </p>
        </div>

        {/* Helper text - shows on desktop and tablet (hidden on mobile) */}
        <p className="hidden lg:block text-sm text-gray-600 mt-3 text-center max-w-6xl mx-auto">
          Select a start date to automatically set a 5-day range
        </p>

        {/* Optional: Mobile helper text */}
        <p className="lg:hidden text-xs text-gray-600 mt-2 text-center px-4">
          Tap to select dates
        </p>
      </div>

      <div className="lg:flex lg:gap-8 gap-2">
        {/* First Calendar (full width on mobile/tablet, half on lg+) */}
        <div className="w-full lg:w-1/2 bg-[#ECE6F0] rounded-lg p-4 mb-6 lg:mb-0">
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
                    className="inline-flex items-center md:px-4 px-2 py-2 font-semibold text-gray-900 hover:bg-gray-100 rounded-md focus:outline-none"
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
                    className="inline-flex items-center md:px-4 px-2 py-2 font-semibold text-gray-900 hover:bg-gray-100 rounded-md focus:outline-none"
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
            {days.map((day, dayIdx) => (
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
                  className={classNames(
                    // Text color
                    isDateInRange(day) && "text-white",
                    !isDateInRange(day) && isToday(day) && "text-orange-600",
                    !isDateInRange(day) &&
                      !isToday(day) &&
                      isSameMonth(day, firstDayCurrentMonth) &&
                      "text-[#1D1B20]",
                    !isDateInRange(day) &&
                      !isToday(day) &&
                      !isSameMonth(day, firstDayCurrentMonth) &&
                      "text-gray-400",

                    // Background color
                    isDateInRange(day) && "bg-primary",

                    // Hover effect for non-selected days
                    !isDateInRange(day) && "hover:bg-gray-200",

                    // Bold font weight
                    (isDateInRange(day) || isToday(day)) && "font-semibold",

                    // Base style
                    "mx-auto flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200"
                  )}
                >
                  <time dateTime={format(day, "yyyy-MM-dd")}>
                    {format(day, "d")}
                  </time>
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-6 text-primary items-center w-full text-lg font-medium capitalize">
            <button
              onClick={handleClear}
              className="text-lg font-medium hover:bg-gray-200 px-3 py-1 rounded"
            >
              Clear
            </button>
            <div className="flex gap-4">
              <button
                onClick={handleCancel}
                className="text-lg font-medium hover:bg-gray-200 px-3 py-1 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleOk}
                className="text-lg font-medium hover:bg-gray-200 px-3 py-1 rounded"
              >
                OK
              </button>
            </div>
          </div>
        </div>

        {/* Second Calendar (visible on large screens only) */}
        <div className="hidden lg:block lg:w-1/2 bg-[#ECE6F0] rounded-lg p-4">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <button
                type="button"
                onClick={nextMonth}
                className="flex items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>

              <div className="inline-flex items-center px-4 py-2 font-semibold text-gray-900">
                {format(add(firstDayCurrentMonth, { months: 1 }), "MMMM yyyy")}
              </div>

              <button
                onClick={() => {
                  const firstDayNextMonth = add(firstDayCurrentMonth, {
                    months: 2,
                  });
                  setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
                }}
                type="button"
                className="flex items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
              >
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-lg leading-6 text-center text-[#1D1B20]">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <div key={index} className="font-medium">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 mt-4 text-lg gap-1">
            {eachDayOfInterval({
              start: add(firstDayCurrentMonth, { months: 1 }),
              end: endOfMonth(add(firstDayCurrentMonth, { months: 1 })),
            }).map((day, dayIdx) => (
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
                  className={classNames(
                    isDateInRange(day) && "text-white",
                    !isDateInRange(day) && isToday(day) && "text-orange-600",
                    !isDateInRange(day) &&
                      !isToday(day) &&
                      isSameMonth(
                        day,
                        add(firstDayCurrentMonth, { months: 1 })
                      ) &&
                      "text-[#1D1B20]",
                    !isDateInRange(day) &&
                      !isToday(day) &&
                      !isSameMonth(
                        day,
                        add(firstDayCurrentMonth, { months: 1 })
                      ) &&
                      "text-gray-400",
                    isDateInRange(day) && "bg-primary",
                    !isDateInRange(day) && "hover:bg-gray-200",
                    (isDateInRange(day) || isToday(day)) && "font-semibold",
                    "mx-auto flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200"
                  )}
                >
                  <time dateTime={format(day, "yyyy-MM-dd")}>
                    {format(day, "d")}
                  </time>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
