const puppeteer = require("puppeteer-core");
const findChrome = require("chrome-finder");
const fs = require("fs");
const path = require("path");

// Encuentra la ruta del ejecutable de Google Chrome en el sistema
const chromePath = findChrome();

// Array con los nombres y direcciones de las páginas a capturar
const pages = [
    { name: "as", url: "https://as.com/"},
    { name: "elpais", url: "https://elpais.com/"},
    { name: "lavanguardia", url: "https://www.lavanguardia.com/" },
    { name: "mundodeportivo", url: "https://www.mundodeportivo.com/"},
    { name: "marca", url: "https://marca.com/"},
    { name: "sport", url: "https://www.sport.es/es/" },
    { name: "elperiodico", url: "https://www.elperiodico.com/es/" },
    { name: "elmundo", url: "https://www.elmundo.es/" },
    { name: "abc", url: "https://www.abc.es/" },
    { name: "ara", url: "https://www.ara.cat/" },
    { name: "elpuntavui", url: "https://www.elpuntavui.cat/barcelona.html" },
    { name: "larazon", url: "https://www.larazon.es/" }
];

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: chromePath
    });
    // Obtener la ruta del directorio actual del script
    const currentDir = process.cwd();
    const currentDate = new Date();
    const datetime = currentDate.toLocaleString().replace(/[/:]/g, "-");

    // Crear la carpeta para las capturas de pantalla
    const screenshotsFolder = path.join(currentDir, "screenshots", datetime);
    fs.mkdirSync(screenshotsFolder, { recursive: true });
    // Iterar sobre cada página en el array
    for (const page of pages) {
        try {
            const pageObj = await browser.newPage();

            // Establecer el tamaño de la ventana para capturar toda la página
            await pageObj.setViewport({ width: 1920, height: 4000 });

            // Ir a la página y esperar a que se cargue el contenido principal
            await pageObj.goto(page.url);

            // Esperar 15 segundos antes de tomar la captura de pantalla
            await pageObj.waitForTimeout(5000);
            // Buscar y hacer clic en el botón de consentimiento si está presente
            if (page.name === "elpuntavui") {
                const consentButton = await pageObj.$('[data-testid="TcfAccept"]');
                if (consentButton) {
                    await consentButton.click();
                }
            } else if (page.name === "larazon") {
                const consentButton = await pageObj.$('#acceptAllMain');
                if (consentButton) {
                    await consentButton.click();
                }
            } else {
                const consentButton = await pageObj.$("#didomi-notice-agree-button");
                if (consentButton) {
                    await consentButton.click();
                }
            }
            await pageObj.waitForTimeout(15000);

            // Tomar la captura de pantalla y guardarla en un archivo con el nombre de la página
            const screenshot = await pageObj.screenshot({
                clip: { x: 0, y: 0, width: 1920, height: 4000 },
            });
            fs.writeFileSync(`${screenshotsFolder}/${page.name}.png`, screenshot);
            // Cerrar la página actual antes de pasar a la siguiente
                    await pageObj.close();
                } catch (err) {
                    // Registrar el error en el archivo de log
                    const errorLogPath = path.join(screenshotsFolder, "error.log");
                    fs.appendFileSync(errorLogPath, `${page.name}: ${err}\n`);
                    console.log(`Error al capturar ${page.name}: ${err}`);
                }
            }
            
            // Cerrar el navegador al final del proceso
            await browser.close();
            process.exit();
            })();
