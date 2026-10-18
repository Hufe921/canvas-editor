# Real font fixtures

T08 uses unmodified SIL Open Font License Noto fonts for offline HarfBuzz checks.

- `NotoSans-Latin-Regular.woff2`: https://fonts.bunny.net/noto-sans/files/noto-sans-latin-400-normal.woff2
  (downloaded 2026-10-17, 13,120 bytes). License: `OFL-NotoSans.txt`, from
  https://github.com/notofonts/latin-greek-cyrillic/blob/main/OFL.txt
- `NotoSansSC-Regular.woff2`: https://fonts.bunny.net/noto-sans-sc/files/noto-sans-sc-chinese-simplified-400-normal.woff2
  (downloaded 2026-10-17, 1,142,552 bytes). License: `OFL-NotoSansSC.txt`, from
  https://github.com/notofonts/noto-cjk/blob/main/Sans/LICENSE

The existing self-hosted Arabic, Devanagari and Thai TTF assets remain in
`public/fonts`. Tests register font binary data directly, with no automatic
network requests and no dependency on fonts installed on the test machine.
