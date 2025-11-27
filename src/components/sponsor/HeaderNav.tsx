import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

type HeaderNavType = {
  Heading?: string;
  description?: string;
  date?: string;
  HeadingClassName?: string;
  className?: string;
};

const HeaderNav: React.FC<HeaderNavType> = ({
  Heading,
  description,
  date,
  HeadingClassName,
  className,
}) => {
  const navigate = useNavigate();
  //   const dateNow = new Date();

  return (
    <>
      <div className={`p-2 mx-auto flex items-center ${className}`}>
        <ChevronLeft
          className="w-[24px] ml-2 text-black"
          onClick={() => navigate(-1)}
        />
        <div className={`flex flex-col justify-center text-center w-full `}>
          <h1 className={`text-gray-400 text-sm ${HeadingClassName}`}>
            {Heading}
          </h1>
          <p className="text-black ">{description}</p>
          {date && <p className="text-black ">Available {date}</p>}
        </div>
      </div>
      <div className="border-t border-gray-300 my-3" />
    </>
  );
};

export default HeaderNav;
