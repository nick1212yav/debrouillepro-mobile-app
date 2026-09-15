// babel-plugin-strip-motion-props.js
const MOTION_PROPS = new Set([
  "initial",
  "animate",
  "exit",
  "transition",
  "whileHover",
  "whileTap",
  "whileFocus",
  "whileInView",
  "whileDrag",
  "layoutId",
  "layout",
  "variants",
  "drag",
  "dragConstraints",
  "dragElastic",
  "dragSnapToOrigin",
  "onAnimationStart",
  "onAnimationComplete",
]);

const VIEW_LIKE = new Set([
  "View",
  "Pressable",
  "ScrollView",
  "SafeAreaView",
  "TouchableOpacity",
  "TouchableHighlight",
  "TouchableWithoutFeedback",
  "KeyboardAvoidingView",
]);

// Identifiants INTERDITS (peuvent contenir JSX)
const FORBIDDEN_IDS = new Set(["children", "props", "rest"]);

// Types d'expression autorisés à wrapper
const SAFE_TYPES = new Set([
  "StringLiteral",
  "NumericLiteral",
  "BooleanLiteral",
  "TemplateLiteral",
  "BinaryExpression",
  "Identifier",
  "MemberExpression",
  "OptionalMemberExpression",
  "CallExpression",
]);

function isSafeToWrapExpression(expr, t) {
  if (!expr) return false;
  if (!SAFE_TYPES.has(expr.type)) return false;

  // Identifier : interdire children / props / rest
  if (t.isIdentifier(expr)) {
    if (FORBIDDEN_IDS.has(expr.name)) return false;
    return true;
  }

  // MemberExpression : x.children / x.props / x.rest → interdits
  if (t.isMemberExpression(expr) || t.isOptionalMemberExpression(expr)) {
    const prop = expr.property;
    if (t.isIdentifier(prop) && FORBIDDEN_IDS.has(prop.name)) return false;
    if (t.isIdentifier(expr.object) && FORBIDDEN_IDS.has(expr.object.name))
      return false;
    return true;
  }

  // CallExpression : .map()/.filter() retournent des arrays → interdits
  if (t.isCallExpression(expr)) {
    const callee = expr.callee;
    if (t.isMemberExpression(callee)) {
      const prop = callee.property;
      if (t.isIdentifier(prop)) {
        const name = prop.name;
        if (
          name === "map" ||
          name === "filter" ||
          name === "flatMap" ||
          name === "reduce" ||
          name === "slice" ||
          name === "concat"
        ) {
          return false;
        }
      }
    }
    return true;
  }

  return true;
}

module.exports = function ({ types: t }) {
  return {
    name: "strip-motion-and-wrap-text",
    visitor: {
      Program: {
        enter(path, state) {
          state.needsText = false;
          state.hasText = false;

          path.traverse({
            ImportDeclaration(p) {
              if (p.node.source.value !== "react-native") return;
              for (const spec of p.node.specifiers) {
                if (
                  t.isImportSpecifier(spec) &&
                  t.isIdentifier(spec.imported) &&
                  spec.imported.name === "Text"
                ) {
                  state.hasText = true;
                }
              }
            },
          });
        },
        exit(path, state) {
          if (!state.needsText || state.hasText) return;

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
                s.imported.name === "Text",
            );
            if (!already) {
              rnImport.node.specifiers.push(
                t.importSpecifier(t.identifier("Text"), t.identifier("Text")),
              );
            }
          } else {
            path.unshiftContainer(
              "body",
              t.importDeclaration(
                [t.importSpecifier(t.identifier("Text"), t.identifier("Text"))],
                t.stringLiteral("react-native"),
              ),
            );
          }
        },
      },

      JSXOpeningElement(path) {
        path.node.attributes = path.node.attributes.filter((attr) => {
          if (attr.type !== "JSXAttribute") return true;
          const n = attr.name;
          if (!n) return true;
          if (t.isJSXIdentifier(n) && MOTION_PROPS.has(n.name)) return false;
          return true;
        });
      },

      JSXElement(path, state) {
        const opening = path.node.openingElement;
        const nameNode = opening.name;

        if (!t.isJSXIdentifier(nameNode)) return;
        if (!VIEW_LIKE.has(nameNode.name)) return;

        const children = path.node.children;
        if (!Array.isArray(children) || children.length === 0) return;

        let modified = false;

        const newChildren = children.map((child) => {
          // 1) Texte brut
          if (t.isJSXText(child)) {
            if (!child.value.trim()) return child;
            modified = true;
            state.needsText = true;
            return t.jsxElement(
              t.jsxOpeningElement(t.jsxIdentifier("Text"), [], false),
              t.jsxClosingElement(t.jsxIdentifier("Text")),
              [t.jsxText(child.value)],
              false,
            );
          }

          // 2) Expression {variable}
          if (t.isJSXExpressionContainer(child)) {
            const expr = child.expression;
            if (t.isJSXEmptyExpression(expr)) return child;
            if (!isSafeToWrapExpression(expr, t)) return child;

            modified = true;
            state.needsText = true;
            return t.jsxElement(
              t.jsxOpeningElement(t.jsxIdentifier("Text"), [], false),
              t.jsxClosingElement(t.jsxIdentifier("Text")),
              [t.jsxExpressionContainer(expr)],
              false,
            );
          }

          return child;
        });

        if (modified) {
          path.node.children = newChildren;
        }
      },
    },
  };
};
