/* eslint-disable react-refresh/only-export-components */
import React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  AlertTriangle,
} from "lucide-react";
import Button from "@/components/Button"; // Import your Button component

// Types
export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

export interface ToastActionOptions {
  label: string;
  onClick: () => void;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  className?: string;
}

export interface ToastProps {
  title?: string;
  description?: string;
  action?: React.ReactNode | ToastActionOptions;
  duration?: number;
  variant?: ToastVariant;
}

type ToastContextType = {
  toast: (props: ToastProps) => string;
  dismiss: (toastId?: string) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined
);

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<
    Array<ToastProps & { id: string }>
  >([]);

  const toast = React.useCallback((props: ToastProps) => {
    const id = generateId();
    setToasts((prevToasts) => [...prevToasts, { ...props, id }]);
    return id;
  }, []);

  const dismiss = React.useCallback((toastId?: string) => {
    setToasts((prevToasts) =>
      toastId
        ? prevToasts.filter((toast) => toast.id !== toastId)
        : prevToasts.slice(1)
    );
  }, []);

  const handleToastClose = (toastId: string) => {
    setToasts((prevToasts) =>
      prevToasts.filter((toast) => toast.id !== toastId)
    );
  };

  const renderAction = (action: ToastProps["action"]) => {
    if (!action) return null;

  if (React.isValidElement(action)) {
      return action;
    }

    const actionOptions = action as ToastActionOptions;
    return (
      <Button
        variant={actionOptions.variant || "ghost"}
        size="sm"
        onClick={actionOptions.onClick}
        className={actionOptions.className}
      >
        {actionOptions.label}
      </Button>
    );
  };

  return (
  <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastPrimitives.Provider swipeDirection="right">
        {toasts.map(
          ({
            id,
            title,
            description,
            action,
            duration,
            variant = "default",
          }) => (
            <Toast
              key={id}
              duration={duration}
              variant={variant}
              onOpenChange={(open) => {
                if (!open) handleToastClose(id);
              }}
            >
              <div className="flex items-start gap-3 p-4">
                <div className="flex-shrink-0 mt-0.5">
                  {variant === "success" && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  )}
                  {variant === "error" && (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  {variant === "warning" && (
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  )}
                  {variant === "info" && (
                    <Info className="h-5 w-5 text-blue-600" />
                  )}
                  {variant === "default" && (
                    <div className="h-5 w-5 rounded-full bg-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  {title && <ToastTitle>{title}</ToastTitle>}
                  {description && (
                    <ToastDescription>{description}</ToastDescription>
                  )}
                </div>
                <ToastClose className="absolute right-2 top-2 rounded p-1 text-gray-500 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-700 group-hover:opacity-100">
                  <X className="h-4 w-4" />
                </ToastClose>
                {action && (
                  <ToastAction asChild altText={title || "Close"}>
                    {renderAction(action)}
                  </ToastAction>
                )}
              </div>
            </Toast>
          )
        )}
        <ToastViewport />
      </ToastPrimitives.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & {
    variant?: ToastVariant;
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variantStyles = {
    default: "bg-white border border-gray-200 shadow-lg",
    success: "bg-emerald-50 border border-emerald-200 shadow-lg",
    error: "bg-red-50 border border-red-200 shadow-lg",
    warning: "bg-amber-50 border border-amber-200 shadow-lg",
    info: "bg-blue-50 border border-blue-200 shadow-lg",
  };

  return (
    <ToastPrimitives.Root
      ref={ref}
      className={`group relative w-full max-w-sm rounded-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=closed]:animate-hide data-[state=open]:animate-slideIn data-[swipe=move]:transition-none ${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action> & { altText?: string }
>(({ className, altText, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={`inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-transparent px-3 text-sm font-medium ring-offset-white transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className}`}
    altText={altText ?? "Close"}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={className}
    toast-close=""
    {...props}
  />
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={`text-sm font-medium text-gray-900 ${className}`}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={`text-sm text-gray-600 ${className}`}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={`fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] ${className}`}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;
