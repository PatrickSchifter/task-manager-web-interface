import type {
  PaginatedResponse,
  TaskListItem,
  TaskRequest,
} from "@/api/client";
import { updateTask } from "@/api/client";
import { Card, CardBody } from "@heroui/card";
import { addToast } from "@heroui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { useDrop } from "react-dnd";
import TaskCard from "./task-card";

type TaskStatus = TaskRequest["status"];

type ColumnProps = {
  projectId: string;
  status: TaskStatus;
  title: string;
  isLoading: boolean;
  tasks: TaskListItem[];
  allTasks: TaskListItem[];
  onAddTask: (status: TaskStatus) => void;
  mobileView?: boolean;
};

export default function Column({
  projectId,
  status,
  title,
  isLoading,
  tasks,
  allTasks,
  onAddTask,
  mobileView = false,
}: ColumnProps) {
  const queryClient = useQueryClient();

  const [{ isOver, canDrop }, dropRef] = useDrop<
    { taskId: string; status: TaskStatus },
    void,
    { isOver: boolean; canDrop: boolean }
  >(
    () => ({
      accept: "TASK",
      drop: (item) => {
        if (!projectId || item.status === status) return;
        (async () => {
          try {
            const task = allTasks.find((t) => t.id === item.taskId);
            queryClient.setQueryData<PaginatedResponse<TaskListItem>>(
              ["projects", projectId, "tasks"],
              (old) => {
                if (!old?.data) return old;
                return {
                  ...old,
                  data: old.data.map((t) =>
                    t.id === item.taskId
                      ? ({ ...t, status } as TaskListItem)
                      : t,
                  ),
                };
              },
            );
            await updateTask(projectId, item.taskId, {
              title: task?.title ?? "",
              status,
              priority: task?.priority ?? "MEDIUM",
            });
            await queryClient.invalidateQueries({
              queryKey: ["projects", projectId, "tasks"],
            });
            await queryClient.refetchQueries({
              queryKey: ["projects", projectId, "tasks"],
              type: "active",
            });
            addToast({ title: "Tarefa movida", color: "success" });
          } catch {
            await queryClient.invalidateQueries({
              queryKey: ["projects", projectId, "tasks"],
            });
            addToast({ title: "Falha ao mover tarefa", color: "danger" });
          }
        })();
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [projectId, status, allTasks],
  );

  // ── Mobile view ───────────────────────────────────────────────
  if (mobileView) {
    return (
      <div className="w-full" data-testid={`column-${status}`}>
        <div className="space-y-3">
          {isLoading ? (
            [0, 1, 2].map((i) => (
              <Card
                key={`${status}-skeleton-${i}`}
                className="w-full rounded-xl border border-gray-200 bg-white"
              >
                <CardBody className="p-4">
                  <div className="mb-2 h-4 w-2/3 rounded bg-gray-200" />
                  <div className="h-3 w-5/6 rounded bg-gray-100" />
                </CardBody>
              </Card>
            ))
          ) : tasks.length ? (
            tasks.map((t) => (
              <TaskCard
                key={t.id}
                projectId={projectId}
                taskId={t.id}
                title={t.title}
                priority={t.priority}
                status={t.status}
                dueDate={typeof t.dueDate === "string" ? t.dueDate : undefined}
                assignee={
                  t.assignee
                    ? {
                        name: t.assignee.name,
                        avatar:
                          typeof t.assignee.avatar === "string"
                            ? t.assignee.avatar
                            : null,
                      }
                    : null
                }
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <span className="mb-2 text-3xl">📋</span>
              <p className="text-sm">Nenhuma tarefa aqui</p>
            </div>
          )}
        </div>

        {/* Inline add button */}
        <button
          type="button"
          onClick={() => onAddTask(status)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          Adicionar tarefa
        </button>
      </div>
    );
  }

  // ── Desktop view (original behaviour) ────────────────────────
  const highlight = isOver && canDrop;
  const base = "w-[32%] flex-shrink-0 rounded-lg border p-3 transition-colors";
  const normal = "border-gray-200 bg-gray-50";
  const hovering = "border-blue-300 bg-blue-50 ring-2 ring-blue-400";
  const dashed = !highlight && canDrop ? "border-dashed" : "";

  return (
    <div
      ref={dropRef}
      className={`${base} ${highlight ? hovering : normal} ${dashed}`}
      data-testid={`column-${status}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        <button
          type="button"
          onClick={() => onAddTask(status)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
        >
          +
        </button>
      </div>
      <div className="space-y-3">
        {isLoading ? (
          [0, 1, 2].map((i) => (
            <Card
              key={`${status}-skeleton-${i}`}
              className="w-full rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
            >
              <CardBody>
                <div className="mb-2 h-4 w-2/3 rounded bg-gray-200" />
                <div className="h-3 w-5/6 rounded bg-gray-100" />
              </CardBody>
            </Card>
          ))
        ) : tasks.length ? (
          tasks.map((t) => (
            <TaskCard
              key={t.id}
              projectId={projectId}
              taskId={t.id}
              title={t.title}
              priority={t.priority}
              status={t.status}
              dueDate={typeof t.dueDate === "string" ? t.dueDate : undefined}
              assignee={
                t.assignee
                  ? {
                      name: t.assignee.name,
                      avatar:
                        typeof t.assignee.avatar === "string"
                          ? t.assignee.avatar
                          : null,
                    }
                  : null
              }
            />
          ))
        ) : (
          <p className="text-xs text-gray-400">Nenhuma tarefa</p>
        )}
      </div>
    </div>
  );
}
