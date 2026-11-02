const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log("1. Launching browser...");
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    console.log("2. Browser launched!");
    
    const page = await browser.newPage();
    await page.setContent("<h1 style='color:red'>Hello PDF Test</h1>");
    console.log("3. Page content set!");
    
    const pdf = await page.pdf({ format: "A4" });
    console.log("4. PDF generated! Size:", pdf.length, "bytes");
    
    await browser.close();
    console.log("5. Browser closed!");
    console.log("✅ SUCCESS! Puppeteer works fine.");
  } catch (err) {
    console.error("❌ ERROR:", err.message);
    console.error("Full stack:", err.stack);
  }
})();