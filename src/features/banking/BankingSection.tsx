import { FormEvent, useEffect, useRef, useState } from 'react';
import { QrCode, Upload } from 'lucide-react';
import { httpClient } from '../../api/httpClient';
import { EmptyState } from '../../components/ui';
import type { BankingFormValues, BankingInfo } from '../../types/banking';

type BankingSectionProps = {
  title?: string;
  banking?: BankingInfo;
  isLoading?: boolean;
  isEditable?: boolean;
  isSaving?: boolean;
  isUploading?: boolean;
  isDeleting?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  onSave?: (values: BankingFormValues) => void;
  onUploadQr?: (file: File) => void;
  onDeleteQr?: () => void;
};

export const BankingSection = ({
  title = 'Thông tin ngân hàng',
  banking,
  isLoading,
  isEditable,
  isSaving,
  isUploading,
  isDeleting,
  errorMessage,
  successMessage,
  onSave,
  onUploadQr,
  onDeleteQr,
}: BankingSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [values, setValues] = useState<BankingFormValues>({
    bankName: banking?.bankName ?? '',
    bankCode: banking?.bankCode ?? '',
    accountNumber: banking?.accountNumber ?? '',
    accountHolderName: banking?.accountHolderName ?? '',
  });
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    setValues({
      bankName: banking?.bankName ?? '',
      bankCode: banking?.bankCode ?? '',
      accountNumber: banking?.accountNumber ?? '',
      accountHolderName: banking?.accountHolderName ?? '',
    });
  }, [banking]);

  useEffect(() => {
    let objectUrl: string | null = null;
    let isActive = true;

    setQrUrl(null);
    if (!banking?.bankQrImageUrl) {
      return undefined;
    }

    httpClient
      .get<Blob>(banking.bankQrImageUrl, { responseType: 'blob' })
      .then((response) => {
        if (!isActive) {
          return;
        }
        objectUrl = URL.createObjectURL(response.data);
        setQrUrl(objectUrl);
      })
      .catch(() => {
        if (isActive) {
          setQrUrl(null);
        }
      });

    return () => {
      isActive = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [banking?.bankQrImageUrl]);

  const updateField = (field: keyof BankingFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSave?.(values);
  };

  if (isLoading) {
    return <section className="surface section-gap">Đang tải thông tin ngân hàng...</section>;
  }

  return (
    <section className="surface section-gap">
      <div className="section-heading">
        <div>
          <p className="page-eyebrow">QR Banking</p>
          <h2>{title}</h2>
          <p className="page-description">
            QR ngân hàng là thông tin cá nhân phục vụ cán bộ chuyển khoản hỗ trợ, không phải dịch vụ thanh toán.
          </p>
          {banking?.fullName && <p className="page-description">{banking.fullName}</p>}
        </div>
      </div>

      {errorMessage && <div className="error-box">{errorMessage}</div>}
      {successMessage && (
        <div className="success-box" role="status" aria-live="polite">
          {successMessage}
        </div>
      )}

      <div className="banking-layout">
        <form className="member-form" onSubmit={handleSubmit}>
          <label>
            Ngân hàng
            <input
              disabled={!isEditable}
              maxLength={255}
              value={values.bankName ?? ''}
              onChange={(event) => updateField('bankName', event.target.value)}
            />
          </label>
          <label>
            Mã ngân hàng
            <input
              disabled={!isEditable}
              maxLength={50}
              value={values.bankCode ?? ''}
              onChange={(event) => updateField('bankCode', event.target.value)}
            />
          </label>
          <label>
            Số tài khoản
            <input
              disabled={!isEditable}
              maxLength={50}
              value={values.accountNumber ?? ''}
              onChange={(event) => updateField('accountNumber', event.target.value)}
            />
          </label>
          <label>
            Chủ tài khoản
            <input
              disabled={!isEditable}
              maxLength={255}
              value={values.accountHolderName ?? ''}
              onChange={(event) => updateField('accountHolderName', event.target.value)}
            />
          </label>
          {isEditable && (
            <div className="form-actions form-wide">
              <button className="primary-button inline-button" type="submit" disabled={isSaving}>
                Lưu thông tin ngân hàng
              </button>
            </div>
          )}
        </form>

        <div className="qr-panel">
          <div className="qr-preview">
            {qrUrl ? (
              <img src={qrUrl} alt="QR Banking" />
            ) : (
              <EmptyState title="Chưa có QR" description="Tải ảnh QR ngân hàng nếu cần." />
            )}
          </div>
          <div className="form-actions qr-actions">
            {qrUrl && (
              <button className="primary-button inline-button" type="button" onClick={() => setIsQrOpen(true)}>
                <QrCode size={17} aria-hidden="true" />
                Mở QR
              </button>
            )}
            {isEditable && (
              <>
                <input
                  ref={fileInputRef}
                  className="visually-hidden"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      onUploadQr?.(file);
                      event.target.value = '';
                    }
                  }}
                />
                <button
                  className="secondary-button inline-button"
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={17} aria-hidden="true" />
                  {qrUrl ? 'Thay QR' : 'Tải QR'}
                </button>
                <button
                  className="secondary-button inline-button"
                  type="button"
                  disabled={isDeleting || !qrUrl}
                  onClick={onDeleteQr}
                >
                  Xóa QR
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {isQrOpen && qrUrl && (
        <div className="modal-backdrop" role="presentation" onClick={() => setIsQrOpen(false)}>
          <div className="qr-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <img src={qrUrl} alt="QR Banking phóng to" />
            <button className="secondary-button inline-button" type="button" onClick={() => setIsQrOpen(false)}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
