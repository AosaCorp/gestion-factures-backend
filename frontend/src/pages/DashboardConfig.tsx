import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiSave, FiRefreshCw, FiGrid, FiTrash2, FiPlus, FiMove } from 'react-icons/fi';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Widget {
  id: string;
  title: string;
  type: string;
  position: number;
  enabled: boolean;
  size: string;
}

interface AvailableWidget {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultSize: string;
}

const SortableWidgetItem: React.FC<{
  widget: Widget;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onSizeChange: (id: string, size: string) => void;
}> = ({ widget, onToggle, onRemove, onSizeChange }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div ref={setNodeRef} style={style} className={`bg-white rounded-lg shadow p-4 border border-gray-200 ${isDragging ? 'shadow-lg' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div {...attributes} {...listeners} className="cursor-move text-gray-400 hover:text-gray-600">
            <FiMove />
          </div>
          <h3 className="font-medium">{widget.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={widget.size}
            onChange={(e) => onSizeChange(widget.id, e.target.value)}
            className="text-xs border rounded px-2 py-1"
          >
            <option value="full">Pleine largeur</option>
            <option value="half">Demi largeur</option>
          </select>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={widget.enabled}
              onChange={() => onToggle(widget.id)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
          <button onClick={() => onRemove(widget.id)} className="text-red-500 hover:text-red-700">
            <FiTrash2 />
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500">Widget de type: {widget.type}</p>
    </div>
  );
};

const DashboardConfig: React.FC = () => {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [availableWidgets, setAvailableWidgets] = useState<AvailableWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchConfig();
    fetchAvailableWidgets();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/config');
      if (response.data && response.data.widgets) {
        setWidgets(response.data.widgets);
      } else {
        // Configuration par défaut
        setWidgets([
          { id: 'stats', title: 'Statistiques', type: 'stats', position: 0, enabled: true, size: 'full' },
          { id: 'chart', title: 'Évolution du CA', type: 'chart', position: 1, enabled: true, size: 'half' },
          { id: 'payments', title: 'Répartition des paiements', type: 'payments', position: 2, enabled: true, size: 'half' },
          { id: 'top-products', title: 'Top produits', type: 'topProducts', position: 3, enabled: true, size: 'half' },
          { id: 'recent-invoices', title: 'Dernières factures', type: 'recentInvoices', position: 4, enabled: true, size: 'full' },
          { id: 'alerts', title: 'Alertes', type: 'alerts', position: 5, enabled: true, size: 'half' }
        ]);
      }
    } catch (error: any) {
      console.error('Erreur chargement config', error);
      if (error.response?.status === 404) {
        // Configuration par défaut
        setWidgets([
          { id: 'stats', title: 'Statistiques', type: 'stats', position: 0, enabled: true, size: 'full' },
          { id: 'chart', title: 'Évolution du CA', type: 'chart', position: 1, enabled: true, size: 'half' },
          { id: 'payments', title: 'Répartition des paiements', type: 'payments', position: 2, enabled: true, size: 'half' },
          { id: 'top-products', title: 'Top produits', type: 'topProducts', position: 3, enabled: true, size: 'half' },
          { id: 'recent-invoices', title: 'Dernières factures', type: 'recentInvoices', position: 4, enabled: true, size: 'full' },
          { id: 'alerts', title: 'Alertes', type: 'alerts', position: 5, enabled: true, size: 'half' }
        ]);
      } else {
        toast.error('Erreur lors du chargement de la configuration');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableWidgets = async () => {
    try {
      const response = await api.get('/dashboard/widgets');
      setAvailableWidgets(response.data);
    } catch (error) {
      console.error('Erreur chargement widgets disponibles', error);
      // Widgets par défaut
      setAvailableWidgets([
        { id: 'stats', name: 'Statistiques', description: 'Affiche les KPI principaux', icon: '📊', defaultSize: 'full' },
        { id: 'chart', name: 'Graphique d\'évolution', description: 'Affiche l\'évolution du CA', icon: '📈', defaultSize: 'half' },
        { id: 'payments', name: 'Répartition des paiements', description: 'Graphique des méthodes de paiement', icon: '💳', defaultSize: 'half' },
        { id: 'top-products', name: 'Top produits', description: 'Produits les plus vendus', icon: '🏆', defaultSize: 'half' },
        { id: 'recent-invoices', name: 'Dernières factures', description: 'Liste des dernières factures', icon: '📄', defaultSize: 'full' },
        { id: 'alerts', name: 'Alertes', description: 'Impayés et factures en attente', icon: '⚠️', defaultSize: 'half' }
      ]);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && over) {
      const oldIndex = widgets.findIndex(w => w.id === active.id);
      const newIndex = widgets.findIndex(w => w.id === over.id);
      const newWidgets = arrayMove(widgets, oldIndex, newIndex);
      newWidgets.forEach((w, idx) => { w.position = idx; });
      setWidgets(newWidgets);
    }
  };

  const handleToggleWidget = (id: string) => {
    setWidgets(widgets.map(w =>
      w.id === id ? { ...w, enabled: !w.enabled } : w
    ));
  };

  const handleRemoveWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const handleSizeChange = (id: string, size: string) => {
    setWidgets(widgets.map(w =>
      w.id === id ? { ...w, size } : w
    ));
  };

  const handleAddWidget = (availableWidget: AvailableWidget) => {
    // Vérifier si le widget n'est pas déjà ajouté
    if (widgets.some(w => w.type === availableWidget.id)) {
      toast.error(`Le widget "${availableWidget.name}" est déjà présent`);
      return;
    }
    
    const newWidget: Widget = {
      id: `${availableWidget.id}_${Date.now()}`,
      title: availableWidget.name,
      type: availableWidget.id,
      position: widgets.length,
      enabled: true,
      size: availableWidget.defaultSize
    };
    setWidgets([...widgets, newWidget]);
    toast.success(`Widget "${availableWidget.name}" ajouté`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/dashboard/config', { widgets });
      toast.success('Configuration sauvegardée');
    } catch (error) {
      console.error('Erreur sauvegarde', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Réinitialiser la configuration par défaut ?')) {
      try {
        await api.post('/dashboard/config/reset');
        toast.success('Configuration réinitialisée');
        fetchConfig();
      } catch (error) {
        console.error('Erreur réinitialisation', error);
        toast.error('Erreur lors de la réinitialisation');
      }
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Accès non autorisé. Seuls les administrateurs peuvent configurer le tableau de bord.
        </div>
      </div>
    );
  }

  const enabledWidgets = widgets.filter(w => w.enabled);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <FiGrid className="text-blue-600" /> Personnalisation du tableau de bord
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 flex items-center gap-2"
          >
            <FiRefreshCw /> Réinitialiser
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <FiSave /> {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-blue-800 mb-2">📊 Personnalisez votre tableau de bord</h2>
        <p className="text-sm text-blue-700">
          Glissez-déposez les widgets pour réorganiser l'ordre. Vous pouvez activer/désactiver chaque widget
          et choisir entre pleine largeur ou demi largeur.
        </p>
      </div>

      {loading ? (
        <p className="text-center py-10">Chargement...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des widgets actifs */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-3">Widgets actifs ({widgets.length})</h2>
            {widgets.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                Aucun widget actif. Ajoutez des widgets depuis la colonne de droite.
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={widgets.map(w => w.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {widgets.map((widget) => (
                      <SortableWidgetItem
                        key={widget.id}
                        widget={widget}
                        onToggle={handleToggleWidget}
                        onRemove={handleRemoveWidget}
                        onSizeChange={handleSizeChange}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Widgets disponibles */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Widgets disponibles</h2>
            <div className="space-y-3">
              {availableWidgets.map((widget) => {
                const alreadyAdded = widgets.some(w => w.type === widget.id);
                return (
                  <div key={widget.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-2xl mb-1">{widget.icon}</div>
                        <h3 className="font-medium">{widget.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{widget.description}</p>
                      </div>
                      <button
                        onClick={() => handleAddWidget(widget)}
                        disabled={alreadyAdded}
                        className={`p-2 rounded ${alreadyAdded ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                        title={alreadyAdded ? 'Déjà ajouté' : 'Ajouter'}
                      >
                        <FiPlus />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Aperçu du layout */}
      {!loading && enabledWidgets.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Aperçu du tableau de bord</h2>
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enabledWidgets.slice(0, 4).map((widget) => (
                <div key={widget.id} className={`bg-white rounded-lg shadow p-4 ${widget.size === 'full' ? 'md:col-span-2' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{widget.title}</h3>
                    <span className="text-xs text-gray-400">{widget.size === 'full' ? 'Pleine largeur' : 'Demi largeur'}</span>
                  </div>
                  <div className="h-24 bg-gray-50 rounded flex items-center justify-center text-gray-400 text-sm">
                    Aperçu du widget {widget.type}
                  </div>
                </div>
              ))}
            </div>
            {enabledWidgets.length > 4 && (
              <p className="text-center text-sm text-gray-500 mt-4">
                + {enabledWidgets.length - 4} autres widgets
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardConfig;