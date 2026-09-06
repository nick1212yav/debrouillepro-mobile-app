import { View, Text } from "react-native";

// src/features/transport/create/CreateTrainForm.tsx
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
  trainFormSchema,
  type TrainFormValues,
} from "../validators/train.validator";

interface CreateTrainFormProps {
  onSubmit: (data: any) => Promise<void> | void;
  isLoading?: boolean;
}

export function CreateTrainForm({
  onSubmit,
  isLoading = false,
}: CreateTrainFormProps) {
  const form = useForm<TrainFormValues>({
    resolver: zodResolver(trainFormSchema),
    defaultValues: {
      operatorName: "",
      phone: "",
      trainNumber: "",
      originStation: "",
      destinationStation: "",
      departureTime: "",
      priceFirstClass: 15000,
      priceSecondClass: 7000,
      currency: "FCFA",
      totalSeats: 200,
      description: "",
    },
  });

  // Transformation des données pour le backend Convex
  const handleSubmit = useCallback(
    async (values: TrainFormValues) => {
      // ✅ Construction du payload compatible avec createTransportRoute
      const payload = {
        // Champs communs
        vehicleType: "train" as const,
        currency: values.currency || "FCFA",
        status: "active",
        // Champs de localisation et horaire
        origin: values.originStation,
        destination: values.destinationStation,
        departureTime: values.departureTime,
        seats: values.totalSeats,
        pricePerSeat: values.priceFirstClass, // On utilise la 1ère classe comme référence
        // Informations sur l'opérateur
        driverName: values.operatorName,
        phone: values.phone,
        vehicleModel: values.trainNumber,
        // Description enrichie
        description: [
          values.description,
          `🚆 Train: ${values.trainNumber}`,
          `🎫 1ère classe: ${values.priceFirstClass?.toLocaleString()} ${values.currency}`,
          `🎫 2ème classe: ${values.priceSecondClass?.toLocaleString()} ${values.currency}`,
          `📍 Départ: ${values.originStation}`,
          `📍 Arrivée: ${values.destinationStation}`,
        ]
          .filter(Boolean)
          .join("\n"),
        // Équipements (amenities)
        amenities: [
          "Climatisation",
          "Toilettes à bord",
          "Bagages autorisés",
          values.priceFirstClass > values.priceSecondClass
            ? "Sièges inclinables 1ère classe"
            : "",
        ].filter(Boolean),
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
          name="operatorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Nom de l'opérateur / régie ferroviaire *</Text></FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: SCTP, SETRAG"
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
            name="trainNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Numéro du train *</Text></FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: TR-402 Express"
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
                <FormLabel><Text>Téléphone d'information *</Text></FormLabel>
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
        </View>

        <View className="gap-4">
          <FormField
            control={form.control}
            name="originStation"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Gare de départ *</Text></FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Gare Centrale, Kinshasa"
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
            name="destinationStation"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Gare d'arrivée *</Text></FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Gare de Matadi"
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
            name="priceFirstClass"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Prix 1ère classe *</Text></FormLabel>
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
            name="priceSecondClass"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Prix 2ème classe *</Text></FormLabel>
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
                <FormLabel><Text>Heure de départ *</Text></FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 06:45"
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
            name="totalSeats"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Capacité totale (sièges) *</Text></FormLabel>
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
        </View>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Text>Informations complémentaires (Restauration à bord, bagages, etc.)</Text></FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ex: Voiture restaurant active, limite de bagages à 30kg par passager, climatisation en 1ère classe..."
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
            "🚆 Enregistrer la ligne de Train"
          )}
        </Button>
      </View>
    </Form>
  );
}
