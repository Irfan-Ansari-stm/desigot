"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Layers,
  Eye,
  Plus,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import { CategoryStatusBadge } from "./CategoryStatusBadge";

interface TreeNode {
  id: string;
  name: string;
  slug: string;
  depth: number;
  category_type: string;
  status: string;
  visibility: string;
  display_order: number;
  service_count: number;
  product_count: number;
  children: TreeNode[];
}

export function CategoryTreeView() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const fetchTree = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/categories/tree");
      if (res.data?.success) {
        const roots: TreeNode[] = res.data.data.tree || [];
        setTree(roots);
        // Expand roots by default
        const initialExpanded: Record<string, boolean> = {};
        roots.forEach((r) => {
          initialExpanded[r.id] = true;
        });
        setExpanded(initialExpanded);
      }
    } catch (err) {
      console.error("Failed to load category tree:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  const toggleNode = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allExp: Record<string, boolean> = {};
    const traverse = (nodes: TreeNode[]) => {
      nodes.forEach((n) => {
        allExp[n.id] = true;
        if (n.children?.length > 0) traverse(n.children);
      });
    };
    traverse(tree);
    setExpanded(allExp);
  };

  const collapseAll = () => {
    setExpanded({});
  };

  const renderNode = (node: TreeNode, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = !!expanded[node.id];

    return (
      <div key={node.id} className="space-y-1">
        <div
          className={`flex items-center justify-between p-2.5 rounded-xl transition-all ${
            level === 0
              ? "bg-slate-900/80 border border-slate-800/80 hover:border-slate-700"
              : "hover:bg-slate-800/40"
          }`}
          style={{ marginLeft: `${level * 22}px` }}
        >
          <div className="flex items-center gap-2.5">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleNode(node.id)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-purple-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>
            ) : (
              <span className="w-6" />
            )}

            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-purple-400 shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-slate-400 shrink-0" />
            )}

            <Link
              href={`/dashboard/categories-taxonomy/${node.id}`}
              className="text-sm font-semibold text-white hover:text-purple-400 transition-colors"
            >
              {node.name}
            </Link>

            <span className="text-[11px] font-mono text-slate-500">
              /{node.slug}
            </span>

            {hasChildren && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {node.children.length} sub
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <CategoryStatusBadge type={node.category_type} size="sm" />
            <CategoryStatusBadge status={node.status} size="sm" />
            <Link
              href={`/dashboard/categories-taxonomy/${node.id}`}
              className="p-1 rounded text-slate-400 hover:text-white"
              title="View Category Details"
            >
              <Eye className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 animate-pulse space-y-3">
        <div className="h-6 bg-slate-800 rounded w-1/3" />
        <div className="h-24 bg-slate-800/50 rounded-xl" />
        <div className="h-24 bg-slate-800/50 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-2xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-bold text-white">Hierarchical Taxonomy Tree</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Collapse All
          </button>
          <button
            onClick={fetchTree}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            title="Refresh Hierarchy"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-2">
        {tree.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No categories available in hierarchy</p>
        ) : (
          tree.map((root) => renderNode(root, 0))
        )}
      </div>
    </div>
  );
}
