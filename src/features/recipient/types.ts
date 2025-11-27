// filepath: /bookbox-pwa/bookbox-pwa/src/features/recipient/types/index.ts

export interface Recipient {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    profilePictureUrl?: string;
    mealsReceived: Meal[];
}

export interface Meal {
    id: string;
    name: string;
    description: string;
    restaurantId: string;
    dateClaimed: Date;
    status: 'claimed' | 'pending' | 'completed';
}