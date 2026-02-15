Source Sans (React-PDF)

This app can register a custom PDF font family for React-PDF in:

- src/components/resume/ResumePdfDocument.tsx

React-PDF weight/bold rendering is most reliable with *static* TTF files (not variable fonts).

This repo is currently set up for Source Sans Pro static files:

- SourceSansPro-Regular.ttf
- SourceSansPro-Italic.ttf
- SourceSansPro-Semibold.ttf
- SourceSansPro-SemiboldItalic.ttf
- SourceSansPro-Bold.ttf
- SourceSansPro-BoldItalic.ttf

You can download Source Sans 3 from Google Fonts and keep the filenames as-is.

Then enable it in `.env.local`:

- `NEXT_PUBLIC_PDF_FONT_FAMILY=SourceSansPro`

If the files are missing, the PDF will fall back to default fonts.
