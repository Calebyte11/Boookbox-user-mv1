/**
 * Ticket Capture Utility
 * Captures ticket container as PNG and provides download/view functionality
 */

/**
 * Temporarily replaces unsupported CSS functions with compatible alternatives
 * for html2canvas compatibility
 */
const replaceUnsupportedCSS = (element: HTMLElement): (() => void) => {
  const elementsWithStyles: Array<{ element: HTMLElement; original: string }> =
    [];

  // Find all elements with computed styles
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_ELEMENT,
    null
  );

  const elements: HTMLElement[] = [element];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    elements.push(node as HTMLElement);
  }

  elements.forEach((el) => {
    const computedStyle = window.getComputedStyle(el);
    let needsUpdate = false;
    const styleUpdates: string[] = [];

    // Check for oklch and other unsupported functions
    ["color", "background-color", "border-color", "outline-color"].forEach(
      (prop) => {
        const value = computedStyle.getPropertyValue(prop);
        if (value && (value.includes("oklch") || value.includes("color("))) {
          needsUpdate = true;
          // Convert oklch to fallback colors
          let fallbackValue = value;
          if (value.includes("oklch")) {
            // Common color mappings for your theme
            if (value.includes("#ff7a00") || value.includes("255 122 0")) {
              fallbackValue = "#ff7a00";
            } else if (
              value.includes("#522d8a") ||
              value.includes("82 45 138")
            ) {
              fallbackValue = "#522d8a";
            } else if (value.includes("#ff7a001a")) {
              fallbackValue = "rgba(255, 122, 0, 0.1)";
            } else {
              // Generic fallback for other oklch colors
              fallbackValue = "#000000";
            }
          }
          styleUpdates.push(`${prop}: ${fallbackValue} !important`);
        }
      }
    );

    if (needsUpdate) {
      const originalStyle = el.getAttribute("style") || "";
      elementsWithStyles.push({ element: el, original: originalStyle });
      el.setAttribute("style", `${originalStyle}; ${styleUpdates.join("; ")}`);
    }
  });

  // Return cleanup function
  return () => {
    elementsWithStyles.forEach(({ element, original }) => {
      if (original) {
        element.setAttribute("style", original);
      } else {
        element.removeAttribute("style");
      }
    });
  };
};

/**
 * Converts an HTML element to a PNG image and opens it in a new window
 * @param elementId - The ID of the element to capture
 * @param filename - Optional filename for the image
 * @returns Promise that resolves when the operation is complete
 */
export const captureAndViewTicket = async (
  elementId: string,
  filename?: string
): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Import html2canvas dynamically to reduce bundle size
    const html2canvas = (await import("html2canvas")).default;

    // Replace unsupported CSS before capturing
    const cleanup = replaceUnsupportedCSS(element);

    try {
      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        // windowWidth: element.scrollWidth,
        // windowHeight: element.scrollHeight,
        foreignObjectRendering: false, // Disable foreign object rendering to avoid CSS issues
        // ignoreElements: (el) => {
        //   // Ignore elements that might cause issues
        //   return el.tagName === "SCRIPT" || el.tagName === "STYLE";
        // },
      });

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            }
          },
          "image/png",
          1.0
        );
      });

      // Create object URL
      const imageUrl = URL.createObjectURL(blob);

      // Open in new window
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
        <title>${filename || "Ticket"}</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            background-color: #000;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-family: "Inter", "SF Pro Display",  Arial, sans-serif;
          }
          .container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
          }
          img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
          }
          .actions {
            display: flex;
            gap: 10px;
            justify-content: center;
          }
          button {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          }
          .download-btn {
            background-color: #ff7a00;
            color: white;
          }
          .download-btn:hover {
            background-color: rgba(255, 122, 0, 0.8);
          }
          .close-btn {
            background-color: #522d8a;
            color: white;
          }
          .close-btn:hover {
            background-color: #545b62;
          }
        </style>
          </head>
          <body>
        <div class="container">
          <img src="${imageUrl}" alt="Ticket Image" />
          <div class="actions">
            <button class="download-btn" onclick="downloadImage()">Download PNG</button>
            <button class="close-btn" onclick="window.close()">Close</button>
          </div>
        </div>
        <script>
          function downloadImage() {
            const link = document.createElement('a');
            link.href = '${imageUrl}';
            link.download = '${filename || "meal-ticket"}.png';
            if (link.parentNode !== document.body) {
              document.body.appendChild(link);
            }
            link.click();
            if (link.parentNode === document.body) {
              document.body.removeChild(link);
            }
          }
        </script>
          </body>
          </html>
        `);
        newWindow.document.close();
      }

      // Clean up the object URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(imageUrl);
      }, 60000); // Clean up after 1 minute
    } finally {
      // Always clean up the CSS changes
      cleanup();
    }
  } catch (error) {
    console.error("Error capturing ticket:", error);
    throw new Error("Failed to capture ticket image");
  }
};

/**
 * Captures an HTML element and downloads it as PNG
 * @param elementId - The ID of the element to capture
 * @param filename - Optional filename for the download
 * @returns Promise that resolves when the download starts
 */
export const captureAndDownloadTicket = async (
  elementId: string,
  filename?: string
): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Import html2canvas dynamically
    const html2canvas = (await import("html2canvas")).default;

    // Replace unsupported CSS before capturing
    const cleanup = replaceUnsupportedCSS(element);

    try {
      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        foreignObjectRendering: false,
        ignoreElements: (el) => {
          return el.tagName === "SCRIPT" || el.tagName === "STYLE";
        },
      });

      // Create download link
      const link = document.createElement("a");
      link.download = `${filename || "meal-ticket"}.png`;
      link.href = canvas.toDataURL("image/png");

      // Trigger download
      if (link.parentNode !== document.body) {
        document.body.appendChild(link);
      }
      link.click();
      if (link.parentNode === document.body) {
        document.body.removeChild(link);
      }
    } finally {
      // Always clean up the CSS changes
      cleanup();
    }
  } catch (error) {
    console.error("Error downloading ticket:", error);
    throw new Error("Failed to download ticket image");
  }
};

/**
 * Gets a data URL of the captured element
 * @param elementId - The ID of the element to capture
 * @returns Promise that resolves with the data URL
 */
export const captureTicketAsDataURL = async (
  elementId: string
): Promise<string> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Import html2canvas dynamically
    const html2canvas = (await import("html2canvas")).default;

    // Replace unsupported CSS before capturing
    const cleanup = replaceUnsupportedCSS(element);

    try {
      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        foreignObjectRendering: false,
        ignoreElements: (el) => {
          return el.tagName === "SCRIPT" || el.tagName === "STYLE";
        },
      });

      return canvas.toDataURL("image/png");
    } finally {
      // Always clean up the CSS changes
      cleanup();
    }
  } catch (error) {
    console.error("Error capturing ticket as data URL:", error);
    throw new Error("Failed to capture ticket image");
  }
};
