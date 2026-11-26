import type {
  ApprovalFlow,
  ApprovalFlowInput,
  ApprovalRequest,
  ApprovalType,
  Approver,
} from "@/types";
import { request } from "./client";

export const approvalApi = {
  listFlows: () => request<ApprovalFlow[]>("/admin/approval-flows"),
  getFlow: (type: ApprovalType) =>
    request<ApprovalFlow>(`/admin/approval-flows/${type}`),
  saveFlow: (type: ApprovalType, input: ApprovalFlowInput) =>
    request<ApprovalFlow>(`/admin/approval-flows/${type}`, {
      method: "PUT",
      body: input,
    }),
  /** Tài khoản nhân sự có thể chọn làm người duyệt */
  approvers: (search?: string) =>
    request<Approver[]>("/admin/approval-flows/approvers", {
      query: { search },
    }),
  /** Tiến độ duyệt nhiều cấp của một đối tượng; null nếu không qua Cấu hình duyệt */
  progress: (type: ApprovalType, targetId: string) =>
    request<ApprovalRequest | null>(
      `/admin/approval-requests/${type}/${targetId}`,
    ),
};
