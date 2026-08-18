import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { ArrowLeft, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivityComments, useCreateComment, useRemoveComment } from "@/hooks/use-comments";
import { useUsers } from "@/hooks/use-profile";
import { errorMessage } from "@/lib/errors";
import { formatCompactTime, handleFromName } from "@/lib/format";
import { userHandle } from "@/lib/username";
import {
  COMMENT_MAX_LENGTH,
  isCommentDeleted,
  type Activity,
  type ActivityComment,
  type User,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type LiveComment = ActivityComment & { authorHandle: string };
type CommentNode = LiveComment & { replies: CommentNode[] };

const PREVIEW_REPLIES = 3;

function liveComment(comment: ActivityComment, authors: Map<string, User>): LiveComment {
  const author = authors.get(comment.authorId);
  return {
    ...comment,
    authorName: author?.displayName || comment.authorName,
    authorAvatar: author ? author.avatarUrl : comment.authorAvatar,
    authorHandle: author ? userHandle(author) : handleFromName(comment.authorName),
  };
}

function buildTree(comments: LiveComment[]): CommentNode[] {
  const byId = new Map<string, CommentNode>(
    comments.map((comment) => [comment.id, { ...comment, replies: [] }]),
  );
  const roots: CommentNode[] = [];
  for (const comment of comments) {
    const node = byId.get(comment.id);
    if (!node) continue;
    const parent = comment.parentId ? byId.get(comment.parentId) : undefined;
    if (parent) parent.replies.push(node);
    else roots.push(node);
  }
  const sortNodes = (nodes: CommentNode[]) => {
    nodes.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    nodes.forEach((node) => sortNodes(node.replies));
  };
  sortNodes(roots);
  return roots;
}

function findNode(nodes: CommentNode[], id: string): CommentNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const nested = findNode(node.replies, id);
    if (nested) return nested;
  }
  return null;
}

