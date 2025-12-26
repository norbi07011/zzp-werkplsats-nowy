import React from "react";
import { Profile } from "../types";
import { Badge } from "./Badge";
import { StarIcon, LocationIcon } from "./icons";
import { AddToTeamButton } from "./AddToTeamButton";

interface WorkerCardProps {
  profile: Profile;
  onReview: (profile: Profile) => void;
}

export const WorkerCard: React.FC<WorkerCardProps> = ({
  profile,
  onReview,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200/60 dark:border-slate-700/60 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary-300/50 dark:hover:border-primary-700/50 group">
      <div className="p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="relative flex-shrink-0">
            <div className="relative">
              <img
                className="w-16 h-16 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-slate-700 transition-transform duration-300 group-hover:scale-105"
                src={profile.avatarUrl}
                alt={`${profile.firstName} ${profile.lastName}`}
              />
              {profile.isVerified && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-md ring-2 ring-white dark:ring-slate-800">
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-0.5 truncate">
              {profile.firstName} {profile.lastName}
            </h3>
            <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-1">
              {profile.category}
            </p>
            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
              <LocationIcon className="w-3.5 h-3.5 mr-1" />
              <span>{profile.location}</span>
            </div>
          </div>

          {profile.rate && (
            <div className="text-right flex-shrink-0">
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                €{profile.rate}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                per uur
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {profile.isVerified && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-md border border-emerald-200 dark:border-emerald-800/50">
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Verified
            </span>
          )}
          {profile.hasVca && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-md border border-blue-200 dark:border-blue-800/50">
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              VCA
            </span>
          )}
          {/* Team/Duo Badge */}
          {(profile as any).worker_type === "team_leader" && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-md border border-orange-200 dark:border-orange-800/50">
              👥 Zespół {(profile as any).team_size || 2}os.
            </span>
          )}
          {(profile as any).worker_type === "duo_partner" && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-md border border-purple-200 dark:border-purple-800/50">
              🤝 Duo
            </span>
          )}
          {(profile as any).worker_type === "helper_available" && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 rounded-md border border-teal-200 dark:border-teal-800/50">
              🆘 Helper
            </span>
          )}
          {(profile as any).is_on_demand_available && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-md border border-yellow-200 dark:border-yellow-800/50">
              ⚡ Springer
            </span>
          )}
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md">
            {profile.level}
          </span>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-1.5">
            <StarIcon className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {profile.avgRating.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({profile.reviewCount} reviews)
            </span>
          </div>

          <div className="flex gap-2">
            <button
              className="inline-flex items-center justify-center w-9 h-9 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
              title="View Profile"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </button>
            <button
              onClick={() => onReview(profile)}
              className="inline-flex items-center px-4 h-9 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-md"
            >
              <svg
                className="w-4 h-4 mr-1.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Review
            </button>
          </div>
        </div>

        {/* ✅ NEW: Add to Team Button */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
          <AddToTeamButton
            userId={String(profile.id)}
            userEmail={profile.email}
            userType="worker"
            displayName={`${profile.firstName} ${profile.lastName}`}
            avatarUrl={profile.avatarUrl}
            className="w-full justify-center"
          />
        </div>
      </div>
    </div>
  );
};
