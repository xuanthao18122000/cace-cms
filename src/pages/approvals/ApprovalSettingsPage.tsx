import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GitPullRequestArrow, Pencil, UsersRound } from "lucide-react";
import { approvalApi } from "@/api";
import {
  Avatar,
  Badge,
  Button,
  Card,
  ErrorState,
  Loading,
  PageHeader,
} from "@/components/ui";
import { queryKeys } from "@/lib/queryClient";
import type { ApprovalFlow } from "@/types";
import { formatDateTime } from "@/utils/format";
import { ApprovalFlowDrawer } from "./ApprovalFlowDrawer";

/**
 * Cấu hình duyệt: mỗi tính năng cần duyệt (đề xuất cuộc thi, sau này thêm tính năng khác) có nhiều cấp,
 * mỗi cấp nhiều người duyệt. Có yêu cầu mới → email cho người duyệt cấp hiện tại.
 */
export function ApprovalSettingsPage() {
  const [editing, setEditing] = useState<ApprovalFlow | null>(null);
  const flows = useQuery({
    queryKey: queryKeys.approvalFlows,
    queryFn: approvalApi.listFlows,
  });

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Hệ thống" }]}
        title="Cấu hình duyệt"
        subtitle="Chọn các cấp duyệt và người duyệt cho từng tính năng. Có yêu cầu mới, CACE gửi email cho người duyệt của cấp hiện tại; chỉ cần một người trong cấp duyệt là yêu cầu sang cấp tiếp theo."
      />

      {flows.isLoading ? (
        <Loading />
      ) : flows.isError ? (
        <ErrorState error={flows.error} onRetry={() => void flows.refetch()} />
      ) : (
        <div className="approval-grid">
          {(flows.data ?? []).map((f) => (
            <Card
              key={f.type}
              icon={GitPullRequestArrow}
              title={f.name}
              subtitle={f.description}
              actions={
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Pencil}
                  onClick={() => setEditing(f)}
                >
                  Cấu hình
                </Button>
              }
            >
              <div className="approval-status">
                {f.isActive ? (
                  <Badge tone="green">
                    Đang bật · {f.steps.length} cấp duyệt
                  </Badge>
                ) : (
                  <Badge tone="gray">
                    {f.configured ? "Đang tắt" : "Chưa cấu hình"} · duyệt mặc
                    định (admin / mentor, 1 bước)
                  </Badge>
                )}
                {f.updatedAt && (
                  <span className="mo">
                    Cập nhật {formatDateTime(f.updatedAt)}
                  </span>
                )}
              </div>

              {f.steps.length > 0 && (
                <ol className="approval-steps">
                  {f.steps.map((s) => (
                    <li key={s.level} className="approval-step">
                      <span className="approval-level">{s.level}</span>
                      <div className="min-w-0">
                        <div className="approval-step-name">{s.name}</div>
                        <div className="approval-people">
                          <UsersRound size={14} aria-hidden="true" />
                          {s.approvers.map((a) => (
                            <span
                              key={a.id}
                              className="approval-person"
                              title={a.email}
                            >
                              <Avatar
                                name={a.fullName}
                                src={a.avatarUrl ?? undefined}
                                size="sm"
                              />
                              {a.fullName}
                            </span>
                          ))}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          ))}
        </div>
      )}

      <ApprovalFlowDrawer flow={editing} onClose={() => setEditing(null)} />
    </>
  );
}
