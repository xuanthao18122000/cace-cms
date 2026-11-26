import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Check,
  CircleX,
  GitPullRequestArrow,
  Inbox,
} from "lucide-react";
import { approvalApi } from "@/api";
import {
  Button,
  Card,
  Icon,
  InfoBox,
  KeyValueGrid,
  type KeyValueItem,
} from "@/components/ui";
import { queryKeys } from "@/lib/queryClient";
import type { AdminCompetition, ApprovalRequest } from "@/types";
import { formatDateTime, formatRelative } from "@/utils/format";

interface ProposalCardProps {
  item: AdminCompetition & {
    submittedBy: NonNullable<AdminCompetition["submittedBy"]>;
  };
  /** Đang lưu hoặc đang duyệt / từ chối: khoá nút */
  busy?: boolean;
  onApprove(): void;
  onReject(): void;
}

/** Khung đầu cột bên ở trang sửa cuộc thi do người dùng đề xuất: người gửi, nguồn kiểm chứng, duyệt / từ chối */
export function CompetitionProposalCard({
  item,
  busy,
  onApprove,
  onReject,
}: ProposalCardProps) {
  const { submittedBy: by } = item;
  const progress = useQuery({
    queryKey: queryKeys.approvalProgress("competition_proposal", item.id),
    queryFn: () => approvalApi.progress("competition_proposal", item.id),
  });
  const flow =
    progress.data?.status === "pending" ||
    progress.data?.status === "approved" ||
    progress.data?.status === "rejected"
      ? progress.data
      : null;
  const pendingFlow = flow?.status === "pending" ? flow : null;
  const lastLevel = pendingFlow
    ? pendingFlow.currentLevel >= pendingFlow.totalLevels
    : true;
  const approveLabel =
    pendingFlow && !lastLevel
      ? `Duyệt cấp ${pendingFlow.currentLevel}`
      : "Duyệt & đăng";
  const blocked = Boolean(pendingFlow && !pendingFlow.canAct);
  const reviewer = (verb: string) => (
    <>
      {verb}
      {item.reviewedByName && (
        <>
          {" "}
          bởi <b className="ink">{item.reviewedByName}</b>
        </>
      )}
      {item.reviewedAt && <> lúc {formatDateTime(item.reviewedAt)}</>}
    </>
  );

  const details: KeyValueItem[] = [
    ...(item.status === "rejected" && item.reviewNote
      ? [
          {
            label: "Lý do từ chối",
            value: <span className="proposal-note">{item.reviewNote}</span>,
          },
        ]
      : []),
    {
      label: "Người gửi",
      value: (
        <>
          {by.fullName}
          <div>
            <a href={`mailto:${by.email}`} className="mo">
              {by.email}
            </a>
          </div>
        </>
      ),
    },
    {
      label: "Vai trò",
      value: item.submitterIsOrganizer
        ? "Thành viên BTC"
        : "Người dùng giới thiệu",
    },
    {
      label: "Gửi lúc",
      value: `${formatDateTime(item.createdAt)} · ${formatRelative(item.createdAt)}`,
    },
    {
      label: "Nguồn để kiểm chứng",
      value: item.registerUrl ? (
        <a href={item.registerUrl} target="_blank" rel="noopener noreferrer">
          {item.registerUrl}
        </a>
      ) : (
        <span className="mo">Người gửi không để link</span>
      ),
    },
    ...(item.fanpageUrl && item.fanpageUrl !== item.registerUrl
      ? [
          {
            label: "Fanpage",
            value: (
              <a href={item.fanpageUrl} target="_blank" rel="noopener noreferrer">
                {item.fanpageUrl}
              </a>
            ),
          },
        ]
      : []),
    ...(item.contact
      ? [
          {
            label: "Liên hệ BTC",
            value: (
              <>
                {item.contact.name} · {item.contact.role}
                <div className="mo">
                  {item.contact.phone} · {item.contact.email}
                </div>
                <div className="mo">{item.contact.address}</div>
              </>
            ),
          },
        ]
      : []),
    ...(item.submitterNote
      ? [
          {
            label: "Lời nhắn của người gửi",
            value: <span className="proposal-note">{item.submitterNote}</span>,
          },
        ]
      : []),
  ];

  return (
    <Card icon={Inbox} title="Đề xuất từ người dùng">
      {item.status === "pending" ? (
        <InfoBox>
          Kiểm tra nguồn và sửa thông tin nếu cần. Cuộc thi chỉ hiện trên web
          sau khi duyệt.
        </InfoBox>
      ) : item.status === "rejected" ? (
        <div className="grade-status">
          <span className="text-red">
            <Icon icon={CircleX} />
          </span>
          <span>{reviewer("Đã từ chối")}</span>
        </div>
      ) : item.reviewedAt ? (
        <div className="grade-status">
          <span className="check-on">
            <Icon icon={Check} />
          </span>
          <span>{reviewer("Đã duyệt")}</span>
        </div>
      ) : null}

      <KeyValueGrid columns={1} items={details} />

      {flow && <ApprovalProgress request={flow} />}

      {item.status === "pending" ? (
        <>
          {blocked && pendingFlow && (
            <div className="field-hint">
              Đang chờ cấp {pendingFlow.currentLevel} (
              {
                pendingFlow.steps.find(
                  (s) => s.level === pendingFlow.currentLevel,
                )?.name
              }
              ). Bạn không nằm trong cấp duyệt này.
            </div>
          )}
          <div className="grade-actions">
            <Button
              variant="danger-outline"
              icon={CircleX}
              disabled={busy || blocked}
              onClick={onReject}
            >
              Từ chối
            </Button>
            <Button
              variant="primary"
              icon={BadgeCheck}
              disabled={busy || blocked}
              onClick={onApprove}
            >
              {approveLabel}
            </Button>
          </div>
        </>
      ) : item.status === "rejected" ? (
        <div className="publish-actions mt16">
          <Button
            variant="primary"
            icon={BadgeCheck}
            disabled={busy}
            onClick={onApprove}
          >
            Duyệt & đăng
          </Button>
          <div className="field-hint">
            Người gửi có thể sửa và gửi lại; khi đó đề xuất về Chờ duyệt.
          </div>
        </div>
      ) : null}
    </Card>
  );
}

