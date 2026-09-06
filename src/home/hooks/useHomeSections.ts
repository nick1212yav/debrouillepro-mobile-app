import { useCallback, useMemo, useState } from "react";

import type { HomeSection, HomeSectionType } from "../types/home-section.types";

import { HOME_SECTION_ORDER } from "../config/home-sections.config";

/**
 * ============================================================
 * DÉBROUILLEPRO — useHomeSections
 * ============================================================
 */

export interface UseHomeSectionsOptions {
  sections?: HomeSection[];

  hiddenSections?: HomeSectionType[];
}

export function useHomeSections(options: UseHomeSectionsOptions = {}) {
  const { sections = [], hiddenSections = [] } = options;

  const [customOrder, setCustomOrder] = useState<HomeSectionType[]>([]);

  const visibleSections = useMemo(() => {
    const hidden = new Set(hiddenSections);

    const source = customOrder.length > 0 ? customOrder : HOME_SECTION_ORDER;

    const ordered = source
      .map((type) => sections.find((section) => section.type === type))
      .filter((section): section is HomeSection => section !== undefined);

    return ordered.filter((section) => !hidden.has(section.type));
  }, [sections, hiddenSections, customOrder]);

  const reorderSections = useCallback((order: HomeSectionType[]) => {
    setCustomOrder(order);
  }, []);

  const resetOrder = useCallback(() => {
    setCustomOrder([]);
  }, []);

  const getSection = useCallback(
    (type: HomeSectionType) =>
      visibleSections.find((section) => section.type === type),
    [visibleSections],
  );

  return {
    sections: visibleSections,

    visibleSections,

    reorderSections,

    resetOrder,

    getSection,

    count: visibleSections.length,
  };
}

export default useHomeSections;
