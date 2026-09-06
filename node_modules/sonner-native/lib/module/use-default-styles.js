"use strict";

import { useMemo } from 'react';
import { useColors } from "./use-colors.js";
export const useDefaultStyles = ({
  invert,
  richColors,
  unstyled,
  description,
  variant: variantProps
}) => {
  const colors = useColors(invert);
  const variant = variantProps === 'loading' ? 'info' : variantProps;
  const hasDescription = !!description;
  return useMemo(() => {
    if (unstyled) {
      return {
        toast: {},
        toastContent: {},
        title: {},
        description: {},
        buttons: {},
        actionButton: {},
        actionButtonText: {},
        cancelButton: {},
        cancelButtonText: {},
        closeButtonColor: colors['text-secondary'],
        iconColor: colors[variant]
      };
    }
    return {
      toast: {
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        marginHorizontal: 16,
        backgroundColor: richColors ? colors.rich[variant].background : colors['background-primary'],
        borderCurve: 'continuous',
        borderWidth: richColors ? 1 : undefined,
        borderColor: richColors ? colors.rich[variant].border : undefined
      },
      toastContent: {
        flexDirection: 'row',
        gap: 16,
        alignItems: hasDescription ? undefined : 'center'
      },
      title: {
        fontWeight: '600',
        lineHeight: 20,
        color: richColors ? colors.rich[variant].foreground : colors['text-primary']
      },
      description: {
        fontSize: 14,
        lineHeight: 20,
        marginTop: 2,
        color: richColors ? colors.rich[variant].foreground : colors['text-tertiary']
      },
      buttons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginTop: 16
      },
      actionButton: {
        flexGrow: 0,
        alignSelf: 'flex-start',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors['border-secondary'],
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderCurve: 'continuous',
        backgroundColor: colors['background-secondary']
      },
      actionButtonText: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '600',
        alignSelf: 'flex-start',
        color: colors['text-primary']
      },
      cancelButton: {
        flexGrow: 0
      },
      cancelButtonText: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '600',
        alignSelf: 'flex-start',
        color: colors['text-secondary']
      },
      iconColor: richColors ? colors.rich[variant].foreground : colors[variant],
      closeButtonColor: richColors ? colors.rich[variant].foreground : colors['text-secondary']
    };
  }, [colors, variant, richColors, unstyled, hasDescription]);
};
export const useIconColor = ({
  invert,
  richColors,
  variant: variantProps
}) => {
  const colors = useColors(invert);
  const variant = variantProps === 'loading' ? 'info' : variantProps;
  return richColors ? colors.rich[variant].foreground : colors[variant];
};
//# sourceMappingURL=use-default-styles.js.map