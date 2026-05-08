export type UserRole = "patient" | "admin";

export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  display_order: number;
}

export interface Appointment {
  id: string;
  patient_id: string | null;
  service_id: string | null;
  starts_at: string;
  ends_at: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  notes: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  walk_in_name: string | null;
  walk_in_phone: string | null;
  admin_notes: string | null;
  created_at: string;
}

export interface AppointmentWithService extends Appointment {
  service: Service | null;
}

export interface WorkingHours {
  id: string;
  day_of_week: number;
  opens_at: string;
  closes_at: string;
  is_closed: boolean;
}

export interface TimeOff {
  id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
}
