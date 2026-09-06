import { View, Text } from "react-native";

// src/features/transport/create/CreateShuttleForm.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react-native";
import {
  shuttleFormSchema,
  type ShuttleFormValues,
} from "../validators/shuttle.validator";

interface CreateShuttleFormProps {
  onSubmit: (data: ShuttleFormValues) => Promise<void> | void;
  isLoading?: boolean;
}

const SHUTTLE_TYPES: Record<ShuttleFormValues["shuttleType"], string> = {
  corporate: "Navette d'Entreprise / Personnel [2]",
  school: "Navette Scolaire / Universitaire",
  community: "Navette de Quartier / Résidentiel",
};

export function CreateShuttleForm({
  onSubmit,
  isLoading = false,
}: CreateShuttleFormProps) {
  const form = useForm<ShuttleFormValues>({
    resolver: zodResolver(shuttleFormSchema),
    defaultValues: {
      serviceName: "",
      phone: "",
      vehicleModel: "",
      licensePlate: "",
      shuttleType: "corporate",
      capacity: 15,
      pricePerMonth: 35000,
      currency: "FCFA",
      operatingRoute: "",
    },
  });

  return (
    <Form {...form}>
      <View className="space-y-4">
        <FormField
          control={form.control}
          name="serviceName"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Nom du service de navette *</Text></FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Navette Staff DébrouillePro"
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
              <FormLabel><Text>Téléphone de contact *</Text></FormLabel>
              <FormControl>
                <Input placeholder="Ex: +243 890 000 000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <View className="gap-4">
          <FormField
            control={form.control}
            name="vehicleModel"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Modèle du minibus *</Text></FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Toyota Coaster, HiAce" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="licensePlate"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Plaque d'immatriculation *</Text></FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 5678AB03" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </View>

        <View className="gap-4">
          <FormField
            control={form.control}
            name="shuttleType"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Type de service *</Text></FormLabel>
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
                    {Object.entries(SHUTTLE_TYPES).map(([value, label]) => (
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
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Capacité totale (sièges) *</Text></FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </View>

        <View className="gap-4">
          <FormField
            control={form.control}
            name="pricePerMonth"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Prix de l'abonnement mensuel *</Text></FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
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

        <FormField
          control={form.control}
          name="operatingRoute"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Text>Itinéraire desservi (Arrêts clés du matin/soir) *</Text></FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Limete (7h30) → Kasa-Vubu (8h00) → Gombe (8h30)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full h-11 rounded-xl bg-violet-600 text-white font-bold"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Text>Enregistrer le service de Navette [2]</Text></Button>
      </View>
    </Form>
  );
}
