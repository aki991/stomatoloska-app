import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Unesite validnu email adresu"),
  password: z.string().min(6, "Lozinka mora imati najmanje 6 karaktera"),
});

export const registerSchema = z
  .object({
    first_name: z.string().min(2, "Ime mora imati najmanje 2 karaktera"),
    last_name: z.string().min(2, "Prezime mora imati najmanje 2 karaktera"),
    email: z.string().email("Unesite validnu email adresu"),
    password: z.string().min(6, "Lozinka mora imati najmanje 6 karaktera"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Lozinke se ne poklapaju",
    path: ["confirm_password"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Unesite validnu email adresu"),
});

export const editProfileSchema = z.object({
  first_name: z.string().min(2, "Ime mora imati najmanje 2 karaktera"),
  last_name: z.string().min(2, "Prezime mora imati najmanje 2 karaktera"),
  phone: z.string().refine(
    (v) => !v || /^[+0-9\s\-()]{7,20}$/.test(v),
    "Unesite validan broj telefona"
  ),
});

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Unesite trenutnu lozinku"),
    new_password: z
      .string()
      .min(8, "Lozinka mora imati najmanje 8 karaktera")
      .regex(/[A-Z]/, "Lozinka mora sadržati najmanje jedno veliko slovo")
      .regex(/[0-9]/, "Lozinka mora sadržati najmanje jedan broj"),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Lozinke se ne poklapaju",
    path: ["confirm_password"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type EditProfileFormData = z.infer<typeof editProfileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
