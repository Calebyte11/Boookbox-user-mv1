import React from "react";
import { Button, Flex, Dialog, Box, Link } from "@radix-ui/themes";
import { Download as DownloadIcon, Info, X } from "lucide-react";
import { ClientOnly } from "./ClientOnly";

const PDFPreview = React.lazy(() => import("./PDFPreview"));

// Brochure path in src assets; Vite will handle it as an asset URL
import brochureUrl from "@/assets/download/BoookBox Corporate.pdf";

type BrochureCalloutProps = {
  className?: string;
};

export default function BrochureCallout({ className }: BrochureCalloutProps) {
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [calloutVisible, setCalloutVisible] = React.useState(true);

  // handle callout dismissal and persistence for a single day
  React.useEffect(() => {
    try {
      const dismissedDate = localStorage.getItem("brochureCalloutDismissed");
      if (dismissedDate) {
        const today = new Date().toISOString().slice(0, 10);
        if (dismissedDate === today) {
          setCalloutVisible(false);
        }
      }
    } catch (e) {
      console.warn("Could not access brochureCalloutDismissed in localStorage", e);
    }
  }, []);

  const onDownload = React.useCallback(() => {
    const a = document.createElement("a");
    a.href = brochureUrl;
    a.download = "BoookBox-Brochure.pdf";
    a.target = "_blank"; // iOS PWA friendly
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, []);

  if (!calloutVisible) {
    return null;
  }

  return (
    <>
      {/* Callout with brochure info */}
      <div className={` ${className}`}>
        <div className="flex items-center lg:mx-4 gap-4">
          <div>
            <Info />
          </div>
          <div className="flex justify-between items-center w-full">
            <Flex direction="column" gap="1">
              <p >
                Learn about BoookBox{" "}
                <Link href={brochureUrl} target="_blank" rel="noopener" color="orange" >
                  Brochure
                </Link>{" "}
                to install and access this application. or  <Link 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    setPreviewOpen(true);
                  }}
                  style={{ cursor: "pointer" }}
                  color="orange"
                >
                  Preview
                </Link>{" "}to see what we offer.
              </p>
          
            </Flex>
            <Button
              variant="ghost"
              size="1"
              onClick={() => {
                try {
                  const today = new Date().toISOString().slice(0, 10);
                  localStorage.setItem("brochureCalloutDismissed", today);
                } catch (e) {
                  // ignore storage errors
                  console.warn("Could not write brochureCalloutDismissed to localStorage", e);
                }
                setCalloutVisible(false);
              }}
              aria-label="Close"
              radius="large"
              color="orange"
              className="cursor-pointer"
            >
              <X className="  text-xs "/>
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Dialog using Radix Themes */}
      <Dialog.Root open={previewOpen} onOpenChange={setPreviewOpen}>
        <Dialog.Content size="4">
          <Dialog.Title>BoookBox Brochure (Preview)</Dialog.Title>
          <Dialog.Description size="2" mb="3" color="gray">
            Use the arrows to navigate pages, or open the full PDF for best experience.
          </Dialog.Description>
          <Box style={{ maxWidth: "100%", maxHeight: "70vh", overflow: "auto" }}>
            <ClientOnly fallback={<div className="p-6 text-center text-sm">Loading preview…</div>}>
              <React.Suspense fallback={<div className="p-6 text-center text-sm">Loading preview…</div>}>
                <PDFPreview url={brochureUrl} />
              </React.Suspense>
            </ClientOnly>
          </Box>
          <Flex mt="4" justify="end" gap="3">
            <Dialog.Close>
              <Button variant="soft" color="gray">Close</Button>
            </Dialog.Close>
            <Button onClick={onDownload} color="orange">
              <DownloadIcon size={16} />
              Download
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
