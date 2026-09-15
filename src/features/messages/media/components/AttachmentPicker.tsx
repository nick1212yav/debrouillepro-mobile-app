import { Pressable, TextInput, NativeSyntheticEvent, TextInputChangeEventData } from "react-native";
import { useRef } from "react";

interface AttachmentPickerProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
}

export function AttachmentPicker({
  onFilesSelected,
  accept = "image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt",
  multiple = true,
  disabled = false,
}: AttachmentPickerProps) {
  const inputRef = useRef<TextInput | null>(null);

  const handleChange = (event: NativeSyntheticEvent<TextInputChangeEventData>) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length > 0) {
      onFilesSelected(files);
    }

    event.target.value = "";
  };

  return (
    <>
      <Pressable disabled={disabled} onPress={() => inputRef.current?.click()} className="flex h-9 w-9 items-center justify-center rounded-full text-lg disabled:opacity-50" accessibilityLabel="Ajouter une pièce jointe">
        📎
      </Pressable>

      <TextInput ref={inputRef}   onChangeText={handleChange} className="hidden" />
    </>
  );
}

export default AttachmentPicker;
