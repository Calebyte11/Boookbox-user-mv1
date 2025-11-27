import * as yup from "yup";

export const recipientDetailSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
  phone: yup
    .string()
    .required("Phone is required")
    .matches(/^[0-9+-]{7,15}$/, "Enter a valid phone number"),
  email: yup
    .string()
    .required("Email is required")
    .email("Enter a valid email address"),
  address: yup.string().optional(),
});

export const orderFormSchema = yup.object().shape({
  bookingType: yup.string().required("Please select a booking type"),
  redemptionMode: yup.string().required("Please select a redemption mode"),
  includeUtensils: yup.boolean().default(false),
  deliveryType: yup.string().when("redemptionMode", {
    is: (val: string) => val === "Delivery" || val === "Pickup",
    then: (schema) => schema.required("Please select an option"),
    otherwise: (schema) => schema.notRequired(),
  }),
  recipientName: yup
    .string()
    .when(["redemptionMode", "deliveryType", "bookingType"], {
      is: (redemptionMode: string, deliveryType: string, bookingType: string) =>
        (redemptionMode === "Delivery" || redemptionMode === "Pickup") &&
        deliveryType === "single" &&
        bookingType !== "public",
      then: (schema) => schema.notRequired(),
      otherwise: (schema) => schema.notRequired(),
    }),
  recipientPhone: yup
    .string()
    .when(["redemptionMode", "deliveryType", "bookingType"], {
      is: (redemptionMode: string, deliveryType: string, bookingType: string) =>
        (redemptionMode === "Delivery" || redemptionMode === "Pickup") &&
        deliveryType === "single" &&
        bookingType !== "public",
      then: (schema) => schema.notRequired(),
      otherwise: (schema) =>
        schema
          // .matches(/^[0-9+-]{7,15}$/, "Enter a valid phone number")
          .notRequired(),
    }),
  recipientEmail: yup
    .string()
    .when(["redemptionMode", "deliveryType", "bookingType"], {
      is: (redemptionMode: string, deliveryType: string, bookingType: string) =>
        (redemptionMode === "Delivery" || redemptionMode === "Pickup") &&
        deliveryType === "single" &&
        bookingType !== "public",
      then: (schema) =>
        schema.email("Enter a valid email address").notRequired(),
      otherwise: (schema) => schema.notRequired(),
    }),
  Contact_Required: yup
    .mixed()
    .when(
      [
        "redemptionMode",
        "deliveryType",
        "bookingType",
        "recipientPhone",
        "recipientEmail",
      ],
      {
        is: (
          redemptionMode: string,
          deliveryType: string,
          bookingType: string,
          recipientPhone: string,
          recipientEmail: string
        ) =>
          (redemptionMode === "Delivery" || redemptionMode === "Pickup") &&
          deliveryType === "single" &&
          bookingType !== "public" &&
          !recipientPhone &&
          !recipientEmail,
        then: (schema) =>
          schema.test(
            "recipient-contact-required",
            "Either recipient phone or email is required",
            function () {
              const { recipientPhone, recipientEmail } = this.parent;
              return !!recipientPhone || !!recipientEmail;
            }
          ),
        otherwise: (schema) => schema.notRequired(),
      }
    ),
  recipientAddress: yup
    .string()
    .when(["redemptionMode", "deliveryType", "bookingType"], {
      is: (redemptionMode: string, deliveryType: string, bookingType: string) =>
        (redemptionMode === "Delivery" || redemptionMode === "Pickup") &&
        deliveryType === "single" &&
        bookingType !== "public",
      then: (schema) => schema.optional(),
      otherwise: (schema) => schema.notRequired(),
    }),
  numberOfRecipients: yup
    .string()
    .when(["redemptionMode", "deliveryType", "bookingType"], {
      is: (redemptionMode: string, deliveryType: string, bookingType: string) =>
        ((redemptionMode === "Delivery" || redemptionMode === "Pickup") &&
          deliveryType === "multiple") ||
        bookingType === "public",
      then: (schema) =>
        schema
          .required("Number of recipients is required")
          .test(
            "is-gte-1",
            "Minimum 1 recipient",
            (value) => !value || parseInt(value, 10) >= 1
          ),
      otherwise: (schema) => schema.notRequired(),
    }),
  multipleRecipients: yup
    .array()
    .when(["redemptionMode", "deliveryType", "bookingType"], {
      is: (redemptionMode: string, deliveryType: string, bookingType: string) =>
        (redemptionMode === "Delivery" || redemptionMode === "Pickup") &&
        deliveryType === "multiple" &&
        bookingType !== "public",
      then: (schema) =>
        schema
          .of(recipientDetailSchema)
          .min(1, "At least one recipient is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
  redemptionDate: yup.date().when("redemptionMode", {
    is: "Pickup",
    then: (schema) => schema.required("Redemption date is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  requestCustomTicketDesign: yup.boolean().required().default(false),
  ticketCustomizationRecipientName: yup
    .string()
    .when("requestCustomTicketDesign", {
      is: true,
      then: (schema) =>
        schema.required("Recipient name is required for custom ticket design"),
      otherwise: (schema) => schema.notRequired(),
    }),
  ticketCustomizationRecipientPhone: yup
    .string()
    .when("requestCustomTicketDesign", {
      is: true,
      then: (schema) =>
        schema
          .required("Phone number is required for custom ticket design")
          .matches(/^[0-9+-]{7,15}$/, "Enter a valid phone number"),
      otherwise: (schema) => schema.notRequired(),
    }),
  ticketCustomizationRecipientEmail: yup
    .string()
    .when("requestCustomTicketDesign", {
      is: true,
      then: (schema) =>
        schema
          .required("Email is required for custom ticket design")
          .email("Enter a valid email address"),
      otherwise: (schema) => schema.notRequired(),
    }),
  ticketCustomizationRecipientAddress: yup
    .string()
    .when("requestCustomTicketDesign", {
      is: true,
      then: (schema) =>
        schema.required("Address is required for custom ticket design"),
      otherwise: (schema) => schema.notRequired(),
    }),
  reason: yup.string().when("bookingType", {
    is: "public",
    then: (schema) => schema.required("Reason is required for public bookings"),
    otherwise: (schema) => schema.notRequired(),
  }),
  publicTags: yup.string().when("bookingType", {
    is: "public",
    then: (schema) => schema.required("Tags are required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  refundable: yup.boolean().default(true),
  supportsMultipleClaims: yup.boolean().default(false),
  autoGenerateTicket: yup.boolean().default(false),
});
