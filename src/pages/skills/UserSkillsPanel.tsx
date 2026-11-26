import { useQuery } from '@tanstack/react-query'
import { skillApi } from '@/api'
import { ErrorState, Loading } from '@/components/ui'
import { queryKeys } from '@/lib/queryClient'
import type { UserSkills } from '@/types'
import { formatRelative } from '@/utils/format'

const signed = (n: number) => `${n > 0 ? '+' : ''}${n.toLocaleString('vi-VN')}`

/** Thanh điểm từng kỹ năng (0-100) + thay đổi 30 ngày. */
export function SkillBars({ data }: { data: UserSkills }) {
  return (
    <ul className="skill-bars">
      {data.skills.map((s) => (
        <li key={s.code}>
          <div className="skill-bar-head">
            <span className="skill-name">
              <span className="skill-dot" style={{ background: s.color }} aria-hidden />
              {s.name}
            </span>
            <span className="skill-bar-value">
              <b className="num">{s.value}</b>
              {s.change30d !== 0 && (
                <span className={s.change30d > 0 ? 'up' : 'down'} title="Thay đổi trong 30 ngày">
                  {signed(s.change30d)}
                </span>
              )}
            </span>
          </div>
          <div className="skill-bar-track" aria-hidden>
            <div className="skill-bar-fill" style={{ width: `${s.value}%`, background: s.color }} />
          </div>
          <span className="entity-sub">{s.casesCount} bài được chấm có tác động</span>
        </li>
      ))}
    </ul>
  )
}

/** Bản đồ kỹ năng của một người: tóm tắt, điểm từng kỹ năng, lịch sử thay đổi gần đây. */
export function UserSkillsPanel({ userId, showRecent = true }: { userId: string; showRecent?: boolean }) {
  const query = useQuery({ queryKey: queryKeys.userSkills(userId), queryFn: () => skillApi.userSkills(userId) })
  if (query.isError && !query.data) return <ErrorState error={query.error} onRetry={() => query.refetch()} />
  if (!query.data) return <Loading />
  const d = query.data
  return (
    <div className="user-skills">
      <p className="user-skills-summary">{d.summary}</p>
      {d.skills.length === 0 ? <p className="mo">Chưa có kỹ năng nào đang dùng.</p> : <SkillBars data={d} />}
      {showRecent && d.recent.length > 0 && (
        <>
          <h3 className="growth-heading">Thay đổi gần đây</h3>
          <ul className="skill-recent">
            {d.recent.map((e, i) => (
              <li key={`${e.submissionId}-${e.skillName}-${i}`}>
                <span className="skill-dot" style={{ background: e.skillColor }} aria-hidden />
                <span className="skill-recent-main">
                  <span>
                    {e.skillName} <b className={e.delta > 0 ? 'up' : e.delta < 0 ? 'down' : undefined}>{signed(e.delta)}</b> → {e.after.toLocaleString('vi-VN')}
                  </span>
                  <span className="entity-sub">
                    {e.caseTitle} · {formatRelative(e.createdAt)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
