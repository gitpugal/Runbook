import type { Node, Edge } from "reactflow";

export function autoLayoutNodes<T>(
    nodes: Node<T>[],
    edges: Edge[]
): Node<T>[] {
    const incoming = new Map<string, number>();
    nodes.forEach((n) => incoming.set(n.id, 0));
    edges.forEach((e) =>
        incoming.set(e.target, (incoming.get(e.target) || 0) + 1)
    );

    const roots = nodes.filter((n) => incoming.get(n.id) === 0);

    const level = new Map<string, number>();
    const queue = roots.map((n) => ({ id: n.id, lvl: 0 }));
    roots.forEach((n) => level.set(n.id, 0));

    while (queue.length) {
        const { id, lvl } = queue.shift()!;
        edges
            .filter((e) => e.source === id)
            .forEach((e) => {
                if (!level.has(e.target)) {
                    level.set(e.target, lvl + 1);
                    queue.push({ id: e.target, lvl: lvl + 1 });
                }
            });
    }

    const grouped: Record<number, Node<T>[]> = {};
    nodes.forEach((n) => {
        const l = level.get(n.id) ?? 0;
        grouped[l] = grouped[l] || [];
        grouped[l].push(n);
    });

    return Object.entries(grouped).flatMap(([lvl, ns]) =>
        ns.map((n, i) => ({
            ...n,
            position: {
                x: Number(lvl) * 260,
                y: i * 120,
            },
        }))
    );
}
