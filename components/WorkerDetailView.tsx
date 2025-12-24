/**
 * ===================================================================
 * WORKER DETAIL VIEW - Complete worker profile for employers
 * ===================================================================
 * Shows full worker information including portfolio, certificates,
 * skills, location map, reviews, and contact options
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import workerProfileService from "../services/workerProfileService";
import { StarRating } from "./reviews/StarRating";
import { ReviewList } from "./reviews/ReviewList";
import { ReviewForm } from "./reviews/ReviewForm";

interface WorkerDetailViewProps {
  workerId?: string; // Optional if passed as prop
}

interface WorkerData {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  specialization: string;
  hourly_rate: number;
  years_experience: number;
  location_city: string;
  bio: string | null;
  rating: number;
  rating_count: number;
  verified: boolean;
  skills: string[];
  certifications: string[];
}

export const WorkerDetailView: React.FC<WorkerDetailViewProps> = ({
  workerId: propWorkerId,
}) => {
  const { workerId: paramWorkerId } = useParams<{ workerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ Get current logged-in user
  const workerId = propWorkerId || paramWorkerId;

  const [worker, setWorker] = useState<WorkerData | null>(null);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Load worker data
  useEffect(() => {
    if (!workerId) {
      setError("❌ Brak ID pracownika");
      setLoading(false);
      return;
    }

    loadWorkerData();
  }, [workerId]);

  const loadWorkerData = async () => {
    if (!workerId) return;

    try {
      setLoading(true);
      setError(null);

      // Load worker profile
      const profile = await workerProfileService.getWorkerProfile(workerId);
      if (!profile) {
        throw new Error("Profil pracownika nie został znaleziony");
      }
      setWorker(profile);

      // Load portfolio (mock for now)
      setPortfolio([
        {
          id: 1,
          title: "Projekt 1",
          image_url: "/api/placeholder/300/200",
          description: "Remont kuchni",
        },
        {
          id: 2,
          title: "Projekt 2",
          image_url: "/api/placeholder/300/200",
          description: "Łazienka",
        },
      ]);

      // Load certificates
      const certs = await workerProfileService.getWorkerCertificates(workerId);
      setCertificates(certs || []);
    } catch (err) {
      console.error("Error loading worker data:", err);
      setError(err instanceof Error ? err.message : "Błąd ładowania danych");
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = () => {
    setShowReviewForm(true);
  };

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    loadWorkerData(); // Reload to show new review
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-dark flex items-center justify-center">
        <div className="text-white text-xl">
          ⏳ Ładowanie profilu pracownika...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-primary-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button
            onClick={() => navigate("/employer")}
            className="px-6 py-3 bg-accent-cyber text-white rounded-lg hover:shadow-lg"
          >
            ← Powrót do panelu pracodawcy
          </button>
        </div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="min-h-screen bg-primary-dark flex items-center justify-center">
        <div className="text-red-400 text-xl">
          ❌ Pracownik nie został znaleziony
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-dark">
      {/* Header */}
      <div className="bg-dark-800 border-b border-neutral-700 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate("/employer")}
            className="text-accent-cyber hover:text-white mb-4 transition-colors"
          >
            ← Powrót do panelu pracodawcy
          </button>

          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent-cyber to-accent-purple flex items-center justify-center text-white text-3xl font-bold">
              {worker.avatar_url ? (
                <img
                  src={worker.avatar_url}
                  alt={worker.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                worker.full_name.charAt(0).toUpperCase()
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">
                  {worker.full_name}
                </h1>
                {worker.verified && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                    ✓ Zweryfikowany
                  </span>
                )}
              </div>

              <div className="text-accent-cyber text-xl font-semibold mb-2">
                {worker.specialization}
              </div>

              <div className="flex items-center gap-6 text-neutral-300">
                <div className="flex items-center gap-2">
                  <StarRating rating={worker.rating} readonly size="sm" />
                  <span>
                    {worker.rating.toFixed(1)} ({worker.rating_count} opinii)
                  </span>
                </div>
                <div>📍 {worker.location_city}</div>
                <div>💰 €{worker.hourly_rate}/godz</div>
                <div>🛠️ {worker.years_experience} lat doświadczenia</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  // TODO: Implement contact functionality
                  alert("Funkcja kontaktu zostanie wkrótce dodana");
                }}
                className="px-6 py-3 bg-accent-cyber text-white font-bold rounded-lg hover:shadow-lg transition-all"
              >
                📞 Kontakt
              </button>

              <button
                onClick={handleAddReview}
                className="px-6 py-3 bg-accent-purple text-white font-bold rounded-lg hover:shadow-lg transition-all"
              >
                ⭐ Dodaj opinię
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bio */}
            {worker.bio && (
              <div className="bg-dark-800 rounded-xl p-6 border border-neutral-700">
                <h2 className="text-xl font-bold text-white mb-4">📋 O mnie</h2>
                <p className="text-neutral-300 leading-relaxed">{worker.bio}</p>
              </div>
            )}

            {/* Portfolio */}
            <div className="bg-dark-800 rounded-xl p-6 border border-neutral-700">
              <h2 className="text-xl font-bold text-white mb-6">
                🎨 Portfolio
              </h2>
              {portfolio.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {portfolio.map((item) => (
                    <div
                      key={item.id}
                      className="bg-dark-700 rounded-lg overflow-hidden border border-neutral-600"
                    >
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="text-white font-semibold mb-2">
                          {item.title}
                        </h3>
                        <p className="text-neutral-400 text-sm">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-400">
                  📷 Brak zdjęć w portfolio
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-dark-800 rounded-xl p-6 border border-neutral-700">
              <h2 className="text-xl font-bold text-white mb-6">⭐ Opinie</h2>
              <ReviewList workerId={workerId!} showTitle={false} />
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Skills */}
            <div className="bg-dark-800 rounded-xl p-6 border border-neutral-700">
              <h3 className="text-lg font-bold text-white mb-4">
                🛠️ Umiejętności
              </h3>
              {worker.skills && worker.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {worker.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-accent-cyber/20 text-accent-cyber rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-neutral-400 text-sm">
                  Brak umiejętności
                </div>
              )}
            </div>

            {/* Certificates */}
            <div className="bg-dark-800 rounded-xl p-6 border border-neutral-700">
              <h3 className="text-lg font-bold text-white mb-4">
                🏆 Certyfikaty
              </h3>
              {certificates.length > 0 ? (
                <div className="space-y-3">
                  {certificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="p-3 bg-dark-700 rounded-lg border border-neutral-600"
                    >
                      <div className="text-white font-semibold">
                        {cert.name}
                      </div>
                      <div className="text-neutral-400 text-sm">
                        {cert.issuer}
                      </div>
                      {cert.date_earned && (
                        <div className="text-neutral-500 text-xs mt-1">
                          Uzyskano:{" "}
                          {new Date(cert.date_earned).toLocaleDateString(
                            "pl-PL"
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-neutral-400 text-sm">
                  Brak certyfikatów
                </div>
              )}
            </div>

            {/* Location Map (placeholder) */}
            <div className="bg-dark-800 rounded-xl p-6 border border-neutral-700">
              <h3 className="text-lg font-bold text-white mb-4">
                📍 Lokalizacja
              </h3>
              <div className="bg-dark-700 rounded-lg p-8 text-center border border-neutral-600">
                <div className="text-neutral-400 text-sm mb-2">🗺️ Mapa</div>
                <div className="text-white">{worker.location_city}</div>
                <div className="text-neutral-500 text-xs mt-2">
                  (Integracja z Google Maps wkrótce)
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-dark-800 rounded-xl p-6 border border-neutral-700">
              <h3 className="text-lg font-bold text-white mb-4">📞 Kontakt</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-neutral-300">
                  <span>📧</span>
                  <span className="text-sm">{worker.email}</span>
                </div>
                {worker.phone && (
                  <div className="flex items-center gap-3 text-neutral-300">
                    <span>📱</span>
                    <span className="text-sm">{worker.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8">
          <div className="bg-dark-800 rounded-xl p-6 max-w-md w-full border border-neutral-700">
            <h3 className="text-xl font-bold text-white mb-4">
              ⭐ Dodaj opinię
            </h3>
            <ReviewForm
              workerId={workerId!}
              employerId={user?.id || ""} // ✅ Use actual logged-in user ID
              workerName={worker.full_name}
              onReviewSubmitted={handleReviewSubmitted}
              onCancel={() => setShowReviewForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDetailView;
