export type UserRole = "admin" | "user" | "staff";

export interface User {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  role: UserRole;
  profile_image_url: string;
  total_bookings: number;
  total_spent: number;
}

export interface UserWithRelations extends User {}

export interface UserFetchProps {
  page_size?: number;
  page?: number;
  name?: string;
  email?: string;
  role?: UserRole;
}
