import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Logo } from "../../src/components/common/Logo";

export const ContactPage: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Send to backend
    console.log("Contact form submitted:", formData);
    alert(
      t(
        "contact.form.success",
        "Bedankt! We nemen binnen 24 uur contact met u op."
      )
    );
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo size="lg" showText={true} className="filter drop-shadow-lg" />
          </div>

          <h1 className="text-5xl font-bold mb-6">
            {t("contact.hero.title", "Contact")}
          </h1>
          <p className="text-xl text-blue-100">
            {t("contact.hero.subtitle", "Heeft u vragen? We helpen u graag!")}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <h2 className="text-3xl font-bold mb-6">
              {t("contact.form.title", "Stuur ons een bericht")}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="contact-name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("contact.form.name", "Naam")} *
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder={t("contact.form.namePlaceholder", "Uw naam")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("contact.form.email", "E-mail")} *
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder={t(
                    "contact.form.emailPlaceholder",
                    "uw@email.com"
                  )}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("contact.form.phone", "Telefoon")}
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder={t(
                    "contact.form.phonePlaceholder",
                    "+31 20 123 4567"
                  )}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-subject"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("contact.form.subject", "Onderwerp")} *
                </label>
                <select
                  id="contact-subject"
                  required
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">
                    {t(
                      "contact.form.selectSubject",
                      "Selecteer een onderwerp..."
                    )}
                  </option>
                  <option value="general">
                    {t("contact.form.subjects.general", "Algemene vraag")}
                  </option>
                  <option value="certificate">
                    {t(
                      "contact.form.subjects.certificate",
                      "Certificaat aanvraag"
                    )}
                  </option>
                  <option value="employer">
                    {t("contact.form.subjects.employer", "Voor opdrachtgevers")}
                  </option>
                  <option value="technical">
                    {t(
                      "contact.form.subjects.technical",
                      "Technische ondersteuning"
                    )}
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("contact.form.message", "Bericht")} *
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder={t(
                    "contact.form.messagePlaceholder",
                    "Uw bericht..."
                  )}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
              >
                {t("contact.form.submit", "Verstuur bericht")}
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div>
            <h2 className="text-3xl font-bold mb-6">
              {t("contact.info.title", "Bezoek ons")}
            </h2>

            <div className="space-y-6">
              {/* Address */}
              <div className="flex items-start">
                <svg
                  className="w-6 h-6 text-blue-600 mr-4 mt-1 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h3 className="font-bold text-lg mb-1">
                    {t("contact.info.address.title", "Kantooradres")}
                  </h3>
                  <p className="text-gray-600">
                    Schietlood 14-A
                    <br />
                    2495 AN Den Haag
                    <br />
                    Nederland 🇳🇱
                  </p>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start">
                <svg
                  className="w-6 h-6 text-blue-600 mr-4 mt-1 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h3 className="font-bold text-lg mb-1">
                    {t("contact.info.hours.title", "Openingstijden")}
                  </h3>
                  <p className="text-gray-600">
                    {t("contact.info.hours.weekdays", "Ma-Vr: 09:00 - 17:00")}
                    <br />
                    {t("contact.info.hours.weekend", "Za-Zo: Gesloten")}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start">
                <svg
                  className="w-6 h-6 text-blue-600 mr-4 mt-1 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <div>
                  <h3 className="font-bold text-lg mb-1">
                    {t("contact.info.phone.title", "Contact")}
                  </h3>
                  <p className="text-gray-600">
                    Via e-mail of contactformulier
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start">
                <svg
                  className="w-6 h-6 text-blue-600 mr-4 mt-1 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <div>
                  <h3 className="font-bold text-lg mb-1">
                    {t("contact.info.email.title", "E-mail")}
                  </h3>
                  <p className="text-gray-600">info@zzpwerkplaats.nl</p>
                </div>
              </div>
            </div>

            {/* Google Maps - Locatie */}
            <div className="mt-8 rounded-lg overflow-hidden border border-blue-200 shadow-lg">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  📍 Onze Locatie - Den Haag
                </h4>
              </div>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2454.8574775697547!2d4.2812!3d52.0396!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c5b5c3d7b4a9e7%3A0x0!2sSchietlood%2014-A%2C%202495%20AN%20Den%20Haag%2C%20Netherlands!5e0!3m2!1sen!2snl!4v1702656000000!5m2!1sen!2snl"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="ZZP Werkplaats locatie - Schietlood 14-A, Den Haag"
                className="w-full"
              />
              <div className="bg-gray-50 p-4 border-t border-gray-200">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="font-bold text-gray-800">Schietlood 14-A</p>
                    <p className="text-gray-600 text-sm">
                      2495 AN Den Haag, Nederland
                    </p>
                  </div>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Schietlood+14-A+2495+AN+Den+Haag+Netherlands"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors text-sm"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Open in Google Maps
                  </a>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-6 border border-green-200">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🏢</div>
                <div>
                  <h4 className="text-lg font-bold text-green-800 mb-2">
                    Bezoek op afspraak
                  </h4>
                  <p className="text-gray-600 text-sm">
                    U bent welkom op ons kantoor in Den Haag. Maak vooraf een
                    afspraak via het contactformulier of e-mail.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
