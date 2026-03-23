"use client";
import { useState, useRef } from "react";
import type { Badge } from "@/types";

const PRESET_COLORS = [
  "#39d353", "#4a9eff", "#f0c040", "#e05252",
  "#a78bfa", "#f97316", "#06b6d4", "#ec4899",
  "#84cc16", "#14b8a6",
];

interface Props {
  badge: Badge;
  onClose: () => void;
  onSaved: (updated: Badge) => void;
}

export function EditBadgeModal({ badge, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: badge.name,
    icon: badge.icon,
    description: badge.description,
    points: String(badge.points),
    category: badge.category,
    color: badge.color,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(badge.imageURL ?? null);
  const [removeImage, setRemoveImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Image must be under 2MB"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
    setError("");
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    setError("");
    if (!form.name || !form.icon || !form.description || !form.points || !form.category || !form.color) {
      setError("All fields are required");
      return;
    }
    setLoading(true);

    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("icon", form.icon);
    fd.append("description", form.description);
    fd.append("points", form.points);
    fd.append("category", form.category);
    fd.append("color", form.color);
    fd.append("removeImage", String(removeImage));
    if (imageFile) fd.append("image", imageFile);

    const res = await fetch(`/api/badges/${badge.id}`, { method: "PATCH", body: fd });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to update badge");
      setLoading(false);
      return;
    }

    onSaved({
      ...badge,
      ...form,
      points: Number(form.points),
      imageURL: removeImage ? null : (imageFile ? imagePreview : badge.imageURL),
    });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-border p-6 my-8"
        style={{ background: "#111611" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-6">
          <h2 className="font-mono font-bold text-lg text-text-base">Edit Badge</h2>
          <button onClick={onClose} className="font-mono text-text-muted hover:text-text-base text-lg">✕</button>
        </div>

        {/* Name */}
        <div className="mb-3">
          <label className="font-mono text-[10px] text-text-muted block mb-1.5 tracking-wider uppercase">Name *</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full bg-bg border border-border rounded-lg px-3 py-2 font-mono text-sm text-text-base outline-none focus:border-accent/40 transition-colors placeholder:text-text-muted" />
        </div>

        {/* Description */}
        <div className="mb-3">
          <label className="font-mono text-[10px] text-text-muted block mb-1.5 tracking-wider uppercase">Description *</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3} className="w-full bg-bg border border-border rounded-lg px-3 py-2 font-mono text-sm text-text-base outline-none focus:border-accent/40 transition-colors resize-none placeholder:text-text-muted" />
        </div>

        {/* Category + Points */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="font-mono text-[10px] text-text-muted block mb-1.5 tracking-wider uppercase">Category *</label>
            <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 font-mono text-sm text-text-base outline-none focus:border-accent/40 transition-colors placeholder:text-text-muted" />
          </div>
          <div>
            <label className="font-mono text-[10px] text-text-muted block mb-1.5 tracking-wider uppercase">Points *</label>
            <input value={form.points} onChange={e => setForm(f => ({ ...f, points: e.target.value }))}
              type="number" min="1"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 font-mono text-sm text-text-base outline-none focus:border-accent/40 transition-colors placeholder:text-text-muted" />
          </div>
        </div>

        {/* Emoji */}
        <div className="mb-3">
          <label className="font-mono text-[10px] text-text-muted block mb-1.5 tracking-wider uppercase">Emoji Icon *</label>
          <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
            className="w-full bg-bg border border-border rounded-lg px-3 py-2 font-mono text-sm text-text-base outline-none focus:border-accent/40 transition-colors" />
        </div>

        {/* Color */}
        <div className="mb-3">
          <label className="font-mono text-[10px] text-text-muted block mb-1.5 tracking-wider uppercase">Color *</label>
          <div className="flex items-center gap-3 flex-wrap">
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                className="w-7 h-7 rounded-full border-2 transition-all"
                style={{ background: c, borderColor: form.color === c ? "white" : "transparent",
                  boxShadow: form.color === c ? `0 0 8px ${c}` : "none" }} />
            ))}
            <input type="color" value={form.color}
              onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
              className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent" />
            <span className="font-mono text-xs text-text-dim">{form.color}</span>
          </div>
        </div>

        {/* Image upload */}
        <div className="mb-4">
          <label className="font-mono text-[10px] text-text-muted block mb-1.5 tracking-wider uppercase">Badge Image (optional)</label>
          <div className="flex items-center gap-3">
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="preview" className="w-14 h-14 rounded-lg object-cover border border-border" />
                <button onClick={clearImage}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">✕</button>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-lg border border-dashed border-border flex items-center justify-center text-2xl"
                style={{ background: `${form.color}10` }}>
                {form.icon}
              </div>
            )}
            <div className="flex-1">
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange} className="hidden" id="edit-badge-image" />
              <label htmlFor="edit-badge-image"
                className="block font-mono text-xs text-accent border border-accent/30 bg-accent/10 px-3 py-2 rounded-lg cursor-pointer hover:bg-accent/20 transition-all text-center">
                {imageFile ? "Change image" : "Upload new image"}
              </label>
              <p className="font-mono text-[10px] text-text-muted mt-1 text-center">Max 2MB</p>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mb-4 p-3 rounded-lg border border-border flex items-center gap-3"
          style={{ background: `${form.color}08` }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
            style={{ background: `${form.color}20`, border: `2px solid ${form.color}40` }}>
            {imagePreview
              ? <img src={imagePreview} className="w-8 h-8 object-cover rounded-md" />
              : form.icon}
          </div>
          <div>
            <p className="font-mono text-sm font-bold" style={{ color: form.color }}>{form.name || "Badge Name"}</p>
            <p className="font-mono text-xs text-text-dim">{form.category || "Category"} · {form.points || "0"}pts</p>
          </div>
        </div>

        {error && <p className="font-mono text-xs text-red-400 mb-3">{error}</p>}

        <div className="flex gap-3">
          <button onClick={handleSave} disabled={loading}
            className="flex-1 py-3 font-mono text-sm font-bold rounded-lg transition-all disabled:opacity-40"
            style={{ background: "#39d353", color: "#0a0e0a" }}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button onClick={onClose}
            className="px-5 font-mono text-sm text-text-dim border border-border rounded-lg hover:border-accent/30 hover:text-accent transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}