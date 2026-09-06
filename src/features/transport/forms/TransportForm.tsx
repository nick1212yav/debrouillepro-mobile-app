import { View, Text } from "react-native";

// src/features/transport/forms/TransportForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { Loader2, Plus, Minus } from "lucide-react-native";
import {
  transportRouteSchema,
  type TransportRouteFormValues,
} from "../validators/transport.validator";

interface TransportFormProps {
  defaultValues?: Partial<TransportRouteFormValues>;
  onSubmit: (data: TransportRouteFormValues) => Promise<void> | void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function TransportForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = "Publier le trajet",
}: TransportFormProps) {
  const form = useForm<TransportRouteFormValues>({
    resolver: zodResolver(transportRouteSchema),
    defaultValues: {
      origin: "",
      destination: "",
      departureTime: "",
      vehicleType: "voiture",
      seats: 4,
      pricePerSeat: 0,
      currency: "FCFA",
      vehicleModel: "",
      vehiclePlate: "",
      description: "",
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <View className="space-y-4">
        {/* Départ et Arrivée */}
        <View className="gap-4">
          <FormField
            control={form.control}
            name="origin"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Départ *</Text></FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Gombe, Kinshasa" {...field} />
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
                  <Input placeholder="Ex: Lemba, Kinshasa" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </View>

        {/* Heure et Véhicule */}
        <View className="gap-4">
          <FormField
            control={form.control}
            name="departureTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Heure de départ *</Text></FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 14:30" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vehicleType"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Type de véhicule *</Text></FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="voiture">
                      <Text>Voiture (Covoiturage)</Text></SelectItem>
                    <SelectItem value="taxi"><Text>Taxi</Text></SelectItem>
                    <SelectItem value="moto"><Text>Moto-Taxi</Text></SelectItem>
                    <SelectItem value="minibus"><Text>Minibus</Text></SelectItem>
                    <SelectItem value="bus"><Text>Bus</Text></SelectItem>
                    <SelectItem value="camion"><Text>Camion (Fret)</Text></SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </View>

        {/* Tarif et Devise */}
        <View className="gap-4">
          <FormField
            control={form.control}
            name="pricePerSeat"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Tarif par place *</Text></FormLabel>
                <FormControl>
                  <Input type="number" placeholder="1500" {...field} />
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
                    <SelectTrigger>
                      <SelectValue placeholder="Devise" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="FCFA"><Text>FCFA</Text></SelectItem>
                    <SelectItem value="USD"><Text>USD</Text></SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </View>

        {/* Compteur de Places */}
        <FormField
          control={form.control}
          name="seats"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Nombre de places disponibles *</Text></FormLabel>
              <View className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="w-10 h-10 rounded-xl"
                  onPress={() => field.onChange(Math.max(1, field.value - 1))}
                >
                  <Minus size={16} />
                </Button>
                <Text className="text-xl font-bold text-white w-12 text-center">
                  {field.value}
                </Text>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="w-10 h-10 rounded-xl"
                  onPress={() => field.onChange(field.value + 1)}
                >
                  <Plus size={16} />
                </Button>
              </View>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Modèle et Plaque */}
        <View className="gap-4">
          <FormField
            control={form.control}
            name="vehicleModel"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Modèle du véhicule</Text></FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Toyota Wish, 2014" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vehiclePlate"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Plaque d'immatriculation</Text></FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 5678AB01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </View>

        {/* Description / Remarques */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Text>Remarques (Climatisation, bagages acceptés...)</Text></FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ex: Coffre libre pour valises moyennes. Climatisation opérationnelle."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bouton de Soumission */}
        <Button
          type="submit"
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Enregistrement..." : submitLabel}
        </Button>
      </View>
    </Form>
  );
}
