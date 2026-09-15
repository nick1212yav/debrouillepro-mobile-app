// babel-plugin-jsx-html-to-rn.js
const VIEW_TAGS = new Set([
  "div",
  "section",
  "article",
  "main",
  "header",
  "footer",
  "nav",
  "aside",
  "figure",
  "form",
]);

const TEXT_TAGS = new Set([
  "span",
  "p",
  "strong",
  "em",
  "b",
  "i",
  "label",
  "small",
  "code",
  "pre",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
]);

// Composants RN qui acceptent du texte comme enfants directs
const RN_CONTAINER_TAGS = new Set([
  "View",
  "Pressable",
  "ScrollView",
  "SafeAreaView",
  "TouchableOpacity",
  "TouchableHighlight",
  "TouchableWithoutFeedback",
]);

module.exports = function ({ types: t }) {
  return {
    name: "jsx-html-to-rn",
    visitor: {
      Program: {
        enter(path, state) {
          state.needsText = false;
          state.needsViewUsage = false;
          state.needsTextUsage = false;
          state.hasView = false;
          state.hasText = false;

          path.traverse({
            ImportDeclaration(p) {
              if (p.node.source.value !== "react-native") return;
              for (const spec of p.node.specifiers) {
                if (
                  t.isImportSpecifier(spec) &&
                  t.isIdentifier(spec.imported)
                ) {
                  if (spec.imported.name === "View") state.hasView = true;
                  if (spec.imported.name === "Text") state.hasText = true;
                }
              }
            },
          });

          path.traverse({
            JSXOpeningElement(p) {
              const name = p.node.name;
              if (name.type !== "JSXIdentifier") return;
              if (name.name === "View") state.needsViewUsage = true;
              if (name.name === "Text") state.needsTextUsage = true;
              if (VIEW_TAGS.has(name.name)) state.needsViewUsage = true;
              if (TEXT_TAGS.has(name.name)) state.needsTextUsage = true;
            },
          });
        },

        exit(path, state) {
          if (state.needsViewUsage && !state.hasView) {
            addImport(path, t, "View");
          }
          if ((state.needsTextUsage || state.needsText) && !state.hasText) {
            addImport(path, t, "Text");
          }
        },
      },

      JSXElement(path, state) {
        const name = path.node.openingElement.name;
        if (name.type !== "JSXIdentifier") return;

        // ── <br /> ─────────────────────────────────────────────
        if (name.name === "br") {
          const parent = path.parent;
          const parentName = parent?.openingElement?.name?.name;
          const insideText =
            parentName && (parentName === "Text" || TEXT_TAGS.has(parentName));

          if (insideText) {
            path.replaceWith(t.jsxText("\n"));
          } else {
            state.needsText = true;
            path.replaceWith(
              t.jsxElement(
                t.jsxOpeningElement(t.jsxIdentifier("Text"), [], false),
                t.jsxClosingElement(t.jsxIdentifier("Text")),
                [t.jsxExpressionContainer(t.stringLiteral("\n"))],
                false,
              ),
            );
          }
          path.skip();
          return;
        }

        // ── <div> → <View> ─────────────────────────────────────
        if (VIEW_TAGS.has(name.name)) {
          name.name = "View";
          if (path.node.closingElement) {
            path.node.closingElement.name.name = "View";
          }
          return;
        }

        // ── <span>, <p> → <Text> ───────────────────────────────
        if (TEXT_TAGS.has(name.name)) {
          name.name = "Text";
          if (path.node.closingElement) {
            path.node.closingElement.name.name = "Text";
          }
          return;
        }
      },

      // ✅ Wrapping des textes bruts (FIX bug 1)
      JSXText(path, state) {
        if (!path.node.value || path.node.value.trim() === "") return;

        const parent = path.parent;
        if (!parent || parent.type !== "JSXElement") return;

        const parentName = parent.openingElement?.name?.name;
        if (!parentName) return;

        // Déjà dans un Text → skip
        if (parentName === "Text" || TEXT_TAGS.has(parentName)) return;

        // Dans un View/Pressable/... → wrap ✅
        state.needsText = true;
        const textValue = path.node.value;
        path.replaceWith(
          t.jsxElement(
            t.jsxOpeningElement(t.jsxIdentifier("Text"), [], false),
            t.jsxClosingElement(t.jsxIdentifier("Text")),
            [t.jsxText(textValue)],
            false,
          ),
        );
        path.skip();
      },

      // ✅ NOUVEAU : Wrapping des expressions simples (FIX bug 2)
      JSXExpressionContainer(path, state) {
        const parent = path.parent;
        if (!parent || parent.type !== "JSXElement") return;

        const parentName = parent.openingElement?.name?.name;
        if (!parentName) return;

        // Déjà dans un Text → skip
        if (parentName === "Text" || TEXT_TAGS.has(parentName)) return;

        // Seulement dans les composants RN container
        if (!RN_CONTAINER_TAGS.has(parentName)) return;

        const expr = path.node.expression;

        // Types sûrs à wrapper : peuvent évaluer vers string/number
        const SAFE_TYPES = new Set([
          "Identifier",
          "MemberExpression",
          "OptionalMemberExpression",
          "Literal",
          "StringLiteral",
          "NumericLiteral",
          "TemplateLiteral",
          "BinaryExpression",
        ]);

        // Types à NE PAS toucher (peuvent contenir du JSX)
        const SKIP_TYPES = new Set([
          "JSXElement",
          "JSXFragment",
          "CallExpression", // .map(), .filter() retournent des arrays de JSX
          "ArrayExpression",
          "ConditionalExpression", // peut contenir du JSX
          "LogicalExpression", // idem
          "ArrowFunctionExpression",
          "ObjectExpression",
        ]);

        if (SKIP_TYPES.has(expr.type)) return;
        if (!SAFE_TYPES.has(expr.type)) return;

        state.needsText = true;
        path.replaceWith(
          t.jsxElement(
            t.jsxOpeningElement(t.jsxIdentifier("Text"), [], false),
            t.jsxClosingElement(t.jsxIdentifier("Text")),
            [t.jsxExpressionContainer(expr)],
            false,
          ),
        );
        path.skip();
      },
    },
  };
};

function addImport(path, t, name) {
  let rnImport = null;
  path.traverse({
    ImportDeclaration(p) {
      if (p.node.source.value === "react-native") rnImport = p;
    },
  });

  if (rnImport) {
    const already = rnImport.node.specifiers.some(
      (s) =>
        t.isImportSpecifier(s) &&
        t.isIdentifier(s.imported) &&
        s.imported.name === name,
    );
    if (!already) {
      rnImport.node.specifiers.push(
        t.importSpecifier(t.identifier(name), t.identifier(name)),
      );
    }
  } else {
    path.unshiftContainer(
      "body",
      t.importDeclaration(
        [t.importSpecifier(t.identifier(name), t.identifier(name))],
        t.stringLiteral("react-native"),
      ),
    );
  }
}
