import { View, Text } from "react-native";

// src/features/transport/create/CreateTruckForm.tsx
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
  truckFormSchema,
  type TruckFormValues,
} from "../validators/truck.validator";

interface CreateTruckFormProps {
  onSubmit: (data: TruckFormValues) => Promise<void> | void;
  isLoading?: boolean;
}

const CARGO_TYPES: Record<TruckFormValues["cargoType"], string> = {
  general: "Marchandises Générales [2]",
  refrigerated: "Frigorifique (Alimentation/Frais)",
  liquid: "Citerne (Liquides/Carburants)",
  oversized: "Exceptionnel (Gabarits hors-normes)",
  moving: "Déménagement / Mobilier",
};

export function CreateTruckForm({
  onSubmit,
  isLoading = false,
}: CreateTruckFormProps) {
  const form = useForm<TruckFormValues>({
    resolver: zodResolver(truckFormSchema),
    defaultValues: {
      companyName: "",
      phone: "",
      truckModel: "",
      capacityTons: 5,
      licensePlate: "",
      basePrice: 50000,
      pricePerKm: 2500,
      currency: "FCFA",
      cargoType: "general",
      operatingArea: "Inter-villes",
    },
  });

  return (
    <Form {...form}>
      <View className="space-y-4">
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Nom de l'entreprise ou du transporteur *</Text></FormLabel>
              <FormControl>
                <Input placeholder="Ex: Congo Logistique SARL" {...field} />
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
                <Input placeholder="Ex: +243 890 000 000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <View className="gap-2">
          <FormField
            control={form.control}
            name="truckModel"
            render={({ field }) => (
              <FormItem className="">
                <FormLabel><Text>Modèle du camion *</Text></FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Mercedes Axor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="capacityTons"
            render={({ field }) => (
              <FormItem className="">
                <FormLabel><Text>Capacité (tonnes)</Text></FormLabel>
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
            name="licensePlate"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Plaque d'immatriculation *</Text></FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 1234AB02" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cargoType"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Type de fret principal *</Text></FormLabel>
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
                    {Object.entries(CARGO_TYPES).map(([value, label]) => (
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

        <View className="gap-2">
          <FormField
            control={form.control}
            name="basePrice"
            render={({ field }) => (
              <FormItem className="">
                <FormLabel><Text>Forfait de base *</Text></FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pricePerKm"
            render={({ field }) => (
              <FormItem className="">
                <FormLabel><Text>Tarif par km *</Text></FormLabel>
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
              <FormItem className="">
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
          name="operatingArea"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Zone de couverture de service *</Text></FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Kinshasa-Kongo Central, National"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          className="w-full h-11 rounded-xl bg-violet-600 text-white font-bold"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Text>Enregistrer le service de Fret [2]</Text></Button>
      </View>
    </Form>
  );
}
