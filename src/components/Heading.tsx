// import Button from "@/components/Button";
import { Link } from "react-router-dom";
type HeadingTypes = {
  title: string;
  CTA?: string;
  status?: boolean;
  handleClick?: () => void;
  link?: string;
};

const Heading = ({ title, status, CTA, handleClick, link }: HeadingTypes) => {
  return (
    <div className="max-w-7xl mx-auto flex justify-between items-center mt-[24px] w-full ">
      <h2 className="text-2xl font-semibold text-gray-900 font-mf text-pretty">{title}</h2>
      {status && (
        <Link
          to={link || "#"}
          className="text-black hover:text-primary-dark text-sm font-medium flex items-center w-fit self-center"
          onClick={handleClick}
        >
          <span className="w-[3.5rem] flex justify-end">{CTA}</span>
        </Link>
      )}
    </div>
  );
};

export default Heading;
