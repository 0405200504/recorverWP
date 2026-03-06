'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
    Node,
    Edge,
    NodeChange,
    EdgeChange,
    Connection,
    Handle,
    Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CampaignStep } from '@/app/dashboard/actions';

const CustomNode = ({ data, id }: any) => {
    return (
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', minWidth: '280px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <Handle type="target" position={Position.Top} style={{ background: 'var(--text-3)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: 'var(--accent-bg)', color: 'var(--accent)', padding: '4px', borderRadius: '6px' }}>
                        {data.isTrigger ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                        )}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>
                        {data.isTrigger ? 'Gatilho da Campanha' : `Mensagem #${data.index}`}
                    </span>
                </div>
                {!data.isTrigger && (
                    <button onClick={() => data.onDelete(id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                )}
            </div>

            {!data.isTrigger && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--surface-2)', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', color: 'var(--text-2)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        Aguardar
                        <input type="number" min="0" value={data.step.delayValue} onChange={(e) => data.onUpdate(id, 'delayValue', Number(e.target.value))} style={{ width: '40px', background: 'transparent', border: 'none', color: '#fff', borderBottom: '1px solid var(--border-3)', outline: 'none', textAlign: 'center' }} />
                        <select value={data.step.delayUnit} onChange={(e) => data.onUpdate(id, 'delayUnit', e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', outline: 'none', cursor: 'pointer' }}>
                            <option value="seconds">Seg</option>
                            <option value="minutes">Min</option>
                            <option value="hours">Horas</option>
                        </select>
                    </div>
                    <textarea
                        value={data.step.textContent}
                        onChange={(e) => data.onUpdate(id, 'textContent', e.target.value)}
                        placeholder="Sua mensagem..."
                        style={{ width: '100%', minHeight: '60px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', color: '#fff', fontSize: '12px', resize: 'vertical', outline: 'none' }}
                    />
                </div>
            )}

            {data.isTrigger && (
                <div style={{ fontSize: '12px', color: 'var(--text-2)', padding: '8px', background: 'var(--surface-3)', borderRadius: '8px' }}>
                    O fluxo começa quando o evento "{data.triggerName}" ocorre.
                </div>
            )}

            <Handle type="source" position={Position.Bottom} style={{ background: 'var(--accent)', width: '10px', height: '10px' }} />
        </div>
    );
};

const nodeTypes = { custom: CustomNode };

interface FlowBuilderProps {
    steps: CampaignStep[];
    setSteps: (steps: CampaignStep[]) => void;
    triggerEvent: string;
}

export function FlowBuilder({ steps, setSteps, triggerEvent }: FlowBuilderProps) {
    // Inicializamos os nós transformando os "steps" num grafo linear
    const initialNodes: Node[] = [
        {
            id: 'trigger',
            type: 'custom',
            position: { x: 250, y: 50 },
            data: { isTrigger: true, triggerName: triggerEvent, step: {} },
            draggable: false
        }
    ];

    const initialEdges: Edge[] = [];

    steps.forEach((step, idx) => {
        const id = `step-${idx}`;
        initialNodes.push({
            id,
            type: 'custom',
            position: { x: 250, y: 200 + (idx * 250) },
            data: { isTrigger: false, step, index: idx + 1 }
        });

        if (idx === 0) {
            initialEdges.push({ id: `e-trigger-${id}`, source: 'trigger', target: id, animated: true, style: { stroke: 'var(--accent)' } });
        } else {
            initialEdges.push({ id: `e-step-${idx - 1}-${id}`, source: `step-${idx - 1}`, target: id, animated: true, style: { stroke: 'var(--accent)' } });
        }
    });

    const [nodes, setNodes] = useState<Node[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>(initialEdges);

    // Sincronizar ReactFlow state -> Parent state
    useEffect(() => {
        const sortedNodes = [...nodes]
            .filter(n => n.id !== 'trigger')
            .sort((a, b) => a.position.y - b.position.y); // Ordena de cima pra baixo

        // Atualiza a prop setSteps baseada na ordem visual (Y) e remove referência a trigger
        const newSteps = sortedNodes.map(n => n.data.step as CampaignStep);

        // Evita loop infinito comparando JSON
        if (JSON.stringify(newSteps) !== JSON.stringify(steps)) {
            setSteps(newSteps);
        }
    }, [nodes, edges]);

    // Atualizações do Diagrama
    const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
    const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
    const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: 'var(--accent)' } } as any, eds)), []);

    const handleUpdateNode = (nodeId: string, field: string, value: any) => {
        setNodes(nds => nds.map(node => {
            if (node.id === nodeId) {
                const step = (node.data.step || {}) as any;
                return { ...node, data: { ...node.data, step: { ...step, [field]: value } } };
            }
            return node;
        }));
    };

    const handleDeleteNode = (nodeId: string) => {
        setNodes(nds => nds.filter(n => n.id !== nodeId));
        setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    };

    const addStep = () => {
        const newId = `step-${Date.now()}`;
        const lastNode = nodes[nodes.length - 1];

        const newNode: Node = {
            id: newId,
            type: 'custom',
            position: { x: lastNode.position.x, y: lastNode.position.y + 250 },
            data: {
                isTrigger: false,
                index: nodes.length,
                step: { delayValue: 10, delayUnit: 'minutes', messageType: 'text', textContent: '', mediaUrl: '' },
            }
        };

        setNodes([...nodes, newNode]);
        setEdges([...edges, { id: `e-${lastNode.id}-${newId}`, source: lastNode.id, target: newId, animated: true, style: { stroke: 'var(--accent)' } }]);
    };

    // Injetar callbacks no data dos nós
    const nodesWithCallbacks = nodes.map(n => ({
        ...n,
        data: {
            ...n.data,
            triggerName: triggerEvent, // Manter o trigger syncado com form
            onUpdate: handleUpdateNode,
            onDelete: handleDeleteNode
        }
    }));

    return (
        <div style={{ width: '100%', height: '500px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--bg)', marginBottom: '16px', position: 'relative' }}>
            <ReactFlow
                nodes={nodesWithCallbacks}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
            >
                <Background gap={16} color="var(--border)" />
                <Controls style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', fill: 'var(--text-1)' }} />
            </ReactFlow>
            <button type="button" onClick={addStep} style={{ position: 'absolute', bottom: '16px', right: '16px', zIndex: 10, padding: '10px 16px', background: 'var(--accent)', color: '#000', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                + Adicionar Mensagem
            </button>
        </div>
    );
}
