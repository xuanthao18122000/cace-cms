/** Kiểu dữ liệu theo API-CONTRACT.md */

export type UserStatus = 'active' | 'locked'

export interface RoleRef {
  id: string
  code: string
  name: string
}

export interface User {
  id: string
  email: string
  fullName: string
  phone: string | null
  avatarUrl: string | null
  status: UserStatus
  emailVerified: boolean
  role: RoleRef
  isStaff: boolean
  lastLoginAt: string | null
  /** Hạn gói Premium (admin cấp tay); null = freemium */
  premiumUntil?: string | null
  /** premiumUntil > now */
  isPremium?: boolean
  createdAt: string
  updatedAt: string
}

export interface Role {
  id: string
  code: string
  name: string
  description: string | null
  isSystem: boolean
  userCount: number
  createdAt: string
  updatedAt: string
}

export interface AuthResult {
  accessToken: string
  expiresIn: number
  user: User
}

export interface Paged<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface AdminStats {
  totalUsers: number
  activeUsers: number
  lockedUsers: number
  newUsersLast7Days: number
  totalRoles: number
  usersByRole: { roleId: string; name: string; count: number }[]
}

export interface UploadResult {
  url: string
  key: string
  size: number
  mimeType: string
}

/* ---------- Dữ liệu gửi lên ---------- */

export interface LoginInput {
  email: string
  password: string
}

