// src/features/community/fields.ts
export const fields = [
  { key: "title", type: "text", label: "Titre", required: false },
  { key: "description", type: "textarea", label: "Contenu", required: true },
  {
    key: "postType",
    type: "select",
    label: "Type de post",
    options: [
      { value: "text", label: "Texte" },
      { value: "question", label: "Question" },
      { value: "poll", label: "Sondage" },
      { value: "image", label: "Image" },
      { value: "video", label: "Vidéo" },
      { value: "event", label: "Événement" },
    ],
  },
  { key: "tags", type: "tags", label: "Tags" },
  { key: "images", type: "image-upload", label: "Images" },
  { key: "location", type: "text", label: "Lieu" },
  { key: "eventDate", type: "datetime", label: "Date de l'événement" },
  { key: "pollOptions", type: "repeating", label: "Options du sondage" },
];
