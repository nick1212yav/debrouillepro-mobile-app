import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Image as RNImage,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo,
  Strikethrough,
  Underline,
  Undo,
  X,
} from "lucide-react-native";

import {
  EnrichedTextInput,
  type EnrichedTextInputInstance,
  type OnChangeStateEvent,
} from "react-native-enriched-html";

interface ArticleEditorProps {
  content: string;
  onChange: (html: string) => void;
  color?: string;
}

type SelectionState = {
  start: number;
  end: number;
  text: string;
};

type LinkState = {
  start: number;
  end: number;
  text: string;
  url: string;
};

type DialogMode = "link" | "image" | null;

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  color: string;
  onPress: () => void;
  children: React.ReactNode;
};

const EMPTY_HTML = "<p></p>";

function normalizeInitialContent(content: string): string {
  const trimmed = content.trim();

  if (!trimmed) {
    return EMPTY_HTML;
  }

  return content;
}

function countWords(text: string): number {
  const normalized = text.trim();

  if (!normalized) {
    return 0;
  }

  return normalized.split(/\s+/u).filter(Boolean).length;
}

function normalizeUrl(value: string): string {
  const url = value.trim();

  if (!url) {
    return "";
  }

  if (
    /^https?:\/\//i.test(url) ||
    /^mailto:/i.test(url) ||
    /^tel:/i.test(url)
  ) {
    return url;
  }

  return `https://${url}`;
}

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  color,
  onPress,
  children,
}: ToolbarButtonProps) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{
        disabled,
        selected: active,
      }} disabled={disabled} onPress={onPress} hitSlop={4} style={({ pressed }) => [
        styles.toolbarButton,
        active && {
          backgroundColor: `${color}20`,
          borderColor: `${color}55`,
        },
        pressed && !disabled && styles.toolbarButtonPressed,
        disabled && styles.toolbarButtonDisabled,
      ]}>
      {children}
    </Pressable>
  );
}

