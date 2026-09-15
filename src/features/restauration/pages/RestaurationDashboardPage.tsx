import { View, Text, Pressable } from "react-native";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  LayoutDashboard,
  ShoppingBag,
  Utensils,
  Layers,
  Users,
  BarChart2,
  RefreshCw,
} from "lucide-react-native";

// Imports d'interfaces typées conformes à verbatimModuleSyntax
import type { OrderDetail } from "../types/order.types";
import type { BCGItemResult } from "../types/analytics.types";

// Imports de l'architecture d'ingénierie du module
import { useOrder } from "../hooks/useOrder";
import { useMenu } from "../hooks/useMenu";
import { useAnalytics } from "../hooks/useAnalytics";
import { OrderService } from "../services/OrderService";
import { RestaurantService } from "../services/RestaurantService";
import { OrderStatus } from "../types/enums";

// Imports des composants réutilisables du tableau de bord
import {
  DashboardOverview,
  OrderManagement,
  MenuManagement,
  RevenueChart,
  EmployeeManagement,
  InventoryManagement,
  AnalyticsDashboard,
  AIRecommendations,
} from "../dashboard";

interface RestaurationDashboardPageProps {
  onBack: () => void;
}

export default function RestaurationDashboardPage({
  onBack,
}: RestaurationDashboardPageProps) {
  const [activeSection, setActiveSection] = useState<
    "overview" | "orders" | "menu" | "inventory" | "employees" | "analytics"
  >("overview");

  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const { updateOrderStatus } = useOrder();
  const { computeBCGMatrix } = useAnalytics();

  const [employees, setEmployees] = useState([
    { id: "1", name: "Amani Kouamé", role: "Cuisinier", isActive: true },
    { id: "2", name: "Gnakpa Landry", role: "Serveur", isActive: true },
    { id: "3", name: "Bamba Mariam", role: "Serveur", isActive: false },
  ]);

  const [inventory, setInventory] = useState([
    {
      name: "Poisson Capitaine Frais",
      stockLevel: 24,
      unit: "kg",
      minimumLimit: 10,
      perishableDays: 2,
    },
    {
      name: "Banane Plantain Mûre",
      stockLevel: 85,
      unit: "régimes",
      minimumLimit: 15,
      perishableDays: 5,
    },
    {
      name: "Noix de Palme (Graine)",
      stockLevel: 45,
      unit: "kg",
      minimumLimit: 20,
      perishableDays: 14,
    },
    {
      name: "Sac de Riz Parfumé (25kg)",
      stockLevel: 8,
      unit: "sacs",
      minimumLimit: 3,
      perishableDays: 180,
    },
  ]);

  const [menuCategories, setMenuCategories] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      const ordersList = [
        {
          id: "ORD-98471",
          restaurantId: 1,
          restaurantName: "Chez Mama Africa",
          userId: "CLIENT_ID_1",
          items: [
            {
              name: "Attiéké poisson braisé royal",
              quantity: 2,
              unitPrice: 5500,
            },
          ],
          subtotal: 11000,
          deliveryFee: 1500,
          tax: 550,
          total: 13050,
          deliveryAddress: "Cocody Riviera 3, Villa 24",
          paymentMethod: "wave",
          status: OrderStatus.RECEIVED,
          createdAt: new Date().toISOString(),
        },
        {
          id: "ORD-98472",
          restaurantId: 1,
          restaurantName: "Chez Mama Africa",
          userId: "CLIENT_ID_2",
          items: [
            { name: "Riz sauce graine", quantity: 1, unitPrice: 4500 },
            { name: "Alloco Classique", quantity: 1, unitPrice: 1500 },
          ],
          subtotal: 6000,
          deliveryFee: 1500,
          tax: 300,
          total: 7800,
          deliveryAddress: "Deux Plateaux, Bd des Martyrs",
          paymentMethod: "orange_money",
          status: OrderStatus.PREPARING,
          createdAt: new Date().toISOString(),
        },
      ];
      setOrders(ordersList);

      const restaurant = await RestaurantService.getById(1);
      if (restaurant) {
        setMenuCategories(restaurant.menu);
      }
    } catch {
      toast.error("Échec de synchronisation des données d'administration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statsMetrics = useMemo(() => {
    const activeOrders = orders.filter(
      (o) =>
        o.status !== OrderStatus.DELIVERED &&
        o.status !== OrderStatus.CANCELLED,
    );
    const completedOrders = orders.filter(
      (o) => o.status === OrderStatus.DELIVERED,
    );
    const revenueSum =
      completedOrders.reduce((sum, o) => sum + o.total, 0) + 185000;

    return {
      revenue: revenueSum,
      activeOrdersCount: activeOrders.length,
      pendingBookingsCount: 3,
      rating: 4.9,
    };
  }, [orders]);

  // Transtypage explicite (as BCGItemResult[]) pour résoudre TS2322
  const bcgMatrixResult = useMemo<BCGItemResult[]>(() => {
    const rawSalesStats = [
      {
        name: "Attiéké poisson braisé royal",
        category: "Plats Signatures",
        unitsSold: 480,
        costToProduce: 2200,
        unitSalePrice: 5500,
      },
      {
        name: "Riz sauce graine",
        category: "Plats Signatures",
        unitsSold: 210,
        costToProduce: 1800,
        unitSalePrice: 4500,
      },
      {
        name: "Pastels au poisson",
        category: "Entrées",
        unitsSold: 95,
        costToProduce: 600,
        unitSalePrice: 2000,
      },
      {
        name: "Tiramisu au Kinkeliba",
        category: "Desserts",
        unitsSold: 30,
        costToProduce: 1100,
        unitSalePrice: 3000,
      },
    ];
    return computeBCGMatrix(rawSalesStats) as BCGItemResult[];
  }, [computeBCGMatrix]);

  const aiOpportunities = [
    {
      id: "1",
      category: "pricing" as const,
      impact: "+22 000 FCFA / jour",
      message:
        "Forte demande sur Cocody Riviera. Ajustez le tarif de l'Attiéké Poisson Braisé Royal de +10% entre 12h00 et 13h30.",
    },
    {
      id: "2",
      category: "sourcing" as const,
      impact: "-15% sur les coûts d'achat",
      message:
        "Le cours d'importation des frites de pomme de terre augmente. Mettez en avant l'Alloco Classique à base de bananes plantains locales de saison.",
    },
  ];

  const handleOrderStatusUpdate = async (
    orderId: string,
    status: OrderStatus,
  ) => {
    const success = await updateOrderStatus(orderId, status);
    if (success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
      toast.success(
        `Statut de la commande mis à jour : ${status.toUpperCase().replace("_", " ")}`,
      );
    } else {
      toast.error("Erreur technique lors de l'ajustement du statut.");
    }
  };

  const handleToggleItemAvailability = (
    categoryName: string,
    itemName: string,
    isAvailable: boolean,
  ) => {
    setMenuCategories((prev) =>
      prev.map((cat) => {
        if (cat.category === categoryName) {
          return {
            ...cat,
            items: cat.items.map((item: any) =>
              item.name === itemName
                ? { ...item, tag: isAvailable ? "" : "Epuisé" }
                : item,
            ),
          };
        }
        return cat;
      }),
    );
    toast.success(`Statut de disponibilité mis à jour pour '${itemName}'`);
  };

  const handleUpdateItemPrice = (
    categoryName: string,
    itemName: string,
    newPrice: number,
  ) => {
    setMenuCategories((prev) =>
      prev.map((cat) => {
        if (cat.category === categoryName) {
          return {
            ...cat,
            items: cat.items.map((item: any) =>
              item.name === itemName ? { ...item, price: newPrice } : item,
            ),
          };
        }
        return cat;
      }),
    );
    toast.success(
      `Nouveau prix de ${newPrice.toLocaleString()} FCFA configuré pour '${itemName}'`,
    );
  };

  const handleUpdateStock = (name: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.name === name
          ? { ...item, stockLevel: Math.max(0, item.stockLevel + delta) }
          : item,
      ),
    );
  };

  const handleToggleEmployeeStatus = (id: string) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === id ? { ...emp, isActive: !emp.isActive } : emp,
      ),
    );
  };

  const handleAddEmployee = (name: string, role: string) => {
    const newEmp = {
      id: Date.now().toString(),
      name,
      role,
      isActive: true,
    };
    setEmployees((prev) => [...prev, newEmp]);
    toast.success(`Fiche de poste créée pour ${name}`);
  };

  const handleRemoveEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
    toast.success("Collaborateur retiré de l'effectif actif.");
  };

  if (loading) {
    return (
      <View className="h-full flex items-center justify-center text-white/50 text-xs gap-2"><RefreshCw size={14} className="animate-spin" /><Text>Synchronisation de la console restaurateur...</Text></View>
    );
  }

  return (
    <View className="h-full w-full flex flex-col relative text-white bg-[#020617]"><View className="flex-shrink-0 px-4 pt-12 pb-3 bg-slate-950/60 border-b border-white/[0.04] backdrop-blur-md flex items-center gap-3"><Pressable onPress={activeSection !== "overview"
              ? () => setActiveSection("overview")
              : onBack} className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-all" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><ArrowLeft size={18} /></Pressable><View className="flex-1 text-left"><Text className="block text-[8px] text-orange-400 uppercase font-black">Administration Établissement
          </Text><Text className="text-sm font-black text-white/95 leading-none mt-1">Console Professionnelle
          </Text></View></View><View className="flex-shrink-0 px-4 py-3 bg-[#0a0f29]/30 border-b border-white/[0.04] flex gap-2 overflow-x-auto no-scrollbar">{[
          { id: "overview" as const, label: "Synthèse", icon: LayoutDashboard },
          {
            id: "orders" as const,
            label: "Cuisine & Commandes",
            icon: ShoppingBag,
          },
          { id: "menu" as const, label: "Carte & Tarifs", icon: Utensils },
          { id: "inventory" as const, label: "Stocks", icon: Layers },
          { id: "employees" as const, label: "Personnel", icon: Users },
          { id: "analytics" as const, label: "Rapports & IA", icon: BarChart2 },
        ].map((section) => {
          const isSelected = activeSection === section.id;
          const Icon = section.icon;
          return (
            <Pressable key={section.id} onPress={() => setActiveSection(section.id)} className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all" style={{ backgroundColor: isSelected
                              ? "rgba(249,115,22,0.2)"
                              : "rgba(255,255,255,0.02)", borderColor: isSelected
                              ? "rgba(249,115,22,0.3)"
                              : "transparent" }}><Icon size={12} />{section.label}</Pressable>
          );
        })}</View><View className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar"><View>{activeSection === "overview" && (
            <View key="sec_overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <DashboardOverview
                metrics={statsMetrics}
                onNavigateToSection={(target) =>
                  setActiveSection(target as any)
                }
              />

              <RevenueChart
                monthlyRevenues={[
                  { month: "Mai", amount: 1500000 },
                  { month: "Juin", amount: 1850000 },
                  { month: "Juillet", amount: 2400000 },
                ]}
              />

              <AIRecommendations
                recommendations={aiOpportunities}
                onApplyRecommendation={(id) => {
                  toast.success(
                    `Recommandation d'optimisation N°${id} appliquée à votre carte !`,
                  );
                }}
              />
            </View>
          )}{activeSection === "orders" && (
            <View key="sec_orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <OrderManagement
                orders={orders}
                onUpdateOrderStatus={handleOrderStatusUpdate}
              />
            </View>
          )}{activeSection === "menu" && menuCategories.length > 0 && (
            <View key="sec_menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MenuManagement
                menu={menuCategories}
                onToggleItemAvailability={handleToggleItemAvailability}
                onUpdateItemPrice={handleUpdateItemPrice}
              />
            </View>
          )}{activeSection === "inventory" && (
            <View key="sec_inventory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <InventoryManagement
                items={inventory}
                onUpdateStock={handleUpdateStock}
              />
            </View>
          )}{activeSection === "employees" && (
            <View key="sec_employees" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmployeeManagement
                employees={employees}
                onToggleStatus={handleToggleEmployeeStatus}
                onAddEmployee={handleAddEmployee}
                onRemoveEmployee={handleRemoveEmployee}
              />
            </View>
          )}{activeSection === "analytics" && (
            <View key="sec_analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AnalyticsDashboard
                bcgMatrix={bcgMatrixResult}
                conversionRate={18.4}
                averageBasket={6800}
              />
            </View>
          )}</View></View></View>
  );
}
