export interface User {
    id: string;
    username: string;
    email: string;
    role: 'sponsor' | 'recipient' | 'restaurant';
    phoneNumber:string
}

export interface Meal {
    id: string;
    name: string;
    description: string;
    price: number;
    restaurantId: string;
}

export interface Restaurant {
    id: string;
    name: string;
    address: string;
    phone: string;
    meals: Meal[];
}

export interface Ticket {
    id: string;
    recipientId: string;
    mealId: string;
    status: 'claimed' | 'pending' | 'completed';
    createdAt: Date;
}

export interface Notification {
    id: string;
    message: string;
    timestamp: Date;
    isRead: boolean;
}