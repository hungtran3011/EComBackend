import { z } from "zod";

/**
 * @name UserSchema
 * @author hungtran3011
 * @description Schema viết bằng Zod để xác thực và kiểm tra tính hợp lệ của dữ liệu người dùng trước khi thực hiện các thao tác CRUD trong hệ thống. Schema này đảm bảo tất cả dữ liệu người dùng đều tuân thủ cấu trúc và ràng buộc đã định nghĩa.
 */
export const UserValidationSchema = z.object({
  id: z.string().optional(),
  name: z.string()
    .min(1, "Tên không được để trống")
    .transform(val => val.trim()),
  email: z.string()
    .email("Email không hợp lệ")
    .optional()
    .transform(val => val ? val.trim().toLowerCase() : undefined),
  phoneNumber: z.string()
    .min(1, "Số điện thoại không được để trống")
    .transform(val => val.trim()),
  address: z.object({
    homeNumber: z.string().optional(),
    street: z.string().optional(),
    district: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    province: z.string().optional()
  }).optional(),
  role: z.enum(["customer", "admin", "anon"]).optional(),
  avatarUrl: z.string().optional(),
  isRegistered: z.boolean().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});