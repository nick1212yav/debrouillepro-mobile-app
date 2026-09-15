// src/shims/class-variance-authority.ts
/**
 * Shim `class-variance-authority` (cva) pour React Native.
 *
 * cva est web-only (génère des classNames Tailwind). En RN, on retourne
 * simplement un objet vide, ou les variants passés en argument.
 * Les composants shadcn qui utilisent cva ne fonctionneront PAS visuellement,
 * mais le bundle passera.
 */

type VariantConfig = Record<string, Record<string, string>>;

interface CvaOptions {
  variants?: VariantConfig;
  defaultVariants?: Record<string, string>;
  compoundVariants?: unknown[];
}

type VariantProps<T> = Record<string, string | undefined>;

export function cva(
  _base?: string,
  _options?: CvaOptions,
): (props?: Record<string, unknown>) => string {
  return (_props?: Record<string, unknown>) => "";
}

export type { VariantProps, VariantConfig, CvaOptions };

export default cva;
