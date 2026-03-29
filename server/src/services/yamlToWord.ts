import yaml from 'js-yaml';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ExternalHyperlink,
  AlignmentType,
  BorderStyle,
  TabStopType,
  TabStopPosition,
  UnderlineType,
  LevelFormat,
  convertInchesToTwip,
} from 'docx';

function makeHorizontalLine(): Paragraph {
  return new Paragraph({
    border: {
      bottom: {
        color: '000000',
        space: 1,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
    children: [],
  });
}

function makeLeftRightParagraph(
  leftText: string,
  rightText: string,
  opts: {
    leftBold?: boolean;
    rightBold?: boolean;
    leftItalic?: boolean;
    rightItalic?: boolean;
    fontSize?: number;
  } = {},
): Paragraph {
  const size = (opts.fontSize ?? 12) * 2; // half-points
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    children: [
      new TextRun({
        text: leftText,
        font: 'Calibri',
        size,
        bold: opts.leftBold,
        italics: opts.leftItalic,
      }),
      new TextRun({ text: '\t' }),
      new TextRun({
        text: rightText,
        font: 'Calibri',
        size,
        bold: opts.rightBold,
        italics: opts.rightItalic,
      }),
    ],
  });
}

function makeContactParagraph(contactLine: string): Paragraph {
  const parts = contactLine.split('|').map(p => p.trim());
  const children: (TextRun | ExternalHyperlink)[] = [];

  for (let i = 0; i < parts.length; i++) {
    if (i > 0) {
      children.push(new TextRun({ text: ' | ', font: 'Calibri', size: 28 }));
    }

    const part = parts[i];
    if (part.startsWith('http')) {
      const lower = part.toLowerCase();
      let display = 'Portfolio';
      if (lower.includes('linkedin')) display = 'LinkedIn';
      else if (lower.includes('github')) display = 'GitHub';

      children.push(
        new ExternalHyperlink({
          link: part,
          children: [
            new TextRun({
              text: display,
              font: 'Calibri',
              size: 28,
              color: '0000FF',
              underline: { type: UnderlineType.SINGLE },
            }),
          ],
        }),
      );
    } else {
      children.push(new TextRun({ text: part, font: 'Calibri', size: 28 }));
    }
  }

  return new Paragraph({ alignment: AlignmentType.CENTER, children });
}

function makeBulletParagraph(text: string, level: number): Paragraph {
  return new Paragraph({
    numbering: { reference: 'resume-bullets', level },
    children: [new TextRun({ text, font: 'Calibri', size: 24 })],
    spacing: { after: 0 },
  });
}

