import JSZip from 'jszip';

const NS_CONTENT_TYPES = 'http://schemas.openxmlformats.org/package/2006/content-types';
const NS_RELATIONSHIPS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const REL_TYPE_IMAGE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image';
const REL_TYPE_SLIDE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide';

class PptxStructureError extends Error {}

async function loadZip(pptxFile: File): Promise<JSZip> {
  const buffer = await pptxFile.arrayBuffer();
  try {
    return await JSZip.loadAsync(buffer);
  } catch {
    throw new PptxStructureError('PPTX 파일을 zip으로 열 수 없습니다 (손상되었거나 유효하지 않은 파일).');
  }
}

async function readXml(zip: JSZip, path: string): Promise<Document> {
  const entry = zip.file(path);
  if (!entry) {
    throw new PptxStructureError(`필수 파일을 찾을 수 없습니다: ${path}`);
  }
  const text = await entry.async('string');
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new PptxStructureError(`XML 파싱에 실패했습니다: ${path}`);
  }
  return doc;
}

function serializeXml(doc: Document): string {
  return new XMLSerializer().serializeToString(doc);
}

/** Resolve the actual part path of the first slide via presentation.xml's sldIdLst + rels. */
async function resolveFirstSlidePath(zip: JSZip): Promise<string> {
  const presDoc = await readXml(zip, 'ppt/presentation.xml');
  const sldIdLst = presDoc.getElementsByTagName('p:sldIdLst')[0];
  const firstSldId = sldIdLst?.getElementsByTagName('p:sldId')[0];
  const rId = firstSldId?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id')
    || firstSldId?.getAttribute('r:id');
  if (!rId) {
    throw new PptxStructureError('프레젠테이션에 슬라이드가 없습니다.');
  }

  const relsDoc = await readXml(zip, 'ppt/_rels/presentation.xml.rels');
  const relationships = Array.from(relsDoc.getElementsByTagName('Relationship'));
  const rel = relationships.find((r) => r.getAttribute('Id') === rId && r.getAttribute('Type') === REL_TYPE_SLIDE);
  if (!rel) {
    throw new PptxStructureError('첫 번째 슬라이드의 관계 정보를 찾을 수 없습니다.');
  }
  const target = rel.getAttribute('Target');
  if (!target) {
    throw new PptxStructureError('첫 번째 슬라이드 경로를 확인할 수 없습니다.');
  }

  // Target is relative to ppt/
  const normalized = target.startsWith('/') ? target.slice(1) : `ppt/${target}`;
  if (!zip.file(normalized)) {
    throw new PptxStructureError(`첫 번째 슬라이드 파일을 찾을 수 없습니다: ${normalized}`);
  }
  return normalized;
}

export async function getSlideDimensions(pptxFile: File): Promise<{ widthEmu: number; heightEmu: number }> {
  const zip = await loadZip(pptxFile);
  const presDoc = await readXml(zip, 'ppt/presentation.xml');
  const sldSz = presDoc.getElementsByTagName('p:sldSz')[0];
  const cx = sldSz?.getAttribute('cx');
  const cy = sldSz?.getAttribute('cy');
  if (!cx || !cy) {
    throw new PptxStructureError('슬라이드 크기(sldSz)를 찾을 수 없습니다.');
  }
  return { widthEmu: Number(cx), heightEmu: Number(cy) };
}

function nextRelationshipId(relsDoc: Document): string {
  const ids = Array.from(relsDoc.getElementsByTagName('Relationship'))
    .map((r) => r.getAttribute('Id') || '')
    .map((id) => Number(/^rId(\d+)$/.exec(id)?.[1] ?? 0))
    .filter((n) => !Number.isNaN(n));
  const max = ids.length > 0 ? Math.max(...ids) : 0;
  return `rId${max + 1}`;
}

function nextShapeId(slideDoc: Document): number {
  const ids = Array.from(slideDoc.getElementsByTagName('p:cNvPr'))
    .map((el) => Number(el.getAttribute('id') ?? '0'))
    .filter((n) => !Number.isNaN(n));
  const max = ids.length > 0 ? Math.max(...ids) : 0;
  return max + 1;
}

