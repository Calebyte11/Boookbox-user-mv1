export const generateShareableLink = (menuId: string, restaurantId: string): string => {
  const baseUrl = window.location.origin;
  // Changed from / to /friend-request
  return `${baseUrl}/friend-request?packageId=${menuId}&restaurantId=${restaurantId}&source=friend_request`;
};

export const shareToWhatsApp = (link: string): void => {
  const message = encodeURIComponent(`Hey! I'd love this meal package: ${link}`);
  window.open(`https://wa.me/?text=${message}`, '_blank');
};

export const shareToFacebook = (link: string): void => {
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
    '_blank'
  );
};

export const shareToSMS = (link: string): void => {
  const message = encodeURIComponent(`Hey! I'd love this meal package: ${link}`);
  window.open(`sms:?body=${message}`);
};

export const shareToTwitter = (link: string, text: string = 'Check out this amazing meal package!'): void => {
  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`,
    '_blank'
  );
};

export const shareToEmail = (link: string, subject: string = 'Check out this meal package'): void => {
  const body = encodeURIComponent(`Hey! I'd love this meal package: ${link}`);
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;
};