function buildDocumentParagraphs(yamlData: Record<string, unknown>): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const rs = (yamlData['resumeStructure'] ?? {}) as Record<string, unknown>;

  // ── Header ──────────────────────────────────────────────────────────────────
  const header = (rs['header'] ?? {}) as Record<string, string>;
  const nameLine = header['line1'] ?? '';
  const contactLine = header['line2'] ?? '';

  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: nameLine, font: 'Calibri', size: 56, bold: true }),
      ],
    }),
  );

  paragraphs.push(makeContactParagraph(contactLine));
  paragraphs.push(makeHorizontalLine());

  // ── Work Experience ──────────────────────────────────────────────────────────
  const weData = (rs['workExperience'] ?? {}) as Record<string, unknown>;
  const weHeader = (weData['header'] as string | undefined) ?? 'WORK EXPERIENCE';

  paragraphs.push(
    new Paragraph({
      spacing: { after: 0 },
      children: [
        new TextRun({ text: weHeader.toUpperCase(), font: 'Calibri', size: 24, bold: true }),
      ],
    }),
  );
  paragraphs.push(makeHorizontalLine());

  const companiesList = (weData['companies'] ?? []) as Record<string, unknown>[];
  for (let cIdx = 0; cIdx < companiesList.length; cIdx++) {
    const company = companiesList[cIdx];
    const companyInfoLine = (company['companyInfoLine'] as string | undefined) ?? '';
    const infoParts = companyInfoLine.split('|').map(p => p.trim());
    const datesWorked = infoParts[0] ?? '';
    const companyName = infoParts[1] ?? '';

    paragraphs.push(
      makeLeftRightParagraph(datesWorked, companyName, {
        leftBold: true,
        rightBold: true,
        fontSize: 12,
      }),
    );

    const rolesList = (company['roles'] ?? []) as Record<string, unknown>[];
    for (let rIdx = 0; rIdx < rolesList.length; rIdx++) {
      const role = rolesList[rIdx];
      const roleInfoLine = (role['roleInfoLine'] as string | undefined) ?? '';
      const roleParts = roleInfoLine.split('|').map(p => p.trim());
      const roleName = roleParts[0] ?? '';
      const roleDates = roleParts[1] ?? '';
      const roleCityState = roleParts[2] ?? '';

      paragraphs.push(
        makeLeftRightParagraph(`${roleName} | ${roleDates}`, roleCityState, {
          leftItalic: true,
          rightItalic: true,
          fontSize: 12,
        }),
      );

      const bullets = (role['bullets'] ?? []) as Record<string, unknown>[];
      for (const bulletItem of bullets) {
        const description = (bulletItem['description'] as string | undefined) ?? '';
        paragraphs.push(makeBulletParagraph(description, 0));

        let subBullets = bulletItem['subBullets'];
        if (subBullets && !Array.isArray(subBullets)) subBullets = [subBullets];
        const subBulletList = (subBullets ?? []) as Record<string, unknown>[];

        for (const sub of subBulletList) {
          if (typeof sub !== 'object' || sub === null) continue;
          for (const [key, value] of Object.entries(sub)) {
            if (key === 'techStack') {
              paragraphs.push(
                new Paragraph({
                  numbering: { reference: 'resume-bullets', level: 1 },
                  children: [
                    new TextRun({ text: 'Tech Stack: ', font: 'Calibri', size: 24, bold: true }),
                    new TextRun({ text: String(value), font: 'Calibri', size: 24 }),
                  ],
                  spacing: { after: 0 },
                }),
              );
            } else if (key === 'keyResult') {
              paragraphs.push(
                new Paragraph({
                  numbering: { reference: 'resume-bullets', level: 1 },
                  children: [
                    new TextRun({ text: 'Key Results: ', font: 'Calibri', size: 24, bold: true }),
                    new TextRun({ text: String(value), font: 'Calibri', size: 24 }),
                  ],
                  spacing: { after: 0 },
                }),
              );
            }
          }
        }
      }

      if (rIdx < rolesList.length - 1) {
        paragraphs.push(new Paragraph({ children: [] }));
      }
    }

    if (cIdx < companiesList.length - 1) {
      paragraphs.push(new Paragraph({ children: [] }));
    }
  }

  paragraphs.push(new Paragraph({ children: [] }));

  // ── Education ────────────────────────────────────────────────────────────────
  const eduData = (rs['education'] ?? {}) as Record<string, unknown>;
  const eduHeader = (eduData['header'] as string | undefined) ?? 'EDUCATION';

  paragraphs.push(
    new Paragraph({
      spacing: { after: 0 },
      children: [
        new TextRun({ text: eduHeader.toUpperCase(), font: 'Calibri', size: 24, bold: true }),
      ],
    }),
  );
  paragraphs.push(makeHorizontalLine());

  const univNameLine = (eduData['universityNameLine'] as string | undefined) ?? '';
  const degreeInfoLine = (eduData['degreeInfoLine'] as string | undefined) ?? '';

  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: univNameLine, font: 'Calibri', size: 24, bold: true })],
    }),
  );

  const degParts = degreeInfoLine.split('|').map(p => p.trim());
  const deg = degParts[0] ?? '';
  const location = degParts[1] ?? '';
  paragraphs.push(
    makeLeftRightParagraph(deg, location, { leftItalic: true, rightItalic: true, fontSize: 12 }),
  );

  paragraphs.push(new Paragraph({ children: [] }));

  // ── Certifications & Skills ───────────────────────────────────────────────────
  const csiData = (rs['certificationsSkills'] ?? {}) as Record<string, unknown>;
  const csiHeader = (csiData['header'] as string | undefined) ?? 'CERTIFICATIONS & SKILLS';

  paragraphs.push(
    new Paragraph({
      spacing: { after: 0 },
      children: [
        new TextRun({ text: csiHeader.toUpperCase(), font: 'Calibri', size: 24, bold: true }),
      ],
    }),
  );
  paragraphs.push(makeHorizontalLine());

  const csiBullets = (csiData['bullets'] ?? []) as Record<string, unknown>[];
  for (const bulletObj of csiBullets) {
    for (const [key, val] of Object.entries(bulletObj)) {
      if (key.toLowerCase() === 'interests') continue;
      const valStr = String(val).trim();
      if (!valStr) continue;
      paragraphs.push(
        new Paragraph({
          numbering: { reference: 'resume-bullets', level: 0 },
          children: [
            new TextRun({
              text: `${key.charAt(0).toUpperCase() + key.slice(1)}: `,
              font: 'Calibri',
              size: 24,
              bold: true,
            }),
            new TextRun({ text: valStr, font: 'Calibri', size: 24 }),
          ],
        }),
      );
    }
  }

  return paragraphs;
}

export async function convertYamlToWordBytes(
  yamlContent: string,
  companyName: string,
): Promise<[Buffer, string]> {
  if (!companyName) throw new Error('Company name cannot be empty!');

  const yamlData = yaml.load(yamlContent) as Record<string, unknown>;
  const paragraphs = buildDocumentParagraphs(yamlData);

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'resume-bullets',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '\u2022',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: {
                    left: convertInchesToTwip(0.5),
                    hanging: convertInchesToTwip(0.25),
                  },
                },
                run: { font: 'Calibri', size: 24 },
              },
            },
            {
              level: 1,
              format: LevelFormat.BULLET,
              text: '\u25E6',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: {
                    left: convertInchesToTwip(1),
                    hanging: convertInchesToTwip(0.25),
                  },
                },
                run: { font: 'Calibri', size: 24 },
              },
            },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 24 },
          paragraph: { spacing: { line: 240 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  let name = 'Resume';
  try {
    const rs = (yamlData['resumeStructure'] as Record<string, unknown>);
    name = ((rs['header'] as Record<string, string>)['line1']) ?? 'Resume';
  } catch {
    // keep default
  }

  const today = new Date().toISOString().split('T')[0];
  const filename = `${name} Resume - ${companyName} - ${today}.docx`;

  return [buffer, filename];
}