function ensurePngContentType(contentTypesDoc: Document): void {
  const existing = Array.from(contentTypesDoc.getElementsByTagName('Default')).find(
    (el) => el.getAttribute('Extension')?.toLowerCase() === 'png',
  );
  if (existing) return;

  const defaultEl = contentTypesDoc.createElementNS(NS_CONTENT_TYPES, 'Default');
  defaultEl.setAttribute('Extension', 'png');
  defaultEl.setAttribute('ContentType', 'image/png');
  contentTypesDoc.documentElement.appendChild(defaultEl);
}

function buildRelsDoc(): Document {
  return new DOMParser().parseFromString(
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="${NS_RELATIONSHIPS}"></Relationships>`,
    'application/xml',
  );
}

/**
 * Re-inserts a captured PNG of the first slide back onto that same slide, sized to
 * fill it exactly (offset 0,0 / extent = slide size). Since the capture was rendered
 * from the slide itself, its aspect ratio always matches the slide's, so no fit
 * calculation is needed — the image simply covers everything beneath it.
 */
export async function flattenFirstSlideWithCapturedImage(pptxFile: File, capturedImage: Blob): Promise<Blob> {
  const zip = await loadZip(pptxFile);

  const { widthEmu: slideWidthEmu, heightEmu: slideHeightEmu } = await getSlideDimensions(pptxFile);
  const slidePath = await resolveFirstSlidePath(zip);
  const slideDoc = await readXml(zip, slidePath);

  const spTree = slideDoc.getElementsByTagName('p:spTree')[0];
  if (!spTree) {
    throw new PptxStructureError(`슬라이드에서 도형 트리(spTree)를 찾을 수 없습니다: ${slidePath}`);
  }

  const mediaFileName = `capturedCover_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`;
  const mediaPath = `ppt/media/${mediaFileName}`;

  const slideDir = slidePath.slice(0, slidePath.lastIndexOf('/'));
  const slideFileName = slidePath.slice(slidePath.lastIndexOf('/') + 1);
  const relsPath = `${slideDir}/_rels/${slideFileName}.rels`;

  const relsDoc = zip.file(relsPath) ? await readXml(zip, relsPath) : buildRelsDoc();
  const relId = nextRelationshipId(relsDoc);
  const relEl = relsDoc.createElementNS(NS_RELATIONSHIPS, 'Relationship');
  relEl.setAttribute('Id', relId);
  relEl.setAttribute('Type', REL_TYPE_IMAGE);
  relEl.setAttribute('Target', `../media/${mediaFileName}`);
  relsDoc.documentElement.appendChild(relEl);

  const contentTypesDoc = await readXml(zip, '[Content_Types].xml');
  ensurePngContentType(contentTypesDoc);

  const shapeId = nextShapeId(slideDoc);
  const picXml = `<p:pic xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:nvPicPr>
    <p:cNvPr id="${shapeId}" name="Flattened Cover Image"/>
    <p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>
    <p:nvPr/>
  </p:nvPicPr>
  <p:blipFill>
    <a:blip r:embed="${relId}"/>
    <a:stretch><a:fillRect/></a:stretch>
  </p:blipFill>
  <p:spPr>
    <a:xfrm>
      <a:off x="0" y="0"/>
      <a:ext cx="${slideWidthEmu}" cy="${slideHeightEmu}"/>
    </a:xfrm>
    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
  </p:spPr>
</p:pic>`;
  const picDoc = new DOMParser().parseFromString(picXml, 'application/xml');
  if (picDoc.getElementsByTagName('parsererror').length > 0) {
    throw new PptxStructureError('삽입할 이미지 도형 XML 생성에 실패했습니다.');
  }
  const picNode = slideDoc.importNode(picDoc.documentElement, true);
  spTree.appendChild(picNode);

  const imageBytes = await capturedImage.arrayBuffer();
  zip.file(mediaPath, imageBytes);
  zip.file(relsPath, serializeXml(relsDoc));
  zip.file('[Content_Types].xml', serializeXml(contentTypesDoc));
  zip.file(slidePath, serializeXml(slideDoc));

  return zip.generateAsync({ type: 'blob' });
}
