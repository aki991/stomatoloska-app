export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  notes: string | null;
  created_at: string;
}

export interface Doctor {
  id: string;
  full_name: string;
  specialty: string;
  email: string;
}
