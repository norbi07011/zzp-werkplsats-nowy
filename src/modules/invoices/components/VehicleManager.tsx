import React, { useState } from "react";
import type { Vehicle, VehicleType, FuelType } from "../types";
import { getVehicleRate, formatDutchPlate, DUTCH_RATES_2025 } from "../types";
import { Check, Edit3, Plus, Star, Trash2, Settings, XCircle } from "lucide-react";

// Car and Bike don't export directly, using alternatives
const Car = Settings;
const Bike = XCircle;

// Motorcycle doesn't exist in lucide-react, using Bike as fallback
const Motorcycle = Bike;

const VEHICLE_ICONS: Record<VehicleType, React.ReactNode> = {
  car: <Car size={24} />,
  motorcycle: <Motorcycle size={24} />,
  bike: <Bike size={24} />,
  scooter: <Motorcycle size={20} />,
  electric_bike: <Bike size={24} className="text-green-600" />,
};

const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  car: "Auto",
  motorcycle: "Motor",
  bike: "Fiets",
  scooter: "Scooter",
  electric_bike: "E-bike",
};

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onEdit,
  onDelete,
  onSetDefault,
}) => {
  const rate = getVehicleRate(vehicle);

  return (
    <div
      className={`relative p-5 rounded-2xl border-2 transition-all ${
        vehicle.is_default
          ? "bg-ocean-50 border-ocean-300 shadow-lg"
          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
      }`}
    >
      {vehicle.is_default && (
        <div className="absolute top-3 right-3 flex items-center gap-1 text-xs font-bold text-ocean-700 bg-ocean-100 px-2 py-1 rounded-full">
          <Star size={12} className="fill-ocean-700" />
          Domyślny
        </div>
      )}

      <div className="flex items-start gap-4">
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center ${
            vehicle.is_default
              ? "bg-ocean-500 text-white"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {VEHICLE_ICONS[vehicle.vehicle_type]}
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-lg text-slate-800 mb-1">
            {vehicle.name}
          </h3>
          <p className="text-sm text-slate-500 mb-2">
            {VEHICLE_TYPE_LABELS[vehicle.vehicle_type]}
            {vehicle.brand && ` • ${vehicle.brand}`}
            {vehicle.model && ` ${vehicle.model}`}
          </p>

          {vehicle.license_plate && (
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-blue-700 w-6 h-8 rounded-sm flex flex-col items-center justify-center text-white border border-blue-800">
                <span className="text-[6px]">EU</span>
                <span className="text-[8px] font-bold">NL</span>
              </div>
              <span className="bg-[#ffba00] px-3 py-1 rounded-md font-mono font-bold text-sm tracking-wider">
                {formatDutchPlate(vehicle.license_plate)}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-400 text-xs">Kilometerstand:</span>
              <p className="font-mono font-bold text-slate-700">
                {vehicle.current_odometer.toLocaleString()} km
              </p>
            </div>
            <div>
              <span className="text-slate-400 text-xs">Stawka:</span>
              <p className="font-bold text-green-600">€{rate.toFixed(2)}/km</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            {!vehicle.is_default && (
              <button
                onClick={() => onSetDefault(vehicle.id)}
                className="text-xs px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
              >
                Ustaw jako domyślny
              </button>
            )}
            <button
              onClick={() => onEdit(vehicle)}
              className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition-colors flex items-center gap-1"
            >
              <Edit3 size={12} />
              Edytuj
            </button>
            <button
              onClick={() => onDelete(vehicle.id)}
              className="text-xs px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors flex items-center gap-1"
            >
              <Trash2 size={12} />
              Usuń
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface VehicleFormProps {
  vehicle?: Vehicle;
  userId: string;
  onSave: (vehicle: Partial<Vehicle>) => void;
  onCancel: () => void;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({
  vehicle,
  userId,
  onSave,
  onCancel,
}) => {
  const [form, setForm] = useState<Partial<Vehicle>>(
    vehicle || {
      user_id: userId,
      name: "",
      vehicle_type: "car",
      fuel_type: "petrol",
      license_plate: "",
      registration_year: new Date().getFullYear(),
      registration_country: "NL",
      current_odometer: 0,
      is_company_vehicle: false,
      is_active: true,
      is_default: false,
    }
  );

  const getRateKey = (): keyof typeof DUTCH_RATES_2025 => {
    if (form.vehicle_type === "car") {
      return form.is_company_vehicle ? "car_company" : "car_private";
    }
    if (form.vehicle_type === "motorcycle") return "motorcycle";
    if (form.vehicle_type === "scooter") return "scooter";
    return "bike"; // bike or electric_bike
  };

  const rate = form.custom_rate_per_km || DUTCH_RATES_2025[getRateKey()];

  return (
    <div className="space-y-6 p-6 bg-slate-50 rounded-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            Nazwa pojazdu *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="np. Mercedes Sprinter, Honda CBR 600, Gazelle E-bike"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ocean-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            Marka
          </label>
          <input
            type="text"
            value={form.brand || ""}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            placeholder="np. Mercedes, Honda, Gazelle"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ocean-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            Model
          </label>
          <input
            type="text"
            value={form.model || ""}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            placeholder="np. Sprinter, CBR 600, Ultimate C8"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ocean-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            Typ pojazdu *
          </label>
          <select
            value={form.vehicle_type}
            onChange={(e) =>
              setForm({ ...form, vehicle_type: e.target.value as VehicleType })
            }
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ocean-500 outline-none"
          >
            <option value="car">Auto</option>
            <option value="motorcycle">Motor</option>
            <option value="bike">Fiets</option>
            <option value="electric_bike">E-bike</option>
            <option value="scooter">Scooter</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            Paliwo
          </label>
          <select
            value={form.fuel_type}
            onChange={(e) =>
              setForm({ ...form, fuel_type: e.target.value as FuelType })
            }
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ocean-500 outline-none"
          >
            <option value="petrol">Benzyna</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Elektryczny</option>
            <option value="hybrid">Hybrid</option>
            <option value="lpg">LPG</option>
            <option value="none">Brak (rower)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            Numer rejestracyjny
          </label>
          <div className="flex">
            <div className="bg-blue-700 w-8 rounded-l-xl flex flex-col items-center justify-center text-white border border-blue-800">
              <span className="text-[8px]">EU</span>
              <span className="text-[10px] font-bold">NL</span>
            </div>
            <input
              type="text"
              value={form.license_plate}
              onChange={(e) =>
                setForm({
                  ...form,
                  license_plate: e.target.value.toUpperCase(),
                })
              }
              placeholder="XX-123-YY"
              maxLength={8}
              className="w-full bg-[#ffba00] border-y border-r border-yellow-500/50 rounded-r-xl px-3 py-3 font-mono font-bold text-center uppercase tracking-wider outline-none focus:ring-2 focus:ring-ocean-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            Rok produkcji
          </label>
          <input
            type="number"
            value={form.registration_year}
            onChange={(e) =>
              setForm({ ...form, registration_year: parseInt(e.target.value) })
            }
            min={1900}
            max={new Date().getFullYear() + 1}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ocean-500 outline-none"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            Aktualny stan licznika (km)
          </label>
          <input
            type="number"
            value={form.current_odometer}
            onChange={(e) =>
              setForm({ ...form, current_odometer: parseInt(e.target.value) })
            }
            min={0}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ocean-500 outline-none font-mono text-lg"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200">
        <input
          type="checkbox"
          id="is_company"
          checked={form.is_company_vehicle}
          onChange={(e) =>
            setForm({ ...form, is_company_vehicle: e.target.checked })
          }
          className="w-5 h-5 rounded"
        />
        <label htmlFor="is_company" className="flex-1 cursor-pointer">
          <span className="font-bold text-slate-800">Pojazd służbowy</span>
          <p className="text-xs text-slate-500 mt-1">
            Zaznacz jeśli pojazd jest własnością firmy
          </p>
        </label>
      </div>

      <div className="bg-ocean-50 border-2 border-ocean-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-ocean-900">
              Automatyczna stawka:
            </p>
            <p className="text-xs text-ocean-600 mt-1">
              Według Belastingdienst 2025
            </p>
          </div>
          <p className="text-3xl font-black text-ocean-600">
            €{rate.toFixed(2)}
            <span className="text-sm font-normal">/km</span>
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-all"
        >
          Anuluj
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={!form.name || !form.vehicle_type}
          className="flex-1 py-3 bg-ocean-600 text-white font-bold rounded-xl hover:bg-ocean-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          <Check size={20} />
          {vehicle ? "Zapisz zmiany" : "Dodaj pojazd"}
        </button>
      </div>
    </div>
  );
};

interface VehicleManagerProps {
  vehicles: Vehicle[];
  onAdd: (vehicle: Partial<Vehicle>) => void;
  onEdit: (id: string, vehicle: Partial<Vehicle>) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  userId: string;
}

export const VehicleManager: React.FC<VehicleManagerProps> = ({
  vehicles,
  onAdd,
  onEdit,
  onDelete,
  onSetDefault,
  userId,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | undefined>();

  const handleSave = (vehicle: Partial<Vehicle>) => {
    if (editingVehicle) {
      onEdit(editingVehicle.id, vehicle);
    } else {
      onAdd(vehicle);
    }
    setShowForm(false);
    setEditingVehicle(undefined);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowForm(true);
  };

  if (showForm) {
    return (
      <VehicleForm
        vehicle={editingVehicle}
        userId={userId}
        onSave={handleSave}
        onCancel={() => {
          setShowForm(false);
          setEditingVehicle(undefined);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowForm(true)}
        className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl hover:border-ocean-400 hover:bg-ocean-50 transition-all flex items-center justify-center gap-2 text-slate-600 hover:text-ocean-600 font-bold"
      >
        <Plus size={24} />
        Dodaj nowy pojazd
      </button>

      {vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          onEdit={handleEdit}
          onDelete={onDelete}
          onSetDefault={onSetDefault}
        />
      ))}

      {vehicles.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Car size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-medium">Brak pojazdów</p>
          <p className="text-sm mt-1">Dodaj pierwszy pojazd aby rozpocząć</p>
        </div>
      )}
    </div>
  );
};
