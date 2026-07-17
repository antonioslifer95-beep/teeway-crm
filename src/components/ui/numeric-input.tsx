import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";

// Base UI's Input primitive has a client/server hydration mismatch specific
// to type="number" (a `caretColor` style differs between SSR and hydration).
// Using type="text" + inputMode sidesteps it entirely and is arguably better
// UX for money/quantity fields anyway (no scroll-wheel value changes, no
// stray "e"/"+"/"-" characters that native number inputs accept).

export function DecimalInput(
  props: Omit<ComponentProps<typeof Input>, "type" | "inputMode">,
) {
  return <Input type="text" inputMode="decimal" {...props} />;
}

export function IntegerInput(
  props: Omit<ComponentProps<typeof Input>, "type" | "inputMode">,
) {
  return <Input type="text" inputMode="numeric" {...props} />;
}
