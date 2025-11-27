// filepath: /bookbox-pwa/bookbox-pwa/src/utils/format-utils.ts

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

export const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
};

export const truncateString = (str: string, length: number): string => {
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
};