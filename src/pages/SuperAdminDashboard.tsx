import { useState, useEffect } from "react";
import Layout from "@/components/site/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/ncfrmi-logo.png";
import {
  Users,
  Shield,
  Settings,
  UserCheck,
  Globe,
  Loader2,
  Trash2,
  Edit,
  Radio,
  MapPin,
  Laptop,
  CheckCircle,
  PhoneCall,
  Save,
  Grid
} from "lucide-react";

type UserRoleEntry = {
  email: string;
  role: "superuser" | "commissioner" | "officer" | "guest";
  privileges: string[];
};

type FieldOfficer = {
  id: string;
  name: string;
  email: string;
  zone: string;
  status: "In Field" | "Offline" | "On Break";
  captured: number;
  terminalId: string;
};

export default function SuperAdminDashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("roles");

  // --- Tab 1: Roles State ---
  const [userRoles, setUserRoles] = useState<UserRoleEntry[]>([]);
  const [editingUser, setEditingUser] = useState<UserRoleEntry | null>(null);
  const [editRole, setEditRole] = useState<any>("");
  const [editPrivs, setEditPrivs] = useState<string[]>([]);

  // --- Tab 2: Field Officers State ---
  const [officers, setOfficers] = useState<FieldOfficer[]>([]);
  const [isAddOfficerOpen, setIsAddOfficerOpen] = useState(false);
  const [newOfficerName, setNewOfficerName] = useState("");
  const [newOfficerEmail, setNewOfficerEmail] = useState("");
  const [newOfficerZone, setNewOfficerZone] = useState("");

  // --- Tab 3: Settings State ---
  const [portalTitle, setPortalTitle] = useState("NCFRMI Portal");
  const [helpline, setHelpline] = useState("0800-NCFRMI");
  const [homepageBanner, setHomepageBanner] = useState("");
  const [enabledCategories, setEnabledCategories] = useState<string[]>([
    "refugee",
    "idp",
    "migrant",
    "returnee"
  ]);

  // Load initial settings from localStorage on mount
  useEffect(() => {
    // 1. Roles
    const savedRoles = JSON.parse(localStorage.getItem("ncfrmi_user_roles") || "{}");
    const initialRoles: UserRoleEntry[] = [
      { email: "superuser@ncfrmi.gov.ng", role: "superuser", privileges: ["Manage Roles", "Edit Configurations", "Access Logs", "Manage Officers"] },
      { email: "commissioner@ncfrmi.gov.ng", role: "commissioner", privileges: ["Approve Applications", "Access Reports", "Database View"] },
      { email: "officer@ncfrmi.gov.ng", role: "officer", privileges: ["Enrol Registrants", "Local Cache Sync"] },
      { email: "field_east@ncfrmi.gov.ng", role: "officer", privileges: ["Enrol Registrants", "Local Cache Sync"] },
      { email: "field_north@ncfrmi.gov.ng", role: "officer", privileges: ["Enrol Registrants", "Local Cache Sync"] },
      { email: "applicant@ncfrmi.gov.ng", role: "guest", privileges: ["Track Application"] }
    ];

    // Merge saved roles with initial
    const merged = initialRoles.map(entry => {
      if (savedRoles[entry.email]) {
        return {
          ...entry,
          role: savedRoles[entry.email]
        };
      }
      return entry;
    });
    setUserRoles(merged);

    // 2. Field Officers
    const savedOfficers = localStorage.getItem("ncfrmi_field_officers");
    if (savedOfficers) {
      setOfficers(JSON.parse(savedOfficers));
    } else {
      const mockOfficers: FieldOfficer[] = [
        { id: "off-1", name: "Musa Bello", email: "officer@ncfrmi.gov.ng", zone: "Borno State Hub", status: "In Field", captured: 142, terminalId: "TERM-M1" },
        { id: "off-2", name: "Sarah Okoro", email: "field_east@ncfrmi.gov.ng", zone: "Edo State Transit", status: "On Break", captured: 96, terminalId: "TERM-S2" },
        { id: "off-3", name: "Haruna Ibrahim", email: "field_north@ncfrmi.gov.ng", zone: "Benue State Daudu", status: "Offline", captured: 78, terminalId: "TERM-H1" }
      ];
      localStorage.setItem("ncfrmi_field_officers", JSON.stringify(mockOfficers));
      setOfficers(mockOfficers);
    }

    // 3. Web configuration settings
    setPortalTitle(localStorage.getItem("ncfrmi_title") || "NCFRMI Portal");
    setHelpline(localStorage.getItem("ncfrmi_helpline") || "0800-NCFRMI");
    setHomepageBanner(localStorage.getItem("ncfrmi_homepage_banner") || "");
    
    const savedCats = localStorage.getItem("ncfrmi_enabled_categories");
    if (savedCats) {
      setEnabledCategories(JSON.parse(savedCats));
    }
  }, []);

  // Save general settings
  const handleSaveSettings = () => {
    localStorage.setItem("ncfrmi_title", portalTitle);
    localStorage.setItem("ncfrmi_helpline", helpline);
    localStorage.setItem("ncfrmi_homepage_banner", homepageBanner);
    localStorage.setItem("ncfrmi_enabled_categories", JSON.stringify(enabledCategories));
    
    // Dispatch storage event to trigger immediate update in header/index components
    window.dispatchEvent(new Event("storage"));
    
    toast.success("Super User System Configurations updated successfully");
  };

  // Modify user roles & privileges
  const handleEditRoleClick = (entry: UserRoleEntry) => {
    setEditingUser(entry);
    setEditRole(entry.role);
    setEditPrivs(entry.privileges);
  };

  const handleSaveUserRole = () => {
    if (!editingUser) return;
    const updated = userRoles.map(entry => {
      if (entry.email === editingUser.email) {
        return {
          ...entry,
          role: editRole,
          privileges: editPrivs
        };
      }
      return entry;
    });
    setUserRoles(updated);

    // Save to the auth system simulation store
    const savedRoles = JSON.parse(localStorage.getItem("ncfrmi_user_roles") || "{}");
    savedRoles[editingUser.email] = editRole;
    localStorage.setItem("ncfrmi_user_roles", JSON.stringify(savedRoles));

    toast.success(`Roles/Privileges for ${editingUser.email} updated`);
    setEditingUser(null);
  };

  // Add field officer
  const handleAddOfficerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfficerName || !newOfficerEmail || !newOfficerZone) {
      toast.error("Please fill in all officer details.");
      return;
    }

    const newOfficer: FieldOfficer = {
      id: `off-${Math.random().toString(36).slice(2, 6)}`,
      name: newOfficerName,
      email: newOfficerEmail,
      zone: newOfficerZone,
      status: "Offline",
      captured: 0,
      terminalId: `TERM-${newOfficerName.slice(0,1).toUpperCase()}${Math.floor(Math.random() * 100)}`
    };

    const updated = [...officers, newOfficer];
    setOfficers(updated);
    localStorage.setItem("ncfrmi_field_officers", JSON.stringify(updated));
    toast.success(`Field Officer ${newOfficerName} registered successfully`);

    // Reset inputs
    setNewOfficerName("");
    setNewOfficerEmail("");
    setNewOfficerZone("");
    setIsAddOfficerOpen(false);
  };

  const handleToggleOfficerStatus = (id: string, newStatus: any) => {
    const updated = officers.map(o => o.id === id ? { ...o, status: newStatus } : o);
    setOfficers(updated);
    localStorage.setItem("ncfrmi_field_officers", JSON.stringify(updated));
    toast.success(`Officer status updated to ${newStatus}`);
  };

  const handleDeleteOfficer = (id: string) => {
    if (!window.confirm("Are you sure you want to remove this field officer?")) return;
    const updated = officers.filter(o => o.id !== id);
    setOfficers(updated);
    localStorage.setItem("ncfrmi_field_officers", JSON.stringify(updated));
    toast.success("Field officer de-registered");
  };

  const toggleCategory = (cat: string) => {
    const updated = enabledCategories.includes(cat)
      ? enabledCategories.filter(c => c !== cat)
      : [...enabledCategories, cat];
    setEnabledCategories(updated);
  };

  const ALL_PRIVS = [
    "Manage Roles",
    "Enrol Registrants",
    "Approve Applications",
    "Access Reports",
    "Database View",
    "Edit Configurations",
    "Access Logs",
    "Manage Officers",
    "Local Cache Sync"
  ];

  return (
    <Layout>
      <div className="container-page py-6 space-y-6">
        {/* Header Center Control Console */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b pb-4 gap-4 bg-slate-905 p-4 rounded-xl border border-primary/20 bg-card relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/10 via-transparent to-transparent opacity-80 pointer-events-none" />
          <div className="flex items-center gap-4 text-center md:text-left relative z-10">
            <div className="h-16 w-16 rounded-full border border-primary/20 flex items-center justify-center bg-card shadow-inner p-1">
              <img src={logo} alt="NCFRMI seal" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-foreground text-lg sm:text-xl tracking-tight uppercase">
                NCFRMI Super User Control Center
              </h1>
              <p className="text-[10px] sm:text-xs text-emerald-800 font-semibold uppercase tracking-wider mt-0.5">
                Centralized System Configurations & Field Operations Manager
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-650 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> ROOT GATEWAY
            </span>
            <Button variant="outline" size="sm" onClick={() => signOut()} className="text-xs hover-lift">
              Sign Out
            </Button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="bg-card border border-border rounded-lg p-1.5 flex flex-wrap gap-1 shadow-card">
          {[
            { id: "roles", label: "Roles & Privileges", icon: Shield },
            { id: "officers", label: "Field Officers System", icon: Users },
            { id: "settings", label: "Website Settings & Mod", icon: Settings }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase rounded-md border transition-all duration-300 active:scale-95 ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-800 to-emerald-700 text-white border-emerald-650 shadow-elegant"
                    : "text-muted-foreground hover:bg-emerald-500/[0.04] hover:text-emerald-800 hover:border-emerald-500/10 border-transparent"
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* --- TAB 1: ROLES MANAGER --- */}
        {activeTab === "roles" && (
          <div className="space-y-4 animate-fade-in">
            <Card className="p-6 border-border shadow-sm">
              <div className="border-b pb-4 mb-4">
                <h3 className="font-display font-bold text-foreground text-sm flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-emerald-800" />
                  Assign User Roles & System Privileges
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Change administrative access limits across default server login accounts</p>
              </div>

              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 uppercase tracking-wider text-muted-foreground border-b text-[10px]">
                    <tr>
                      <th className="p-3.5">User Email</th>
                      <th className="p-3.5">Assigned Role</th>
                      <th className="p-3.5">Current Privileges</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {userRoles.map((entry) => (
                      <tr key={entry.email} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3.5 font-medium text-foreground">{entry.email}</td>
                        <td className="p-3.5">
                          <Badge className={`uppercase text-[9px] font-bold ${
                            entry.role === "superuser" ? "bg-emerald-100 text-emerald-800 border-emerald-250" :
                            entry.role === "commissioner" ? "bg-blue-100 text-blue-800 border-blue-200" :
                            entry.role === "officer" ? "bg-amber-100 text-amber-800 border-amber-200" :
                            "bg-slate-100 text-slate-800"
                          }`}>
                            {entry.role}
                          </Badge>
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1">
                            {entry.privileges.map(priv => (
                              <span key={priv} className="bg-slate-100 text-slate-700 text-[8px] font-semibold px-2 py-0.5 rounded border">
                                {priv}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3.5 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2.5 text-xs text-emerald-800 font-bold uppercase gap-1"
                            onClick={() => handleEditRoleClick(entry)}
                          >
                            <Edit className="h-3.5 w-3.5" /> Edit Access
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* --- TAB 2: FIELD OFFICERS SYSTEM --- */}
        {activeTab === "officers" && (
          <div className="space-y-4 animate-fade-in">
            {/* Officers Grid */}
            <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
              {/* Directory */}
              <Card className="p-6 border-border shadow-sm">
                <div className="flex justify-between items-center border-b pb-4 mb-4">
                  <div>
                    <h3 className="font-display font-bold text-foreground text-sm flex items-center gap-1.5">
                      <Radio className="h-4 w-4 text-emerald-800 animate-pulse-soft" />
                      Field Officers Directory
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Monitor operational statuses, terminal syncs, and capture logs</p>
                  </div>
                  <Button
                    onClick={() => setIsAddOfficerOpen(true)}
                    className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs uppercase"
                  >
                    + Register Officer
                  </Button>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 uppercase tracking-wider text-muted-foreground border-b text-[10px]">
                      <tr>
                        <th className="p-3.5">Name</th>
                        <th className="p-3.5">Zone/Hub</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Captured</th>
                        <th className="p-3.5">Terminal ID</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {officers.map((off) => (
                        <tr key={off.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3.5">
                            <span className="font-semibold text-foreground block">{off.name}</span>
                            <span className="text-[10px] text-muted-foreground">{off.email}</span>
                          </td>
                          <td className="p-3.5 font-medium text-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                              {off.zone}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="flex flex-col gap-1.5">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase rounded-full px-2 py-0.5 w-fit ${
                                off.status === "In Field" ? "bg-emerald-50/50 text-emerald-800" :
                                off.status === "On Break" ? "bg-amber-50/50 text-amber-800" :
                                "bg-slate-100 text-slate-800"
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${
                                  off.status === "In Field" ? "bg-emerald-500 animate-pulse" :
                                  off.status === "On Break" ? "bg-amber-500" :
                                  "bg-slate-400"
                                }`} />
                                {off.status}
                              </span>
                              
                              <select
                                value={off.status}
                                onChange={(e) => handleToggleOfficerStatus(off.id, e.target.value as any)}
                                className="text-[9px] border bg-card rounded px-1 py-0.5 cursor-pointer focus:outline-none"
                              >
                                <option value="In Field">In Field</option>
                                <option value="On Break">On Break</option>
                                <option value="Offline">Offline</option>
                              </select>
                            </div>
                          </td>
                          <td className="p-3.5 font-bold text-foreground">{off.captured} logs</td>
                          <td className="p-3.5 font-mono text-muted-foreground text-[10px]">{off.terminalId}</td>
                          <td className="p-3.5 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-slate-500 hover:text-red-700"
                              onClick={() => handleDeleteOfficer(off.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Live telemetry metadata stats */}
              <div className="space-y-4">
                <Card className="p-5 border-border shadow-sm bg-slate-50/20">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 border-b pb-1.5 mb-3 flex items-center gap-1.5">
                    <Laptop className="h-3.5 w-3.5" />
                    Field Telemetry Metrics
                  </h4>
                  <dl className="space-y-3.5 text-xs">
                    <div className="flex justify-between border-b pb-2">
                      <dt className="text-muted-foreground font-semibold">Active Enrolling Nodes:</dt>
                      <dd className="font-extrabold text-foreground">{officers.filter(o => o.status === "In Field").length} Online</dd>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <dt className="text-muted-foreground font-semibold">Total Capture Terminals:</dt>
                      <dd className="font-extrabold text-foreground">{officers.length} Terminals</dd>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <dt className="text-muted-foreground font-semibold">Field Sync Success Rate:</dt>
                      <dd className="font-extrabold text-emerald-650 flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> 99.8% Secure
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground font-semibold">Total Field Intake:</dt>
                      <dd className="font-extrabold text-indigo-650">
                        {officers.reduce((sum, o) => sum + o.captured, 0)} Profiles
                      </dd>
                    </div>
                  </dl>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 3: WEBSITE CONFIGURATION --- */}
        {activeTab === "settings" && (
          <div className="space-y-6 animate-fade-in">
            <Card className="p-6 border-border shadow-sm space-y-6">
              <div className="border-b pb-4">
                <h3 className="font-display font-bold text-foreground text-sm flex items-center gap-1.5">
                  <Settings className="h-4 w-4 text-emerald-800" />
                  General Portal Configuration Settings
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Control live global settings, alert banners, and active categories</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Text Configs */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                      <Grid className="h-3.5 w-3.5 text-emerald-800" /> Portal Title Branding
                    </label>
                    <Input
                      value={portalTitle}
                      onChange={(e) => setPortalTitle(e.target.value)}
                      placeholder="NCFRMI Portal"
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                      <PhoneCall className="h-3.5 w-3.5 text-emerald-800" /> Official Website Helpline Phone
                    </label>
                    <Input
                      value={helpline}
                      onChange={(e) => setHelpline(e.target.value)}
                      placeholder="0800-NCFRMI"
                      className="text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                      Global Announcement Banner Message
                    </label>
                    <Textarea
                      value={homepageBanner}
                      onChange={(e) => setHomepageBanner(e.target.value)}
                      placeholder="Type a red-banner announcement alert to show at the top of the homepage..."
                      rows={4}
                      className="text-xs leading-relaxed"
                    />
                    <span className="text-[9px] text-muted-foreground mt-1 block">Leave empty to hide alert banner.</span>
                  </div>
                </div>

                {/* Categories Toggle Toggles */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-2">
                      Active Intake Registration Categories
                    </label>
                    <p className="text-[10px] text-muted-foreground mb-4">Toggle categories to hide/show them in the field officers capture workstation form</p>
                    
                    <div className="space-y-2">
                      {[
                        { id: "refugee", label: "Refugees (Status Request)" },
                        { id: "idp", label: "IDPs (Internally Displaced Persons)" },
                        { id: "migrant", label: "Migrants (Repatriation/Border Transit)" },
                        { id: "returnee", label: "Returnees (Voluntary Repatriation)" }
                      ].map((cat) => {
                        const isEnabled = enabledCategories.includes(cat.id);
                        return (
                          <label
                            key={cat.id}
                            className={`flex items-center justify-between p-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                              isEnabled ? "bg-emerald-500/[0.03] border-emerald-500/25 text-emerald-900" : "bg-slate-50 border-slate-200 text-slate-500"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full ${isEnabled ? "bg-emerald-500" : "bg-slate-300"}`} />
                              {cat.label}
                            </span>
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={() => toggleCategory(cat.id)}
                              className="h-4.5 w-4.5 rounded border-emerald-600 text-emerald-600 focus:ring-emerald-500"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={handleSaveSettings}
                  className="bg-emerald-800 text-white hover:bg-emerald-700 font-bold uppercase tracking-wider text-xs gap-1.5 h-9"
                >
                  <Save className="h-4 w-4" /> Save System Settings
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* --- EDIT ACCESS DIALOG MODAL --- */}
        <Dialog open={!!editingUser} onOpenChange={(o) => { if (!o) setEditingUser(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User Roles & Privileges</DialogTitle>
              <DialogDescription>Modify access levels for account {editingUser?.email}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-3 text-xs">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Administrative Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full border bg-card rounded px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="guest">Guest / Applicant</option>
                  <option value="officer">Field Officer</option>
                  <option value="commissioner">Commissioner (Admin)</option>
                  <option value="superuser">Super User (Control Center)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-2">Assigned Privileges</label>
                <div className="grid grid-cols-2 gap-2 border p-3 rounded-lg max-h-48 overflow-y-auto">
                  {ALL_PRIVS.map((p) => {
                    const isChecked = editPrivs.includes(p);
                    return (
                      <label key={p} className="flex items-center gap-2 cursor-pointer py-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const updated = isChecked
                              ? editPrivs.filter(pr => pr !== p)
                              : [...editPrivs, p];
                            setEditPrivs(updated);
                          }}
                          className="h-4 w-4 rounded"
                        />
                        <span>{p}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
              <Button onClick={handleSaveUserRole} className="bg-emerald-800 text-white hover:bg-emerald-700">Save Configuration</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* --- REGISTER FIELD OFFICER DIALOG --- */}
        <Dialog open={isAddOfficerOpen} onOpenChange={setIsAddOfficerOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Register New Field Officer</DialogTitle>
              <DialogDescription>Setup a new terminal operational account for remote field intake.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddOfficerSubmit} className="space-y-4 py-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Officer Full Name</label>
                <Input
                  required
                  value={newOfficerName}
                  onChange={(e) => setNewOfficerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="mt-1 text-xs"
                />
              </div>
              
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Officer Email</label>
                <Input
                  type="email"
                  required
                  value={newOfficerEmail}
                  onChange={(e) => setNewOfficerEmail(e.target.value)}
                  placeholder="e.g. j.doe@ncfrmi.gov.ng"
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Assigned Operational Zone / Region</label>
                <Input
                  required
                  value={newOfficerZone}
                  onChange={(e) => setNewOfficerZone(e.target.value)}
                  placeholder="e.g. Borno State, Ogoja, Lagos"
                  className="mt-1 text-xs"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOfficerOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-emerald-800 text-white hover:bg-emerald-700">Register Node</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
