import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Calculator, RefreshCw, RotateCcw, Save } from 'lucide-react'
import { errorMessage, xpRulesApi } from '@/api'
import { Button, Card, ConfirmDialog, ErrorState, Field, FormRow, InfoBox, Input, Loading, PageHeader } from '@/components/ui'
import { useToast } from '@/contexts/toast'
import { queryKeys } from '@/lib/queryClient'
import type { XpRules } from '@/types'

const DIFFS = [
  { key: 'easy', label: 'Case dễ' },
  { key: 'medium', label: 'Case trung bình' },
  { key: 'hard', label: 'Case khó' },
] as const

/** Mặc định của hệ thống (khớp API `DEFAULT_XP_RULES`). */
const DEFAULTS: XpRules = { difficulty: { easy: 100, medium: 200, hard: 350 }, bonusMinScore: 8, bonusRatio: 0.5, streakXp: 20 }

/** Level & hạng Gà cố định theo XP tích luỹ: cần 50·L·(L−1) XP để đạt level L. */
const xpForLevel = (level: number) => 50 * level * (level - 1)
const MILESTONES = [
  { label: 'Gà Chiến (Level 6)', xp: xpForLevel(6) },
  { label: 'Gà Tinh Anh (Level 15)', xp: xpForLevel(15) },
]

type Key = 'easy' | 'medium' | 'hard' | 'bonusMinScore' | 'bonusRatio' | 'streakXp'
const LIMITS: Record<Key, { min: number; max: number; int: boolean }> = {
  easy: { min: 0, max: 10000, int: true },
  medium: { min: 0, max: 10000, int: true },
  hard: { min: 0, max: 10000, int: true },
  bonusMinScore: { min: 0, max: 10, int: false },
  bonusRatio: { min: 0, max: 5, int: false },
  streakXp: { min: 0, max: 1000, int: true },
}

const toText = (r: XpRules): Record<Key, string> => ({
  easy: String(r.difficulty.easy),
  medium: String(r.difficulty.medium),
  hard: String(r.difficulty.hard),
  bonusMinScore: String(r.bonusMinScore),
  bonusRatio: String(r.bonusRatio),
  streakXp: String(r.streakXp),
})
const fmt = (n: number) => n.toLocaleString('vi-VN')

/** Luật cộng điểm kinh nghiệm (XP): XP theo độ khó case, thưởng điểm mentor, thưởng chuỗi ngày. */
export function XpRulesPage() {
  const query = useQuery({ queryKey: queryKeys.xpRules, queryFn: xpRulesApi.get })
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Hệ thống' }]}
        title="Luật điểm XP"
        subtitle="Điểm kinh nghiệm quyết định level, hạng Gà và thứ hạng trên bảng Đồng Gà Tinh Anh. Trang web hiển thị đúng luật đang lưu ở đây."
      />
      <Card>
        {query.isError && !query.data ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        ) : !query.data ? (
          <Loading />
        ) : (
          <XpRulesForm key={JSON.stringify(query.data)} initial={query.data} />
        )}
      </Card>
    </>
  )
}

