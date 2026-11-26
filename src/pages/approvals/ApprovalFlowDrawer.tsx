import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { approvalApi, errorMessage } from "@/api";
import {
  Avatar,
  Button,
  Drawer,
  ErrorBox,
  Field,
  IconButton,
  InfoBox,
  Input,
  Select,
  Switch,
} from "@/components/ui";
import { useToast } from "@/contexts/toast";
import { queryKeys } from "@/lib/queryClient";
import type { ApprovalFlow, Approver } from "@/types";

type StepDraft = { key: number; name: string; approvers: Approver[] };

let seq = 0;
const nextKey = () => ++seq;

/** Drawer sửa một luồng duyệt: bật/tắt, thêm / xoá / đổi thứ tự cấp, chọn nhiều người duyệt mỗi cấp. */
export function ApprovalFlowDrawer({
  flow,
  onClose,
}: {
  flow: ApprovalFlow | null;
  onClose(): void;
}) {
  // key: mở luồng khác (hoặc mở lại sau khi lưu) thì form khởi tạo lại từ dữ liệu mới
  return flow ? (
    <FlowEditor
      key={`${flow.type}:${flow.updatedAt ?? ""}`}
      flow={flow}
      onClose={onClose}
    />
  ) : null;
}

function FlowEditor({
  flow,
  onClose,
}: {
  flow: ApprovalFlow;
  onClose(): void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [isActive, setIsActive] = useState(
    flow.configured ? flow.isActive : true,
  );
  const [steps, setSteps] = useState<StepDraft[]>(() =>
    flow.steps.length
      ? flow.steps.map((s) => ({
          key: nextKey(),
          name: s.name,
          approvers: s.approvers,
        }))
      : [{ key: nextKey(), name: "Cấp 1", approvers: [] }],
  );
  const [error, setError] = useState<string | null>(null);

  const people = useQuery({
    queryKey: queryKeys.approvers(""),
    queryFn: () => approvalApi.approvers(),
  });

  const save = useMutation({
    mutationFn: () =>
      approvalApi.saveFlow(flow.type, {
        isActive,
        steps: steps.map((s) => ({
          name: s.name.trim(),
          approverIds: s.approvers.map((a) => a.id),
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvalFlows });
      toast.success(`Đã lưu cấu hình duyệt ${flow.name}`);
      onClose();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const update = (key: number, patch: Partial<StepDraft>) =>
    setSteps((list) =>
      list.map((s) => (s.key === key ? { ...s, ...patch } : s)),
    );
  const move = (index: number, dir: -1 | 1) =>
    setSteps((list) => {
      const next = [...list];
      const [item] = next.splice(index, 1);
      next.splice(index + dir, 0, item);
      return next;
    });

  const submit = () => {
    setError(null);
    if (isActive && steps.length === 0)
      return setError("Bật cấu hình duyệt cần ít nhất một cấp duyệt");
    const bad = steps.findIndex(
      (s) => s.name.trim().length < 2 || s.approvers.length === 0,
    );
    if (bad >= 0)
      return setError(
        `Cấp ${bad + 1}: cần tên cấp (tối thiểu 2 ký tự) và ít nhất một người duyệt`,
      );
    save.mutate();
  };

  return (
    <Drawer
      open
      title={`Cấu hình duyệt · ${flow.name}`}
      subtitle={flow.description}
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Lưu cấu hình"
      busy={save.isPending}
      size="lg"
    >
      <Switch
        checked={isActive}
        onChange={setIsActive}
        label="Bật duyệt nhiều cấp"
        description="Tắt thì tính năng này dùng cách duyệt mặc định: admin hoặc mentor duyệt một bước."
      />

      <InfoBox>
        Yêu cầu đi lần lượt từ cấp 1 đến cấp cuối. Ở mỗi cấp, CACE gửi email cho
        tất cả người duyệt; chỉ cần một người duyệt là sang cấp tiếp theo, một
        người từ chối là kết thúc. Sửa cấu hình không ảnh hưởng các yêu cầu đang
        chờ duyệt.
      </InfoBox>

      {error && <ErrorBox>{error}</ErrorBox>}

      <ol className="approval-editor">
        {steps.map((s, i) => (
          <StepEditor
            key={s.key}
            index={i}
            total={steps.length}
            step={s}
            people={people.data ?? []}
            loadingPeople={people.isLoading}
            onChange={(patch) => update(s.key, patch)}
            onMove={(dir) => move(i, dir)}
            onRemove={() =>
              setSteps((list) => list.filter((x) => x.key !== s.key))
            }
          />
        ))}
      </ol>

      <Button
        variant="secondary"
        icon={Plus}
        disabled={steps.length >= 10}
        onClick={() =>
          setSteps((list) => [
            ...list,
            { key: nextKey(), name: `Cấp ${list.length + 1}`, approvers: [] },
          ])
        }
      >
        Thêm cấp duyệt
      </Button>
    </Drawer>
  );
}

function StepEditor({
  index,
  total,
  step,
  people,
  loadingPeople,
  onChange,
  onMove,
  onRemove,
}: {
  index: number;
  total: number;
  step: StepDraft;
  people: Approver[];
  loadingPeople: boolean;
  onChange(patch: Partial<StepDraft>): void;
  onMove(dir: -1 | 1): void;
  onRemove(): void;
}) {
  const chosen = useMemo(
    () => new Set(step.approvers.map((a) => a.id)),
    [step.approvers],
  );
  const options = people
    .filter((p) => !chosen.has(p.id))
    .map((p) => ({
      value: p.id,
      label: p.fullName,
      description: `${p.roleName} · ${p.email}`,
    }));
  const nameId = `approval-step-${step.key}`;

  return (
    <li className="approval-editor-step">
      <div className="approval-editor-head">
        <span className="approval-level">{index + 1}</span>
        <div className="approval-editor-tools">
          <IconButton
            icon={ArrowUp}
            label="Đưa lên"
            disabled={index === 0}
            onClick={() => onMove(-1)}
          />
          <IconButton
            icon={ArrowDown}
            label="Đưa xuống"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          />
          <IconButton
            icon={Trash2}
            label={`Xoá cấp ${index + 1}`}
            danger
            onClick={onRemove}
          />
        </div>
      </div>

      <Field label="Tên cấp duyệt" htmlFor={nameId} required>
        <Input
          id={nameId}
          value={step.name}
          maxLength={120}
          placeholder="VD: Mentor kiểm tra nội dung"
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </Field>

      <Field
        label="Người duyệt"
        required
        hint="Chọn được nhiều người. Chỉ tài khoản nhân sự (admin, mentor…) mới duyệt được."
      >
        {step.approvers.length > 0 && (
          <div className="approval-chips">
            {step.approvers.map((a) => (
              <span key={a.id} className="approval-chip" title={a.email}>
                <Avatar
                  name={a.fullName}
                  src={a.avatarUrl ?? undefined}
                  size="sm"
                />
                <span className="truncate">{a.fullName}</span>
                <button
                  type="button"
                  aria-label={`Bỏ ${a.fullName}`}
                  onClick={() =>
                    onChange({
                      approvers: step.approvers.filter((x) => x.id !== a.id),
                    })
                  }
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        )}
        <Select
          value=""
          searchable
          disabled={loadingPeople || options.length === 0}
          placeholder={
            loadingPeople
              ? "Đang tải…"
              : options.length
                ? "+ Thêm người duyệt"
                : "Đã chọn hết nhân sự"
          }
          options={options}
          aria-label={`Thêm người duyệt cho cấp ${index + 1}`}
          onChange={(id) => {
            const p = people.find((x) => x.id === id);
            if (p) onChange({ approvers: [...step.approvers, p] });
          }}
        />
      </Field>
    </li>
  );
}
