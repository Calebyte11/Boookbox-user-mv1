import Button from "./Button";
import { Plus } from "lucide-react";
import ActivityHero from "@/assets/images/sponsorbanner.png";
type typesState = {
  title: string;
  heroImage?: string;
  buttonText: string;
  buttonAction: () => void;
};

export const EmptyState = (emptyState: typesState) => {
  return (
    <div className="container mx-auto">
      <div className="relative h-[280px] md:h-[350px] rounded-xl overflow-hidden">
        <img
          src={emptyState.heroImage ? emptyState.heroImage : ActivityHero}
          alt="Empty state"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/0 to-primary flex flex-col items-center justify-end pb-10 md:pb-16 px-6 text-center h-full bottom-20">
          <h2 className="text-white text-xl md:text-3xl font-medium font-mf my-4 max-w-lg tracking-tight">
            {emptyState.title}
          </h2>
          <Button
            className="bg-white hover:bg-gray-50 text-primary rounded-full px-6 py-3 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            handleClick={emptyState.buttonAction}
          >
            <Plus size={18} />
            <span className="font-medium">{emptyState.buttonText}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
