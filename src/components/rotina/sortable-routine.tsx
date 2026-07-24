"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { reorderRoutineExercises } from "@/lib/actions/rotina";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export type SortableItem = { id: string; node: ReactNode };

const sortedKey = (ids: string[]) => [...ids].sort().join("|");
const sameOrder = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

export function SortableRoutine({ dia, items }: { dia: number; items: SortableItem[] }) {
  const incomingIds = items.map((i) => i.id);
  const [order, setOrderState] = useState<string[]>(incomingIds);
  const [prevKey, setPrevKey] = useState(sortedKey(incomingIds));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement | null>());
  const orderRef = useRef(order);
  const draggingIdRef = useRef<string | null>(null);
  const pointerYRef = useRef<number | null>(null);
  const grabOffsetRef = useRef(0);
  const orderAtGrabRef = useRef<string[]>(order);

  // Usado apenas em handlers: mantém o ref em sincronia síncrona com o estado durante o arrasto.
  const setOrder = (next: string[]) => {
    orderRef.current = next;
    setOrderState(next);
  };

  // Mantém orderRef sincronizado após qualquer mudança de estado (inclui o reconcile abaixo).
  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  // Reconcilia quando exercícios são adicionados/removidos (o conjunto de ids muda):
  // volta para a ordem do servidor. Reordenações do usuário são preservadas (mesmo conjunto).
  const curKey = sortedKey(incomingIds);
  if (curKey !== prevKey) {
    setPrevKey(curKey);
    setOrderState(incomingIds);
  }

  const byId = new Map(items.map((i) => [i.id, i.node]));
  const sortable = items.length > 1;

  function applyDragTransform() {
    const id = draggingIdRef.current;
    const container = containerRef.current;
    if (!id || !container || pointerYRef.current == null) return;
    const el = rowRefs.current.get(id);
    if (!el) return;
    const containerTop = container.getBoundingClientRect().top;
    const laidOutTop = containerTop + el.offsetTop;
    const desiredTop = pointerYRef.current - grabOffsetRef.current;
    el.style.transform = `translateY(${desiredTop - laidOutTop}px) scale(1.02)`;
  }

  // Após um reflow por reordenação, recalcula o transform para o item seguir o dedo sem "pulos".
  useLayoutEffect(() => {
    if (draggingIdRef.current) applyDragTransform();
  }, [order]);

  function computeOrder(pointerY: number): string[] | null {
    const dragId = draggingIdRef.current;
    if (!dragId) return null;
    const others = orderRef.current.filter((x) => x !== dragId);
    let insertAt = others.length;
    for (let i = 0; i < others.length; i++) {
      const el = rowRefs.current.get(others[i]);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (pointerY < rect.top + rect.height / 2) {
        insertAt = i;
        break;
      }
    }
    const next = [...others];
    next.splice(insertAt, 0, dragId);
    return next;
  }

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>, id: string) {
    if (!sortable) return;
    const el = rowRefs.current.get(id);
    if (!el) return;
    e.preventDefault();
    grabOffsetRef.current = e.clientY - el.getBoundingClientRect().top;
    pointerYRef.current = e.clientY;
    draggingIdRef.current = id;
    orderAtGrabRef.current = orderRef.current;
    setDraggingId(id);
    e.currentTarget.setPointerCapture(e.pointerId);
    applyDragTransform();
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!draggingIdRef.current) return;
    e.preventDefault();
    pointerYRef.current = e.clientY;
    applyDragTransform();
    const next = computeOrder(e.clientY);
    if (next && !sameOrder(next, orderRef.current)) setOrder(next);
  }

  function endDrag(e: React.PointerEvent<HTMLButtonElement>) {
    const dragId = draggingIdRef.current;
    if (!dragId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    const el = rowRefs.current.get(dragId);
    if (el) el.style.transform = "";
    const finalOrder = orderRef.current;
    const before = orderAtGrabRef.current;
    draggingIdRef.current = null;
    pointerYRef.current = null;
    setDraggingId(null);

    if (!sameOrder(finalOrder, before)) {
      startTransition(async () => {
        const res = await reorderRoutineExercises(dia, finalOrder);
        if (res?.error) {
          toast(res.error, "error");
          setOrder(before);
        }
      });
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative flex flex-col gap-3", draggingId && "select-none")}
    >
      {order.map((id) => {
        const node = byId.get(id);
        if (node == null) return null;
        const isDragging = draggingId === id;
        return (
          <div
            key={id}
            ref={(el) => {
              rowRefs.current.set(id, el);
            }}
            className={cn(
              "flex items-stretch gap-2",
              isDragging && "relative z-50 shadow-xl",
            )}
          >
            {sortable ? (
              <button
                type="button"
                aria-label="Arrastar para reordenar"
                onPointerDown={(e) => onPointerDown(e, id)}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                style={{ touchAction: "none" }}
                className={cn(
                  "flex w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted",
                  isDragging ? "cursor-grabbing bg-muted text-foreground" : "cursor-grab",
                )}
              >
                <GripVertical className="size-5" />
              </button>
            ) : null}
            <div className="min-w-0 flex-1">{node}</div>
          </div>
        );
      })}
    </div>
  );
}
