import { lazy } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { GuestOnly, RequireAdmin, RequireAuth, RequireContentAccess } from '@/components/layout/RouteGuards'
import { AuthProvider } from '@/contexts/AuthProvider'
import { ToastProvider } from '@/contexts/ToastProvider'
import { queryClient } from '@/lib/queryClient'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

// Tách gói theo trang: trang đăng nhập tải nhanh, trang quản trị tải khi cần (trình soạn thảo Tiptap nằm riêng gói trang sửa case)
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const RolesPage = lazy(() => import('@/pages/roles/RolesPage').then((m) => ({ default: m.RolesPage })))
const UserDetailPage = lazy(() => import('@/pages/users/UserDetailPage').then((m) => ({ default: m.UserDetailPage })))
const UsersPage = lazy(() => import('@/pages/users/UsersPage').then((m) => ({ default: m.UsersPage })))
const CasesPage = lazy(() => import('@/pages/cases/CasesPage').then((m) => ({ default: m.CasesPage })))
const CaseEditorPage = lazy(() => import('@/pages/cases/CaseEditorPage').then((m) => ({ default: m.CaseEditorPage })))
const SubmissionsPage = lazy(() => import('@/pages/submissions/SubmissionsPage').then((m) => ({ default: m.SubmissionsPage })))
const SubmissionDetailPage = lazy(() => import('@/pages/submissions/SubmissionDetailPage').then((m) => ({ default: m.SubmissionDetailPage })))
const CompetitionsPage = lazy(() => import('@/pages/competitions/CompetitionsPage').then((m) => ({ default: m.CompetitionsPage })))
const CompetitionEditorPage = lazy(() => import('@/pages/competitions/CompetitionEditorPage').then((m) => ({ default: m.CompetitionEditorPage })))
const CompetitionSuggestionsPage = lazy(() => import('@/pages/competitions/CompetitionSuggestionsPage').then((m) => ({ default: m.CompetitionSuggestionsPage })))
const TeamPostsPage = lazy(() => import('@/pages/team-posts/TeamPostsPage').then((m) => ({ default: m.TeamPostsPage })))
const TaxonomiesPage = lazy(() => import('@/pages/case-taxonomies/TaxonomiesPage').then((m) => ({ default: m.TaxonomiesPage })))
const XpRulesPage = lazy(() => import('@/pages/xp-rules/XpRulesPage').then((m) => ({ default: m.XpRulesPage })))
const SkillsPage = lazy(() => import('@/pages/skills/SkillsPage').then((m) => ({ default: m.SkillsPage })))
const SkillOverviewPage = lazy(() => import('@/pages/skills/SkillOverviewPage').then((m) => ({ default: m.SkillOverviewPage })))
const LearnerProfilesPage = lazy(() => import('@/pages/learner-profiles/LearnerProfilesPage').then((m) => ({ default: m.LearnerProfilesPage })))
const ApprovalSettingsPage = lazy(() => import('@/pages/approvals/ApprovalSettingsPage').then((m) => ({ default: m.ApprovalSettingsPage })))
const CoachWaitlistPage = lazy(() => import('@/pages/waitlist/CoachWaitlistPage').then((m) => ({ default: m.CoachWaitlistPage })))
const SupportReportsPage = lazy(() => import('@/pages/support-reports/SupportReportsPage').then((m) => ({ default: m.SupportReportsPage })))

// Data router: cần cho useBlocker (cảnh báo rời trang khi chưa lưu)
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>
      {/* Mở được cả khi đang đăng nhập (bấm link trong email) */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route element={<RequireContentAccess />}>
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/cases/new" element={<CaseEditorPage />} />
            <Route path="/cases/:id" element={<CaseEditorPage />} />
            <Route path="/case-taxonomies" element={<TaxonomiesPage />} />
            <Route path="/submissions" element={<SubmissionsPage />} />
            <Route path="/submissions/:id" element={<SubmissionDetailPage />} />
            <Route path="/competitions" element={<CompetitionsPage />} />
            <Route path="/competitions/new" element={<CompetitionEditorPage />} />
            <Route path="/competitions/:id" element={<CompetitionEditorPage />} />
            <Route path="/competition-suggestions" element={<CompetitionSuggestionsPage />} />
            <Route path="/team-posts" element={<TeamPostsPage />} />
            <Route path="/learner-profiles" element={<LearnerProfilesPage />} />
            <Route path="/skill-overview" element={<SkillOverviewPage />} />
            <Route path="/support-reports" element={<SupportReportsPage />} />
          </Route>
          <Route element={<RequireAdmin />}>
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/:id" element={<UserDetailPage />} />
            <Route path="/roles" element={<RolesPage />} />
            <Route path="/waitlist/coach" element={<CoachWaitlistPage />} />
            <Route path="/approval-settings" element={<ApprovalSettingsPage />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/xp-rules" element={<XpRulesPage />} />
          </Route>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </>,
  ),
)

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}
