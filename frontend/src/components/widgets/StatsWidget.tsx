import React from 'react';
import { FiUsers, FiFileText, FiCreditCard, FiTrendingUp } from 'react-icons/fi';

interface StatsWidgetProps {
  stats: {
    clients: number;
    invoices: number;
    payments: number;
    totalRevenue: number;
    totalPaid: number;
    unpaid: number;
  };
}

const StatsWidget: React.FC<StatsWidgetProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between">
          <FiUsers className="text-blue-500 text-2xl" />
          <span className="text-xs text-gray-400">Clients</span>
        </div>
        <p className="text-2xl font-bold mt-2">{stats.clients}</p>
      </div>
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between">
          <FiFileText className="text-green-500 text-2xl" />
          <span className="text-xs text-gray-400">Factures</span>
        </div>
        <p className="text-2xl font-bold mt-2">{stats.invoices}</p>
      </div>
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between">
          <FiCreditCard className="text-yellow-500 text-2xl" />
          <span className="text-xs text-gray-400">Paiements</span>
        </div>
        <p className="text-2xl font-bold mt-2">{stats.payments}</p>
      </div>
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between">
          <FiTrendingUp className="text-purple-500 text-2xl" />
          <span className="text-xs text-gray-400">CA total</span>
        </div>
        <p className="text-xl font-bold mt-2">{stats.totalRevenue.toLocaleString()} F</p>
      </div>
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between">
          <FiCreditCard className="text-indigo-500 text-2xl" />
          <span className="text-xs text-gray-400">Encaissé</span>
        </div>
        <p className="text-xl font-bold mt-2">{stats.totalPaid.toLocaleString()} F</p>
      </div>
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between">
          <FiTrendingUp className="text-red-500 text-2xl" />
          <span className="text-xs text-gray-400">Impayés</span>
        </div>
        <p className="text-xl font-bold mt-2">{stats.unpaid.toLocaleString()} F</p>
      </div>
    </div>
  );
};

export default StatsWidget;