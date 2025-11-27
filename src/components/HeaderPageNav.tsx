
import { ChevronLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  title: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
}
const HeaderPageNav = ({
  title,
  showSearch = false,
  searchPlaceholder = "Search",
  onSearchChange,
}: HeaderProps) => {
  const navigate = useNavigate();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  };

  return (
    <section>
      <div className="flex mx-4 items-center my-4 ">
        <button
          className=" p-2 bg-[#ECE6F0] rounded-lg w-[48px] h-[48px]"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="w-8 h-8 " />
        </button>
        <p className="text-center text-2xl justify-center w-full p-2">
          {title}
        </p>
      </div>

      {showSearch && (
        <div className="pt-3 mb-4">
          <form className="relative">
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="w-full rounded-xl bg-[#ECE6F0] py-3 px-10 text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              // autoFocus
              onChange={handleSearchChange}
            />
            <Search className="absolute left-3 top-1/2 h-6 w-6 -translate-y-1/2 text-[#49454F]" />
          </form>
        </div>
      )}
    </section>
  );
};

export default HeaderPageNav;
