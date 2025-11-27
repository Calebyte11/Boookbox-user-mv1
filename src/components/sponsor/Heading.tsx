import Button from "@/components/Button";
type HeadingTypes = {
  title: string;
  CTA?: string;
  status?: boolean;
  handleClick?: () => void;
};

const Heading = ({ title, status, CTA, handleClick }: HeadingTypes) => {
  return (
    <div className="max-w-7xl mx-auto flex justify-between items-center mt-[24px] w-full ">
      <h2 className="text-2xl font-semibold text-gray-900 font-mf">{title}</h2>
      {status && (
        <Button
          className="text-black hover:text-primary-dark text-sm font-medium flex items-center"
          handleClick={handleClick}
        >
          <span>{CTA}</span>
        </Button>
      )}
    </div>
  );
};

export default Heading;
