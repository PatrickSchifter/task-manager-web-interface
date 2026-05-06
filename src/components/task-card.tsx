import {
  type CommentListItem,
  type CommentRequest,
  type MemberListItem,
  type TaskPriority,
  type TaskStatus,
  createComment,
  deleteComment,
  deleteTask,
  getMe,
  getTask,
  listCommentsByTask,
  listMembers,
  listUsers,
  updateComment,
  updateTask,
} from "@/api/client";
import ConfirmationModal from "@/components/ConfirmationModal";
import { DeleteIcon, EditIcon } from "@/components/icons";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Input, Textarea } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { addToast } from "@heroui/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDrag } from "react-dnd";

type Props = {
  projectId: string;
  taskId: string;
  title: string;
  priority: string;
  status: string;
  dueDate?: string | null;
  assignee?: { name: string; avatar?: string | null } | null;
};

const TaskCard = ({
  projectId,
  taskId,
  title,
  priority,
  status,
  dueDate,
  assignee,
}: Props) => {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
    onClose: onDeleteClose,
  } = useDisclosure();
  // Task delete modal
  const {
    isOpen: isTaskDeleteOpen,
    onOpen: onTaskDeleteOpen,
    onOpenChange: onTaskDeleteOpenChange,
    onClose: onTaskDeleteClose,
  } = useDisclosure();
  // Task delete mutation
  const deleteTaskMutation = useMutation({
    mutationKey: ["projects", projectId, "tasks", taskId, "delete"],
    mutationFn: () => deleteTask(projectId, taskId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "tasks"],
      });
      addToast({ title: "Task deleted successfully", color: "success" });
      onTaskDeleteClose();
      onClose();
    },
    onError: () => {
      addToast({ title: "Failed to delete task", color: "danger" });
    },
  });

  // Handler for Delete Task button
  function handleDeleteMode() {
    onTaskDeleteOpen();
  }

  // Confirm delete handler
  const confirmDeleteTask = () => {
    deleteTaskMutation.mutate();
  };
  const queryClient = useQueryClient();

  // View/Edit state
  const [isEditing, setIsEditing] = useState(false);

  const { data: fullTask } = useQuery({
    queryKey: ["projects", projectId, "tasks", taskId, "details"],
    queryFn: () => getTask(projectId, taskId),
    enabled: isOpen,
    staleTime: 30_000,
  });

  // Get current user to check comment ownership
  const { data: user } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    staleTime: 300_000, // 5 minutes
  });

  // Fetch comments
  const { data: commentsResponse, isLoading: isLoadingComments } = useQuery({
    queryKey: ["projects", projectId, "tasks", taskId, "comments"],
    queryFn: () => listCommentsByTask(projectId, taskId),
    enabled: isOpen && Boolean(projectId) && Boolean(taskId),
    staleTime: 30_000,
  });

  const comments: CommentListItem[] = commentsResponse?.data ?? [];

  // Fetch users for assignee selection
  const { data: usersResponse } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
    staleTime: 300_000, // 5 minutes
  });

  const users = usersResponse?.data ?? [];

  const [editTitle, setEditTitle] = useState<string>(title);
  const [editDescription, setEditDescription] = useState<string>("");
  const [editPriority, setEditPriority] = useState<string>(priority);
  const [editStatus, setEditStatus] = useState<string>(status);
  const [editDueDate, setEditDueDate] = useState<string | undefined>(
    typeof dueDate === "string" ? dueDate : undefined,
  );
  const [editAssigneeId, setEditAssigneeId] = useState<string | undefined>(
    undefined,
  );

  // Comment state
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null,
  );

  // Sync modal fields with fullTask when modal opens or task changes
  useEffect(() => {
    if (isOpen && fullTask) {
      if (typeof fullTask.description === "string") {
        setEditDescription(fullTask.description);
      }
      if (fullTask.priority) {
        setEditPriority(fullTask.priority as string);
      }
      if (fullTask.status) {
        setEditStatus(fullTask.status as string);
      }
      if (typeof fullTask.dueDate === "string") {
        setEditDueDate(fullTask.dueDate);
      }
      // Always sync assignee id (even if undefined)
      setEditAssigneeId(fullTask.assignee?.id ?? undefined);
    }
  }, [isOpen, fullTask]);

  const updateTaskMutation = useMutation({
    mutationKey: ["projects", projectId, "tasks", taskId, "update"],
    mutationFn: () =>
      updateTask(projectId, taskId, {
        title: editTitle,
        description: editDescription || undefined,
        priority: editPriority as TaskPriority,
        status: editStatus as TaskStatus,
        dueDate: editDueDate ? new Date(editDueDate).toISOString() : undefined,
        assigneeId: editAssigneeId,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["projects", projectId, "tasks"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["projects", projectId, "tasks", taskId, "details"],
        }),
      ]);
      setIsEditing(false);
      addToast({ title: "Task updated successfully", color: "success" });
    },
    onError: () => {
      addToast({ title: "Failed to update task", color: "danger" });
    },
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationKey: ["projects", projectId, "tasks", taskId, "comments", "create"],
    mutationFn: () =>
      createComment(projectId, taskId, {
        content: newComment,
      } as CommentRequest),
    onSuccess: async () => {
      setNewComment("");
      await queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "tasks", taskId, "comments"],
      });
      addToast({ title: "Comment added successfully", color: "success" });
    },
    onError: () => {
      addToast({ title: "Failed to add comment", color: "danger" });
    },
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationKey: ["projects", projectId, "tasks", taskId, "comments", "update"],
    mutationFn: (commentId: string) =>
      updateComment(projectId, taskId, commentId, {
        content: editingContent,
      } as CommentRequest),
    onSuccess: async () => {
      setEditingCommentId(null);
      setEditingContent("");
      await queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "tasks", taskId, "comments"],
      });
      addToast({ title: "Comment updated", color: "success" });
    },
    onError: () => {
      addToast({ title: "Failed to update comment", color: "danger" });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationKey: ["projects", projectId, "tasks", taskId, "comments", "delete"],
    mutationFn: (commentId: string) =>
      deleteComment(projectId, taskId, commentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "tasks", taskId, "comments"],
      });
      addToast({ title: "Comment deleted successfully", color: "success" });
    },
    onError: () => {
      addToast({ title: "Failed to delete comment", color: "danger" });
    },
  });

  const handleEditComment = (comment: CommentListItem) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent("");
  };

  const handleDeleteComment = (commentId: string) => {
    setDeletingCommentId(commentId);
    onDeleteOpen();
  };

  const confirmDeleteComment = () => {
    if (deletingCommentId) {
      deleteCommentMutation.mutate(deletingCommentId);
      setDeletingCommentId(null);
    }
    onDeleteClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleEditMode = () => {
    setIsEditing(true);
  };

  const handleCancelEditMode = () => {
    setIsEditing(false);
    // Reset form fields to original values
    setEditTitle(fullTask?.title || title);
    setEditDescription(
      typeof fullTask?.description === "string" ? fullTask.description : "",
    );
    setEditPriority(fullTask?.priority || priority);
    setEditStatus(fullTask?.status || status);
    setEditDueDate(
      typeof fullTask?.dueDate === "string"
        ? fullTask.dueDate
        : typeof dueDate === "string"
          ? dueDate
          : undefined,
    );
    setEditAssigneeId(fullTask?.assignee?.id);
  };

  // Reset editing state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsEditing(false);
    }
  }, [isOpen]);

  const displayDue = dueDate
    ? new Intl.DateTimeFormat("pt-BR").format(new Date(`${dueDate}T00:00:00`))
    : undefined;

  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: "TASK",
      item: { taskId, status },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }),
    [taskId, status],
  );

  // Fetch project members to check user role
  const { data: membersResponse } = useQuery({
    queryKey: ["projects", projectId, "members"],
    queryFn: () => listMembers(projectId),
    staleTime: 60_000,
    enabled: Boolean(projectId),
  });
  const members: MemberListItem[] = membersResponse?.data ?? [];
  const currentMember = user && members.find((m) => m.userId === user.id);
  const canEdit =
    currentMember &&
    (currentMember.role === "EDITOR" || currentMember.role === "OWNER");

  const canDelete =
    currentMember &&
    (currentMember.role === "EDITOR" || currentMember.role === "OWNER");

  return (
    <>
      <Card
        ref={dragRef}
        isPressable
        onPress={onOpen}
        className="w-full rounded-lg border border-gray-200 bg-white p-2 shadow-sm"
        style={{ opacity: isDragging ? 0.5 : 1 }}
      >
        <CardHeader className="pb-1">
          <h3 className="text-sm font-medium">{title}</h3>
        </CardHeader>
        <CardFooter className="flex items-center justify-between">
          <span className="text-sm text-gray-500">{displayDue}</span>
          {assignee && (
            <Avatar
              size="sm"
              name={assignee?.name}
              src={
                typeof assignee?.avatar === "string"
                  ? assignee?.avatar
                  : undefined
              }
            />
          )}
        </CardFooter>
      </Card>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex items-center justify-between">
                {isEditing ? (
                  canEdit ? (
                    <Input
                      label="Title"
                      placeholder="Enter task title"
                      variant="bordered"
                      value={editTitle}
                      onValueChange={setEditTitle}
                      aria-label="Task title"
                    />
                  ) : (
                    <h2 className="text-xl font-semibold">
                      {fullTask?.title || title}
                    </h2>
                  )
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <h2 className="text-xl font-semibold">
                      {fullTask?.title || title}
                    </h2>
                    <div>
                      {canDelete && (
                        <Button
                          variant="light"
                          color="danger"
                          onPress={handleDeleteMode}
                          startContent={<DeleteIcon size={16} />}
                        >
                          Delete
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          variant="light"
                          onPress={handleEditMode}
                          startContent={<EditIcon size={16} />}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </ModalHeader>
              <ModalBody className="space-y-6">
                {isEditing ? (
                  // Edit Mode - Form Fields
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-4">
                      <Textarea
                        label="Description"
                        placeholder="Add a description..."
                        value={editDescription}
                        onValueChange={setEditDescription}
                        minRows={4}
                      />
                    </div>
                    <div className="md:col-span-1 space-y-4">
                      <Select
                        label="Priority"
                        selectedKeys={[editPriority]}
                        onSelectionChange={(keys) =>
                          setEditPriority(Array.from(keys)[0] as string)
                        }
                      >
                        <SelectItem key="LOW">Low</SelectItem>
                        <SelectItem key="MEDIUM">Medium</SelectItem>
                        <SelectItem key="HIGH">High</SelectItem>
                      </Select>
                      <Select
                        label="Status"
                        selectedKeys={[editStatus]}
                        onSelectionChange={(keys) =>
                          setEditStatus(Array.from(keys)[0] as string)
                        }
                      >
                        <SelectItem key="TODO">To Do</SelectItem>
                        <SelectItem key="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem key="DONE">Done</SelectItem>
                      </Select>
                      <Input
                        type="date"
                        label="Due date"
                        placeholder="DD-MM-YYYY"
                        value={editDueDate ?? ""}
                        onChange={(e) => setEditDueDate(e.target.value)}
                      />
                      <Select
                        label="Assignee"
                        placeholder="Select assignee"
                        selectedKeys={editAssigneeId ? [editAssigneeId] : []}
                        onSelectionChange={(keys) => {
                          const selectedId = Array.from(keys)[0] as string;
                          setEditAssigneeId(selectedId || undefined);
                        }}
                        items={[
                          { id: "", name: "Unassigned", avatar: null },
                          ...users,
                        ]}
                      >
                        {(user) => (
                          <SelectItem key={user.id}>
                            <div className="flex items-center gap-2">
                              {user.id === "" ? (
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-xs text-gray-500">
                                    ?
                                  </span>
                                </div>
                              ) : (
                                <Avatar
                                  size="sm"
                                  name={user.name}
                                  src={
                                    typeof user.avatar === "string"
                                      ? user.avatar
                                      : undefined
                                  }
                                  className="w-6 h-6"
                                />
                              )}
                              <span>{user.name}</span>
                            </div>
                          </SelectItem>
                        )}
                      </Select>
                    </div>
                  </div>
                ) : (
                  // View Mode - Read-only Display + Comments
                  <>
                    {/* Task Details Display */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                      <div className="md:col-span-2 space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">
                            Description
                          </h4>
                          <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                            {typeof fullTask?.description === "string" &&
                            (fullTask.description as string).trim()
                              ? fullTask.description
                              : "No description provided"}
                          </p>
                        </div>
                      </div>
                      <div className="md:col-span-1 space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">
                            Priority
                          </h4>
                          <p className="mt-1 text-sm text-gray-900">
                            {fullTask?.priority || priority}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">
                            Status
                          </h4>
                          <p className="mt-1 text-sm text-gray-900">
                            {fullTask?.status === "TODO"
                              ? "To Do"
                              : fullTask?.status === "IN_PROGRESS"
                                ? "In Progress"
                                : fullTask?.status === "DONE"
                                  ? "Done"
                                  : fullTask?.status || status}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">
                            Due date
                          </h4>
                          <p className="mt-1 text-sm text-gray-900">
                            {fullTask?.dueDate &&
                            typeof fullTask.dueDate === "string"
                              ? new Date(fullTask.dueDate).toLocaleDateString()
                              : displayDue || "No due date"}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">
                            Assignee
                          </h4>
                          {fullTask?.assignee || assignee ? (
                            <div className="mt-1 flex items-center gap-2">
                              <Avatar
                                size="sm"
                                name={(fullTask?.assignee || assignee)?.name}
                                src={
                                  typeof (fullTask?.assignee || assignee)
                                    ?.avatar === "string"
                                    ? ((fullTask?.assignee || assignee)
                                        ?.avatar as string)
                                    : undefined
                                }
                              />
                              <span className="text-sm text-gray-900">
                                {(fullTask?.assignee || assignee)?.name}
                              </span>
                            </div>
                          ) : (
                            <p className="mt-1 text-sm text-gray-500">
                              Unassigned
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Comments Section */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4">Comments</h3>

                      {/* Comments List */}
                      <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                        {isLoadingComments ? (
                          // Loading skeletons
                          <>
                            {[1, 2, 3].map((i) => (
                              <Card key={i} className="w-full">
                                <CardBody className="space-y-2">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-gray-200" />
                                      <div className="h-4 w-24 rounded bg-gray-200" />
                                      <div className="h-3 w-16 rounded bg-gray-100" />
                                    </div>
                                  </div>
                                  <div className="h-4 w-full rounded bg-gray-100" />
                                  <div className="h-4 w-3/4 rounded bg-gray-100" />
                                </CardBody>
                              </Card>
                            ))}
                          </>
                        ) : comments.length === 0 ? (
                          <div className="text-center py-4 text-gray-500">
                            <p>No comments yet</p>
                            <p className="text-sm">
                              Be the first to add a comment!
                            </p>
                          </div>
                        ) : (
                          comments.map((comment) => (
                            <Card key={comment.id} className="w-full">
                              <CardBody className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2">
                                    <Avatar
                                      size="sm"
                                      name={comment.author.name}
                                      src={
                                        typeof comment.author.avatar ===
                                        "string"
                                          ? comment.author.avatar
                                          : undefined
                                      }
                                      className="w-8 h-8"
                                    />
                                    <div>
                                      <p className="font-medium text-sm">
                                        {comment.author.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {formatDate(comment.createdAt)}
                                      </p>
                                    </div>
                                  </div>
                                  {user?.id === comment.authorId && (
                                    <div className="flex gap-1">
                                      <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        data-testid="btn-edit-comment"
                                        onPress={() =>
                                          handleEditComment(comment)
                                        }
                                        className="text-gray-500 hover:text-blue-600"
                                      >
                                        <EditIcon size={14} />
                                      </Button>
                                      <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        data-testid="btn-delete-comment"
                                        onPress={() =>
                                          handleDeleteComment(comment.id)
                                        }
                                        className="text-gray-500 hover:text-red-600"
                                      >
                                        <DeleteIcon size={14} />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                {editingCommentId === comment.id ? (
                                  <div className="space-y-2">
                                    <Textarea
                                      value={editingContent}
                                      onValueChange={setEditingContent}
                                      minRows={2}
                                      placeholder="Edit your comment..."
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        color="primary"
                                        onPress={() =>
                                          updateCommentMutation.mutate(
                                            comment.id,
                                          )
                                        }
                                        isLoading={
                                          updateCommentMutation.isPending
                                        }
                                        isDisabled={!editingContent.trim()}
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="light"
                                        onPress={handleCancelEdit}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm whitespace-pre-wrap">
                                    {comment.content}
                                  </p>
                                )}
                              </CardBody>
                            </Card>
                          ))
                        )}
                      </div>

                      {/* Add Comment Form */}
                      <div className="space-y-3 border-t pt-4">
                        <Textarea
                          label="Add a comment"
                          value={newComment}
                          onValueChange={setNewComment}
                          minRows={2}
                          placeholder="Write your comment here..."
                        />
                        <div className="flex justify-end">
                          <Button
                            color="primary"
                            onPress={() => createCommentMutation.mutate()}
                            isLoading={createCommentMutation.isPending}
                            isDisabled={!newComment.trim()}
                          >
                            Add Comment
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </ModalBody>
              <ModalFooter>
                {isEditing ? (
                  <>
                    <Button variant="light" onPress={handleCancelEditMode}>
                      Cancel
                    </Button>
                    <Button
                      color="primary"
                      onPress={() => updateTaskMutation.mutate()}
                      isLoading={updateTaskMutation.isPending}
                    >
                      Save
                    </Button>
                  </>
                ) : (
                  <Button variant="light" onPress={onClose}>
                    Close
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteOpen}
        onOpenChange={onDeleteOpenChange}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        confirmButtonColor="danger"
        onConfirm={confirmDeleteComment}
        isLoading={deleteCommentMutation.isPending}
      />
      {/* Task Delete Modal */}
      <ConfirmationModal
        isOpen={isTaskDeleteOpen}
        onOpenChange={onTaskDeleteOpenChange}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        confirmButtonColor="danger"
        onConfirm={confirmDeleteTask}
        isLoading={deleteTaskMutation.isPending}
      />
    </>
  );
};

export default TaskCard;
