import { z } from 'zod';
import { passwordSchema, refinePasswordAgainstOwner } from './password';

const nameField = z
  .string()
  .trim()
  .min(2, { message: 'Họ và tên phải có ít nhất 2 ký tự.' })
  .max(100, { message: 'Họ và tên không được vượt quá 100 ký tự.' });

const emailField = z
  .string()
  .trim()
  .email({ message: 'Địa chỉ email không đúng định dạng.' })
  .max(150, { message: 'Email không được vượt quá 150 ký tự.' });

export const registerSchema = refinePasswordAgainstOwner(
  z.object({
    name: nameField,
    email: emailField,
    password: passwordSchema,
  })
);

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
  newPassword: passwordSchema,
  currentPassword: z.string().optional(),
});

/**
 * Quản trị viên tạo tài khoản hộ người khác.
 *
 * Trước đây `POST /users` không gắn `validate()` nào, nên tài khoản do quản trị
 * viên tạo có thể mang mật khẩu một ký tự — đúng loại tài khoản hay bị dùng lâu
 * nhất mà không ai đổi.
 */
export const createUserSchema = refinePasswordAgainstOwner(
  z.object({
    name: nameField.optional(),
    email: emailField,
    password: passwordSchema,
    role: z.enum(['admin', 'user']).optional(),
    approved: z.boolean().optional(),
  })
);

/**
 * Cập nhật hồ sơ người dùng.
 *
 * `.strict()` là phần quan trọng nhất ở đây: nó khiến mọi trường lạ bị từ chối
 * thẳng, trong đó có `password`. Trước đây `PUT /users/:id` nhận `password` và
 * băm thẳng mà không hỏi mật khẩu hiện tại, cũng không kiểm tra độ dài — tức là
 * một cửa hậu đi vòng qua toàn bộ `PATCH /users/:id/reset-password`. Đổi mật
 * khẩu nay chỉ còn đúng một đường.
 */
export const updateUserSchema = z
  .object({
    name: nameField.optional(),
    email: emailField.optional(),
    role: z.enum(['admin', 'user']).optional(),
    approved: z.boolean().optional(),
    avatar_url: z.union([z.string().max(1000), z.null()]).optional(),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
