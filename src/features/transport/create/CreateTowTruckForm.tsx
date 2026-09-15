import { View } from "react-native";

// src/features/transport/create/CreateTowTruckForm.tsx
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
  towtruckFormSchema,
  type TowTruckFormValues,
} from "../validators/towtruck.validator";

interface CreateTowTruckFormProps {
  onSubmit: (data: TowTruckFormValues) => Promise<void> | void;
  isLoading?: boolean;
}

export function CreateTowTruckForm({
  onSubmit,
  isLoading = false,
}: CreateTowTruckFormProps) {
  const form = useForm<TowTruckFormValues>({
    resolver: zodResolver(towtruckFormSchema),
    defaultValues: {
      providerName: "",
      phone: "",
      vehicleModel: "",
      licensePlate: "",
      basePrice: 30000,
      pricePerKm: 1500,
      currency: "FCFA",
      maxTonnage: 3,
      operatingZone: "",
    },
  });

  return (
    <Form {...form}>
      <View className="space-y-4"><FormField control={form.control} name="providerName" render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de l'entreprise d'assistance *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: SOS Dépannage Rapide" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Numéro de téléphone d'urgence direct *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: +243 890 999 119" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><View className="gap-2"><FormField control={form.control} name="vehicleModel" render={({ field }) => (
              <FormItem className="">
                <FormLabel>Modèle du camion-grue *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Iveco Daily Plateau" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} /><FormField control={form.control} name="maxTonnage" render={({ field }) => (
              <FormItem className="">
                <FormLabel>Levage (tonnes) *</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} /></View><FormField control={form.control} name="licensePlate" render={({ field }) => (
            <FormItem>
              <FormLabel>Plaque d'immatriculation *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 9012CD01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><View className="gap-2"><FormField control={form.control} name="basePrice" render={({ field }) => (
              <FormItem className="">
                <FormLabel>Prise en charge *</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} /><FormField control={form.control} name="pricePerKm" render={({ field }) => (
              <FormItem className="">
                <FormLabel>Tarif de remorquage/km *</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} /><FormField control={form.control} name="currency" render={({ field }) => (
              <FormItem className="">
                <FormLabel>Devise</FormLabel>
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
                    <SelectItem value="FCFA">FCFA</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} /></View><FormField control={form.control} name="operatingZone" render={({ field }) => (
            <FormItem>
              <FormLabel>
                Zone de patrouille / intervention d'urgence *
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Kinshasa-Kongo Central, Autoroute 1"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><Button  className="w-full h-11 rounded-xl bg-violet-600 text-white font-bold" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer le service de Dépannage [2]
        </Button></View>
    </Form>
  );
}
