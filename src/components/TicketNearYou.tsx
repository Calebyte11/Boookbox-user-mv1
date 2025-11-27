import { Gift, Timer } from "lucide-react";
import Heading from "./Heading";
import { useAuth } from "@/features/auth/hooks";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/useToast";
import type {
  Ticket,
  EmptyTicketConfig,
  TicketListConfig,
} from "@/types/ticket";

type TicketListProps = {
  items: Ticket[];
  emptyState?: EmptyTicketConfig;
  config: TicketListConfig;
  className?: string;
  itemClassName?: string;
  onItemClick?: (item: Ticket) => void;
};

const TicketNearYou = ({
  items,
  emptyState,
  config,
  className = "my-2",
  itemClassName = "",
  onItemClick,
}: TicketListProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  return (
    <section className={className}>
      <div className="max-w-7xl mx-auto flex justify-between items-center my-[24px] ">
        <Heading
          title={config.title}
          CTA={config.ctaText}
          status={items.length > 0}
          handleClick={config.onCtaClick}
        />
      </div>
      {/*  content Section*/}

      <div className="mt-4 flex flex-col gap-2 space-y-4">
        {items.length > 0
          ? items.map((item, index) => (
              <div
                key={index}
                className={`border border-[#CAC4D0] rounded-lg flex flex-col gap-2 p-2 ${itemClassName}`}
                onClick={() => onItemClick && onItemClick(item)}
              >
                {/* Ticket content here */}
                <div className="flex gap-2 items-start pl-2.5 py-2.5">
                  <img
                    src={item.image}
                    alt="images"
                    className="rounded-lg h-[120px] w-[120px] object-cover"
                  />
                  <div className="flex flex-col">
                    <h2
                      className="font-medium text-xl capitalize truncate max-w-[180px]"
                      title={item.title}
                    >
                      {item.title}
                    </h2>
                    <div className="mt-2 flex flex-col gap-2">
                      <p
                        className="text-gray-400 inline-flex gap-2 items-center text-sm w-full line-clamp-2"
                        title={item.description}
                      >
                        <Gift className="w-4 h-4" />
                        {item.description}
                      </p>
                      <div className="text-gray-400 inline-flex gap-2 items-center text-sm ">
                        <Timer className="w-4 h-4" />
                        <div className="inline-flex flex-col">
                          <span>Available Until {item.date}</span>
                          <p className="text-gray-400 inline-flex gap-2 text-sm">
                            {(item.numberOfBookings ?? 1) -
                              (item.slotsTaken ?? 0)}{" "}
                            pack(s) left
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() =>
                    user
                      ? navigate(`/tickets/claim/${item.id}`)
                      : toast({
                          title: "Sign In Required",
                          description:
                            "You must be logged in to claim a ticket.",
                          variant: "info",
                        })
                  }
                  className="p-2 bg-primary rounded-full mx-2 text-white text-center flex justify-center mb-2"
                >
                  <p>Claim Ticket</p>
                </button>
              </div>
            ))
          : emptyState && <div>No tickets found</div>}
      </div>
    </section>
  );
};

export default TicketNearYou;
