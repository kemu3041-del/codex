import { cmsResources } from "../data/cms-content";

export function getResourceCards() {
  return cmsResources.map((item) => ({
    slug: item.slug,
    title: item.moduleTitle,
    type: item.moduleType,
    summary: item.moduleSummary,
    scene: item.targetScene,
    priority: item.priority,
    cmsFields: item.fields,
    deliveryNote: item.deliveryNote,
  }));
}

export function getResourceBySlug(slug) {
  return getResourceCards().find((resource) => resource.slug === slug);
}
