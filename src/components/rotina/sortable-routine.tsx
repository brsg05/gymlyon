"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { reorderRoutineExercises } from "@/lib/actions/rotina";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export type SortableItem = { id: string; node: ReactNode };

const sortedKey = (ids: string[]) => [...ids].sort().join("|");
const sameOrder = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

/** Distância da borda da viewport (px) onde o auto-scroll começa. */
const SCROLL_EDGE = 72;
/** Velocidade máxima do auto-scroll (px por frame). */
const SCROLL_SPEED = 18;

type Drag = {
  id: string;
  pointerId: number;
  /** Posição do ponteiro no documento (clientY + scrollY) no início do arrasto. */
  startDocY: number;
  lastClientY: number;
  /** Quanto os vizinhos se deslocam para abrir espaço: altura do item + gap. */
  displacement: number;
  /** Índice original do item arrastado. */
  fromIdx: number;
  /** Demais itens em ordem visual, com o centro em coordenadas de documento (medido 1x no grab). */
  others: { id: string; midDocY: number }[];
  /** Posição de inserção corrente (0..others.length). */
  targetIdx: number;
  raf: number;
};

export function SortableRoutine({ dia, items }: { dia: number; items: SortableItem[] }) {
  const incomingIds = items.map((i) => i.id);
  const [order, setOrderState] = useState<string[]>(incomingIds);
  const [prevKey, setPrevKey] = useState(sortedKey(incomingIds));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement | null>());
  const orderRef = useRef(order);
  const dragRef = useRef<Drag | null>(null);
  const pendingCleanupRef = useRef(false);

  // Usado apenas em handlers: mantém o ref em sincronia síncrona com o estado.
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

  function clearRowStyles() {
    for (const el of rowRefs.current.values()) {
      if (!el) continue;
      el.style.transform = "";
      el.style.transition = "";
      el.style.willChange = "";
    }
  }

  // Limpa os transforms no mesmo frame em que o React reordena o DOM (sem "pulo" visual).
  useLayoutEffect(() => {
    if (!pendingCleanupRef.current) return;
    pendingCleanupRef.current = false;
    clearRowStyles();
  }, [order, draggingId]);

  // Cancela o loop se o componente desmontar no meio de um arrasto.
  useEffect(
    () => () => {
      if (dragRef.current) cancelAnimationFrame(dragRef.current.raf);
    },
    [],
  );

  // Loop por frame: segue o dedo, auto-scroll na borda e desloca vizinhos via CSS puro.
  // Nada de re-render nem de leitura de layout aqui — toda a geometria foi medida no grab.
  function frame() {
    const d = dragRef.current;
    if (!d) return;

    // Auto-scroll quando o ponteiro se aproxima da borda da viewport (permite
    // levar o primeiro item ao fim de uma lista maior que a tela em um gesto só).
    const y = d.lastClientY;
    const vh = window.innerHeight;
    let dy = 0;
    if (y < SCROLL_EDGE) dy = -SCROLL_SPEED * Math.min(1, (SCROLL_EDGE - y) / SCROLL_EDGE);
    else if (y > vh - SCROLL_EDGE) dy = SCROLL_SPEED * Math.min(1, (y - (vh - SCROLL_EDGE)) / SCROLL_EDGE);
    if (dy !== 0) window.scrollBy(0, dy);

    // Em coordenadas de documento, as posições medidas no grab continuam válidas
    // mesmo com a página rolando.
    const docY = y + window.scrollY;

    const el = rowRefs.current.get(d.id);
    if (el) el.style.transform = `translate3d(0, ${docY - d.startDocY}px, 0) scale(1.02)`;

    let idx = d.others.length;
    for (let i = 0; i < d.others.length; i++) {
      if (docY < d.others[i].midDocY) {
        idx = i;
        break;
      }
    }
    if (idx !== d.targetIdx) {
      d.targetIdx = idx;
      for (let j = 0; j < d.others.length; j++) {
        const o = rowRefs.current.get(d.others[j].id);
        if (!o) continue;
        const shift =
          j < d.fromIdx && j >= idx ? d.displacement : j >= d.fromIdx && j < idx ? -d.displacement : 0;
        o.style.transform = shift ? `translate3d(0, ${shift}px, 0)` : "";
      }
    }

    d.raf = requestAnimationFrame(frame);
  }

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>, id: string) {
    if (!sortable || dragRef.current) return;
    const container = containerRef.current;
    const el = rowRefs.current.get(id);
    if (!container || !el) return;
    e.preventDefault();

    // Única medição de layout de todo o arrasto.
    const scrollY = window.scrollY;
    const gap = parseFloat(getComputedStyle(container).rowGap) || 0;
    const ids = orderRef.current;
    const others: Drag["others"] = [];
    for (const oid of ids) {
      if (oid === id) continue;
      const oel = rowRefs.current.get(oid);
      if (!oel) continue;
      const r = oel.getBoundingClientRect();
      others.push({ id: oid, midDocY: r.top + scrollY + r.height / 2 });
      oel.style.transition = "transform 150ms ease";
    }
    const rect = el.getBoundingClientRect();
    el.style.willChange = "transform";

    const fromIdx = ids.indexOf(id);
    dragRef.current = {
      id,
      pointerId: e.pointerId,
      startDocY: e.clientY + scrollY,
      lastClientY: e.clientY,
      displacement: rect.height + gap,
      fromIdx,
      others,
      targetIdx: fromIdx,
      raf: 0,
    };
    setDraggingId(id);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current.raf = requestAnimationFrame(frame);
  }

  // Só anota a posição; todo o trabalho acontece 1x por frame no loop de rAF.
  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    d.lastClientY = e.clientY;
  }

  function endDrag(e: React.PointerEvent<HTMLButtonElement>) {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    dragRef.current = null;
    cancelAnimationFrame(d.raf);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const before = orderRef.current;
    const others = before.filter((x) => x !== d.id);
    const next = [...others];
    next.splice(d.targetIdx, 0, d.id);

    // Estilos inline são limpos no layout effect, já com o DOM na ordem final.
    pendingCleanupRef.current = true;
    setDraggingId(null);
    if (sameOrder(next, before)) return;

    setOrder(next);
    startTransition(async () => {
      const res = await reorderRoutineExercises(dia, next);
      if (res?.error) {
        toast(res.error, "error");
        setOrder(before);
      }
    });
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