export default function ArticleEditor({
  content,
  onChange,
  color = "#06B6D4",
}: ArticleEditorProps) {
  const editorRef = useRef<EnrichedTextInputInstance>(null);

  const lastExternalContentRef = useRef(content);
  const lastHtmlRef = useRef(normalizeInitialContent(content));

  const applyingHistoryRef = useRef<string | null>(null);

  const undoStackRef = useRef<string[]>([normalizeInitialContent(content)]);

  const redoStackRef = useRef<string[]>([]);

  const [plainText, setPlainText] = useState("");
  const [styleState, setStyleState] = useState<OnChangeStateEvent | null>(null);

  const [selection, setSelection] = useState<SelectionState>({
    start: 0,
    end: 0,
    text: "",
  });

  const [detectedLink, setDetectedLink] = useState<LinkState | null>(null);

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);

  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const [imageUrl, setImageUrl] = useState("");

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const initialValue = useMemo(() => normalizeInitialContent(content), []);

  const wordCount = useMemo(() => countWords(plainText), [plainText]);

  const charCount = plainText.length;

  const readingTime =
    wordCount === 0 ? 0 : Math.max(1, Math.ceil(wordCount / 200));

  const updateHistoryAvailability = useCallback(() => {
    setCanUndo(undoStackRef.current.length > 1);
    setCanRedo(redoStackRef.current.length > 0);
  }, []);

  const pushHistory = useCallback(
    (html: string) => {
      const stack = undoStackRef.current;
      const previous = stack[stack.length - 1];

      if (previous === html) {
        return;
      }

      stack.push(html);

      /*
       * Empêche l'historique de croître indéfiniment
       * pendant une longue session d'édition.
       */
      if (stack.length > 100) {
        stack.shift();
      }

      redoStackRef.current = [];
      updateHistoryAvailability();
    },
    [updateHistoryAvailability],
  );

  /*
   * Synchronisation si le parent remplace réellement le contenu
   * après le montage.
   *
   * EnrichedTextInput est volontairement uncontrolled.
   * setValue() est donc utilisé uniquement lorsqu'une nouvelle
   * valeur externe arrive.
   */
  useEffect(() => {
    if (content === lastExternalContentRef.current) {
      return;
    }

    lastExternalContentRef.current = content;

    const nextValue = normalizeInitialContent(content);

    if (nextValue === lastHtmlRef.current) {
      return;
    }

    lastHtmlRef.current = nextValue;

    undoStackRef.current = [nextValue];
    redoStackRef.current = [];

    updateHistoryAvailability();

    editorRef.current?.setValue(nextValue);
  }, [content, updateHistoryAvailability]);

  const handleHtmlChange = useCallback(
    (html: string) => {
      lastHtmlRef.current = html;
      lastExternalContentRef.current = html;

      const historyTarget = applyingHistoryRef.current;

      if (historyTarget === html) {
        applyingHistoryRef.current = null;
      } else {
        pushHistory(html);
      }

      onChange(html);
    },
    [onChange, pushHistory],
  );

  const handleUndo = useCallback(() => {
    const stack = undoStackRef.current;

    if (stack.length <= 1) {
      return;
    }

    const current = stack.pop();

    if (current !== undefined) {
      redoStackRef.current.push(current);
    }

    const previous = stack[stack.length - 1];

    if (!previous) {
      updateHistoryAvailability();
      return;
    }

    applyingHistoryRef.current = previous;
    lastHtmlRef.current = previous;
    lastExternalContentRef.current = previous;

    editorRef.current?.setValue(previous);

    /*
     * onChangeHtml sera également émis par l'éditeur.
     * On informe néanmoins immédiatement le parent afin que
     * son état reste synchronisé avec Undo.
     */
    onChange(previous);

    updateHistoryAvailability();
  }, [onChange, updateHistoryAvailability]);

  const handleRedo = useCallback(() => {
    const next = redoStackRef.current.pop();

    if (!next) {
      return;
    }

    const stack = undoStackRef.current;

    if (stack[stack.length - 1] !== next) {
      stack.push(next);
    }

    applyingHistoryRef.current = next;
    lastHtmlRef.current = next;
    lastExternalContentRef.current = next;

    editorRef.current?.setValue(next);

    onChange(next);

    updateHistoryAvailability();
  }, [onChange, updateHistoryAvailability]);

  const openLinkDialog = useCallback(() => {
    /*
     * Si le curseur est déjà sur un lien, on édite ce lien.
     * Sinon on travaille avec la sélection courante.
     */
    if (detectedLink) {
      setLinkText(detectedLink.text);
      setLinkUrl(detectedLink.url);
    } else {
      setLinkText(selection.text);
      setLinkUrl("");
    }

    setDialogMode("link");
  }, [detectedLink, selection.text]);

  const closeDialog = useCallback(() => {
    setDialogMode(null);
    setLinkText("");
    setLinkUrl("");
    setImageUrl("");
  }, []);

  const applyLink = useCallback(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const target = detectedLink ?? {
      start: selection.start,
      end: selection.end,
      text: selection.text,
      url: "",
    };

    const normalizedUrl = normalizeUrl(linkUrl);

    /*
     * URL vide sur un lien existant = suppression du lien,
     * mais conservation du texte.
     */
    if (!normalizedUrl) {
      if (target.end > target.start) {
        editor.removeLink(target.start, target.end);
      }

      closeDialog();
      editor.focus();
      return;
    }

    const displayText = linkText.trim() || target.text.trim() || normalizedUrl;

    editor.setLink(target.start, target.end, displayText, normalizedUrl);

    closeDialog();
    editor.focus();
  }, [closeDialog, detectedLink, linkText, linkUrl, selection]);

  const removeCurrentLink = useCallback(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    if (detectedLink) {
      editor.removeLink(detectedLink.start, detectedLink.end);
    } else if (selection.end > selection.start) {
      editor.removeLink(selection.start, selection.end);
    }

    closeDialog();
    editor.focus();
  }, [closeDialog, detectedLink, selection]);

  const openImageDialog = useCallback(() => {
    setImageUrl("");
    setDialogMode("image");
  }, []);

  const applyImage = useCallback(() => {
    const editor = editorRef.current;
    const normalizedUrl = normalizeUrl(imageUrl);

    if (!editor || !normalizedUrl) {
      return;
    }

    /*
     * L'API native demande explicitement largeur + hauteur.
     * On récupère donc les dimensions de l'image distante puis
     * on les réduit à une taille adaptée à un écran mobile.
     */
    RNImage.getSize(
      normalizedUrl,
      (width, height) => {
        const maxWidth = 320;

        const safeWidth = width > 0 ? Math.min(width, maxWidth) : maxWidth;

        const ratio = width > 0 && height > 0 ? height / width : 9 / 16;

        const safeHeight = Math.max(80, Math.round(safeWidth * ratio));

        editor.setImage(normalizedUrl, Math.round(safeWidth), safeHeight);

        closeDialog();
        editor.focus();
      },
      () => {
        /*
         * Fallback si React Native ne peut pas déterminer
         * les dimensions distantes.
         */
        editor.setImage(normalizedUrl, 320, 180);

        closeDialog();
        editor.focus();
      },
    );
  }, [closeDialog, imageUrl]);

  const isBlocked = useCallback(
    (key: keyof OnChangeStateEvent): boolean => {
      const state = styleState?.[key];

      if (
        typeof state !== "object" ||
        state === null ||
        !("isBlocking" in state)
      ) {
        return false;
      }

      return Boolean(state.isBlocking);
    },
    [styleState],
  );

  const isActive = useCallback(
    (key: keyof OnChangeStateEvent): boolean => {
      const state = styleState?.[key];

      if (
        typeof state !== "object" ||
        state === null ||
        !("isActive" in state)
      ) {
        return false;
      }

      return Boolean(state.isActive);
    },
    [styleState],
  );

  return (
    <View style={styles.container}>
      {/* ======================================================
          TOOLBAR MOBILE
          ====================================================== */}

      <View style={styles.toolbarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={styles.toolbarContent}
        >
          <ToolbarButton
            label="Titre 2"
            color={color}
            active={isActive("h2")}
            disabled={isBlocked("h2")}
            onPress={() => {
              editorRef.current?.toggleH2();
              editorRef.current?.focus();
            }}
          >
            <Heading2
              size={18}
              color={isActive("h2") ? color : stylesConstants.iconColor}
            />
          </ToolbarButton>

          <ToolbarButton
            label="Titre 3"
            color={color}
            active={isActive("h3")}
            disabled={isBlocked("h3")}
            onPress={() => {
              editorRef.current?.toggleH3();
              editorRef.current?.focus();
            }}
          >
            <Heading3
              size={18}
              color={isActive("h3") ? color : stylesConstants.iconColor}
            />
          </ToolbarButton>

          <View style={styles.separator} />

          <ToolbarButton
            label="Gras"
            color={color}
            active={isActive("bold")}
            disabled={isBlocked("bold")}
            onPress={() => {
              editorRef.current?.toggleBold();
              editorRef.current?.focus();
            }}
          >
            <Bold
              size={18}
              color={isActive("bold") ? color : stylesConstants.iconColor}
            />
          </ToolbarButton>

          <ToolbarButton
            label="Italique"
            color={color}
            active={isActive("italic")}
            disabled={isBlocked("italic")}
            onPress={() => {
              editorRef.current?.toggleItalic();
              editorRef.current?.focus();
            }}
          >
            <Italic
              size={18}
              color={isActive("italic") ? color : stylesConstants.iconColor}
            />
          </ToolbarButton>

          <ToolbarButton
            label="Souligné"
            color={color}
            active={isActive("underline")}
            disabled={isBlocked("underline")}
            onPress={() => {
              editorRef.current?.toggleUnderline();
              editorRef.current?.focus();
            }}
          >
            <Underline
              size={18}
              color={isActive("underline") ? color : stylesConstants.iconColor}
            />
          </ToolbarButton>

          <ToolbarButton
            label="Barré"
            color={color}
            active={isActive("strikeThrough")}
            disabled={isBlocked("strikeThrough")}
            onPress={() => {
              editorRef.current?.toggleStrikeThrough();
              editorRef.current?.focus();
            }}
          >
            <Strikethrough
              size={18}
              color={
                isActive("strikeThrough") ? color : stylesConstants.iconColor
              }
            />
          </ToolbarButton>

          <ToolbarButton
            label="Code"
            color={color}
            active={isActive("inlineCode")}
            disabled={isBlocked("inlineCode")}
            onPress={() => {
              editorRef.current?.toggleInlineCode();
              editorRef.current?.focus();
            }}
          >
            <Code
              size={18}
              color={isActive("inlineCode") ? color : stylesConstants.iconColor}
            />
          </ToolbarButton>

          <View style={styles.separator} />

          <ToolbarButton
            label="Liste à puces"
            color={color}
            active={isActive("unorderedList")}
            disabled={isBlocked("unorderedList")}
            onPress={() => {
              editorRef.current?.toggleUnorderedList();
              editorRef.current?.focus();
            }}
          >
            <List
              size={18}
              color={
                isActive("unorderedList") ? color : stylesConstants.iconColor
              }
            />
          </ToolbarButton>

          <ToolbarButton
            label="Liste numérotée"
            color={color}
            active={isActive("orderedList")}
            disabled={isBlocked("orderedList")}
            onPress={() => {
              editorRef.current?.toggleOrderedList();
              editorRef.current?.focus();
            }}
          >
            <ListOrdered
              size={18}
              color={
                isActive("orderedList") ? color : stylesConstants.iconColor
              }
            />
          </ToolbarButton>

          <ToolbarButton
            label="Citation"
            color={color}
            active={isActive("blockQuote")}
            disabled={isBlocked("blockQuote")}
            onPress={() => {
              editorRef.current?.toggleBlockQuote();
              editorRef.current?.focus();
            }}
          >
            <Quote
              size={18}
              color={isActive("blockQuote") ? color : stylesConstants.iconColor}
            />
          </ToolbarButton>

          <View style={styles.separator} />

          <ToolbarButton
            label="Lien"
            color={color}
            active={isActive("link")}
            disabled={isBlocked("link")}
            onPress={openLinkDialog}
          >
            <LinkIcon
              size={18}
              color={isActive("link") ? color : stylesConstants.iconColor}
            />
          </ToolbarButton>

          <ToolbarButton
            label="Image"
            color={color}
            disabled={isBlocked("image")}
            onPress={openImageDialog}
          >
            <ImageIcon size={18} color={stylesConstants.iconColor} />
          </ToolbarButton>

          <View style={styles.separator} />

          <ToolbarButton
            label="Annuler"
            color={color}
            disabled={!canUndo}
            onPress={handleUndo}
          >
            <Undo size={18} color={stylesConstants.iconColor} />
          </ToolbarButton>

          <ToolbarButton
            label="Rétablir"
            color={color}
            disabled={!canRedo}
            onPress={handleRedo}
          >
            <Redo size={18} color={stylesConstants.iconColor} />
          </ToolbarButton>
        </ScrollView>
      </View>

      {/* ======================================================
          ÉDITEUR NATIF
          ====================================================== */}

      <View style={[
          styles.editorShell,
          {
            borderColor: `${color}35`,
          },
        ]}>
        <EnrichedTextInput
          ref={editorRef}
          defaultValue={initialValue}
          placeholder={
            "Rédigez votre article ici…\n\nUtilisez la barre d'outils pour formater votre texte."
          }
          placeholderTextColor="#94A3B8"
          selectionColor={color}
          cursorColor={color}
          scrollEnabled
          useHtmlNormalizer
          textShortcuts={[
            {
              trigger: "- ",
              style: "unordered_list",
            },
            {
              trigger: "1. ",
              style: "ordered_list",
            },
            {
              trigger: "## ",
              style: "h2",
            },
            {
              trigger: "### ",
              style: "h3",
            },
            {
              trigger: "> ",
              style: "blockquote",
            },
            {
              trigger: "**",
              style: "bold",
            },
            {
              trigger: "*",
              style: "italic",
            },
            {
              trigger: "~~",
              style: "strikethrough",
            },
            {
              trigger: "`",
              style: "inline_code",
            },
          ]}
          style={styles.editor}
          htmlStyle={{
            h2: {
              fontSize: 24,
              bold: true,
            },
            h3: {
              fontSize: 20,
              bold: true,
            },
            blockquote: {
              borderColor: color,
              borderWidth: 4,
              gapWidth: 12,
              color: "#475569",
            },
            code: {
              color: "#0F172A",
              backgroundColor: "#F1F5F9",
            },
            codeblock: {
              color: "#0F172A",
              backgroundColor: "#F1F5F9",
              borderRadius: 10,
            },
            a: {
              color,
              textDecorationLine: "underline",
            },
            ul: {
              bulletColor: color,
              bulletSize: 7,
              marginLeft: 12,
              gapWidth: 10,
            },
            ol: {
              markerColor: color,
              marginLeft: 12,
              gapWidth: 10,
              markerFontWeight: "600",
            },
          }}
          onChangeText={(event) => {
            setPlainText(event.nativeEvent.value);
          }}
          onChangeHtml={(event) => {
            handleHtmlChange(event.nativeEvent.value);
          }}
          onChangeState={(event) => {
            setStyleState(event.nativeEvent);
          }}
          onChangeSelection={(event) => {
            setSelection({
              start: event.nativeEvent.start,
              end: event.nativeEvent.end,
              text: event.nativeEvent.text,
            });
          }}
          onLinkDetected={(event) => {
            setDetectedLink({
              start: event.start,
              end: event.end,
              text: event.text,
              url: event.url,
            });
          }}
          onFocus={() => {
            /*
             * Un lien détecté précédemment peut ne plus être
             * pertinent lorsque l'utilisateur revient dans
             * l'éditeur. onChangeState/onLinkDetected vont
             * rétablir l'état utile.
             */
          }}
        />
      </View>

      {/* ======================================================
          STATISTIQUES
          ====================================================== */}

      <View style={styles.stats}>
        <Text style={styles.statText}>
          {wordCount} {wordCount === 1 ? "mot" : "mots"}
        </Text>

        <View style={styles.statDot} />

        <Text style={styles.statText}>{charCount} caractères</Text>

        <View style={styles.statDot} />

        <Text style={styles.statText}>
          {readingTime === 0 ? "< 1 min" : `~ ${readingTime} min`} de lecture
        </Text>
      </View>

      {/* ======================================================
          MODALE LIEN
          ====================================================== */}

      <Modal
        visible={dialogMode === "link"}
        transparent
        animationType="fade"
        onRequestClose={closeDialog}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {detectedLink ? "Modifier le lien" : "Ajouter un lien"}
                </Text>

                <Text style={styles.modalSubtitle}>
                  Ajoutez le texte et l'adresse du lien.
                </Text>
              </View>

              <Pressable accessibilityRole="button" accessibilityLabel="Fermer" hitSlop={8} onPress={closeDialog} style={styles.closeButton}>
                <X size={20} color={stylesConstants.iconColor} />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Texte affiché</Text>

            <TextInput value={linkText} onChangeText={setLinkText} placeholder="Texte du lien" placeholderTextColor="#94A3B8" autoCapitalize="sentences" style={[
                styles.dialogInput,
                {
                  borderColor: `${color}45`,
                },
              ]} />

            <Text style={styles.inputLabel}>Adresse</Text>

            <TextInput value={linkUrl} onChangeText={setLinkUrl} placeholder="https://exemple.com" placeholderTextColor="#94A3B8" autoCapitalize="none" autoCorrect={false} keyboardType="url" style={[
                styles.dialogInput,
                {
                  borderColor: `${color}45`,
                },
              ]} />

            <View style={styles.dialogActions}>
              {detectedLink || isActive("link") ? (
                <Pressable onPress={removeCurrentLink} style={[styles.secondaryAction, styles.removeAction]}>
                  <Text style={styles.removeActionText}>Supprimer</Text>
                </Pressable>
              ) : null}

              <View style={styles.dialogActionSpacer} />

              <Pressable onPress={closeDialog} style={styles.secondaryAction}>
                <Text style={styles.secondaryActionText}>Annuler</Text>
              </Pressable>

              <Pressable onPress={applyLink} disabled={!linkUrl.trim()} style={[
                  styles.primaryAction,
                  {
                    backgroundColor: color,
                  },
                  !linkUrl.trim() && styles.primaryActionDisabled,
                ]}>
                <Text style={styles.primaryActionText}>Appliquer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================
          MODALE IMAGE
          ====================================================== */}

      <Modal
        visible={dialogMode === "image"}
        transparent
        animationType="fade"
        onRequestClose={closeDialog}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Ajouter une image</Text>

                <Text style={styles.modalSubtitle}>
                  Collez l'adresse HTTPS de l'image.
                </Text>
              </View>

              <Pressable accessibilityRole="button" accessibilityLabel="Fermer" hitSlop={8} onPress={closeDialog} style={styles.closeButton}>
                <X size={20} color={stylesConstants.iconColor} />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>URL de l'image</Text>

            <TextInput value={imageUrl} onChangeText={setImageUrl} placeholder="https://exemple.com/image.jpg" placeholderTextColor="#94A3B8" autoCapitalize="none" autoCorrect={false} keyboardType="url" returnKeyType="done" onSubmitEditing={applyImage} style={[
                styles.dialogInput,
                {
                  borderColor: `${color}45`,
                },
              ]} />

            <View style={styles.dialogActions}>
              <View style={styles.dialogActionSpacer} />

              <Pressable onPress={closeDialog} style={styles.secondaryAction}>
                <Text style={styles.secondaryActionText}>Annuler</Text>
              </Pressable>

              <Pressable onPress={applyImage} disabled={!imageUrl.trim()} style={[
                  styles.primaryAction,
                  {
                    backgroundColor: color,
                  },
                  !imageUrl.trim() && styles.primaryActionDisabled,
                ]}>
                <Text style={styles.primaryActionText}>Insérer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const stylesConstants = {
  iconColor: "#475569",
} as const;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 10,
  },

  toolbarContainer: {
    width: "100%",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    overflow: "hidden",
  },

  toolbarContent: {
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },

  toolbarButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },

  toolbarButtonPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.96 }],
  },

  toolbarButtonDisabled: {
    opacity: 0.28,
  },

  separator: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    marginHorizontal: 3,
    backgroundColor: "#CBD5E1",
  },

  editorShell: {
    width: "100%",
    minHeight: 320,
    maxHeight: 620,
    overflow: "hidden",
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
  },

  editor: {
    width: "100%",
    minHeight: 320,
    maxHeight: 620,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    lineHeight: 25,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
  },

  stats: {
    minHeight: 26,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },

  statText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "500",
  },

  statDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(15, 23, 42, 0.48)",
  },

  modalCard: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    borderRadius: 20,
    padding: 18,
    backgroundColor: "#FFFFFF",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },

  modalTitle: {
    fontSize: 18,
    lineHeight: 24,
    color: "#0F172A",
    fontWeight: "700",
  },

  modalSubtitle: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 19,
    color: "#64748B",
  },

  closeButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },

  inputLabel: {
    marginBottom: 6,
    fontSize: 13,
    lineHeight: 18,
    color: "#334155",
    fontWeight: "600",
  },

  dialogInput: {
    width: "100%",
    minHeight: 46,
    marginBottom: 14,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
  },

  dialogActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },

  dialogActionSpacer: {
    flex: 1,
  },

  secondaryAction: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    paddingHorizontal: 14,
    backgroundColor: "#F1F5F9",
  },

  secondaryActionText: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "600",
  },

  removeAction: {
    backgroundColor: "#FEF2F2",
  },

  removeActionText: {
    fontSize: 14,
    color: "#DC2626",
    fontWeight: "600",
  },

  primaryAction: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    paddingHorizontal: 16,
  },

  primaryActionDisabled: {
    opacity: 0.4,
  },

  primaryActionText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
