import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Unesite validnu email adresu"),
  password: z.string().min(6, "Lozinka mora imati najmanje 6 karaktera"),
});

export const registerSchema = z
  .object({
    full_name: z.string().min(2, "Ime mora imati najmanje 2 karaktera"),
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

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
