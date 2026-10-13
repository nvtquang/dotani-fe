import { z } from 'zod';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { toApiError } from './apiError';

/**
 * Copies the API's per-field validation errors onto the form, so they show under the
 * matching inputs; returns the general message for an Alert/Toast.
 */
export const applyApiErrors = <T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, fallback = 'Có lỗi xảy ra, vui lòng thử lại.') => {
  const apiError = toApiError(error);
  Object.entries(apiError.validationErrors ?? {}).forEach(([field, message]) => setError(field as Path<T>, { type: 'server', message }));
  return apiError.message ?? fallback;
};

export const requiredText = (label: string, max = 255) =>
  z.string().trim().min(1, `Vui lòng nhập ${label}`).max(max, `${label[0].toUpperCase()}${label.slice(1)} tối đa ${max} ký tự`);

export const optionalText = (max = 255) => z.string().trim().max(max, `Tối đa ${max} ký tự`);

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+?\d[\d\s.-]{7,18}\d)?$/, 'Số điện thoại không hợp lệ');

export const emailSchema = z.string().trim().min(1, 'Vui lòng nhập email').pipe(z.email('Email không hợp lệ'));

export const optionalEmailSchema = z.union([z.literal(''), z.string().trim().pipe(z.email('Email không hợp lệ'))]);

/** Same rule as the API: 8-100 characters with at least one letter and one digit. */
export const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu tối thiểu 8 ký tự')
  .max(100, 'Mật khẩu tối đa 100 ký tự')
  .regex(/[A-Za-z]/, 'Mật khẩu cần có chữ cái')
  .regex(/\d/, 'Mật khẩu cần có chữ số');

export const pastDateSchema = (label: string) =>
  z.string().refine((value) => !value || new Date(value) <= new Date(), `${label} không được ở tương lai`);
