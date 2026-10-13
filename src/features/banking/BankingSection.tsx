import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { QrCode, Trash2, Upload } from 'lucide-react';
import { Alert, Button, Card, Dialog, Field, Input, LoadingSkeleton } from '../../components/ui';
import { useProtectedImage } from '../../hooks/useProtectedImage';
import type { BankingFormValues, BankingInfo } from '../../types/banking';
import { applyApiErrors, optionalText } from '../../utils/forms';

const schema = z.object({
  bankName: optionalText(255),
  bankCode: optionalText(50),
  accountNumber: z
    .string()
    .trim()
    .max(50, 'Tối đa 50 ký tự')
    .regex(/^[0-9 ]*$/, 'Số tài khoản chỉ gồm chữ số'),
  accountHolderName: optionalText(255),
});

type Values = z.infer<typeof schema>;

const toValues = (banking?: BankingInfo): Values => ({
  bankName: banking?.bankName ?? '',
  bankCode: banking?.bankCode ?? '',
  accountNumber: banking?.accountNumber ?? '',
  accountHolderName: banking?.accountHolderName ?? '',
});

type BankingSectionProps = {
  title?: string;
  banking?: BankingInfo;
  isLoading?: boolean;
  errorMessage?: string | null;
  /** omitted: read-only view (officers looking at a member) */
  edit?: {
    isUploading: boolean;
    isDeleting: boolean;
    onSave: (values: BankingFormValues) => Promise<void>;
    onUploadQr: (file: File) => void;
    onDeleteQr: () => void;
    onError: (message: string) => void;
  };
};

export const BankingSection = ({ title = 'Thông tin ngân hàng', banking, isLoading, errorMessage, edit }: BankingSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const qrUrl = useProtectedImage(banking?.bankQrImageUrl);
  const { register, handleSubmit, reset, setError, formState } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues(banking) });
  const errors = formState.errors;

  useEffect(() => reset(toValues(banking)), [banking, reset]);

  const submit = handleSubmit(async (values) => {
    if (!edit) return;
    try {
      await edit.onSave(values);
    } catch (caught) {
      edit.onError(applyApiErrors(caught, setError, 'Không thể lưu thông tin ngân hàng'));
    }
  });

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">Dùng khi cán bộ cần chuyển khoản hỗ trợ; không phải dịch vụ thanh toán.</p>

      {errorMessage && <Alert className="mt-4">{errorMessage}</Alert>}
      {isLoading ? (
        <div className="mt-4">
          <LoadingSkeleton rows={4} />
        </div>
      ) : (
        <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,1fr)_12rem]">
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit} noValidate>
            <Field label="Ngân hàng" error={errors.bankName?.message}>
              <Input disabled={!edit} {...register('bankName')} />
            </Field>
            <Field label="Mã ngân hàng" error={errors.bankCode?.message}>
              <Input disabled={!edit} {...register('bankCode')} />
            </Field>
            <Field label="Số tài khoản" error={errors.accountNumber?.message}>
              <Input disabled={!edit} inputMode="numeric" {...register('accountNumber')} />
            </Field>
            <Field label="Chủ tài khoản" error={errors.accountHolderName?.message}>
              <Input disabled={!edit} {...register('accountHolderName')} />
            </Field>
            {edit && (
              <div className="sm:col-span-2">
                <Button type="submit" loading={formState.isSubmitting} disabled={!formState.isDirty}>
                  Lưu thông tin ngân hàng
                </Button>
              </div>
            )}
          </form>

          <div className="flex flex-col items-center gap-2">
            <div className="flex aspect-square w-40 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
              {qrUrl ? (
                <button type="button" onClick={() => setIsQrOpen(true)} aria-label="Phóng to mã QR" className="size-full">
                  <img src={qrUrl} alt="Mã QR ngân hàng" className="size-full object-contain" />
                </button>
              ) : (
                <span className="flex flex-col items-center gap-1 text-xs text-slate-600">
                  <QrCode size={28} aria-hidden="true" />
                  Chưa có QR
                </span>
              )}
            </div>
            {edit && (
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  className="sr-only"
                  type="file"
                  tabIndex={-1}
                  aria-hidden="true"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (file) edit.onUploadQr(file);
                  }}
                />
                <Button size="sm" variant="secondary" loading={edit.isUploading} onClick={() => fileInputRef.current?.click()}>
                  <Upload size={16} aria-hidden="true" />
                  {qrUrl ? 'Thay QR' : 'Tải QR'}
                </Button>
                {qrUrl && (
                  <Button size="icon" variant="ghost" loading={edit.isDeleting} onClick={edit.onDeleteQr} aria-label="Xóa QR">
                    <Trash2 size={16} aria-hidden="true" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={isQrOpen && Boolean(qrUrl)} onClose={() => setIsQrOpen(false)} title="Mã QR ngân hàng" size="sm">
        {qrUrl && <img src={qrUrl} alt="Mã QR ngân hàng phóng to" className="mx-auto w-full max-w-xs" />}
      </Dialog>
    </Card>
  );
};
