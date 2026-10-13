import { useState } from 'react';
import { Gavel, Medal, Plus, Trash2 } from 'lucide-react';
import { Alert, Badge, Button, Card, Dialog, Field, Input, LoadingSkeleton, Select, Textarea, useConfirm, useToast } from '../../components/ui';
import { useDeleteAward, useDeleteRating, useEmulationProfile, useRateMember, useSaveAward } from '../../hooks/useEmulation';
import type { AwardForm, AwardFormValues, RatingLevel } from '../../types/emulation';
import { toApiError } from '../../utils/apiError';
import { formatDate, toLocalDateInput } from '../../utils/dateTime';
import { awardFormLabel, ratingLabel } from '../../utils/labels';

const awardForms = Object.keys(awardFormLabel) as AwardForm[];
const ratingLevels = Object.keys(ratingLabel) as RatingLevel[];
const disciplineForms: AwardForm[] = ['REPRIMAND', 'WARNING', 'EXPULSION'];
const currentYear = new Date().getFullYear();

const ratingTone = (rating: RatingLevel) => (rating === 'NOT_COMPLETED' ? 'red' : rating === 'EXCELLENT' ? 'green' : rating === 'GOOD' ? 'blue' : 'gray');

const emptyAward = (): AwardFormValues => ({
  form: 'CERTIFICATE_OF_MERIT',
  title: '',
  reason: '',
  decisionNumber: '',
  decisionDate: toLocalDateInput(new Date()),
  issuer: '',
});