function ancestorChain(comments: LiveComment[], id: string): LiveComment[] {
  const byId = new Map(comments.map((comment) => [comment.id, comment]));
  const chain: LiveComment[] = [];
  let current = byId.get(id);
  const seen = new Set<string>();
  while (current?.parentId && !seen.has(current.id)) {
    seen.add(current.id);
    const parent = byId.get(current.parentId);
    if (!parent) break;
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}

function replyCount(node: CommentNode): number {
  return node.replies.reduce((total, child) => total + 1 + replyCount(child), 0);
}

function Composer({
  user,
  placeholder,
  replyToName,
  disabled,
  busy,
  autoFocus,
  onSubmit,
  onCancel,
}: {
  user: User;
  placeholder: string;
  replyToName?: string;
  disabled?: boolean;
  busy?: boolean;
  autoFocus?: boolean;
  onSubmit: (body: string) => Promise<void>;
  onCancel?: () => void;
}) {
  const { t } = useTranslation();
  const [body, setBody] = useState("");
  const [focused, setFocused] = useState(Boolean(autoFocus));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const remaining = COMMENT_MAX_LENGTH - body.length;
  const canPost = Boolean(body.trim()) && remaining >= 0 && !busy && !disabled;
  const expanded = focused || Boolean(body.trim()) || Boolean(autoFocus) || Boolean(replyToName);

  useEffect(() => {
    if (!autoFocus) return;
    textareaRef.current?.focus();
  }, [autoFocus]);

  function resize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }

  useEffect(() => {
    requestAnimationFrame(resize);
  }, [expanded, body]);

  async function submit() {
    if (!canPost) return;
    const next = body.trim();
    try {
      await onSubmit(next);
      setBody("");
      setFocused(false);
      requestAnimationFrame(resize);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div className="flex gap-3 px-4 py-3">
      <Avatar name={user.displayName} src={user.avatarUrl} />
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-200 ease-out",
            expanded && replyToName ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            {replyToName ? (
              <p className="mb-1 text-[13px] text-muted-foreground">
                <Trans
                  i18nKey="discussion.replyingTo"
                  values={{ handle: replyToName }}
                  components={{ handle: <span className="text-primary" /> }}
                />
              </p>
            ) : null}
          </div>
        </div>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={body}
            maxLength={COMMENT_MAX_LENGTH}
            disabled={disabled || busy}
            placeholder={placeholder}
            rows={1}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              if (!body.trim()) setFocused(false);
            }}
            onChange={(event) => {
              setBody(event.target.value);
              requestAnimationFrame(resize);
            }}
            onInput={resize}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                void submit();
              }
              if (event.key === "Escape" && onCancel) onCancel();
            }}
            className={cn(
              "w-full resize-none bg-transparent text-[17px] leading-6 text-foreground outline-none placeholder:text-muted-foreground transition-[min-height,padding] duration-200 ease-out disabled:opacity-50",
              expanded ? "max-h-[220px] min-h-[52px] pb-1 pr-0" : "max-h-10 min-h-10 pr-24",
            )}
          />
          <div
            className={cn(
              "flex items-center gap-3 transition-all duration-200 ease-out",
              expanded ? "relative mt-1 justify-between" : "absolute right-0 top-1/2 -translate-y-1/2 justify-end",
            )}
          >
            <div
              className={cn(
                "flex items-center gap-3 overflow-hidden transition-all duration-200 ease-out",
                expanded ? "max-w-40 opacity-100" : "max-w-0 opacity-0",
              )}
            >
              {onCancel ? (
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-[13px] text-muted-foreground hover:text-foreground"
                >
                  {t("common.cancel")}
                </button>
              ) : null}
              {body.length > 200 ? (
                <span className={cn("text-[13px]", remaining < 20 ? "text-red-500" : "text-muted-foreground")}>
                  {remaining}
                </span>
              ) : null}
            </div>
            <Button size="sm" disabled={!canPost} onClick={() => void submit()}>
              {busy ? t("discussion.posting") : t("discussion.reply")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentItem({
  node,
  parentName,
  activityId,
  large = false,
  lineAbove = false,
  lineBelow = false,
  canReply,
  canDelete,
  replyOpen,
  user,
  busy,
  onOpen,
  onReply,
  onCancelReply,
  onSubmitReply,
  onDelete,
}: {
  node: CommentNode;
  parentName?: string;
  activityId: string;
  large?: boolean;
  lineAbove?: boolean;
  lineBelow?: boolean;
  canReply: boolean;
  canDelete: boolean;
  replyOpen: boolean;
  user: User | null;
  busy: boolean;
  onOpen: (id: string) => void;
  onReply: (id: string) => void;
  onCancelReply: () => void;
  onSubmitReply: (parentId: string, body: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const count = replyCount(node);
  const deleted = isCommentDeleted(node);
  const [confirm, setConfirm] = useState(false);

  return (
    <div>
      <article
        className="flex cursor-pointer gap-3 px-4 hover:bg-hover"
        onClick={() => onOpen(node.id)}
      >
        <div className="flex w-10 shrink-0 flex-col items-center">
          {lineAbove ? <div className="h-2 w-[2px] bg-border" /> : <div className="h-3" />}
          <Link
            to={`/u/${node.authorId}`}
            className="shrink-0"
            onClick={(event) => event.stopPropagation()}
          >
            <Avatar name={node.authorName} src={node.authorAvatar} />
          </Link>
          {lineBelow ? <div className="mt-1 w-[2px] flex-1 bg-border" /> : <div className="flex-1" />}
        </div>
        <div className={cn("min-w-0 flex-1 pt-2", large ? "pb-4" : "pb-3")}>
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-1 text-[15px] leading-5">
                <Link
                  to={`/u/${node.authorId}`}
                  className="truncate font-bold hover:underline"
                  onClick={(event) => event.stopPropagation()}
                >
                  {node.authorName}
                </Link>
                <span className="truncate text-muted-foreground">@{node.authorHandle}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{formatCompactTime(node.createdAt)}</span>
              </div>
              {parentName && !deleted ? (
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  <Trans
                    i18nKey="discussion.replyingTo"
                    values={{ handle: parentName }}
                    components={{
                      handle: (
                        <Link
                          to={`/activities/${activityId}#c-${node.parentId}`}
                          className="text-primary hover:underline"
                          onClick={(event) => event.stopPropagation()}
                        />
                      ),
                    }}
                  />
                </p>
              ) : null}
            </div>
            {canDelete && !deleted ? (
              <button
                type="button"
                aria-label={t("common.delete")}
                className="rounded-full p-2 text-muted-foreground hover:bg-[#f4212e1a] hover:text-[#f4212e]"
                onClick={(event) => {
                  event.stopPropagation();
                  setConfirm(true);
                }}
              >
                <Trash2 className="size-4" />
              </button>
            ) : null}
          </div>
          {deleted ? (
            <p className={cn("mt-1 italic text-muted-foreground", large ? "text-[17px]" : "text-[15px]")}>
              {t("discussion.deleted")}
            </p>
          ) : (
            <p
              className={cn(
                "mt-1 whitespace-pre-wrap break-words text-foreground",
                large ? "text-[17px] leading-6" : "text-[15px] leading-5",
              )}
            >
              {node.body}
            </p>
          )}
          {canReply ? (
            <button
              type="button"
              aria-label={replyOpen ? t("discussion.cancelReply") : t("discussion.reply")}
              onClick={(event) => {
                event.stopPropagation();
                onReply(node.id);
              }}
              className="group mt-1 -ml-2 inline-flex items-center gap-1 text-muted-foreground hover:text-primary"
            >
              <span className="rounded-full p-2 group-hover:bg-[#1d9bf01a]">
                <MessageCircle className="size-[18px]" />
              </span>
              {count > 0 ? <span className="text-[13px] tabular-nums">{count}</span> : null}
            </button>
          ) : count > 0 ? (
            <p className="mt-2 inline-flex items-center gap-1 text-[13px] text-muted-foreground">
              <MessageCircle className="size-4" />
              {count}
            </p>
          ) : null}
        </div>
      </article>
      {replyOpen && canReply && user ? (
        <div className="border-t border-border" onClick={(event) => event.stopPropagation()}>
          <Composer
            user={user}
            placeholder={t("discussion.placeholder")}
            replyToName={node.authorHandle}
            busy={busy}
            autoFocus
            onCancel={onCancelReply}
            onSubmit={(body) => onSubmitReply(node.id, body)}
          />
        </div>
      ) : null}
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <h2 className="text-xl font-bold">{t("discussion.deleteTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("discussion.deleteBody")}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="ink"
            disabled={busy}
            onClick={async () => {
              try {
                await onDelete(node.id);
                setConfirm(false);
              } catch (err) {
                toast.error(errorMessage(err));
              }
            }}
          >
            {t("discussion.deleteAction")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function ThreadBranch({
  node,
  parentName,
  activityId,
  depth,
  canReply,
  isOrganizer,
  replyToId,
  user,
  busy,
  expanded,
  onToggleExpand,
  onOpen,
  onReply,
  onCancelReply,
  onSubmitReply,
  onDelete,
}: {
  node: CommentNode;
  parentName?: string;
  activityId: string;
  depth: number;
  canReply: boolean;
  isOrganizer: boolean;
  replyToId: string | null;
  user: User | null;
  busy: boolean;
  expanded: Set<string>;
  onToggleExpand: (id: string) => void;
  onOpen: (id: string) => void;
  onReply: (id: string) => void;
  onCancelReply: () => void;
  onSubmitReply: (parentId: string, body: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const showAll = depth === 0 || expanded.has(node.id);
  const hidden = showAll ? 0 : Math.max(0, node.replies.length - PREVIEW_REPLIES);
  const visible = hidden > 0 ? node.replies.slice(0, PREVIEW_REPLIES) : node.replies;
  const hasKids = visible.length > 0 || hidden > 0;

  return (
    <div>
      <CommentItem
        node={node}
        parentName={parentName}
        activityId={activityId}
        lineAbove={depth > 0}
        lineBelow={hasKids || replyToId === node.id}
        canReply={canReply}
        canDelete={Boolean(user && (isOrganizer || user.id === node.authorId))}
        replyOpen={replyToId === node.id}
        user={user}
        busy={busy}
        onOpen={onOpen}
        onReply={onReply}
        onCancelReply={onCancelReply}
        onSubmitReply={onSubmitReply}
        onDelete={onDelete}
      />
      {visible.map((child) => (
        <ThreadBranch
          key={child.id}
          node={child}
          parentName={node.authorHandle}
          activityId={activityId}
          depth={depth + 1}
          canReply={canReply}
          isOrganizer={isOrganizer}
          replyToId={replyToId}
          user={user}
          busy={busy}
          expanded={expanded}
          onToggleExpand={onToggleExpand}
          onOpen={onOpen}
          onReply={onReply}
          onCancelReply={onCancelReply}
          onSubmitReply={onSubmitReply}
          onDelete={onDelete}
        />
      ))}
      {hidden > 0 ? (
        <button
          type="button"
          onClick={() => onToggleExpand(node.id)}
          className="px-4 py-2 text-left text-[15px] text-primary hover:underline"
        >
          {t("discussion.showMore", { count: hidden })}
        </button>
      ) : null}
    </div>
  );
}

export function ActivityDiscussion({
  activity,
  user,
  canDiscuss,
  isOrganizer,
}: {
  activity: Activity;
  user: User | null;
  canDiscuss: boolean;
  isOrganizer: boolean;
}) {
  const { t } = useTranslation();
  const commentsQuery = useActivityComments(activity.id);
  const createComment = useCreateComment();
  const removeComment = useRemoveComment();
  const navigate = useNavigate();
  const location = useLocation();
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const authorIds = useMemo(
    () => [...new Set((commentsQuery.data ?? []).map((row) => row.authorId).filter(Boolean))],
    [commentsQuery.data],
  );
  const authorsQuery = useUsers(authorIds);
  const comments = useMemo(() => {
    const authors = new Map((authorsQuery.data ?? []).map((row) => [row.id, row]));
    return (commentsQuery.data ?? []).map((row) => liveComment(row, authors));
  }, [authorsQuery.data, commentsQuery.data]);
  const tree = useMemo(() => buildTree(comments), [comments]);
  const focusId = location.hash.startsWith("#c-") ? decodeURIComponent(location.hash.slice(3)) : null;
  const focused = focusId ? findNode(tree, focusId) : null;
  const ancestors = focusId && comments ? ancestorChain(comments, focusId) : [];

  useEffect(() => {
    if (location.hash !== "#discussion" && !location.hash.startsWith("#c-")) return;
    document.getElementById("discussion")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activity.id, commentsQuery.isSuccess, location.hash]);

  function openThread(id: string) {
    setReplyToId(null);
    navigate(`/activities/${activity.id}#c-${id}`);
  }

  function closeThread() {
    setReplyToId(null);
    navigate(`/activities/${activity.id}#discussion`);
  }

  async function post(body: string, parentId: string | null) {
    if (!user) return;
    await createComment.mutateAsync({
      activityId: activity.id,
      authorId: user.id,
      body,
      parentId,
    });
    setReplyToId(null);
  }

  async function remove(commentId: string) {
    if (!user) return;
    await removeComment.mutateAsync({
      activityId: activity.id,
      commentId,
      actorId: user.id,
    });
  }

  const busy = createComment.isPending || removeComment.isPending;

  const lockCopy = t("discussion.lockSignIn");

  return (
    <section id="discussion" className="border-t border-border">
      <div className="border-b border-border px-4 py-3">
        {focused ? (
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={closeThread}
              className="flex size-9 items-center justify-center rounded-full hover:bg-hover"
              aria-label={t("discussion.back")}
            >
              <ArrowLeft className="size-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold">{t("discussion.thread")}</h2>
              <p className="text-[13px] text-muted-foreground">{activity.title}</p>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold">{t("discussion.title")}</h2>
            <p className="text-[13px] text-muted-foreground">
              {!comments?.length
                ? t("discussion.emptyHint")
                : t("discussion.replyCount", { count: comments.length })}
            </p>
          </>
        )}
      </div>

      {focused ? (
        <div>
          {ancestors.map((item, index) => {
            const node: CommentNode = { ...item, replies: [] };
            const parent = index > 0 ? ancestors[index - 1] : null;
            return (
              <div key={item.id} className="border-b border-border/60">
                <CommentItem
                  node={node}
                  parentName={parent?.authorHandle}
                  activityId={activity.id}
                  lineBelow
                  canReply={canDiscuss}
                  canDelete={Boolean(user && (isOrganizer || user.id === item.authorId))}
                  replyOpen={replyToId === item.id}
                  user={user}
                  busy={busy}
                  onOpen={openThread}
                  onReply={(id) => setReplyToId((current) => (current === id ? null : id))}
                  onCancelReply={() => setReplyToId(null)}
                  onSubmitReply={(parentId, body) => post(body, parentId)}
                  onDelete={remove}
                />
              </div>
            );
          })}

          <div className="border-b border-border">
            <CommentItem
              node={focused}
              parentName={ancestors.at(-1)?.authorHandle}
              activityId={activity.id}
              large
              lineAbove={ancestors.length > 0}
              canReply={false}
              canDelete={Boolean(user && (isOrganizer || user.id === focused.authorId))}
              replyOpen={false}
              user={user}
              busy={busy}
              onOpen={() => undefined}
              onReply={() => undefined}
              onCancelReply={() => undefined}
              onSubmitReply={async () => undefined}
              onDelete={remove}
            />
          </div>

          {canDiscuss && user ? (
            <div className="border-b border-border">
              <Composer
                user={user}
                placeholder={t("discussion.placeholder")}
                replyToName={focused.authorHandle}
                busy={createComment.isPending}
                autoFocus
                onSubmit={(body) => post(body, focused.id)}
              />
            </div>
          ) : (
            <p className="border-b border-border px-4 py-4 text-[15px] text-muted-foreground">{lockCopy}</p>
          )}

          {focused.replies.map((child) => (
            <div key={child.id} className="border-b border-border">
              <ThreadBranch
                node={child}
                parentName={focused.authorHandle}
                activityId={activity.id}
                depth={0}
                canReply={canDiscuss}
                isOrganizer={isOrganizer}
                replyToId={replyToId}
                user={user}
                busy={busy}
                expanded={expanded}
                onToggleExpand={(id) =>
                  setExpanded((current) => {
                    const next = new Set(current);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  })
                }
                onOpen={openThread}
                onReply={(id) => setReplyToId((current) => (current === id ? null : id))}
                onCancelReply={() => setReplyToId(null)}
                onSubmitReply={(parentId, body) => post(body, parentId)}
                onDelete={remove}
              />
            </div>
          ))}

          {focused.replies.length === 0 ? (
            <p className="px-4 py-10 text-center text-[15px] text-muted-foreground">
              {t("discussion.noReplies")} {canDiscuss ? t("discussion.keepGoing") : ""}
            </p>
          ) : null}
        </div>
      ) : (
        <>
          {canDiscuss && user ? (
            <div className="border-b border-border">
              <Composer
                user={user}
                placeholder={t("discussion.placeholder")}
                busy={createComment.isPending}
                onSubmit={(body) => post(body, null)}
              />
            </div>
          ) : (
            <p className="border-b border-border px-4 py-4 text-[15px] text-muted-foreground">{lockCopy}</p>
          )}

          {commentsQuery.isLoading ? (
            <div className="space-y-3 px-4 py-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : null}

          {commentsQuery.isError ? (
            <p className="px-4 py-8 text-center text-[15px] text-muted-foreground">
              {t("discussion.loadError")}
            </p>
          ) : null}

          {!commentsQuery.isLoading && !commentsQuery.isError && tree.length === 0 ? (
            <p className="px-4 py-10 text-center text-[15px] text-muted-foreground">
              {t("discussion.noReplies")} {canDiscuss ? t("discussion.startThread") : ""}
            </p>
          ) : null}

          <div>
            {tree.map((node) => (
              <div key={node.id} className="border-b border-border">
                <ThreadBranch
                  node={node}
                  activityId={activity.id}
                  depth={0}
                  canReply={canDiscuss}
                  isOrganizer={isOrganizer}
                  replyToId={replyToId}
                  user={user}
                  busy={busy}
                  expanded={expanded}
                  onToggleExpand={(id) =>
                    setExpanded((current) => {
                      const next = new Set(current);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      return next;
                    })
                  }
                  onOpen={openThread}
                  onReply={(id) => setReplyToId((current) => (current === id ? null : id))}
                  onCancelReply={() => setReplyToId(null)}
                  onSubmitReply={(parentId, body) => post(body, parentId)}
                  onDelete={remove}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
