"use client";
import { useState } from "react";

export default function FormularioEncomienda() {
  const [formData, setFormData] = useState({
    departamento: "",
    descripcion: "",
    destinatario: "",
    empresa: "Chilepost", // Valor por defecto
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Aquí simulamos la acción de guardar y notificar
    console.log("Registrando encomienda:", formData);
    
    alert(`¡Notificación enviada al Depto ${formData.departamento}!`);
    
    // Limpiar formulario
    setFormData({ departamento: "", descripcion: "", destinatario: "", empresa: "Chilepost" });
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">📦 Registro de Encomienda</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Número de Departamento */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Número de Departamento</label>
          <input
            type="text"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            placeholder="Ej: 1204-B"
            value={formData.departamento}
            onChange={(e) => setFormData({...formData, departamento: e.target.value})}
          />
        </div>

        {/* Nombre del Residente */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Destinatario (Residente)</label>
          <input
            type="text"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            placeholder="Nombre del vecino"
            value={formData.destinatario}
            onChange={(e) => setFormData({...formData, destinatario: e.target.value})}
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Descripción del Paquete</label>
          <textarea
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            placeholder="Ej: Caja mediana, sobre de Mercado Libre..."
            value={formData.descripcion}
            onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-semibold"
        >
          Registrar y Notificar
        </button>
      </form>
    </div>
  );
}