/** Hồ sơ thi đua of one member: yearly ratings, commendations and disciplines; officers in scope edit it. */
export const EmulationSection = ({ memberId }: { memberId?: string | null }) => {
  const toast = useToast();
  const confirm = useConfirm();
  const profileQuery = useEmulationProfile(memberId);
  const saveAward = useSaveAward(memberId ?? '');
  const deleteAward = useDeleteAward();
  const rate = useRateMember();
  const deleteRating = useDeleteRating();
  const [award, setAward] = useState<AwardFormValues | null>(null);
  const [rating, setRating] = useState<{ year: number; rating: RatingLevel; note: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fail = (fallback: string) => (caught: unknown) => setError(toApiError(caught).message ?? fallback);

  if (!memberId) return null;
  const profile = profileQuery.data;
  const canManage = Boolean(profile?.canManage);

  return (
    <Card className="p-4 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900">Hồ sơ thi đua</h2>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => setRating({ year: currentYear, rating: 'GOOD', note: '' })}>
              <Plus size={15} aria-hidden="true" />
              Xếp loại
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setAward(emptyAward())}>
              <Plus size={15} aria-hidden="true" />
              Khen thưởng / kỷ luật
            </Button>
          </div>
        )}
      </div>

      {profileQuery.isLoading && <LoadingSkeleton rows={3} />}
      {profileQuery.isError && <Alert>{toApiError(profileQuery.error).message ?? 'Không thể tải hồ sơ thi đua'}</Alert>}

      {profile && (
        <div className="grid gap-5 md:grid-cols-2">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Đánh giá, xếp loại hằng năm</h3>
            {profile.ratings.length === 0 ? (
              <p className="text-sm text-slate-600">Chưa có kết quả xếp loại.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {profile.ratings.map((item) => (
                  <li key={item.id} className="flex items-start gap-2 py-2">
                    <span className="w-12 shrink-0 font-semibold text-slate-900 tabular-nums">{item.year}</span>
                    <div className="min-w-0 flex-1">
                      <Badge tone={ratingTone(item.rating)}>{ratingLabel[item.rating]}</Badge>
                      {item.note && <p className="mt-1 text-slate-700">{item.note}</p>}
                    </div>
                    {canManage && (
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Xóa xếp loại năm ${item.year}`}
                        onClick={async () => {
                          if (await confirm({ title: `Xóa xếp loại năm ${item.year}?`, confirmLabel: 'Xóa', tone: 'danger' })) {
                            deleteRating.mutate(item.id, { onError: (caught) => toast.error(toApiError(caught).message ?? 'Không xóa được') });
                          }
                        }}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Khen thưởng, kỷ luật</h3>
            {profile.awards.length === 0 ? (
              <p className="text-sm text-slate-600">Chưa có quyết định khen thưởng hay kỷ luật.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {profile.awards.map((item) => (
                  <li key={item.id} className="flex items-start gap-2 py-2">
                    <span className={item.kind === 'DISCIPLINE' ? 'mt-0.5 text-accent-700' : 'mt-0.5 text-brand-700'} aria-hidden="true">
                      {item.kind === 'DISCIPLINE' ? <Gavel size={16} /> : <Medal size={16} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">
                        {awardFormLabel[item.form]}: {item.title}
                      </p>
                      <p className="text-xs text-slate-600">
                        {[item.decisionNumber && `QĐ ${item.decisionNumber}`, formatDate(item.decisionDate), item.issuer].filter(Boolean).join(' · ')}
                      </p>
                      {item.reason && <p className="mt-0.5 text-slate-700">{item.reason}</p>}
                    </div>
                    {canManage && (
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Xóa ${awardFormLabel[item.form]}`}
                        onClick={async () => {
                          if (await confirm({ title: 'Xóa quyết định này?', confirmLabel: 'Xóa', tone: 'danger' })) {
                            deleteAward.mutate(item.id, { onError: (caught) => toast.error(toApiError(caught).message ?? 'Không xóa được') });
                          }
                        }}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <Dialog
        open={Boolean(rating)}
        onClose={() => setRating(null)}
        title="Đánh giá, xếp loại"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRating(null)}>
              Hủy
            </Button>
            <Button
              loading={rate.isPending}
              onClick={() =>
                rating &&
                rate.mutate(
                  { memberId, year: rating.year, rating: rating.rating, note: rating.note.trim() || undefined },
                  {
                    onSuccess: () => {
                      toast.success('Đã lưu xếp loại');
                      setRating(null);
                      setError(null);
                    },
                    onError: fail('Không lưu được xếp loại'),
                  },
                )
              }
            >
              Lưu
            </Button>
          </>
        }
      >
        {error && <Alert className="mb-4">{error}</Alert>}
        {rating && (
          <div className="grid gap-4">
            <Field label="Năm" hint="Xếp loại lại cùng năm sẽ thay kết quả cũ">
              <Select value={rating.year} onChange={(event) => setRating({ ...rating, year: Number(event.target.value) })}>
                {Array.from({ length: 6 }, (_, index) => currentYear - index).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Kết quả">
              <Select value={rating.rating} onChange={(event) => setRating({ ...rating, rating: event.target.value as RatingLevel })}>
                {ratingLevels.map((level) => (
                  <option key={level} value={level}>
                    {ratingLabel[level]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nhận xét">
              <Textarea rows={3} maxLength={1000} value={rating.note} onChange={(event) => setRating({ ...rating, note: event.target.value })} />
            </Field>
          </div>
        )}
      </Dialog>

      <Dialog
        open={Boolean(award)}
        onClose={() => setAward(null)}
        title="Khen thưởng / kỷ luật"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAward(null)}>
              Hủy
            </Button>
            <Button
              loading={saveAward.isPending}
              onClick={() => {
                if (!award) return;
                if (!award.title.trim() || !award.decisionDate) {
                  setError('Nhập nội dung và ngày quyết định.');
                  return;
                }
                saveAward.mutate(
                  { values: award },
                  {
                    onSuccess: () => {
                      toast.success('Đã lưu quyết định');
                      setAward(null);
                      setError(null);
                    },
                    onError: fail('Không lưu được quyết định'),
                  },
                );
              }}
            >
              Lưu
            </Button>
          </>
        }
      >
        {error && <Alert className="mb-4">{error}</Alert>}
        {award && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hình thức" required>
              <Select value={award.form} onChange={(event) => setAward({ ...award, form: event.target.value as AwardForm })}>
                <optgroup label="Khen thưởng">
                  {awardForms.filter((form) => !disciplineForms.includes(form)).map((form) => (
                    <option key={form} value={form}>
                      {awardFormLabel[form]}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Kỷ luật">
                  {disciplineForms.map((form) => (
                    <option key={form} value={form}>
                      {awardFormLabel[form]}
                    </option>
                  ))}
                </optgroup>
              </Select>
            </Field>
            <Field label="Ngày quyết định" required>
              <Input type="date" max={toLocalDateInput(new Date())} value={award.decisionDate} onChange={(event) => setAward({ ...award, decisionDate: event.target.value })} />
            </Field>
            <Field label="Nội dung" required className="sm:col-span-2">
              <Input maxLength={255} value={award.title} onChange={(event) => setAward({ ...award, title: event.target.value })} placeholder="Có thành tích xuất sắc trong Chiến dịch Mùa hè xanh" />
            </Field>
            <Field label="Số quyết định">
              <Input maxLength={100} value={award.decisionNumber} onChange={(event) => setAward({ ...award, decisionNumber: event.target.value })} placeholder="15/QĐ-ĐTN" />
            </Field>
            <Field label="Cấp quyết định">
              <Input maxLength={255} value={award.issuer} onChange={(event) => setAward({ ...award, issuer: event.target.value })} placeholder="BTV Đoàn phường" />
            </Field>
            <Field label="Lý do / ghi chú" className="sm:col-span-2">
              <Textarea rows={3} maxLength={4000} value={award.reason} onChange={(event) => setAward({ ...award, reason: event.target.value })} />
            </Field>
          </div>
        )}
      </Dialog>
    </Card>
  );
};
