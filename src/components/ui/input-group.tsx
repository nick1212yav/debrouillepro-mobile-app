// src/components/ui/input-group.tsx

"use client";

import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type InputGroupProps = React.ComponentProps<typeof View>;

function InputGroup({ className, ...props }: InputGroupProps) {
  return (
    <View
      data-slot="input-group"
      className={cn(
        "relative flex w-full flex-row items-center rounded-md border border-input shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

const inputGroupAddonVariants = cva(
  "flex items-center justify-center gap-2 py-1.5 text-sm font-medium text-muted-foreground",
  {
    variants: {
      align: {
        "inline-start": "pl-3",
        "inline-end": "pr-3",
        "block-start": "w-full justify-start px-3 pt-3",
        "block-end": "w-full justify-start px-3 pb-3",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  },
);

type InputGroupAddonProps = React.ComponentProps<typeof View> &
  VariantProps<typeof inputGroupAddonVariants>;

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: InputGroupAddonProps) {
  return (
    <View
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      {...props}
    />
  );
}

const inputGroupButtonVariants = cva("flex items-center justify-center gap-2", {
  variants: {
    size: {
      xs: "h-6 min-w-6 gap-1 rounded-sm px-2",
      sm: "h-8 min-w-8 gap-1.5 rounded-md px-2.5",
      "icon-xs": "h-6 w-6 rounded-sm p-0",
      "icon-sm": "h-8 w-8 rounded-md p-0",
    },
  },
  defaultVariants: {
    size: "xs",
  },
});

type InputGroupButtonProps = Omit<React.ComponentProps<typeof Button>, "size"> &
  VariantProps<typeof inputGroupButtonVariants>;

function InputGroupButton({
  className,
  variant = "ghost",
  size = "xs",
  ...props
}: InputGroupButtonProps) {
  return (
    <Button
      data-size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  );
}

type InputGroupTextProps = React.ComponentProps<typeof Text>;

function InputGroupText({ className, ...props }: InputGroupTextProps) {
  return (
    <Text
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

type InputGroupInputProps = React.ComponentProps<typeof Input>;

function InputGroupInput({ className, ...props }: InputGroupInputProps) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        "min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none",
        className,
      )}
      {...props}
    />
  );
}

type InputGroupTextareaProps = React.ComponentProps<typeof Textarea>;

function InputGroupTextarea({ className, ...props }: InputGroupTextareaProps) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        "min-w-0 flex-1 resize-none rounded-none border-0 bg-transparent py-3 shadow-none",
        className,
      )}
      {...props}
    />
  );
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
};