/** Các cấp duyệt của đề xuất (theo Cấu hình duyệt): đã duyệt / đang chờ / bị từ chối, ai duyệt. */
export function ApprovalProgress({ request }: { request: ApprovalRequest }) {
  return (
    <div className="mt16">
      <div className="card-title" style={{ marginBottom: 8 }}>
        <span className="card-title-icon" aria-hidden="true">
          <Icon icon={GitPullRequestArrow} />
        </span>
        Tiến độ duyệt ({Math.min(request.currentLevel, request.totalLevels)}/
        {request.totalLevels} cấp)
      </div>
      <ol className="approval-progress">
        {request.steps.map((s) => {
          const action = [...request.actions]
            .reverse()
            .find((a) => a.level === s.level);
          const state =
            action?.decision === "reject"
              ? "rejected"
              : action?.decision === "approve"
                ? "done"
                : request.status === "pending" &&
                    s.level === request.currentLevel
                  ? "current"
                  : "waiting";
          return (
            <li key={s.level} className={state}>
              <span className="approval-level">{s.level}</span>
              <div className="min-w-0">
                <b className="ink">{s.name}</b>
                <div className="meta">
                  {action
                    ? `${action.decision === "approve" ? "Đã duyệt" : "Từ chối"} bởi ${action.actorName} · ${formatDateTime(action.createdAt)}`
                    : state === "current"
                      ? `Đang chờ: ${s.approvers.map((a) => a.fullName).join(", ")}`
                      : `Người duyệt: ${s.approvers.map((a) => a.fullName).join(", ")}`}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
