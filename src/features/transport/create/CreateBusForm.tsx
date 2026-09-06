import { View, Text } from "react-native";

// src/features/transport/create/CreateBusForm.tsx
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
import { Loader2 } from "lucide-react-native";
import { busFormSchema, type BusFormValues } from "../validators/bus.validator";
import { MAX_SEATS_PER_VEHICLE } from "../constants/transport.constants";

interface CreateBusFormProps {
  onSubmit: (data: any) => Promise<void> | void;
  isLoading?: boolean;
}

export function CreateBusForm({
  onSubmit,
  isLoading = false,
}: CreateBusFormProps) {
  const form = useForm<BusFormValues>({
    resolver: zodResolver(busFormSchema),
    defaultValues: {
      companyName: "",
      routeNumber: "",
      origin: "",
      destination: "",
      departureTime: "",
      arrivalTime: "",
      stops: "",
      totalSeats: 30,
      pricePerSeat: 0,
      currency: "FCFA",
      description: "",
      busModel: "",
    },
  });

  // Transformation des données pour le backend Convex
  const handleSubmit = useCallback(
    async (values: BusFormValues) => {
      // Construction du payload pour createTransportRoute
      const stopsArray = values.stops
        ? values.stops
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const payload = {
        // Champs communs
        vehicleType: "bus" as const,
        currency: values.currency || "FCFA",
        status: "active",
        // Champs de localisation et horaire
        origin: values.origin,
        destination: values.destination,
        departureTime: values.departureTime,
        seats: values.totalSeats,
        pricePerSeat: values.pricePerSeat,
        // Informations sur la compagnie
        driverName: values.companyName,
        vehicleModel: values.busModel || "Bus",
        // Description enrichie
        description: [
          values.description,
          `🚌 Ligne: ${values.routeNumber}`,
          values.arrivalTime ? `⏱️ Arrivée estimée: ${values.arrivalTime}` : "",
          stopsArray.length > 0 ? `🛑 Arrêts: ${stopsArray.join(", ")}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        // Équipements (amenities)
        amenities: [
          "Climatisation",
          "Sièges inclinables",
          ...(stopsArray.length > 0 ? ["Arrêts intermédiaires"] : []),
        ],
        // Options
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
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Nom de la compagnie *</Text></FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: TransCoop, STUC"
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
          name="routeNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Numéro / Nom de la ligne *</Text></FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Ligne 1, Kintambo-Lemba"
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
            name="origin"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Départ *</Text></FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Gare Centrale"
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
            name="destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Arrivée *</Text></FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Aéroport de N'djili"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </View>

        <View className="gap-4">
          <FormField
            control={form.control}
            name="departureTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Heure de départ *</Text></FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 07:00"
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
            name="arrivalTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Heure d'arrivée estimée</Text></FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 09:30"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </View>

        <FormField
          control={form.control}
          name="stops"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Text>Arrêts intermédiaires (séparés par des virgules)</Text></FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Pont Matete, Debonhomme, Limete"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-white/40 text-xs">
                <Text>Ces arrêts seront affichés dans la description du trajet</Text></FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <View className="gap-2">
          <FormField
            control={form.control}
            name="totalSeats"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Places totales *</Text></FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={10}
                    max={MAX_SEATS_PER_VEHICLE}
                    className="bg-white/5 border-white/10 text-white"
                    {...field}
                    onChange={(text) =>
                      field.onChange(
                        Math.min(
                          MAX_SEATS_PER_VEHICLE,
                          Math.max(10, Number(text) || 30),
                        ),
                      )
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
                <FormLabel><Text>Prix du ticket *</Text></FormLabel>
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
          name="busModel"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Modèle de Bus</Text></FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Mercedes Benz, Fuso"
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Text>Informations additionnelles (Confort, bagages, etc.)</Text></FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ex: Bus climatisé, Wi-Fi gratuit, bagages autorisés jusqu'à 20kg..."
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
          className="w-full h-12 rounded-xl bg-violet-600 text-white font-bold text-base"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <Text>Enregistrement...</Text></>
          ) : (
            "🚌 Enregistrer l'itinéraire de Bus"
          )}
        </Button>
      </View>
    </Form>
  );
}
