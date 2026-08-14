import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivityComments, useCreateComment } from "@/hooks/use-comments";
import { errorMessage } from "@/lib/errors";
import { formatCompactTime, handleFromName } from "@/lib/format";
import { COMMENT_MAX_LENGTH, type Activity, type ActivityComment, type User } from "@/lib/types";
import { cn } from "@/lib/utils";

type CommentNode = ActivityComment & { replies: CommentNode[] };

const PREVIEW_REPLIES = 3;

function buildTree(comments: ActivityComment[]): CommentNode[] {
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

function ancestorChain(comments: ActivityComment[], id: string): ActivityComment[] {
  const byId = new Map(comments.map((comment) => [comment.id, comment]));
  const chain: ActivityComment[] = [];
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
  const [body, setBody] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const remaining = COMMENT_MAX_LENGTH - body.length;
  const canPost = Boolean(body.trim()) && remaining >= 0 && !busy && !disabled;

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

  async function submit() {
    if (!canPost) return;
    const next = body.trim();
    try {
      await onSubmit(next);
      setBody("");
      requestAnimationFrame(resize);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div className="flex gap-3 px-4 py-3">
      <Avatar name={user.displayName} src={user.avatarUrl} />
      <div className="min-w-0 flex-1">
        {replyToName ? (
          <p className="mb-1 text-[13px] text-muted-foreground">
            Replying to <span className="text-primary">@{handleFromName(replyToName)}</span>
          </p>
        ) : null}
        <textarea
          ref={textareaRef}
          value={body}
          maxLength={COMMENT_MAX_LENGTH}
          disabled={disabled || busy}
          placeholder={placeholder}
          rows={1}
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
          className="max-h-[220px] min-h-[52px] w-full resize-none bg-transparent text-[17px] leading-6 text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
        />
        <div className="mt-2 flex items-center justify-between gap-3 border-t border-border pt-3">
          <div className="flex items-center gap-3">
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="text-[13px] text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            ) : null}
            {body.length > 200 ? (
              <span className={cn("text-[13px]", remaining < 20 ? "text-red-500" : "text-muted-foreground")}>
                {remaining}
              </span>
            ) : null}
          </div>
          <Button size="sm" disabled={!canPost} onClick={() => void submit()}>
            {busy ? "Posting…" : "Reply"}
          </Button>
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
  replyOpen,
  user,
  busy,
  onOpen,
  onReply,
  onCancelReply,
  onSubmitReply,
}: {
  node: CommentNode;
  parentName?: string;
  activityId: string;
  large?: boolean;
  lineAbove?: boolean;
  lineBelow?: boolean;
  canReply: boolean;
  replyOpen: boolean;
  user: User | null;
  busy: boolean;
  onOpen: (id: string) => void;
  onReply: (id: string) => void;
  onCancelReply: () => void;
  onSubmitReply: (parentId: string, body: string) => Promise<void>;
}) {
  const count = replyCount(node);

  return (
    <div>
      <article
        className="flex cursor-pointer gap-3 px-4 hover:bg-hover"
        onClick={() => onOpen(node.id)}
      >
        <div className="flex w-10 shrink-0 flex-col items-center">
          {lineAbove ? <div className="h-2 w-[2px] bg-border" /> : <div className={large ? "h-3" : "h-3"} />}
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
          <div className="flex flex-wrap items-baseline gap-x-1 text-[15px] leading-5">
            <Link
              to={`/u/${node.authorId}`}
              className="truncate font-bold hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              {node.authorName}
            </Link>
            <span className="truncate text-muted-foreground">@{handleFromName(node.authorName)}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{formatCompactTime(node.createdAt)}</span>
          </div>
          {parentName ? (
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Replying to{" "}
              <Link
                to={`/activities/${activityId}#c-${node.parentId}`}
                className="text-primary hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                @{handleFromName(parentName)}
              </Link>
            </p>
          ) : null}
          <p
            className={cn(
              "mt-1 whitespace-pre-wrap break-words text-foreground",
              large ? "text-[17px] leading-6" : "text-[15px] leading-5",
            )}
          >
            {node.body}
          </p>
          {canReply ? (
            <button
              type="button"
              aria-label={replyOpen ? "Cancel reply" : "Reply"}
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
            placeholder="Post your reply"
            replyToName={node.authorName}
            busy={busy}
            autoFocus
            onCancel={onCancelReply}
            onSubmit={(body) => onSubmitReply(node.id, body)}
          />
        </div>
      ) : null}
    </div>
  );
}

function ThreadBranch({
  node,
  parentName,
  activityId,
  depth,
  canReply,
  replyToId,
  user,
  busy,
  expanded,
  onToggleExpand,
  onOpen,
  onReply,
  onCancelReply,
  onSubmitReply,
}: {
  node: CommentNode;
  parentName?: string;
  activityId: string;
  depth: number;
  canReply: boolean;
  replyToId: string | null;
  user: User | null;
  busy: boolean;
  expanded: Set<string>;
  onToggleExpand: (id: string) => void;
  onOpen: (id: string) => void;
  onReply: (id: string) => void;
  onCancelReply: () => void;
  onSubmitReply: (parentId: string, body: string) => Promise<void>;
}) {
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
        replyOpen={replyToId === node.id}
        user={user}
        busy={busy}
        onOpen={onOpen}
        onReply={onReply}
        onCancelReply={onCancelReply}
        onSubmitReply={onSubmitReply}
      />
      {visible.map((child) => (
        <ThreadBranch
          key={child.id}
          node={child}
          parentName={node.authorName}
          activityId={activityId}
          depth={depth + 1}
          canReply={canReply}
          replyToId={replyToId}
          user={user}
          busy={busy}
          expanded={expanded}
          onToggleExpand={onToggleExpand}
          onOpen={onOpen}
          onReply={onReply}
          onCancelReply={onCancelReply}
          onSubmitReply={onSubmitReply}
        />
      ))}
      {hidden > 0 ? (
        <button
          type="button"
          onClick={() => onToggleExpand(node.id)}
          className="px-4 py-2 text-left text-[15px] text-primary hover:underline"
        >
          Show {hidden} more {hidden === 1 ? "reply" : "replies"}
        </button>
      ) : null}
    </div>
  );
}

export function ActivityDiscussion({
  activity,
  user,
  canDiscuss,
  membershipStatus,
}: {
  activity: Activity;
  user: User | null;
  canDiscuss: boolean;
  membershipStatus?: "joined" | "pending" | null;
}) {
  const commentsQuery = useActivityComments(activity.id);
  const createComment = useCreateComment();
  const navigate = useNavigate();
  const location = useLocation();
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const comments = commentsQuery.data;
  const tree = useMemo(() => buildTree(comments ?? []), [comments]);
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

  const lockCopy =
    membershipStatus === "pending"
      ? "You’ll be able to reply once the organizer accepts you."
      : "Join this activity to reply.";

  return (
    <section id="discussion" className="border-t border-border">
      <div className="border-b border-border px-4 py-3">
        {focused ? (
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={closeThread}
              className="flex size-9 items-center justify-center rounded-full hover:bg-hover"
              aria-label="Back to discussion"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold">Thread</h2>
              <p className="text-[13px] text-muted-foreground">{activity.title}</p>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold">Discussion</h2>
            <p className="text-[13px] text-muted-foreground">
              {!comments?.length
                ? "Reply as many times as you want. Replies can have replies."
                : `${comments.length} ${comments.length === 1 ? "reply" : "replies"}`}
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
                  parentName={parent?.authorName}
                  activityId={activity.id}
                  lineBelow
                  canReply={canDiscuss}
                  replyOpen={replyToId === item.id}
                  user={user}
                  busy={createComment.isPending}
                  onOpen={openThread}
                  onReply={(id) => setReplyToId((current) => (current === id ? null : id))}
                  onCancelReply={() => setReplyToId(null)}
                  onSubmitReply={(parentId, body) => post(body, parentId)}
                />
              </div>
            );
          })}

          <div className="border-b border-border">
            <CommentItem
              node={focused}
              parentName={ancestors.at(-1)?.authorName}
              activityId={activity.id}
              large
              lineAbove={ancestors.length > 0}
              canReply={false}
              replyOpen={false}
              user={user}
              busy={createComment.isPending}
              onOpen={() => undefined}
              onReply={() => undefined}
              onCancelReply={() => undefined}
              onSubmitReply={async () => undefined}
            />
          </div>

          {canDiscuss && user ? (
            <div className="border-b border-border">
              <Composer
                user={user}
                placeholder="Post your reply"
                replyToName={focused.authorName}
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
                parentName={focused.authorName}
                activityId={activity.id}
                depth={0}
                canReply={canDiscuss}
                replyToId={replyToId}
                user={user}
                busy={createComment.isPending}
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
              />
            </div>
          ))}

          {focused.replies.length === 0 ? (
            <p className="px-4 py-10 text-center text-[15px] text-muted-foreground">
              No replies yet. {canDiscuss ? "Keep the thread going." : ""}
            </p>
          ) : null}
        </div>
      ) : (
        <>
          {canDiscuss && user ? (
            <div className="border-b border-border">
              <Composer
                user={user}
                placeholder="Post your reply"
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
              Couldn’t load replies. Try refreshing.
            </p>
          ) : null}

          {!commentsQuery.isLoading && !commentsQuery.isError && tree.length === 0 ? (
            <p className="px-4 py-10 text-center text-[15px] text-muted-foreground">
              No replies yet. {canDiscuss ? "Start the thread — you can post more than once." : ""}
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
                  replyToId={replyToId}
                  user={user}
                  busy={createComment.isPending}
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
                />
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
