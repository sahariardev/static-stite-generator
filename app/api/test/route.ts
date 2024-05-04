import {NextRequest, NextResponse} from "next/server";
import puppeteer from "puppeteer";
import JSZip from "jszip";

export async function GET(request: NextRequest) {
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
    });

    const page = await browser.newPage();

    await page.goto("http://localhost:3000/preview", {
        waitUntil: "domcontentloaded",
    });

    await page.evaluate(() => {
        return new Promise(resolve => {
            setTimeout(resolve, 1000); // 5000 milliseconds = 5 seconds
        });
    });

    const links: string[] = [];

    let test = await page.$$('link')

    for (const el of test) {
        if (el) {
            const content = await page.evaluate(element => element.href, el);
            links.push(content.toString());
        }
    }

    await page.evaluate(() => {
        const element = document.querySelectorAll('link');
        // @ts-ignore
        element.forEach(el => el.href = `resource/${el.href.split('/').at(-1)}`);
    });

    const pageContent = await page.content();


    const zip = new JSZip();

    zip.file("index.html", page.content());

    console.log("link are", links)

    for (const link of links) {
        const response = await fetch(link);

        const linkFolder = zip.folder("resource");
        // @ts-ignore
        let fileName = link.split('/').at(-1).split('?')[0];

        linkFolder?.file(fileName, await response.text());
    }

    const zipFile = await zip.generateAsync({type: "blob"});

    const response = new NextResponse(zipFile, {
        headers: {
            "content-disposition": `attachment; filename="example.zip"`,
            'Content-type': 'application/zip'
        },
    });

    return response;
}