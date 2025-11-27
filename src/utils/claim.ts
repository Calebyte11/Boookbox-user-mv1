/* eslint-disable @typescript-eslint/no-explicit-any */
  
  /**
   * Determines if a user can claim a booking
   */
  export const canClaimBooking = (user: any, booking: any): boolean => {
    if (!booking || booking.status !== "paid") return false;

    // Helper to check if user is the booker
    const isBooker = (): boolean => {
      const userIds = [user?.id, user?._id].filter(Boolean);
      const bookingOwnerIds = [
        booking.bookedById,
        booking.bookedByUser?._id,
        booking.bookedByUser?.id,
      ].filter(Boolean);

      return userIds.some((userId) => bookingOwnerIds.includes(userId));
    };

    // Helper to check if user matches a recipient
    const isRecipientMatch = (recipient: any): boolean => {
      if (!user || !recipient) return false;

      // Email match
      if (user.email && recipient.email) {
        const userEmail = user.email.toLowerCase().trim();
        const recipientEmail = recipient.email.toLowerCase().trim();
        if (userEmail === recipientEmail) return true;
      }

      // Phone match
      if (user.phoneNumber && recipient.phoneNumber) {
        const userPhone = user.phoneNumber.replace(/\D/g, "");
        const recipientPhone = recipient.phoneNumber.replace(/\D/g, "");
        if (userPhone === recipientPhone) return true;
      }

      // ID match
      const userId = user._id || user.id;
      const recipientId = recipient._id || recipient.id;
      if (userId && recipientId && userId === recipientId) return true;

      return false;
    };

    // Helper to check if user is in contacts
    const isInContacts = (): boolean => {
      const contactArrays = [
        booking.bookedFor?.contact,
        booking.contact,
        booking.contacts,
      ].filter(Boolean);

      for (const contacts of contactArrays) {
        if (Array.isArray(contacts) && contacts.some(isRecipientMatch)) {
          return true;
        }
        if (contacts && !Array.isArray(contacts) && isRecipientMatch(contacts)) {
          return true;
        }
      }
      return false;
    };

    const userIsBooker = isBooker();
    const userInContacts = isInContacts();

    // Public bookings - anyone except booker can claim
    if (
      booking.bookingType === "public" ||
      booking.bookedFor?.type === "public"
    ) {
      // Booker cannot claim public ticket
      return !userIsBooker;
    }

    // Private bookings - only recipients can claim
    if (
      booking.bookingType === "self"
    ) {
      // Booker can claim their own "self" booking
      return userIsBooker || userInContacts;
    }

    if (
      booking.bookingType === "others"
    ) {
      return userInContacts;
    }

    return false;
  };


  /**
   * Checks if there are available slots in a booking
   */
  export const hasAvailableSlots = (booking: any): boolean => {
    if (!booking.supportsMultipleClaims) {
      // Single-claim booking - slotsTaken should be 0
      return booking.slotsTaken === 0;
    }
  
    // Multi-claim booking - check if slotsTaken < numberOfBookings
    const maxSlots = booking.numberOfBookings ?? 1; // Default to 1 if undefined
    return (booking.slotsTaken ?? 0) < maxSlots;
  };
  
  /**
   * Checks if all slots are used up
   */
  export const areAllSlotsUsed = (booking: any): boolean => {
    if (!booking.supportsMultipleClaims) {
      // Single-claim booking - slotsTaken > 0 means used
      return (booking.slotsTaken ?? 0) > 0;
    }
  
    // Multi-claim booking - slotsTaken >= numberOfBookings
    const maxSlots = booking.numberOfBookings ?? 1;
    return (booking.slotsTaken ?? 0) >= maxSlots;
  };