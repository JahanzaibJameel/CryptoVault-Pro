# Lighthouse Report Instructions

## Steps to Generate Lighthouse Screenshot

1. Open Chrome browser
2. Navigate to: `http://localhost:4201`
3. Wait for the page to fully load (all coins loaded, no loading spinners)
4. Open Chrome DevTools (F12 or Ctrl+Shift+I)
5. Go to the **Lighthouse** tab
6. Configure settings:
   - Categories: Performance, Accessibility, Best Practices, SEO, PWA
   - Device: Desktop (or Mobile for mobile testing)
   - Throttling: No throttling
7. Click **Generate report**
8. Wait for analysis to complete
9. When report appears, take a screenshot of the entire report
10. Save the screenshot as: `docs/lighthouse.png`

## Expected Results

Based on our optimizations, you should see:
- **Performance**: 95+ (targeting 97+)
- **Accessibility**: 100
- **Best Practices**: 90+
- **SEO**: 90+
- **PWA**: 80+

## Alternative: Command Line Lighthouse

If you have Lighthouse CLI installed:

```bash
npx lighthouse http://localhost:4201 \
  --output=html \
  --output=json \
  --output-path=./lighthouse-report \
  --chrome-flags="--headless" \
  --quiet
```

Then take a screenshot of the HTML report.
