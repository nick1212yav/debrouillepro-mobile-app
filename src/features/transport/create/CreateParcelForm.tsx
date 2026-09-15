import { View } from "react-native";

// src/features/transport/create/CreateParcelForm.tsx
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react-native";
import {
  parcelFormSchema,
  type ParcelFormValues,
} from "../validators/parcel.validator";

interface CreateParcelFormProps {
  onSubmit: (data: ParcelFormValues) => Promise<void> | void;
  isLoading?: boolean;
}

export function CreateParcelForm({
  onSubmit,
  isLoading = false,
}: CreateParcelFormProps) {
  const form = useForm<ParcelFormValues>({
    resolver: zodResolver(parcelFormSchema),
    defaultValues: {
      senderName: "",
      senderPhone: "",
      recipientName: "",
      recipientPhone: "",
      origin: "",
      destination: "",
      weightKg: 1,
      description: "",
      isFragile: false,
      insuranceDeclaredValue: 0,
    },
  });

  return (
    <Form {...form}>
      <View className="space-y-4">{}<View className="gap-4"><FormField control={form.control} name="senderName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nom Expéditeur *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Jean Mukendi" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} /><FormField control={form.control} name="senderPhone" render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone Expéditeur *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: +243 890 000 001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} /></View>{}<View className="gap-4"><FormField control={form.control} name="recipientName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nom Destinataire *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Marc Ndongala" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} /><FormField control={form.control} name="recipientPhone" render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone Destinataire *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: +243 890 000 002" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} /></View>{}<View className="gap-4"><FormField control={form.control} name="origin" render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse d'expédition *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 34 Avenue de la Science, Kinshasa"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} /><FormField control={form.control} name="destination" render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse de livraison *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 12 Avenue Lumumba, Matadi"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} /></View>{}<View className="gap-4"><FormField control={form.control} name="weightKg" render={({ field }) => (
              <FormItem>
                <FormLabel>Poids estimé (kg) *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} /><FormField control={form.control} name="insuranceDeclaredValue" render={({ field }) => (
              <FormItem>
                <FormLabel>Valeur déclarée (Garantie FCFA)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} /></View><FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>
                Description du contenu (Précisez les objets) *
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ex: Ordinateur portable Dell, chargeur et câbles..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />{}<FormField control={form.control} name="isFragile" render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <View className="space-y-0.5">
                <FormLabel>Contenu fragile *</FormLabel>
                <FormDescription>
                  Ajoute des consignes de manipulation délicates [2]
                </FormDescription>
              </View>
              <FormControl>
                <Switch
                  
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )} /><Button  className="w-full h-11 rounded-xl bg-violet-600 text-white font-bold" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Valider et Enregistrer le colis [2]
        </Button></View>
    </Form>
  );
}
