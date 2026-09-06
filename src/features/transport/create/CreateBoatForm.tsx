import { View, Text } from "react-native";

// src/features/transport/create/CreateBoatForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react-native";
import {
  boatFormSchema,
  type BoatFormValues,
} from "../validators/boat.validator";

interface CreateBoatFormProps {
  onSubmit: (data: any) => Promise<void> | void;
  isLoading?: boolean;
}

const BOAT_TYPES: Record<BoatFormValues["boatType"], string> = {
  ferry: "Ferry / Bac",
  water_taxi: "Taxi Fluvial Rapide",
  speedboat: "Bateau Rapide / Vedette",
  pirogue_motorized: "Pirogue Motorisée Sécurisée",
};

export function CreateBoatForm({
  onSubmit,
  isLoading = false,
}: CreateBoatFormProps) {
  const form = useForm<BoatFormValues>({
    resolver: zodResolver(boatFormSchema),
    defaultValues: {
      operatorName: "",
      phone: "",
      boatName: "",
      boatType: "speedboat",
      capacity: 20,
      pricePerSeat: 5000,
      currency: "FCFA",
      lifeJacketsProvided: true,
      originPort: "",
      destinationPort: "",
      departureTime: "",
      description: "",
    },
  });

  // Transformation des données pour le backend Convex
  const handleSubmit = useCallback(
    async (values: BoatFormValues) => {
      // ✅ Construction du payload compatible avec createTransportRoute
      const payload = {
        // Champs communs
        vehicleType: "boat" as const,
        currency: values.currency || "FCFA",
        status: "active",
        // Champs de localisation et horaire
        origin: values.originPort,
        destination: values.destinationPort,
        departureTime: values.departureTime,
        seats: values.capacity,
        pricePerSeat: values.pricePerSeat,
        // Informations sur l'opérateur
        driverName: values.operatorName,
        phone: values.phone,
        vehicleModel: values.boatName,
        // Description enrichie
        description: [
          values.description,
          `🛥️ Type: ${BOAT_TYPES[values.boatType] || values.boatType}`,
          values.lifeJacketsProvided
            ? "🦺 Gilets de sauvetage fournis"
            : "❌ Gilets de sauvetage non fournis",
          `⚓ Port départ: ${values.originPort}`,
          `⚓ Port arrivée: ${values.destinationPort}`,
        ]
          .filter(Boolean)
          .join("\n"),
        // Équipements (amenities)
        amenities: [
          BOAT_TYPES[values.boatType] || values.boatType,
          ...(values.lifeJacketsProvided ? ["Gilets de sauvetage"] : []),
        ],
        // Options de sécurité et accessibilité
        insuranceIncluded: true,
        luggageAllowed: true,
        petsAllowed: false,
        accessibility: false,
      };

      await onSubmit(payload);
    },
    [onSubmit],
  );

  return (
    <Form {...form}>
      <View className="space-y-4">
        <FormField
          control={form.control}
          name="operatorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Nom de la compagnie ou de l'exploitant *</Text></FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Majestic Fleuve, STF"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Téléphone d'embarquement *</Text></FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: +243 890 000 000"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <View className="gap-4">
          <FormField
            control={form.control}
            name="boatName"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Nom du bateau / de l'embarcation *</Text></FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: M/S Kivu Queen, Rapide-1"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="boatType"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Type d'embarcation *</Text></FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                    {Object.entries(BOAT_TYPES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </View>

        <View className="gap-4">
          <FormField
            control={form.control}
            name="originPort"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Port de départ *</Text></FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Beach Ngobila, Kinshasa"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="destinationPort"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Port d'arrivée *</Text></FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Port de Brazzaville"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </View>

        <View className="gap-2">
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Places disponibles *</Text></FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    className="bg-white/5 border-white/10 text-white"
                    {...field}
                    onChange={(text) =>
                      field.onChange(parseInt(text) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pricePerSeat"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Prix de la traversée *</Text></FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    className="bg-white/5 border-white/10 text-white"
                    {...field}
                    onChange={(text) =>
                      field.onChange(parseFloat(text) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Devise</Text></FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Devise" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                    <SelectItem value="FCFA"><Text>FCFA</Text></SelectItem>
                    <SelectItem value="USD"><Text>USD</Text></SelectItem>
                    <SelectItem value="EUR"><Text>EUR</Text></SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </View>

        <FormField
          control={form.control}
          name="departureTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Heure de départ de la navette *</Text></FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: 09:15"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Gilets de sauvetage */}
        <FormField
          control={form.control}
          name="lifeJacketsProvided"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/10 p-3 bg-white/5">
              <View className="space-y-0.5">
                <FormLabel className="text-white/90">
                  <Text>Gilets de sauvetage individuels fournis *</Text></FormLabel>
                <FormDescription className="text-white/40 text-xs">
                  <Text>Obligatoire pour l'ensemble des passagers à bord</Text></FormDescription>
              </View>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-blue-600"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Text>Description / Informations additionnelles (tonnage de bagages autorisés, etc.)</Text></FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ex: Vedette climatisée, limite de bagages à 20kg par personne, cabine VIP disponible..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full h-12 rounded-xl bg-blue-600 text-white font-bold text-base"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <Text>Enregistrement...</Text></>
          ) : (
            "⛴️ Enregistrer le service Fluvial / Lacustre"
          )}
        </Button>
      </View>
    </Form>
  );
}