export interface UpdateProfileInput {
  fullName?: string
  phone?: string | null
  avatarUrl?: string | null
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export interface UserListQuery {
  page: number
  pageSize: number
  search?: string
  roleId?: string
  status?: UserStatus | ''
}

export interface CreateUserInput {
  email: string
  fullName: string
  password: string
  roleId: string
  phone?: string
  status?: UserStatus
  avatarUrl?: string | null
}

export interface UpdateUserInput {
  fullName?: string
  phone?: string | null
  roleId?: string
  status?: UserStatus
  avatarUrl?: string | null
}

export interface RoleInput {
  code: string
  name: string
  description?: string | null
}

/* ---------- Rèn luyện (giai đoạn 2) ---------- */

export type TaxonomyType = 'field' | 'industry' | 'level'
export type Difficulty = 'easy' | 'medium' | 'hard'
/** Hình thức giải case */
export type CaseMode = 'individual' | 'team' | 'both'
export type CaseStatus = 'draft' | 'published' | 'hidden'

export interface Taxonomy {
  id: string
  type: TaxonomyType
  name: string
  slug: string
  description: string | null
  sortOrder: number
  isActive: boolean
  caseCount: number
}

export interface TaxonomyRef {
  id: string
  name: string
  slug: string
}

export interface AdminCase {
  id: string
  slug: string
  title: string
  summary: string
  company: string | null
  coverUrl: string | null
  difficulty: Difficulty
  estimatedMinutes: number | null
  /** Hình thức giải: cá nhân / nhóm / cả hai */
  mode?: CaseMode
  field: TaxonomyRef | null
  industry: TaxonomyRef | null
  level: TaxonomyRef | null
  isFeatured: boolean
  /** Miễn phí cho người chưa có Premium (freemium) */
  isFree?: boolean
  hasPdf: boolean
  viewCount: number
  publishedAt: string | null
  content: string
  pdfUrl: string | null
  pdfName: string | null
  pdfSize: number | null
  status: CaseStatus
  createdBy: { id: string; fullName: string } | null
  createdAt: string
  updatedAt: string
  /* Giai đoạn 3: làm bài */
  maxAttempts: number | null
  editWindowMinutes: number
  criteria: Criterion[]
  solutionContent: string
  solutionPdfUrl: string | null
  solutionPdfName: string | null
  submissionCount: number
}

/** Danh sách quản trị không trả nội dung đề, dẫn giải, tiêu chí */
export type AdminCaseItem = Omit<AdminCase, 'content' | 'solutionContent' | 'criteria'>

export interface DocumentUploadResult extends UploadResult {
  originalName: string
}

export interface TaxonomyInput {
  type: TaxonomyType
  name: string
  description?: string | null
  sortOrder?: number
  isActive?: boolean
}

export interface CaseListQuery {
  page: number
  pageSize: number
  search?: string
  status?: CaseStatus | ''
  fieldId?: string
  industryId?: string
  levelId?: string
  difficulty?: Difficulty | ''
  featured?: boolean
}

export interface CaseInput {
  title: string
  slug?: string
  summary: string
  content?: string
  company?: string | null
  coverUrl?: string | null
  pdfUrl?: string | null
  pdfName?: string | null
  pdfSize?: number | null
  difficulty: Difficulty
  estimatedMinutes?: number | null
  mode?: CaseMode
  fieldId?: string | null
  industryId?: string | null
  levelId?: string | null
  status?: CaseStatus
  isFeatured?: boolean
  isFree?: boolean
  maxAttempts?: number | null
  editWindowMinutes?: number
  solutionContent?: string
  solutionPdfUrl?: string | null
  solutionPdfName?: string | null
  /** Gửi = thay toàn bộ tiêu chí */
  criteria?: CriterionInput[]
}

/* ---------- Giải case & nộp bài (giai đoạn 3) ---------- */

export type SubmissionStatus = 'draft' | 'submitted' | 'grading' | 'graded'

export interface Criterion {
  id: string
  name: string
  description: string | null
  weight: number
  maxScore: number
  sortOrder: number
}

export interface CriterionInput {
  name: string
  description?: string | null
  weight: number
  maxScore?: number
}

export interface Attachment {
  url: string
  name: string
  size: number
  mimeType: string
}

export interface SelfAssessmentItem {
  criterionId: string
  score: number
  note: string | null
}

export interface AdminSubmission {
  id: string
  attemptNo: number
  status: SubmissionStatus
  case: { id: string; slug: string; title: string; company: string | null; coverUrl: string | null }
  user: { id: string; fullName: string; email: string; avatarUrl: string | null }
  wordCount: number
  attachmentCount: number
  submittedAt: string | null
  editableUntil: string | null
  canEdit: boolean
  canWithdraw: boolean
  selfAssessed: boolean
  /** Điểm tự đánh giá quy về thang 10, theo trọng số */
  selfScore: number | null
  /** Điểm chấm quy về thang 10, theo trọng số (CMS thấy cả điểm nháp) */
  score: number | null
  createdAt: string
  updatedAt: string
}

export interface GradeItem {
  criterionId: string
  score: number
  comment: string | null
}

export type GradeSource = 'mentor' | 'ai'

export interface SubmissionGrade {
  score: number
  items: GradeItem[]
  feedback: string | null
  source: GradeSource
  grader: { id: string; fullName: string; avatarUrl: string | null } | null
  /** null = bản nháp, người học chưa thấy */
  gradedAt: string | null
}

export interface AdminSubmissionDetail extends AdminSubmission {
  content: string
  attachments: Attachment[]
  criteria: Criterion[]
  selfAssessment: SelfAssessmentItem[] | null
  solution: { content: string; pdfUrl: string | null; pdfName: string | null } | null
  grade: SubmissionGrade | null
  /** false khi người học còn được rút bài (trong hạn editableUntil) hoặc bài còn nháp */
  canGrade: boolean
}

export interface GradeInput {
  /** Đủ mỗi tiêu chí đúng một mục */
  items: { criterionId: string; score: number; comment?: string | null }[]
  feedback?: string | null
  /** true = trả kết quả (graded); false = lưu nháp (grading) */
  publish: boolean
}

export interface SubmissionListQuery {
  page: number
  pageSize: number
  search?: string
  /** Bỏ trống: mọi trạng thái trừ nháp */
  status?: SubmissionStatus | ''
  caseId?: string
}

/* ---------- Cuộc thi ---------- */

/** pending: đề xuất của người dùng chờ duyệt; rejected: đã từ chối (người gửi sửa và gửi lại thì về pending) */
export type CompetitionStatus = 'draft' | 'published' | 'hidden' | 'pending' | 'rejected'
/** Trạng thái đổi được qua PATCH; pending/rejected chỉ đi qua duyệt / từ chối */
export type EditableCompetitionStatus = 'draft' | 'published' | 'hidden'
/** Tính từ thời gian đăng ký: closing = còn ≤ 7 ngày */
export type CompetitionPhase = 'soon' | 'open' | 'closing' | 'closed'

export interface AdminCompetition {
  id: string
  slug: string
  name: string
  organizer: string
  summary: string
  /** HTML đã được máy chủ làm sạch */
  content: string
  coverUrl: string | null
  field: string | null
  prize: string | null
  teamMin: number | null
  teamMax: number | null
  location: string | null
  registerUrl: string | null
  /** null = mở đăng ký ngay */
  registrationOpensAt: string | null
  registrationDeadline: string
  eventDate: string | null
  phase: CompetitionPhase
  isFeatured: boolean
  status: CompetitionStatus
  /** Người đề xuất; null = admin tạo */
  submittedBy: { id: string; fullName: string; email: string } | null
  /** Người gửi là thành viên ban tổ chức (ngược lại: người dùng giới thiệu) */
  submitterIsOrganizer: boolean
  /** Lời nhắn của người gửi */
  submitterNote: string | null
  /** Lý do từ chối */
  reviewNote: string | null
  reviewedAt: string | null
  reviewedByName: string | null
  publishedAt: string | null
  createdByName: string | null
  createdAt: string
  updatedAt: string
  /** Ngày bắt đầu diễn ra (eventDate = ngày kết thúc) */
  eventStartDate: string | null
  audience: CompetitionAudience | null
  format: CompetitionFormat | null
  participation: CompetitionParticipation | null
  scale: CompetitionScale | null
  rounds: CompetitionRound[] | null
  prizes: CompetitionPrizes | null
  contact: CompetitionContact | null
  fanpageUrl: string | null
}

export type CompetitionAudience = 'university' | 'highschool' | 'all'
export type CompetitionFormat = 'online' | 'offline' | 'hybrid'
export type CompetitionParticipation = 'individual' | 'team' | 'both'
export type CompetitionScale = 'school' | 'south' | 'north' | 'central' | 'national'
export interface CompetitionRound {
  name: string
  format: string
  startDate: string
  endDate: string
  description?: string | null
}
/** VND */
export interface CompetitionPrizes {
  first: number
  second: number
  third: number
  note?: string | null
}
export interface CompetitionContact {
  name: string
  role: string
  phone: string
  email: string
  address: string
}

export interface CompetitionListQuery {
  page: number
  pageSize: number
  search?: string
  status?: CompetitionStatus | ''
  phase?: CompetitionPhase | ''
  /** true: chỉ đề xuất của người dùng; false: chỉ cuộc thi admin tạo */
  proposed?: boolean | ''
}

/** Trường tuỳ chọn: gửi "" hoặc null để xoá */
export interface CompetitionInput {
  name: string
  organizer: string
  summary: string
  registrationDeadline: string
  slug?: string
  content?: string
  coverUrl?: string | null
  field?: string | null
  prize?: string | null
  teamMin?: number | null
  teamMax?: number | null
  location?: string | null
  registerUrl?: string | null
  registrationOpensAt?: string | null
  eventDate?: string | null
  status?: EditableCompetitionStatus
  isFeatured?: boolean
  eventStartDate?: string | null
  audience?: CompetitionAudience | null
  format?: CompetitionFormat | null
  participation?: CompetitionParticipation | null
  scale?: CompetitionScale | null
  rounds?: CompetitionRound[] | null
  prizes?: CompetitionPrizes | null
  contact?: CompetitionContact | null
  fanpageUrl?: string | null
}

/* ---------- Tìm Đồng Gà (tin tìm đồng đội) ---------- */

/** hidden: admin ẩn khỏi web, chủ tin vẫn thấy trong mục của họ */
export type TeamPostStatus = 'open' | 'closed' | 'paused' | 'hidden'
export type TeamPostRole = 'research' | 'finance' | 'strategy' | 'slide' | 'marketing'
export type TeamPostSlot = 'weekday-evening' | 'weekend' | 'flexible'

export interface AdminTeamPost {
  id: string
  title: string
  excerpt: string
  description: string
  owner: { id: string; fullName: string; avatarUrl: string | null; school: string | null; level: number; tier: string }
  ownerEmail: string
  /** null = luyện case, không gắn cuộc thi */
  competition: { id: string; slug: string; name: string; coverUrl: string | null; registrationDeadline: string; phase: CompetitionPhase } | null
  rolesNeeded: string[]
  slots: string[]
  teamSize: number
  memberCount: number
  status: TeamPostStatus
  createdAt: string
}

export interface TeamPostListQuery {
  page: number
  pageSize: number
  /** Tìm theo tiêu đề, tên hoặc email chủ tin */
  q?: string
  status?: TeamPostStatus | ''
}

/* ---------- Cấu hình duyệt ---------- */

/** Loại tính năng cần duyệt (khớp enum `approval_type` của API). */
export type ApprovalType = 'competition_proposal' | 'learner_profile'

export interface Approver {
  id: string
  fullName: string
  email: string
  avatarUrl: string | null
  avatarColor: string | null
  roleName: string
}

export interface ApprovalStep {
  level: number
  name: string
  approvers: Approver[]
}

export interface ApprovalFlow {
  type: ApprovalType
  name: string
  description: string
  /** false = chưa cấu hình hoặc đang tắt → duyệt mặc định một bước */
  isActive: boolean
  configured: boolean
  steps: ApprovalStep[]
  updatedAt: string | null
}

export interface ApprovalFlowInput {
  isActive: boolean
  steps: { name: string; approverIds: string[] }[]
}

export type ApprovalRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface ApprovalRequest {
  id: string
  type: ApprovalType
  targetId: string
  title: string
  status: ApprovalRequestStatus
  currentLevel: number
  totalLevels: number
  steps: ApprovalStep[]
  actions: { level: number; decision: 'approve' | 'reject'; note: string | null; actorName: string; createdAt: string }[]
  /** Người đang xem thuộc cấp duyệt hiện tại */
  canAct: boolean
  createdAt: string
}

// ── Kỹ năng & lộ trình ──

export interface Skill {
  id: string
  code: string
  name: string
  description: string | null
  icon: string
  color: string
  sortOrder: number
  isActive: boolean
}

export interface SkillInput {
  code?: string
  name?: string
  description?: string | null
  icon?: string
  color?: string
  sortOrder?: number
  isActive?: boolean
}

/** Một dòng tổng quan kỹ năng người học (CMS). */
export interface SkillOverviewRow {
  user: { id: string; fullName: string; email: string; avatarUrl: string | null; avatarColor: string | null; school: string | null; status: string }
  /** Điểm 0-100 theo mã kỹ năng */
  values: Record<string, number>
  average: number
  gradedCases: number
  strongest: string | null
  weakest: string | null
  lastChangedAt: string | null
}

export interface SkillOverviewQuery {
  page: number
  pageSize: number
  search?: string
  sort?: string
}

/** Bản đồ kỹ năng của một người. */
export interface UserSkills {
  skills: { code: string; name: string; icon: string; color: string; value: number; casesCount: number; change30d: number }[]
  gradedCases: number
  strongest: string | null
  weakest: string | null
  summary: string
  recent: { skillName: string; skillColor: string; caseTitle: string; submissionId: string; delta: number; after: number; createdAt: string }[]
}

/** Luật cộng XP (bảng xếp hạng Đồng Gà Tinh Anh, level, hạng Gà). */
export interface XpRules {
  difficulty: { easy: number; medium: number; hard: number }
  bonusMinScore: number
  bonusRatio: number
  streakXp: number
}

export interface SkillGrowth {
  initialValue: number
  learningRate: number
  difficulty: { easy: number; medium: number; hard: number }
  maxGain: number
  maxLoss: number
  lossFactor: number
  repeatFactor: number
  groupFactor: number
}

export interface GrowthPreviewRow {
  current: number
  score: number
  difficulty: 'easy' | 'medium' | 'hard'
  delta: number
}

export type RoadmapGoal = 'competition' | 'mt' | 'practice'
export type RoadmapAction = 'cases' | 'co_solving' | 'competitions' | 'profile'

export interface RoadmapStep {
  title: string
  description: string
  weeks: string
  tags: string[]
  targetCases: number
  action: RoadmapAction
}

export interface Roadmap {
  goal: RoadmapGoal
  goalLabel: string
  steps: RoadmapStep[]
}

export interface CaseSkillWeight {
  skillId: string
  weight: number
}

// ── Hồ sơ rèn luyện ──

export type LearnerReviewStatus = 'none' | 'pending' | 'approved' | 'rejected'
export type LearnerType = 'university' | 'high_school' | 'working'

export interface AdminLearnerProfile {
  user: { id: string; fullName: string; avatarUrl: string | null; avatarColor: string | null; school: string | null }
  email: string
  isLooking: boolean
  roles: string[]
  goals: RoadmapGoal[]
  slots: string[]
  bio: string | null
  level: number
  tier: string
  casesSolved: number
  mentorScore: number | null
  learnerType: LearnerType | null
  major: string | null
  interests: string[]
  focusSkills: string[]
  reviewStatus: LearnerReviewStatus
  reviewNote: string | null
  submittedAt: string | null
  reviewedAt: string | null
}

export interface LearnerProfileListQuery {
  page?: number
  pageSize?: number
  q?: string
  status?: LearnerReviewStatus | ''
  user?: string
}
