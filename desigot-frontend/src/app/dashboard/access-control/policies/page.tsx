"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import {
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Shield,
  Layers,
  Cpu,
  Save,
  Search,
  Check,
  X,
  Sliders,
  Sparkles,
} from "lucide-react";
import type { AccessPolicy, Role, AppModule, ApiRoutePermission } from "@/types/rbac";

function AccessControlContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "policies";
  const [activeTab, setActiveTab] = useState<"policies" | "modules" | "api">(
    initialTab === "modules" ? "modules" : initialTab === "api" ? "api" : "policies"
  );

  // ── 1. POLICIES TAB STATE ──────────────────────────────────────────────────
  const [policies, setPolicies] = useState<AccessPolicy[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(true);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [policyForm, setPolicyForm] = useState({
    name: "",
    slug: "",
    description: "",
    effect: "allow",
    subject_type: "role",
    resource: "*",
    action: "*",
    priority: 10,
  });

  // ── 2. MODULE ACCESS TAB STATE ──────────────────────────────────────────────
  const [moduleRoles, setModuleRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<AppModule[]>([]);
  const [moduleAccessMap, setModuleAccessMap] = useState<
    Record<string, { access_level: string; is_accessible: boolean }>
  >({});
  const [moduleChanges, setModuleChanges] = useState<
    Record<string, { roleId: string; moduleId: string; accessLevel: string; isAccessible: boolean }>
  >({});
  const [moduleLoading, setModuleLoading] = useState(false);
  const [moduleSaving, setModuleSaving] = useState(false);

  // ── 3. API PERMISSIONS TAB STATE ────────────────────────────────────────────
  const [apiRoutes, setApiRoutes] = useState<ApiRoutePermission[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiSearch, setApiSearch] = useState("");
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [apiForm, setApiForm] = useState({
    module: "users",
    method: "GET" as "GET" | "POST" | "PUT" | "DELETE",
    endpoint: "",
    required_permission: "",
    description: "",
  });

  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  // Update activeTab when query param changes
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "modules") setActiveTab("modules");
    else if (tabParam === "api") setActiveTab("api");
    else if (tabParam === "policies") setActiveTab("policies");
  }, [searchParams]);

  // Load Policies
  const loadPolicies = async () => {
    try {
      setPoliciesLoading(true);
      const res = await apiGet<AccessPolicy[]>("/access-control/policies");
      if (Array.isArray(res)) setPolicies(res);
    } catch (err: any) {
      console.error("Failed to load access policies:", err);
    } finally {
      setPoliciesLoading(false);
    }
  };

  // Load Module Access
  const loadModuleAccess = async () => {
    try {
      setModuleLoading(true);
      const res = await apiGet<{
        roles: Role[];
        modules: AppModule[];
        access: Record<string, { access_level: string; is_accessible: boolean }>;
      }>("/rbac/modules/access");

      if (res) {
        setModuleRoles(res.roles || []);
        setModules(res.modules || []);
        setModuleAccessMap(res.access || {});
        setModuleChanges({});
      }
    } catch (err: any) {
      console.error("Failed to load module access:", err);
    } finally {
      setModuleLoading(false);
    }
  };

  // Load API Route Permissions
  const loadApiRoutes = async () => {
    try {
      setApiLoading(true);
      const res = await apiGet<ApiRoutePermission[]>("/rbac/api-permissions", {
        search: apiSearch || undefined,
      });
      if (Array.isArray(res)) setApiRoutes(res);
      else if (res && (res as any).data) setApiRoutes((res as any).data);
    } catch (err: any) {
      console.error("Failed to load api routes:", err);
    } finally {
      setApiLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "policies") loadPolicies();
    else if (activeTab === "modules") loadModuleAccess();
    else if (activeTab === "api") loadApiRoutes();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "api") loadApiRoutes();
  }, [apiSearch]);

  // Handle Policy Create
  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    try {
      await apiPost("/access-control/policies", policyForm);
      setActionSuccess(`Policy "${policyForm.name}" created successfully.`);
      setIsPolicyModalOpen(false);
      loadPolicies();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to create policy");
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (!confirm("Are you sure you want to delete this access policy?")) return;
    try {
      await apiDelete(`/access-control/policies/${id}`);
      setActionSuccess("Policy deleted.");
      loadPolicies();
    } catch (err: any) {
      alert("Failed to delete policy: " + err.message);
    }
  };

  // Handle Module Access Change
  const handleModuleAccessChange = (roleId: string, moduleId: string, accessLevel: string) => {
    const key = `${roleId}_${moduleId}`;
    setModuleChanges((prev) => ({
      ...prev,
      [key]: {
        roleId,
        moduleId,
        accessLevel,
        isAccessible: accessLevel !== "none",
      },
    }));
  };

  const handleSaveModuleAccess = async () => {
    const updates = Object.values(moduleChanges);
    if (!updates.length) return;

    try {
      setModuleSaving(true);
      setActionError("");
      await apiPut("/rbac/modules/access", { updates });
      setActionSuccess(`Successfully saved ${updates.length} module access changes.`);
      loadModuleAccess();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to save module access.");
    } finally {
      setModuleSaving(false);
    }
  };

  // Handle API Permission Create
  const handleCreateApiRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionError("");
      await apiPost("/rbac/api-permissions", apiForm);
      setActionSuccess("API Route permission registered successfully.");
      setIsApiModalOpen(false);
      loadApiRoutes();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to register API route.");
    }
  };

  const handleDeleteApiRoute = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API route permission?")) return;
    try {
      await apiDelete(`/rbac/api-permissions/${id}`);
      setActionSuccess("API Route permission deleted.");
      loadApiRoutes();
    } catch (err: any) {
      alert("Failed to delete API route: " + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Lock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Access Control, Modules & API Security
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure dynamic ABAC policies, role-based module access gates, and protected API endpoint permissions.
          </p>
        </div>

        {activeTab === "policies" && (
          <button
            onClick={() => {
              setPolicyForm({
                name: "",
                slug: "",
                description: "",
                effect: "allow",
                subject_type: "role",
                resource: "*",
                action: "*",
                priority: 10,
              });
              setIsPolicyModalOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-2 transition"
          >
            <Plus className="h-4 w-4" /> Add Access Policy
          </button>
        )}

        {activeTab === "modules" && Object.keys(moduleChanges).length > 0 && (
          <button
            onClick={handleSaveModuleAccess}
            disabled={moduleSaving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-2 transition"
          >
            <Save className="h-4 w-4" />
            {moduleSaving ? "Saving..." : `Save ${Object.keys(moduleChanges).length} Changes`}
          </button>
        )}

        {activeTab === "api" && (
          <button
            onClick={() => {
              setApiForm({
                module: "users",
                method: "GET",
                endpoint: "",
                required_permission: "",
                description: "",
              });
              setIsApiModalOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-2 transition"
          >
            <Plus className="h-4 w-4" /> Register API Route
          </button>
        )}
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-xs font-medium">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess("")} className="hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-between text-rose-800 dark:text-rose-300 text-xs font-medium">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError("")} className="hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("policies")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === "policies"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Lock className="h-4 w-4" />
          Access Policies (ABAC)
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {policies.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("modules")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === "modules"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Layers className="h-4 w-4" />
          Module Access Matrix
          {Object.keys(moduleChanges).length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
              {Object.keys(moduleChanges).length} pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("api")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === "api"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Cpu className="h-4 w-4" />
          API Route Permissions
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {apiRoutes.length}
          </span>
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: ACCESS POLICIES (ABAC) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "policies" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          {policiesLoading ? (
            <div className="py-20 text-center text-xs text-slate-500">
              Loading access policies...
            </div>
          ) : policies.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-500">
              No access control policies defined.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="py-3 px-4">Policy Name</th>
                    <th className="py-3 px-4">Effect</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Resource & Action</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {policies.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {p.slug}
                        </div>
                        {p.description && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {p.description}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.effect === "allow"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                          }`}
                        >
                          {p.effect}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {p.subject_type}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs text-indigo-600 dark:text-indigo-400">
                          {p.resource} : {p.action}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {p.priority}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeletePolicy(p.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                          title="Delete Policy"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: MODULE ACCESS MATRIX */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "modules" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-600" />
                Cross-Role Module Authorization Grid
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Set each role&apos;s access level per module: None, Read-Only, Write, or Full Administrative Control.
              </p>
            </div>

            {Object.keys(moduleChanges).length > 0 && (
              <button
                onClick={handleSaveModuleAccess}
                disabled={moduleSaving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
              >
                <Save className="h-3.5 w-3.5" />
                Save Changes ({Object.keys(moduleChanges).length})
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-x-auto">
            {moduleLoading ? (
              <div className="py-24 text-center text-xs text-slate-500">
                Loading role module access matrix...
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="py-3 px-4 min-w-[180px]">Application Module</th>
                    {moduleRoles.map((role) => (
                      <th
                        key={role.id}
                        className="py-3 px-3 text-center min-w-[130px] font-semibold text-slate-800 dark:text-slate-200"
                      >
                        <div className="truncate">{role.name}</div>
                        <div className="text-[9px] font-normal text-slate-400 font-mono">
                          Lvl {role.hierarchy_level}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {modules.map((mod) => (
                    <tr
                      key={mod.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {mod.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {mod.slug}
                        </div>
                      </td>

                      {moduleRoles.map((role) => {
                        const key = `${role.id}_${mod.id}`;
                        const currentAccess =
                          moduleChanges[key]?.accessLevel ||
                          moduleAccessMap[key]?.access_level ||
                          (role.slug === "superadmin" ? "admin" : "none");

                        const isSuperAdminRole = role.slug === "superadmin";

                        return (
                          <td key={role.id} className="py-3 px-2 text-center">
                            {isSuperAdminRole ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                FULL ADMIN
                              </span>
                            ) : (
                              <select
                                value={currentAccess}
                                onChange={(e) =>
                                  handleModuleAccessChange(role.id, mod.id, e.target.value)
                                }
                                className={`text-[11px] font-semibold rounded px-2 py-1 border transition focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                                  currentAccess === "admin"
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300"
                                    : currentAccess === "write"
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300"
                                    : currentAccess === "read"
                                    ? "bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950/60 dark:border-sky-800 dark:text-sky-300"
                                    : "bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700"
                                }`}
                              >
                                <option value="none">None</option>
                                <option value="read">Read Only</option>
                                <option value="write">Read / Write</option>
                                <option value="admin">Full Admin</option>
                              </select>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: API ROUTE PERMISSIONS REGISTRY */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "api" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={apiSearch}
                onChange={(e) => setApiSearch(e.target.value)}
                placeholder="Search API endpoints or permissions..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            {apiLoading ? (
              <div className="py-20 text-center text-xs text-slate-500">
                Scanning registered API routes...
              </div>
            ) : apiRoutes.length === 0 ? (
              <div className="py-20 text-center text-xs text-slate-500">
                No matching API routes registered.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">API Endpoint</th>
                      <th className="py-3 px-4">Module</th>
                      <th className="py-3 px-4">Required Permission</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {apiRoutes.map((route) => {
                      const methodColors: Record<string, string> = {
                        GET: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
                        POST: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
                        PUT: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
                        DELETE: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
                      };

                      return (
                        <tr
                          key={route.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                        >
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                methodColors[route.method] || "bg-slate-100 text-slate-800"
                              }`}
                            >
                              {route.method}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100">
                            {route.endpoint}
                          </td>

                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400 capitalize">
                            {route.module}
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/40">
                              {route.required_permission || "Public / Unrestricted"}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                            {route.description || "—"}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteApiRoute(route.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                              title="Delete route registration"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Policy */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-lg shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Create New Access Policy (ABAC)
            </h3>

            <form onSubmit={handleCreatePolicy} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Policy Name *
                </label>
                <input
                  type="text"
                  required
                  value={policyForm.name}
                  onChange={(e) =>
                    setPolicyForm({
                      ...policyForm,
                      name: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"),
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Effect
                  </label>
                  <select
                    value={policyForm.effect}
                    onChange={(e) => setPolicyForm({ ...policyForm, effect: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="allow">Allow</option>
                    <option value="deny">Deny</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority (Higher overrides)
                  </label>
                  <input
                    type="number"
                    value={policyForm.priority}
                    onChange={(e) =>
                      setPolicyForm({ ...policyForm, priority: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Resource
                  </label>
                  <input
                    type="text"
                    value={policyForm.resource}
                    onChange={(e) => setPolicyForm({ ...policyForm, resource: e.target.value })}
                    placeholder="e.g. finance or *"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Action
                  </label>
                  <input
                    type="text"
                    value={policyForm.action}
                    onChange={(e) => setPolicyForm({ ...policyForm, action: e.target.value })}
                    placeholder="e.g. MANAGE or *"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={policyForm.description}
                  onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPolicyModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                >
                  Create Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Register API Route */}
      {isApiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-lg shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Register API Route Permission
            </h3>

            <form onSubmit={handleCreateApiRoute} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Method *
                  </label>
                  <select
                    value={apiForm.method}
                    onChange={(e) =>
                      setApiForm({ ...apiForm, method: e.target.value as any })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Module *
                  </label>
                  <input
                    type="text"
                    required
                    value={apiForm.module}
                    onChange={(e) => setApiForm({ ...apiForm, module: e.target.value })}
                    placeholder="e.g. finance, users, cms"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  API Endpoint URI *
                </label>
                <input
                  type="text"
                  required
                  value={apiForm.endpoint}
                  onChange={(e) => setApiForm({ ...apiForm, endpoint: e.target.value })}
                  placeholder="/api/v1/admin/example/resource"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Required Permission Slug
                </label>
                <input
                  type="text"
                  value={apiForm.required_permission}
                  onChange={(e) =>
                    setApiForm({ ...apiForm, required_permission: e.target.value })
                  }
                  placeholder="e.g. finance.payout_approve"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={apiForm.description}
                  onChange={(e) => setApiForm({ ...apiForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsApiModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                >
                  Register Endpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccessPoliciesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-500">Loading access control...</div>}>
      <AccessControlContent />
    </Suspense>
  );
}
