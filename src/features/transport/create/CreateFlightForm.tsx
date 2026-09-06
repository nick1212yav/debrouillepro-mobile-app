import { View, Text } from "react-native";

// src/features/transport/create/CreateFlightForm.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react-native";
import {
  flightFormSchema,
  type FlightFormValues,
} from "../validators/flight.validator";

interface CreateFlightFormProps {
  onSubmit: (data: any) => Promise<void> | void;
  isLoading?: boolean;
}

export function CreateFlightForm({
  onSubmit,
  isLoading = false,
}: CreateFlightFormProps) {
  const form = useForm<FlightFormValues>({
    resolver: zodResolver(flightFormSchema),
    defaultValues: {
      airlineName: "",
      phone: "",
      aircraftModel: "",
      flightNumber: "",
      pricePerSeat: 150000,
      currency: "FCFA",
      seatsAvailable: 9,
      originAirport: "",
      destinationAirport: "",
      departureTime: "",
      maxLuggageWeightKg: 15,
    },
  });

  // Transformation des données pour le backend Convex
  const handleSubmit = useCallback(
    async (values: FlightFormValues) => {
      // ✅ Construction du payload compatible avec createTransportRoute
      const payload = {
        // Champs communs
        vehicleType: "flight" as const,
        currency: values.currency || "FCFA",
        status: "active",
        // Champs de localisation et horaire
        origin: values.originAirport,
        destination: values.destinationAirport,
        departureTime: values.departureTime,
        seats: values.seatsAvailable,
        pricePerSeat: values.pricePerSeat,
        // Informations sur la compagnie
        driverName: values.airlineName,
        phone: values.phone,
        vehicleModel: values.aircraftModel,
        // Description enrichie
        description: [
          `✈️ Compagnie: ${values.airlineName}`,
          `🛩️ Aéronef: ${values.aircraftModel}`,
          `📋 Immatriculation: ${values.flightNumber}`,
          `🛄 Bagages max: ${values.maxLuggageWeightKg} kg`,
          `📍 Départ: ${values.originAirport}`,
          `📍 Arrivée: ${values.destinationAirport}`,
        ]
          .filter(Boolean)
          .join("\n"),
        // Équipements (amenities)
        amenities: [
          "Climatisation en cabine",
          "Sièges inclinables",
          "Bagages en soute inclus",
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
          name="airlineName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Text>Nom de la compagnie de vol / opérateur charter *</Text></FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Congo Airways, KinAvia"
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
              <FormLabel><Text>Téléphone d'exploitation *</Text></FormLabel>
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
            name="aircraftModel"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Modèle d'aéronef *</Text></FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Cessna Grand Caravan"
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
            name="flightNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Immatriculation / N° de Vol *</Text></FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 9Q-ABC"
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
            name="originAirport"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Aéroport / Piste de départ *</Text></FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Aéroport de N'dolo, Kinshasa"
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
            name="destinationAirport"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Aéroport / Piste d'arrivée *</Text></FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Aérodrome de Kikwit"
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
            name="seatsAvailable"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Sièges libres *</Text></FormLabel>
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
                <FormLabel><Text>Prix du siège *</Text></FormLabel>
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

        <View className="gap-4">
          <FormField
            control={form.control}
            name="departureTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Heure de décollage *</Text></FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 06:30"
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
            name="maxLuggageWeightKg"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Poids max bagages (kg) *</Text></FormLabel>
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
        </View>

        <Button
          type="submit"
          className="w-full h-12 rounded-xl bg-violet-600 text-white font-bold text-base"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <Text>Enregistrement...</Text></>
          ) : (
            "✈️ Enregistrer la liaison aérienne"
          )}
        </Button>
      </View>
    </Form>
  );
}