function XpRulesForm({ initial }: { initial: XpRules }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [text, setText] = useState(() => toText(initial))
  const [confirmReapply, setConfirmReapply] = useState(false)

  const num = (k: Key) => Number(text[k])
  const rules: XpRules = {
    difficulty: { easy: num('easy'), medium: num('medium'), hard: num('hard') },
    bonusMinScore: num('bonusMinScore'),
    bonusRatio: num('bonusRatio'),
    streakXp: num('streakXp'),
  }
  const invalid = (Object.keys(LIMITS) as Key[]).filter((k) => {
    const { min, max, int } = LIMITS[k]
    const v = num(k)
    return text[k].trim() === '' || !Number.isFinite(v) || v < min || v > max || (int && !Number.isInteger(v))
  })
  const dirty = JSON.stringify(rules) !== JSON.stringify(initial)
  const isDefault = JSON.stringify(rules) === JSON.stringify(DEFAULTS)

  const save = useMutation({
    mutationFn: (reapply: boolean) => xpRulesApi.save(rules, reapply),
    onSuccess: (saved, reapply) => {
      setConfirmReapply(false)
      queryClient.setQueryData(queryKeys.xpRules, saved)
      toast.success(reapply ? 'Đã lưu luật và đưa việc tính lại XP vào hàng đợi (vài phút)' : 'Đã lưu luật XP. Áp dụng cho các lần nộp / chấm từ giờ.')
    },
    onError: (err) => {
      setConfirmReapply(false)
      toast.error(errorMessage(err))
    },
  })

  const field = (k: Key, label: string, hint: string, opts: { suffix?: string; step?: number } = {}) => (
    <Field label={label} htmlFor={`xp-${k}`} hint={hint}>
      <Input
        id={`xp-${k}`}
        type="number"
        inputMode="decimal"
        min={LIMITS[k].min}
        max={LIMITS[k].max}
        step={opts.step ?? 1}
        suffix={opts.suffix}
        invalid={invalid.includes(k)}
        value={text[k]}
        onChange={(e) => setText((t) => ({ ...t, [k]: e.target.value }))}
      />
    </Field>
  )

  return (
    <div className="growth-settings">
      <InfoBox>
        <b>Cách cộng:</b> mỗi case được cộng XP theo độ khó <b>một lần</b> khi nộp bài đầu tiên (làm lại không cộng thêm, rút hết bài thì trừ lại).
        Mentor chấm từ ngưỡng điểm trở lên thì thưởng thêm <b>tỷ lệ × XP case</b>. Mỗi ngày có nộp bài được cộng XP chuỗi ngày. Level tính theo
        tổng XP: cần 50·L·(L−1) XP để đạt level L (Gà Con 1-5 · Gà Chiến 6-14 · Gà Tinh Anh 15+).
      </InfoBox>

      <div className="growth-grid">
        <div>
          <h3 className="growth-heading">XP giải case theo độ khó</h3>
          <FormRow>
            {DIFFS.map((d) => (
              <div key={d.key}>{field(d.key, d.label, 'Cộng một lần mỗi case', { suffix: 'XP', step: 10 })}</div>
            ))}
          </FormRow>

          <h3 className="growth-heading">Thưởng điểm mentor</h3>
          <FormRow>
            {field('bonusMinScore', 'Ngưỡng điểm', 'Điểm chấm (thang 10) từ mức này trở lên', { suffix: '/10', step: 0.5 })}
            {field('bonusRatio', 'Thưởng thêm', `= ${fmt(Number.isFinite(rules.bonusRatio) ? rules.bonusRatio : 0)} × XP case → tổng ${fmt(1 + (rules.bonusRatio || 0))}×`, {
              suffix: '× XP case',
              step: 0.1,
            })}
          </FormRow>

          <h3 className="growth-heading">Chuỗi ngày luyện</h3>
          <div className="growth-fields">{field('streakXp', 'XP mỗi ngày có nộp bài', 'Tính theo giờ Việt Nam, mỗi ngày một lần', { suffix: 'XP', step: 5 })}</div>

          {invalid.length > 0 && <div className="field-error">Kiểm tra lại các ô bị đánh dấu đỏ (XP là số nguyên, trong khoảng cho phép).</div>}
          <div className="growth-actions">
            <Button variant="primary" icon={Save} loading={save.isPending && !save.variables} disabled={!dirty || invalid.length > 0 || save.isPending} onClick={() => save.mutate(false)}>
              Lưu luật
            </Button>
            <Button icon={RefreshCw} disabled={invalid.length > 0 || save.isPending} onClick={() => setConfirmReapply(true)}>
              Lưu & tính lại XP đã có
            </Button>
            <Button variant="ghost" icon={RotateCcw} disabled={isDefault} onClick={() => setText(toText(DEFAULTS))}>
              Về mặc định
            </Button>
          </div>
        </div>

        <div>
          <h3 className="growth-heading">
            <Calculator size={16} aria-hidden /> Xem trước
          </h3>
          {invalid.length > 0 ? (
            <p className="mo">Sửa các ô lỗi để xem trước.</p>
          ) : (
            <>
              <div className="table-wrap">
                <table className="growth-preview xp-preview">
                  <thead>
                    <tr>
                      <th>Một case</th>
                      <th>Nộp bài</th>
                      <th>Đạt ≥ {fmt(rules.bonusMinScore)}/10</th>
                      {MILESTONES.map((m) => (
                        <th key={m.label}>Số case tới {m.label.split(' (')[0]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DIFFS.map((d) => {
                      const base = rules.difficulty[d.key]
                      const withBonus = base + Math.round(base * rules.bonusRatio)
                      // Mỗi case nộp vào một ngày khác nhau và đạt thưởng mentor
                      const perCase = withBonus + rules.streakXp
                      return (
                        <tr key={d.key}>
                          <td>{d.label}</td>
                          <td>+{fmt(base)}</td>
                          <td className="up">+{fmt(withBonus)}</td>
                          {MILESTONES.map((m) => (
                            <td key={m.label}>{perCase > 0 ? `≈ ${fmt(Math.ceil(m.xp / perCase))}` : '-'}</td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mo xp-preview-note">
                Số case ước tính khi mỗi case đạt thưởng mentor và nộp vào một ngày khác nhau (cộng cả XP chuỗi ngày). Gà Chiến cần {fmt(MILESTONES[0].xp)} XP, Gà
                Tinh Anh cần {fmt(MILESTONES[1].xp)} XP.
              </p>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmReapply}
        title="Lưu và tính lại XP đã có?"
        message={
          <>
            Lưu luật rồi tính lại XP giải case và thưởng mentor của <b>mọi bài đã nộp</b> theo luật mới; bảng xếp hạng tuần / tháng / mùa được dựng
            lại. Phần chênh lệch được ghi vào kỳ hiện tại, nên thứ hạng tuần này có thể thay đổi. XP chuỗi ngày đã cộng được giữ nguyên, XP điều chỉnh
            tay không bị ảnh hưởng.
          </>
        }
        confirmLabel="Lưu & tính lại"
        busy={save.isPending && save.variables === true}
        onClose={() => setConfirmReapply(false)}
        onConfirm={() => save.mutate(true)}
      />
    </div>
  )
}
