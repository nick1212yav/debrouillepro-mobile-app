// src/shims/react-router-dom.tsx
/**
 * Shim `react-router-dom` → `expo-router`.
 *
 * Permet aux fichiers migrés depuis le web de continuer à utiliser
 * `import { Link, useNavigate, ... } from "react-router-dom"` sans
 * modification, tout en utilisant expo-router sous le capot.
 *
 * Alias configuré dans babel.config.js :
 *   "react-router-dom$": "./src/shims/react-router-dom.tsx"
 *
 * 🆕 V8.5 : `wrapTextChildren()` enveloppe récursivement les strings/numbers
 *           dans <Text> pour respecter la contrainte React Native
 *           ("text node cannot be a child of a <View>").
 */
import * as React from "react";
import {
  Pressable,
  Text,
  type PressableProps,
  type StyleProp,
  type TextStyle,
} from "react-native";
import {
  useRouter,
  usePathname,
  useLocalSearchParams,
  Link as ExpoLink,
  router as globalRouter,
} from "expo-router";

// ── Helper : wrap récursif des enfants texte dans <Text> ────────────────
/**
 * React Native refuse les strings/number comme enfants directs d'un <View>.
 * Ce helper parcourt les enfants (y compris les tableaux et fragments)
 * et enveloppe les valeurs textuelles dans <Text>.
 */
function wrapTextChildren(children: React.ReactNode): React.ReactNode {
  if (children === null || children === undefined) return null;

  if (typeof children === "string" || typeof children === "number") {
    return <Text>{children}</Text>;
  }

  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === "string" || typeof child === "number") {
        return <Text key={i}>{child}</Text>;
      }
      return child;
    });
  }

  // Fragment avec plusieurs enfants texte : on doit aussi les wrapper.
  if (React.isValidElement(children) && children.type === React.Fragment) {
    const props = children.props as { children?: React.ReactNode };
    return wrapTextChildren(props.children);
  }

  return children;
}

// ── useNavigate ──────────────────────────────────────────────────────────
type NavigateOptions = { replace?: boolean; state?: unknown };
type To = string | number | { pathname?: string; search?: string };

export function useNavigate(): (to: To, options?: NavigateOptions) => void {
  const router = useRouter();

  return React.useCallback(
    (to: To, options?: NavigateOptions) => {
      // navigate(-1) → router.back()
      if (typeof to === "number") {
        if (to < 0) router.back();
        return;
      }

      // navigate({ pathname, search }) → router.push(pathname + search)
      if (typeof to === "object" && to !== null) {
        const path = (to.pathname ?? "") + (to.search ?? "");
        if (options?.replace) router.replace(path as never);
        else router.push(path as never);
        return;
      }

      // navigate("/path") ou navigate("/path", { replace: true })
      if (options?.replace) {
        router.replace(to as never);
      } else {
        router.push(to as never);
      }
    },
    [router],
  );
}

// ── useLocation ──────────────────────────────────────────────────────────
export function useLocation(): {
  pathname: string;
  search: string;
  hash: string;
  state: unknown;
  key: string;
} {
  const pathname = usePathname();
  return {
    pathname,
    search: "",
    hash: "",
    state: undefined,
    key: "default",
  };
}

// ── useSearchParams ──────────────────────────────────────────────────────
/**
 * Reproduit l'API `URLSearchParams` de manière simplifiée (les méthodes
 * les plus utilisées). Renvoie un tuple `[searchParams, setSearchParams]`.
 */
export function useSearchParams(): [
  {
    get: (key: string) => string | null;
    getAll: (key: string) => string[];
    has: (key: string) => boolean;
    toString: () => string;
    entries: () => IterableIterator<[string, string]>;
  },
  (next: Record<string, string> | URLSearchParams) => void,
] {
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const router = useRouter();

  const searchParams = React.useMemo(() => {
    const flat: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      flat[k] = Array.isArray(v) ? (v[0] ?? "") : String(v ?? "");
    }

    return {
      get: (key: string) => (key in flat ? flat[key] : null),
      getAll: (key: string) => (key in flat ? [flat[key]] : []),
      has: (key: string) => key in flat,
      toString: () =>
        Object.entries(flat)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join("&"),
      entries: () => Object.entries(flat)[Symbol.iterator](),
    };
  }, [params]);

  const setSearchParams = React.useCallback(
    (next: Record<string, string> | URLSearchParams) => {
      const query =
        next instanceof URLSearchParams
          ? next.toString()
          : new URLSearchParams(next).toString();
      void query;
      router.setParams(next as never);
    },
    [router],
  );

  return [searchParams, setSearchParams];
}

// Helper : récupère le pathname courant sans hook
function usePathnameSafe(): string {
  return usePathname();
}

// ── useParams ────────────────────────────────────────────────────────────
export function useParams<
  T extends Record<string, string | string[]> = Record<string, string>,
>(): T {
  const params = useLocalSearchParams<T>();
  return params as T;
}

// ── Link ─────────────────────────────────────────────────────────────────
interface LinkProps extends Omit<PressableProps, "children" | "style"> {
  to: string;
  replace?: boolean;
  children?: React.ReactNode;
  style?: StyleProp<TextStyle>;
  className?: string;
}

export function Link({
  to,
  replace: shouldReplace,
  children,
  style,
  className: _className,
  onPress,
  ...props
}: LinkProps) {
  const router = useRouter();

  const handlePress = (event: any) => {
    onPress?.(event);
    if (shouldReplace) {
      router.replace(to as never);
    } else {
      router.push(to as never);
    }
  };

  return (
    <Pressable onPress={handlePress} {...props}>
      {wrapTextChildren(children)}
    </Pressable>
  );
}

// ── NavLink (alias de Link) ─────────────────────────────────────────────
export const NavLink = Link;

// ── Navigate ─────────────────────────────────────────────────────────────
interface NavigateProps {
  to: string;
  replace?: boolean;
}

export function Navigate({ to, replace }: NavigateProps): null {
  React.useEffect(() => {
    if (replace) {
      globalRouter.replace(to as never);
    } else {
      globalRouter.push(to as never);
    }
  }, [to, replace]);

  return null;
}

// ── Outlet (pass-through vers expo-router) ──────────────────────────────
export const Outlet = ExpoLink; // fallback : expo-router gère le routage

// ── useMatch ─────────────────────────────────────────────────────────────
export function useMatch(
  pattern: string,
): { params: Record<string, string> } | null {
  const pathname = usePathname();
  // Comparaison simple : si le pathname commence par le pattern sans paramètres
  const normalized = pattern.replace(/:[^/]+/g, "");
  if (pathname.startsWith(normalized)) {
    return { params: {} };
  }
  return null;
}

// ── Export type-only pour compat TS ─────────────────────────────────────
export type { NavigateFunction } from "react-router-dom";

export const BrowserRouter = ({ children }: { children: React.ReactNode }) =>
  children as any;
export const Routes = ({ children }: { children: React.ReactNode }) =>
  children as any;
export const Route = (_props: any) => null;
export const MemoryRouter = BrowserRouter;
export const HashRouter = BrowserRouter;
