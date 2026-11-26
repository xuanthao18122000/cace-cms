import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Calculator, RefreshCw, Save } from 'lucide-react'
import { errorMessage, skillApi } from '@/api'
import { Button, ConfirmDialog, ErrorState, Field, FormRow, InfoBox, Input, Loading } from '@/components/ui'
import { useToast } from '@/contexts/toast'
import { queryKeys } from '@/lib/queryClient'
import type { SkillGrowth } from '@/types'
import { DIFFICULTY_LABEL, skillDelta } from './skillLabels'

type NumKey = Exclude<keyof SkillGrowth, 'difficulty'>

const FIELDS: { key: NumKey; label: string; hint: string; min: number; max: number; step: number }[] = [
  { key: 'initialValue', label: 'Điểm khởi đầu', hint: 'Mọi kỹ năng bắt đầu từ mức này (0-100)', min: 0, max: 100, step: 1 },
  { key: 'learningRate', label: 'Tốc độ học (k)', hint: 'Mỗi bài kéo điểm về gần hiệu suất bao nhiêu phần (0.01-1)', min: 0.01, max: 1, step: 0.05 },
  { key: 'maxGain', label: 'Tăng tối đa / bài', hint: 'Giới hạn điểm cộng của một kỹ năng sau một bài', min: 0, max: 50, step: 1 },
  { key: 'maxLoss', label: 'Giảm tối đa / bài', hint: 'Giới hạn điểm trừ của một kỹ năng sau một bài', min: 0, max: 50, step: 1 },
  { key: 'lossFactor', label: 'Hệ số giảm', hint: 'Giảm chậm hơn tăng: phần giảm nhân hệ số này (0-1)', min: 0, max: 1, step: 0.1 },
  { key: 'repeatFactor', label: 'Hệ số làm lại', hint: 'Làm lại case đã từng được chấm: thay đổi nhân hệ số này', min: 0, max: 1, step: 0.1 },
  { key: 'groupFactor', label: 'Hệ số giải nhóm', hint: 'Bài giải case nhóm: mỗi thành viên nhận thay đổi nhân hệ số này', min: 0, max: 1, step: 0.1 },
]

const DIFFS = ['easy', 'medium', 'hard'] as const

export function GrowthSettings() {
  const query = useQuery({ queryKey: queryKeys.skillGrowth, queryFn: skillApi.growth })
  if (query.isError && !query.data) return <ErrorState error={query.error} onRetry={() => query.refetch()} />
  if (!query.data) return <Loading />
  return <GrowthForm key={JSON.stringify(query.data.config)} initial={query.data.config} />
}

