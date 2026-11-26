import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Radar, Save } from 'lucide-react'
import { errorMessage, skillApi } from '@/api'
import { Button, Card, Loading, Segmented } from '@/components/ui'
import { useToast } from '@/contexts/toast'
import { queryKeys } from '@/lib/queryClient'
import type { CaseSkillWeight, Skill } from '@/types'

type Level = '0' | '1' | '2' | '3'
const LEVELS: { value: Level; label: string }[] = [
  { value: '0', label: 'Không' },
  { value: '1', label: 'Ít' },
  { value: '2', label: 'Vừa' },
  { value: '3', label: 'Nhiều' },
]

/**
 * Case rèn kỹ năng nào, mức nào - quyết định kỹ năng nào của người học thay đổi sau khi bài được chấm.
 * Lưu riêng (không đi cùng nút Lưu case). Case mới phải lưu trước.
 */
export function CaseSkillsCard({ caseId }: { caseId: string | null }) {
  const skills = useQuery({ queryKey: queryKeys.skills, queryFn: skillApi.list })
  const weights = useQuery({
    queryKey: queryKeys.caseSkills(caseId ?? ''),
    queryFn: () => skillApi.caseSkills(caseId as string),
    enabled: Boolean(caseId),
  })

  return (
    <Card icon={Radar} title="Kỹ năng rèn luyện" subtitle="Bài được chấm sẽ cộng / trừ điểm các kỹ năng này">
      {!caseId ? (
        <p className="mo">Lưu case trước rồi chọn kỹ năng.</p>
      ) : !skills.data || !weights.data ? (
        <Loading />
      ) : (
        <CaseSkillsForm
          key={JSON.stringify(weights.data)}
          caseId={caseId}
          skills={skills.data.filter((s) => s.isActive)}
          initial={weights.data}
        />
      )}
    </Card>
  )
}

function CaseSkillsForm({ caseId, skills, initial }: { caseId: string; skills: Skill[]; initial: CaseSkillWeight[] }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const start = Object.fromEntries(skills.map((s) => [s.id, String(initial.find((w) => w.skillId === s.id)?.weight ?? 0) as Level]))
  const [levels, setLevels] = useState<Record<string, Level>>(start)
  const dirty = JSON.stringify(levels) !== JSON.stringify(start)

  const save = useMutation({
    mutationFn: () =>
      skillApi.saveCaseSkills(
        caseId,
        Object.entries(levels)
          .filter(([, v]) => v !== '0')
          .map(([skillId, v]) => ({ skillId, weight: Number(v) })),
      ),
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.caseSkills(caseId), saved)
      toast.success('Đã lưu kỹ năng của case')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  if (skills.length === 0)
    return (
      <p className="mo">
        Chưa có kỹ năng nào. <Link to="/skills">Thêm kỹ năng</Link>
      </p>
    )

  const none = Object.values(levels).every((v) => v === '0')
  return (
    <div className="case-skills">
      {skills.map((s) => (
        <div key={s.id} className="case-skill-row">
          <span className="skill-name">
            <span className="skill-dot" style={{ background: s.color }} aria-hidden />
            {s.name}
          </span>
          <Segmented options={LEVELS} value={levels[s.id]} onChange={(v) => setLevels((l) => ({ ...l, [s.id]: v }))} />
        </div>
      ))}
      {none && <p className="mo">Chưa chọn kỹ năng nào: bài của case này cộng nhẹ đều cho mọi kỹ năng.</p>}
      <Button type="button" variant="primary" icon={Save} loading={save.isPending} disabled={!dirty} onClick={() => save.mutate()}>
        Lưu kỹ năng
      </Button>
    </div>
  )
}
