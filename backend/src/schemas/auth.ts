import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Họ và tên phải có ít nhất 2 ký tự.' })
    .max(100, { message: 'Họ và tên không được vượt quá 100 ký tự.' }),
  email: z
    .string()
    .trim()
    .email({ message: 'Địa chỉ email không đúng định dạng.' })
    .max(150, { message: 'Email không được vượt quá 150 ký tự.' }),
  password: z
    .string()
    .min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự.' })
    .max(100, { message: 'Mật khẩu không được vượt quá 100 ký tự.' }),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: 'Địa chỉ email không đúng định dạng.' }),
  password: z
    .string()
    .min(1, { message: 'Vui lòng nhập mật khẩu.' }),
});

export const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' })
    .max(100, { message: 'Mật khẩu không được vượt quá 100 ký tự.' }),
  currentPassword: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
