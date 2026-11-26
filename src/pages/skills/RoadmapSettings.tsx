import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react'
import { errorMessage, skillApi } from '@/api'
import { Button, ErrorState, Field, FormRow, IconButton, InfoBox, Input, Loading, Segmented, Select, Textarea } from '@/components/ui'
import { useToast } from '@/contexts/toast'
import { queryKeys } from '@/lib/queryClient'
import type { Roadmap, RoadmapGoal, RoadmapStep } from '@/types'
import { ACTION_OPTIONS, GOALS } from './skillLabels'

type StepDraft = Omit<RoadmapStep, 'tags' | 'targetCases'> & { key: number; tags: string; targetCases: string }

let seq = 0
const toDraft = (s: RoadmapStep): StepDraft => ({ ...s, key: ++seq, tags: s.tags.join(', '), targetCases: String(s.targetCases) })

export function RoadmapSettings() {
  const query = useQuery({ queryKey: queryKeys.roadmaps, queryFn: skillApi.roadmaps })
  const [goal, setGoal] = useState<RoadmapGoal>('competition')
  if (query.isError && !query.data) return <ErrorState error={query.error} onRetry={() => query.refetch()} />
  if (!query.data) return <Loading />
  const roadmap = query.data.find((r) => r.goal === goal)
  return (
    <div className="roadmap-settings">
      <InfoBox>
        Mỗi mục tiêu người học chọn ở form hồ sơ (Thi case / Apply intern-MT / Nâng skill) có một lộ trình. Chặng được coi là hoàn thành khi
        người học có đủ số case được chấm (tính dồn từ đầu). Bên cạnh lộ trình, web tự gợi ý 3 case rèn kỹ năng yếu nhất của người học.
      </InfoBox>
      <Segmented options={GOALS.map((g) => ({ value: g.value, label: g.label }))} value={goal} onChange={setGoal} />
      <p className="mo roadmap-goal-hint">{GOALS.find((g) => g.value === goal)?.hint}</p>
      {roadmap && <RoadmapEditor key={`${goal}:${JSON.stringify(roadmap.steps)}`} roadmap={roadmap} />}
    </div>
  )
}

function RoadmapEditor({ roadmap }: { roadmap: Roadmap }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [steps, setSteps] = useState<StepDraft[]>(() => roadmap.steps.map(toDraft))
  const [error, setError] = useState<string | null>(null)

  const update = (key: number, patch: Partial<StepDraft>) => setSteps((l) => l.map((s) => (s.key === key ? { ...s, ...patch } : s)))
  const move = (i: number, dir: -1 | 1) =>
    setSteps((l) => {
      const next = [...l]
      const [it] = next.splice(i, 1)
      next.splice(i + dir, 0, it)
      return next
    })

  const save = useMutation({
    mutationFn: (payload: RoadmapStep[]) => skillApi.saveRoadmap(roadmap.goal, payload),
    onSuccess: (saved) => {
      queryClient.setQueryData<Roadmap[]>(queryKeys.roadmaps, (old) => old?.map((r) => (r.goal === saved.goal ? saved : r)))
      toast.success(`Đã lưu lộ trình ${saved.goalLabel}`)
    },
    onError: (err) => setError(errorMessage(err)),
  })

  const submit = () => {
    setError(null)
    const payload: RoadmapStep[] = steps.map((s) => ({
      title: s.title.trim(),
      description: s.description.trim(),
      weeks: s.weeks.trim(),
      tags: s.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 8),
      targetCases: Number(s.targetCases),
      action: s.action,
    }))
    const bad = payload.findIndex((s) => s.title.length < 2 || !Number.isInteger(s.targetCases) || s.targetCases < 0)
    if (bad >= 0) return setError(`Chặng ${bad + 1}: cần tên chặng (tối thiểu 2 ký tự) và số case là số nguyên ≥ 0`)
    const decreasing = payload.findIndex((s, i) => i > 0 && s.targetCases < payload[i - 1].targetCases)
    if (decreasing > 0) return setError(`Chặng ${decreasing + 1}: số case cần đạt phải không nhỏ hơn chặng trước (tính dồn)`)
    save.mutate(payload)
  }

  return (
    <>
      {error && <div className="field-error">{error}</div>}
      <ol className="roadmap-editor">
        {steps.map((s, i) => (
          <li key={s.key} className="roadmap-step">
            <div className="roadmap-step-head">
              <span className="approval-level">{i + 1}</span>
              <Input value={s.title} maxLength={120} placeholder="Tên chặng, vd: Củng cố kiến thức nền" onChange={(e) => update(s.key, { title: e.target.value })} aria-label={`Tên chặng ${i + 1}`} />
              <div className="approval-editor-tools">
                <IconButton icon={ArrowUp} label="Đưa lên" disabled={i === 0} onClick={() => move(i, -1)} />
                <IconButton icon={ArrowDown} label="Đưa xuống" disabled={i === steps.length - 1} onClick={() => move(i, 1)} />
                <IconButton icon={Trash2} label={`Xoá chặng ${i + 1}`} danger onClick={() => setSteps((l) => l.filter((x) => x.key !== s.key))} />
              </div>
            </div>
            <Field label="Mô tả" htmlFor={`r-desc-${s.key}`}>
              <Textarea id={`r-desc-${s.key}`} rows={2} maxLength={400} value={s.description} onChange={(e) => update(s.key, { description: e.target.value })} />
            </Field>
            <FormRow>
              <Field label="Thời gian" htmlFor={`r-weeks-${s.key}`}>
                <Input id={`r-weeks-${s.key}`} maxLength={40} placeholder="Tuần 1-3" value={s.weeks} onChange={(e) => update(s.key, { weeks: e.target.value })} />
              </Field>
              <Field label="Hoàn thành khi có" htmlFor={`r-target-${s.key}`} hint="Số case được chấm, tính dồn">
                <Input id={`r-target-${s.key}`} type="number" min={0} max={500} suffix="case" value={s.targetCases} onChange={(e) => update(s.key, { targetCases: e.target.value })} />
              </Field>
            </FormRow>
            <FormRow>
              <Field label="Thẻ (cách nhau dấu phẩy)" htmlFor={`r-tags-${s.key}`}>
                <Input id={`r-tags-${s.key}`} placeholder="Data Analysis, Consumer Insight" value={s.tags} onChange={(e) => update(s.key, { tags: e.target.value })} />
              </Field>
              <Field label="Nút hành động" htmlFor={`r-action-${s.key}`}>
                <Select id={`r-action-${s.key}`} value={s.action} options={ACTION_OPTIONS} onChange={(v) => update(s.key, { action: v as StepDraft['action'] })} />
              </Field>
            </FormRow>
          </li>
        ))}
      </ol>
      <div className="growth-actions">
        <Button
          icon={Plus}
          disabled={steps.length >= 10}
          onClick={() =>
            setSteps((l) => [
              ...l,
              toDraft({ title: '', description: '', weeks: '', tags: [], targetCases: (l.length ? Number(l[l.length - 1].targetCases) || 0 : 0) + 3, action: 'cases' }),
            ])
          }
        >
          Thêm chặng
        </Button>
        <Button variant="primary" icon={Save} loading={save.isPending} onClick={submit}>
          Lưu lộ trình
        </Button>
      </div>
    </>
  )
}
