import { Badge, type Tone } from '@/components/ui'
import type { SubmissionStatus } from '@/types'
import { SUBMISSION_STATUS_LABEL } from './submissionLabels'

const STATUS_TONES: Record<SubmissionStatus, Tone> = { draft: 'gray', submitted: 'blue', grading: 'yellow', graded: 'green' }

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{SUBMISSION_STATUS_LABEL[status]}</Badge>
}
