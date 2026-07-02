import {
  ContentBlock,
  DocumentSession,
  Mall,
  contentToChipHtml,
  defaultValuesFrom,
  newId,
} from "@fred/shared";

export function createSession(mall: Mall, organisationId: string): DocumentSession {
  const now = new Date().toISOString();
  const values = defaultValuesFrom(mall.parameters);
  const fixedBlocks = mall.blocks
    .filter((b): b is ContentBlock => b.placement === "fixed")
    .sort((a, b) => a.order - b.order);

  const userContent: Record<string, string> = {};
  const usedBlocks = fixedBlocks.map((block, i) => {
    const instanceId = newId("instance");
    if (block.type === "editable") {
      userContent[instanceId] = contentToChipHtml(block.content, values, mall.parameters);
    }
    return { instanceId, blockId: block.id, source: "fixed" as const, order: i };
  });

  const headerFooterValues: Record<string, string> = {};
  for (const field of [...mall.headerFooter.headerFields, ...mall.headerFooter.footerFields]) {
    if (field.kind === "text") headerFooterValues[field.id] = field.defaultText ?? "";
  }

  return {
    id: newId("doc"),
    templateId: mall.id,
    templateName: mall.name,
    organisationId,
    parameterValues: values,
    usedBlocks,
    userContent,
    headerFooterValues,
    createdAt: now,
    updatedAt: now,
  };
}

export function insertFreeBlockInstance(
  session: DocumentSession,
  mall: Mall,
  block: ContentBlock
): DocumentSession {
  const instanceId = newId("instance");
  const userContent = { ...session.userContent };
  if (block.type === "editable") {
    userContent[instanceId] = contentToChipHtml(block.content, session.parameterValues, mall.parameters);
  }
  const order = session.usedBlocks.length
    ? Math.max(...session.usedBlocks.map((b) => b.order)) + 1
    : 0;
  return {
    ...session,
    userContent,
    usedBlocks: [
      ...session.usedBlocks,
      { instanceId, blockId: block.id, source: "free", order },
    ],
    updatedAt: new Date().toISOString(),
  };
}
