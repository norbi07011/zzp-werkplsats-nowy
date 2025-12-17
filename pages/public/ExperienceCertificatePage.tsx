import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import { Logo } from '../../src/components/common/Logo';

// Define the correct type for applications table insert
type ApplicationInsert = {
  employer_id: string;
  job_id: string; 
  worker_id: string;
  status?: string;
  cover_letter?: string;
  available_from?: string;
  created_at?: string;
  updated_at?: string;
};

export const ExperienceCertificatePage: React.FC = () => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    specialization: '',
    years_experience: '',
    city: '',
    motivation: '',
    preferred_exam_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create a simple object for applications table
      // Note: This is for job applications, not exam applications
      const payload = {
        employer_id: 'temp-employer-id', // This needs to be actual employer ID
        job_id: 'temp-job-id', // This needs to be actual job ID  
        worker_id: 'temp-worker-id', // This needs to be actual worker ID
        status: 'pending',
        cover_letter: formData.motivation,
        available_from: formData.preferred_exam_date,
        created_at: new Date().toISOString()
      };

      // Using 'applications' table for job applications
      const { error } = await supabase
        .from('applications')
        .insert([payload]);

      if (error) throw error;

      setSubmitSuccess(true);
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Er is een fout opgetreden. Probeer het opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-primary-dark flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-gradient-glass backdrop-blur-md rounded-3xl p-12 border-2 border-green-500 shadow-glow-success text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo size="md" showText={false} />
          </div>
          
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow-premium">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Aanmelding Ontvangen!</h2>
          <p className="text-xl text-neutral-300 mb-8">
            Bedankt voor je interesse in het ZZP Examen. We hebben je aanmelding ontvangen en nemen binnen <strong className="text-green-400">24 uur</strong> contact met je op.
          </p>
          <div className="bg-primary-navy/50 rounded-2xl p-6 mb-8 border border-green-500/30">
            <h3 className="text-xl font-bold text-white mb-4">📧 Wat gebeurt er nu?</h3>
            <ul className="space-y-3 text-left text-neutral-300">
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span>Je ontvangt een <strong className="text-white">bevestigingsmail</strong> met je aanmeldingsgegevens</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span>Ons team controleert je aanmelding en stelt een <strong className="text-white">examendatum</strong> voor</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span>Na bevestiging ontvang je de <strong className="text-white">betaalinstructies</strong> (€230)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span>Voor het examen krijg je <strong className="text-white">voorbereidingsmateriaal</strong> toegestuurd</span>
              </li>
            </ul>
          </div>
          <Link to="/" className="inline-block bg-gradient-to-r from-green-400 to-emerald-500 text-green-950 px-10 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-2xl">
            Terug naar Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary-dark">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-navy via-primary-dark to-yellow-900/20 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute top-10 left-10 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-block bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-950 px-6 py-2 rounded-full font-bold text-sm mb-6 shadow-lg">
            📜 OFFICIEEL ZZP EXAMEN
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-6 font-heading">
            ZZP Examen & Certificaat
          </h1>
          <p className="text-2xl text-neutral-300 max-w-4xl mx-auto leading-relaxed mb-8">
            Bewijs je vakkennis met ons officiële ZZP Examen. Online test van 60 vragen over bouwregelgeving, veiligheid, materiaalkennis en calculatie.
          </p>

          {/* Real Photos - Exam & Certificate */}
          <div className="mb-12 grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="rounded-2xl overflow-hidden border-4 border-yellow-500/40 shadow-2xl transform hover:scale-105 transition-transform">
              <img 
                src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=700&h=500&fit=crop" 
                alt="Professional studying for certification exam"
                className="w-full h-80 object-cover"
              />
              <div className="bg-gradient-to-r from-yellow-600 to-amber-600 p-4 text-center">
                <p className="text-white font-bold">📚 Bereid je voor op het officiële examen</p>
              </div>
            </div>
            
            <div className="rounded-2xl overflow-hidden border-4 border-amber-500/40 shadow-2xl transform hover:scale-105 transition-transform">
              <img 
                src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=700&h=500&fit=crop" 
                alt="Official certificate and diploma"
                className="w-full h-80 object-cover"
              />
              <div className="bg-gradient-to-r from-amber-600 to-yellow-600 p-4 text-center">
                <p className="text-white font-bold">🏆 Ontvang je officiële certificaat!</p>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-gradient-glass backdrop-blur-md rounded-2xl p-6 border border-yellow-500/30">
              <div className="text-4xl mb-3">📝</div>
              <div className="text-2xl font-bold text-white mb-2">60 Vragen</div>
              <p className="text-neutral-200 text-sm">Online examen, 70% slagingspercentage</p>
            </div>
            <div className="bg-gradient-glass backdrop-blur-md rounded-2xl p-6 border border-yellow-500/30">
              <div className="text-4xl mb-3">⏱️</div>
              <div className="text-2xl font-bold text-white mb-2">90 Minuten</div>
              <p className="text-neutral-200 text-sm">Ruim de tijd om rustig na te denken</p>
            </div>
            <div className="bg-gradient-glass backdrop-blur-md rounded-2xl p-6 border border-yellow-500/30">
              <div className="text-4xl mb-3">🏆</div>
              <div className="text-2xl font-bold text-white mb-2">€230</div>
              <p className="text-neutral-200 text-sm">+ 1 jaar Premium gratis (€156 waarde)</p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-24 bg-gradient-to-br from-yellow-500/10 via-primary-navy/20 to-amber-600/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-6 font-heading">Wat Krijg Je Ervoor?</h2>
            <p className="text-xl text-neutral-300 max-w-3xl mx-auto">
              Voor €230 krijg je niet alleen een certificaat, maar een volledig pakket aan voordelen.
            </p>
          </div>

          {/* Real Photo - Benefits */}
          <div className="mb-12 rounded-2xl overflow-hidden border-4 border-green-500/30 shadow-2xl transform hover:scale-105 transition-transform max-w-4xl mx-auto">
            <img 
              src="https://images.unsplash.com/photo-1552581234-26160f608093?w=900&h=500&fit=crop" 
              alt="Success and achievement celebration"
              className="w-full h-96 object-cover"
            />
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-center">
              <p className="text-white font-bold text-xl">🎉 Volledige pakket: Certificaat + Premium + Badge!</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <div className="bg-gradient-glass backdrop-blur-md rounded-3xl p-8 border border-yellow-500/30 hover:border-yellow-500/60 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-glow-premium group-hover:scale-110 transition-transform">
                <span className="text-3xl">📜</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Officieel Certificaat</h3>
              <p className="text-neutral-300 leading-relaxed">
                Downloadbaar PDF-certificaat met uniek nummer, datum en je specialisatie. Direct te delen met opdrachtgevers.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="bg-gradient-glass backdrop-blur-md rounded-3xl p-8 border border-green-500/30 hover:border-green-500/60 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-glow-premium group-hover:scale-110 transition-transform">
                <span className="text-3xl">🎁</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">1 Jaar Premium Gratis</h3>
              <p className="text-neutral-300 leading-relaxed">
                <strong className="text-green-400">€156 waarde!</strong> Volledige Premium toegang voor 1 jaar. Team configuraties, Skoczek, en topzichtbaarheid.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="bg-gradient-glass backdrop-blur-md rounded-3xl p-8 border border-blue-500/30 hover:border-blue-500/60 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-glow-premium group-hover:scale-110 transition-transform">
                <span className="text-3xl">🏆</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Gecertificeerd Badge</h3>
              <p className="text-neutral-300 leading-relaxed">
                Speciale <strong className="text-yellow-400">🏆 Gecertificeerd</strong> badge zichtbaar in je profiel. Hogere ranking in zoekresultaten.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="bg-gradient-glass backdrop-blur-md rounded-3xl p-8 border border-purple-500/30 hover:border-purple-500/60 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-glow-premium group-hover:scale-110 transition-transform">
                <span className="text-3xl">📚</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Voorbereidingsmateriaal</h3>
              <p className="text-neutral-300 leading-relaxed">
                Gratis toegang tot voorbeeldvragen, studiemateriaal en tips om je optimaal voor te bereiden op het examen.
              </p>
            </div>

            {/* Benefit 5 */}
            <div className="bg-gradient-glass backdrop-blur-md rounded-3xl p-8 border border-orange-500/30 hover:border-orange-500/60 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-glow-premium group-hover:scale-110 transition-transform">
                <span className="text-3xl">🔄</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Herkansing Mogelijk</h3>
              <p className="text-neutral-300 leading-relaxed">
                Niet geslaagd? <strong className="text-orange-400">50% korting</strong> op je tweede poging. Onbeperkt geldig.
              </p>
            </div>

            {/* Benefit 6 */}
            <div className="bg-gradient-glass backdrop-blur-md rounded-3xl p-8 border border-cyan-500/30 hover:border-cyan-500/60 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-2xl flex items-center justify-center mb-6 shadow-glow-premium group-hover:scale-110 transition-transform">
                <span className="text-3xl">💼</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Meer Opdrachten</h3>
              <p className="text-neutral-300 leading-relaxed">
                Gecertificeerde ZZP'ers krijgen gemiddeld <strong className="text-cyan-400">3x meer aanvragen</strong> van opdrachtgevers.
              </p>
            </div>
          </div>

          {/* Calculation Box */}
          <div className="mt-16 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-3xl p-10 border-2 border-green-500 max-w-3xl mx-auto">
            <h3 className="text-3xl font-bold text-white mb-6 text-center">💰 Echte Waarde Berekening</h3>
            <div className="space-y-4 text-neutral-300 text-lg">
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span>ZZP Examen (eenmalig)</span>
                <span className="font-bold text-white">€230</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span>1 Jaar Premium abonnement</span>
                <span className="font-bold text-green-400">€156 gratis</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span>Voorbereidingsmateriaal</span>
                <span className="font-bold text-green-400">€50 gratis</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b-2 border-white/30">
                <span>Certificaat + Badge</span>
                <span className="font-bold text-green-400">Onbetaalbaar</span>
              </div>
              <div className="flex justify-between items-center pt-3">
                <span className="text-2xl font-bold text-white">Totale Waarde:</span>
                <span className="text-3xl font-bold text-green-400">€436+</span>
              </div>
            </div>
            <p className="text-center text-neutral-200 mt-6 text-sm">
              Je betaalt <strong className="text-white">€230</strong>, maar krijgt <strong className="text-green-400">€436+ waarde</strong>. Dat is een <strong className="text-yellow-400">90% voordeel</strong>!
            </p>
          </div>
        </div>
      </section>

      {/* Exam Topics Section */}
      <section className="py-24 bg-primary-navy/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-6 font-heading">Examen Onderwerpen</h2>
            <p className="text-xl text-neutral-300 max-w-3xl mx-auto">
              Het examen test je kennis op 4 hoofdgebieden. Hieronder zie je wat je moet weten:
            </p>
          </div>

          {/* Real Photos - Exam Topics */}
          <div className="mb-12 grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl overflow-hidden border-4 border-blue-500/30 shadow-2xl transform hover:scale-105 transition-transform">
              <img 
                src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500&h=400&fit=crop" 
                alt="Construction blueprints and regulations"
                className="w-full h-64 object-cover"
              />
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-3 text-center">
                <p className="text-white font-bold text-sm">📐 Bouwregelgeving</p>
              </div>
            </div>
            
            <div className="rounded-2xl overflow-hidden border-4 border-red-500/30 shadow-2xl transform hover:scale-105 transition-transform">
              <img 
                src="https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=500&h=400&fit=crop" 
                alt="Safety equipment and protection"
                className="w-full h-64 object-cover"
              />
              <div className="bg-gradient-to-r from-red-600 to-orange-600 p-3 text-center">
                <p className="text-white font-bold text-sm">⚠️ Veiligheid</p>
              </div>
            </div>
            
            <div className="rounded-2xl overflow-hidden border-4 border-green-500/30 shadow-2xl transform hover:scale-105 transition-transform">
              <img 
                src="https://images.unsplash.com/photo-1581093458791-9d42e285e386?w=500&h=400&fit=crop" 
                alt="Construction materials and tools"
                className="w-full h-64 object-cover"
              />
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-3 text-center">
                <p className="text-white font-bold text-sm">🔨 Materiaalkennis</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-glass backdrop-blur-md rounded-3xl p-8 border border-blue-500/30">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📐</span>
                </div>
                <h3 className="text-2xl font-bold text-white">Bouwregelgeving</h3>
              </div>
              <ul className="space-y-3 text-neutral-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Bouwbesluit 2012 en nieuwste updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Vergunningen en meldingsplicht</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Bouwkundige eisen en normen</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Energieprestatie-eisen (EPC)</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-glass backdrop-blur-md rounded-3xl p-8 border border-red-500/30">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-orange-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h3 className="text-2xl font-bold text-white">Veiligheid & Certificaten</h3>
              </div>
              <ul className="space-y-3 text-neutral-300">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>VCA (Veiligheid, Gezondheid en Milieu Checklist Aannemers)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Persoonlijke beschermingsmiddelen (PBM)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Werken op hoogte en steigerveiligheid</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Elektrische veiligheid (NEN 1010)</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-glass backdrop-blur-md rounded-3xl p-8 border border-green-500/30">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🏗️</span>
                </div>
                <h3 className="text-2xl font-bold text-white">Materiaalkennis</h3>
              </div>
              <ul className="space-y-3 text-neutral-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Eigenschappen van bouwmaterialen</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Keuze van materialen per toepassing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Duurzaamheid en isolatiewaarden</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Vochtregulatie en brandwerendheid</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-glass backdrop-blur-md rounded-3xl p-8 border border-yellow-500/30">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
                <h3 className="text-2xl font-bold text-white">Calculatie & Planning</h3>
              </div>
              <ul className="space-y-3 text-neutral-300">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  <span>Uurloon berekening en offertes maken</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  <span>Materiaal- en arbeidsbegroting</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  <span>Tijdsplanning en werkvoorbereiding</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  <span>BTW, ZZP-regelgeving en fiscaliteit</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form Section */}
      <section className="py-24 bg-gradient-to-br from-yellow-500/5 to-amber-600/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Real Photo - Registration */}
          <div className="mb-12 rounded-full overflow-hidden border-4 border-yellow-500/40 shadow-2xl transform hover:scale-105 transition-transform aspect-square max-w-md mx-auto">
            <img 
              src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=600&fit=crop" 
              alt="Professional registration and form filling"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="bg-gradient-glass backdrop-blur-md rounded-3xl p-10 md:p-16 border border-yellow-500/30 shadow-2xl">
            <div className="text-center mb-12">
              <h2 className="text-5xl font-bold text-white mb-4 font-heading">Meld Je Aan!</h2>
              <p className="text-xl text-neutral-300">
                Vul onderstaand formulier in en we nemen binnen 24 uur contact met je op.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name & Email */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Volledige Naam *</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-primary-navy/50 border border-white/20 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="Jan de Vries"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">E-mailadres *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-primary-navy/50 border border-white/20 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="jan@voorbeeld.nl"
                  />
                </div>
              </div>

              {/* Phone & City */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Telefoonnummer *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-primary-navy/50 border border-white/20 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="+31 6 12345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Woonplaats *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-primary-navy/50 border border-white/20 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="Amsterdam"
                  />
                </div>
              </div>

              {/* Specialization & Experience */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Specialisatie *</label>
                  <select
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-primary-navy/50 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="">Kies je vakgebied</option>
                    <option value="Metselaar">Metselaar</option>
                    <option value="Timmerman">Timmerman</option>
                    <option value="Elektricien">Elektricien</option>
                    <option value="Loodgieter">Loodgieter</option>
                    <option value="Stukadoor">Stukadoor</option>
                    <option value="Schilder">Schilder</option>
                    <option value="Tegelzetter">Tegelzetter</option>
                    <option value="Isolateur">Isolateur</option>
                    <option value="Dakdekker">Dakdekker</option>
                    <option value="Anders">Anders</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Jaren Ervaring *</label>
                  <input
                    type="number"
                    name="years_experience"
                    value={formData.years_experience}
                    onChange={handleChange}
                    required
                    min="1"
                    max="50"
                    className="w-full px-4 py-3 bg-primary-navy/50 border border-white/20 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="5"
                  />
                </div>
              </div>

              {/* Preferred Date */}
              <div>
                <label className="block text-sm font-bold text-white mb-2">Voorkeursdatum Examen (optioneel)</label>
                <input
                  type="date"
                  name="preferred_exam_date"
                  value={formData.preferred_exam_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-primary-navy/50 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
                <p className="text-neutral-200 text-sm mt-2">We proberen je voorkeur te respecteren, maar kunnen dit niet garanderen.</p>
              </div>

              {/* Motivation */}
              <div>
                <label className="block text-sm font-bold text-white mb-2">Motivatie (optioneel)</label>
                <textarea
                  name="motivation"
                  value={formData.motivation}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-primary-navy/50 border border-white/20 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Waarom wil je het ZZP Examen doen? Wat zijn je doelen?"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-950 px-10 py-5 rounded-xl font-bold text-xl hover:scale-105 transition-transform shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? 'Bezig met verzenden...' : 'Meld Je Aan voor ZZP Examen →'}
              </button>

              <p className="text-neutral-200 text-sm text-center">
                Door je aan te melden ga je akkoord met onze <Link to="/legal" className="text-yellow-400 hover:underline">voorwaarden en privacybeleid</Link>.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-primary-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl font-bold text-white mb-12 text-center font-heading">Veelgestelde Vragen</h2>

          {/* Real Photo - FAQ Support */}
          <div className="mb-12 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl overflow-hidden border-4 border-purple-500/30 shadow-2xl transform hover:scale-105 transition-transform">
              <img 
                src="https://images.unsplash.com/photo-1553484771-371a605b060b?w=600&h=400&fit=crop" 
                alt="Customer support and help"
                className="w-full h-64 object-cover"
              />
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-center">
                <p className="text-white font-bold">❓ We beantwoorden al je vragen!</p>
              </div>
            </div>
            
            <div className="rounded-2xl overflow-hidden border-4 border-blue-500/30 shadow-2xl transform hover:scale-105 transition-transform">
              <img 
                src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&h=400&fit=crop" 
                alt="Professional online exam"
                className="w-full h-64 object-cover"
              />
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 text-center">
                <p className="text-white font-bold">💻 Volledig online examen!</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <details className="bg-gradient-glass backdrop-blur-md rounded-2xl p-6 border border-white/10 group">
              <summary className="font-bold text-xl text-white cursor-pointer list-none flex items-center justify-between">
                <span>Moet ik eerst betalen voordat ik het examen kan doen?</span>
                <svg className="w-5 h-5 text-yellow-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-neutral-300 leading-relaxed">
                Nee! Je meldt je eerst aan via dit formulier. We nemen contact met je op, bevestigen een datum, en <strong>pas daarna</strong> ontvang je de betaalinstructies. Je betaalt dus pas als de datum is bevestigd.
              </p>
            </details>

            <details className="bg-gradient-glass backdrop-blur-md rounded-2xl p-6 border border-white/10 group">
              <summary className="font-bold text-xl text-white cursor-pointer list-none flex items-center justify-between">
                <span>Hoe moeilijk is het examen?</span>
                <svg className="w-5 h-5 text-yellow-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-neutral-300 leading-relaxed">
                Het examen is uitdagend maar haalbaar voor professionals met ervaring. 70% moet correct zijn om te slagen. Je krijgt voorbereidingsmateriaal en voorbeeldvragen om je voor te bereiden.
              </p>
            </details>

            <details className="bg-gradient-glass backdrop-blur-md rounded-2xl p-6 border border-white/10 group">
              <summary className="font-bold text-xl text-white cursor-pointer list-none flex items-center justify-between">
                <span>Kan ik het examen online doen?</span>
                <svg className="w-5 h-5 text-yellow-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-neutral-300 leading-relaxed">
                Ja! Het examen wordt volledig online afgenomen via een beveiligde platform. Je hebt alleen een computer/laptop met webcam nodig. Het examen wordt geproctord (begeleid) via je webcam om fraude te voorkomen.
              </p>
            </details>

            <details className="bg-gradient-glass backdrop-blur-md rounded-2xl p-6 border border-white/10 group">
              <summary className="font-bold text-xl text-white cursor-pointer list-none flex items-center justify-between">
                <span>Wat als ik niet slaag?</span>
                <svg className="w-5 h-5 text-yellow-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-neutral-300 leading-relaxed">
                Je krijgt een gedetailleerd overzicht van je resultaten en welke onderwerpen je moet verbeteren. Je kunt opnieuw examen doen met <strong className="text-orange-400">50% korting</strong> (€115 i.p.v. €230).
              </p>
            </details>

            <details className="bg-gradient-glass backdrop-blur-md rounded-2xl p-6 border border-white/10 group">
              <summary className="font-bold text-xl text-white cursor-pointer list-none flex items-center justify-between">
                <span>Wanneer krijg ik mijn Premium abonnement?</span>
                <svg className="w-5 h-5 text-yellow-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-neutral-300 leading-relaxed">
                Direct na het <strong className="text-green-400">behalen</strong> van het examen! Je account wordt automatisch geüpgraded naar Premium voor 1 jaar. Je kunt dan direct teams configureren, Skoczek activeren, en profiteer je van verhoogde zichtbaarheid.
              </p>
            </details>

            <details className="bg-gradient-glass backdrop-blur-md rounded-2xl p-6 border border-white/10 group">
              <summary className="font-bold text-xl text-white cursor-pointer list-none flex items-center justify-between">
                <span>Is het certificaat erkend?</span>
                <svg className="w-5 h-5 text-yellow-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-neutral-300 leading-relaxed">
                Het is een officieel certificaat van ZZP Werkplaats dat je vakkennis bevestigt. Het is geen wettelijk verplicht certificaat zoals VCA, maar geeft wel aan opdrachtgevers dat je je kennis hebt laten toetsen en serieus bent als professional.
              </p>
            </details>
          </div>

          {/* Real Photo - Success */}
          <div className="mt-12 rounded-2xl overflow-hidden border-4 border-green-500/40 shadow-2xl transform hover:scale-105 transition-transform">
            <img 
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=900&h=500&fit=crop" 
              alt="Team celebrating exam success"
              className="w-full h-96 object-cover"
            />
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-center">
              <p className="text-white font-bold text-xl">🎉 Word deel van onze gecertificeerde professionals!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Footer */}
      <section className="py-12 bg-primary-navy/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-neutral-200 leading-relaxed">
            Door het aanmeldingsformulier in te dienen, gaat u akkoord met onze verwerkingsvoorwaarden en privacybeleid. 
            Uw gegevens worden uitsluitend gebruikt voor de organisatie van het examen en worden niet gedeeld met derden zonder uw toestemming. 
            Het examen is optioneel - u kunt ook zonder certificaat gebruik maken van ons platform.
          </p>
        </div>
      </section>
    </div>
  );
};
