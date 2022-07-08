const calculateID = require("./calculateID")
describe("Generate map from requests", () => {
    beforeAll(async () => {
        let path = process.cwd();
        let os = await page.evaluate(() => navigator.userAgent);
        let id = calculateID(path, os);
        await page.goto('chrome-extension://' + id +'/popup.html');
        for(let i = 0; i < 2; i++){
            await page.keyboard.press("Tab");
            await page.waitForTimeout(500);
        }
        await page.keyboard.press("Space");
        await page.waitForTimeout(500);
        await page.reload();
        await page.waitForTimeout(1000);
        await page.goto("https://geogratis.gc.ca/mapml/en/cbmtile/cbmt/?alt=xml");
    });

    afterAll(async () => {
        await context.close();
    });

    const path = "xpath=//html/body/mapml-viewer";
    test("Layer is updated and zoomed to", async () => {
        await page.waitForTimeout(2000);
        const zoom = await page.$eval(path, (map) => map.zoom);
        const layerSrc = await page.$eval(path + "/layer-", (layer) => layer.src);
        const checked = await page.$eval(path + "/layer-", (layer) => layer.checked);
        const disabled = await page.$eval(path + "/layer-", (layer) => layer.disabled);
        const title = await page.$eval("xpath=//html/head/title", (title) => title.innerText);

        await expect(zoom).toEqual("3");
        await expect(layerSrc).toEqual("https://geogratis.gc.ca/mapml/en/cbmtile/cbmt/?alt=xml");
        await expect(checked).toEqual(true);
        await expect(disabled).toEqual(false);
        await expect(title).toEqual("Canada Base Map - Transportation (CBMT)");
    });

    test("Navigating history retains same map layer", async () => {
        await page.goto("about:blank");
        await page.waitForTimeout(1000);
        await page.goBack();
        await page.waitForTimeout(1000);
        const layerSrc = await page.$eval(path + "/layer-", (layer) => layer.src);
        await expect(layerSrc).toEqual("https://geogratis.gc.ca/mapml/en/cbmtile/cbmt/?alt=xml");
    });

    test("Handle multiple tabs", async () => {
        let newPage = await context.newPage();
        await newPage.waitForTimeout(1000);
        await newPage.goto("https://geogratis.gc.ca/mapml/en/osmtile/osm/?alt=xml");
        await newPage.waitForTimeout(1000);
        const layerSrc = await newPage.$eval(path + "/layer-", (layer) => layer.src);
        await expect(layerSrc).toEqual("https://geogratis.gc.ca/mapml/en/osmtile/osm/?alt=xml");
        await newPage.close();
    });

    test("Reloading page retains same map layer", async () => {
        await page.reload();
        await page.waitForTimeout(1000);
        const layerSrc = await page.$eval(path + "/layer-", (layer) => layer.src);
        await expect(layerSrc).toEqual("https://geogratis.gc.ca/mapml/en/cbmtile/cbmt/?alt=xml");
    });
});