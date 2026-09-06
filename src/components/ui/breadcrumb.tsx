import { Pressable, View, Text } from "react-native";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronRight, MoreHorizontal } from "lucide-react-native";
import { cn } from "@/lib/utils";

function Breadcrumb({ ...props }: React.ComponentProps<typeof View>) {
  return <View accessibilityLabel="breadcrumb" data-slot="breadcrumb" {...props} />;
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<typeof View>) {
  return (
    <View
      data-slot="breadcrumb-list"
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm wrap-break-word sm:gap-2.5",
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<typeof View>) {
  return (
    <View
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  );
}

function BreadcrumbLink({
  asChild,
  className,
  ...props
}: React.ComponentProps<typeof Pressable> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn(
        "hover:text-foreground cursor-pointer transition-colors",
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<typeof Text>) {
  return (
    <Text
      data-slot="breadcrumb-page"
      accessibilityRole="link"
     
      aria-current="page"
      className={cn("text-foreground font-normal", className)}
      {...props}
     accessibilityState={{ disabled: true }}/>
  );
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<typeof View>) {
  return (
    <View
      data-slot="breadcrumb-separator"
      accessibilityRole="presentation"
     
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </View>
  );
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<typeof Text>) {
  return (
    <Text
      data-slot="breadcrumb-ellipsis"
      accessibilityRole="presentation"
     
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <Text className="sr-only">More</Text>
    </Text>
  );
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
