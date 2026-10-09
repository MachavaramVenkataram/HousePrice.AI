"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Bookmark,
  Trash2,
  Scale,
  ArrowRight,
  CheckCircle2,
  Layers,
  Sparkles,
  Info,
  Calendar,
  X,
  ExternalLink,
} from "lucide-react";
import {
  PropertyFeatures,
  PropertyProfileItem,
  PropertyProfileComparisonItem,
} from "@/types";
import { api } from "@/services/api";
import { GlassCard, GlassBadge, GlassButton, AnimatedNumber } from "@/components/ui";

interface PropertyProfilesManagerProps {
  currentFeatures: PropertyFeatures;
  currentEstimate: number;
  currentLowerBound: number;
  currentUpperBound: number;
  modelName?: string;
  className?: string;
  onLoadProfile?: (features: PropertyFeatures) => void;
}

export const PropertyProfilesManager: React.FC<PropertyProfilesManagerProps> = ({
  currentFeatures,
  currentEstimate,
  currentLowerBound,
  currentUpperBound,
  modelName = "Voting Ensemble",
  className = "",
  onLoadProfile,
}) => {
  const [profiles, setProfiles] = useState<PropertyProfileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileDesc, setProfileDesc] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Profile comparison state
  const [selectedProfileIds, setSelectedProfileIds] = useState<number[]>([]);
  const [comparisonData, setComparisonData] = useState<PropertyProfileComparisonItem[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const fetchProfiles = async () => {
    try {
      setIsLoading(true);
      const data = await api.getProfiles();
      setProfiles(data);
    } catch (err) {
      console.error("Failed to fetch property profiles", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleSaveProfile = async () => {
    if (!profileName.trim()) return;
    try {
      setIsSaving(true);
      const newProfile = await api.saveProfile({
        name: profileName.trim(),
        description: profileDesc.trim() || undefined,
        features: currentFeatures,
        estimated_price: currentEstimate,
        lower_bound: currentLowerBound,
        upper_bound: currentUpperBound,
        model_name: modelName,
        model_version: "v1.0.0",
      });
      setProfiles((prev) => [newProfile, ...prev]);
      setProfileName("");
      setProfileDesc("");
      setNotification(`Property profile "${newProfile.name}" saved!`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error("Failed to save profile", err);
      setNotification("Failed to save profile.");
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProfile = async (id: number, name: string) => {
    try {
      await api.deleteProfile(id);
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      setSelectedProfileIds((prev) => prev.filter((pid) => pid !== id));
      setNotification(`Deleted profile "${name}"`);
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error("Failed to delete profile", err);
    }
  };

  const toggleSelectForComparison = (id: number) => {
    setSelectedProfileIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleRunComparison = async () => {
    if (selectedProfileIds.length === 0) return;
    try {
      setIsComparing(true);
      const res = await api.compareProfiles(selectedProfileIds);
      setComparisonData(res.profiles);
      setShowCompareModal(true);
    } catch (err) {
      console.error("Failed to compare profiles", err);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <GlassCard variant="elevated" className={`p-6 sm:p-7 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200/60 mb-1.5">
            <Home className="w-3 h-3 text-violet-600" />
            <span>Persistent Property Profiles</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            SAVED PROFILES & PROPERTY COMPARISON
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Save real property profiles (e.g. &ldquo;My Current Home&rdquo;, &ldquo;124 Elm St Candidate&rdquo;) and compare multiple candidate homes side-by-side.
          </p>
        </div>

        {selectedProfileIds.length > 0 && (
          <GlassButton
            variant="primary"
            size="sm"
            onClick={handleRunComparison}
            disabled={isComparing}
            className="flex items-center gap-1.5"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Compare Selected ({selectedProfileIds.length})</span>
          </GlassButton>
        )}
      </div>

      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </motion.div>
      )}

      {/* Save Current Property Form */}
      <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-3">
        <div className="text-xs font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
          <Bookmark className="w-3.5 h-3.5 text-violet-600" />
          <span>Save Current Estimation to Profile</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <input
            type="text"
            placeholder="Profile Name (e.g. My Current Home, Option B)"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400 text-slate-800 sm:col-span-1"
          />
          <input
            type="text"
            placeholder="Optional notes or address details..."
            value={profileDesc}
            onChange={(e) => setProfileDesc(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400 text-slate-800 sm:col-span-1"
          />
          <button
            onClick={handleSaveProfile}
            disabled={!profileName.trim() || isSaving}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Save Profile"}</span>
          </button>
        </div>
      </div>

      {/* Saved Profiles List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 uppercase tracking-wider">
            Saved Property Profiles ({profiles.length})
          </span>
          {profiles.length > 1 && (
            <span className="text-[11px] text-slate-500">
              Select 2+ profiles to compare side-by-side
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading profiles...</div>
        ) : profiles.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
            No saved property profiles yet. Name and save your current configuration above.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {profiles.map((p) => {
              const isSelected = selectedProfileIds.includes(p.id);
              const feats = p.features;
              const livingArea = feats.GrLivArea || feats.gr_liv_area || "—";
              const beds = feats.BedroomAbvGr ?? feats.bedroom_abv_gr ?? "—";
              const baths = feats.FullBath ?? feats.full_bath ?? "—";
              const qual = feats.OverallQual ?? feats.overall_qual ?? "—";
              const neighborhood = feats.Neighborhood || feats.neighborhood || "Ames";

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-2xl border transition-all text-xs space-y-3 relative ${
                    isSelected
                      ? "bg-violet-50/70 border-violet-300 shadow-xs"
                      : "bg-white/80 border-slate-200/70 hover:border-violet-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 truncate text-sm">{p.name}</h4>
                      {p.description && (
                        <p className="text-[11px] text-slate-500 truncate">{p.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteProfile(p.id, p.name)}
                      className="text-slate-400 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                      title="Delete profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Price & Bounds */}
                  <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        Model Estimate
                      </div>
                      <div className="text-base font-black text-slate-900 font-mono">
                        ${Math.round(p.estimated_price).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Interval</div>
                      <div className="text-[11px] font-mono text-slate-600">
                        ${Math.round(p.lower_bound / 1000)}k–${Math.round(p.upper_bound / 1000)}k
                      </div>
                    </div>
                  </div>

                  {/* Key Specs */}
                  <div className="grid grid-cols-3 gap-1 py-1.5 px-2 rounded-xl bg-slate-50/70 text-[11px] text-slate-600 text-center font-medium">
                    <div>{livingArea} sqft</div>
                    <div>{beds}bd / {baths}ba</div>
                    <div>Qual {qual}/10</div>
                  </div>

                  {/* Actions: Compare checkbox + Load to form */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectForComparison(p.id)}
                        className="rounded accent-violet-600 cursor-pointer"
                      />
                      <span>Compare</span>
                    </label>

                    {onLoadProfile && (
                      <button
                        onClick={() => onLoadProfile(p.features as PropertyFeatures)}
                        className="text-[11px] font-semibold text-violet-600 hover:text-violet-800 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Load</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Profile Side-by-Side Comparison Modal (Section 19) */}
      <AnimatePresence>
        {showCompareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-violet-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Side-by-Side Property Profile Comparison
                  </h3>
                </div>
                <button
                  onClick={() => setShowCompareModal(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Distinction notice */}
              <div className="p-3 rounded-xl bg-violet-50 text-[11px] text-violet-800 flex items-center gap-2 font-medium">
                <Info className="w-4 h-4 text-violet-600 shrink-0" />
                <span>
                  Comparing user-saved profiles. Note: These are separate from historical dataset comparables.
                </span>
              </div>

              {/* Side-by-side Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase">
                      <th className="py-2.5">Attribute</th>
                      {comparisonData.map((prof) => (
                        <th key={prof.profile_id} className="py-2.5 px-3 font-bold text-slate-900 text-sm">
                          {prof.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr className="bg-slate-50/50">
                      <td className="py-2.5 font-bold text-slate-900">Estimated Value</td>
                      {comparisonData.map((prof) => (
                        <td key={prof.profile_id} className="py-2.5 px-3 font-black text-slate-900 font-mono text-sm">
                          ${Math.round(prof.estimated_price).toLocaleString()}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium text-slate-500">Conformal Interval</td>
                      {comparisonData.map((prof) => (
                        <td key={prof.profile_id} className="py-2.5 px-3 font-mono text-slate-600">
                          ${Math.round(prof.lower_bound).toLocaleString()} – ${Math.round(prof.upper_bound).toLocaleString()}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium text-slate-500">Living Area</td>
                      {comparisonData.map((prof) => (
                        <td key={prof.profile_id} className="py-2.5 px-3 font-medium text-slate-900">
                          {prof.living_area.toLocaleString()} sq ft
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium text-slate-500">Price / Sq Ft</td>
                      {comparisonData.map((prof) => (
                        <td key={prof.profile_id} className="py-2.5 px-3 font-mono text-slate-800">
                          ${prof.price_per_sqft} / sq ft
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium text-slate-500">Bedrooms / Baths</td>
                      {comparisonData.map((prof) => (
                        <td key={prof.profile_id} className="py-2.5 px-3">
                          {prof.bedrooms} bed / {prof.full_bath} bath
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium text-slate-500">Overall Quality</td>
                      {comparisonData.map((prof) => (
                        <td key={prof.profile_id} className="py-2.5 px-3 font-semibold text-slate-900">
                          {prof.overall_qual} / 10
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium text-slate-500">Neighborhood</td>
                      {comparisonData.map((prof) => (
                        <td key={prof.profile_id} className="py-2.5 px-3">
                          {prof.neighborhood}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium text-slate-500">Top Model Contributors</td>
                      {comparisonData.map((prof) => (
                        <td key={prof.profile_id} className="py-2.5 px-3">
                          <div className="flex flex-wrap gap-1">
                            {prof.top_contributors.map((c, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600 font-medium">
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <GlassButton variant="secondary" size="sm" onClick={() => setShowCompareModal(false)}>
                  Close Comparison
                </GlassButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
};
