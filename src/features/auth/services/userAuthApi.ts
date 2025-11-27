import { API_ENDPOINTS } from "@/config/endpoints";
import { post } from "@/services/api";

export interface RegisterUserRequest {
  fullName: string;
  email: string;
  password: string;
  accountType?: "user" | "organization";
  organizationName?: string;
  category: string;
  contactEmail?: string;
  profileImage?: string;
  address?: string;
  phoneNumber?: string;
  birthday?: {
    day?: number;
    month?: 'jan' | 'feb' | 'mar' | 'apr' | 'may' | 'jun' | 'jul' | 'aug' | 'sep' | 'oct' | 'nov' | 'dec';
    year?: number;
  };
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  gender?: string; // added optional gender
}

export interface RegisterUserResponse {
  message: string;
  token: string;
  data: {
    fullName: string;
    email: string;
    accountType: string;
    organizationName?: string;
    category: string;
    profileImage?: string;
    contactEmail?: string;
    isVerified?: boolean;
  };
}

export async function registerUser(data: RegisterUserRequest) {
  return post<RegisterUserResponse, RegisterUserRequest>(
    API_ENDPOINTS.USER_AUTH.REGISTER,
    data
  );
}

export interface LoginUserRequest {
  email: string;
  password: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  environmentInfo?:any;
  rememberMe?: boolean;
}

export interface LoginUserResponse {
  message: string;
  token?: string;
  user: {
    _id: string;
    email: string;
    fullName: string;
    accountType: string;
    organizationName?: string;
    isVerified?: boolean;
    phoneNumber?: string;
    profileImage?:string;
  };
}

export async function loginUser(data: LoginUserRequest) {
  return post<LoginUserResponse, LoginUserRequest>(
    API_ENDPOINTS.USER_AUTH.LOGIN,
    data
  );
}
