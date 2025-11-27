import Heading from "./Heading";
import SignatureBowelCard from "@/components/SignatureBowelCard";

type SignatureBowelsProps = {
  restaurantID: string;
};

const SignatureBowels: React.FC<SignatureBowelsProps> = ({ restaurantID }) => {
  return (
    <div className="">
      <Heading title="Signature Bowels" />
      <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {[1, 2, 3, 4, 5, 6].map((key) => (
          <SignatureBowelCard
          key={key}
          restaurantID={restaurantID}
          />
        ))}
      </div>
    </div>
  );

};

export default SignatureBowels;
