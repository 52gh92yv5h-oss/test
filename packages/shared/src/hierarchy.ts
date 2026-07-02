import type { CategoryNode } from "./types";

export function findNode(root: CategoryNode, id: string): CategoryNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

/** Tar bort ett Mall-ID från alla noder innan det ev. läggs till på en ny plats. */
export function removeTemplateEverywhere(root: CategoryNode, templateId: string): CategoryNode {
  return {
    ...root,
    templateIds: root.templateIds.filter((id) => id !== templateId),
    children: root.children.map((c) => removeTemplateEverywhere(c, templateId)),
  };
}

export function addTemplateToNode(root: CategoryNode, nodeId: string, templateId: string): CategoryNode {
  const stripped = removeTemplateEverywhere(root, templateId);
  const place = (node: CategoryNode): CategoryNode => {
    if (node.id === nodeId) {
      return { ...node, templateIds: [...node.templateIds, templateId] };
    }
    return { ...node, children: node.children.map(place) };
  };
  return place(stripped);
}

export function addChildCategory(root: CategoryNode, parentId: string, child: CategoryNode): CategoryNode {
  const place = (node: CategoryNode): CategoryNode => {
    if (node.id === parentId) {
      return { ...node, children: [...node.children, child] };
    }
    return { ...node, children: node.children.map(place) };
  };
  return place(root);
}

export function renameCategory(root: CategoryNode, id: string, name: string): CategoryNode {
  const walk = (node: CategoryNode): CategoryNode =>
    node.id === id ? { ...node, name } : { ...node, children: node.children.map(walk) };
  return walk(root);
}

export function removeCategory(root: CategoryNode, id: string): CategoryNode {
  const walk = (node: CategoryNode): CategoryNode => ({
    ...node,
    children: node.children.filter((c) => c.id !== id).map(walk),
  });
  return walk(root);
}

export interface FlatCategory {
  id: string;
  name: string;
  depth: number;
}

export function flattenCategories(root: CategoryNode, depth = 0): FlatCategory[] {
  const out: FlatCategory[] = [{ id: root.id, name: root.name, depth }];
  for (const child of root.children) {
    out.push(...flattenCategories(child, depth + 1));
  }
  return out;
}