function GrowthForm({ initial }: { initial: SkillGrowth }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  // Giữ chuỗi người dùng gõ để ô số không nhảy khi đang sửa
  const [text, setText] = useState<Record<string, string>>(() => ({
    ...Object.fromEntries(FIELDS.map((f) => [f.key, String(initial[f.key])])),
    easy: String(initial.difficulty.easy),
    medium: String(initial.difficulty.medium),
    hard: String(initial.difficulty.hard),
  }))
  const [confirmRecompute, setConfirmRecompute] = useState(false)

  const num = (k: string) => Number(text[k])
  const cfg: SkillGrowth = {
    initialValue: num('initialValue'),
    learningRate: num('learningRate'),
    difficulty: { easy: num('easy'), medium: num('medium'), hard: num('hard') },
    maxGain: num('maxGain'),
    maxLoss: num('maxLoss'),
    lossFactor: num('lossFactor'),
    repeatFactor: num('repeatFactor'),
    groupFactor: num('groupFactor'),
  }
  const invalid = [...FIELDS.map((f) => [f.key, f.min, f.max] as const), ...DIFFS.map((d) => [d, 0.1, 3] as const)].filter(
    ([k, min, max]) => text[k].trim() === '' || !Number.isFinite(num(k)) || num(k) < min || num(k) > max,
  )
  const dirty = JSON.stringify(cfg) !== JSON.stringify(initial)

  const save = useMutation({
    mutationFn: () => skillApi.saveGrowth(cfg),
    onSuccess: (res) => {
      queryClient.setQueryData(queryKeys.skillGrowth, res)
      toast.success('Đã lưu cấu hình. Áp dụng cho các bài chấm từ giờ.')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
  const recompute = useMutation({
    mutationFn: skillApi.recompute,
    onSuccess: (r) => {
      setConfirmRecompute(false)
      toast.success(`Đã tính lại điểm kỹ năng từ ${r.submissions} bài đã chấm`)
    },
    onError: (err) => {
      setConfirmRecompute(false)
      toast.error(errorMessage(err))
    },
  })

  return (
    <div className="growth-settings">
      <InfoBox>
        <b>Cách tính:</b> hiệu suất = điểm bài (0-10) × 10 × hệ số độ khó (tối đa 100). Thay đổi = k × (trọng số kỹ năng của case ÷ 3) ×
        (hiệu suất − điểm hiện tại). Bài tốt hơn mức hiện tại thì kỹ năng tăng, kém hơn thì giảm nhẹ (nhân hệ số giảm). Case chưa gán kỹ năng
        tác động nhẹ (trọng số 1) tới mọi kỹ năng. Chấm lại / thu hồi kết quả thì thay đổi cũ của bài được hoàn tác.
      </InfoBox>

      <div className="growth-grid">
        <div>
          <h3 className="growth-heading">Tham số</h3>
          <div className="growth-fields">
            {FIELDS.map((f) => (
              <Field key={f.key} label={f.label} htmlFor={`g-${f.key}`} hint={f.hint}>
                <Input
                  id={`g-${f.key}`}
                  type="number"
                  inputMode="decimal"
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  invalid={invalid.some(([k]) => k === f.key)}
                  value={text[f.key]}
                  onChange={(e) => setText((t) => ({ ...t, [f.key]: e.target.value }))}
                />
              </Field>
            ))}
          </div>
          <h3 className="growth-heading">Hệ số độ khó</h3>
          <FormRow>
            {DIFFS.map((d) => (
              <Field key={d} label={DIFFICULTY_LABEL[d]} htmlFor={`g-${d}`}>
                <Input
                  id={`g-${d}`}
                  type="number"
                  inputMode="decimal"
                  min={0.1}
                  max={3}
                  step={0.05}
                  invalid={invalid.some(([k]) => k === d)}
                  value={text[d]}
                  onChange={(e) => setText((t) => ({ ...t, [d]: e.target.value }))}
                />
              </Field>
            ))}
          </FormRow>
          {invalid.length > 0 && <div className="field-error">Kiểm tra lại các ô bị đánh dấu đỏ (ngoài khoảng cho phép).</div>}
          <div className="growth-actions">
            <Button variant="primary" icon={Save} loading={save.isPending} disabled={!dirty || invalid.length > 0} onClick={() => save.mutate()}>
              Lưu cấu hình
            </Button>
            <Button icon={RefreshCw} onClick={() => setConfirmRecompute(true)}>
              Tính lại điểm từ các bài đã chấm
            </Button>
          </div>
        </div>

        <div>
          <h3 className="growth-heading">
            <Calculator size={16} aria-hidden /> Xem trước (case rèn kỹ năng ở mức "nhiều")
          </h3>
          {invalid.length > 0 ? (
            <p className="mo">Sửa các ô lỗi để xem trước.</p>
          ) : (
            <div className="table-wrap">
              <table className="growth-preview">
                <thead>
                  <tr>
                    <th>Đang ở</th>
                    <th>Điểm bài</th>
                    {DIFFS.map((d) => (
                      <th key={d}>{DIFFICULTY_LABEL[d]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[20, 50, 80].flatMap((current) =>
                    [4, 6, 8, 9.5].map((score, i) => (
                      <tr key={`${current}-${score}`} className={i === 0 ? 'group-start' : undefined}>
                        <td>{i === 0 ? <b>{current}</b> : ''}</td>
                        <td>{score.toLocaleString('vi-VN')}/10</td>
                        {DIFFS.map((d) => {
                          const v = skillDelta(cfg, { current, score, difficulty: d, weight: 3 })
                          return (
                            <td key={d} className={v > 0 ? 'up' : v < 0 ? 'down' : undefined}>
                              {v > 0 ? '+' : ''}
                              {v.toLocaleString('vi-VN')}
                            </td>
                          )
                        })}
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmRecompute}
        title="Tính lại toàn bộ điểm kỹ năng?"
        message="Xoá điểm và lịch sử kỹ năng hiện có, rồi áp lại mọi bài đã trả kết quả theo cấu hình đang lưu và trọng số kỹ năng của từng case. Nên lưu cấu hình trước khi tính lại."
        confirmLabel="Tính lại"
        busy={recompute.isPending}
        onClose={() => setConfirmRecompute(false)}
        onConfirm={() => recompute.mutate()}
      />
    </div>
  )
}
