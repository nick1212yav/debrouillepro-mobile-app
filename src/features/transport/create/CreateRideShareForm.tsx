import { View, Text } from "react-native";

// src/features/transport/create/CreateRideShareForm.tsx
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
import {
  rideshareFormSchema,
  type RideShareFormValues,
} from "../validators/rideshare.validator";

interface CreateRideShareFormProps {
  onSubmit: (data: any) => Promise<void> | void;
  isLoading?: boolean;
}

export function CreateRideShareForm({
  onSubmit,
  isLoading = false,
}: CreateRideShareFormProps) {
  const form = useForm<RideShareFormValues>({
    resolver: zodResolver(rideshareFormSchema),
    defaultValues: {
      origin: "",
      destination: "",
      departureDate: new Date().toISOString().split("T")[0],
      departureTime: "",
      seats: 4,
      pricePerSeat: 0,
      currency: "FCFA",
      description: "",
    },
  });

  // Transformation des données pour le backend Convex
  const handleSubmit = useCallback(
    async (values: RideShareFormValues) => {
      // Construction du payload pour createTransportRoute
      const payload = {
        // Champs communs
        vehicleType: "rideshare" as const,
        currency: values.currency || "FCFA",
        status: "active",
        // Champs spécifiques au covoiturage
        origin: values.origin,
        destination: values.destination,
        departureTime: values.departureTime,
        seats: values.seats,
        pricePerSeat: values.pricePerSeat,
        // Informations supplémentaires
        description: [values.description, `📅 Date: ${values.departureDate}`]
          .filter(Boolean)
          .join("\n"),
        // Équipements (amenities) – on ajoute des valeurs par défaut
        amenities: ["Climatisation", "Bagages acceptés"],
        // Options
        insuranceIncluded: true,
        luggageAllowed: true,
        petsAllowed: true,
        accessibility: false,
      };

      await onSubmit(payload);
    },
    [onSubmit],
  );

  return (
    <Form {...form}>
      <View className="space-y-4">
        <View className="gap-4">
          <FormField
            control={form.control}
            name="origin"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Lieu de départ *</Text></FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Rond-point Ngaba"
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
                <FormLabel><Text>Lieu d'arrivée *</Text></FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Boulevard du 30 Juin"
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
            name="departureDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Date de départ *</Text></FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    className="bg-white/5 border-white/10 text-white"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="departureTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Heure de départ *</Text></FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 08:30"
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
            name="seats"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Places dispo *</Text></FormLabel>
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
                <FormLabel><Text>Prix p. place *</Text></FormLabel>
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Text>Précisions importantes (Bagages acceptés, climatisation, itinéraire, etc.)</Text></FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ex: Grand coffre disponible, climatisation active, départ à l'heure précise..."
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
          className="w-full h-12 rounded-xl bg-violet-600 text-white font-bold text-base"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <Text>Publication en cours...</Text></>
          ) : (
            "👥 Publier l'offre de covoiturage"
          )}
        </Button>
      </View>
    </Form>
  );
}
